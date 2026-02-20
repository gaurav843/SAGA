# FILEPATH: frontend/cartographer.py
# @file: The Prism V10 (Total Recall Edition)
# @role: ⚙️ System Tool
# @author: The Engineer
# @description: A static analysis engine that extracts the COMPLETE narrative from code comments.
# @features:
# ⚡ Deep Body Parsing: Extracts internal logic steps.
# ⚡ Full Comment Capture: Captures context, section headers, and explanations.
# ⚡ Noise Filtering: Ignores linter directives only.
# @security-level: LEVEL 10 (ReadOnly)

import os
import re
import logging
from datetime import datetime
from typing import List, Dict, Optional, Tuple

# 1. SETUP LOGGING
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("flodock.prism")

# 2. DATA STRUCTURES
class SemanticUnit:
    """Represents an exported entity (Function, Class, Component)."""
    def __init__(self, name: str, type_def: str, signature: str, body_start_index: int):
        self.name = name
        self.type_def = type_def  # const, function, interface
        self.signature = signature.strip()
        self.body_start_index = body_start_index
        self.tags: Dict[str, str] = {}
        self.description: str = ""
        self.narrative: List[str] = [] # The internal story (All // comments)

class CodeFile:
    """Represents a source file on disk."""
    def __init__(self, path: str, name: str):
        self.path = path
        self.name = name
        self.header_tags: Dict[str, str] = {}
        self.units: List[SemanticUnit] = []

# 3. THE ENGINE
class Prism:
    def __init__(self, root_dir: str):
        self.root = root_dir
        self.src_dir = os.path.join(root_dir, "src")
        self.atlas_path = os.path.join(root_dir, "FRONTEND_ATLAS.md")
        self.files: Dict[str, CodeFile] = {}

        # Regex Patterns
        self.re_header_block = re.compile(r'^\s*(?:/\*[\s\S]*?\*/|(?://.*(?:\n|$))+)', re.MULTILINE)
        
        # Captures: 1=DocBlock, 2=ExportType, 3=Name, 4=Signature
        self.re_export = re.compile(
            r'(?P<doc>(?:\s*/\*[\s\S]*?\*/\s*|(?:\s*//.*(?:\n|$))+)?)\s*' # Optional DocBlock
            r'export\s+(?:default\s+)?'                                  # export keyword
            r'(?P<type>const|function|class|interface|type|enum)\s+'     # Type keyword
            r'(?P<name>[a-zA-Z0-9_]+)'                                   # Identifier
            r'(?P<sig>[^{;=]*)',                                         # Signature (up to body start)
            re.MULTILINE
        )

        # Narrative Pattern: Matches ANY "//" comment
        self.re_narrative = re.compile(r'^\s*//\s*(.*)$')
        
        # Noise Filter: Ignore these machine tags
        self.NOISE_MARKERS = ['@ts-', 'eslint-', 'prettier-', 'noinspection']

    def run(self):
        logger.info(f"🌈 [The Prism V10] Initiating Deep Scan: {self.src_dir}")
        if not os.path.exists(self.src_dir):
            raise FileNotFoundError(f"Missing src directory: {self.src_dir}")

        self._walk_and_scan()
        self._write_atlas()
        logger.info(f"✅ [The Prism] Atlas Generated: {self.atlas_path}")

    def _walk_and_scan(self):
        # We determine the PARENT directory so the relative path includes the current root folder name.
        # e.g., if root is /user/project/frontend, parent is /user/project
        # Relative path becomes: frontend/src/file.ts
        parent_dir = os.path.dirname(self.root)

        for root, _, files in os.walk(self.src_dir):
            for file in files:
                if file.endswith(('.ts', '.tsx')) and not file.endswith('.d.ts'):
                    full_path = os.path.join(root, file)
                    
                    # CHANGED: Relpath is now calculated from the PARENT directory
                    rel_path = os.path.relpath(full_path, parent_dir).replace("\\", "/")
                    
                    self.files[rel_path] = self._analyze_file(full_path, rel_path, file)

    def _analyze_file(self, full_path: str, rel_path: str, filename: str) -> CodeFile:
        code_file = CodeFile(rel_path, filename)
        
        try:
            with open(full_path, 'r', encoding='utf-8') as f:
                content = f.read()
                lines = content.split('\n')

            # A. Parse Header
            header_match = self.re_header_block.match(content)
            if header_match:
                code_file.header_tags = self._parse_tags(header_match.group(0))

            # B. Parse Exports (Units)
            for match in self.re_export.finditer(content):
                doc_block = match.group('doc')
                unit_type = match.group('type')
                name = match.group('name')
                sig = match.group('sig')
                
                # Determine rough start line for body scanning
                start_char = match.end()
                start_line = content[:start_char].count('\n')

                unit = SemanticUnit(name, unit_type, sig, start_line)
                
                if doc_block:
                    unit.tags = self._parse_tags(doc_block)
                    unit.description = unit.tags.pop('description', '')

                # C. DEEP BODY SCAN (Total Recall)
                # Scan lines inside the function for ANY narrative comment
                self._extract_narrative(unit, lines, start_line)

                code_file.units.append(unit)

        except Exception as e:
            logger.warning(f"⚠️ Parse Error in {rel_path}: {e}")

        return code_file

    def _extract_narrative(self, unit: SemanticUnit, lines: List[str], start_line: int):
        """Scans the function body for ALL human comments."""
        # Heuristic: Scan until next 'export' or 200 lines deep (Expanded range)
        max_scan = 200 
        
        for i in range(start_line, min(start_line + max_scan, len(lines))):
            line = lines[i].strip()
            
            # Stop if we hit another export (Boundary detection)
            if line.startswith('export ') and i > start_line:
                break

            # Check for Narrative
            match = self.re_narrative.match(lines[i])
            if match:
                comment_content = match.group(1).strip()
                
                # Filter Noise
                if not comment_content: continue # Empty //
                if any(marker in comment_content for marker in self.NOISE_MARKERS): continue
                
                # Valid Narrative Found
                unit.narrative.append(comment_content)

    def _parse_tags(self, comment_block: str) -> Dict[str, str]:
        tags = {}
        lines = []
        for line in comment_block.split('\n'):
            clean = re.sub(r'^[\s\*/]+', '', line).strip()
            if clean: lines.append(clean)

        for line in lines:
            match = re.match(r'@([a-zA-Z0-9_-]+)(?::)?\s+(.+)', line)
            if match:
                key = match.group(1).lower()
                val = match.group(2).strip()
                tags[key] = val
            elif 'description' not in tags and not line.startswith('@'):
                tags['description'] = line
        
        return tags

    def _write_atlas(self):
        with open(self.atlas_path, 'w', encoding='utf-8') as f:
            f.write(f"# 🗺️ FLODOCK SYSTEM ATLAS (Prism V10)\n")
            f.write(f"**Generated:** {datetime.now().strftime('%Y-%m-%d %H:%M')}\n")
            f.write(f"**Mode:** Total Recall (Full Comment Extraction).\n\n")
            f.write("---\n")

            sorted_files = sorted(self.files.items())
            current_folder = ""

            for path, file in sorted_files:
                folder = os.path.dirname(path)
                if folder != current_folder:
                    f.write(f"## 📂 `{folder}/`\n\n")
                    current_folder = folder

                # Icon Logic
                role = file.header_tags.get('role', 'Code').lower()
                icon = "📄"
                if "screen" in role: icon = "🖥️"
                elif "hook" in role: icon = "🪝"
                elif "context" in role: icon = "🧠"
                elif "widget" in role: icon = "🧩"
                elif "tool" in role: icon = "🛠️"

                f.write(f"### {icon} `{file.name}`\n")
                
                desc = file.header_tags.get('description')
                if desc:
                    f.write(f"> {desc}\n\n")

                # Filter out 'author' and 'role' from tags table to reduce noise
                tags_to_show = {k:v for k,v in file.header_tags.items() 
                                if k not in ['description', 'file', 'author', 'role']}
                
                if tags_to_show:
                    f.write("| Attribute | Value |\n| :--- | :--- |\n")
                    for k, v in tags_to_show.items():
                        f.write(f"| **{k}** | `{v}` |\n")
                    f.write("\n")

                if file.units:
                    f.write("**Components & Logic:**\n\n")
                    for unit in file.units:
                        f.write(f"* **`{unit.name}`**")
                        f.write("\n")
                        
                        if unit.description:
                            f.write(f"  * 📝 *{unit.description}*\n")
                        
                        # THE FULL NARRATIVE
                        if unit.narrative:
                            f.write("  * **Logic Flow:**\n")
                            for line in unit.narrative:
                                # Clean up the '⚡' for consistency if desired, or leave as is
                                f.write(f"    * `{line}`\n")
                    f.write("\n")
                
                f.write("---\n")

if __name__ == "__main__":
    root_path = os.path.dirname(os.path.abspath(__file__))
    prism = Prism(root_path)
    prism.run()