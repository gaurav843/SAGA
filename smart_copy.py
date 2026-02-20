# FILEPATH: smart_copy.py
# @file: Smart Context Copy Orchestrator (Path Fix + Exclusion Edition)
# @description: 1. Analyzes targets (AUTO-CONVERTS ABSOLUTE PATHS TO RELATIVE).
# 2. TRIGGERS EXTERNAL CARTOGRAPHERS.
# 3. INCLUDES 'main_prompt.txt'.
# 4. EXCLUDES 'backend/infrastructure' and subfolders.
# 5. Dumps everything to clipboard.

import sys
import os
import argparse
import logging
import glob
import subprocess
from typing import Set, List

# Assuming these modules exist in your environment
try:
    from context import ContextMapper
    import combine
except ImportError:
    print("❌ Critical Error: Missing 'context.py' or 'combine.py'. Cannot run.")
    sys.exit(1)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s', datefmt='%H:%M:%S')
logger = logging.getLogger("SmartCopy")

def normalize_to_relative(path: str) -> str:
    """
    Converts an absolute path to a relative path if it is inside the current directory.
    Example: C:\Projects\Flodock\frontend\main.ts -> frontend\main.ts
    """
    try:
        # Get absolute version of current working directory
        cwd = os.getcwd()
        abs_path = os.path.abspath(path)
        
        # Check if the file is actually inside our current folder
        if abs_path.startswith(cwd):
            # Strip the CWD from the start
            rel_path = os.path.relpath(abs_path, cwd)
            return rel_path
        return path
    except Exception:
        return path

def trigger_cartographers() -> List[str]:
    """
    Checks for frontend/backend cartographers, runs them, 
    and returns the paths to the generated ATLAS files.
    """
    generated_files = []
    
    tools = [
        {
            "name": "Frontend Prism",
            "script": os.path.join("frontend", "cartographer.py"),
            "output": os.path.join("frontend", "FRONTEND_ATLAS.md")
        },
        {
            "name": "Backend Cartographer",
            "script": os.path.join("backend", "cartographer.py"),
            "output": os.path.join("backend", "SYSTEM_ATLAS.md")
        }
    ]

    logger.info("-" * 60)
    logger.info("🗺️  AUTO-DISCOVERY: Checking for Cartographers...")
    
    for tool in tools:
        if os.path.exists(tool["script"]):
            logger.info(f"    👉 Found {tool['name']}. Executing...")
            try:
                # Run script from its own directory to avoid path issues
                script_dir = os.path.dirname(tool["script"])
                script_name = os.path.basename(tool["script"])
                
                result = subprocess.run(
                    [sys.executable, script_name], 
                    capture_output=True, 
                    text=True,
                    cwd=script_dir 
                )
                
                if result.returncode == 0:
                    if os.path.exists(tool["output"]):
                        logger.info(f"      ✅ Generated: {tool['output']}")
                        generated_files.append(tool["output"])
                    else:
                        logger.warning(f"      ⚠️  Script ran, but output file not found: {tool['output']}")
                else:
                    logger.error(f"      ❌ Execution Failed: {result.stderr}")
            except Exception as e:
                logger.error(f"      ❌ Error running tool: {e}")
        else:
            logger.debug(f"    (Skipping {tool['name']}, script not found)")

    logger.info("-" * 60)
    return generated_files

def main():
    parser = argparse.ArgumentParser(description="Smart Copy: Context-Aware File Dumper")
    parser.add_argument('targets', nargs='*', help="The file(s) or folder(s) to analyze.")
    args = parser.parse_args()

    # 1. Resolve Targets
    raw_targets = args.targets
    
    # --- INPUT LOGIC START ---
    if not raw_targets:
        print("Enter file/folder path(s).")
        print("   - Paste your list (multi-line blocks allowed).")
        print("   - Press [Enter] 3 times quickly to FINISH and start.")
        
        consecutive_empty_lines = 0
        
        while True:
            try:
                user_input = input("> ").strip()
                if not user_input:
                    consecutive_empty_lines += 1
                    if consecutive_empty_lines >= 3:
                        print("   (Starting execution...)")
                        break
                    continue
                else:
                    consecutive_empty_lines = 0
                
                tokens = user_input.split()
                found_on_line = 0
                for token in tokens:
                    clean_token = token.strip("()[],.:;\"'")
                    is_real_path = os.path.exists(clean_token)
                    is_glob = any(c in clean_token for c in "*?[]")
                    looks_like_path = '/' in clean_token or '\\' in clean_token or '.' in clean_token
                    
                    if is_real_path or is_glob or looks_like_path:
                        # Normalize absolute paths immediately
                        rel_token = normalize_to_relative(clean_token)
                        raw_targets.append(rel_token)
                        found_on_line += 1
                
                if found_on_line > 0:
                    print(f"   (Added {found_on_line} paths)")
                
            except KeyboardInterrupt:
                print("\nCancelled by user.")
                return
    # --- INPUT LOGIC END ---
    
    if not raw_targets:
        logger.error("No targets provided.")
        return

    logger.info("🔍 Resolving target paths...")
    # Double check normalization in case args were passed via command line
    raw_targets = [normalize_to_relative(t) for t in raw_targets]
    
    target_files, missing = combine.get_project_files(raw_targets)
    
    if missing:
        for m in missing: logger.warning(f"Target not found: {m}")
    
    if not target_files:
        logger.error("No valid source files found to analyze.")
        return

    # 2. Build Knowledge Graph
    logger.info("🧠 Building Knowledge Graph...")
    mapper = ContextMapper(".")
    mapper.build_graph()
    
    # 3. Aggregating Files & Building Report
    all_files: Set[str] = set()
    report_lines: List[str] = []
    
    logger.info("="*60)
    logger.info(f"🚀 Analyzing {len(target_files)} unique targets...")
    logger.info("="*60)

    for target in target_files:
        logger.info(f"    👉 Processing: {target}")
        
        # Ensure we are querying the mapper with a relative path
        rel_target = normalize_to_relative(target)
        context = mapper.get_context(rel_target)
        
        report_lines.append(f"Target: {rel_target}")
        
        if "error" in context:
            logger.warning(f"      ⚠️  Analysis failed: {context['error']}")
            logger.info(f"      ✅ FALLBACK: Force-adding to dump: {rel_target}")
            all_files.add(rel_target)
            report_lines.append(f"  - Status: ANALYSIS FAILED (Fallback Used)")
        else:
            file_count_before = len(all_files)
            all_files.add(context['target'])
            all_files.update(context['direct'])
            all_files.update(context['used_by'])
            all_files.update(context['indirect'])
            all_files.update(context['cross_stack'])
            
            added_count = len(all_files) - file_count_before
            logger.info(f"      found {added_count} new related files.")
            report_lines.append(f"  - Direct Deps: {len(context['direct'])}")
            report_lines.append(f"  - Used By:     {len(context['used_by'])}")
            report_lines.append(f"  - Cross-Stack: {len(context['cross_stack'])}")
        
        report_lines.append("-" * 30)

    # --- STEP 4a: RUN CARTOGRAPHERS ---
    atlas_files = trigger_cartographers()
    if atlas_files:
        logger.info(f"📥 Including {len(atlas_files)} Atlas files in the dump.")
        for atlas in atlas_files:
            all_files.add(atlas)
            report_lines.append(f"Target (Auto-Generated): {atlas}")
            
    # --- STEP 4b: INCLUDE MAIN PROMPT ---
    main_prompt_file = "main_prompt.txt"
    if os.path.exists(main_prompt_file):
        logger.info(f"📄 Found '{main_prompt_file}'. Including it in the dump.")
        all_files.add(main_prompt_file)
        report_lines.append(f"Target (Instruction): {main_prompt_file}")
    else:
        logger.debug(f"ℹ️  '{main_prompt_file}' not found (skipping).")

       
    # --- STEP 4c: INCLUDE frontend_prompt PROMPT ---
    main_prompt_file = "frontend_prompt.txt"
    if os.path.exists(main_prompt_file):
        logger.info(f"📄 Found '{main_prompt_file}'. Including it in the dump.")
        all_files.add(main_prompt_file)
        report_lines.append(f"Target (Instruction): {main_prompt_file}")
    else:
        logger.debug(f"ℹ️  '{main_prompt_file}' not found (skipping).")

    # --- STEP 4c: EXCLUSION FILTER (NEW) ---
    # Define paths to strictly ignore.
    exclusion_prefixes = [
        os.path.join("backend", "infrastructure"),
        # Add other exclusions here if needed
    ]

    files_to_remove = set()
    
    for file_path in all_files:
        # Normalize path separators to match the OS (e.g., / vs \)
        norm_path = os.path.normpath(file_path)
        
        for exclusion in exclusion_prefixes:
            # Check if the file starts with the excluded folder path
            if norm_path.startswith(exclusion):
                files_to_remove.add(file_path)
                break
    
    if files_to_remove:
        logger.info("-" * 60)
        logger.info(f"🚫 EXCLUSION: Removing {len(files_to_remove)} files from ignored paths...")
        for removed in files_to_remove:
            logger.info(f"    - Dropped: {removed}")
            all_files.remove(removed)
    # ----------------------------------------

    # 5. Generate Output
    file_list = sorted(list(all_files))
    context_report_str = "\n".join(report_lines)
    
    if not file_list:
        logger.error("No valid files found to copy.")
        return

    logger.info("-" * 60)
    logger.info(f"📦 PACKAGING {len(file_list)} UNIQUE FILES")
    logger.info("-" * 60)

    from datetime import datetime
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    
    if len(raw_targets) == 1 and os.path.isfile(raw_targets[0]):
        base = os.path.basename(raw_targets[0]).replace('.', '_')
        output_filename = f"flodock_dump_{base}_{timestamp}.txt"
    else:
        output_filename = f"flodock_dump_multi_{len(file_list)}files_{timestamp}.txt"
    
    # Cleanup old dumps
    for f in glob.glob(f"flodock_dump_*.txt"):
        try: 
            # Optional: remove files older than 1 hour or just clean up
            pass 
        except: pass

    success = combine.combine_files(file_list, [], output_filename, context_report=context_report_str)

    if success:
        logger.info("✅ Dump created successfully.")
        if sys.platform == 'win32':
            # Assuming combine.py has a Windows clipboard function
            # If not, you might need pyperclip or subprocess call to clip
            try:
                if combine.copy_file_to_clipboard_windows(output_filename):
                    logger.info(f"📎 SUCCESS: File content from '{output_filename}' copied to clipboard!")
                else:
                    logger.warning("Clipboard copy failed.")
            except AttributeError:
                logger.warning("Clipboard function not found in combine.py")
    else:
        logger.error("Dump creation failed.")

if __name__ == "__main__":
    main()

