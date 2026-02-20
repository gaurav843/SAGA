// FILEPATH: frontend/src/domains/meta_v2/features/dictionary/types/types.ts
// @file: Dictionary Interfaces (Types)
// @author: The Engineer
// @description: Types that DISAPPEAR at runtime. Pure Interfaces.
// @security-level: LEVEL 0 (Core Types) */

// ⚡ RE-EXPORT CONSTANTS FROM V1 (Shared Kernel) or DUPLICATE IF NEEDED
// For now, we assume constants are shared or need to be copied.
// Since I don't have the constants file for V2 yet, I will redefine the Enums here or import from shared.
// Looking at the dump, `meta/features/dictionary/types/constants.ts` exists in V1.
// I will assume standard strings for now to avoid broken imports.

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
  INPUT = "INPUT",
  TEXTAREA = "TEXTAREA",
  RICH_TEXT = "RICH_TEXT",
  EMAIL = "EMAIL",
  PHONE = "PHONE",
  COLOR = "COLOR",
  NUMBER = "NUMBER",
  SLIDER = "SLIDER",
  CURRENCY = "CURRENCY",
  PERCENTAGE = "PERCENTAGE",
  DROPDOWN = "DROPDOWN",
  AUTOCOMPLETE = "AUTOCOMPLETE",
  RADIO_GROUP = "RADIO_GROUP",
  CHECKBOX_GROUP = "CHECKBOX_GROUP",
  TAGS = "TAGS",
  SWITCH = "SWITCH",
  CHECKBOX = "CHECKBOX",
  DATE_PICKER = "DATE_PICKER",
  DATETIME_PICKER = "DATETIME_PICKER",
  TIME_PICKER = "TIME_PICKER",
  FILE_UPLOAD = "FILE_UPLOAD",
  REFERENCE_LOOKUP = "REFERENCE_LOOKUP",
  JSON_EDITOR = "JSON_EDITOR"
}

export interface SelectOption {
  label: string;
  value: string | number;
  color?: string;
}

export interface AttributeConfig {
  // Text
  placeholder?: string;
  regex?: string;
  min_length?: number;
  max_length?: number;
  
  // Number
  min?: number;
  max?: number;
  step?: number;
  precision?: number;
  currency_symbol?: string;
  
  // Date
  min_date?: string;
  max_date?: string;
  date_format?: string;

  // Options
  options?: SelectOption[];
  allow_custom?: boolean;
  
  // Reference
  target_domain?: string;
  filter_logic?: Record<string, any>;
  
  // File
  allowed_extensions?: string[];
  max_size_mb?: number;
  
  // JSON
  json_schema?: Record<string, any>;

  // General
  default_value?: any;
  help_text?: string;
}

export interface AttributeDefinition {
  id: number;
  domain: string;
  key: string;
  label: string;
  description?: string;
  data_type: AttributeType;
  widget_type: WidgetType;
  is_required: boolean;
  is_unique: boolean;
  is_system: boolean;
  is_active: boolean;
  configuration: AttributeConfig;
  created_at?: string;
  updated_at?: string;
  is_draft?: boolean;
}

export interface AttributeDraft {
  id?: number; 
  domain: string;
  key: string;
  label: string;
  description?: string;
  data_type: AttributeType;
  widget_type: WidgetType;
  is_required: boolean;
  is_unique: boolean;
  is_system: boolean;
  is_active: boolean;
  configuration: AttributeConfig;
}

