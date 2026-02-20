/* FILEPATH: frontend/src/domains/meta/features/dictionary/types/types.ts */
/* @file Dictionary Interfaces (Types) */
/* @author The Engineer */
/* @description Types that DISAPPEAR at runtime. Pure Interfaces. */

import { type AttributeType, type WidgetType } from './constants';

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

