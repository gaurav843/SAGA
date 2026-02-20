import subprocess
import sys
import os

def get_typescript_errors(file_path):
    # 1. Normalize path to forward slashes (fixes Windows vs TSC mismatch)
    normalized_path = file_path.replace('\\', '/')
    filename = os.path.basename(normalized_path)
    
    print(f"⏳ Running TypeScript compiler...")
    print(f"🔎 Scanning for errors in: {filename}\n")

    try:
        # 2. Run tsc with --pretty false to strip invisible color codes
        # shell=True is needed on Windows for npx
        result = subprocess.run(
            'npx tsc --noEmit --pretty false', 
            shell=True, 
            capture_output=True, 
            text=True,
            encoding='utf-8' 
        )
        
        # tsc outputs errors to stdout. It returns a non-zero exit code if errors exist.
        output = result.stdout + result.stderr

        if not output.strip():
            print("✅ The compiler ran perfectly. No errors found in the entire project.")
            return

        errors_found = []
        
        # 3. Parse line by line
        for line in output.splitlines():
            # Match the filename and ensure it's a TypeScript error
            if filename in line and 'error TS' in line:
                errors_found.append(line.strip())

        # 4. Output the results
        if errors_found:
            print(f"--- ❌ Found {len(errors_found)} error(s) in {filename} ---")
            for err in errors_found:
                print(err)
        else:
            print(f"✅ No specific TypeScript errors found for '{filename}'.")
            print("💡 Tip: If you know errors exist, ensure this file is included in your tsconfig.json 'include' array.")

    except Exception as e:
        print(f"⚠️ An error occurred while running the script: {e}")

if __name__ == "__main__":
    # Ensure the user passed a file path argument
    if len(sys.argv) < 2:
        print("Usage error: You must provide a file path.")
        print("Example: python get_ts_errors.py frontend/src/components/MyComponent.tsx")
        sys.exit(1)
        
    target_file = sys.argv[1]
    get_typescript_errors(target_file)