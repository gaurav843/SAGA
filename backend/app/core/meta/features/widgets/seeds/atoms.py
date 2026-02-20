# FILEPATH: backend/app/core/meta/features/widgets/seeds/atoms.py
# @file: Widget Registry - Atoms
# @description: Basic Input Components (Primitives).

WIDGETS_ATOMS = [
    # --- TEXT ---
    {
        "key": "TEXT_INPUT",
        "name": "Text Input",
        "description": "Standard single-line text field.",
        "category": "INPUT",
        "icon": "antd:FontSizeOutlined",
        "props_schema": {
            "type": "object",
            "properties": {
                "placeholder": {"type": "string"},
                "maxLength": {"type": "integer"},
                "prefix": {"type": "string", "description": "Icon or text prefix"},
                "allowClear": {"type": "boolean", "default": True}
            }
        },
        "events": ["CHANGE", "BLUR", "FOCUS"]
    },
    {
        "key": "TEXTAREA",
        "name": "Multi-line Text",
        "description": "Large text block for descriptions.",
        "category": "INPUT",
        "icon": "antd:AlignLeftOutlined",
        "props_schema": {
            "type": "object",
            "properties": {
                "rows": {"type": "integer", "default": 3},
                "maxLength": {"type": "integer"},
                "showCount": {"type": "boolean", "default": False}
            }
        },
        "events": ["CHANGE", "BLUR"]
    },
    # --- NUMERIC ---
    {
        "key": "NUMBER_INPUT",
        "name": "Number Input",
        "description": "Numeric input with stepper.",
        "category": "INPUT",
        "icon": "antd:NumberOutlined",
        "props_schema": {
            "type": "object",
            "properties": {
                "min": {"type": "number"},
                "max": {"type": "number"},
                "step": {"type": "number", "default": 1},
                "precision": {"type": "integer", "description": "Decimal places"}
            }
        },
        "events": ["CHANGE", "BLUR"]
    },
    {
        "key": "CURRENCY_INPUT",
        "name": "Money Input",
        "description": "Formatted currency field.",
        "category": "INPUT",
        "icon": "antd:DollarOutlined",
        "props_schema": {
            "type": "object",
            "properties": {
                "currency": {"type": "string", "default": "USD"},
                "locale": {"type": "string", "default": "en-US"},
                "min": {"type": "number", "default": 0}
            }
        },
        "events": ["CHANGE"]
    },
    # --- BOOLEAN / VISUAL ---
    {
        "key": "BOOLEAN_SWITCH",
        "name": "Toggle Switch",
        "description": "Binary On/Off switch.",
        "category": "INPUT",
        "icon": "antd:Switch::outlined",
        "props_schema": {
            "type": "object",
            "properties": {
                "checkedChildren": {"type": "string", "description": "Label when ON"},
                "unCheckedChildren": {"type": "string", "description": "Label when OFF"}
            }
        },
        "events": ["CHANGE"]
    },
    {
        "key": "SLIDER_INPUT",
        "name": "Slider",
        "description": "Visual range selection.",
        "category": "INPUT",
        "icon": "antd:ControlOutlined",
        "props_schema": {
            "type": "object",
            "properties": {
                "min": {"type": "integer", "default": 0},
                "max": {"type": "integer", "default": 100},
                "range": {"type": "boolean", "default": False},
                "step": {"type": "integer", "default": 1}
            }
        },
        "events": ["CHANGE"]
    },
    {
        "key": "RATE_INPUT",
        "name": "Star Rating",
        "description": "5-star rating input.",
        "category": "INPUT",
        "icon": "antd:StarOutlined",
        "props_schema": {
            "type": "object",
            "properties": {
                "count": {"type": "integer", "default": 5},
                "allowHalf": {"type": "boolean", "default": True}
            }
        },
        "events": ["CHANGE"]
    },
    {
        "key": "COLOR_PICKER",
        "name": "Color Picker",
        "description": "Hex color selector.",
        "category": "INPUT",
        "icon": "antd:BgColorsOutlined",
        "props_schema": {
            "type": "object",
            "properties": {
                "showText": {"type": "boolean", "default": True}
            }
        },
        "events": ["CHANGE"]
    },
    # --- SECURITY ---
    {
        "key": "SECURE_PASSWORD",
        "name": "Secure Password Input",
        "description": "Password field with strength meter and random generator.",
        "category": "SECURITY",
        "icon": "antd:LockOutlined",
        "props_schema": {
            "type": "object",
            "properties": {
                "showStrength": {"type": "boolean", "default": True},
                "allowGenerate": {"type": "boolean", "default": True},
                "minLength": {"type": "integer", "default": 8},
                "requireSymbols": {"type": "boolean", "default": True}
            }
        },
        "events": ["CHANGE", "GENERATE"]
    }
]

