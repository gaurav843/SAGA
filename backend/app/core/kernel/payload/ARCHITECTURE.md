# Core Payload: The Enrichment Factory

**Status:** 🟢 READY (Engine Built)
**Context:** Infrastructure / CDC & Serialization

## 🧠 Description
The Payload engine handles **Change Data Capture (CDC)**. It watches SQLAlchemy objects and generates standardized JSON envelopes containing "Before State", "After State", and "Enriched Context".

## ✅ What is Done
1.  **Payload Factory (`factory.py`):**
    * The `ChangeContext` manager.
    * Calculates Deltas (Diffs).
    * Detects Impact (Which tables were touched).
2.  **Strategy Manager (`manager.py`):**
    * Allows modules to register custom enrichment logic.

## 🚧 What is Left (The Gap)
1.  **Strategy Implementation:**
    * **Missing:** We need to write the specific function `enrich_container_payload(container)` and register it.
    * *Result:* Events currently only contain raw table data, missing the "Meta-Data" (Custom Attributes).

