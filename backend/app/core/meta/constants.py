# FILEPATH: backend/app/core/meta/constants.py
# @file: Meta-Kernel Constants (The Vocabulary)
# @author: The Engineer (ansav8@gmail.com)
# @description: Defines the Immutable Truths for the Adaptive Data Engine.
# UPDATED: Injected ACTION_METADATA to enable "Dumb UI" rendering.
# @security-level: LEVEL 0 (Kernel)

from enum import Enum, unique

@unique
class BindingType(str, Enum):
    """The Jurisdiction Class. Defines WHAT we are binding to."""
    ENTITY = "ENTITY"       # A physical Database Table (e.g. USER, CONTAINER)
    GROUP = "GROUP"         # A virtual Tag or Job ID (e.g. NIGHTLY_SYNC, VIP_TIER)

@unique
class AttributeType(str, Enum):
    """The Data Type. Defines how the value is stored and validated."""
    TEXT = "TEXT"
    TEXTAREA = "TEXTAREA"
    RICH_TEXT = "RICH_TEXT"
    NUMBER = "NUMBER"
    BOOLEAN = "BOOLEAN"
    SELECT = "SELECT"
    MULTI_SELECT = "MULTI_SELECT"
    DATE = "DATE"
    DATETIME = "DATETIME"
    TIME = "TIME"
    REFERENCE = "REFERENCE"
    FILE = "FILE"
    JSON = "JSON"
    FORMULA = "FORMULA"

@unique
class WidgetType(str, Enum):
    """The Interface Hint. Defines how the field is rendered."""
    # Text
    INPUT = "INPUT"
    TEXTAREA = "TEXTAREA"
    RICH_TEXT = "RICH_TEXT"
    EMAIL = "EMAIL"
    PHONE = "PHONE"
    COLOR = "COLOR"
    
    # Numeric
    NUMBER = "NUMBER"
    SLIDER = "SLIDER"
    CURRENCY = "CURRENCY"
    PERCENTAGE = "PERCENTAGE"
    
    # Choice
    DROPDOWN = "DROPDOWN"
    AUTOCOMPLETE = "AUTOCOMPLETE"
    RADIO_GROUP = "RADIO_GROUP"
    CHECKBOX_GROUP = "CHECKBOX_GROUP"
    TAGS = "TAGS"
    
    # Boolean
    SWITCH = "SWITCH"
    CHECKBOX = "CHECKBOX"
    
    # Date
    DATE_PICKER = "DATE_PICKER"
    DATETIME_PICKER = "DATETIME_PICKER"
    TIME_PICKER = "TIME_PICKER"
    
    # Advanced
    FILE_UPLOAD = "FILE_UPLOAD"
    REFERENCE_LOOKUP = "REFERENCE_LOOKUP"
    JSON_EDITOR = "JSON_EDITOR"

@unique
class RuleEventType(str, Enum):
    """The Trigger."""
    SAVE = "SAVE"
    DELETE = "DELETE"
    LOAD = "LOAD"
    CHANGE = "CHANGE"
    TRANSITION = "TRANSITION"

@unique
class RuleActionType(str, Enum):
    """The Consequence."""
    BLOCK = "BLOCK"
    WARN = "WARN"
    SHOW = "SHOW"
    HIDE = "HIDE"
    ENABLE = "ENABLE"
    DISABLE = "DISABLE"
    REQUIRE = "REQUIRE"
    OPTIONAL = "OPTIONAL"
    SET_VALUE = "SET_VALUE"
    CALCULATE = "CALCULATE"
    TRIGGER_EVENT = "TRIGGER_EVENT"
    TRANSITION = "TRANSITION"

# ⚡ RICH METADATA (For Dumb Frontend Rendering)
ACTION_METADATA = {
    RuleActionType.BLOCK: {"group": "Integrity (Gatekeepers)", "label": "Block Transaction", "icon": "antd:StopOutlined", "color": "#ff4d4f", "desc": "Stops the save completely."},
    RuleActionType.WARN: {"group": "Integrity (Gatekeepers)", "label": "Warning Toast", "icon": "antd:SafetyCertificateOutlined", "color": "#faad14", "desc": "Shows a warning but allows save."},
    RuleActionType.REQUIRE: {"group": "Integrity (Gatekeepers)", "label": "Mark Required", "icon": "antd:EditOutlined", "color": None, "desc": "Field becomes mandatory."},
    RuleActionType.OPTIONAL: {"group": "Integrity (Gatekeepers)", "label": "Mark Optional", "icon": "antd:BorderOutlined", "color": None, "desc": "Field becomes optional."},
    
    RuleActionType.HIDE: {"group": "Interface (Shapeshifters)", "label": "Hide Field", "icon": "antd:EyeInvisibleOutlined", "color": None, "desc": "Removes field from the form."},
    RuleActionType.SHOW: {"group": "Interface (Shapeshifters)", "label": "Show Field", "icon": "antd:AppstoreOutlined", "color": None, "desc": "Reveals a hidden field."},
    RuleActionType.DISABLE: {"group": "Interface (Shapeshifters)", "label": "Disable Input", "icon": "antd:StopOutlined", "color": None, "desc": "Makes field read-only."},
    RuleActionType.ENABLE: {"group": "Interface (Shapeshifters)", "label": "Enable Input", "icon": "antd:EditOutlined", "color": None, "desc": "Unlocks a read-only field."},
    
    RuleActionType.SET_VALUE: {"group": "Automation (Robots)", "label": "Set Value", "icon": "antd:EditOutlined", "color": "#1890ff", "desc": "Overwrites field value."},
    RuleActionType.TRIGGER_EVENT: {"group": "Automation (Robots)", "label": "Trigger Event", "icon": "antd:ThunderboltOutlined", "color": "#52c41a", "desc": "Fires a system webhook/event."},
    RuleActionType.CALCULATE: {"group": "Automation (Robots)", "label": "Calculate", "icon": "antd:FunctionOutlined", "color": None, "desc": "Applies a formula."},
    RuleActionType.TRANSITION: {"group": "Automation (Robots)", "label": "State Transition", "icon": "antd:SwapOutlined", "color": "#722ed1", "desc": "Forces a workflow transition."}
}

@unique
class PolicyResolutionStrategy(str, Enum):
    """The Governance Logic."""
    ALL_MUST_PASS = "ALL_MUST_PASS"
    AT_LEAST_ONE = "AT_LEAST_ONE"
    PRIORITY_OVERRIDE = "PRIORITY_OVERRIDE"
    WEIGHTED_SCORE = "WEIGHTED_SCORE"

@unique
class ViewEngineType(str, Enum):
    """The Renderer."""
    FORM_IO = "FORM_IO"
    TANSTACK_TABLE = "TANSTACK_TABLE"
    RECHARTS = "RECHARTS"
    MARKDOWN = "MARKDOWN"

@unique
class ScopeType(str, Enum):
    """The Context Hierarchy. Defines the 'Type' of a KernelScope."""
    GLOBAL = "GLOBAL"
    DOMAIN = "DOMAIN"
    PROCESS = "PROCESS"
    TRANSITION = "TRANSITION"
    FIELD = "FIELD"
    
    # ⚡ SYSTEM BRICKS (The "App" Types)
    WIZARD = "WIZARD"       # Interactive Form Flow
    VIEW = "VIEW"           # Read-Only Dashboard/List
    JOB = "JOB"             # Background Task
    CONTAINER = "CONTAINER" # Visual Grouping (Menu Group)
    DASHBOARD = "DASHBOARD" # Analytical View

