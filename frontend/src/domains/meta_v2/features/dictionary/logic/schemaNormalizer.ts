// FILEPATH: frontend/src/domains/meta_v2/features/dictionary/logic/schemaNormalizer.ts
// @file: Schema Normalizer (V2)
// @author: The Engineer
// @description: Logic Adapter.
// FIX: Used 'import type' for interfaces to prevent Vite Runtime Crash.
// FIX: Separated Value imports (Enums) from Type imports (Interfaces).
// CONTEXT: Migrated to meta_v2 for decoupling.


// ⚡ CRITICAL FIX: Separate Type imports from Value imports
import type { AttributeDefinition } from '../types/types';
import { AttributeType, WidgetType } from '../types/types'; // V2 Types now contain Enums too

export const normalizeSchema = (data: any): AttributeDefinition[] => {
  if (!data) return [];

  // Scenario A: It's already an Array
  if (Array.isArray(data)) {
    return data.map(sanitizeAttribute);
  }

  // Scenario B: It's a Hybrid Schema Object
  const collected = new Map<string, AttributeDefinition>();

  const add = (item: any) => {
    const clean = sanitizeAttribute(item);
    if (clean.key) collected.set(clean.key, clean);
  };

  // Check possible containers
  if (data.fields && typeof data.fields === 'object') {
    Object.values(data.fields).forEach(add);
  } else if (data.attributes && Array.isArray(data.attributes)) {
    data.attributes.forEach(add);
  } else if (data.columns && Array.isArray(data.columns)) {
    data.columns.forEach(add);
  }

  return Array.from(collected.values());
};

const sanitizeAttribute = (raw: any): AttributeDefinition => {
  return {
    id: raw.id || 0,
    domain: raw.domain || 'UNKNOWN',
    key: raw.key || 'unknown_key',
    label: raw.label || raw.key || 'Untitled',
    description: raw.description || '',
    
    data_type: (raw.data_type as AttributeType) || AttributeType.TEXT,
    widget_type: (raw.widget_type as WidgetType) || WidgetType.INPUT,
    
    is_required: !!raw.is_required,
    is_unique: !!raw.is_unique,
    is_system: !!raw.is_system,
    is_active: raw.is_active !== false,
    
    configuration: raw.configuration ? JSON.parse(JSON.stringify(raw.configuration)) : {},
    
    created_at: raw.created_at,
    updated_at: raw.updated_at
  };
};

