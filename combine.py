# FILEPATH: combine.py
# @file        combine.py
# @author      ansav8@gmail.com
# @date        2025-10-22
# @description Combines multiple source files into one. COPIES THE OUTPUT FILE OBJECT (not text) to the clipboard.
# Modified: 2026-01-25 - Added context_report support for Smart Copy integration.
# Modified: 2026-01-25 - Added 'backups' to ignored_dirs.
# Modified: 2026-01-18 - Added "Smart Rotation".
# Modified: 2026-01-16 - Fixed Critical Bug: 64-bit pointer truncation.

import os
import argparse
import glob
from datetime import datetime
import logging
import sys
import ctypes
from ctypes import wintypes

# --- Basic Logger Setup ---
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# --- Configuration ---
FILE_PREFIX = "flodock_dump_"
FILE_EXTENSION = ".txt"

# --- System Instructions Configuration ---
SYSTEM_INSTRUCTIONS = """SYSTEM INSTRUCTION: THE "LEVEL 5" ENGINEER PROTOCOL (v5.0 - Fractal Edition)
IDENTITY: You are "The Engineer" (ansav8@gmail.com). 
SUPERVISOR: I am "The Architect." 
MISSION: Build an Enterprise Operating System. 
PRIME DIRECTIVE: Translate architectural vision into flawless, fractal, modular code. 

🚫 BANNED: "Quick screens," temporary hacks, and "Layer-Based" folders (e.g., /components, /services).
✅ REQUIRED: "Fractal Feature-Based" Architecture (Colocation of UI, Logic, and State).

🛑 SECTION 1: THE PRIME DIRECTIVES (Non-Negotiable)
If you violate these rules, the session is considered failed.

1. NO GHOST CODING (The Smart Copy Rule): 
   You must NEVER write code for a file without asking me to provide its latest content first. 
   * If you need a file, ask: "Please Smart Copy [File/Folder Path]."
   * Prefer requesting FOLDERS (e.g., `src/features/billing`) to get full dependency context.

2. NO UNAUTHORIZED EXECUTION: 
   You are locked in "Analysis Mode" by default. You cannot switch to "Coding Mode" without my explicit "Approved" or "Go ahead" command.

3. MAXIMUM 2 FILES PER RESPONSE (FIRM RULE): 
   To guarantee complete code delivery, you are strictly limited to generating maximum 2 files per response. If a task requires 3+ files, you MUST stop after the second file and ask permission to continue.

4. COMPLETE CODE ONLY: 
   Never provide snippets. You must generate the ENTIRE file content every time, even for a one-line change.

5. FRACTAL ARCHITECTURE ENFORCEMENT:
   You must reject any plan that creates a Monolith. Code must be organized by FEATURE, not by type. 
   (e.g., `features/auth/components` = GOOD. `src/components/auth` = REJECT).

6. ENTERPRISE MODULARITY: 
   Focus on Smart Polling, "Storyteller" Floodgate patterns, and extreme verbosity in logging. Logic must be "Operating System Grade"—robust, self-healing, and strictly typed.

🔄 SECTION 2: THE WORKFLOW LOOP
PHASE A: DIAGNOSIS & SYNC (Default State)
Trigger: I give a task or report a bug. Your Protocol:
   1. Analyze: Think about the problem from a "Level 5 OS" perspective (Security, Scalability, Fractal Modularity).
   2. Context Check: Do you have the latest files? 
      * If NO: List the exact paths and ask: ">> PLEASE SMART COPY: [Paths] or combine"
      * If YES: Proceed to Phase B.
   3. Stop: Do not propose the solution yet. Wait for the files.

PHASE B: STRATEGY & APPROVAL
Trigger: I provide the file contents (via Smart Copy or Paste). Your Protocol:
   1. Review: Analyze the code provided.
   2. Fractal Audit: Ensure the changes respect strict feature isolation (no cross-contamination).
   3. Plan: Explain exactly what you will change and why.
   4. Ask: "Do you approve this plan?"

PHASE C: EXECUTION (Coding Mode)
Trigger: I say "Approved" or use an >> APPROVE command. Your Protocol:
   1. Check Limit: Confirm you are generating ≤ 2 files.
   2. Generate: Write the COMPLETE code.
   3. Format: Use the "Mandatory Code Format" below.
   4. Verify: Check for omissions (Green/Red check).

📝 SECTION 3: MANDATORY OUTPUT FORMATS
1. The Code Block Format
(Must be used whenever generating code. CRITICAL: The internal header must use the correct comment syntax for the language).

FILEPATH: /path/to/actual/file.ext

Code snippet

[USE NATIVE COMMENT SYNTAX]
# For Python/Shell/YAML:
# FILEPATH: /path/to/actual/file.ext
# @file ... [Standard Header with Author ansav8@gmail.com] ...

# For HTML/XML:
# For JS/CSS/C/Java:
/* FILEPATH: /path/to/actual/file.ext */
/* @file ... [Standard Header with Author ansav8@gmail.com] ... */

[... FULL COMPLETE CODE - NO OMISSIONS ...]

2. The Project State Footer (REQUIRED on EVERY END OF the message)
This is the anchor that keeps you in sync. You must generate the "Next Action Menu" with specific options I can copy.

Plaintext

[PROJECT STATE BLOCK]
Task ID: [Unique ID, e.g., P1-S2]
Feature: [Name]
Phase: [Phase #] - [Phase Name]
Status: [🔴 ANALYSIS | 🟡 SYNCING | 🟢 CODING]
Sync Check: [✅ LATEST CODE USED | ⚠️ ASSUMED (VIOLATION)]
Files Delivered: [X] of [Total Required] (Limit 2 per prompt)
Code Integrity: [✅ FULL / ❌ TRUNCATED / ⚪ N/A]

NEXT ACTION MENU (Select & Copy one):
> [Option 1]: >> APPROVE [Task ID]. Proceed to code generation.
> [Option 2]: >> CONTINUE. Generate the next batch of files.
> [Option 3]: >> PROVIDE FILES. I will run Smart Copy and paste the content now.
> [Option 4]: >> REVISE [Task ID]. I disagree with the plan, let's discuss.
"""

# --- Windows Clipboard Logic (ctypes) ---
class DROPFILES(ctypes.Structure):
    _fields_ = [
        ("pFiles", wintypes.DWORD),
        ("pt", wintypes.POINT),
        ("fNC", wintypes.BOOL),
        ("fWide", wintypes.BOOL),
    ]

def copy_file_to_clipboard_windows(filepath):
    """
    Copies the actual file object to the clipboard using Windows API.
    Allows pasting the file in Windows Explorer.
    """
    if not os.path.exists(filepath):
        logger.error(f"Cannot copy to clipboard: File not found {filepath}")
        return False
        
    user32 = ctypes.windll.user32
    kernel32 = ctypes.windll.kernel32

    kernel32.GlobalAlloc.argtypes = [wintypes.UINT, ctypes.c_size_t]
    kernel32.GlobalAlloc.restype = wintypes.HGLOBAL
    kernel32.GlobalLock.argtypes = [wintypes.HGLOBAL]
    kernel32.GlobalLock.restype = ctypes.c_void_p
    kernel32.GlobalUnlock.argtypes = [wintypes.HGLOBAL]
    kernel32.GlobalUnlock.restype = wintypes.BOOL
    user32.OpenClipboard.argtypes = [wintypes.HWND]
    user32.OpenClipboard.restype = wintypes.BOOL
    user32.SetClipboardData.argtypes = [wintypes.UINT, wintypes.HANDLE]
    user32.SetClipboardData.restype = wintypes.HANDLE
    user32.EmptyClipboard.argtypes = []
    user32.EmptyClipboard.restype = wintypes.BOOL
    user32.CloseClipboard.argtypes = []
    user32.CloseClipboard.restype = wintypes.BOOL

    abs_path = os.path.abspath(filepath)
    files_data = abs_path + '\0' 
    files_data_encoded = files_data.encode('utf-16le')
    double_null = b'\0\0'
    
    offset = ctypes.sizeof(DROPFILES)
    total_size = offset + len(files_data_encoded) + len(double_null)
    
    hGlobal = kernel32.GlobalAlloc(0x0042, total_size)
    if not hGlobal:
        return False

    ptr = kernel32.GlobalLock(hGlobal)
    if not ptr:
        kernel32.GlobalFree(hGlobal)
        return False

    df = DROPFILES()
    df.pFiles = offset 
    df.fWide = True
    
    ctypes.memmove(ptr, ctypes.byref(df), ctypes.sizeof(DROPFILES))
    data_ptr = ptr + offset
    ctypes.memmove(data_ptr, files_data_encoded, len(files_data_encoded))
    kernel32.GlobalUnlock(hGlobal)
    
    if not user32.OpenClipboard(None):
        kernel32.GlobalFree(hGlobal)
        return False
        
    user32.EmptyClipboard()
    CF_HDROP = 15
    if not user32.SetClipboardData(CF_HDROP, hGlobal):
        user32.CloseClipboard()
        kernel32.GlobalFree(hGlobal)
        return False
        
    user32.CloseClipboard()
    return True

def cleanup_old_dumps():
    pattern = f"{FILE_PREFIX}*{FILE_EXTENSION}"
    old_files = glob.glob(pattern)
    if not old_files: return
    logger.info(f"🧹 Performing cleanup. Removing {len(old_files)} old dump file(s)...")
    for f in old_files:
        try: os.remove(f)
        except Exception: pass

def get_project_files(paths, ignored_dirs=None, ignored_files=None):
    if ignored_dirs is None:
        ignored_dirs = {'__pycache__', '.git', '.idea', 'venv', '.vscode', 'node_modules', 'backups'}
    if ignored_files is None:
        ignored_files = {'.DS_Store'}

    logger.info(f"Starting file collection from paths: {paths}")
    file_paths = []
    missing_paths = []

    for path in paths:
        trimmed_path = path.strip()
        if not trimmed_path: continue
        normalized_path = os.path.normpath(trimmed_path)
        
        if not os.path.exists(normalized_path):
            missing_paths.append(normalized_path)
            continue

        if os.path.isfile(normalized_path):
            if os.path.basename(normalized_path) not in ignored_files:
                file_paths.append(normalized_path)
        elif os.path.isdir(normalized_path):
            for root, dirs, files in os.walk(normalized_path):
                dirs[:] = [d for d in dirs if d not in ignored_dirs]
                for file in files:
                    if file not in ignored_files:
                        file_paths.append(os.path.normpath(os.path.join(root, file)))
    
    return sorted(list(set(file_paths))), sorted(list(set(missing_paths)))

def combine_files(file_paths, missing_paths, output_filename, context_report=None):
    """
    Combines content into a single output file.
    Args:
        file_paths: List of files to include.
        missing_paths: List of files requested but missing.
        output_filename: The target output file.
        context_report: (Optional) A string containing the context analysis log to be included in the header.
    """
    logger.info(f"Starting combination process for {len(file_paths)} files.")
    try:
        with open(output_filename, 'w', encoding='utf-8', errors='ignore') as outfile:
            # --- Header ---
            generation_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            outfile.write(f"Project Code Dump generated on: {generation_time}\n")
            outfile.write("=" * 50 + "\n")
            
            # --- List Found Files ---
            outfile.write(f"{len(file_paths)} files included:\n")
            outfile.write("-" * 20 + "\n")
            for file_path in file_paths:
                outfile.write(f"{file_path}\n")
            
            # --- List Missing Files ---
            if missing_paths:
                outfile.write("\n" + "!" * 50 + "\n")
                outfile.write(f"!!! {len(missing_paths)} FILES REQUESTED BUT NOT FOUND !!!\n")
                for missing in missing_paths:
                    outfile.write(f"# FILE PATH NOT FOUND: {missing}\n")
            
            # --- Inject Context Report (If present) ---
            if context_report:
                outfile.write("\n" + "=" * 50 + "\n")
                outfile.write("CONTEXT ANALYSIS REPORT\n")
                outfile.write("=" * 50 + "\n")
                outfile.write(context_report)
                outfile.write("\n" + "=" * 50 + "\n")

            outfile.write("\n" + "=" * 50 + "\n\n")

            # --- File Contents ---
            for file_path in file_paths:
                normalized_path = os.path.normpath(file_path)
                outfile.write(f"# Source code from: {normalized_path}\n")
                outfile.write("-" * (22 + len(normalized_path)) + "\n")
                try:
                    with open(normalized_path, 'r', encoding='utf-8', errors='ignore') as infile:
                        lines = infile.readlines()
                        for i, line in enumerate(lines):
                            outfile.write(f"{i+1:4d} | {line}")
                        outfile.write("\n" + "=" * 80 + "\n\n")
                except Exception as e:
                    outfile.write(f"!!! ERROR: Could not read file: {e} !!!\n\n")
            
            # --- Append System Instructions ---
            outfile.write("\n" + "=" * 80 + "\n")
            outfile.write("# SYSTEM INSTRUCTION: THE \"STRICT ARCHITECT\" PROTOCOL (v4.0)\n")
            outfile.write("=" * 80 + "\n")
            outfile.write(SYSTEM_INSTRUCTIONS)
        
        logger.info(f"Successfully combined files into '{output_filename}'")
        return True
    except IOError as e:
        logger.error(f"Error writing to output file {output_filename}: {e}")
        return False

if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Combines files, rotates output filename, and copies FILE OBJECT to clipboard.",
        epilog="Example: python combine.py ./modules"
    )
    parser.add_argument('paths', nargs='*', help="Paths to combine.")
    parser.add_argument('-o', '--output', help="Optional: Override auto-generated filename.")
    
    args = parser.parse_args()

    input_paths = args.paths
    processed_paths = []

    if not input_paths:
        logger.info("No paths provided. Interactive mode.")
        logger.info("Enter paths. Press Enter twice to finish.")
        interactive_paths = []
        consecutive_empty_lines = 0
        while True:
            try:
                line = input("> ").strip()
                if not line:
                    consecutive_empty_lines += 1
                    if consecutive_empty_lines >= 2: break
                else:
                    consecutive_empty_lines = 0
                    interactive_paths.extend(line.split())
            except (EOFError, KeyboardInterrupt): break
        processed_paths = interactive_paths
    elif len(input_paths) == 1 and ' ' in input_paths[0]:
        processed_paths = input_paths[0].split()
    else:
        processed_paths = input_paths

    if not processed_paths:
        logger.warning("No paths specified.")
    else:
        if args.output:
            final_output_name = args.output
        else:
            cleanup_old_dumps()
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            final_output_name = f"{FILE_PREFIX}{timestamp}{FILE_EXTENSION}"

        files, missing = get_project_files(processed_paths)
        if not files and not missing:
            logger.warning("No valid files found.")
        else:
            # Standalone mode: context_report is None
            success = combine_files(files, missing, final_output_name, context_report=None)
            
            if success:
                logger.info("Attempting to copy output FILE OBJECT to clipboard...")
                if sys.platform == 'win32':
                    if copy_file_to_clipboard_windows(final_output_name):
                        logger.info(f"SUCCESS: Copied '{final_output_name}' to clipboard.")
                    else:
                        logger.error("FAILED to copy file object to clipboard.")
                else:
                    logger.warning("This script currently only supports File Copy on Windows.")

