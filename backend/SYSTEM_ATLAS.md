# 🗺️ SYSTEM ATLAS: `backend/`
**Generated:** 2026-02-20 13:37

---
### 📄 `backend/alembic/env.py`
**Components & Logic:**

- ƒ **`load_all_domain_models`**
    > *Scans the 'app/domains' directory.*
    * pkgutil.iter_modules returns (module_loader, name, ispkg)
    * Construct the potential module path (e.g., app.domains.shipping.models)
    * Check if models.py physically exists (Prevent Import Errors)
    * This is fine. Not every domain needs a database table.
    * Import the module. This executes the Class definitions,
    * registering them with the global Base.metadata.
    * **CRITICAL:** If a model file exists but crashes, we must stop migrations.

- ƒ **`run_migrations_offline`**
    > *Run migrations in 'offline' mode.*
- ƒ **`do_run_migrations`**
- ƒ **`run_migrations_online`**
    > *Run migrations in 'online' mode.*

---
### 📄 `backend/app/api/v1/auth.py`
**Components & Logic:**

- ƒ **`login`**
    > *OAuth2 compatible token login.*
    * **1.** Find User by Email
    * **2.** Validate Existence
    * **3.** GUARDRAIL: System User Check (Hard Logic)
    * **4.** Verify Password
    * **5.** Check Active Status
    * --- 🛡️ KERNEL GOVERNANCE (The "Brain") ---
    * We ask the Logic Engine if this specific user is allowed to LOGIN right now.
    * --- 📝 STATE UPDATE & AUDIT (The "Memory") ---
    * Update Last Login (Triggers a DB Write)
    * Publish Audit Event to SystemOutbox
    * **⚡ FIX:** Added partition_key for Kafka Ordering
    * Commit Transaction (Saves User Update + Outbox Event atomically)
    * **6.** Mint Token


### 📄 `backend/app/api/v1/meta.py`
**Components & Logic:**

- ƒ **`list_policies`**
- ƒ **`create_policy`**
- ƒ **`update_policy`**
- ƒ **`dry_run_policy`**
- ƒ **`get_policy_history`**
- ƒ **`restore_policy_version`**
- ƒ **`list_bindings`**
- ƒ **`create_binding`**
- ƒ **`update_binding`**
- ƒ **`delete_binding`**
- ƒ **`create_attribute`**
- ƒ **`update_attribute`**
- ƒ **`delete_attribute`**
- ƒ **`list_rules`**
- ƒ **`create_rule`**
- ƒ **`get_domain_schema`**
    > *SCHEMA FUSION ENDPOINT.*
- ƒ **`list_domains`**
    * **1.** Dynamic Domains from DB (The "Wild" Ones)
    * Allows discovery of domains that exist only via custom attributes
    * **2.** System Domains from Registry (The "Official" Ones)
    * **⚡ FIX:** Passing 'db' session as required by the new Manager to fetch Type Defs
    * **3.** Merge Strategy
    * A. Add Registered Domains (Source of Truth)
    * Pydantic model dump to dictionary for mutability
    * B. Add Dynamic Domains (if any found that aren't registered)


### 📄 `backend/app/api/v1/resource.py`
**Components & Logic:**

- ƒ **`deep_merge`**
    > *Recursively merges dictionaries to preserve nested data.*
- ƒ **`get_domain_context`**
    > *Retrieves the full Registry Contract for a domain.*
- ƒ **`validate_and_cast`**
    > *Enforces Strict Typing for Dynamic Fields based on AttributeDefinition.*
- ƒ **`sanitize_payload`**
    > *1. Splits payload into Columns vs Extras.*
    * Check if the model actually has the configured container
    * **1.** Fetch Dynamic Definitions (The Law)
    * **⚡ SECURITY:** Transformation Pipeline
    * --- A. STATIC COLUMNS ---
    * ⚡ METADATA DRIVEN PROTECTION
    * If the Model says "is_system", we skip it. No magic strings.
    * Fallback: If DB controls the default (e.g. auto-increment, triggers), skip unless explicit.
    * --- B. DYNAMIC ATTRIBUTES ---
    * Dynamic Attributes marked as system are also protected
    * Allow bulk update of the container itself if passed directly
    * If strict mode is off, we might allow ad-hoc extras, but for now we only allow defined attributes
    * or explicit updates to the container.
    * Store unknown fields in extras?
    * Policy: If it's not a column and not in dictionary, we treat it as ad-hoc extra.

- ƒ **`serialize_model`**
    * **1.** Flatten Columns
    * **2.** Flatten Dynamic Container (e.g. preferences)
    * Columns take precedence, so only add if not already present

- ƒ **`check_availability`**
    > *Checks if a value exists in the database.*
    * ⚡ META-TYPE CHECK: Availability not supported for CONFIG
    * Config keys are unique, so we check SystemConfig
    * **1.** Column Existence Check
    * **2.** PERFORMANCE GUARDRAIL
    * **3.** Execution
    * Case-insensitive check for emails/strings

- ƒ **`list_resources`**
    > *UNIVERSAL SEARCH ENGINE.*
    * ⚡ BRANCH 1: CONFIG DOMAIN (Global)
    * Return list of SystemConfig items, potentially filtered by category
    * Simple filter support for Config
    * Serializer for Config
    * ⚡ BRANCH 2: STANDARD DOMAIN (Entity)
    * **1.** Start with Base Query
    * **2.** Extract Filters (Exclude Control Params)
    * **3.** Apply Tri-Layer Filtering logic
    * LAYER 1: Physical Column
    * LAYER 2: Dynamic Attribute (JSONB)
    * ⚡ Checks the configured container (custom_attributes OR preferences)
    * Safe JSONB lookup using SQLAlchemy text
    * LAYER 3: Ignore unknown params (Safety)
    * **4.** Calculate Total (Filtered)
    * **5.** Apply Pagination

- ƒ **`get_resource`**
    * ⚡ META-TYPE CHECK
    * Config items usually accessed by Key, but if ID provided:

- ƒ **`create_resource`**
    * ⚡ BRANCH 1: CONFIG DOMAIN
    * Create a new SystemConfig Entry
    * Payload expected: { key, value, label, category, type }
    * Check existence
    * ⚡ HOT SWAP TRIGGER
    * ⚡ BRANCH 2: STANDARD DOMAIN

- ƒ **`update_resource`**
    * ⚡ BRANCH 1: CONFIG DOMAIN
    * ⚡ HOT SWAP TRIGGER
    * ⚡ BRANCH 2: STANDARD DOMAIN
    * ⚡ DYNAMIC CONTAINER MERGE LOGIC

- ƒ **`delete_resource`**
    * ⚡ META-TYPE CHECK: Config Deletion
    * ⚡ HOT SWAP TRIGGER


### 📄 `backend/app/api/v1/system.py`
**Components & Logic:**

- ƒ **`get_system_manifest`**
    > *BOOTSTRAP ENDPOINT.*
    * ⚡ ACQUIRE ACTOR CONTEXT (For RBAC)
    * The ContextMiddleware has already hydrated this from the JWT.
    * Pass actor to kernel to filter navigation nodes

- ƒ **`get_system_capabilities`**
    > *THE AI MANIFEST.*
    * **1.** Fetch Base Capabilities (Static Enums)
    * **2.** Augment with Context Schema
    * **3.** ⚡ HYDRATE DYNAMIC WIDGETS (The Upgrade)
    * We replace the static enum list with the rich DB definitions if available.
    * Transform to strict schema for AI consumption
    * Fallback (or empty if none registered)
    * We keep the static enum as a fallback if the DB is empty
    * Fail open: Return static caps, don't crash the endpoint

- ƒ **`get_system_pulse`**
- ƒ **`list_domains`**
- ƒ **`patch_domain`**
- ƒ **`list_circuits`**
    > *Fetches raw Circuit Breakers.*
    * Simple serialization

- ƒ **`set_circuit_state`**
    > *Directly toggles a switch in the Hypervisor.*
- ƒ **`list_config`**
- ƒ **`update_config`**

### 📄 `backend/app/api/v1/workflow.py`
**Components & Logic:**

- 📦 **`UIConfig`**
- 📦 **`TransitionOption`**
- 📦 **`TransitionRequest`**
- 📦 **`TransitionResponse`**
- ƒ **`_load_machine_and_entity`**
    > *Shared logic to hydrate context with Scope support.*
    * **1.** Resolve Model
    * **2.** Fetch Entity
    * **3.** Fetch Definition

- ƒ **`get_transition_options`**
    > *Menu Builder. Evaluates Governance Rules and returns the strictly formatted Dumb UI manifest.*
    * Prepare Context Envelope for Governance Check
    * **1.** 🛡️ GOVERNANCE CHECK (The Handshake)
    * **2.** 🎨 VISUAL HEURISTICS (Backend drives the UI)
    * Override with explicit XState metadata if available
    * **3.** BUILD OPTION

- ƒ **`execute_transition`**
    > *Executes a State Transition with Context.*
    * **1.** 🛡️ PRELIMINARY DRY RUN (Governance Validation before DB touch)
    * Simulate the payload being applied to the context envelope for evaluation
    * We return a List of errors so the frontend Array.isArray(detail) parsing works
    * **2.** 💾 DYNAMIC DATA PERSISTENCE LAYER
    * A. Dynamically fetch Primary Keys
    * B. Combine PKs with standard system fields
    * **3.** 🛡️ ATTACH SIDECAR (For Interceptor & CDC Events)
    * Trigger the status change (marks object as dirty for SQLAlchemy)
    * ⚡ COMMITTING THE DB TRIGGERS THE INTERCEPTOR (Final Logic Pass & Outbox)


---
### 📄 `backend/app/core/ai/router.py`
**Components & Logic:**

- 📦 **`AIRequest`**
- ƒ **`generate_schema`**
    * We pass context to the service, which extracts the 'mode' from the SYSTEM_INSTRUCTION item


### 📄 `backend/app/core/ai/service.py`
**Components & Logic:**

- 📦 **`AIService`**
    > *The Intelligence Layer.*
  * 🔹 **`__init__`**
      * Initialize the new GenAI Client

  * 🔹 **`generate_schema`**
      > *Generates content based on User Intent + System Context + Operation Mode.*
      * **1.** ANALYZE CONTEXT & MODE
      * Default to WIZARD if no instruction found
      * ⚡ DETECT MODE FROM FRONTEND
      * **2.** CONSTRUCT SYSTEM PROMPT BASED ON MODE
      * --- CHAT MODE ---
      * --- WIZARD / JOB / GOVERNANCE MODES ---
      * **3.** EXECUTE GENERATION
      * **4.** PARSE OUTPUT
      * For chat, we return a structured wrapper so the frontend still receives a List[Dict]
      * For Wizard/Job, we enforce JSON
      * Heuristic fallback if wrapped in markdown
      * Attempt to fix single object return
      * Fallback logic for partial JSON


---
### 📄 `backend/app/core/config.py`
**Components & Logic:**

- 📦 **`Settings`**

### 📄 `backend/app/core/context.py`
**Components & Logic:**

- 📦 **`GlobalContext`**
    > *Static Accessor for the Runtime Context.*
  * 🔹 **`get_request_id`**
      > *Returns the unique trace ID for the current operation.*
  * 🔹 **`set_request_id`**
      > *Sets the trace ID. usually called by Middleware.*
  * 🔹 **`get_current_user`**
      > *Returns the currently authenticated user as a dictionary.*
  * 🔹 **`set_current_user`**
      > *Hydrates the user context.*
  * 🔹 **`get_actor_id`**
      > *Helper to safely get the User ID (0 for System).*
  * 🔹 **`is_system_user`**
      > *True if running as background worker or system process.*
  * 🔹 **`set_admin_mode`**
      > *Allows bypassing certain policies (Emergency Override).*
  * 🔹 **`is_admin_mode`**

---
### 📄 `backend/app/core/database/base.py`
**Components & Logic:**

- 📦 **`Base`**
    > *The shared registry for all database models.*

### 📄 `backend/app/core/database/session.py`
**Components & Logic:**

- ƒ **`get_db`**

---
### 📄 `backend/app/core/kernel/actions.py`
**Components & Logic:**

- 📦 **`ActionType`**
    > *The available effects a Rule can trigger.*
- 📦 **`LogicResult`**
    > *The 'Report Card' returned by the Logic Engine after checking all rules.*
  * 🔹 **`merge`**
      > *Helper to combine results from multiple rule checks.*

---
### 📄 `backend/app/core/kernel/context/base.py`
**Components & Logic:**

- 📦 **`ContextField`**
- 📦 **`ContextProvider`**
    > *The Plugin Interface for Environmental Context.*
  * 🔹 **`namespace`**
      > *The root key for this context (e.g. 'system', 'actor').*
  * 🔹 **`provide_schema`**
      > *INTROSPECTION: Returns the list of available variables.*
  * 🔹 **`provide_runtime`**
      > *EXECUTION: Returns the actual values at runtime.*

### 📄 `backend/app/core/kernel/context/config.py`
**Components & Logic:**

- 📦 **`ConfigProvider`**
    > *The Bridge between the System Config Database and the Policy Engine.*
  * 🔹 **`namespace`**
  * 🔹 **`provide_schema`**
      > *INTROSPECTION: Allows the Frontend Rule Builder to see available Config Keys.*
  * 🔹 **`provide_runtime`**
      > *EXECUTION: Returns the actual Key-Value pairs for the Logic Engine.*
      * **1.** Check Cache
      * **2.** Cache Miss -> Fetch from DB

  * 🔹 **`_is_cache_valid`**
      > *Checks if the RAM cache is fresh.*
  * 🔹 **`_refresh_cache`**
      > *Reloads the configuration from the database.*
      * ⚡ FETCH ALL ACTIVE CONFIGS
      * key is UPPERCASE by convention in SystemConfig
      * Update State

  * 🔹 **`invalidate`**
      > *EXTERNAL SIGNAL: Called by SystemOutbox Consumer or API to force a refresh.*

### 📄 `backend/app/core/kernel/context/defaults.py`
**Components & Logic:**

- 📦 **`SystemProvider`**
    > *Provides the Space-Time Continuum (Time, Env, Version).*
  * 🔹 **`namespace`**
  * 🔹 **`provide_schema`**
  * 🔹 **`provide_runtime`**
- 📦 **`ActorProvider`**
    > *Provides the Agent of Change (User, Role).*
  * 🔹 **`namespace`**
  * 🔹 **`provide_schema`**
  * 🔹 **`provide_runtime`**
      * Fallback for Background Workers / Seeds


### 📄 `backend/app/core/kernel/context/manager.py`
**Components & Logic:**

- 📦 **`ContextManager`**
    > *Singleton Orchestrator.*
  * 🔹 **`__init__`**
  * 🔹 **`register`**
      > *Plugins call this to hook into the Kernel.*
  * 🔹 **`get_schema`**
      > *Used by API to serve capabilities to Frontend.*
  * 🔹 **`resolve`**
      > *Used by LogicInterceptor to build the Envelope.*
      * In strict fractal design, failures in context should not crash the transaction.
      * We log and return empty for that namespace.


---
### 📄 `backend/app/core/kernel/decorators.py`
**Components & Logic:**

- ƒ **`kernel_register`**
    > *Decorator to register a SQLAlchemy Model as a Kernel Business Domain.*
    * **1.** Prepare Scopes (Level 6 Compliance Patch)
    * ⚡ SMART DEFAULTING
    * We interpret the legacy string list into typed configurations
    * Master Lifecycle Scope
    * Default to Generic Action
    * **2.** Define Auto-Reflection Schema Provider
    * A. Scan Columns (Primitives)
    * Map SQL Types to Meta-Kernel Types
    * Defaults
    * Special Case: 'email'
    * ⚡ INTELLIGENT SYSTEM DETECTION
    * A field is 'system' (read-only) if it's managed by the kernel
    * ⚡ CORRECTED FLAGS
    * B. ⚡ NEW: Scan Relationships (Associations)
    * Determine type: List (One-to-Many) or Single (Many-to-One)
    * Target table name
    * We map these as special types
    * Usually we don't edit relationships directly here
    * **3.** Define Default Context Loader
    * **4.** Construct the Contract
    * ⚡ META-TYPE INJECTION (The Fix)
    * This passes the user's intent (e.g. DomainType.CONFIG) to the Registry.
    * **5.** Execute Registration


### 📄 `backend/app/core/kernel/enforcer.py`
**Components & Logic:**

- 📦 **`DomainEnforcer`**
    > *The Enforcer Layer.*
  * 🔹 **`_extract_targets`**
      > *Parses the URL to find the target Domain AND Scope.*
      * Expected formats:
      * **1.** /api/v1/resource/DOMAIN/... (Domain only)
      * **2.** /api/v1/meta/states/DOMAIN/SCOPE (Domain + Scope)
      * **3.** /api/v1/workflow/DOMAIN/SCOPE/... (Domain + Scope)
      * Handle Meta States: /api/v1/meta/states/{DOMAIN}/{SCOPE}
      * Handle Workflows: /api/v1/workflow/{DOMAIN}/{SCOPE}/...
      * Handle Resource: /api/v1/resource/{DOMAIN}/... (Domain only usually)
      * Resource IDs are not scopes, so scope_key remains None

  * 🔹 **`is_api_allowed`**
      > *Validates if the target domain AND scope are open via the Circuit Breaker.*
      * **1.** System bypass (Always allow SYS/AUTH to prevent lockouts)
      * **2.** Level 1 Check: Domain Circuit
      * **3.** Level 2 Check: Scope Circuit (if a scope was identified)
      * Check specific scope switch
      * Special Case: UI requests to API might fail here if we don't distinguish planes.
      * But Enforcer is an API Guard, so we check API plane.
      * Note: Ideally, the Frontend UI plane should have hidden the link,
      * but this acts as the hard gate.


### 📄 `backend/app/core/kernel/events.py`
**Components & Logic:**

- 📦 **`EventError`**
    > *Base exception for Event definition errors.*
- 📦 **`SystemEvent`**
    > *The Source of Truth for a System Event.*
  * 🔹 **`__post_init__`**
      > *Validates the Contract immediately upon instantiation.*
  * 🔹 **`_validate_naming_convention`**
      > *Enforces Strict Naming: DOMAIN:VERB (UPPERCASE)*
  * 🔹 **`_validate_version_format`**
      > *⚡ Enforces SemVer Format (X.Y.Z)*
      * Supports 1.0.0, 1.0.0-alpha, etc.
      * Legacy support: If passed as int, convert (but warn) - No, strict fail is better for Level 9.
      * Auto-convert int to SemVer (1 -> 1.0.0) if legacy code exists?
      * No, Architect demands strictness.
      * But for transition, we might allow it momentarily if needed.
      * Let's enforce string.

  * 🔹 **`_validate_schema_structure`**
      > *Ensures payload_schema is a dictionary (JSON compatible).*
- 📦 **`Schemas`**

### 📄 `backend/app/core/kernel/interceptor.py`
**Components & Logic:**

- 📦 **`LogicInterceptor`**
    > *The Universal Gateway.*
  * 🔹 **`register`**
  * 🔹 **`before_flush`**
      * ⚡ NOISE FILTER: Skip Outbox to prevent infinite loops

  * 🔹 **`_process_object`**
      * **1.** ⚡ DYNAMIC DOMAIN RESOLUTION (No more hardcoded dicts)
      * We assume the domain matches the class name, unless overridden by the model itself.
      * Fallback for internal Kernel structures (Optional but safe)
      * **2.** ⚡ PRE-FLIGHT: Freeze & Calculate Changes
      * Construct default envelope
      * **3.** 🧠 THE BRAIN: GOVERNANCE ENGINE (Decoupled Sidecar)
      * Apply mutations if permitted
      * ⚡ FAIL-OPEN RESILIENCE: If Brain crashes, allow the body to survive.
      * **4.** 🏃 THE BODY: WORKFLOW ENGINE (Decoupled)
      * Need an ephemeral async session just to fetch state defs for the workflow engine
      * **5.** 🤝 THE HANDSHAKE: Governance checks Workflow's Transition Request
      * Schedule side-effects (Actions)
      * **6.** ⚡ CHANGE DATA CAPTURE (CDC)

  * 🔹 **`_schedule_workflow_effect`**
  * 🔹 **`_json_friendly`**
  * 🔹 **`_freeze_entity`**
  * 🔹 **`_serialize_entity`**
  * 🔹 **`_apply_mutations`**
  * 🔹 **`_buffer_side_effects`**
  * 🔹 **`_calculate_changeset`**

### 📄 `backend/app/core/kernel/kernel.py`
**Components & Logic:**

- 📦 **`Kernel`**
    > *The Event Publisher.*
  * 🔹 **`__init__`**
      * Stateless singleton pattern

  * 🔹 **`publish`**
      > *Ingests an event into the System Outbox.*
      * **1.** RESOLVE METADATA
      * **2.** RESOLVE CONTEXT
      * We grab the Trace ID from the request context to link API logs with Kafka logs
      * **3.** RESOLVE PARTITION KEY (Critical for Kafka)
      * If not provided, we try to use entity_id. If that's missing, we fallback to "global".
      * **WARNING:** "global" puts everything on one partition (ordering guaranteed but low throughput).
      * **4.** ENVELOPE CONSTRUCTION
      * **5.** WRITE TO OUTBOX
      * In Level 100, we DO raise. If the event cannot be logged, the transaction is unsafe.

  * 🔹 **`commit`**
      > *Finalizes the transaction.*

### 📄 `backend/app/core/kernel/logic_engine.py`
**Components & Logic:**

- 📦 **`LogicEngine`**
    > *[DEPRECATED] v1 Logic Engine.*
  * 🔹 **`__init__`**
  * 🔹 **`evaluate`**
      * Simple passthrough logic for legacy RuleDefinitions
      * (Preserved from original implementation to prevent crashing legacy tests)
      * **1.** Build Context


### 📄 `backend/app/core/kernel/models.py`
**Components & Logic:**

- 📦 **`SystemOutbox`**
    > *TRANSACTIONAL OUTBOX (The Kafka Waiting Room).*
  * 🔹 **`to_dict`**
      > *Serialization helper for the Relay.*

---
### 📄 `backend/app/core/kernel/payload/factory.py`
**Components & Logic:**

- 📦 **`ChangeContext`**
    > *A Context Manager that watches an Entity and the Database Session*
  * 🔹 **`__init__`**
      * State Storage
      * Capture trace if available from request

  * 🔹 **`set_entity`**
      > *Allows setting the entity late (e.g., if it was just created inside the block).*
  * 🔹 **`add_extended_data`**
      > *Injects ad-hoc data into the 'extended_data' block of the payload.*
  * 🔹 **`_serialize_value`**
      > *Helper to safely serialize DB values.*
  * 🔹 **`_snapshot`**
      > *Serializes a SQLAlchemy model into a clean dictionary using Inspection.*
      * Map columns

  * 🔹 **`_enrich`**
      > *Delegates to the PayloadManager to find domain-specific enrichment logic.*
  * 🔹 **`_calculate_changes`**
      > *Generates the Delta (Old vs New).*
      * Simple equality check

  * 🔹 **`_detect_impact`**
      > *Scans the generic DB session to find ALL tables touched in this transaction.*
      * Check New, Dirty, and Deleted objects in the session

  * 🔹 **`__enter__`**
      * Capture "Before" State

  * 🔹 **`__exit__`**
      * If code crashed (Exception raised), don't build payload.
      * Let the exception propagate.
      * Capture "After" State
      * If entity was set late (creation), snapshot it now
      * **1.** Logic Calculation
      * **2.** Federated Enrichment
      * Merge manual extended data with domain strategy data
      * **3.** Build Context (Actor)
      * **4.** CONSTRUCT THE ENTERPRISE PAYLOAD


### 📄 `backend/app/core/kernel/payload/manager.py`
**Components & Logic:**

- 📦 **`PayloadManager`**
    > *Central Registry for Event Payload Strategies.*
  * 🔹 **`__init__`**
      * Maps Model Class -> Strategy Function

  * 🔹 **`register`**
      > *Registers a strategy function for a specific SQLAlchemy model.*
  * 🔹 **`get_strategy`**
      > *Retrieves the strategy function for a given model instance.*

---
### 📄 `backend/app/core/kernel/registry/base.py`
**Components & Logic:**

- 📦 **`DomainType`**
    > *Defines the visibility and lifecycle of a Domain.*
- 📦 **`DomainContext`**
    > *The Dynamic Contract.*
  * 🔹 **`__init__`**
      * **⚡ RESTORED:** Meta-Type Classification
      * ⚡ v3 UPGRADE: Multi-Entity Support
      * New: {"PREFS": PrefModel, "LOG": LogModel}
      * Metadata
      * **⚡ OPTIONAL:** Schema Discriminator for Polymorphic Domains
      * ⚡ ENTITY REGISTRY LOGIC (The Shim)
      * Auto-register root if not in entities (Backward Compatibility)

  * 🔹 **`validate`**
      > *Strict Validation of the Contract.*
      * Check Entities if present

- 📦 **`ScopeConfig`**
    > *Helper for defining Scopes (Workflows).*

### 📄 `backend/app/core/kernel/registry/event_registry.py`
**Components & Logic:**

- 📦 **`Signals`**
    > *Static container for all System Events.*

### 📄 `backend/app/core/kernel/registry/manager.py`
**Components & Logic:**

- 📦 **`RegistryManager`**
  * 🔹 **`__new__`**
  * 🔹 **`register`**
      > *Code-First Registration (during boot).*
      * Validate v3 Contract

  * 🔹 **`get_domain`**
      > *Direct access to the Domain Context by key (UPPERCASE).*
  * 🔹 **`get_schema`**
      > *Retrieves the Static Schema for a Domain.*
      * ⚡ EXECUTE CONTRACT
      * We pass the discriminator (default "DEFAULT") to allow polymorphic schemas

  * 🔹 **`refresh_from_db`**
      > *Syncs the In-Memory Registry with the Database State.*
      * Fetch only active keys from the DB to determine current state
      * If key is in active_keys, it's active. Otherwise, it's disabled.
      * Fail Open: Don't disable everything if DB fails

  * 🔹 **`get_all_summaries`**
      > *Returns full domain state including Dynamic Type Metadata.*
      * ⚡ Eager load the 'type_def' and 'scopes' relationships
      * Pydantic 'from_attributes=True' handles the mapping automatically
      * (e.g. type_key -> type)

  * 🔹 **`sync_to_db`**
      > *Ensures the Database matches the Code.*
      * --- 1. SYNC DOMAIN ---
      * **⚡ FIX:** Handle Enum or String for domain_type
      * --- 2. SYNC ENTITIES (v3) ---
      * Construct full python path if possible
      * --- 3. SYNC SCOPES ---
      * Handle Tuple Routing (Legacy/v2 shim) or Dict (v3)
      * ("DOMAIN", {config})
      * If routing matches current domain, use it.
      * v3 Validation: Check Target Entity


### 📄 `backend/app/core/kernel/registry/schemas.py`
**Components & Logic:**

- 📦 **`DomainTypeRead`**
    > *Metadata about the Domain Classification.*
- 📦 **`ScopeSummary`**
- 📦 **`DomainSummary`**
    > *The High-Level Manifest of a System Module.*

---
### 📄 `backend/app/core/kernel/relay.py`
**Components & Logic:**

- 📦 **`KafkaRelay`**
  * 🔹 **`__init__`**
  * 🔹 **`connect_kafka`**
  * 🔹 **`start`**
  * 🔹 **`process_batch`**
      * Poll Pending


### 📄 `backend/app/core/kernel/system.py`
**Components & Logic:**

- 📦 **`SystemManifest`**
    > *The Single Source of Truth for the System's capabilities.*
  * 🔹 **`generate`**
      > *Generates the full system manifest including modules, routes, circuit states, AND navigation.*
      * Ensure RAM cache is up to date with DB
      * **1.** Fetch Domains
      * **2.** Apply Circuit Breaker Logic (Hypervisor)
      * **1.** Determine Kernel State (Physical)
      * **2.** Determine UI Plane State (Hypervisor)
      * **3.** Merge Logic
      * **4.** Inject State into Config for Frontend Awareness
      * ⚡ HIERARCHY INJECTION
      * **5.** ⚡ GENERATE SECURED NAVIGATION
      * We pass the actor context (e.g. {"role": "admin"}) to the NavigationService.
      * It will evaluate any 'required_policy' hooks on the menu nodes.
      * If no actor is provided, we pass an empty context (Guest Mode).

  * 🔹 **`get_capabilities`**
      > *Returns the Meta-Kernel capabilities (Widgets, Actions, Context).*
      * ⚡ LAZY ACTIVATION: Context Defaults
      * **⚡ OPTIMIZATION:** We do NOT load dynamic widgets here anymore.
      * ⚡ DYNAMIC CONTEXT SCHEMA

  * 🔹 **`_scan_enum`**
  * 🔹 **`_build_action_capabilities`**
      > *⚡ NEW: Constructs a Frontend-Ready grouped list of Action Capabilities.*

### 📄 `backend/app/core/kernel/worker.py`
**Components & Logic:**

- 📦 **`BackgroundWorker`**
  * 🔹 **`__init__`**
  * 🔹 **`start`**
      * Don't crash the loop, just pause

  * 🔹 **`process_batch`**
      * **1.** FETCH PENDING (Limit 10 to prevent clogging)

  * 🔹 **`handle_event`**
      > *The Switchboard. Routes events to their specific handlers.*
      * ⚡ ROUTING LOGIC
      * --- HANDLER: WORKFLOW TRANSITIONS ---
      * --- HANDLER: AUDIT ---
      * --- MARK SUCCESS ---
      * --- MARK FAILURE ---

  * 🔹 **`_handle_workflow_action`**
      > *Executes business logic triggered by State Changes.*
      * In a real app, this calls SendGrid/SES


---
### 📄 `backend/app/core/loader.py`
**Components & Logic:**

- ƒ **`load_domains`**
    > *1. Scans 'app/domains/' for sub-packages.*
    * Path to the domains directory
    * Iterate over all folders in app/domains
    * pkgutil.iter_modules returns (module_loader, name, ispkg)
    * Dynamically import the module (e.g., app.domains.auth)
    * Check for the 'router' attribute (The Plug)
    * ⚡ CRITICAL FIX: Auto-Namespace the Route
    * **OLD:** prefix="/api/v1"
    * **NEW:** prefix="/api/v1/auth"
    * Register the Router


---
### 📄 `backend/app/core/meta/api.py`

### 📄 `backend/app/core/meta/constants.py`
**Components & Logic:**

- 📦 **`BindingType`**
    > *The Jurisdiction Class. Defines WHAT we are binding to.*
- 📦 **`AttributeType`**
    > *The Data Type. Defines how the value is stored and validated.*
- 📦 **`WidgetType`**
    > *The Interface Hint. Defines how the field is rendered.*
- 📦 **`RuleEventType`**
    > *The Trigger.*
- 📦 **`RuleActionType`**
    > *The Consequence.*
- 📦 **`PolicyResolutionStrategy`**
    > *The Governance Logic.*
- 📦 **`ViewEngineType`**
    > *The Renderer.*
- 📦 **`ScopeType`**
    > *The Context Hierarchy. Defines the 'Type' of a KernelScope.*

### 📄 `backend/app/core/meta/engine.py`
**Components & Logic:**

- 📦 **`PolicyEngine`**
    > *The Universal Logic Executor.*
  * 🔹 **`evaluate`**
      > *The Main Entry Point.*
      * **1.** Prepare Data Context (Sandbox Envelope)
      * We wrap the data to allow 'context.meta' or 'context.actor' access if needed later.
      * Strategy: Pass object directly. Rules should be written as `host.weight > 10`.
      * **2.** Iterate Policies
      * **3.** Merge Results based on Governance Strategy
      * **4.** Apply Resolution Strategy ( The Judge )

  * 🔹 **`_evaluate_single_policy`**
      > *Executes one Policy Bundle (which may contain multiple Rules).*
      * Policies store rules as a JSONB list: [{ "logic": "...", "action": "BLOCK", ... }]
      * A. Execute JMESPath
      * Boolean expressions: `host.age > 18` returns True/False.
      * B. Handle Match (Triggered)
      * ⚡ RESOLVE DYNAMIC VALUES
      * If action involves data, we must check if the value is a reference (e.g. actor.id)
      * **SAFEGUARD:** Bad rule syntax should not crash the system.
      * ⚡ FAIL OPEN: Treat crash as WARNING, not BLOCK.

  * 🔹 **`_resolve_value`**
      > *Detects if a value is a reference (e.g. 'actor.id') and resolves it against the context.*
      * Heuristic: If it looks like a known context path, try to resolve it.
      * This matches the 'Value Source' logic in the Frontend Policy Editor.
      * If resolution works, return it. If it returns None, it might mean the field is missing,
      * but we return None rather than the string literal "actor.id".
      * If JMESPath crashes, fallback to the string literal

  * 🔹 **`_apply_strategy`**
      > *Decides the final outcome based on the strategy.*
      * Default: Any violation kills the transaction
      * If (Total - Violations) > 0, then Pass.

  * 🔹 **`_serialize`**
      > *Helper to convert SQLAlchemy objects to Dict for JMESPath.*
  * 🔹 **`_log_summary`**

---
### 📄 `backend/app/core/meta/features/groups/router.py`
**Components & Logic:**

- ƒ **`create_group`**
- ƒ **`list_groups`**
- ƒ **`get_group`**
- ƒ **`update_group`**
- ƒ **`delete_group`**

### 📄 `backend/app/core/meta/features/groups/service.py`
**Components & Logic:**

- 📦 **`GroupService`**
    > *The Librarian. Manages collections of Policies.*
  * 🔹 **`_generate_key`**
      > *Auto-generates a system key from a human name if not provided.*
  * 🔹 **`create_group`**
      > *Creates a new Policy Group.*
      * **1.** Validate Key Uniqueness
      * **2.** Validate Policy Keys (Optional but recommended)
      * We trust the user provided valid keys, or we could verify them here.
      * **3.** Create Entity

  * 🔹 **`get_groups`**
      > *Lists all Policy Groups.*
  * 🔹 **`get_group_by_id`**
      > *Fetches a single group.*
  * 🔹 **`update_group`**
      > *Updates metadata or membership order.*
      * Apply Updates

  * 🔹 **`delete_group`**
      > *Soft Delete (Deactivate) or Hard Delete if no dependencies.*
      * **TODO:** Check if bound to any active PolicyBinding before deleting?
      * For Level 5 safety, we just Deactivate.


---
### 📄 `backend/app/core/meta/features/simulator/logic/interpreter.py`
**Components & Logic:**

- 📦 **`XStateInterpreter`**
    > *A lightweight, fault-tolerant interpreter for XState v5 definitions.*
  * 🔹 **`__init__`**
  * 🔹 **`get_initial_state`**
      > *Returns the starting state of the machine.*
  * 🔹 **`transition`**
      > *Determines the next state based on the current state and the incoming event.*
      * **1.** Validate Current State
      * **2.** Look for Transitions ('on' block)
      * **3.** Match Event
      * XState allows 'on': { "EVENT": "TARGET" } OR 'on': { "EVENT": { "target": "TARGET" } }
      * **4.** Resolve Target
      * Short syntax: "EVENT": "TARGET"
      * Object syntax: "EVENT": { "target": "TARGET", "actions": [...] }
      * Array syntax (Guards): "EVENT": [{ "target": "T1", "guard": "cond" }]
      * For Phase 1, we just take the first unconditional match or the first one.
      * **TODO:** Implement Guard Logic evaluation here.
      * **5.** Final Validation


---
### 📄 `backend/app/core/meta/features/simulator/router.py`
**Components & Logic:**

- ƒ **`inspect_entity`**
- ƒ **`run_simulation`**
    * Client Error (Invalid ID, Domain, etc.)
    * Server Error


### 📄 `backend/app/core/meta/features/simulator/schemas.py`
**Components & Logic:**

- 📦 **`SimulationRequest`**
    > *The Input Vector.*
- 📦 **`SimulationResult`**
    > *The Output Report.*

### 📄 `backend/app/core/meta/features/simulator/service.py`
**Components & Logic:**

- 📦 **`RuntimeService`**
  * 🔹 **`inspect_entity`**
      > *FORENSIC PROBE: Fetches the exact database state of an entity.*
      * **1.** Resolve Domain Model
      * **2.** Fetch Row
      * **3.** Serialize & Flatten (The Fix)
      * A. Static Columns
      * Handle Datetime serialization
      * B. Dynamic Attributes (Flattening)
      * This pulls 'test' out of 'custom_attributes' and puts it at the root.

  * 🔹 **`simulate_transaction`**
      > *Executes a business event in a safe Sandbox Transaction.*
      * **1.** Resolve Domain Model
      * **2.** Load Entity
      * Capture Pre-State
      * **3.** Load State Machine
      * **4.** Calculate Transition
      * **5.** Apply Changes
      * A. Apply Payload updates
      * B. Apply State Transition
      * **6.** Trigger Interceptor
      * **7.** Inspect Side Effects
      * **8.** THE ROLLBACK


---
### 📄 `backend/app/core/meta/features/states/logic/enforcer.py`
**Components & Logic:**

- 📦 **`StateEnforcer`**
  * 🔹 **`fetch_definitions`**
      > *⚡ SIDECAR IO: Fetches active state machines for a domain.*
  * 🔹 **`enforce_logic`**
      > *CPU LOGIC: Evaluates transitions.*
      * ⚡ DECOUPLING POINT:
      * We no longer evaluate the guard here.
      * We attach the 'guard' and 'actions' to the object sidecar.
      * The Interceptor will see this and trigger the Governance Signal.


### 📄 `backend/app/core/meta/features/states/logic/machine.py`
**Components & Logic:**

- 📦 **`StateMachine`**
    > *A Read-Only engine that validates transitions against an XState definition.*
  * 🔹 **`__init__`**
      > *Args:*
      * Cache strict transitions for O(1) lookup

  * 🔹 **`_normalize_transition`**
      > *SAFEGUARD: Converts legacy string targets into object definitions.*
  * 🔹 **`_build_lookup_table`**
      > *Parses the nested XState structure into a flat lookup map.*
  * 🔹 **`get_transition_config`**
      > *Finds the configuration (Rules/Actions) for moving A -> B.*
  * 🔹 **`validate_transition_structure`**
  * 🔹 **`get_side_effects`**
      > *Retrieves 'actions' defined in the transition (Edge).*
  * 🔹 **`get_state_node`**
      > *Returns the full definition of a specific state node.*

### 📄 `backend/app/core/meta/features/states/logic/validator.py`
**Components & Logic:**

- 📦 **`ScopeValidator`**
    > *Enforces Level 7 Constraints dynamically.*
  * 🔹 **`validate`**
      > *Main Entry Point.*
      * **1.** Fetch Rule Definition from DB (The Source of Truth)
      * **2.** Extract JSON Schema
      * **3.** Execute Validation
      * We validate the ENTIRE definition against the schema stored in DB
      * Format the error nicely for the API response


---
### 📄 `backend/app/core/meta/features/states/models.py`
**Components & Logic:**

- 📦 **`WorkflowType`**
    > *Defines a Category of State Machine.*
  * 🔹 **`__repr__`**

### 📄 `backend/app/core/meta/features/states/router.py`
**Components & Logic:**

- ƒ **`list_workflow_types`**
    > *Fetches the Dynamic Workflow Registry (V3).*
- ƒ **`create_state_machine`**
- ƒ **`list_state_machines`**
- ƒ **`get_flow_definition`**
- ƒ **`get_flow_history`**
- ƒ **`get_flow_version`**
- ƒ **`delete_workflow`**

### 📄 `backend/app/core/meta/features/states/schemas.py`
**Components & Logic:**

- ƒ **`validate_xstate_structure`**
    > *Forensic audit of the State Machine JSON.*
- 📦 **`WorkflowTypeRead`**
    > *Exposes the 'Class' definition of a workflow (e.g. WIZARD).*
- 📦 **`StateMachineCreate`**
  * 🔹 **`check_structure`**
- 📦 **`StateMachineUpdate`**
  * 🔹 **`check_structure`**
- 📦 **`StateMachineRead`**
  * 🔹 **`version`**

### 📄 `backend/app/core/meta/features/states/seeds.py`
**Components & Logic:**

- ƒ **`seed_workflow_types`**
    > *Idempotent seeder for Workflow Types.*

### 📄 `backend/app/core/meta/features/states/service.py`
**Components & Logic:**

- 📦 **`StateService`**
  * 🔹 **`get_workflow_types`**
      > *Retrieves the catalogue of available Workflow "Animals" (e.g. WIZARD, JOB).*
      * Order by key for consistent UI rendering

  * 🔹 **`create_machine`**
      > *Registers a State Machine (Ledger Strategy).*
      * --- 0. LEVEL 7 INTEGRITY CHECK ---
      * **⚡ UPDATE:** Pass 'db' to allow dynamic rule lookup
      * --- 1. Determine Next Version (SemVer + Legacy) ---
      * We fetch the absolute latest version to calculate the increment
      * Patch Increment Strategy (1.0.0 -> 1.0.1)
      * Initialize at 1.0.0
      * --- 2. Archive Old Versions ---
      * --- 3. Create New Version ---
      * SemVer
      * Legacy

  * 🔹 **`get_machines`**
  * 🔹 **`get_machine_by_scope`**
  * 🔹 **`get_machine_history`**
  * 🔹 **`delete_machine`**
      > *Safe Deletion Protocol.*

---
### 📄 `backend/app/core/meta/features/topology/router.py`
**Components & Logic:**

- ƒ **`get_domain_topology`**
    > *⚡ TOPOLOGY GRAPH ENDPOINT*
    * The Service handles the DB stitching (Entities + Policies + Scopes)
    * ⚡ TELEMETRY PROBE: Print full stack trace to console for debugging 500s


### 📄 `backend/app/core/meta/features/topology/schemas.py`
**Components & Logic:**

- 📦 **`TopologyNodeType`**
    > *Defines the biological classification of a System Node.*
- 📦 **`TopologyNode`**
    > *A single node in the System Hierarchy.*

### 📄 `backend/app/core/meta/features/topology/service.py`
**Components & Logic:**

- 📦 **`TopologyService`**
    > *The Cartographer of the Database.*
  * 🔹 **`get_domain_topology`**
      > *Generates the Concrete Children for a specific Domain.*
      * ⚡ 0A. FETCH DYNAMIC WORKFLOW TYPES (Async)
      * ⚡ 0B. FETCH DOMAIN METADATA (Async)
      * **⚡ SAFETY:** Resolve attributes defensively
      * ---------------------------------------------------------
      * **1.** ⚡ ENTITY NODE (Data Dictionary)
      * ---------------------------------------------------------
      * ---------------------------------------------------------
      * **2.** ⚡ GOVERNANCE NODE (Policies)
      * ---------------------------------------------------------
      * ---------------------------------------------------------
      * **3.** ⚡ WORKFLOW NODES (Scopes)
      * ---------------------------------------------------------
      * ⚡ FETCH TYPE DEFINITION
      * ⚡ DEFAULT ICONS
      * ---------------------------------------------------------
      * ⚡ GROUPING LOGIC (The "Hierarchy Builder")
      * ---------------------------------------------------------
      * Initialize vars
      * CASE A: WORKFLOWS (Wizards, Jobs, Views, Governance Flows)
      * We group these under "WORKFLOWS" -> "TYPE"
      * Parent Folder
      * Child Folder (The Sub-Tree)
      * Use the Label from the Workflow Type Definition (e.g. "Interactive Wizard")
      * Fallback if type def missing
      * CASE B: FALLBACK
      * ---------------------------------------------------------
      * ⚡ HIERARCHY METADATA
      * ---------------------------------------------------------
      * **4.** ⚡ CHILD DOMAINS (Sub-Modules)
      * ---------------------------------------------------------


---
### 📄 `backend/app/core/meta/features/views/router.py`
**Components & Logic:**

- ƒ **`create_view`**
- ƒ **`list_views`**
- ƒ **`update_view`**
- ƒ **`bind_view`**
- ƒ **`list_bindings`**
    > *Returns the routing table for UI views.*
- ƒ **`delete_binding`**
- ƒ **`resolve_view`**
    * In a real app, role comes from the JWT Token.
    * We allow explicit override here for testing/simulation.


### 📄 `backend/app/core/meta/features/views/schemas.py`
**Components & Logic:**

- 📦 **`ViewBase`**
  * 🔹 **`validate_key`**
  * 🔹 **`validate_schema_structure`**
      > *POLYMORPHIC VALIDATION:*
      * Logic for Form.io components

- 📦 **`ViewCreate`**
- 📦 **`ViewUpdate`**
- 📦 **`ViewRead`**
- 📦 **`ViewBindingBase`**
- 📦 **`ViewBindingCreate`**
- 📦 **`ViewBindingUpdate`**
- 📦 **`ViewBindingRead`**

### 📄 `backend/app/core/meta/features/views/service.py`
**Components & Logic:**

- 📦 **`ViewService`**
    > *The Orchestrator for the UI Backbone.*
  * 🔹 **`create_view_async`**
      * Check Uniqueness (Only check against LATEST)
      * Serialize - by_alias=True ensures 'schema' key is used for DB
      * Initial Version: 1.00

  * 🔹 **`update_view_async`**
      > *AUTO-LIVE STRATEGY:*
      * **1.** Fetch Parent
      * **2.** Calculate Next Version
      * **3.** Prepare New Data
      * **4.** Create New Head
      * **5.** Deprecate Parent (Mark as not latest)
      * **6.** AUTO-LIVE: Promote Bindings
      * Find all bindings pointing to the OLD view and move them to the NEW view

  * 🔹 **`get_views`**
      * Only return LATEST versions for the list

  * 🔹 **`create_binding`**
      * **⚡ FIX:** Eager load the relationship

  * 🔹 **`get_bindings`**
      > *Retrieves all View Bindings for a given Domain.*
  * 🔹 **`delete_binding`**
      > *SMART UNBIND:*
      * PHASE 1: DEACTIVATE
      * PHASE 2: HARD DELETE

  * 🔹 **`resolve_view`**
      > *Determines the BEST view for a given context using 'Weighted Specificity'.*
      * **1.** Fetch Candidates (All active bindings for this domain)
      * **2.** Score Candidates
      * Only consider bindings where the View itself is active
      * A. Role Check
      * B. State Check
      * C. Priority


---
### 📄 `backend/app/core/meta/features/widgets/models.py`
**Components & Logic:**

- 📦 **`WidgetDefinition`**
    > *The 'App Store' entry for a UI Component.*
  * 🔹 **`version`**
  * 🔹 **`__repr__`**

### 📄 `backend/app/core/meta/features/widgets/schemas.py`
**Components & Logic:**

- 📦 **`WidgetCreate`**
- 📦 **`WidgetUpdate`**
- 📦 **`WidgetRead`**
  * 🔹 **`version`**

---
### 📄 `backend/app/core/meta/features/widgets/seeds/atoms.py`

### 📄 `backend/app/core/meta/features/widgets/seeds/molecules.py`

### 📄 `backend/app/core/meta/features/widgets/seeds/structures.py`

---
### 📄 `backend/app/core/meta/features/widgets/service.py`
**Components & Logic:**

- 📦 **`WidgetService`**
  * 🔹 **`register_widget`**
      > *Creates a new Widget Definition (v1.0.0).*
      * Uniqueness Check (Key only)

  * 🔹 **`get_widgets`**
      > *Lists all LATEST widgets.*
  * 🔹 **`get_widget_by_key`**

---
### 📄 `backend/app/core/meta/models.py`
**Components & Logic:**

- 📦 **`AttributeDefinition`**
  * 🔹 **`__repr__`**
- 📦 **`PolicyDefinition`**
  * 🔹 **`version_display`**
- 📦 **`PolicyGroup`**
    > *⚡ ENTERPRISE FEATURE: Explicit Policy Grouping.*
- 📦 **`PolicyBinding`**
    > *The Switchboard. Connects a Policy OR a Group to a Context.*
- 📦 **`StateDefinition`**
  * 🔹 **`version_display`**
- 📦 **`ViewDefinition`**
- 📦 **`ViewBinding`**
- 📦 **`RuleDefinition`**

### 📄 `backend/app/core/meta/registry.py`

### 📄 `backend/app/core/meta/schemas.py`
**Components & Logic:**

- 📦 **`SelectOption`**
- 📦 **`AttributeConfig`**
- 📦 **`AttributeBase`**
- 📦 **`AttributeCreate`**
- 📦 **`AttributeUpdate`**
- 📦 **`AttributeRead`**
- 📦 **`PolicyRule`**
- 📦 **`PolicyBase`**
- 📦 **`PolicyCreate`**
- 📦 **`PolicyUpdate`**
- 📦 **`PolicyRead`**
  * 🔹 **`version_display`**
- 📦 **`PolicyGroupBase`**
  * 🔹 **`validate_key`**
- 📦 **`PolicyGroupCreate`**
- 📦 **`PolicyGroupUpdate`**
- 📦 **`PolicyGroupRead`**
- 📦 **`PolicyBindingBase`**
  * 🔹 **`check_source`**
- 📦 **`PolicyBindingCreate`**
- 📦 **`PolicyBindingUpdate`**
- 📦 **`PolicyBindingRead`**
- 📦 **`RuleEffect`**
- 📦 **`RuleCreate`**
- 📦 **`RuleRead`**
- 📦 **`DryRunRequest`**
- 📦 **`DryRunResult`**

### 📄 `backend/app/core/meta/service.py`
**Components & Logic:**

- 📦 **`MetaService`**
  * 🔹 **`validate_rule_syntax`**
  * 🔹 **`create_policy`**
  * 🔹 **`update_policy`**
  * 🔹 **`dry_run_policy`**
  * 🔹 **`get_policy_history`**
  * 🔹 **`restore_policy`**
  * 🔹 **`get_policies`**
      > *⚡ TAG-DRIVEN ARCHITECTURE: Filters policies by their domain tag.*
      * JSONB contains check: tags @> '["domain:XYZ"]'

  * 🔹 **`create_binding`**
  * 🔹 **`update_binding`**
  * 🔹 **`delete_binding`**
  * 🔹 **`get_bindings`**
  * 🔹 **`create_attribute`**
  * 🔹 **`get_attributes`**
  * 🔹 **`update_attribute`**
  * 🔹 **`delete_attribute`**
  * 🔹 **`create_rule`**
  * 🔹 **`get_rules`**
  * 🔹 **`get_fused_schema`**
      > *The Brain: Combines Immutable Code (Registry) with Flexible Data (DB).*
      * **⚡ LOGGING:** Trace the Fusion Step
      * **1.** FETCH STATIC SCHEMA (The Bedrock)
      * **2.** FETCH DYNAMIC SCHEMA (The Overlay)
      * Use local method to avoid circular dependency issues
      * Dynamic overrides Static if key matches
      * Return empty schema instead of crashing, allowing UI to recover

  * 🔹 **`invalidate_cache`**

---
### 📄 `backend/app/core/schema_generator.py`
**Components & Logic:**

- ƒ **`generate_schema`**
    > *Introspects SQLAlchemy models and returns a dictionary representation.*
    * We use the Class Name as the key (e.g., "User") for the Frontend to map easily.
    * Inspect the class members to find SQLAlchemy columns
    * Extract Column Metadata
    * Note: We access .property.columns[0] to get the actual Column object
    * ⚡ ARCHITECTURAL INVARIANT: Skip Dynamic Containers
    * Clean up type name (e.g., "VARCHAR(255)" -> "VARCHAR")
    * Skip relationships or non-column attributes for now


### 📄 `backend/app/core/security.py`
**Components & Logic:**

- ƒ **`verify_password`**
    > *Verifies a plain-text password against the stored hash.*
- ƒ **`get_password_hash`**
    > *Generates a secure hash for a new password.*
- ƒ **`create_access_token`**
    > *Mints a new JWT Access Token.*
    * Expiration
    * Token Type


---
### 📄 `backend/app/core/utilities/async_bridge.py`
**Components & Logic:**

- 📦 **`AsyncBridge`**
    > *The Connector between the Blocking DB Layer and the Non-Blocking Logic Layer.*
  * 🔹 **`run_sync`**
      > *Executes a coroutine synchronously by spawning a fresh Event Loop in a separate thread.*
      * ⚡ 1. CAPTURE CONTEXT
      * Snapshot the current state (User, Request ID, etc.)
      * This allows the background thread to "know" who initiated the save.
      * ⚡ 2. SETUP SIDECAR LOOP
      * ⚡ 3. EXECUTE WITHIN CONTEXT
      * We wrap the execution in ctx.run() so the coroutine sees the vars.
      * Note: We must wrap the loop.run_until_complete call itself,
      * or create a wrapper task that runs in context.
      * Best practice: ctx.run(task)
      * The loop itself doesn't need the context, the coroutine does.
      * However, ctx.run() takes a callable.
      * We simply run the loop logic.
      * This ensures the async task inherits the context
      * But simpler: we just run the whole block in context if possible.
      * Actually, contextvars context applies to the *thread* execution stack.
      * So executing ctx.run(func) sets the context for 'func'.
      * ⚡ 4. SPAWN THREAD WITH CONTEXT
      * We pass 'target' to ctx.run, so 'target' runs with the variables set.
      * But we are starting a NEW thread. ctx.run() only works in the CURRENT thread.
      * To pass context to a NEW thread, we must run ctx.run INSIDE the new thread.
      * "Re-hydrate" the context inside the new thread
      * Block until the Sidecar finishes (Gatekeeper behavior)


---
### 📄 `backend/app/core/utils/reflection.py`
**Components & Logic:**

- ƒ **`reflect_model_schema`**
    > *Introspects a SQLAlchemy Model and returns a structured Context Graph.*
    * Indentation for logging readability
    * **1.** SCALAR FIELDS
    * ⚡ ARCHITECTURAL INVARIANT: Skip Dynamic Containers
    * The bucket itself is not a field, it holds the fields.
    * --- A. Type Mapping ---
    * Map SQLAlchemy Types to UI Types
    * --- B. Metadata Extraction (The Explicit Strategy) ---
    * We look for the 'info' dict on the column definition first.
    * Fallback to Heuristics if missing.
    * Label: Override or Auto-Generate
    * System/Read-Only Status
    * **1.** Explicit Override
    * **2.** Heuristic Fallback (Safety Net)
    * Final Decision Logic
    * Special Case: 'hashed_password'
    * Should be "password" widget, but never readable.
    * --- C. Construct Field Definition ---
    * Alias for logic engine
    * Placeholder for extended config
    * Inject options if found via Enum or Info
    * **2.** RELATIONSHIPS (The Graph)
    * Only recurse if we haven't hit the limit
    * Determine Cardinality
    * Recursive Call
    * **3.** CONSTRUCT OUTPUT


---
### 📄 `backend/app/domains/auth/features/preferences/models.py`
**Components & Logic:**

- 📦 **`UserPreferences`**
    > *The UI/UX State Sidecar.*
  * 🔹 **`__repr__`**
      > *String representation for logging.*

### 📄 `backend/app/domains/auth/features/preferences/seeds.py`
**Components & Logic:**

- ƒ **`seed_preferences_schema`**
    > *Idempotent seeder for User Preference Attributes.*
    * Check existence
    * 🔒 LOCK IT


### 📄 `backend/app/domains/auth/features/preferences/service.py`
**Components & Logic:**

- 📦 **`PreferenceService`**
    > *The Librarian for User State.*
  * 🔹 **`get_preferences`**
      > *Fetches preferences. Auto-creates the row if missing (Lazy Init).*
      * Merge with defaults to ensure new keys appear for old users
      * Note: In a real implementation, we might want a deep merge utility here.
      * For now, we trust the stored JSON but could overlay it on DEFAULT_PREFERENCES.

  * 🔹 **`initialize_defaults`**
      > *Creates the Sidecar row with Factory Settings.*
      * If race condition (already created), just return existing

  * 🔹 **`get_default_schema`**
      > *Returns the structure of the preferences for UI generation.*

### 📄 `backend/app/domains/auth/features/preferences/workflows.py`

---
### 📄 `backend/app/domains/auth/models.py`
**Components & Logic:**

- 📦 **`User`**
    > *The Central Identity Entity.*
  * 🔹 **`to_dict`**
- ƒ **`provide_schema`**
- ƒ **`user_context_loader`**

### 📄 `backend/app/domains/auth/registry.py`

### 📄 `backend/app/domains/auth/schemas.py`
**Components & Logic:**

- 📦 **`UserBase`**
- 📦 **`UserCreate`**
- 📦 **`UserLogin`**
- 📦 **`UserRead`**
- 📦 **`Token`**
- 📦 **`TokenPayload`**

### 📄 `backend/app/domains/auth/seeds.py`
**Components & Logic:**

- ƒ **`seed_assets`**
    > *Wave 2: Core Assets*
    * --- 1. ADMIN USER ---
    * --- 2. WORKFLOW REGISTRATION (Refactored) ---
    * ⚡ CORE IDENTITY FLOWS (USER)
    * ⚡ SIDECAR FLOWS (USER_PREFS)
    * This fixes the missing "User Settings" workflow
    * --- 3. PREFERENCE SCHEMA ---
    * --- 4. ⚡ GOVERNANCE BINDING (Compliance) ---
    * The User Domain voluntarily accepts the System's Laws

- ƒ **`_register_domain_workflows`**
    > *Helper to register workflows for a specific Domain Context.*
    * Handle Tuple vs Dict scopes (Legacy shim)
    * ⚡ CRITICAL FILTER: Only register State Machines (WIZARD, GOVERNANCE).
    * We EXCLUDE 'JOB' and 'VIEW' because they don't have XState definitions.

- ƒ **`seed_governance`**
    > *Binds the USER domain to Global System Policies.*
    * ⚡ THE COMPLIANCE LIST
    * "We agree to follow these System Policies"
    * **1.** Find the Law
    * **2.** Check for existing Binding
    * **3.** Sign the Contract


---
### 📄 `backend/app/domains/auth/workflows/lifecycle.py`

### 📄 `backend/app/domains/auth/workflows/signup.py`

### 📄 `backend/app/domains/auth/workflows/user_admin.py`

### 📄 `backend/app/domains/auth/workflows/user_create.py`

### 📄 `backend/app/domains/auth/workflows/user_edit.py`

---
### 📄 `backend/app/domains/meta_v2/features/governance/enforcer.py`
**Components & Logic:**

- 📦 **`GovernanceEnforcer`**
  * 🔹 **`fetch_and_evaluate`**
      > *⚡ SIDECAR IO: Spawns an independent DB session to fetch Policies,*
      * **1.** Resolve Environment Context
      * **2.** Fetch Active Bindings
      * **3.** Evaluate (Or Pass gracefully if no rules)

  * 🔹 **`evaluate_guard_sync`**
      > *Evaluates a single transition guard expression synchronously.*

---
### 📄 `backend/app/domains/system/features/domain_types/models.py`
**Components & Logic:**

- 📦 **`KernelDomainType`**
    > *The Meta-Definition for a Domain Category.*
  * 🔹 **`__repr__`**
      > *String representation for logging.*

### 📄 `backend/app/domains/system/features/domain_types/seeds.py`
**Components & Logic:**

- ƒ **`seed_domain_types`**
    > *Idempotent seeder for Kernel Domain Types.*
    * Upsert Logic: Insert or Update if exists


---
### 📄 `backend/app/domains/system/features/navigation/models.py`
**Components & Logic:**

- 📦 **`SystemMenuNode`**
    > *The Global UI Shell Navigation Registry.*
  * 🔹 **`__repr__`**

### 📄 `backend/app/domains/system/features/navigation/schemas.py`
**Components & Logic:**

- 📦 **`NavigationNode`**
    > *A single item in the navigation tree.*
- 📦 **`NavigationResponse`**
    > *The full payload injected into the System Manifest.*

### 📄 `backend/app/domains/system/features/navigation/seeds.py`
**Components & Logic:**

- ƒ **`seed_navigation`**
    > *Idempotent seeder for the OS Navigation Menu.*

### 📄 `backend/app/domains/system/features/navigation/service.py`
**Components & Logic:**

- 📦 **`NavigationService`**
    > *The Architect of the UI Shell.*
  * 🔹 **`get_secured_navigation`**
      > *Fetches all active nodes and filters them via the Policy Engine.*
      * **1.** Fetch all active nodes
      * **2.** Extract unique policy requirements to minimize DB hits
      * **3.** Assemble filtered structure
      * 🛡️ SECURITY GATE
      * 📦 SERIALIZE


---
### 📄 `backend/app/domains/system/logic/governance.py`
**Components & Logic:**

- 📦 **`GovernanceService`**
  * 🔹 **`_serialize`**
      > *Converts SQLAlchemy models to Dictionary.*
      * Handle 'scopes' relationship manually
      * **⚡ FIX:** Handle 'type_def' relationship manually so UI receives api_strategy

  * 🔹 **`list_domains`**
      > *Fetches Domains + Scopes + Circuit States.*
      * **1.** Fetch Hierarchy (Now including type_def)
      * **2.** Fetch All Circuits (Optimization: Single Query instead of N+1)
      * **3.** Create Lookup Map
      * Key: "scope:USER:SIGNUP_FLOW::UI" -> "HALTED"
      * **4.** Inject State into Scopes
      * Reconstruct Target URI
      * Lookup UI State
      * Lookup API State
      * Attach to Scope Object

  * 🔹 **`patch_domain`**
  * 🔹 **`list_config`**
  * 🔹 **`update_config`**

### 📄 `backend/app/domains/system/logic/hypervisor.py`
**Components & Logic:**

- 📦 **`SystemHypervisor`**
    > *The Central Logic for Operational State.*
  * 🔹 **`check_state`**
      > *Checks if a specific Target is allowed to operate on a specific Plane.*
      * **1.** READ CACHE (Fast Path)
      * **2.** CACHE MISS -> FETCH DB (Slow Path)
      * **3.** POPULATE CACHE
      * Default: Implicitly Nominal
      * **4.** Return Result

  * 🔹 **`_interpret_status`**
      > *Converts raw status string to Boolean Permission.*
  * 🔹 **`_update_local_cache`**
      > *Internal helper to set cache with timestamp.*
  * 🔹 **`set_state`**
      > *Upserts a Circuit Breaker state.*
      * **1.** ORM Lookup
      * **2.** Update or Create
      * SQLAlchemy tracks this as 'dirty'
      * **3.** Flush to trigger Interceptor
      * **4.** Cache Update

  * 🔹 **`ensure_circuit`**
      > *Idempotent Registration. Ensures a switch exists.*

### 📄 `backend/app/domains/system/logic/seeder.py`
**Components & Logic:**

- 📦 **`SystemSeeder`**
    > *Bootstrapper for the System Domain.*
  * 🔹 **`seed`**
      > *Idempotent Seeder.*
      * --- PHASE 1: System Config ---
      * --- PHASE 1.5: Meta-Kernel Assets (The Library) ---
      * ⚡ This ensures the Widget Registry is populated before any UI renders
      * --- PHASE 2: Code Registry (Domains & Scopes) ---
      * We use the RegistryManager directly to get the latest Code Definitions
      * **⚡ FIX:** Passing 'db' to fetch Dynamic Types and awaiting the result
      * DomainSummary is a Pydantic model now
      * 2.1 Seed DOMAIN Circuits (API, UI, WORKER)
      * ⚡ CACHE UPDATE: ensure_circuit now updates the Hypervisor memory map too
      * 2.2 Seed SCOPE Circuits (Recursive)
      * All scopes get API and UI controls
      * Only JOB scopes get a Worker control
      * --- PHASE 3: Data Registry (Screens) ---
      * We fetch screens dynamically from the DB
      * Screens are UI Containers, they only have a UI Plane
      * Commit all new circuits


### 📄 `backend/app/domains/system/logic/state.py`
**Components & Logic:**

- 📦 **`SystemState`**
    > *The Central Nervous System Observer.*
  * 🔹 **`get_pulse`**
      > *Returns the unified System State.*
      * **1.** Gather Intelligence
      * **2.** Construct Identity
      * Immutable Code (v2.5.0)
      * Database Structure (Hash)
      * User Logic (SemVer)

  * 🔹 **`_get_schema_version`**
      > *Queries the Alembic Version Table directly.*
  * 🔹 **`_get_content_version`**
      > *Calculates the 'System Content Version'.*
      * Find the highest semantic version label in the Release Table
      * Note: String comparison is used here as a heuristic.
      * In a strict environment, we would use SemVer sorting logic.


---
### 📄 `backend/app/domains/system/models.py`
**Components & Logic:**

- 📦 **`KernelDomain`**
    > *The Master Registry of all installed Modules.*
  * 🔹 **`__repr__`**
- 📦 **`KernelEntity`**
    > *⚡ NEW v3: The Physical Table Registry (Aggregate Components).*
  * 🔹 **`__repr__`**
- 📦 **`KernelScope`**
    > *The Workflow Topology Definition.*
  * 🔹 **`__repr__`**
- 📦 **`KernelScopeImpact`**
    > *⚡ NEW v3: The Impact Graph (Dependency Map).*
- 📦 **`SystemConfig`**
    > *THE CONTROL KNOBS.*
  * 🔹 **`__repr__`**
  * 🔹 **`typed_value`**
      > *Auto-converts value_raw based on value_type.*
- 📦 **`CircuitBreaker`**
    > *The System Hypervisor's Memory.*
  * 🔹 **`__repr__`**

### 📄 `backend/app/domains/system/registry.py`

### 📄 `backend/app/domains/system/seeds.py`
**Components & Logic:**

- ƒ **`seed_static`**
    > *Writes the Constitution, Core Bricks, and UI Shell to the Meta-Kernel.*
    * **1.** Seed Policies
    * **2.** Seed System Domain & Bricks
    * Ensure SYS Domain
    * Ensure SYS Scopes
    * **3.** ⚡ HYDRATE WORKFLOW TYPES (State Engine V3)
    * **4.** ⚡ HYDRATE NAVIGATION (Fractal UI Shell)
    * This ensures the Sidebar and Avatar Menu are populated on boot.

- ƒ **`seed_assets`**
- ƒ **`seed_history`**

---
### 📄 `backend/app/domains/workspace/models.py`
**Components & Logic:**

- 📦 **`Screen`**
    > *THE CANVAS.*
  * 🔹 **`__repr__`**
- 📦 **`ActiveApp`**
    > *THE DRAFT INSTANCE.*
  * 🔹 **`__repr__`**
- 📦 **`Release`**
    > *THE COMMIT (Snapshot).*
  * 🔹 **`__repr__`**
- 📦 **`ReleaseItem`**
    > *THE FROZEN ARTIFACT.*
  * 🔹 **`__repr__`**

### 📄 `backend/app/domains/workspace/router.py`
**Components & Logic:**

- ƒ **`create_screen`**
- ƒ **`list_screens`**
- ƒ **`list_bricks`**
- ƒ **`install_app`**
- ƒ **`configure_app`**
- ƒ **`uninstall_app`**
- ƒ **`publish_release`**
    > *Triggers a Snapshot of the current Draft.*
- ƒ **`list_releases`**
- ƒ **`resolve_layout`**
    > *Returns the layout tree.*

### 📄 `backend/app/domains/workspace/schemas.py`
**Components & Logic:**

- 📦 **`ScreenBase`**
- 📦 **`ScreenCreate`**
- 📦 **`ScreenUpdate`**
- 📦 **`ScreenRead`**
- 📦 **`ScreenList`**
- 📦 **`ActiveAppBase`**
- 📦 **`ActiveAppCreate`**
- 📦 **`ActiveAppUpdate`**
- 📦 **`ActiveAppRead`**
- 📦 **`BrickList`**
- 📦 **`ReleaseCreate`**
- 📦 **`ReleaseRead`**

### 📄 `backend/app/domains/workspace/seeds.py`
**Components & Logic:**

- ƒ **`seed_assets`**
    > *Wave 2: Create Default Screens.*
    * **1.** The Admin Console (Meta Studio)
    * This matches the Frontend Route '/meta'
    * **2.** Example Business App (Logistics)


### 📄 `backend/app/domains/workspace/service.py`
**Components & Logic:**

- 📦 **`WorkspaceService`**
  * 🔹 **`create_screen`**
  * 🔹 **`list_screens`**
      * **⚡ ENRICHMENT:** Eager load live_release to show version info in Lobby
      * **⚡ SORTING:** Show most recently updated screens first

  * 🔹 **`list_available_bricks`**
      * **⚡ FILTER:** Only UI-compatible bricks (Use Enum SSOT)
      * We explicitly exclude ScopeType.JOB as it's a backend-only construct

  * 🔹 **`install_app`**
      * ⚡ TOUCH PARENT: Update screen.updated_at so it moves to top of list

  * 🔹 **`update_app`**
      * ⚡ TOUCH PARENT

  * 🔹 **`uninstall_app`**
      * ⚡ TOUCH PARENT

  * 🔹 **`publish_release`**
      * Auto-increment internal counter
      * Snapshot Logic

  * 🔹 **`list_releases`**
  * 🔹 **`resolve_layout`**
      * ⚡ HISTORY LOOKUP: Fetch the absolute latest release to inform the UI
      * **MODE:** LIVE (Render from Snapshot)
      * **MODE:** DRAFT (Render from ActiveApps)


---
### 📄 `backend/app/main.py`
**Components & Logic:**

- ƒ **`lifespan`**
    * ⚡ PHASE 1: KERNEL BOOT (Read-Only Cache Hydration)
    * ⚡ ARCHITECTURAL INVARIANT: The API Server only READS during boot.
    * Seeding is strictly delegated to the standalone `seed.py` Orchestrator.
    * We don't raise here to allow the API to start in "Safe Mode" if DB fails,
    * but in Level 100 we might want to crash. For now, we log loud.

- ƒ **`create_application`**
    * ⚡ GLOBAL INTERCEPTOR (Business Logic Gates)
    * **1.** MAINTENANCE CHECK (Global)
    * **2.** ⚡ DOMAIN ENFORCEMENT (Kill Switch)
    * ⚡ INFRASTRUCTURE MIDDLEWARE (Execution Order: Bottom-Up)
    * **3.** CORS (Outermost)
    * **2.** CONTEXT HYDRATION (Injects User/TraceID)
    * **1.** ROUTER MOUNTING


---
### 📄 `backend/app/middleware/context.py`
**Components & Logic:**

- 📦 **`ContextMiddleware`**
    > *Ensures every request has a Trace ID and populates the GlobalContext*
  * 🔹 **`dispatch`**
      * **1.** ⚡ TRACE ID (Generate or Propagate)
      * **2.** ⚡ AUTHENTICATION INSPECTION
      * We manually decode the JWT here to ensure the Context is available
      * even if the endpoint doesn't strictly require auth (e.g. for logging).
      * Decode JWT
      * Hydrate Context from Token Claims
      * Note: Ideally the token contains role/email.
      * If not, we set safe defaults that the ActorProvider can return.
      * ⚡ FAIL OPEN (For Middleware):
      * We don't block the request here. We just don't set the context.
      * The Domain Enforcer or Endpoint Dependency will handle 401s.
      * **3.** ⚡ SET GLOBAL CONTEXT
      * **4.** ⚡ EXECUTE REQUEST
      * **5.** ⚡ INJECT TRACE ID INTO RESPONSE HEADER


---
### 📄 `backend/audit_hardcoding.py`
**Components & Logic:**

- 📦 **`HardCodingVisitor`**
  * 🔹 **`__init__`**
  * 🔹 **`visit_Assign`**
      > *Checks variable assignments (e.g., x = '12345').*
      * If assigning to UPPER_CASE, it's a Constant (Acceptable).

  * 🔹 **`visit_Call`**
      > *Checks function arguments (e.g., connect('192.168.1.1')).*
      * Skip logging calls (usually safe text)

  * 🔹 **`_check_value`**
      * **1.** Check for specific dangerous patterns
      * Filter out simple path routes like "/api/v1" or relative paths
      * **2.** Check for "Magic Strings" in logic (longer than 10 chars, no spaces)
      * if len(value) > 15 and " " not in value and not value.startswith("antd:"):
      * self.issues.append({
      * "file": self.filename,
      * "line": lineno,
      * "type": "ℹ️ Magic String",
      * "value": value,
      * "context": context
      * })
      * **3.** Check for "Magic Numbers"

- ƒ **`scan_file`**
- ƒ **`main`**
    * Filter Ignored Directories


### 📄 `backend/cartographer.py`
**Components & Logic:**

- 📦 **`SemanticNode`**
    > *Represents a code unit (Class, Function) and its metadata.*
  * 🔹 **`__init__`**
- 📦 **`FileAnalysis`**
    > *Holds the scan results for a single file.*
  * 🔹 **`__init__`**
- 📦 **`SemanticVisitor`**
  * 🔹 **`__init__`**
  * 🔹 **`_parse_tags`**
      > *Extracts @tag: value from docstrings.*
  * 🔹 **`_extract_narrative`**
      > *Scans function body for comments and cleans them.*
      * ' in line:
      * ', 1)[1].strip()

  * 🔹 **`visit_Module`**
  * 🔹 **`visit_ClassDef`**
  * 🔹 **`visit_FunctionDef`**
  * 🔹 **`visit_AsyncFunctionDef`**
  * 🔹 **`_visit_function`**
- 📦 **`Cartographer`**
    > *The Main Orchestrator.*
  * 🔹 **`__init__`**
  * 🔹 **`run`**
  * 🔹 **`_scan_codebase`**
  * 🔹 **`_prettify_comment`**
      > *Transforms raw comments into rich Markdown.*
  * 🔹 **`_render_atlas`**
      * **1.** Folder Header (Optional, good for grouping)
      * **⚡ FIX:** Construct the FULL DISPLAY PATH
      * "backend" + "app/core/system.py" = "backend/app/core/system.py"
      * Logic for Role Icons
      * **2.** File Header with FULL PATH
      * Description
      * Nodes

  * 🔹 **`_render_node`**

### 📄 `backend/check_ai.py`
**Components & Logic:**

- ƒ **`main`**
    * Mask key for security
    * **2.** Initialize Client (New SDK)
    * **3.** List Models
    * The new SDK list method returns an iterable of models
    * **4.** Thinking Model Check
    * We have to re-iterate or store the list, but list() returns a generator usually.
    * Let's just do a specific check if we didn't see it above (visual check is good enough for diag).
    * Actually, let's verify connectivity with a quick test.
    * Use a generic flash model for safety test


### 📄 `backend/consumer.py`
**Components & Logic:**

- ƒ **`consume`**

### 📄 `backend/nuke.py`
**Components & Logic:**

- ƒ **`smart_nuke`**
    > *Connects to the Maintenance DB (postgres) to drop/create the Target DB (flodock).*
    * **1.** Parse Config to get target DB name
    * **2.** Construct Maintenance Connection (Connect to 'postgres' instead of target)
    * We replace the path (database name) with 'postgres'
    * Isolation level AUTOCOMMIT is required to run DROP DATABASE
    * **3.** Kill Active Connections (The "Force" move)
    * **4.** Drop Database
    * **5.** Create Database
    * **6.** Grant Permissions (Optional but good practice)
    * await conn.execute(text(f"GRANT ALL PRIVILEGES ON DATABASE {target_db} TO {parsed.username};"))
    * If we failed to connect to 'postgres', maybe the credentials only allow connecting to specific DBs?


### 📄 `backend/probe_diagnostics.py`
**Components & Logic:**

- ƒ **`run_diagnostics`**
    * **1.** INSPECT COLUMNS (The Truth)
    * We use `run_sync` to use the standard SQLAlchemy inspector
    * **2.** CHECK DATA
    * Show the latest event


---
### 📄 `backend/scripts/kafka/consume.py`
**Components & Logic:**

- ƒ **`consume`**

### 📄 `backend/scripts/kafka/install.py`
**Components & Logic:**

- ƒ **`get_paths`**
    * resolve relative to this script: backend/scripts/kafka/

- ƒ **`download_progress`**
- ƒ **`force_remove`**
    > *Retries deletion to handle Windows file locks.*
- ƒ **`install`**
    * **1.** PREPARE DIR
    * **2.** CHECK EXISTING
    * **3.** DOWNLOAD
    * **4.** EXTRACT
    * Python 3.12+ filter fix
    * **5.** RENAME & MOVE
    * Cleanup Zip
    * **6.** CONFIGURE
    * Paths must use forward slashes for Java on Windows
    * Patch Server
    * Patch Zookeeper


### 📄 `backend/scripts/kafka/patch_config.py`
**Components & Logic:**

- ƒ **`get_paths`**
    * resolve relative to this script: ../../../infrastructure/kafka

- ƒ **`patch_file`**
    * Add missing keys

- ƒ **`main`**
    * Define Paths
    * Define Data Directories (Force Forward Slashes for Java)
    * **1.** Patch Server Properties
    * **2.** Patch Zookeeper Properties


### 📄 `backend/scripts/kafka/run_cluster.py`
**Components & Logic:**

- ƒ **`get_paths`**
- ƒ **`find_java_home`**
- ƒ **`run_service_blocking`**
    > *Runs the service in the CURRENT process.*
    * Minimal Path + Wbem
    * Construct Command
    * **FIX:** Use raw string for Windows wildcard path

- ƒ **`main`**

---
### 📄 `backend/seed.py`
**Components & Logic:**

- ƒ **`get_domain_modules`**
    > *Scans 'app/domains' and returns a list of active modules.*
- ƒ **`run_wave`**
    > *Executes a specific wave across ALL domains simultaneously.*
- ƒ **`run_seeding_process`**
    > *The Main Execution Flow.*
    * ⚡ PHASE 0: ZERO-TOUCH BOOTSTRAP (The "Smart Start")
    * Dynamically load all Domain Models into memory so SQLAlchemy knows they exist
    * Force SQLAlchemy to construct the physical tables if they are missing
    * --- RESET MODE (Reverse Waves) ---
    * ⚡ PHASE 0.5: KERNEL HYDRATION
    * --- SEED MODE (Forward Waves) ---
    * Guard: Don't run History in Prod unless explicit

- ƒ **`main`**

### 📄 `backend/trigger_circuit.py`
**Components & Logic:**

- ƒ **`fire_circuit_event`**
    * ⚡ MANUALLY REGISTER INTERCEPTOR (Required for standalone scripts)
    * **1.** Ensure it exists (Prime the cache/db)
    * **2.** Toggle State (The Mutation)
    * This calls the refactored ORM method
    * **3.** Commit (Triggers Interceptor)


### 📄 `backend/trigger_event.py`
**Components & Logic:**

- ƒ **`fire_test_event`**
    * **⚡ CRITICAL:** We must register the interceptor manually for this script context
    * In the real app, main.py does this.
    * **1.** Fetch User
    * **2.** Modify State (Trigger Dirty Check)
    * We update a field to force SQLAlchemy to mark it 'dirty'
    * **3.** Commit (Triggers Interceptor -> Outbox)


### 📄 `backend/trigger_meta.py`
**Components & Logic:**

- ƒ **`fire_meta_event`**
    * Register Interceptor
    * Verify Registration
    * **1.** Create Policy
    * **2.** Commit (Triggers Interceptor)


