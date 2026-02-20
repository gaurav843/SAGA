# FILEPATH: backend/app/domains/workspace/seeds.py
# @file: Workspace Seeder (Default Layouts)
# @author: The Engineer
# @description: Seeds the initial "Admin Console" screen.

import logging
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.domains.workspace.models import Screen

logger = logging.getLogger("domains.workspace.seeds")

async def seed_assets(db: AsyncSession):
    """
    Wave 2: Create Default Screens.
    """
    logger.info("   🏗️ [Workspace] Checking Default Screens...")

    # 1. The Admin Console (Meta Studio)
    # This matches the Frontend Route '/meta'
    slug = "meta"
    stmt = select(Screen).where(Screen.route_slug == slug)
    existing = await db.execute(stmt)
    
    if not existing.scalars().first():
        admin_screen = Screen(
            title="System Configuration",
            route_slug=slug,
            security_policy={"roles": ["admin"], "mode": "strict"},
            is_active=True
        )
        db.add(admin_screen)
        logger.info(f"      ✨ Created Screen: /{slug}")
    
    # 2. Example Business App (Logistics)
    slug_biz = "logistics"
    stmt_biz = select(Screen).where(Screen.route_slug == slug_biz)
    existing_biz = await db.execute(stmt_biz)

    if not existing_biz.scalars().first():
        biz_screen = Screen(
            title="Logistics Hub",
            route_slug=slug_biz,
            security_policy={"roles": ["manager", "driver"], "mode": "allow"},
            is_active=True
        )
        db.add(biz_screen)
        logger.info(f"      ✨ Created Screen: /{slug_biz}")

    await db.commit()

