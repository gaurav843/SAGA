import tkinter as tk
import tempfile
import os
import time
import traceback
import win32clipboard
import win32con
from ctypes import c_char, addressof, memmove, sizeof, Structure, c_int, c_long

# --- Windows C Structure for File Copying ---
class DROPFILES(Structure):
    _fields_ = [
        ("pFiles", c_long),
        ("pt", c_long * 2),
        ("fNC", c_int),
        ("fWide", c_int),
    ]

def clip_files(file_list):
    """Puts a file into the clipboard so it can be pasted as an attachment."""
    offset = sizeof(DROPFILES)
    # Calculate total size of filenames + null terminators
    length = sum(len(f) + 1 for f in file_list) + 1
    size = offset + length * 2  # *2 for Unicode chars

    # FIX: Use c_char (Byte) instead of c_char_p (Pointer)
    buf = (c_char * size)()
    
    df = DROPFILES()
    df.pFiles = offset
    df.fWide = 1 # Unicode mode
    
    # FIX: Use addressof(buf) directly (Arrays are their own address)
    memmove(addressof(buf), addressof(df), sizeof(DROPFILES))
    
    # Copy filenames to buffer
    ptr = addressof(buf) + offset
    for fname in file_list:
        fname_bytes = fname.encode('utf-16-le') + b'\0\0'
        memmove(ptr, fname_bytes, len(fname_bytes))
        ptr += len(fname_bytes)
    
    # Double null terminator
    memmove(ptr, b'\0\0', 2)

    # Retry mechanism
    for i in range(5):
        try:
            win32clipboard.OpenClipboard()
            win32clipboard.EmptyClipboard()
            # Pass the raw bytes to Windows
            win32clipboard.SetClipboardData(win32clipboard.CF_HDROP, bytes(buf))
            win32clipboard.CloseClipboard()
            return True 
        except Exception as e:
            print(f"⚠️ Clipboard busy, retrying ({i+1}/5)...")
            time.sleep(0.1)
    
    print("❌ Could not open clipboard after 5 attempts.")
    return False

class AutoFileApp:
    def __init__(self, root):
        self.root = root
        self.root.title("Paste -> File (Fixed v2)")
        self.root.geometry("400x200")
        self.root.attributes("-topmost", True)
        
        self.frame = tk.Frame(root, bg="#333333")
        self.frame.pack(fill="both", expand=True)

        self.lbl_icon = tk.Label(self.frame, text="📋", font=("Segoe UI", 40), bg="#333333", fg="white")
        self.lbl_icon.pack(pady=(30, 10))

        self.lbl_text = tk.Label(self.frame, text="Click & Press Ctrl+V", font=("Segoe UI", 12, "bold"), bg="#333333", fg="#cccccc")
        self.lbl_text.pack()

        self.root.bind('<Control-v>', self.handle_paste)

    def handle_paste(self, event):
        try:
            try:
                text_content = self.root.clipboard_get()
            except tk.TclError:
                self.flash_feedback("⚠️ Clipboard not text!", "#FFC107") 
                return

            if not text_content:
                return

            timestamp = int(time.time())
            filename = f"clipboard_dump_{timestamp}.txt"
            temp_dir = tempfile.gettempdir()
            filepath = os.path.join(temp_dir, filename)

            with open(filepath, "w", encoding="utf-8") as f:
                f.write(text_content)

            print(f"📄 Saved temp file: {filepath}")

            # Force release locks
            self.root.update() 
            time.sleep(0.1) 

            success = clip_files([filepath])

            if success:
                self.flash_feedback("✅ FILE READY! Paste Now.", "#4CAF50") 
            else:
                self.flash_feedback("❌ System Clipboard Error", "#F44336") 

        except Exception:
            traceback.print_exc()
            self.flash_feedback("❌ Script Error", "#F44336")

    def flash_feedback(self, message, color):
        original_bg = "#333333"
        self.frame.config(bg=color)
        self.lbl_icon.config(bg=color, text="📂" if color == "#4CAF50" else "⚠️")
        self.lbl_text.config(bg=color, text=message, fg="white")
        self.root.update()
        
        self.root.after(1500, lambda: self.reset_ui(original_bg))

    def reset_ui(self, bg_color):
        self.frame.config(bg=bg_color)
        self.lbl_icon.config(bg=bg_color, text="📋")
        self.lbl_text.config(bg=bg_color, text="Click & Press Ctrl+V", fg="#cccccc")

if __name__ == "__main__":
    root = tk.Tk()
    app = AutoFileApp(root)
    root.mainloop()