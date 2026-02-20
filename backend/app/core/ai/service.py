# FILEPATH: backend/app/core/ai/service.py
# @file: AI Service (The Cortex)
# @author: The Engineer
# @description: Centralized Gateway to Google GenAI.
# @security-level: LEVEL 10 (Context-Aware & Mode-Switching)
# @updated: Added Multi-Mode Support (Wizard/Job/Chat) and System Instruction parsing.

import logging
import json
from typing import List, Dict, Any

from google import genai
from google.genai import types

from app.core.config import settings

logger = logging.getLogger("core.ai")

class AIService:
    """
    The Intelligence Layer.
    Wraps the LLM with "Context-Aware" logic to ensure output matches System Reality.
    Now supports multiple cognitive modes.
    """
    def __init__(self):
        self.api_key = settings.GEMINI_API_KEY
        self.client = None
        
        if self.api_key:
            try:
                # Initialize the new GenAI Client
                self.client = genai.Client(api_key=self.api_key)
                logger.info("🧠 [AI] Gemini 3.0 Cortex (GenAI SDK) Initialized.")
            except Exception as e:
                logger.error(f"❌ [AI] Initialization Failed: {e}")
        else:
            logger.warning("⚠️ [AI] No API Key found. AI features will be disabled.")

    async def generate_schema(self, prompt: str, domain_context: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Generates content based on User Intent + System Context + Operation Mode.
        """
        if not self.client:
            raise ValueError("AI Service is not configured (Missing API Key).")

        # 1. ANALYZE CONTEXT & MODE
        db_fields = []
        ui_widgets = []
        governance_rules = []
        workflows = []
        
        # Default to WIZARD if no instruction found
        command_mode = "WIZARD" 

        for item in domain_context:
            kind = item.get("kind", "DATABASE_FIELD")
            
            if kind == "UI_COMPONENT":
                ui_widgets.append(item)
            elif kind == "GOVERNANCE_MANIFEST":
                governance_rules.append(item)
            elif kind == "REFERENCE_WORKFLOW":
                workflows.append(item)
            elif kind == "SYSTEM_INSTRUCTION":
                # ⚡ DETECT MODE FROM FRONTEND
                command_mode = item.get("mode", "WIZARD")
            elif kind == "DATABASE_FIELD":
                db_fields.append(item)

        logger.info(f"🧠 [AI] Mode: {command_mode} | Context: {len(db_fields)} Fields, {len(ui_widgets)} Widgets, {len(governance_rules)} Rules.")

        # 2. CONSTRUCT SYSTEM PROMPT BASED ON MODE
        system_instruction = ""

        if command_mode == "FREE_CHAT":
            # --- CHAT MODE ---
            system_instruction = f"""
            You are the "Cortex", the intelligent architect of the Flodock Enterprise OS.
            Your goal is to answer the user's questions or provide architectural advice.
            
            === AVAILABLE CONTEXT ===
            The user has selected the following system components for reference:
            
            1. GOVERNANCE (Rules):
            {json.dumps(governance_rules, indent=2)}
            
            2. WORKFLOWS (Processes):
            {json.dumps(workflows, indent=2)}
            
            3. DATA SCHEMA:
            {json.dumps(db_fields, indent=2)}
            
            INSTRUCTIONS:
            - Be concise, professional, and technical.
            - If asking about design, refer to the available components and rules.
            - Do NOT generate JSON unless asked. Speak in natural language (Markdown).
            """

        else:
            # --- WIZARD / JOB / GOVERNANCE MODES ---
            governance_section = ""
            if governance_rules:
                governance_section = f"""
                === 3. GOVERNANCE & COMPLIANCE (HIGHEST PRIORITY) ===
                🚨 YOU ARE STRICTLY BOUND BY THE FOLLOWING POLICIES. 
                {json.dumps(governance_rules, indent=2)}
                """

            reference_section = ""
            if workflows:
                reference_section = f"""
                === 4. REFERENCE WORKFLOWS (PATTERNS) ===
                Use these existing flows as a style guide:
                {json.dumps(workflows, indent=2)}
                """

            system_instruction = f"""
            You are a UI Architect for an Enterprise OS.
            Your goal is to convert user intent into a 'Form Schema JSON' for Ant Design Pro.
            
            === 1. THE DATABASE (SOURCE OF TRUTH) ===
            {json.dumps(db_fields, indent=2)}
            
            === 2. THE UI TOOLKIT (ALLOWED COMPONENTS) ===
            You must ONLY use components listed here. Do not hallucinate 'InputText' or 'TextBox'.
            {json.dumps(ui_widgets, indent=2)}
            
            {governance_section}
            {reference_section}
            
            === RULES ===
            1. Output ONLY a valid JSON array. No markdown, no explanations.
            2. Schema Format: {{ "name": "field_key", "label": "Label", "component": "ComponentKey", "required": boolean }}
            3. Use snake_case for field names.
            """

        # 3. EXECUTE GENERATION
        try:
            response = await self.client.aio.models.generate_content(
                model='gemini-2.0-flash-exp', 
                contents=f"{system_instruction}\n\nUSER REQUEST: {prompt}",
                config=types.GenerateContentConfig(
                    temperature=0.4 if command_mode == "FREE_CHAT" else 0.2, 
                    top_p=0.95,
                    top_k=40,
                )
            )
            
            clean_text = response.text.replace("```json", "").replace("```", "").strip()
            
            # 4. PARSE OUTPUT
            if command_mode == "FREE_CHAT":
                # For chat, we return a structured wrapper so the frontend still receives a List[Dict]
                return [{
                    "role": "cortex",
                    "type": "message",
                    "content": clean_text
                }]
            else:
                # For Wizard/Job, we enforce JSON
                try:
                    schema = json.loads(clean_text)
                    
                    # Heuristic fallback if wrapped in markdown
                    if not isinstance(schema, (list, dict)):
                        raise ValueError("Invalid JSON structure")
                        
                    if isinstance(schema, dict) and "fields" in schema:
                        schema = schema["fields"]
                    
                    if not isinstance(schema, list):
                        # Attempt to fix single object return
                        schema = [schema]

                    return schema
                    
                except json.JSONDecodeError:
                    # Fallback logic for partial JSON
                    start = clean_text.find('[')
                    end = clean_text.rfind(']') + 1
                    if start != -1 and end != -1:
                        return json.loads(clean_text[start:end])
                    else:
                        logger.error(f"AI Response Dump: {clean_text}")
                        raise ValueError("Could not parse JSON from AI response.")

        except Exception as e:
            logger.error(f"🔥 [AI] Generation Failed: {e}")
            raise ValueError(f"AI Processing Error: {str(e)}")

ai_service = AIService()

