// FILEPATH: frontend/src/domains/meta/types/constants.ts
// @file: Meta Constants
// @author: The Engineer
// @description: Shared Enums for the Meta-Kernel (Dictionary, Governance, Workflow).
// @invariant: Must match 'backend/app/core/meta/constants.py' exactly. */

export enum BindingType {
    ENTITY = "ENTITY",
    GROUP = "GROUP"
}

export enum AttributeType {
    TEXT = "TEXT",
    TEXTAREA = "TEXTAREA",
    RICH_TEXT = "RICH_TEXT",
    NUMBER = "NUMBER",
    BOOLEAN = "BOOLEAN",
    SELECT = "SELECT",
    MULTI_SELECT = "MULTI_SELECT",
    DATE = "DATE",
    DATETIME = "DATETIME",
    TIME = "TIME",
    REFERENCE = "REFERENCE",
    FILE = "FILE",
    JSON = "JSON",
    FORMULA = "FORMULA"
}

export enum WidgetType {
    // Text
    INPUT = "INPUT",
    TEXTAREA = "TEXTAREA",
    RICH_TEXT = "RICH_TEXT",
    EMAIL = "EMAIL",
    PHONE = "PHONE",
    COLOR = "COLOR",
    
    // Numeric
    NUMBER = "NUMBER",
    SLIDER = "SLIDER",
    CURRENCY = "CURRENCY",
    PERCENTAGE = "PERCENTAGE",
    
    // Choice
    DROPDOWN = "DROPDOWN",
    AUTOCOMPLETE = "AUTOCOMPLETE",
    RADIO_GROUP = "RADIO_GROUP",
    CHECKBOX_GROUP = "CHECKBOX_GROUP",
    TAGS = "TAGS",
    
    // Boolean
    SWITCH = "SWITCH",
    CHECKBOX = "CHECKBOX",
    
    // Date
    DATE_PICKER = "DATE_PICKER",
    DATETIME_PICKER = "DATETIME_PICKER",
    TIME_PICKER = "TIME_PICKER",
    
    // Advanced
    FILE_UPLOAD = "FILE_UPLOAD",
    REFERENCE_LOOKUP = "REFERENCE_LOOKUP",
    JSON_EDITOR = "JSON_EDITOR"
}

export enum RuleEventType {
    SAVE = "SAVE",
    DELETE = "DELETE",
    LOAD = "LOAD",
    CHANGE = "CHANGE",
    TRANSITION = "TRANSITION"
}

export enum RuleActionType {
    BLOCK = "BLOCK",
    WARN = "WARN",
    SHOW = "SHOW",
    HIDE = "HIDE",
    ENABLE = "ENABLE",
    DISABLE = "DISABLE",
    REQUIRE = "REQUIRE",
    OPTIONAL = "OPTIONAL",
    SET_VALUE = "SET_VALUE",
    CALCULATE = "CALCULATE",
    TRIGGER_EVENT = "TRIGGER_EVENT",
    TRANSITION = "TRANSITION"
}

export enum PolicyResolutionStrategy {
    ALL_MUST_PASS = "ALL_MUST_PASS",
    AT_LEAST_ONE = "AT_LEAST_ONE",
    PRIORITY_OVERRIDE = "PRIORITY_OVERRIDE",
    WEIGHTED_SCORE = "WEIGHTED_SCORE"
}

export enum ViewEngineType {
    FORM_IO = "FORM_IO",
    TANSTACK_TABLE = "TANSTACK_TABLE",
    RECHARTS = "RECHARTS",
    MARKDOWN = "MARKDOWN"
}

export enum ScopeType {
    GLOBAL = "GLOBAL",
    DOMAIN = "DOMAIN",
    PROCESS = "PROCESS",
    TRANSITION = "TRANSITION",
    FIELD = "FIELD",
    
    // ⚡ SYSTEM BRICKS (The "App" Types)
    WIZARD = "WIZARD",
    VIEW = "VIEW",
    JOB = "JOB",
    CONTAINER = "CONTAINER",
    DASHBOARD = "DASHBOARD"
}

