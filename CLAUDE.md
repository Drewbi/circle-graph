# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
bun dev          # Start dev server
bun build        # Type-check and build for production
bun lint         # Run ESLint
bun run format   # Format with Prettier
bun run typecheck  # Type-check without emitting
bun preview      # Preview production build
```

## Architecture

This is a React 19 + TypeScript + Vite app using Tailwind CSS v4 and shadcn/ui.

**Path alias**: `@/` maps to `src/` (configured in both `vite.config.ts` and `tsconfig.app.json`).

**Entry point**: `src/main.tsx` wraps `<App>` in `<ThemeProvider>` and mounts to `#root`.

**Theme system**: `src/components/theme-provider.tsx` manages dark/light/system theme via `localStorage`. Press `d` (when not in an input) to toggle dark mode. Use the `useTheme()` hook to access/set theme in components.

**Styling**: Tailwind CSS v4 via `@tailwindcss/vite` plugin. Use the `cn()` helper from `src/lib/utils.ts` (combines `clsx` + `tailwind-merge`) for conditional class names. Prettier auto-sorts Tailwind classes on `cn()` and `cva()` calls.

**shadcn/ui**: Components are added via `npx shadcn@latest add <component>` and placed in `src/components/ui/`. A shadcn MCP server is configured in `.mcp.json` for component discovery.

## Code Style

Prettier config (enforced on format): no semicolons, double quotes, 2-space indent, LF line endings, trailing commas (ES5).

TypeScript is strict with `noUnusedLocals`, `noUnusedParameters`, and `erasableSyntaxOnly` — avoid `enum` and parameter properties.
