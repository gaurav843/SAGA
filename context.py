# FILEPATH: context.py
# @file: Bi-Directional Context Mapper (Refactored for Import)
# @author: The Engineer (AI)
# @description: Scans Python/TS codebases to map dependencies.

import os
import re
import ast
import json
import sys
from pathlib import Path
from collections import defaultdict
from typing import Set, Dict, List, Optional, Tuple

# ... [KEEP ALL CONSTANTS & REGEX FROM PREVIOUS VERSION] ...
IGNORE_DIRS = {
    'node_modules', 'venv', '__pycache__', '.git', 'dist', 'build', 
    'coverage', '.idea', '.vscode', 'migrations'
}

IGNORE_EXTS = {
    '.pyc', '.pyo', '.pyd', '.so', '.dll', '.exe', '.bin', '.png', '.jpg', 
    '.jpeg', '.gif', '.svg', '.ico', '.css', '.scss', '.less', '.json', 
    '.lock', '.map', '.txt', '.md', '.xml'
}

RE_JS_IMPORT = re.compile(r'import\s+.*?\s+from\s+[\'"](.+?)[\'"]', re.DOTALL)
RE_JS_AXIOS = re.compile(r'(?:axios|http|fetch)\.(get|post|put|patch|delete|request)\s*\(\s*[\'"`](.*?)[\'"`]', re.IGNORECASE)
RE_JS_URL_STRING = re.compile(r'[\'"`](/api/v1/[a-zA-Z0-9_/{}]+)[\'"`]')

# ... [KEEP HELPER FUNCTIONS: normalize_route, resolve_import_path, _check_ext] ...

def normalize_route(route: str) -> str:
    if '?' in route: route = route.split('?')[0]
    route = re.sub(r'\{[^}]+\}', '*', route)
    route = re.sub(r'\$\{[^}]+\}', '*', route)
    route = re.sub(r':[a-zA-Z0-9_]+', '*', route)
    if not route.startswith("/"): route = "/" + route
    return route.lower().strip()

def resolve_import_path(base_file: Path, import_str: str, project_root: Path) -> Optional[str]:
    if import_str.startswith('@/'):
        potential = project_root / 'frontend/src' / import_str[2:]
        return _check_ext(potential)
    if import_str.startswith('.'):
        potential = (base_file.parent / import_str).resolve()
        return _check_ext(potential)
    if 'app.' in import_str:
        parts = import_str.split('.')
        potential = project_root / 'backend' / '/'.join(parts)
        return _check_ext(potential)
    return None

def _check_ext(path_obj: Path) -> Optional[str]:
    if path_obj.is_file(): return str(path_obj)
    for ext in ['.ts', '.tsx', '.js', '.jsx', '.py']:
        p = path_obj.with_suffix(ext)
        if p.exists(): return str(p)
    for ext in ['.ts', '.tsx', '.js', '.jsx', '.py']:
        p = path_obj / f"index{ext}"
        if p.exists(): return str(p)
        p = path_obj / f"__init__{ext}"
        if p.exists(): return str(p)
    return None

class ContextMapper:
    def __init__(self, root_dir: str):
        self.root = Path(root_dir).resolve()
        self.file_map: Dict[str, Dict] = {} 
        self.route_map: Dict[str, Set[str]] = defaultdict(set)
        self.outgoing_edges: Dict[str, Set[str]] = defaultdict(set)
        self.incoming_edges: Dict[str, Set[str]] = defaultdict(set)

    def build_graph(self):
        print(f"🔍 Scanning project at: {self.root}")
        for root, dirs, files in os.walk(self.root):
            dirs[:] = [d for d in dirs if d not in IGNORE_DIRS]
            for file in files:
                ext = os.path.splitext(file)[1]
                if ext in IGNORE_EXTS: continue
                full_path = Path(root) / file
                rel_path = str(full_path.relative_to(self.root)).replace('\\', '/')
                self._analyze_file(full_path, rel_path)
        print(f"✅ Indexed {len(self.file_map)} files.")

    def _analyze_file(self, full_path: Path, rel_path: str):
        try: content = full_path.read_text(encoding='utf-8', errors='ignore')
        except Exception: return

        self.file_map[rel_path] = {'type': 'unknown', 'routes': []}
        if rel_path.endswith('.py'): self._analyze_python(content, rel_path, full_path)
        elif rel_path.endswith(('.ts', '.tsx', '.js', '.jsx')): self._analyze_js(content, rel_path, full_path)

    def _analyze_python(self, content: str, rel_path: str, full_path: Path):
        self.file_map[rel_path]['type'] = 'backend'
        try: tree = ast.parse(content)
        except SyntaxError: return
        for node in ast.walk(tree):
            if isinstance(node, (ast.Import, ast.ImportFrom)):
                module = getattr(node, 'module', None)
                if module:
                    target = resolve_import_path(full_path, module, self.root)
                    if target:
                         target_rel = str(Path(target).relative_to(self.root)).replace('\\', '/')
                         self.outgoing_edges[rel_path].add(target_rel)
                         self.incoming_edges[target_rel].add(rel_path)
            if isinstance(node, ast.FunctionDef):
                for dec in node.decorator_list:
                    if isinstance(dec, ast.Call) and hasattr(dec.func, 'attr'):
                        if dec.func.attr in ['get', 'post', 'put', 'delete', 'patch']:
                            if dec.args and isinstance(dec.args[0], ast.Constant):
                                norm_route = normalize_route(dec.args[0].value)
                                self.route_map[norm_route].add(rel_path)
                                self.file_map[rel_path]['routes'].append(norm_route)

    def _analyze_js(self, content: str, rel_path: str, full_path: Path):
        self.file_map[rel_path]['type'] = 'frontend'
        imports = RE_JS_IMPORT.findall(content)
        for imp in imports:
            target = resolve_import_path(full_path, imp, self.root)
            if target:
                target_rel = str(Path(target).relative_to(self.root)).replace('\\', '/')
                self.outgoing_edges[rel_path].add(target_rel)
                self.incoming_edges[target_rel].add(rel_path)
        api_calls = RE_JS_AXIOS.findall(content)
        for method, url in api_calls:
            norm = normalize_route(url)
            self.route_map[norm].add(rel_path)
            self.file_map[rel_path]['routes'].append(norm)
        urls = RE_JS_URL_STRING.findall(content)
        for url in urls:
            norm = normalize_route(url)
            self.route_map[norm].add(rel_path)
            self.file_map[rel_path]['routes'].append(norm)

    def get_context(self, target_file: str) -> Dict:
        target = target_file.replace('\\', '/')
        if target not in self.file_map:
            matches = [f for f in self.file_map.keys() if target in f]
            if len(matches) == 1: target = matches[0]
            else: return {"error": "File not found", "matches": matches}

        direct_imports = sorted(list(self.outgoing_edges[target]))
        used_by = sorted(list(self.incoming_edges[target]))
        
        indirect = set()
        for dep in direct_imports: indirect.update(self.outgoing_edges[dep])
        indirect -= set(direct_imports)
        indirect.discard(target)

        cross_stack = set()
        for r in self.file_map[target]['routes']:
            cross_stack.update(self.route_map[r])
        
        # Fuzzy route matching fallback
        if self.file_map[target]['type'] == 'backend':
            for f, meta in self.file_map.items():
                if meta['type'] == 'frontend':
                    for r in self.file_map[target]['routes']:
                        if r in str(meta['routes']): cross_stack.add(f)
        elif self.file_map[target]['type'] == 'frontend':
             for f, meta in self.file_map.items():
                if meta['type'] == 'backend':
                     for r in self.file_map[target]['routes']:
                         if r in str(meta['routes']): cross_stack.add(f)
        
        cross_stack.discard(target)

        return {
            "target": target,
            "direct": direct_imports,
            "used_by": used_by,
            "indirect": sorted(list(indirect)),
            "cross_stack": sorted(list(cross_stack))
        }

if __name__ == "__main__":
    # Allow standalone usage as before
    mapper = ContextMapper(".")
    mapper.build_graph()
    target = input("File path: ").strip()
    if target:
        res = mapper.get_context(target)
        print(json.dumps(res, indent=2))



