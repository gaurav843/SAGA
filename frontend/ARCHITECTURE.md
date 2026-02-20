FILEPATH: frontend/ARCHITECTURE.md

```markdown
# 🏛️ Flodock Frontend Architecture

> **Version:** 2.6 (Level 7 - Autonomous)
> **Stack:** React 19, TypeScript, Ant Design 5, XState, OpenAPI Codegen

## 🌟 The Vision
Flodock is not a "website"; it is an **Enterprise Operating System**. 
We do not build "pages"; we build **Modules** that plug into a **Kernel**.

Our goal is **Cognitive Continuity**: A user should move from "User Management" to "System Settings" without feeling like they switched applications.

---

## 🏗️ The Fractal Structure

We organize code by **Domain**, not by Technology.

```text
src/
├── api/                    # 🤖 GENERATED CODE (Do Not Touch)
│   ├── models/             #    - TypeScript Interfaces (User, Policy)
│   └── services/           #    - API Clients (AuthService, MetaService)
│
├── platform/               # ⚙️ THE KERNEL (Generic)
│   ├── shell/              #    - The Window Frame, Navigation, Theme
│   ├── ui/                 #    - The Standard Library (MasterDetailShell)
│   ├── auth/               #    - Authentication Actors (XState)
│   └── logging/            #    - Telemetry & Tracing
│
└── domains/                # 📦 THE BUSINESS (Specific)
    ├── meta/               #    - The "System Builder" Module
    │   ├── features/       #      - Specific capabilities (Dictionary, Governance)
    │   └── manifest.tsx    #      - Plugin Registration
    └── [future_domain]/
🤖 Level 7: The Automation Layer
We have eliminated the "Dual Maintenance" problem of keeping Python Pydantic models and TypeScript Interfaces in sync.

1. The Generator
We use openapi-typescript-codegen to read the Backend's brain.

Input: http://localhost:8000/api/v1/openapi.json

Output: src/api

2. The Sync-Bot
When you run start_dev.bat, a background process (Window 2) watches the API.

Loop: Every 5 seconds, it polls the backend.

Action: If the schema changes, it regenerates the code.

3. Usage Rule
⛔ NEVER write:

TypeScript
interface User { id: string; name: string; } // Manual = Bad
fetch('/api/users')                          // Manual = Bad
✅ ALWAYS write:

TypeScript
import { User } from 'src/api/models/User';
import { UsersService } from 'src/api/services/UsersService';

const user: User = await UsersService.get(id);
🎨 UI & UX Standards
1. The "Master-Detail" Pattern
We standardize complex management screens using the MasterDetailShell.

Left Pane: Navigation/Search (Collapsible).

Right Pane: Contextual Editor.

Behavior: Persistence of sidebar state and cinematic fade transitions are enforced by MasterDetailShell.

2. Motion Design
We do not use heavy animation libraries. We use CSS Modules injected with Ant Design Tokens.

Standard: token.motionDurationMid (~0.2s).

Type: Subtle Fade + Slide Up (4px).

3. Communicative UI
We prefer Verbose UI over Minimalist UI for configuration.

Help Text: Every complex field must have a tooltip or description.

Wizards: Use guided config panels (like in Dictionary) rather than raw JSON inputs.

🧠 State Management
1. Server State (The Truth)
Handled by TanStack Query (React Query).

Pattern: Custom hooks per feature (e.g., useDictionary).

Rule: Components should never call axios directly; they call the hook.

2. UI State (The Ephemeral)
Handled by React Local State (useState).

Use for: Form inputs, sidebar toggles, modal visibility.

3. App State (The Machine)
Handled by XState.

Use for: Authentication flow, Global System Status, Multi-step Wizard logic.