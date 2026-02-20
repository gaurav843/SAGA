# FILEPATH: overwrite.py
# @file: overwrite.py
# @author: ansav8@gmail.com
# @date: 2026-01-30
# @description: Level 7 Utility: Context-Aware File Overwriter.
#               - "Until-Code" Scanning (No 15-line limit).
#               - "Block Smash" logic (Converts /* */ to //).
#               - Safe Mode Configuration.
#               - Smart Copy & Backup.

import sys
import os
import re
import logging
import shutil
from typing import List, Optional

# --- Configuration (Safe Mode & Level 7 Logic) ---
# Special tokens defined as variables to prevent syntax highlighting confusion
HASH = '#'
SLASH = '//'
BATCH = 'REM'
HTML_COMMENT = '<!--'
CSS_COMMENT = '/*'
DASH = '--' 

LANGUAGE_SYNTAX = {
    # Hash Style (Python, Shell, YAML, Ruby, Docker)
    '.py': HASH, 
    '.sh': HASH, 
    '.yaml': HASH, 
    '.yml': HASH, 
    '.toml': HASH, 
    '.dockerfile': HASH, 
    '.rb': HASH,
    
    # Slash Style (C-Family, JS, Java, Go, PHP, Swift, Kotlin)
    '.js': SLASH, 
    '.ts': SLASH, 
    '.tsx': SLASH, 
    '.jsx': SLASH, 
    '.java': SLASH, 
    '.c': SLASH, 
    '.cpp': SLASH, 
    '.rs': SLASH, 
    '.go': SLASH, 
    '.php': SLASH,
    '.swift': SLASH,
    '.kt': SLASH,
    '.dart': SLASH,
    
    # Dash Style
    '.sql': DASH,
    '.lua': DASH,
    
    # Batch / Windows
    '.bat': BATCH, 
    '.cmd': BATCH,
    
    # Web / Block Style
    '.html': HTML_COMMENT, 
    '.xml': HTML_COMMENT, 
    '.css': CSS_COMMENT
}

# SAFETY REGEX: 
# These keywords act as an emergency brake. If the script sees these, 
# it stops scanning for headers immediately to protect your code.
CODE_STOPPERS = re.compile(
    r"^(import|export|package|namespace|using|include|#include|from|const|let|var|def|class|function|public|private|protected|@Entry|@Component|<\?php)",
    re.IGNORECASE
)

# MANDATORY TAGS according to Flodock Codex
REQUIRED_HEADER_TAGS = [
    "@file",
    "@author",
    "@description"
]

# Regex to find function definitions (Heuristic)
# Matches: def name, class Name, async function, export const, etc.
FUNC_PATTERN = re.compile(
    r"^\s*(def |class |async |export |public |private |protected |function |const |let |var ).*?[:=\{]",
    re.MULTILINE
)

# Regex to find metadata tags even if the comment syntax is broken
METADATA_REGEX = re.compile(
    r"[\s#/*<!REM-]*"                  # Loose prefix match (garbage)
    r"(FILEPATH|@file|@author|@date|@description)" # The Tag
    r"[:\s]+"                          # Separator
    r"(.*?)"                           # The Value
    r"[\s*/->]*$",                     # Loose suffix match
    re.IGNORECASE
)

# Regex to find function definitions (Stricter)
# Matches: 
# - def name(
# - class Name
# - async? function
# - export? (const|let|var) name = (async)? (
# Regex to detect Narrator calls
TELEMETRY_PATTERN = re.compile(
    r"logger\.(tell|scream|whisper|trace|warn|error|info)", 
    re.IGNORECASE
)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class ContentSanitizer:
    def __init__(self, content_lines: List[str]):
        self.lines = content_lines
        self.target_ext = ""
        self.comment_prefix = ""

    def set_target_extension(self, file_path: str):
        _, ext = os.path.splitext(file_path)
        self.target_ext = ext.lower()
        self.comment_prefix = LANGUAGE_SYNTAX.get(self.target_ext, HASH)

    def strip_markdown_fences(self):
        """Removes ``` language and ``` lines from start/end."""
        if not self.lines: return
        # Check first line
        if self.lines[0].strip().startswith("```"):
            self.lines.pop(0)
        # Check last line
        if self.lines and self.lines[-1].strip().startswith("```"):
            self.lines.pop(-1)

    def detect_header_boundary(self) -> int:
        """
        Scans lines to find where the header ends and code begins.
        Returns the index of the first line of actual code.
        """
        for i, line in enumerate(self.lines):
            clean = line.strip()
            
            # 1. Skip Shebangs (#!), Empty lines
            if not clean: continue
            if clean.startswith("#!"): continue 
            
            # 2. Check for explicit code keywords
            if CODE_STOPPERS.match(clean):
                return i
            
            # 3. If it looks like a variable assignment or logic, stop
            # (Heuristic: contains = but doesn't start with comment char)
            is_comment = clean.startswith(self.comment_prefix) or clean.startswith("/*") or clean.startswith("*") or clean.startswith("<!--")
            
            # If it's NOT a comment, and it has code symbols, it's code.
            if not is_comment and ("=" in clean or "{" in clean or "(" in clean) and not METADATA_REGEX.match(clean):
                 return i
                 
        return min(len(self.lines), 20) # Fallback if no code found

    def normalize_header(self):
        """
        Transpiles header comments to match the target language.
        Uses 'Zone Defense' to fix broken block comments.
        """
        if not self.comment_prefix: return 

        boundary = self.detect_header_boundary()
        
        for i in range(boundary):
            line = self.lines[i].strip()
            if not line: continue
            if line.startswith("#!"): continue # Don't touch shebangs

            # 1. Check for Metadata Tags
            match = METADATA_REGEX.match(line)
            
            # 2. Clean the line content
            # Remove existing comment junk (/*, */, *, //, #, <!--)
            clean_content = line
            clean_content = re.sub(r"^[\/\*\#\s<!\-]+", "", clean_content) # Left strip symbols
            clean_content = re.sub(r"[\*\->\s]+$", "", clean_content)      # Right strip symbols
            
            # 3. Rebuild the line
            if match:
                # It's a tag line, ensure standard formatting
                tag, val = match.group(1), match.group(2)
                new_line = f"{self.comment_prefix} {tag}: {val}"
            else:
                # It's a description line or bullet point
                # Ensure we don't double space if clean_content is empty
                if not clean_content: 
                    new_line = ""
                else:
                    new_line = f"{self.comment_prefix} {clean_content}"

            # 4. Handle HTML/CSS specific closing tags
            if self.comment_prefix == HTML_COMMENT:
                new_line += " -->"
            elif self.comment_prefix == CSS_COMMENT:
                # CSS usually needs block comments, so we wrap it
                new_line = f"/* {clean_content} */"
            
            self.lines[i] = new_line + "\n"

    def get_sanitized_content(self) -> str:
        return "".join(self.lines)

def extract_file_path(lines: List[str]) -> Optional[str]:
    # Look deeper (up to 30 lines) for the path
    for line in lines[:30]: 
        match = METADATA_REGEX.search(line.strip())
        if match and match.group(1).upper() == "FILEPATH":
            return match.group(2).strip()
    return None
class CodeValidator:

    def check_telemetry_compliance(self):
        """
        Enforcement: Every significant function must log its activity via Narrator.
        """
        current_func = None
        func_start_line = -1
        has_logger = False
        
        # Heuristic: We track if we are "inside" a function scanning for a logger call
        # Since we don't have a full AST, we look at the next ~15 lines after a function def
        
        for i, line in enumerate(self.lines):
            stripped = line.strip()
            
            # 1. Detect Function Start
            if FUNC_PATTERN.match(stripped) and "interface " not in stripped and "type " not in stripped:
                # If we were tracking a previous function that had NO logger, report it now
                if current_func and not has_logger:
                    self.warnings.append(f"📡 Missing Telemetry (Narrator) in '{current_func}' (Line {func_start_line})")
                
                # Reset for new function
                # Extract function name for reporting
                current_func = stripped.split('(')[0].replace('{', '').strip()
                current_func = current_func[-30:] # Truncate if too long
                func_start_line = i + 1
                has_logger = False
                continue

            # 2. Detect Logger usage inside
            if current_func:
                if TELEMETRY_PATTERN.search(stripped):
                    has_logger = True
                    # Once found, we can stop worrying about this specific function context
                    current_func = None 
                
                # 3. Stop scanning if we hit a likely end of function or new block (Heuristic limit)
                # If we go 20 lines without finding a logger, we assume it's missing or a long function
                if i - func_start_line > 20:
                     if not has_logger:
                         self.warnings.append(f"📡 Missing Telemetry (Narrator) in '{current_func}' (First 20 lines checked)")
                     current_func = None

        # Final check for the last function in file
        if current_func and not has_logger:
             self.warnings.append(f"📡 Missing Telemetry (Narrator) in '{current_func}'")

    def __init__(self, lines: List[str], comment_prefix: str):
        self.lines = lines
        self.prefix = comment_prefix.strip()
        self.errors = []
        self.warnings = []

    def check_header_completeness(self):
        """Ensures all REQUIRED_HEADER_TAGS are present in the top 20 lines."""
        # Combine top lines for searching
        header_block = "\n".join(self.lines[:20])
        
        for tag in REQUIRED_HEADER_TAGS:
            # simple check: is "@file:" present?
            if tag not in header_block:
                self.errors.append(f"❌ Missing Mandatory Header Tag: {tag}")

    def check_semantic_docs(self):
        """
        Heuristic: If a line looks like a function, ensure previous lines 
        contain a docstring or comment block.
        """
        for i, line in enumerate(self.lines):
            stripped = line.strip()
            
            # Skip short lines or comments
            if not stripped or stripped.startswith(self.prefix) or stripped.startswith("/*"):
                continue

            # If this line defines code logic...
            if FUNC_PATTERN.match(stripped):
                # Look backwards for documentation
                found_doc = False
                scan_range = range(i - 1, max(-1, i - 10), -1)
                
                for j in scan_range:
                    prev = self.lines[j].strip()
                    if not prev: continue # Skip empty lines
                    
                    # Check for Docstrings (""" or ''') or Comment Blocks (prefix)
                    if '"""' in prev or "'''" in prev or "*/" in prev or prev.startswith(self.prefix):
                        found_doc = True
                        break
                    
                    # If we hit another code line or specific decorator, stop looking
                    if "{" in prev or prev.endswith(":") or prev.startswith("@"):
                        continue
                        
                    # If we hit a hard stop (end of previous block), stop
                    break

                if not found_doc:
                    # Soft Warning (Level 1) or Error (Level 2)? 
                    # For now, let's warn.
                    self.warnings.append(f"⚠️  Undocumented Method/Class at line {i+1}: '{stripped[:40]}...'")

    def run(self) -> bool:
        """Runs checks and prints report. Returns False if critical errors found."""
        self.check_header_completeness()
        self.check_semantic_docs()
        self.check_telemetry_compliance() # <--- ADD THIS LINE
        
        if not self.errors and not self.warnings:
            return True
            
        print("\n🔎 CODEX COMPLIANCE REPORT:")
        for err in self.errors:
            print(err)
        for warn in self.warnings:
            print(warn)
        
        print("-" * 40)
        return len(self.errors) == 0
    
def create_incremental_backup(target_file_path):
    if not os.path.exists(target_file_path): return None
    try:
        script_dir = os.path.dirname(os.path.abspath(__file__))
        current_folder = os.path.basename(script_dir)
        parent_dir = os.path.dirname(script_dir)
        
        backup_root = os.path.join(parent_dir, f"{current_folder}_backup")

        try:
            rel_path = os.path.relpath(target_file_path, script_dir)
        except ValueError:
            rel_path = os.path.splitdrive(target_file_path)[1].lstrip(os.path.sep)
        
        clean_rel_path = rel_path.replace("..", "__parent__")
        backup_dest_base = os.path.join(backup_root, clean_rel_path)
        
        os.makedirs(os.path.dirname(backup_dest_base), exist_ok=True)

        base, ext = os.path.splitext(backup_dest_base)
        version = 1
        while os.path.exists(f"{base}.v{version}{ext}"):
            version += 1
        
        backup_path = f"{base}.v{version}{ext}"
        shutil.copy2(target_file_path, backup_path)
        return backup_path

    except Exception as e:
        logger.error(f"Backup failed: {e}")
        return None

def main():
    print("📋 LEVEL 7 OVERWRITE TOOL (CONTEXT AWARE)")
    print("   Paste content below. (Ctrl+Z/D then Enter to finish)")
    print("-" * 80)
    
    try:
        lines = sys.stdin.readlines()
    except Exception as e:
        logger.error(f"Input Error: {e}")
        return

    if not lines:
        logger.warning("Empty input.")
        return

    # --- 1. Sanitize & Detect ---
    sanitizer = ContentSanitizer(lines)
    sanitizer.strip_markdown_fences()
    
    file_path = extract_file_path(sanitizer.lines)

    if not file_path:
        logger.warning("❌ No FILEPATH tag found in header.")
        try:
            file_path = input("   Enter target path manually: ").strip()
        except EOFError: pass
    
    if not file_path:
        print("Aborted.")
        return

    # --- 2. Context Awareness ---
    sanitizer.set_target_extension(file_path)
    sanitizer.normalize_header()

    final_content = sanitizer.get_sanitized_content()

    # --- 3. Security & Validation ---
    file_path = file_path.lstrip('/\\')
    file_path = file_path.replace('/', os.sep).replace('\\', os.sep)
    # --- 2.5 Validation Step (NEW) ---
    print("Validating against Flodock Codex...")
    validator = CodeValidator(sanitizer.lines, sanitizer.comment_prefix)
    is_valid = validator.run()

    if not is_valid:
        # Critical failure (Missing headers)
        print("⛔ CRITICAL: Code violates Mandatory Invariants.")
        # Optional: You could return here to force a fix, 
        # or just let the user see the red text before confirming.

        
    # --- 4. Comparison Logic ---
    file_exists = os.path.exists(file_path)
    old_line_count = -1
    
    if file_exists:
        try:
            # Read efficiently
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                old_line_count = sum(1 for _ in f)
        except Exception as e:
            logger.warning(f"Could not read existing file: {e}")

    new_line_count = len(sanitizer.lines)
    
    diff_str = "?"
    if old_line_count >= 0:
        diff = new_line_count - old_line_count
        diff_sign = "+" if diff > 0 else ""
        diff_str = f"{diff_sign}{diff}"

    # --- 5. Execution ---
    print("-" * 80)
    print(f"Target: {file_path}")
    print(f"Lines:  {old_line_count if old_line_count >= 0 else 'N/A'} -> {new_line_count} ({diff_str})")
    
    header_lines = sanitizer.detect_header_boundary()
    print(f"Header: Detected {header_lines} lines of metadata (Auto-Fixed).")
    
    if sanitizer.comment_prefix:
        print(f"Mode:   {sanitizer.target_ext} (Enforcing '{sanitizer.comment_prefix}')")
    print("-" * 80)

    try:
        confirm = input("Overwrite? [Y/n]: ").strip().lower()
    except EOFError: confirm = 'n'

    if confirm not in ('y', ''):
        print("Aborted.")
        return

    if file_exists:
        bkp = create_incremental_backup(file_path)
        if bkp: print(f"📦 Backup: {bkp}")

    try:
        os.makedirs(os.path.dirname(os.path.abspath(file_path)), exist_ok=True)
        with open(file_path, 'w', encoding='utf-8', newline='\n') as f:
            f.write(final_content)
        print(f"✅ Success: {file_path}")
    except Exception as e:
        print(f"🔥 Error: {e}")

if __name__ == "__main__":
    main()