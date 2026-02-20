// FILEPATH: frontend/src/domains/meta_v2/features/dictionary/types/constants.ts
// @file: Dictionary Constants (Runtime - V2)
// @author: The Engineer
// @description: Values that EXIST at runtime (Enums, Objects).
// Decoupled from V1.

// @security-level: LEVEL 0 (Core Constants) */

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
    PASSWORD = "PASSWORD",
    COLOR_PICKER = "COLOR_PICKER",

    // Numeric
    NUMBER = "NUMBER",
    SLIDER = "SLIDER",
    CURRENCY = "CURRENCY",
    PERCENTAGE = "PERCENTAGE",
    RATE = "RATE",

    // Choice
    DROPDOWN = "DROPDOWN",
    AUTOCOMPLETE = "AUTOCOMPLETE",
    RADIO_GROUP = "RADIO_GROUP",
    CHECKBOX_GROUP = "CHECKBOX_GROUP",
    TAGS = "TAGS",
    SEGMENTED = "SEGMENTED",
    TREE_SELECT = "TREE_SELECT",

    // Boolean
    SWITCH = "SWITCH",
    CHECKBOX = "CHECKBOX",

    // Date
    DATE_PICKER = "DATE_PICKER",
    DATETIME_PICKER = "DATETIME_PICKER",
    TIME_PICKER = "TIME_PICKER",
    DATE_RANGE = "DATE_RANGE",

    // Advanced
    FILE_UPLOAD = "FILE_UPLOAD",
    JSON_EDITOR = "JSON_EDITOR",
    REFERENCE_LOOKUP = "REFERENCE_LOOKUP"
}

// 🛡️ THE MATRIX: Defines valid Widgets for each Data Type
export const WIDGET_COMPATIBILITY: Record<AttributeType, WidgetType[]> = {
    [AttributeType.TEXT]: [WidgetType.INPUT, WidgetType.TEXTAREA, WidgetType.RICH_TEXT, WidgetType.EMAIL, WidgetType.PHONE, WidgetType.COLOR_PICKER, WidgetType.PASSWORD],
    [AttributeType.TEXTAREA]: [WidgetType.TEXTAREA, WidgetType.RICH_TEXT],
    [AttributeType.RICH_TEXT]: [WidgetType.RICH_TEXT],
    [AttributeType.NUMBER]: [WidgetType.NUMBER, WidgetType.CURRENCY, WidgetType.PERCENTAGE, WidgetType.SLIDER, WidgetType.RATE],
    [AttributeType.BOOLEAN]: [WidgetType.SWITCH, WidgetType.CHECKBOX],
    [AttributeType.SELECT]: [WidgetType.DROPDOWN, WidgetType.RADIO_GROUP, WidgetType.SEGMENTED],
    [AttributeType.MULTI_SELECT]: [WidgetType.TAGS, WidgetType.CHECKBOX_GROUP, WidgetType.TREE_SELECT],
    [AttributeType.DATE]: [WidgetType.DATE_PICKER],
    [AttributeType.DATETIME]: [WidgetType.DATETIME_PICKER, WidgetType.DATE_RANGE],
    [AttributeType.TIME]: [WidgetType.TIME_PICKER],
    [AttributeType.FILE]: [WidgetType.FILE_UPLOAD],
    [AttributeType.REFERENCE]: [WidgetType.REFERENCE_LOOKUP, WidgetType.TREE_SELECT],
    [AttributeType.JSON]: [WidgetType.JSON_EDITOR, WidgetType.DATE_RANGE],
    [AttributeType.FORMULA]: [WidgetType.INPUT]
};

// 📘 THE KNOWLEDGE BASE: User-friendly descriptions
export const HELP_TEXT = {
    DATA_TYPE: {
        title: "What is Data Type?",
        desc: "Defines how the database stores this value. This cannot be changed once created to prevent data corruption."
    },
    WIDGET_TYPE: {
        title: "What is Interface Widget?",
        desc: "Determines how the user interacts with this field in the UI. (e.g., A 'Boolean' can be a Switch or a Checkbox)."
    },
    SYSTEM_LOCKED: "This is a System Field required by the Kernel. It cannot be edited or deleted.",
    TYPES: {
        TEXT: "Alphanumeric strings. Used for names, titles, descriptions.",
        NUMBER: "Integers or Decimals. Used for prices, quantities, counts.",
        BOOLEAN: "True/False binary state. Used for flags like 'Is Active'.",
        SELECT: "Single choice from a predefined list of options.",
        REFERENCE: "Link to a record in another Domain (Foreign Key).",
        JSON: "Complex structured data object (Developer Mode)."
    },
    CONSTRAINTS: {
        REQUIRED: "Blocks saving the record if this field is empty.",
        UNIQUE: "Ensures no two records have the same value for this field.",
        ACTIVE: "Determines if this field is visible in the application."
    }
};

export const DEFAULT_DRAFT_CONFIG = {};

