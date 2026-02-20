# FILEPATH: recover.py
# @file         recover.py
# @author       ansav8@gmail.com
# @date         2026-02-03
# @description  The Surgical Restoration Tool.
#               1. Lists backups sorted by creation time.
#               2. Accepts a range (Start ID to End ID).
#               3. Prompts for confirmation before restoring EACH file.
#               4. Overwrites the live project file with the backup content.

import os
import sys
import time
import platform
import re
import shutil

# --- Configuration ---
MAX_FILES = 50

def get_time_ago(timestamp):
    """Converts a timestamp into a human-readable 'time ago' string."""
    diff = time.time() - timestamp
    if diff < 60: return f"{int(diff)}s ago"
    elif diff < 3600: return f"{int(diff // 60)}m ago"
    elif diff < 86400: return f"{int(diff // 3600)}h ago"
    else: return f"{int(diff // 86400)}d ago"

def parse_backup_filename(filename):
    """
    Extracts version and original filename from backup artifact.
    Format: name.v1.ext OR name.v1
    """
    match = re.search(r'\.v(\d+)(\.[^.]*)?$', filename)
    
    if match:
        version = f"v{match.group(1)}"
        extension = match.group(2) if match.group(2) else ""
        original_name = filename[:match.start()] + extension
        return version, original_name
    
    return "v?", filename

def restore_file(backup_path, target_path):
    """Overwrites target with content from backup."""
    try:
        # Ensure target directory exists (in case it was deleted)
        os.makedirs(os.path.dirname(target_path), exist_ok=True)
        
        shutil.copy2(backup_path, target_path)
        return True
    except Exception as e:
        print(f"   ❌ Error restoring file: {e}")
        return False

def main():
    # 1. Context Awareness
    script_dir = os.path.dirname(os.path.abspath(__file__)) # Project Root
    current_folder_name = os.path.basename(script_dir)
    parent_dir = os.path.dirname(script_dir)
    
    backup_root = os.path.join(parent_dir, f"{current_folder_name}_backup")

    print(f"🔍 Scanning Backup Vault: {backup_root}")

    if not os.path.exists(backup_root):
        print("❌ Backup directory not found.")
        return

    # 2. Scan and Collect Files
    all_backups = []
    
    for root, _, files in os.walk(backup_root):
        for file in files:
            full_backup_path = os.path.join(root, file)
            try:
                stat = os.stat(full_backup_path)
                
                # Use Creation Time for sorting (Logical "Latest Backup")
                sort_time = stat.st_ctime if platform.system() == 'Windows' else stat.st_mtime
                
                # Calculate paths
                rel_dir = os.path.relpath(root, backup_root) # e.g. "frontend/src"
                if rel_dir == ".": rel_dir = ""
                
                version, clean_filename = parse_backup_filename(file)
                
                # Construct the Live Project Path
                # Project Root + Relative Dir + Original Filename
                target_path = os.path.join(script_dir, rel_dir, clean_filename)
                
                display_path = os.path.join(rel_dir, clean_filename).replace("\\", "/")
                
                all_backups.append({
                    'backup_path': full_backup_path,
                    'target_path': target_path,
                    'display_path': display_path,
                    'sort_time': sort_time,
                    'version': version
                })
            except Exception:
                continue

    # 3. Sort (Newest Created First)
    all_backups.sort(key=lambda x: x['sort_time'], reverse=True)
    
    # 4. Render Table
    top_files = all_backups[:MAX_FILES]

    if not top_files:
        print("   No backup files found.")
        return

    print(f"\n📜 LATEST SNAPSHOTS (Top {MAX_FILES})")
    print("=" * 100)
    print(f"{'ID':<4} | {'CREATED':<10} | {'VER':<6} | {'TARGET FILE (Live Project)'}")
    print("-" * 100)

    for idx, f in enumerate(top_files):
        age = get_time_ago(f['sort_time'])
        print(f"[{idx+1:<2}] | {age:<10} | {f['version']:<6} | {f['display_path']}")

    print("=" * 100)

    # 5. Range Selection
    print("\n👉 SELECT RESTORE RANGE")
    try:
        start_input = input("   Start ID : ").strip()
        if not start_input: return
        start_idx = int(start_input) - 1

        end_input = input("   End ID   : ").strip()
        if not end_input: 
            end_idx = start_idx # Default to single file if no end given
        else:
            end_idx = int(end_input) - 1
            
        # Validate Bounds
        if start_idx < 0 or end_idx >= len(top_files) or start_idx > end_idx:
            print("❌ Invalid Range.")
            return

        selected_files = top_files[start_idx : end_idx + 1]
        print(f"\n⚡ Queued {len(selected_files)} files for restoration.\n")

        # 6. The Restoration Loop (Confirm Each)
        for i, file in enumerate(selected_files):
            print(f"[{i+1}/{len(selected_files)}] PROCESSING: {file['display_path']}")
            print(f"   FROM: {file['backup_path']}")
            print(f"   TO  : {file['target_path']}")
            
            confirm = input("   ⚠️  Confirm Overwrite? (y/n): ").strip().lower()
            
            if confirm == 'y':
                if restore_file(file['backup_path'], file['target_path']):
                    print(f"   ✅ RESTORED: {file['display_path']}\n")
                else:
                    print("   ❌ FAILED.\n")
            else:
                print("   🚫 SKIPPED.\n")

        print("🏁 Restoration Sequence Complete.")

    except ValueError:
        print("❌ Invalid input.")
    except KeyboardInterrupt:
        print("\nCancelled.")

if __name__ == "__main__":
    main()