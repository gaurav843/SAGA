# FILEPATH: backend/app/api/v1/auth.py
# @file: Authentication Endpoints
# @author: The Engineer
# @description: Handles Login with Strict Kernel Governance.
# UPDATED: Added 'partition_key' to kernel.publish call.

from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from datetime import datetime

from app.core.database.session import get_db
from app.core import security
from app.domains.auth.models import User
from app.domains.auth.schemas import Token, UserLogin

# 🔌 KERNEL INTEGRATION
from app.core.kernel.kernel import kernel
from app.core.kernel.logic_engine import logic_engine

router = APIRouter()

@router.post("/login", response_model=Token)
async def login(
    login_data: UserLogin,
    db: AsyncSession = Depends(get_db)
) -> Any:
    """
    OAuth2 compatible token login.
    Enforces Kernel Rules (e.g., Block Lists) and Generates Audit Events.
    """
    # 1. Find User by Email
    result = await db.execute(select(User).where(User.email == login_data.email))
    user = result.scalars().first()

    # 2. Validate Existence
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )

    # 3. GUARDRAIL: System User Check (Hard Logic)
    if user.is_system_user:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="System accounts are restricted from UI access.",
        )

    # 4. Verify Password
    if not security.verify_password(login_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )

    # 5. Check Active Status
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user",
        )

    # --- 🛡️ KERNEL GOVERNANCE (The "Brain") ---
    # We ask the Logic Engine if this specific user is allowed to LOGIN right now.
    verdict = logic_engine.evaluate(domain_key="USER", entity=user, event_type="LOGIN")
    
    if not verdict.is_valid:
        error_msg = verdict.blocking_errors[0] if verdict.blocking_errors else "Login blocked by security policy."
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=error_msg
        )

    # --- 📝 STATE UPDATE & AUDIT (The "Memory") ---
    
    # Update Last Login (Triggers a DB Write)
    user.last_login = datetime.utcnow()
    
    # Publish Audit Event to SystemOutbox
    # ⚡ FIX: Added partition_key for Kafka Ordering
    await kernel.publish(
        db=db, 
        event="USER:LOGIN",
        payload={
            "email": user.email,
            "role": user.role,
            "status": "SUCCESS"
        },
        entity_id=user.id,
        partition_key=str(user.id) # Ensure all login events for this user go to same partition
    )

    # Commit Transaction (Saves User Update + Outbox Event atomically)
    await db.commit()
    await db.refresh(user)

    # 6. Mint Token
    access_token = security.create_access_token(subject=user.id)
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }

