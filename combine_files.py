# C:\Pythonproject\P2\combine_files.py
# @file         combine_files.py
# @author       ansav8@gmail.com
# @date         2025-10-22
# @description  Combines multiple source files/directories into one text file. Handles space-separated paths on one line.
# Modified: 2025-12-28 - Added mandatory System Instructions footer to the final output.
# Modified: 2025-12-18 - Added tracking and reporting of missing/not-found files in the final output dump.
# Modified: 2025-10-22 - Removed concatenated path logic; added handling for space-separated paths on a single input line.
# Modified: 2025-09-18 13:01:00 - Added functionality to copy the final output to the clipboard.
# Modified: 2025-09-08 11:50:00 - Changed interactive mode to require a double Enter to finish input.
# Modified: 2025-09-08 11:45:00 - Added an interactive input mode for file and directory paths.
# Modified: 2025-08-21 08:15:00 - Removed the '.py' file extension restriction to allow combining any file type.
# Modified: 2025-08-20 18:29:00 - Upgraded script to accept file and directory paths as command-line arguments for dynamic code dumps.

import os
import argparse
from datetime import datetime
import logging
import sys
import pyperclip

# --- Basic Logger Setup ---
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# --- System Instructions Configuration ---
SYSTEM_INSTRUCTIONS = """You are "The Sovereign Engineer".
Supervisor: The Architect (The User).
Mission: Engineer an Enterprise Operating System (Flodock) using Fractal Architecture.
Prime Directive: "Invariants are Law. Context is Holy. Narrate Everything."

🛑 SECTION 1: THE PRIME DIRECTIVES (Non-Negotiable)
If you violate these rules, the session is considered failed.

NO GHOST CODING (The Smart Copy Rule):

You must NEVER write code for a file without asking the user to provide its latest content first.

Action: Ask: >> PLEASE SMART COPY: [File/Folder Path]

NO UNAUTHORIZED EXECUTION:

You are locked in "Analysis Mode" by default.

You cannot switch to "Coding Mode" without explicit user approval (e.g., "Approved", "Go ahead").

MAXIMUM 2 FILES PER RESPONSE:

To guarantee completeness, you are strictly limited to generating 2 files per response.

If a task requires more, stop and ask permission to continue.

COMPLETE CODE ONLY:

NEVER provide snippets, "rest of code", or placeholders.

You must generate the ENTIRE file content every time, even for a one-line change.

FRACTAL ARCHITECTURE ENFORCEMENT:

Colocation: Code must be organized by FEATURE (/domains/auth/features/login), not by Type (/components).

No Monoliths: Reject any plan that creates large, coupled files.

Public API: Every feature folder must have an index.ts (or __init__.py) that exports only the public surface area.

SIGNAL TELEMETRY (The Narrator):

No console.log: You must use the logger (Narrator) for all output.

Syntax: logger.tell("SYSTEM", "User Logged In") or logger.scream("API", "Connection Failed").

RECURSIVE COMPLIANCE (The Golden Rule):

No Exceptions for Tools: Any script, map, or utility you generate (e.g., cartographer.py, seed.py) MUST ITSELF strictly obey the Coding Standards.

Self-Documentation: You cannot enforce rules you do not follow. If you write a tool to parse comments, that tool's methods must have comments.

📜 SECTION 2: THE FLODOCK CODEX (Coding Standards)
You must strictly adhere to the Semantic Contract for all code generation. The Cartographer Engine relies on these tags to map the system.

1. The Metadata Header (Mandatory)
Every file (Application OR Script) must begin with this block.

For TypeScript/React (.ts, .tsx):

TypeScript
/* FILEPATH: src/domains/auth/features/login/LoginScreen.tsx */
/* @file: Login Screen Component */
/* @role: 🖥️ Screen (View) */
/* @author: The Engineer */
/* @description: Renders the login form and handles submission events. */
/* @security-level: LEVEL 5 (Presentation) */
/* @invariant: Submit button must be disabled while 'isAuthenticating' is true. */
/* @narrator: Logs 'LOGIN_ATTEMPT' events to the console. */
For Python (.py):

Python
# FILEPATH: backend/cartographer.py
# @file: The Cartographer
# @role: ⚙️ System Tool
# @author: The Engineer (ansav8@gmail.com)
# @description: Scans the codebase to generate a semantic atlas.
# @security-level: LEVEL 9 (Read-Only)
# @invariant: Must never modify the source code it scans.
# @narrator: Logs scan progress and parse errors.
2. Semantic Method Documentation (Mandatory)
EVERY exported function, class, or method must have a Docstring/JSDoc that explains WHY it exists.

Python:

Python
def calculate_tax(amount: float) -> float:
    
    @description: Calculates VAT based on 2024 EU Rules.
    @invariant: Output must never be negative.
    
    return amount * 0.20
TypeScript:

TypeScript
/**
 * @description: Authenticates the user against the Kernel Registry.
 * @invariant: Must clear previous session before attempting login.
 */
async function login(creds: Credentials): Promise<void> { ... }
3. Data Hygiene Protocol
🟢 GREEN ZONE (Visuals): Emojis allowed in Logs, UI Labels, Comments.

🔴 RED ZONE (Structure): STRICT ASCII ONLY for Database Columns, API Keys, Enums, and File Names.

Bad: status_🚀

Good: status_active

🔄 SECTION 3: THE WORKFLOW LOOP
You must strictly follow this state machine.

PHASE A: DIAGNOSIS & SYNC (Default State)
Analyze: Think about the request from a "Level 9 OS" perspective.

Context Check: Do you have the latest file content?

If NO: Output: >> PLEASE SMART COPY: [Paths]

If YES: Proceed to Phase B.

Stop: Do not propose a solution yet. Wait for files.

PHASE B: STRATEGY & APPROVAL
Review: Analyze the provided code.

Fractal Audit: Ensure strict feature isolation.

Plan: Explain the architecture of the change.

Ask: "Do you approve this plan?"

PHASE C: EXECUTION (Coding Mode)
Triggered only after User says "Approved".

Check Limit: Confirm generation is ≤ 2 files.

Generate: Write COMPLETE code with the Mandatory Header and Semantic Docstrings.

Verify: Ensure no omissions.

📝 SECTION 4: MANDATORY OUTPUT FORMATS
1. The Code Block
Always use the correct language syntax for the header.

TypeScript
/* FILEPATH: path/to/file.ts */
/* @file ... */
... full code ...
2. The Project State Footer (REQUIRED on EVERY response)
This anchors the session state.

Plaintext
[PROJECT STATE BLOCK]
Task ID: [Unique ID, e.g. P1-S1]
Feature: [Name]
Phase: [1-Diagnosis | 2-Strategy | 3-Execution | 4-Verification]
Status: [🔴 ANALYSIS | 🟡 SYNCING | 🟢 CODING]
Sync Check: [✅ LATEST CODE USED | ⚠️ ASSUMED (VIOLATION)]
Files Delivered: [X] of [2 Limit]
Code Integrity: [✅ FULL | ❌ TRUNCATED]

NEXT ACTION MENU (Select & Copy one):
> [Option 1]: >> APPROVE. Proceed to code generation.
> [Option 2]: >> PROVIDE FILES. I will paste the content now.
> [Option 3]: >> REVISE. I disagree with the plan.
"""

def get_project_files(paths, ignored_dirs=None, ignored_files=None):
    """
    Scans the given paths, collecting all files.
    If a path is a file, it's added directly.
    If a path is a directory, it's scanned recursively.
    Skips specified directories and files.
    
    Returns:
        tuple: (list of found file paths, list of missing file paths)
    """
    if ignored_dirs is None:
        ignored_dirs = {'__pycache__', '.git', '.idea', 'venv', '.vscode', 'node_modules'}
    if ignored_files is None:
        ignored_files = {'.DS_Store'}

    logger.info(f"Starting file collection from paths: {paths}")
    file_paths = []
    missing_paths = []

    for path in paths:
        # Trim whitespace from individual paths just in case
        trimmed_path = path.strip()
        if not trimmed_path:
            continue
        normalized_path = os.path.normpath(trimmed_path)
        
        if not os.path.exists(normalized_path):
            logger.warning(f"Provided path does not exist: {normalized_path}")
            missing_paths.append(normalized_path)
            continue

        if os.path.isfile(normalized_path):
            if os.path.basename(normalized_path) not in ignored_files:
                file_paths.append(normalized_path)
                logger.info(f"Added single file: {normalized_path}")
            else:
                logger.warning(f"Skipping ignored file: {normalized_path}")

        elif os.path.isdir(normalized_path):
            logger.info(f"Scanning directory recursively: {normalized_path}")
            for root, dirs, files in os.walk(normalized_path):
                dirs[:] = [d for d in dirs if d not in ignored_dirs]
                
                for file in files:
                    if file not in ignored_files:
                        full_path = os.path.join(root, file)
                        norm_full_path = os.path.normpath(full_path)
                        file_paths.append(norm_full_path)
                        logger.debug(f"Found file in directory: {norm_full_path}")
    
    unique_files = sorted(list(set(file_paths)))
    unique_missing = sorted(list(set(missing_paths)))
    
    logger.info(f"Total unique files collected: {len(unique_files)}")
    if unique_missing:
        logger.warning(f"Total missing paths: {len(unique_missing)}")
        
    return unique_files, unique_missing

def combine_files(file_paths, missing_paths, output_filename):
    """
    Combines the content of the specified files into a single output file.
    Includes a report of missing files if any were requested but not found.
    Appends mandatory System Instructions at the end.
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
            
            # --- List Missing Files (New Section) ---
            if missing_paths:
                outfile.write("\n" + "!" * 50 + "\n")
                outfile.write(f"!!! {len(missing_paths)} FILES REQUESTED BUT NOT FOUND !!!\n")
                outfile.write("!" * 50 + "\n")
                for missing in missing_paths:
                    outfile.write(f"# FILE PATH NOT FOUND: {missing}\n")
            
            outfile.write("=" * 50 + "\n\n")

            # --- File Contents ---
            for file_path in file_paths:
                normalized_path = os.path.normpath(file_path)
                logger.debug(f"Processing file: {normalized_path}")
                outfile.write(f"# Source code from: {normalized_path}\n")
                outfile.write("-" * (22 + len(normalized_path)) + "\n")
                try:
                    with open(normalized_path, 'r', encoding='utf-8', errors='ignore') as infile:
                        lines = infile.readlines()
                        for i, line in enumerate(lines):
                            outfile.write(f"{i+1:4d} | {line}")
                    outfile.write("\n" + "=" * 80 + "\n\n")
                except Exception as e:
                    logger.error(f"Could not read file {normalized_path}: {e}")
                    outfile.write(f"!!! ERROR: Could not read file: {e} !!!\n\n")
            
            # --- Append Missing Files Section to Bottom as well for Visibility ---
            if missing_paths:
                outfile.write("\n" + "#" * 50 + "\n")
                outfile.write("# MISSING FILES REPORT\n")
                outfile.write("#" * 50 + "\n")
                for missing in missing_paths:
                    outfile.write(f"# ERROR: The file path '{missing}' does not exist.\n")

            # --- Append System Instructions (New Feature) ---
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
    # --- Argument Parser Setup ---
    parser = argparse.ArgumentParser(
        description="A utility to combine multiple source files or directories into a single text file for analysis.",
        epilog="Example usage:\n"
               "  python combine_files.py ./modules ./templates app.py -o combined.txt\n"
               "  python combine_files.py \"modules/nav.py templates/base.html\" -o combined.txt\n" # Quoted space-separated
               "  python combine_files.py (interactive mode)"
    )
    parser.add_argument(
        'paths',
        nargs='*',
        help="One or more space-separated paths (files/dirs). If empty, prompts interactively."
    )
    parser.add_argument(
        '-o', '--output',
        default='P3.txt',
        help="The name of the output file. Defaults to 'P3.txt'."
    )
    
    args = parser.parse_args()

    # --- Script Execution ---
    input_paths = args.paths
    processed_paths = []

    if not input_paths:
        # --- Interactive Mode ---
        logger.info("No paths provided via command line. Entering interactive mode.")
        logger.info("Enter file/dir paths (space-separated on one line OR one path per line). Press Enter twice to finish.")
        interactive_paths = []
        consecutive_empty_lines = 0
        while True:
            try:
                line = input("> ").strip()
                if not line:
                    consecutive_empty_lines += 1
                    if consecutive_empty_lines >= 2:
                        break
                else:
                    consecutive_empty_lines = 0
                    # Split the line by spaces and add all parts
                    interactive_paths.extend(line.split())
            except EOFError:
                logger.info("End of input detected.")
                break
            except Exception as e:
                logger.error(f"An unexpected error occurred during interactive input: {e}")
                sys.exit(1)

        processed_paths = interactive_paths

    # Handle command line input where paths might be in one quoted argument
    elif len(input_paths) == 1 and ' ' in input_paths[0]:
         logger.info("Single command line argument with spaces detected, splitting.")
         processed_paths = input_paths[0].split()
    else:
        # Standard command line mode (multiple space-separated arguments)
        processed_paths = input_paths

    # --- Combine Files ---
    if not processed_paths:
        logger.warning("No files or directories were specified or parsed for combination. No output file will be generated.")
    else:
        # Unpack tuple: valid files AND missing paths
        files_to_combine, missing_files = get_project_files(processed_paths)
        
        # Proceed if we have EITHER valid files OR missing files (to report the error)
        if not files_to_combine and not missing_files:
            logger.warning("No files were found in the specified paths. No output file will be generated.")
        else:
            success = combine_files(files_to_combine, missing_files, args.output)

            # --- Copy to clipboard ---
            if success:
                try:
                    with open(args.output, 'r', encoding='utf-8', errors='ignore') as f:
                        combined_content = f.read()
                        pyperclip.copy(combined_content)
                        logger.info("Content has been successfully copied to the clipboard. ✨")
                except Exception as e:
                    logger.error(f"Failed to copy content to clipboard: {e}")
                    logger.warning("The output file was created, but clipboard copy failed.")
                    if sys.platform.startswith('linux'):
                         logger.warning("Please ensure 'xclip' or 'xsel' is installed on Linux.")

