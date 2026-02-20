# FILEPATH: backend/ARCHITECTURE.md
# @file FLODOCK ENTERPRISE ARCHITECTURE (v2.6)
# @author The Principal Architect
# @description The immutable laws governing the Flodock Platform.
#              UPDATED: Added 'Level 7: The Autonomy Protocol' (OpenAPI Codegen).

# 🏛️ THE FLODOCK PROTOCOL

## 🛑 SECTION 1: THE FOUR PILLARS OF SUPREMACY
Every line of code committed to this repository must pass these four filters.

### 1. 🛡️ UNYIELDING QUALITY (The "Zero-Debt" Rule)
* **Philosophy:** Technical debt is forbidden. We do not write "fix me later" comments.
* **Requirement:** Every solution must handle edge cases, race conditions, and failures gracefully.
* **Validation:** If a junior developer cannot understand the logic in 30 seconds, rewrite it.

### 2. 🧩 ATOMIC MODULARITY (The "Lego" Rule)
* **Philosophy:** Monoliths are the enemy.
* **Requirement:** Every component must be isolated, testable, and reusable.
* **Validation:** If you have to touch File A to fix a bug in File B, the architecture is flawed.

### 3. 🔭 EXTREME OBSERVABILITY (The "Floodgate" Rule)
* **Philosophy:** A system that cannot be debugged is a broken system.
* **Requirement:** The system must narrate its own state using "Storyteller" logs.
* **Validation:** Can I reconstruct the crime scene solely from the logs?

### 4. 🚀 BEST PRACTICE SUPREMACY (The "Standard+" Rule)
* **Philosophy:** Meeting the standard is the bare minimum. We exceed it.
* **Requirement:** Embrace strong typing, Pydantic schemas, and strict generic patterns.

---

## ⚙️ SECTION 2: THE OPERATIONAL TRIAD
To ensure resilience, the system is decoupled into three distinct processes. These must run simultaneously during development.

| Process | Script | Role | Description |
| :--- | :--- | :--- | :--- |
| **1. THE ENGINE** | `start_db.bat` | **Infrastructure** | Holds the State. Runs PostgreSQL (Port 5432) and Redis (Port 6379). **Must start first.** |
| **2. THE BRAIN** | `start_dev.bat` | **API Server** | Processes Logic. Runs FastAPI/Uvicorn (Port 8000). Handles requests and commits to the Outbox. |
| **3. THE HEART** | `start_worker.bat` | **Background Worker** | Pumps Blood. Watches the `system_outbox` table and processes events (Audit, Email, Integration). |

> **Note:** Use `kill_dev.bat` for a "Nuclear" cleanup if ports get locked.

---

## 🌊 SECTION 3: THE WAVE PROTOCOL (Seeding)
To solve "Dependency Hell" in a distributed system, we utilize a **3-Phase Phased Execution** strategy.

### THE RULE
Every `seeds.py` file inside `app/domains/{domain}/` must implement specific functions corresponding to these waves.

| Phase | Function | Purpose | Rules |
| :--- | :--- | :--- | :--- |
| **🌊 1** | `async def seed_static(db)` | **Definitions** | Creates Enums, Configuration, Types. <br>⚠️ **MUST NOT** depend on other tables. |
| **🌊 2** | `async def seed_assets(db)` | **Inventory** | Creates Users, Containers, Trucks. <br>✅ Can read Wave 1 data. |
| **🌊 3** | `async def seed_history(db)` | **Simulation** | Creates Logs, Events, Transactions. <br>✅ Can read Wave 2 data. <br>⚠️ **DEV ONLY** (Skipped in Prod). |

### THE ORCHESTRATOR
The system is controlled by `backend/seed.py`.
* **Run All:** `python seed.py --wave all`
* **Run Specific:** `python seed.py --wave static`
* **Reset:** `python seed.py --reset` (Runs waves in reverse: 3 -> 2 -> 1).

---

## 🎫 SECTION 4: THE KERNEL PASSPORT (Registration)
We do not hardcode imports in `main.py`. Domains must **Self-Register** using the Kernel Passport protocol.

### 4.1 The Mechanism (`@kernel_register`)
Every Domain Model must carry a passport to be recognized by the Core Kernel.

```python
# app/domains/shipping/models.py
from app.core.kernel.decorators import kernel_register
from app.core.database.base import Base

@kernel_register(domain_key="SHIPPING", friendly_name="Logistics", scopes=["GATE_IN", "INSPECTION"]) # 👈 THE PASSPORT
class Container(Base):
    __tablename__ = "containers"
    # ...
    4.2 The Verification
On startup, the ModuleLoader scans for these passports.

It maps SHIPPING -> Container.

It allows the Logic Engine to target this domain (e.g., "Block Shipping if...").

It enables Meta-Kernel features (Custom Attributes) for this model.

🧠 SECTION 5: THE META-KERNEL (Adaptive Schema)
We utilize a Hybrid Data Architecture to allow runtime schema modification without database migrations.

5.1 The Hybrid Model
Hard Columns: Critical fields (ID, Status, CreatedAt) are real SQL columns.

Soft Attributes: Dynamic fields are stored in a JSONB column named custom_attributes.

The Definition: The meta_attribute_definitions table acts as the "Schema Registry" for the JSONB data, enforcing Types and Validation.

5.2 The Logic Engine (Governance)
The Interceptor: A SQLAlchemy Hook (before_flush) intercepts every save.

The Rule: It fetches active RuleDefinitions from the DB.

The Execution: It runs JMESPath logic against the entity.

The Scope: Rules can be Global or Scoped (e.g., specific to GATE_IN activity).

🤖 SECTION 6: THE AUTONOMY PROTOCOL (Level 7)
The Backend is the Sole Source of Truth. The Frontend is a derivative artifact.

6.1 The OpenAPI Contract
FastAPI automatically generates a strictly typed schema at: http://localhost:8000/api/v1/openapi.json

6.2 The Generator (The Robot)
We strictly forbid writing TypeScript Interfaces or API Clients manually.

The Tool: openapi-typescript-codegen

The Trigger: npm run gen (Frontend)

The Output: frontend/src/api/

6.3 The Workflow
Backend Change: You add a field phone_number to User in Pydantic.

Auto-Sync: The "Sync-Bot" (running in start_dev.bat) detects the change.

Regeneration: It rewrites frontend/src/api/models/User.ts instantly.

Frontend Update: IntelliSense immediately shows .phone_number as available.

⚠️ WARNING: Never edit files inside frontend/src/api/. They are overwritten on every save.


# FILEPATH: docs/architecture/meta_domain_v2.5.md
# @file: Meta Domain Architecture
# @author: The Engineer
# @version: 2.5.0 (Fractal Edition)
# @description: The definitive guide to the System's Central Nervous System.

# 📘 Meta Domain Architecture

**System Role:** The Central Nervous System. It defines *Structure* (Dictionary), *Law* (Governance), and *Flow* (Workflows) for the entire Enterprise OS.

---

## 1. 📖 The Dictionary (Data DNA)
* **Purpose:** Defines the "Vocabulary" of the system. It allows the creation of dynamic fields (`AttributeDefinitions`) on top of static code.
* **Key Concept: Schema Fusion**
    * The system merges **Static Code** (Hardcoded Registry) with **Dynamic Data** (Database Attributes) at runtime.
    * **Result:** A "Fused Schema" that lets the UI render both system fields (`id`, `email`) and user fields (`department_code`, `budget_limit`) seamlessly.
* **Core Components:**
    * **Backend Model:** `AttributeDefinition` (Stores metadata like `is_required`, `widget_type`).
    * **API Endpoint:** `GET /api/v1/meta/schema/{domain}` (The source of truth for the Editor).
    * **Frontend Usage:** Used by the **Workflow Editor** to populate the "Drag-and-Drop" field list.

## 2. ⚖️ The Governance Engine (The Law)
* **Purpose:** Enforces logic and security rules across the platform. It is the "Guard Rail" system.
* **Key Concept: Policy Definition**
    * A Policy is a bundle of Rules (Logic + Effect).
    * **Logic:** Written in `JMESPath` (e.g., `host.amount > 5000`).
    * **Effect:** Actions like `BLOCK`, `WARN`, or `REQUIRE_APPROVAL`.
* **Resolution Strategies:**
    * `ALL_MUST_PASS`: Strict compliance.
    * `AT_LEAST_ONE`: Flexible compliance.
    * `PRIORITY_OVERRIDE`: High-ranking policies win.
* **Core Components:**
    * **Backend Model:** `PolicyDefinition` (Versioned logic).
    * **Engine:** `PolicyEngine` (Executes the JMESPath logic).

## 3. 📦 Group Policy (Bundles)
* **Purpose:** Enterprise-grade management. Instead of assigning 50 individual policies to a User, you assign 1 Group.
* **Key Concept: The Bundle**
    * Groups are collections of `PolicyKeys` (e.g., "SOC2_COMPLIANCE_BUNDLE" contains "PASSWORD_COMPLEXITY", "MFA_REQUIRED", "AUDIT_LOGGING").
    * **Ordering:** The group defines the execution order of policies.
* **Core Components:**
    * **Backend Model:** `PolicyGroup`.
    * **Service:** `GroupService` (Manages membership and uniqueness).

## 4. 🎛️ The Switchboard (Jurisdiction)
* **Purpose:** The "Traffic Controller" that connects **Laws** (Policies) to **Subjects** (Domains/Scopes).
* **Key Concept: Binding**
    * A Binding says: *"Apply [Policy X] to [User Domain] during [Edit Scope]"*.
    * It supports **Polymorphism**: Can bind a single Policy OR a Policy Group.
* **Targeting:**
    * **Domain:** `USER`, `INVOICE`, `PROJECT`.
    * **Scope:** `GLOBAL`, `CREATE_FLOW`, `EDIT_FLOW`.
* **Core Components:**
    * **Backend Model:** `PolicyBinding`.
    * **Logic:** The `MetaService` checks bindings whenever a resource is accessed or modified.

## 5. 🎬 The Workflow Engine (Process)
* **Purpose:** Manages the Lifecycle of entities (State Machines).
* **Key Concept: The Fractal Wizard**
    * **Editor:** A visual tool to design forms and steps (`frontend/src/domains/meta/features/states`).
    * **Player:** A runtime engine that renders the designed forms (`WizardPlayer.tsx`).
    * **AI Auto-Pilot:** A generic intelligence that can generate schemas based on the **Dictionary** and **Widget Registry**.
* **Structure:**
    * **States:** `DRAFT`, `REVIEW`, `ACTIVE`.
    * **Transitions:** `SUBMIT`, `APPROVE`, `REJECT`.
    * **Widgets:** The UI blocks (`SMART_GRID`, `TABS`, `TEXT_INPUT`) used to build the forms.

---

### 🔗 System Interconnectivity

1.  **Dictionary** supplies Fields to the **Workflow Editor**.
2.  **Dictionary** supplies Context to the **AI Cortex**.
3.  **Groups** bundle Policies for **Governance**.
4.  **Switchboard** binds Governance/Groups to Domains.
5.  **Switchboard** controls which **Workflows** are active.
6.  **AI Cortex** generates Schema JSON for the **Workflow Editor**.