// FILEPATH: frontend/src/domains/meta_v2/features/dictionary/types/index.ts
// @file: Type Barrel (V2)
// @author: The Engineer
// @description: Re-exports Types and Constants explicitly to prevent bundler confusion.

import { AttributeType, WidgetType } from './constants';
import type { AttributeDraft } from './types';

// 1. Export Values (Runtime)
export * from './constants';

// 2. Export Types (Compile-time)
// We explicitly list them to avoid "export type *" issues
export type { 
  SelectOption, 
  AttributeConfig, 
  AttributeDefinition, 
  AttributeDraft 
} from './types';

// 3. Default Constant
export const DEFAULT_DRAFT: AttributeDraft = {
  domain: '',
  key: '',
  label: '',
  data_type: AttributeType.TEXT,
  widget_type: WidgetType.INPUT,
  is_required: false,
  is_unique: false,
  is_system: false,
  is_active: true,
  configuration: {}
};

