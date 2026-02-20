"""
FILEPATH: audit_codebase_v3.py
@file Codebase Auditor v3.0 (Relaxed)
@author The Engineer
@description Scans frontend code for Architecture Violations with reduced false positives.
"""

import os
import re
import sys

# 1. CONFIGURATION
TARGET_DIR = "frontend/src"  # Where to search
EXCLUDE_FILES = {"config.ts"} # Files allowed to contain these patterns
EXCLUDE_DIRS = {
    "frontend/src/api/services",  # Generated files (safe)
    "frontend/src/api/models",    # Generated files (safe)
    "frontend/src/api/core"       # Core infrastructure (safe)
}
EXTENSIONS = {".ts", ".tsx", ".js", ".jsx"}

# 2. DEFINING THE VIOLATIONS (Regex Patterns)
PATTERNS = [
    {
        "id": "ENV_LEAK",
        "desc": "Direct usage of VITE_API_URL (Should use @kernel/config)",
        "regex": re.compile(r"import\.meta\.env\.VITE_API_URL")
    },
    {
        "id": "HARDCODED_LOCALHOST",
        "desc": "Hardcoded Backend URL (localhost:8000)",
        "regex": re.compile(r"['\"]http://localhost:8000")
    },
    {
        "id": "HARDCODED_IP",
        "desc": "Hardcoded Backend IP (127.0.0.1:8000)",
        "regex": re.compile(r"['\"]http://127\.0\.0\.1:8000")
    },
    {
        "id": "SUSPICIOUS_AXIOS",
        "desc": "Hardcoded Axios API Path (Missing Base URL)",
        # Only matches axios calls with hardcoded /api paths, ignores property definitions like url: '...'
        "regex": re.compile(r"axios\.(get|post|put|delete|patch)\s*\(\s*['\"]/api/v1/") 
    }
]

def scan_file(file_path):
    violations = []
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            lines = f.readlines()
            for i, line in enumerate(lines):
                # Skip comments (simple check)
                if line.strip().startswith("//") or line.strip().startswith("/*"):
                    continue
                
                for pattern in PATTERNS:
                    if pattern["regex"].search(line):
                        # Context Check: Is this the config file?
                        if os.path.basename(file_path) in EXCLUDE_FILES:
                            continue
                            
                        violations.append({
                            "line": i + 1,
                            "id": pattern["id"],
                            "desc": pattern["desc"],
                            "content": line.strip()[:100] # Truncate long lines
                        })
    except Exception as e:
        print(f"⚠️ Could not read {file_path}: {e}")
        
    return violations

def main():
    print(f"🔍 Starting Audit on: {TARGET_DIR}")
    print(f"🚫 Exclusion List: {EXCLUDE_FILES}")
    print(f"🙈 Ignoring Dirs: {EXCLUDE_DIRS}\n")
    
    violating_files = set()
    
    # Walk the directory
    for root, _, files in os.walk(TARGET_DIR):
        # Skip excluded directories
        # Normalize path separators for comparison
        normalized_root = root.replace("\\", "/")
        if any(normalized_root.startswith(ex_dir) for ex_dir in EXCLUDE_DIRS):
            continue

        for file in files:
            if any(file.endswith(ext) for ext in EXTENSIONS):
                full_path = os.path.join(root, file).replace("\\", "/")
                results = scan_file(full_path)
                
                if results:
                    violating_files.add(full_path)
                    print(f"📂 {full_path}")
                    for v in results:
                        print(f"   ❌ [L{v['line']}] {v['id']}: {v['desc']}")
                        print(f"      Code: {v['content']}")
                    print("")

    if not violating_files:
        print("✅ CLEAN. No configuration violations found.")
    else:
        print("\n" + "="*60)
        print(f"🚨 FOUND {len(violating_files)} VIOLATING FILES")
        print("="*60)
        
        # Print list for easy reading
        for f in sorted(violating_files):
            print(f)
            
        print("\n" + "-"*60)
        print(">> SMART COPY FORMAT (Single Line for Prompt):")
        print("-" * 60)
        print(" ".join(sorted(violating_files)))
        print("-" * 60)
        
        sys.exit(1)

if __name__ == "__main__":
    main()