# Governance Engine Architecture

## 1. Overview
The Governance Engine is a centralized logic processor designed to enforce business rules, data integrity, and UI behavior across the Flodock OS. It decouples **Logic** (The Rule) from **Execution** (The Trigger).

### Core Concepts
1.  **Policy:** A versioned container of logic (e.g., "Data Hygiene").
2.  **Rule:** An atomic condition-consequence pair (e.g., "IF Age < 18 THEN Block").
3.  **Binding (Switchboard):** The connection between a Policy and a Context (e.g., "Apply 'Data Hygiene' to the 'USER' domain").

---

## 2. Versioning Strategy: The Immutable Ledger
We utilize a **"Fork & Promote"** strategy to ensure auditability and safe rollbacks.

* **Immutability:** Once a Policy Version is saved, it is **never** modified.
* **Drafting:** Clicking "Save Draft" creates a new version (e.g., `v1.05` -> `v1.06`) but marks it `is_active=false`.
* **Publishing:** Clicking "Publish" creates a new version, marks it `is_active=true`, and updates the `is_latest` pointer.
* **Restoration:** Restoring an old version (e.g., `v1.02`) does not "move back" in time. It **copies** the old logic into a **new** forward version (`v1.07`), preserving the linear history.

### Database Schema (`meta_policy_definitions`)
| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | INT | Primary Key |
| `key` | STRING | Logical ID (e.g., `sys_data_hygiene`) |
| `version_major` | INT | Major Version (Rollover at 100 minor) |
| `version_minor` | INT | Minor Version |
| `is_latest` | BOOL | Points to the "Head" of the chain |
| `rules` | JSONB | The compiled JMESPath logic |

---

## 3. Logic Engine (JMESPath)
We use **JMESPath** as the query language for all rules. This allows for complex, nested JSON inspection without `eval()` risks.

### Supported Operators
* **Comparison:** `==`, `!=`, `>`, `<`
* **String:** `contains`, `starts_with`, `regex_match` (Custom Shim)
* **Existence:** `is_empty`, `is_not_empty`

### Execution Flow
1.  **Input:** The Engine receives the `Entity` (Data) and the `Context` (User Role, State).
2.  **Evaluation:** It iterates through all Active Policies bound to the current Domain.
3.  **Aggregation:** Results are aggregated based on the Resolution Strategy (`ALL_MUST_PASS` vs `AT_LEAST_ONE`).
4.  **Output:** A Result Object containing:
    * `is_valid`: Boolean
    * `blocking_errors`: List of strings
    * `mutations`: Field updates (`SET_VALUE`)
    * `ui_hints`: Instructions for the Frontend (`HIDE`, `DISABLE`)

---

## 4. UI Architecture
* **Visual Builder:** A "No-Code" abstraction layer that generates JMESPath strings.
* **Test Panel:** A Sandbox that hits `POST /dry-run` to validate logic against a mock JSON payload before saving.
* **History Drawer:** A timeline visualizer that fetches `GET /history` and allows "Time Travel" restoration.

