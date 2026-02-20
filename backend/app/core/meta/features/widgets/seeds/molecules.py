# FILEPATH: backend/app/core/meta/features/widgets/seeds/molecules.py
# @file: Widget Registry - Molecules
# @description: Complex Inputs (Selection, Date, File, Domain).

WIDGETS_MOLECULES = [
    # --- CHOICE ---
    {
        "key": "SELECT_DROPDOWN",
        "name": "Single Select",
        "description": "Dropdown menu for single choice.",
        "category": "CHOICE",
        "icon": "antd:DownSquareOutlined",
        "props_schema": {
            "type": "object",
            "properties": {
                "options": {"type": "array", "items": {"type": "object"}},
                "showSearch": {"type": "boolean", "default": True},
                "allowClear": {"type": "boolean", "default": True},
                "mode": {"type": "string", "enum": ["multiple", "tags"], "description": "Leave empty for single"}
            }
        },
        "events": ["CHANGE", "SEARCH"]
    },
    {
        "key": "RADIO_GROUP",
        "name": "Radio Group",
        "description": "Visible options for single choice.",
        "category": "CHOICE",
        "icon": "antd:CheckCircleOutlined",
        "props_schema": {
            "type": "object",
            "properties": {
                "options": {"type": "array", "items": {"type": "object"}},
                "optionType": {"type": "string", "enum": ["default", "button"], "default": "default"},
                "buttonStyle": {"type": "string", "enum": ["outline", "solid"], "default": "outline"}
            }
        },
        "events": ["CHANGE"]
    },
    {
        "key": "CHECKBOX_GROUP",
        "name": "Checkbox Group",
        "description": "Multiple choices.",
        "category": "CHOICE",
        "icon": "antd:CheckSquareOutlined",
        "props_schema": {
            "type": "object",
            "properties": {
                "options": {"type": "array", "items": {"type": "object"}}
            }
        },
        "events": ["CHANGE"]
    },
    {
        "key": "SEGMENTED_CONTROL",
        "name": "Segmented Control",
        "description": "iOS-style toggle selector.",
        "category": "CHOICE",
        "icon": "antd:AppstoreOutlined",
        "props_schema": {
            "type": "object",
            "properties": {
                "options": {"type": "array", "items": {"type": "string"}},
                "block": {"type": "boolean", "default": False}
            }
        },
        "events": ["CHANGE"]
    },
    {
        "key": "TREE_SELECT",
        "name": "Tree Select",
        "description": "Hierarchical selection.",
        "category": "CHOICE",
        "icon": "antd:ApartmentOutlined",
        "props_schema": {
            "type": "object",
            "properties": {
                "treeData": {"type": "array", "items": {"type": "object"}},
                "multiple": {"type": "boolean", "default": False},
                "treeCheckable": {"type": "boolean", "default": False}
            }
        },
        "events": ["CHANGE"]
    },
    {
        "key": "CASCADER",
        "name": "Cascader",
        "description": "Multi-level selection.",
        "category": "CHOICE",
        "icon": "antd:MenuUnfoldOutlined",
        "props_schema": {
            "type": "object",
            "properties": {
                "options": {"type": "array", "items": {"type": "object"}},
                "changeOnSelect": {"type": "boolean", "default": False}
            }
        },
        "events": ["CHANGE"]
    },
    {
        "key": "TRANSFER",
        "name": "Transfer",
        "description": "Double-column shuttle box.",
        "category": "CHOICE",
        "icon": "antd:SwapOutlined",
        "props_schema": {
            "type": "object",
            "properties": {
                "showSearch": {"type": "boolean", "default": True},
                "titles": {"type": "array", "default": ["Source", "Target"]}
            }
        },
        "events": ["CHANGE"]
    },
    # --- DATE ---
    {
        "key": "DATE_PICKER",
        "name": "Date Picker",
        "description": "Select a single date.",
        "category": "DATE",
        "icon": "antd:CalendarOutlined",
        "props_schema": {
            "type": "object",
            "properties": {
                "format": {"type": "string", "default": "YYYY-MM-DD"},
                "picker": {"type": "string", "enum": ["date", "week", "month", "quarter", "year"], "default": "date"}
            }
        },
        "events": ["CHANGE"]
    },
    {
        "key": "DATE_RANGE",
        "name": "Date Range",
        "description": "Start and End date selection.",
        "category": "DATE",
        "icon": "antd:CalendarOutlined",
        "props_schema": {
            "type": "object",
            "properties": {
                "format": {"type": "string", "default": "YYYY-MM-DD"}
            }
        },
        "events": ["CHANGE"]
    },
    {
        "key": "TIME_PICKER",
        "name": "Time Picker",
        "description": "Select a time.",
        "category": "DATE",
        "icon": "antd:ClockCircleOutlined",
        "props_schema": {
            "type": "object",
            "properties": {
                "format": {"type": "string", "default": "HH:mm"},
                "use12Hours": {"type": "boolean", "default": False}
            }
        },
        "events": ["CHANGE"]
    },
    # --- ADVANCED ---
    {
        "key": "FILE_UPLOAD",
        "name": "File Upload",
        "description": "Drag and drop zone.",
        "category": "ADVANCED",
        "icon": "antd:CloudUploadOutlined",
        "props_schema": {
            "type": "object",
            "properties": {
                "maxCount": {"type": "integer", "default": 1},
                "accept": {"type": "string", "description": "File types (e.g. .png,.pdf)"},
                "listType": {"type": "string", "enum": ["text", "picture", "picture-card"], "default": "text"}
            }
        },
        "events": ["CHANGE", "UPLOAD"]
    },
    {
        "key": "USER_SELECTOR",
        "name": "User Lookup",
        "description": "Async dropdown to select system users.",
        "category": "DOMAIN",
        "icon": "antd:UserOutlined",
        "props_schema": {
            "type": "object",
            "properties": {
                "roleFilter": {"type": "string"},
                "mode": {"type": "string", "enum": ["single", "multiple"]}
            }
        },
        "events": ["CHANGE", "SEARCH"]
    }
]

