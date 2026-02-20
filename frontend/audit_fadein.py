# FILEPATH: frontend/audit_fadein.py
# @file: FadeIn Compliance Auditor (Python Edition)
# @role: 🛡️ Quality Assurance Tool
# @author: The Engineer
# @description: Scans all *View.tsx files to ensure they implement the mandatory <FadeIn> wrapper.

import os
import sys

# Configuration
SEARCH_DIR = os.path.join(os.path.dirname(__file__), 'src')
FILE_SUFFIX = 'View.tsx'
REQUIRED_TAG = '<FadeIn'

def scan_directory(directory):
    violations = []
    
    if not os.path.exists(directory):
        print(f"❌ Directory not found: {directory}")
        return []

    for root, dirs, files in os.walk(directory):
        for file in files:
            if file.endswith(FILE_SUFFIX):
                full_path = os.path.join(root, file)
                
                try:
                    with open(full_path, 'r', encoding='utf-8') as f:
                        content = f.read()
                        
                        # 🔍 FORENSIC CHECK
                        if REQUIRED_TAG not in content:
                            # Get relative path for cleaner output
                            relative_path = os.path.relpath(full_path, os.getcwd())
                            violations.append(relative_path)
                except Exception as e:
                    print(f"⚠️  Could not read file {full_path}: {e}")

    return violations

def main():
    print('\n🔍 INITIALIZING VISUAL FLUIDITY AUDIT (PYTHON ENGINE)...')
    print('========================================')
    print(f"📂 Scanning: {SEARCH_DIR}")
    print(f"🎯 Target:   *{FILE_SUFFIX}")
    print(f"👮 Requirement: Must wrap content in {REQUIRED_TAG}")
    print('----------------------------------------')

    missing_files = scan_directory(SEARCH_DIR)

    if not missing_files:
        print('✅ COMPLIANCE ACHIEVED. All Views are fluid.')
        sys.exit(0)
    else:
        print(f"⚠️  VIOLATIONS DETECTED: {len(missing_files)} files are rigid.")
        print('----------------------------------------')
        for f in missing_files:
            print(f"❌ {f}")
        print('----------------------------------------')
        print('💡 REMEDIATION: Import <FadeIn> and wrap the return JSX.')
        sys.exit(1)

if __name__ == "__main__":
    main()

