# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
bun dev          # Start dev server
bun build        # Type-check and build for production
bun lint         # Run ESLint
bun run format   # Format with Prettier
bun run typecheck  # Type-check without emitting
bun test         # Run unit tests (Vitest)
bun test:watch   # Run tests in watch mode
bun preview      # Preview production build
bun build:pages  # Build for GitHub Pages (sets base path)
```


## Architecture

This is a React 19 + TypeScript + Vite app using Tailwind CSS v4 and shadcn/ui. It renders interactive circle (ring/disk) visualizations on an HTML canvas with zoom, pan, and touch support.

**Path alias**: `@/` maps to `src/` (configured in both `vite.config.ts` and `tsconfig.app.json`).

**Entry point**: `src/main.tsx` wraps `<App>` in `<ThemeProvider>` and `<TooltipProvider>`, then mounts to `#root`.

**Theme system**: `src/components/theme-provider.tsx` manages dark/light/system theme via `localStorage`. Press `d` (when not in an input) to toggle dark mode. Includes cross-tab sync via `storage` events and smooth transitions. Use the `useTheme()` hook to access/set theme in components. Colors use the OKLch color space for perceptual uniformity.

**Styling**: Tailwind CSS v4 via `@tailwindcss/vite` plugin. Use the `cn()` helper from `src/lib/utils.ts` (combines `clsx` + `tailwind-merge`) for conditional class names. Prettier auto-sorts Tailwind classes on `cn()` and `cva()` calls.

**shadcn/ui**: Style is `radix-lyra` with Lucide icons and mauve base color. Components are added via `npx shadcn@latest add <component>` and placed in `src/components/ui/`. A shadcn MCP server is configured in `.mcp.json` for component discovery.
**ALWAYS invoke the `shadcn` skill before doing any UI work.** This applies whenever you are:
- Adding, modifying, or styling any component
- Working with shadcn/ui components in `src/components/ui/`
- Choosing between layout or design approaches
- Installing new shadcn components

Invoke with: `Skill({ skill: "shadcn" })`

**Responsive layout**: Desktop uses a top header bar; mobile uses a bottom sheet (`sheet.tsx`) for controls. The `use-mobile.ts` hook detects viewport < 768px via `matchMedia`.

## Key Files

### App & Components

- **`src/App.tsx`** — Main component. Manages top-level state: `diameter`, `thickness`, `gridStyle`, `algorithm`, `showDebug`, `showCircleOverlay`. Renders `NumberField` inputs and a `SettingsPopover`. Splits layout between desktop header and mobile bottom sheet.
- **`src/components/circle-canvas.tsx`** — Canvas wrapper. Orchestrates all canvas hooks (draw, zoom, pan, resize, fit-on-change). Resolves theme palette and passes refs to hooks for re-render-free updates. Renders the `DebugPanel`.
- **`src/components/debug-panel.tsx`** — Overlay showing live zoom scale and pan x/y. Updates via `requestAnimationFrame`. Only rendered when `showDebug` is true.
- **`src/components/theme-provider.tsx`** — Theme context and `useTheme()` hook.

### Hooks (`src/hooks/`)

- **`use-draw-circle.ts`** — Returns `{ draw, scheduleDraw }`. Renders grid background (dots or lines), filled circle cells, and optional circle overlay. Applies canvas transform matrix for zoom/pan. Caches dot-grid tiles for performance.
- **`use-zoom.ts`** — Mouse wheel and pinch-to-zoom (two-finger). Scale range: 0.1×–20×. Zooms toward cursor/pinch midpoint.
- **`use-pan.ts`** — Pointer-event drag-to-pan. Single-pointer only; cancels on second pointer (hands off to pinch-zoom). Uses pointer capture for smooth out-of-bounds tracking.
- **`use-resize-canvas.ts`** — `ResizeObserver` syncs canvas dimensions with wrapper. Fires `onInit` once on first resize.
- **`use-fit-on-change.ts`** — Auto-fits view to circle when diameter changes significantly (delta > 1) and pan is near center.
- **`use-mobile.ts`** — Returns `isMobile: boolean` (viewport < 768px).

### Library (`src/lib/`)

- **`lib/circle.ts`** — Circle rasterization. Types: `Point`, `CircleConfig`, `CellSet`. Coordinates are bit-packed (`encodeCell`/`decodeCell`, ±32767 per axis). Two algorithms:
  - `computeDistanceCells()` — Distance check at cell center/corners. Simple, intuitive.
  - `computeMidpointCells()` — Bresenham midpoint with octant symmetry. Sharper, no fat corners.
  - Public entry: `computeCircleCells(config)` — selects algorithm from config.
- **`lib/render.ts`** — `RenderConfig` (cellSize, padding). `canvasSize()` and `cellToPixel()` for coordinate mapping.
- **`lib/utils.ts`** — `cn()` utility (clsx + tailwind-merge).

### shadcn/ui Components (`src/components/ui/`)

`button`, `input`, `label`, `field`, `button-group`, `input-group`, `popover`, `sheet`, `separator`, `toggle`, `toggle-group`, `slider`, `textarea`, `tooltip`, `skeleton`, `sidebar`

## State Management

No external state library. Patterns used:
- `useState` in `App.tsx` for all user-facing settings (`gridStyle` persisted to localStorage)
- Refs in `circle-canvas.tsx` for transform state (scale, pan x/y), cell data, render config, and palette — avoids re-renders in hot paths
- `useMemo` for `computeCircleCells` result
- Context API for theme

## Code Style

Prettier config (enforced on format): no semicolons, double quotes, 2-space indent, LF line endings, trailing commas (ES5).

TypeScript is strict with `noUnusedLocals`, `noUnusedParameters`, and `erasableSyntaxOnly` — avoid `enum` and parameter properties.
