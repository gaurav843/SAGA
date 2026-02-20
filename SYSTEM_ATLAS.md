# 🗺️ SYSTEM ATLAS
**Generated:** 2026-02-03 14:49

> **The Cartographer:** This file is auto-generated. DO NOT EDIT MANUALLY.

## 📦 1. DOMAIN REGISTRY (The Organs)
Active Business Modules loaded in the Kernel.

*⚠️ No Domains Detected (Check Database Connection or Import Paths)*
## ⚡ 2. SIGNAL FLOW (The Nervous System)
Events defined in the system vs. where they are actually triggered.

| Event Name | Defined In | Status |
| :--- | :--- | :--- |

## 🏛️ 3. ARCHITECTURE INDEX (The Z-Axis)
Critical system layers and their risk levels.

* **Level 0: Infrastructure**
    * Path: `backend/core/database`
    * Risk: 🔥 HIGH RISK
    * Role: Postgres, Redis, Session Factory
* **Level 1: The Kernel**
    * Path: `backend/core/kernel`
    * Risk: 🔥 HIGH RISK
    * Role: Event Bus, Outbox, Registry, Interceptor
* **Level 2: The Meta-Kernel**
    * Path: `backend/core/meta`
    * Risk: ⚠️ MEDIUM RISK
    * Role: Policy Engine, Schema Factory
* **Level 3: The Domains**
    * Path: `backend/app/domains`
    * Risk: 🟢 SAFE
    * Role: Business Logic (Users, Shipping)
* **Level 4: The API**
    * Path: `backend/app/api`
    * Risk: 🟢 SAFE
    * Role: Routers, Pydantic Schemas
