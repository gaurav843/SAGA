# Core Registry: The System Phonebook

**Status:** 🟢 OPERATIONAL (v2.5)
**Context:** Infrastructure / Discovery Service

## 🧠 Description
The Registry is the central catalog for "What Exists" in the system. It uses a clean separation of concerns:
1.  **Event Registry:** A static catalog of all system signals (e.g., `CONTAINER.GATE_IN`).
2.  **Domain Registry:** A dynamic roster of active Business Modules (e.g., `USER`, `SHIPPING`).

## ✅ What is Done

### 1. The Handshake Protocol (`@kernel_register`)
We have successfully implemented the "Passport" system. Domains self-register at startup without hardcoded wiring in the Kernel.

* **Mechanism:** `app/core/kernel/decorators.py`
* **Trigger:** When `app/main.py` imports `load_domains`, it imports the domain's `__init__.py`, which imports `models.py`.
* **Action:** The `@kernel_register` decorator executes, creating a `DomainContext` and pushing it to the singleton `domain_registry`.

### 2. Active Registrations
* **Auth Domain (`USER`):** Fully registered.
    * **Scopes:** `LOGIN`, `REGISTER`, `UPDATE`, `ADMIN_OVERRIDE`.
    * **Schema:** Auto-reflected from SQLAlchemy `User` model.
    * **Context:** Provides `entity_id` and `timestamp` to the Logic Engine.

### 3. Registry Manager (`manager.py`)
* The Singleton (`domain_registry`) allows the API to query:
    * `get_all_summaries()`: Populates the Meta Studio Dropdowns.
    * `get_schema("USER")`: Returns the JSON structure for the Form Builder.

## 🔄 The Discovery Flow

1.  **Boot:** FastAPI starts -> calls `load_domains()`.
2.  **Scan:** Loader finds `app/domains/auth`.
3.  **Import:** Loader imports `app.domains.auth.models`.
4.  **Register:** `@kernel_register` fires -> `domain_registry.register("USER", ...)`.
5.  **Serve:** Frontend calls `GET /api/v1/meta/domains`.
6.  **Response:** API asks Registry for summaries -> Returns `[{ key: "USER", label: "Identity..." }]`.

## 🚧 Future Roadmap
1.  **Process Registry:** Define workflows (Process -> Step -> Action) explicitly in the registry to power a "Flow Builder" UI.

