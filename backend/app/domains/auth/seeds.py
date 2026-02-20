# FILEPATH: backend/app/domains/auth/seeds.py
# @file: Auth Domain Seeder
# @role ⚙️ Data Hydration
# @author: The Engineer
# @description: Initializes Users, Workflows, Preference Schemas, AND Governance Bindings.
# @updated: Excludes JOB/VIEW scopes from State Engine to prevent validation crashes. Added 'prefs_domain' recursion.

import logging
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import get_password_hash
from app.domains.auth.models import User
from app.domains.auth.registry import auth_domain, prefs_domain # ⚡ ADDED: prefs_domain

# Meta Models for Governance
from app.core.meta.models import PolicyDefinition, PolicyBinding

# State Engine
from app.core.meta.features.states.service import StateService
from app.core.meta.features.states.schemas import StateMachineCreate

# Fractal Feature
from app.domains.auth.features.preferences.seeds import seed_preferences_schema

logger = logging.getLogger("flodock.domains.auth.seeds")

async def seed_assets(db: AsyncSession):
    """
    Wave 2: Core Assets
    1. Create Super Admin
    2. Register Workflows (Identity + Preferences)
    3. Seed Preference Schema
    4. Bind Governance (Compliance)
    """
    # --- 1. ADMIN USER ---
    admin_email = "anand@flodock.com"
    logger.info(f"   🔐 [Auth] Verifying Super Admin identity ({admin_email})...")
    
    result = await db.execute(select(User).where(User.email == admin_email))
    if not result.scalars().first():
        logger.info(f"   👤 Minting Super Admin ({admin_email})...")
        admin_user = User(
            email=admin_email,
            hashed_password=get_password_hash("password123"),
            full_name="Anand (System Architect)",
            role="admin",
            is_active=True,
            is_superuser=True,
            status="ACTIVE",
            approval_state="APPROVED"
        )
        db.add(admin_user)
        logger.info("   ✨ Admin user queued.")
    else:
        logger.info(f"   ✅ Admin user ({admin_email}) active. Skipping.")

    # --- 2. WORKFLOW REGISTRATION (Refactored) ---
    logger.info("   🧬 [Auth] Hydrating State Machines from Registry...")
    
    # ⚡ CORE IDENTITY FLOWS (USER)
    await _register_domain_workflows(db, auth_domain)
    
    # ⚡ SIDECAR FLOWS (USER_PREFS)
    # This fixes the missing "User Settings" workflow
    await _register_domain_workflows(db, prefs_domain)

    # --- 3. PREFERENCE SCHEMA ---
    await seed_preferences_schema(db)

    # --- 4. ⚡ GOVERNANCE BINDING (Compliance) ---
    # The User Domain voluntarily accepts the System's Laws
    await seed_governance(db)

    logger.info("   ✅ [Auth] Assets & Workflows Seeded.")


async def _register_domain_workflows(db: AsyncSession, domain_ctx):
    """
    Helper to register workflows for a specific Domain Context.
    Ensures the correct 'domain_key' is used and JOBS are skipped.
    """
    for raw_scope in domain_ctx.supported_scopes:
        # Handle Tuple vs Dict scopes (Legacy shim)
        if isinstance(raw_scope, tuple):
            scope = raw_scope[1]
        else:
            scope = raw_scope

        scope_type = scope.get("type")
        
        # ⚡ CRITICAL FILTER: Only register State Machines (WIZARD, GOVERNANCE).
        # We EXCLUDE 'JOB' and 'VIEW' because they don't have XState definitions.
        if scope_type in ["WIZARD", "GOVERNANCE"] and scope.get("config"):
            logger.debug(f"      ↳ Processing Workflow: [{domain_ctx.domain_key}] {scope['key']}...")
            
            payload = StateMachineCreate(
                domain=domain_ctx.domain_key, # ⚡ DYNAMIC KEY (USER or USER_PREFS)
                scope=scope["key"],
                name=scope["label"],
                governed_field=scope.get("target_field") or "status",
                definition=scope["config"]
            )

            try:
                await StateService.create_machine(db, payload)
            except Exception as e:
                logger.error(f"      ❌ Failed to seed workflow {scope['key']}: {e}")


async def seed_governance(db: AsyncSession):
    """
    Binds the USER domain to Global System Policies.
    """
    logger.info("   ⚖️ [Auth] Binding to System Governance...")
    
    # ⚡ THE COMPLIANCE LIST
    # "We agree to follow these System Policies"
    BINDINGS = [
        {
            "policy_key": "sys_root_integrity_v1",
            "target_domain": "USER",
            "priority": 100
        },
        {
            "policy_key": "sys_data_hygiene_v1",
            "target_domain": "USER",
            "priority": 10
        }
    ]

    for b_def in BINDINGS:
        # 1. Find the Law
        stmt = select(PolicyDefinition).where(PolicyDefinition.key == b_def["policy_key"])
        result = await db.execute(stmt)
        policy = result.scalars().first()
        
        if not policy:
            logger.warning(f"      ⚠️ Law '{b_def['policy_key']}' not found. Compliance skipped.")
            continue

        # 2. Check for existing Binding
        stmt_b = select(PolicyBinding).where(
            PolicyBinding.policy_id == policy.id,
            PolicyBinding.target_domain == b_def["target_domain"]
        )
        existing_b = await db.execute(stmt_b)
        if existing_b.scalars().first():
            continue

        # 3. Sign the Contract
        binding = PolicyBinding(
            policy_id=policy.id,
            target_domain=b_def["target_domain"],
            priority=b_def["priority"],
            is_active=True
        )
        db.add(binding)
        logger.info(f"      [COMPLIANCE] Bound '{b_def['policy_key']}' to this Domain.")
    
    await db.commit()

