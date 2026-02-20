// FILEPATH: frontend/src/domains/meta/features/states/components/inspector/wizard/components/ContextBrowser/ComponentGallery.tsx
// @file: Component Gallery Picker
// @role: 🧩 UI Component */
// @author: The Engineer
// @description: Visual grid for selecting UI Primitives to make available to the AI.
// @security-level: LEVEL 9 (Read-Only) */
// @invariant: Must handle empty widget lists gracefully. */
// @updated: Fixed Data Binding (label -> name) and aligned Theme Tokens. */

import React, { useMemo, useState } from "react";
import { Checkbox, Typography, Empty, Tag, Segmented, Button, theme } from "antd";
import { logger } from "@platform/logging";
import { IconFactory } from "@platform/ui/icons/IconFactory";
import type { WidgetDefinition } from "@platform/workflow/wizard-engine/hooks/useWidgetRegistry";

const { Text } = Typography;

interface ComponentGalleryProps {
  widgets: WidgetDefinition[];
  selectedKeys: string[];
  onChange: (keys: string[]) => void;
}

/**
 * @description Renders a filterable grid of UI components.
 */
export const ComponentGallery: React.FC<ComponentGalleryProps> = ({
  widgets,
  selectedKeys,
  onChange
}) => {
  const { token } = theme.useToken();
  const [filterCategory, setFilterCategory] = useState<string>("ALL");

  // ⚡ COMPUTE CATEGORIES
  const categories = useMemo(() => {
      const cats = new Set(widgets.map(w => w.category));
      return ["ALL", ...Array.from(cats)];
  }, [widgets]);

  // ⚡ FILTER LIST
  const filteredWidgets = useMemo(() => {
      if (filterCategory === "ALL") return widgets;
      return widgets.filter(w => w.category === filterCategory);
  }, [widgets, filterCategory]);

  const handleToggle = (key: string) => {
      if (selectedKeys.includes(key)) {
          onChange(selectedKeys.filter(k => k !== key));
      } else {
          onChange([...selectedKeys, key]);
          logger.trace("CONTEXT_BROWSER", `Added Component: [${key}]`);
      }
  };

  const handleSelectAll = () => {
      if (selectedKeys.length === filteredWidgets.length) {
          onChange([]); // Deselect All
      } else {
          onChange(filteredWidgets.map(w => w.key)); // Select All Visible
      }
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* TOOLBAR */}
        <div style={{ paddingBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Segmented 
                size="small"
                options={categories}
                value={filterCategory}
                onChange={setFilterCategory}
                style={{ overflowX: 'auto', maxWidth: '70%' }}
            />
            <Button size="small" type="text" onClick={handleSelectAll}>
                {selectedKeys.length > 0 ? "Clear" : "Select All"}
            </Button>
        </div>

        {/* GRID */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 8, alignContent: 'start' }}>
            {filteredWidgets.length > 0 ? filteredWidgets.map(widget => {
                const isSelected = selectedKeys.includes(widget.key);
                return (
                    <div 
                        key={widget.key}
                        onClick={() => handleToggle(widget.key)}
                        style={{
                            // ⚡ THEME FIX: Replaced hardcoded HEX with Tokens
                            border: isSelected ? `1px solid ${token.colorPrimary}` : `1px solid ${token.colorBorderSecondary}`,
                            borderRadius: 6,
                            padding: 8,
                            cursor: 'pointer',
                            // ⚡ THEME FIX: Background adapts to Dark Mode
                            background: isSelected ? token.colorPrimaryBg : token.colorBgContainer,
                            transition: 'all 0.2s',
                            position: 'relative'
                        }}
                    >
                        <div style={{ position: 'absolute', top: 4, right: 4 }}>
                            <Checkbox checked={isSelected} />
                        </div>
                        <div style={{ 
                            fontSize: 20, 
                            // ⚡ THEME FIX: Color adapts
                            color: isSelected ? token.colorPrimary : token.colorTextTertiary, 
                            marginBottom: 8 
                        }}>
                            <IconFactory icon={widget.icon} />
                        </div>
                        {/* ⚡ DATA FIX: Changed {widget.label} to {widget.name} to match Registry Interface */}
                        <Text strong style={{ fontSize: 11, display: 'block', marginBottom: 2, color: token.colorText }}>
                            {widget.name}
                        </Text>
                        <Tag style={{ fontSize: 9, margin: 0, padding: '0 2px' }}>
                            {widget.category}
                        </Tag>
                    </div>
                );
            }) : (
                <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 20 }}>
                    <Empty description="No components found" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                </div>
            )}
        </div>
        
        <div style={{ paddingTop: 8, borderTop: `1px solid ${token.colorBorderSecondary}`, textAlign: 'right' }}>
            <Text type="secondary" style={{ fontSize: 11 }}>
                {selectedKeys.length} / {widgets.length} components selected
            </Text>
        </div>
    </div>
  );
};

