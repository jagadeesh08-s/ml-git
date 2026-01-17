# Dynamic Theme & Layout System

## Overview
Implemented a fully dynamic theming system that controls both visual style (colors, effects) and layout structure (grid columns, ordering) based on the selected theme.

## Architecture

### 1. Theme State Management
- **`ThemeContext`**: A React Context in `ThemeProvider.tsx` now manages the global theme state.
- **`useTheme()` Config**: A custom hook exposing `theme` and `setTheme` to any component.
- **Strict Typing**: The `Theme` type ensures type safety across `ThemeToggle`, `QuantumThemeManager`, and layout configs.

### 2. Layout Configuration (`src/config/themeLayouts.ts`)
A configuration object maps each theme to a specific layout definition:
```typescript
interface ThemeLayoutConfig {
  circuitBuilderColSpan: string; // e.g., 'xl:col-span-7'
  analysisColSpan: string;       // e.g., 'xl:col-span-5'
  orderReversed: boolean;        // Swap left/right columns
  isVertical: boolean;           // Stack vertically
  containerClass: string;        // Grid gaps and spacing
}
```

### 3. Workspace Integration
`Workspace.tsx` now dynamically applies these classes:
```tsx
const { theme } = useTheme();
const layout = themeLayouts[theme];

// ...
<div className={`grid ... ${layout.containerClass}`}>
  <div className={`${layout.circuitBuilderColSpan} ...`}>...</div>
  <div className={`${layout.analysisColSpan} ...`}>...</div>
</div>
```

## Implemented Themes & Layouts

| Theme | Layout | Description |
|-------|--------|-------------|
| **Quantum** (Default) | **7 : 5** | Standard balanced layout for Quantum styling. |
| **Cosmic** | **7 : 5** | Standard layout with wider gap (`gap-6`). |
| **Superposition** | **6 : 6** | Perfectly balanced 50/50 split. |
| **Entanglement** | **5 : 7 (Rev)** | Swapped order! Analysis on left (70%), Circuit on right. |
| **Tunneling** | **8 : 4** | Focus on Circuit Builder (wide). |
| **Decoherence** | **Vertical** | Stacked 12-col layout (Circuit top, Analysis bottom). |
| **Minimal** | **Vertical** | Centered vertical stack, max-width constrained. |
| **Retro** | **9 : 3** | Wide circuit board, narrow "sidebar" analysis. |

## Execution Steps Completed
1.  Upgraded `ThemeProvider` to use React Context.
2.  Refactored `ThemeToggle` to use global state.
3.  Created `src/config/themeLayouts.ts`.
4.  Refactored `Workspace.tsx` to use dynamic layout classes.
5.  Verified strict type safety for all theme operations.

## How to Test
1.  Open the Theme menu (Palette icon).
2.  Select **"Entanglement"** -> Verify columns swap positions.
3.  Select **"Tunneling"** -> Verify Circuit Builder gets wider.
4.  Select **"Decoherence"** -> Verify components stack vertically.
5.  Select **"Quantum"** -> Verify return to original 7:5 layout.
