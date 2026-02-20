# 🎨 Platform UI Kit (The Standard Library)

> **"The Golden Path"**
>
> This directory contains the **System Primitives**. These are the verified, optimized, and standardized UI blocks that define the "Flodock OS" feel. 
>
> **Rule of Thumb:** If you are building a new Module (e.g., Governance, Switchboard), you **must** use these components instead of raw Ant Design layouts to ensure consistency in transitions, persistence, and behavior.

---

## 🏗️ Layouts

### 1. `MasterDetailShell`



The canonical layout for "List on the Left, Editor on the Right". It replaces the need for manual `Layout`, `Sider`, or `Content` tags.

**Features:**
* ✅ **Auto-Persistence:** Remembers if the sidebar was collapsed (localStorage).
* ✅ **Cinematic Transitions:** Handles the "Keyed Fade" animation when switching items.
* ✅ **Standard Geometry:** Enforces correct padding, borders, and sidebar widths (320px -> 72px).

#### Usage

```tsx
import { MasterDetailShell } from 'platform/ui/layout/MasterDetailShell';

export const MyFeatureView = () => {
  const [selectedId, setSelectedId] = useState(null);

  return (
    <MasterDetailShell
      // 1. UNIQUE KEY: For saving sidebar state
      persistenceKey="my.feature.sidebar"
      
      // 2. TRIGGER: Changing this ID triggers the fade animation
      contentKey={selectedId}
      
      // 3. SIDEBAR RENDERER: You get 'collapsed' state for free
      renderSidebar={(collapsed, toggle) => (
        <MyList 
           compact={collapsed} 
           onToggle={toggle} 
        />
      )}
    >
      {/* 4. CONTENT: The Right Pane */}
      <MyEditor id={selectedId} />
      
    </MasterDetailShell>
  );
};

