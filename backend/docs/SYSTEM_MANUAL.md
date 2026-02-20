# FILEPATH: backend/docs/SYSTEM_MANUAL.md
# @file Flodock OS System Manual
# @version 3.0 (Fractal Architecture)
# @description The Technical Reference for the "Operating System" Core.

# 📘 FLODOCK OS: SYSTEM REFERENCE MANUAL

## 1. 🏛️ ARCHITECTURAL PHILOSOPHY
Flodock is a **Metadata-Driven Operating System** designed for infinite vertical scaling.

* **Level 3 (Old Way):** Hardcoded logic (`if user.role == 'admin'`).
* **Level 5 (Flodock Way):** Database-driven logic (`PolicyBinding` determines rules at runtime).

### The 4 Pillars of the Backend
1.  **The Core Kernel (`app/core/kernel`):** The "Nervous System." Manages Events, Transactional Outbox, and Registry.
2.  **The Meta-Kernel (`app/core/meta`):** The "Brain." Stores Definitions (Schema) and Policies (Logic).
    * **Fractal Features:** Sub-systems like `views` and `states` live in their own isolated modules under `features/`.
3.  **The Domains (`app/domains`):** The "Organs." Isolated business modules (User, Shipping, Inventory).
4.  **The API Layer (`app/api`):** The "Mouth." Exposes capabilities to the Frontend Cortex.

---

## 2. 🧠 THE META-KERNEL (Governance Engine)
The heart of the flexibility. It allows Admins to change system behavior without code deployment.

### A. The Fractal Modules
To prevent monolithic bloat, the Meta-Kernel is split into specialized engines:

#### 1. The Governance Engine (Policies)
* **Definition (`PolicyDefinition`):** A named bundle of logic rules (e.g., "Root Integrity Protocol").
    * *Logic:* JMESPath expressions (`host.email`).
    * *Action:* `BLOCK`, `WARN`, `TRIGGER_EVENT`.
* **Binding (`PolicyBinding`):** Connects a Policy to a Context.
    * *Structure:* `Domain` + `Scope` -> `Policy`.

#### 2. The View Engine (Interfaces)
* **Definition (`ViewDefinition`):** A UI Layout Asset (JSON).
    * *Engines:* `FORM_IO` (Forms), `TANSTACK_TABLE` (Grids).
* **Binding (`ViewBinding`):** Connects a View to a User Context.
    * *Structure:* `Domain` + `Flow` + `State` + `Role` -> `View`.

#### 3. The State Engine V2 (Process Flows)
* **Definition (`StateDefinition`):** An XState-compatible State Machine.
    * **Scope Aware:** A Domain (`USER`) can have multiple flows (`LIFECYCLE`, `ONBOARDING`).
    * *Structure:* Stores strict XState JSON (`initial`, `states`, `on`).

### B. The Execution Flow (The Enforcer)
When a User saves an entity (e.g., a User Profile):

1.  **Intercept:** `LogicInterceptor` (SQLAlchemy Hook) pauses the DB transaction.
2.  **Context:** It wraps the entity in a standard envelope:
    ```json
    { "host": { "email": "..." }, "meta": { ... } }
    ```
3.  **Evaluate:** The `PolicyEngine` runs JMESPath against this envelope.
    * *Fail-Open:* If a rule crashes (syntax error), it logs a Warning but allows the save to prevent system lockout.
4.  **Verdict:**
    * ✅ **Pass:** Transaction commits.
    * ⛔ **Block:** Transaction rolls back. API returns 400 Error.

---

## 3. 🔌 THE REGISTRY (Auto-Discovery)
We do not hardcode imports. The system "discovers" itself at startup.

### The Handshake Protocol (`@kernel_register`)
Every Domain Model must carry a passport.

```python
@kernel_register(domain_key="SHIPPING", friendly_name="Logistics")
class Container(Base): ...
ffect:

The ModuleLoader scans app/domains/ on boot.

It registers "SHIPPING" in the DomainRegistry.

It enables the API to serve GET /api/v1/meta/schema/SHIPPING automatically.

4. ⚡ THE EVENT SYSTEM (Transactional Outbox)
We guarantee Atomicity. We never send an email or webhook before the data is safe.

Action: Code calls kernel.publish(event="TRUCK:CREATED", payload={...}).

Buffer: The event is NOT sent. It is written to the system_outbox table in the same DB transaction as the data.

Commit: await db.commit() saves both the Truck and the Event.

Relay: The Background Worker (Prefect) picks up the Event from the table and executes side effects (Email/Webhook).

5. 🌊 THE WAVE PROTOCOL (Seeding)
To manage complex dependencies, we seed data in 3 waves.

Wave 1 (Static): Definitions, Enums, Policies (The Constitution). Must run first.

Wave 2 (Assets): Users, Trucks, Containers.

Wave 3 (History): Simulation of transactions (Dev Only).

Command: python seed.py --wave all


FILEPATH: backend/docs/API_CATALOG.md

```markdown
# FILEPATH: backend/docs/API_CATALOG.md
# @file Flodock API Reference
# @description The Contract between the Cortex (UI) and the Kernel (Backend).

# 📡 API CATALOG (v3.0)

## 🔐 1. AUTHENTICATION
**Base URL:** `/api/v1/auth`

| Method | Endpoint | Description | Payload |
| :--- | :--- | :--- | :--- |
| **POST** | `/login` | Exchange credentials for JWT. | `{ "email": "...", "password": "..." }` |

---

## ⚙️ 2. SYSTEM DISCOVERY
**Base URL:** `/api/v1/system`

| Method | Endpoint | Description | Response |
| :--- | :--- | :--- | :--- |
| **GET** | `/manifest` | **The Master Map.** Returns the full topology of Domains, Processes, and Routes for the Sidebar/Menu. | `{ "modules": [ { "key": "USER", "processes": [...] } ] }` |
| **GET** | `/capabilities` | **Introspection.** Returns available Actions, Triggers, and Widgets. | `{ "actions": [...], "widgets": [...] }` |

---

## 🧠 3. META-KERNEL (The Brain)
**Base URL:** `/api/v1/meta`

### A. Domain Introspection
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| **GET** | `/domains` | Returns a list of all active Domains (e.g., USER, SHIPPING) and their capabilities. Used for the "Catalog" screen. |
| **GET** | `/schema/{domain}` | **The Form Builder.** Returns the merged JSON Schema (Hard Columns + Custom Attributes + Rules) for generating UI Forms. |

### B. View Engine (Interfaces)
**Base URL:** `/api/v1/meta/views`

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| **GET** | `/` | List all UI Layouts (Views). |
| **POST** | `/` | Register a new View Definition. |
| **PATCH** | `/{id}` | Update an existing View. |
| **POST** | `/bindings` | Bind a View to a Context (`Domain` + `State` + `Role`). |
| **GET** | `/resolve` | **Runtime Resolver.** Returns the correct JSON View for a given context. |

### C. State Engine (Processes)
**Base URL:** `/api/v1/meta/states`

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| **POST** | `/` | Define a new State Machine flow (XState JSON). |
| **GET** | `/` | List all defined flows. |
| **GET** | `/{domain}/{scope}` | Get the specific XState definition for a Domain/Scope pair. |

### D. Governance Engine (Policies)
**Base URL:** `/api/v1/meta`

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| **GET** | `/policies` | List all defined "Laws" (PolicyDefinitions). |
| **POST** | `/policies` | Create a new Law. <br>**Body:** `{ "key": "safety_v1", "rules": [...] }` |
| **PATCH** | `/policies/{id}` | Update a Law's logic. |
| **GET** | `/bindings` | List active Policy Bindings. |
| **POST** | `/bindings` | Activate a Law for a Domain/Context. |

---

## 📝 DATA TYPES

### Policy Rule Structure (JSON)
```json
{
  "logic": "host.weight > 20000",
  "action": "BLOCK",
  "message": "Overweight Truck Detected."
}
Supported Scopes
GLOBAL: Applies everywhere.

DOMAIN: Applies to all saves in a module.
