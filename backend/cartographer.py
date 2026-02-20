# FILEPATH: backend/cartographer.py
# @file: The Cartographer V11.2 (Full Path Edition)
# @author: The Engineer
# @description: A Level 100 Introspection Engine.
# 1. Scans the current directory (e.g., backend/).
# 2. Associates FULL relative paths (backend/app/...) to every file header.
# 3. Prettifies comments into a Narrative.
# @security-level: LEVEL 9 (Read-Only)
# @invariant: Must never modify the source code it scans.

import os
import sys
import ast
import logging
import re
from datetime import datetime
from typing import List, Dict, Any, Optional

# ⚡ BOOTSTRAP PATH
current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.append(current_dir)

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("flodock.cartographer")

# --- DATA STRUCTURES ---

class SemanticNode:
    """
    @description: Represents a code unit (Class, Function) and its metadata.
    """
    def __init__(self, name: str, type: str, lineno: int):
        self.name = name
        self.type = type # FUNCTION, CLASS, METHOD
        self.lineno = lineno
        self.tags: Dict[str, str] = {} # @invariant, @description
        self.children: List['SemanticNode'] = []
        self.narrative: List[str] = [] 

class FileAnalysis:
    """
    @description: Holds the scan results for a single file.
    """
    def __init__(self, path: str, name: str):
        self.path = path # Relative path (e.g., app/core/system.py)
        self.name = name # Filename (e.g., system.py)
        self.file_tags: Dict[str, str] = {}
        self.nodes: List[SemanticNode] = []

# --- HYBRID VISITOR (AST + SOURCE) ---

class SemanticVisitor(ast.NodeVisitor):
    def __init__(self, source_lines: List[str]):
        self.nodes = []
        self.file_docstring = ""
        self.source_lines = source_lines 
        self.NOISE_MARKERS = ['type: ignore', 'noqa', 'pylint:', 'fmt:', 'pragma: no cover']

    def _parse_tags(self, docstring: str) -> Dict[str, str]:
        """Extracts @tag: value from docstrings."""
        if not docstring: return {}
        tags = {}
        matches = re.findall(r'@([a-zA-Z0-9_-]+)(?::)?\s+(.+)', docstring)
        for tag, value in matches:
            tags[tag.lower()] = value.strip()
        
        if 'description' not in tags and docstring:
            lines = [l.strip() for l in docstring.split('\n') if not l.strip().startswith('@')]
            if lines: tags['description'] = lines[0]
        return tags

    def _extract_narrative(self, node) -> List[str]:
        """Scans function body for comments and cleans them."""
        narrative = []
        if not hasattr(node, 'lineno') or not hasattr(node, 'end_lineno'):
            return narrative

        start = node.lineno - 1
        end = node.end_lineno
        block_lines = self.source_lines[start:end]
        
        for line in block_lines:
            line = line.strip()
            comment = ""
            
            if line.startswith('#'):
                comment = line[1:].strip()
            elif '  #' in line: 
                comment = line.split('  #', 1)[1].strip()
            else:
                continue

            if not comment: continue
            if any(nm in comment for nm in self.NOISE_MARKERS): continue
            if comment.startswith('FILEPATH:') or comment.startswith('@file:'): continue

            narrative.append(comment)
            
        return narrative

    def visit_Module(self, node):
        self.file_docstring = ast.get_docstring(node)
        self.generic_visit(node)

    def visit_ClassDef(self, node):
        semantic_node = SemanticNode(node.name, "CLASS", node.lineno)
        semantic_node.tags = self._parse_tags(ast.get_docstring(node))
        
        for item in node.body:
            if isinstance(item, (ast.FunctionDef, ast.AsyncFunctionDef)):
                method_node = SemanticNode(item.name, "METHOD", item.lineno)
                method_node.tags = self._parse_tags(ast.get_docstring(item))
                method_node.narrative = self._extract_narrative(item) 
                semantic_node.children.append(method_node)
        
        self.nodes.append(semantic_node)

    def visit_FunctionDef(self, node):
        self._visit_function(node)

    def visit_AsyncFunctionDef(self, node):
        self._visit_function(node)

    def _visit_function(self, node):
        semantic_node = SemanticNode(node.name, "FUNCTION", node.lineno)
        semantic_node.tags = self._parse_tags(ast.get_docstring(node))
        semantic_node.narrative = self._extract_narrative(node)
        self.nodes.append(semantic_node)

# --- ENGINE ---

class Cartographer:
    """
    @description: The Main Orchestrator.
    """
    def __init__(self, root_dir: str):
        self.root = root_dir
        self.root_name = os.path.basename(root_dir) # e.g., "backend"
        self.scan_root = root_dir 
        self.atlas_path = os.path.join(root_dir, "SYSTEM_ATLAS.md")
        self.analysis_results: Dict[str, FileAnalysis] = {}
        
        self.ignore_dirs = {
            'venv', '__pycache__', '.git', '.idea', '.vscode', 
            'dist', 'build', 'node_modules', 'versions'
        }

    def run(self):
        logger.info(f"🗺️  [Cartographer] Scanning Root: {self.root_name}/")
        self._scan_codebase()
        self._render_atlas()
        logger.info(f"✅ [Cartographer] Atlas Updated: {self.atlas_path}")

    def _scan_codebase(self):
        for root, dirs, files in os.walk(self.scan_root):
            dirs[:] = [d for d in dirs if d not in self.ignore_dirs]
            
            for file in sorted(files):
                if not file.endswith(".py") or file.startswith("__"): continue
                
                path = os.path.join(root, file)
                rel_path = os.path.relpath(path, self.root).replace("\\", "/")
                
                try:
                    with open(path, "r", encoding="utf-8") as f:
                        source = f.read()
                    
                    source_lines = source.splitlines()
                    tree = ast.parse(source)
                    
                    visitor = SemanticVisitor(source_lines)
                    visitor.visit(tree)
                    
                    analysis = FileAnalysis(rel_path, file)
                    analysis.file_tags = visitor._parse_tags(visitor.file_docstring)
                    analysis.nodes = visitor.nodes
                    
                    self.analysis_results[rel_path] = analysis
                    
                except Exception as e:
                    logger.warning(f"⚠️ Parse Error {rel_path}: {e}")

    def _prettify_comment(self, text: str) -> str:
        """Transforms raw comments into rich Markdown."""
        step_match = re.match(r'^#?\s?(\d+\.)\s+(.*)', text)
        if step_match:
            return f"**{step_match.group(1)}** {step_match.group(2)}"

        tag_match = re.match(r'^([⚡🛡️⚠️✅🧠]\s*[A-Z_]+:)(.*)', text)
        if tag_match:
            return f"**{tag_match.group(1)}** {tag_match.group(2).strip()}"

        key_match = re.match(r'^([A-Z]{2,10}:)(.*)', text)
        if key_match:
            return f"**{key_match.group(1)}** {key_match.group(2).strip()}"

        return text

    def _render_atlas(self):
        with open(self.atlas_path, "w", encoding="utf-8") as f:
            f.write(f"# 🗺️ SYSTEM ATLAS: `{self.root_name}/`\n")
            f.write(f"**Generated:** {datetime.now().strftime('%Y-%m-%d %H:%M')}\n\n")

            sorted_files = sorted(self.analysis_results.items())
            
            current_folder = ""
            for path, analysis in sorted_files:
                folder = os.path.dirname(path)
                
                # 1. Folder Header (Optional, good for grouping)
                if folder != current_folder:
                    f.write(f"---\n") # Strong separator between folders
                    current_folder = folder
                
                # ⚡ FIX: Construct the FULL DISPLAY PATH
                # "backend" + "app/core/system.py" = "backend/app/core/system.py"
                full_display_path = os.path.join(self.root_name, analysis.path).replace("\\", "/")
                
                # Logic for Role Icons
                role_icon = "📄"
                if "role" in analysis.file_tags:
                    role = analysis.file_tags["role"].lower()
                    if "logic" in role or "brain" in role: role_icon = "⚙️"
                    elif "api" in role: role_icon = "🔌"
                    elif "model" in role or "schema" in role: role_icon = "💾"
                
                # 2. File Header with FULL PATH
                f.write(f"### {role_icon} `{full_display_path}`\n")
                
                # Description
                if 'description' in analysis.file_tags:
                    f.write(f"> {analysis.file_tags['description']}\n\n")
                
                # Nodes
                if analysis.nodes:
                    f.write("**Components & Logic:**\n\n")
                    for node in analysis.nodes:
                        self._render_node(f, node, 0)
                
                f.write("\n")

    def _render_node(self, f, node: SemanticNode, indent: int):
        prefix = "  " * indent
        bullet = "-" if indent % 2 == 0 else "*" 
        
        icon = "🔹"
        if node.type == "CLASS": icon = "📦"
        elif node.type == "FUNCTION": icon = "ƒ"
        
        f.write(f"{prefix}{bullet} {icon} **`{node.name}`**\n")
        
        if 'description' in node.tags:
            f.write(f"{prefix}    > *{node.tags['description']}*\n")
            
        if node.narrative:
            for line in node.narrative:
                pretty = self._prettify_comment(line)
                f.write(f"{prefix}    * {pretty}\n")
            f.write("\n")
            
        for child in node.children:
            self._render_node(f, child, indent + 1)

if __name__ == "__main__":
    root_path = os.path.dirname(os.path.abspath(__file__))
    mapper = Cartographer(root_path)
    mapper.run()

