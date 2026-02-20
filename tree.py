# FILEPATH: smart_tree.py
# @file: Smart Tree Generator
# @description: 1. Accepts multiple file/folder paths (Smart Input).
# 2. Generates a visual ASCII Tree structure.
# 3. Lists all discovered files.
# 4. Outputs to a timestamped file & Clipboard.

import os
import sys
import argparse
import logging
from datetime import datetime
from pathlib import Path

# Setup simple logging
logging.basicConfig(level=logging.INFO, format='%(message)s')
logger = logging.getLogger("SmartTree")

class TreeGenerator:
    def __init__(self):
        self.file_count = 0
        self.dir_count = 0
        self.output_lines = []
        self.flat_file_list = []

    def generate_tree(self, root_path, prefix=""):
        """Recursive function to build the tree visual."""
        path_obj = Path(root_path)
        
        # Guard: If specific file passed, just list it
        if path_obj.is_file():
            self.output_lines.append(f"{prefix}📄 {path_obj.name}")
            self.flat_file_list.append(str(path_obj.absolute()))
            self.file_count += 1
            return

        # It's a directory
        if not path_obj.exists():
            self.output_lines.append(f"{prefix}❌ [Not Found]: {path_obj}")
            return

        # Get entries and sort (Dirs first, then files)
        try:
            entries = list(path_obj.iterdir())
        except PermissionError:
            self.output_lines.append(f"{prefix}🚫 [Access Denied]")
            return

        entries.sort(key=lambda x: (not x.is_dir(), x.name.lower()))
        
        count = len(entries)
        for i, entry in enumerate(entries):
            connector = "└── " if i == count - 1 else "├── "
            
            # Visual formatting
            if entry.is_dir():
                self.output_lines.append(f"{prefix}{connector}📁 {entry.name}")
                self.dir_count += 1
                # Prepare prefix for children
                extension = "    " if i == count - 1 else "│   "
                self.generate_tree(entry, prefix + extension)
            else:
                self.output_lines.append(f"{prefix}{connector}📄 {entry.name}")
                self.file_count += 1
                self.flat_file_list.append(str(entry.absolute()))

    def build_report(self, targets):
        report = []
        report.append("=" * 60)
        report.append(f"📂 PROJECT STRUCTURE REPORT")
        report.append(f"🕒 Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        report.append("=" * 60)
        report.append("")

        for target in targets:
            report.append(f"📍 ROOT: {os.path.abspath(target)}")
            report.append("-" * 40)
            
            # Reset tree buffer for this root
            self.output_lines = [] 
            self.generate_tree(target)
            report.extend(self.output_lines)
            report.append("") # Spacer between roots

        report.append("=" * 60)
        report.append(f"📊 SUMMARY: {self.dir_count} Folders, {self.file_count} Files")
        report.append("=" * 60)
        report.append("")
        report.append("📝 FLAT FILE LIST (Absolute Paths):")
        for f in self.flat_file_list:
            report.append(f)
        
        return "\n".join(report)

def copy_to_clipboard(text):
    """Platform independent clipboard copy."""
    try:
        import subprocess
        if sys.platform == 'win32':
            subprocess.run(['clip'], input=text.strip().encode('utf-16'), check=True)
            return True
        elif sys.platform == 'darwin':  # macOS
            subprocess.run(['pbcopy'], input=text.strip().encode('utf-8'), check=True)
            return True
        elif sys.platform.startswith('linux'):
            # Try xclip or xsel
            try:
                subprocess.run(['xclip', '-selection', 'clipboard'], input=text.strip().encode('utf-8'), check=True)
                return True
            except FileNotFoundError:
                subprocess.run(['xsel', '--clipboard', '--input'], input=text.strip().encode('utf-8'), check=True)
                return True
    except Exception as e:
        logger.error(f"Clipboard Error: {e}")
    return False

def main():
    parser = argparse.ArgumentParser(description="Smart Tree: Context Structure Generator")
    parser.add_argument('targets', nargs='*', help="The file(s) or folder(s) to scan.")
    args = parser.parse_args()

    raw_targets = args.targets

    # --- INPUT LOGIC (Adapted from Smart Copy) ---
    if not raw_targets:
        print("Enter file/folder path(s) to map.")
        print("  - Paste your list (multi-line blocks allowed).")
        print("  - Press [Enter] 3 times quickly to FINISH and generate.")
        
        consecutive_empty_lines = 0
        
        while True:
            try:
                user_input = input("> ").strip()
                
                # STOP CONDITION
                if not user_input:
                    consecutive_empty_lines += 1
                    if consecutive_empty_lines >= 3:
                        break
                    continue
                else:
                    consecutive_empty_lines = 0
                
                # TOKENIZER
                tokens = user_input.split()
                found = 0
                for token in tokens:
                    clean = token.strip("()[],.:;\"'")
                    # Loose validation to allow pasting text blocks
                    if os.path.exists(clean) or "\\" in clean or "/" in clean or "." in clean:
                        raw_targets.append(clean)
                        found += 1
                
                if found > 0:
                    print(f"   (Added {found} paths)")

            except KeyboardInterrupt:
                print("\nCancelled.")
                return

    if not raw_targets:
        logger.error("No targets provided.")
        return

    # --- EXECUTION ---
    logger.info(f"\n🚀 Analyzing {len(raw_targets)} roots...")
    
    generator = TreeGenerator()
    final_report = generator.build_report(raw_targets)

    # --- OUTPUT ---
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"flodock_tree_{timestamp}.txt"
    
    try:
        with open(filename, "w", encoding="utf-8") as f:
            f.write(final_report)
        
        logger.info(f"✅ Tree saved to: {filename}")
        
        if copy_to_clipboard(final_report):
            logger.info("📎 SUCCESS: Copied to clipboard!")
        else:
            logger.info("⚠️  Could not copy to clipboard (Manual copy required).")
            
    except Exception as e:
        logger.error(f"File Write Error: {e}")

if __name__ == "__main__":
    main()
