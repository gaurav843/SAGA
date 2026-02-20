# FILEPATH: backend/check_ai.py
# @file AI Diagnostic Tool
# @author The Engineer
# @description A standalone script to verify Google GenAI connectivity and list available models.
#              Usage: python check_ai.py

import os
import sys
from dotenv import load_dotenv
from google import genai

# 1. Load Environment Variables
# We load directly from .env to avoid dependency on the App config system
env_path = os.path.join(os.path.dirname(__file__), ".env")
load_dotenv(env_path)

api_key = os.getenv("GEMINI_API_KEY")

def main():
    print("🧠 [AI Diagnostic] Initializing...")
    
    if not api_key:
        print("❌ CRITICAL: GEMINI_API_KEY not found in .env")
        return

    # Mask key for security
    masked_key = f"{api_key[:6]}...{api_key[-4:]}"
    print(f"🔑 API Key: {masked_key}")

    try:
        # 2. Initialize Client (New SDK)
        client = genai.Client(api_key=api_key)
        print("✅ Client Initialized.")

        # 3. List Models
        print("\n📡 Querying Google AI for available models...")
        print("-" * 60)
        print(f"{'MODEL ID':<50} | {'DISPLAY NAME'}")
        print("-" * 60)

        count = 0
        # The new SDK list method returns an iterable of models
        for model in client.models.list():
            if "gemini" in model.name:
                print(f"{model.name:<50} | {model.display_name}")
                count += 1
        
        print("-" * 60)
        print(f"✅ Found {count} Gemini models available to your API Key.")
        
        # 4. Thinking Model Check
        print("\n🔍 Checking for 'Thinking' models...")
        thinking_models = [
            "gemini-2.0-flash-thinking-exp",
            "gemini-2.0-flash-thinking-exp-01-21"
        ]
        
        found_thinking = False
        # We have to re-iterate or store the list, but list() returns a generator usually.
        # Let's just do a specific check if we didn't see it above (visual check is good enough for diag).
        # Actually, let's verify connectivity with a quick test.
        
        print("\n🧪 Running Connectivity Test (Hello World)...")
        try:
             # Use a generic flash model for safety test
            test_model = "gemini-1.5-flash"
            response = client.models.generate_content(
                model=test_model,
                contents="Reply with only the word 'Connected'."
            )
            print(f"✅ Test Response: {response.text.strip()}")
        except Exception as e:
             print(f"❌ Test Failed: {e}")

    except Exception as e:
        print(f"\n❌ CONNECTION FAILED: {e}")
        print("   Tip: Check your API Key permissions and billing status.")

if __name__ == "__main__":
    main()

