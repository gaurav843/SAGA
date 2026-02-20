# FILEPATH: backend/audit_hardcoding.py
# @file: Hard-Coding Forensic Auditor
# @author: The Engineer
# @description: Scans the codebase for "Magic Values" (Strings, Numbers, IPs) embedded in logic.
# @security-level: LEVEL 9 (Read-Only Analysis)

import os
import ast
import re
import logging
from typing import List, Dict, Any

# Setup Logging
logging.basicConfig(level=logging.INFO, format="%(message)s")
logger = logging.getLogger("flodock.audit")

# --- CONFIGURATION ---
SCAN_ROOT = os.path.dirname(os.path.abspath(__file__))
IGNORE_DIRS = {'venv', '__pycache__', '.git', 'alembic', 'tests', 'docs'}
IGNORE_FILES = {'audit_hardcoding.py', 'cartographer.py', 'seed.py', 'nuke.py'}

# Heuristics for "Suspicious" Values
SUSPICIOUS_KEYS = [
    r'secret', r'password', r'key', r'token', r'auth', r'cred', 
    r'stripe', r'aws', r'database', r'host'
]
SUSPICIOUS_VALUES = [
    r'http[s]?://',           # Hardcoded URLs
    r'\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}', # IP Addresses
    r'[a-zA-Z0-9]{20,}',      # High entropy strings (potential API keys)
    r'postgres://',           # DB Connection Strings
    r'C:\\', r'/'             # Absolute file paths (simple check)
]

class HardCodingVisitor(ast.NodeVisitor):
    def __init__(self, filename):
        self.filename = filename
        self.issues = []

    def visit_Assign(self, node):
        """Checks variable assignments (e.g., x = '12345')."""
        # If assigning to UPPER_CASE, it's a Constant (Acceptable).
        is_constant = False
        for target in node.targets:
            if isinstance(target, ast.Name) and target.id.isupper():
                is_constant = True
        
        if not is_constant:
            if isinstance(node.value, ast.Constant):
                self._check_value(node.value.value, node.lineno, "Variable Assignment")
        
        self.generic_visit(node)

    def visit_Call(self, node):
        """Checks function arguments (e.g., connect('192.168.1.1'))."""
        # Skip logging calls (usually safe text)
        if isinstance(node.func, ast.Attribute) and node.func.attr in ['info', 'debug', 'error', 'warning', 'critical']:
            return

        for arg in node.args:
            if isinstance(arg, ast.Constant):
                self._check_value(arg.value, node.lineno, "Function Argument")
        
        for keyword in node.keywords:
            if isinstance(keyword.value, ast.Constant):
                self._check_value(keyword.value.value, node.lineno, f"Kwarg '{keyword.arg}'")

        self.generic_visit(node)

    def _check_value(self, value, lineno, context):
        if isinstance(value, str):
            # 1. Check for specific dangerous patterns
            for pattern in SUSPICIOUS_VALUES:
                if re.search(pattern, value):
                    # Filter out simple path routes like "/api/v1" or relative paths
                    if pattern == r'/' and (len(value) < 2 or value.startswith("/api") or value.startswith("./")):
                        continue
                    
                    self.issues.append({
                        "file": self.filename,
                        "line": lineno,
                        "type": "⚠️ Hardcoded String",
                        "value": value[:50] + "..." if len(value) > 50 else value,
                        "context": f"{context} (Matched: {pattern})"
                    })
                    return

            # 2. Check for "Magic Strings" in logic (longer than 10 chars, no spaces)
            # if len(value) > 15 and " " not in value and not value.startswith("antd:"):
            #     self.issues.append({
            #         "file": self.filename,
            #         "line": lineno,
            #         "type": "ℹ️ Magic String",
            #         "value": value,
            #         "context": context
            #     })

        elif isinstance(value, (int, float)):
            # 3. Check for "Magic Numbers"
            if value not in [0, 1, -1, 100, 200, 201, 404, 500]: # Whitelist common status codes/flags
                self.issues.append({
                    "file": self.filename,
                    "line": lineno,
                    "type": "🔢 Magic Number",
                    "value": str(value),
                    "context": context
                })

def scan_file(filepath):
    try:
        with open(filepath, "r", encoding="utf-8") as f:
            source = f.read()
        
        tree = ast.parse(source)
        visitor = HardCodingVisitor(os.path.basename(filepath))
        visitor.visit(tree)
        return visitor.issues
    except Exception as e:
        logger.error(f"❌ Failed to parse {filepath}: {e}")
        return []

def main():
    print(f"🕵️  [AUDITOR] Scanning Backend Root: {SCAN_ROOT}")
    print("=" * 80)
    
    all_issues = []
    
    for root, dirs, files in os.walk(SCAN_ROOT):
        # Filter Ignored Directories
        dirs[:] = [d for d in dirs if d not in IGNORE_DIRS]
        
        for file in files:
            if file.endswith(".py") and file not in IGNORE_FILES:
                full_path = os.path.join(root, file)
                rel_path = os.path.relpath(full_path, SCAN_ROOT)
                
                issues = scan_file(full_path)
                
                if issues:
                    print(f"\n📂 {rel_path}")
                    for issue in issues:
                        print(f"   L{issue['line']:<4} | {issue['type']:<20} | {issue['value']:<30} | {issue['context']}")
                    all_issues.extend(issues)

    print("\n" + "=" * 80)
    print(f"🏁 Audit Complete. Found {len(all_issues)} potential hard-coding smells.")

if __name__ == "__main__":
    main()

