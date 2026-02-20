# FILEPATH: backend/app/core/meta/features/widgets/seeds/structures.py
# @file: Widget Registry - Structures
# @description: Structural Components (Grids, Layouts, Feedback, Actions).
# @updated: Enforced UPPERCASE keys for Registry Consistency (SMART_GRID).

WIDGETS_STRUCTURES = [
    # --- DATA DISPLAY ---
    {
        # ⚡ CRITICAL FIX: Key must be UPPERCASE to match Frontend Registry
        "key": "SMART_GRID",
        "name": "Smart Data Grid",
        "description": "Server-side paginated table with filtering.",
        "category": "DATA_DISPLAY",
        "icon": "antd:TableOutlined",
        "props_schema": {
            "type": "object",
            "properties": {
                "columns": {"type": "array"},
                "searchable": {"type": "boolean", "default": True},
                "rowSelection": {"type": "boolean", "default": False},
                # Action hooks for the grid
                "create_flow": {"type": "string"},
                "edit_flow": {"type": "string"}
            }
        },
        "events": ["ROW_CLICK", "SELECTION_CHANGE", "ACTION"]
    },
    {
        "key": "PRO_TABLE",
        "name": "Pro Table",
        "description": "Advanced CRUD Table.",
        "category": "DATA_DISPLAY",
        "icon": "antd:DatabaseOutlined",
        "props_schema": {
            "type": "object",
            "properties": {
                "headerTitle": {"type": "string"},
                "tooltip": {"type": "string"}
            }
        },
        "events": ["ACTION"]
    },
    {
        "key": "EDITABLE_TABLE",
        "name": "Editable Table",
        "description": "Inline editing grid.",
        "category": "DATA_DISPLAY",
        "icon": "antd:EditOutlined",
        "props_schema": {
            "type": "object",
            "properties": {
                "maxLength": {"type": "integer"}
            }
        },
        "events": ["CHANGE"]
    },
    {
        "key": "DESCRIPTION_LIST",
        "name": "Description List",
        "description": "Read-only property display.",
        "category": "DATA_DISPLAY",
        "icon": "antd:ProfileOutlined",
        "props_schema": {
            "type": "object",
            "properties": {
                "column": {"type": "integer", "default": 2}
            }
        },
        "events": []
    },
    # --- ACTIONS ---
    {
        "key": "ACTION_BUTTON",
        "name": "Action Trigger",
        "description": "Button to launch sub-workflows or external actions.",
        "category": "ACTION",
        "icon": "antd:ThunderboltOutlined",
        "props_schema": {
            "type": "object",
            "properties": {
                "label": {"type": "string"},
                "action_type": {"type": "string", "enum": ["WIZARD", "API", "LINK"]},
                "target_scope": {"type": "string"},
                "danger": {"type": "boolean", "default": False}
            }
        },
        "events": ["CLICK"]
    },
    # --- LAYOUTS ---
    {
        "key": "GROUP",
        "name": "Field Group",
        "description": "Groups fields horizontally or vertically.",
        "category": "CONTAINER",
        "icon": "antd:GroupOutlined",
        "props_schema": {
            "type": "object",
            "properties": {
                "title": {"type": "string"},
                "direction": {"type": "string", "enum": ["horizontal", "vertical"], "default": "horizontal"},
                "collapsible": {"type": "boolean", "default": False}
            }
        },
        "events": []
    },
    {
        "key": "SECTION",
        "name": "Section Card",
        "description": "Collapsible card container.",
        "category": "CONTAINER",
        "icon": "antd:BorderOuterOutlined",
        "props_schema": {
            "type": "object",
            "properties": {
                "title": {"type": "string"},
                "collapsible": {"type": "boolean", "default": True},
                "defaultCollapsed": {"type": "boolean", "default": False}
            }
        },
        "events": ["EXPAND", "COLLAPSE"]
    },
    {
        "key": "TABS",
        "name": "Tab Container",
        "description": "Tabbed content area.",
        "category": "CONTAINER",
        "icon": "antd:FolderOpenOutlined",
        "props_schema": {
            "type": "object",
            "properties": {
                "type": {"type": "string", "enum": ["card", "line"], "default": "card"},
                "tabPosition": {"type": "string", "enum": ["top", "left"], "default": "top"}
            }
        },
        "events": ["TAB_CHANGE"]
    },
    # --- FEEDBACK ---
    {
        "key": "RESULT",
        "name": "Result Page",
        "description": "Success, Error, or Warning status page.",
        "category": "FEEDBACK",
        "icon": "antd:InfoCircleOutlined",
        "props_schema": {
            "type": "object",
            "properties": {
                "status": {"type": "string", "enum": ["success", "error", "info", "warning", "403", "404", "500"], "default": "info"},
                "title": {"type": "string"},
                "subTitle": {"type": "string"}
            }
        },
        "events": []
    },
    {
        "key": "EMPTY",
        "name": "Empty State",
        "description": "Placeholder for no data.",
        "category": "FEEDBACK",
        "icon": "antd:InboxOutlined",
        "props_schema": {
            "type": "object",
            "properties": {
                "description": {"type": "string", "default": "No Data"},
                "image": {"type": "string", "enum": ["DEFAULT", "SIMPLE"], "default": "SIMPLE"}
            }
        },
        "events": []
    }
]

