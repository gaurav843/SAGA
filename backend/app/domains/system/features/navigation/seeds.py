# FILEPATH: backend/app/domains/system/features/navigation/seeds.py
# @file: UI Navigation Seeder
# @role: ⚙️ Data Hydration
# @author: The Engineer (ansav8@gmail.com)
# @description: Initializes the Core OS Shell Navigation structure.
# @security-level: LEVEL 9 (System Critical)
# @invariant: Operations must be idempotent.
# @updated: Renamed Mission Control to Meta and added Meta-V2.

import logging
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.dialects.postgresql import insert

from app.domains.system.models import SystemMenuNode

logger = logging.getLogger("system.features.navigation.seeds")

# ==============================================================================
#  THE SHELL NAVIGATION (Core UI Menus)
# ==============================================================================
CONST_MENU_NODES = [
    {
        "key": "core.meta",
        "zone": "MAIN_SIDEBAR",
        "label": "Meta",
        "icon": "antd:DashboardOutlined",
        "path": "/",
        "component_path": "frontend/src/domains/system/features/admin_console/SystemDashboard.tsx",
        "api_endpoint": "GET /api/v1/system/pulse",
        "search_tags": ["meta", "dashboard", "analytics", "status", "health", "system"],
        "weight": 0,
        "required_policy": None,
        "config": {}
    },
    {
        "key": "core.meta_v2",
        "zone": "MAIN_SIDEBAR",
        "label": "Meta-V2",
        "icon": "antd:RocketOutlined",
        "path": "/meta-v2",
        "component_path": "frontend/src/domains/meta_v2/MetaV2Root.tsx",
        "api_endpoint": "GET /api/v1/meta/topology",
        "search_tags": ["meta-v2", "v2", "experimental", "new system", "topology"],
        "weight": 5,
        "required_policy": "sys_admin_only", # Example policy requirement
        "config": {"beta": True}
    },
    {
        "key": "user.profile",
        "zone": "AVATAR_DROPDOWN",
        "label": "Profile",
        "icon": "antd:UserOutlined",
        "path": "ACTION:PROFILE",
        "component_path": "frontend/src/domains/system/features/identity/UserProfileModal.tsx",
        "api_endpoint": "GET /api/v1/auth/me",
        "search_tags": ["account", "me", "settings", "password", "identity"],
        "weight": 10,
        "required_policy": None,
        "config": {}
    },
    {
        "key": "sys.appearance",
        "zone": "AVATAR_DROPDOWN",
        "label": "Appearance",
        "icon": "antd:BgColorsOutlined",
        "path": "ACTION:THEME",
        "component_path": "frontend/src/platform/shell/ThemePicker.tsx",
        "api_endpoint": None,
        "search_tags": ["theme", "dark mode", "light mode", "color", "design"],
        "weight": 20,
        "required_policy": None,
        "config": {}
    },
    {
        "key": "sys.logout",
        "zone": "AVATAR_DROPDOWN",
        "label": "Logout",
        "icon": "antd:LogoutOutlined",
        "path": "ACTION:LOGOUT",
        "component_path": None,
        "api_endpoint": "POST /api/v1/auth/logout",
        "search_tags": ["sign out", "exit", "disconnect"],
        "weight": 100,
        "required_policy": None,
        "config": {"danger": True, "divider_before": True}
    }
]

async def seed_navigation(db: AsyncSession):
    """
    @description: Idempotent seeder for the OS Navigation Menu.
    """
    logger.info("   🧭 [System] Registering UI Shell Navigation...")
    count = 0
    
    for m_node in CONST_MENU_NODES:
        stmt_menu = insert(SystemMenuNode).values(
            key=m_node["key"],
            zone=m_node["zone"],
            label=m_node["label"],
            icon=m_node["icon"],
            path=m_node["path"],
            component_path=m_node["component_path"],
            api_endpoint=m_node["api_endpoint"],
            search_tags=m_node["search_tags"],
            weight=m_node["weight"],
            required_policy=m_node["required_policy"],
            config=m_node["config"]
        ).on_conflict_do_update(
            index_elements=['key'],
            set_={
                "zone": m_node["zone"],
                "label": m_node["label"],
                "icon": m_node["icon"],
                "path": m_node["path"],
                "component_path": m_node["component_path"],
                "api_endpoint": m_node["api_endpoint"],
                "search_tags": m_node["search_tags"],
                "weight": m_node["weight"],
                "required_policy": m_node["required_policy"],
                "config": m_node["config"]
            }
        )
        await db.execute(stmt_menu)
        logger.info(f"      [MENU] Synced: {m_node['key']}")
        count += 1
    
    await db.commit()
    logger.info(f"   ✅ [System] Navigation Registry Synced ({count} Nodes).")

