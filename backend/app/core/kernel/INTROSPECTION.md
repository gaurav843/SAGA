# FILEPATH: backend/app/core/kernel/INTROSPECTION.md
# System Introspection & Capability Discovery

**Status:** 🟢 ACTIVE
**Version:** 1.0
**Owner:** Core Kernel Team

## 🧠 Philosophy
In the **Flodock Enterprise OS**, the Frontend is a "Dumb Terminal" that becomes smart only after asking the Backend for instructions.
We explicitly **FORBID** "Shared Contracts" (copy-pasting Enums from Python to TypeScript).

## 🔄 The Protocol
1.  **Source of Truth:** * **Enums:** `app.core.meta.constants` (Actions, Widgets, Types).
    * **Events:** `app.core.kernel.registry.event_registry` (Signals).
2.  **The Scanner:** `SystemManifest.get_capabilities()` in `system.py` uses Python Reflection (`inspect`) to read these sources dynamically.
3.  **The Exposure:** `GET /api/v1/system/capabilities` returns the JSON map.
4.  **The Consumer:** Frontend `SystemRegistry` fetches this at boot and configures the UI.

## 📦 The Payload Structure
The Kernel guarantees this response format. Frontend must handle it gracefully.

```json
{
  "version": "1.0",
  "actions": [
    { "key": "BLOCK", "label": "Block Transaction", "value": "BLOCK" },
    { "key": "TRIGGER_EVENT", "label": "Trigger Event", "value": "TRIGGER_EVENT" }
  ],
  "triggers": [
    { "key": "SAVE", "label": "On Save", "value": "SAVE" }
  ],
  "widgets": [
    { "key": "JSON_EDITOR", "label": "Json Editor", "value": "JSON_EDITOR" }
  ],
  "events": [
    {
      "key": "CONTAINER:GATE_IN",
      "description": "Fires when truck enters...",
      "payload_schema": { ... }
    }
  ]
}

