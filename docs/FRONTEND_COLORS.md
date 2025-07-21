# Frontend Color Usage Guidelines

## Overview

To ensure UI consistency and maintainability, always use the application's color palette and utility classes when developing frontend components. This project uses Tailwind CSS with custom theme variables for all major UI colors, backgrounds, borders, and text.

## Core Palette

Use these Tailwind CSS classes for themed elements:

- **Backgrounds**: `bg-card`, `bg-popover`, `bg-muted`, `bg-accent`, `bg-primary`, `bg-secondary`, `bg-destructive`
- **Borders**: `border-border`, `border-primary`, `border-secondary`, `border-destructive`
- **Text**: `text-foreground`, `text-muted-foreground`, `text-primary`, `text-secondary`, `text-destructive`
- **Hover/Active states**: Always use palette classes, e.g. `hover:bg-accent`, `hover:text-primary`, not raw colors.
- **Gradients & Specials**: Use classes like `bg-gradient-to-r from-admin-primary to-admin-secondary` for admin/brand sections.

## Best Practices

- **Never use hardcoded colors** (e.g., `bg-white`, `text-black`, `border-gray-200`). Always use semantic classes.
- **Popup menus** (dropdowns, modals): Use `bg-popover` for backgrounds, `border-border` for borders, and `text-foreground` for text.
- **Cards and containers**: Use `bg-card` and `border-border`.
- **Muted/inactive states**: Use `bg-muted`, `text-muted-foreground`.
- **Destructive actions**: Use `bg-destructive` or `text-destructive`.

## How to Pick the Right Color

- **Is it the “main surface” of a card, menu, or popup?** → Use `bg-card` or `bg-popover`.
- **Is it a border?** → Use `border-border`.
- **Is it base text?** → Use `text-foreground`.
- **Is it a muted/secondary/less important text?** → Use `text-muted-foreground`.
- **Is it a highlight, selected, or actionable background?** → Use `bg-accent` (with `hover:bg-accent`).
- **Is it a destructive (danger) action?** → Use `bg-destructive`, `text-destructive`.

## Custom Branding

Special brand/admin sections use palette classes like `bg-admin-primary`, `bg-admin-accent`, etc. Only use these for designated UI sections.

## Touching Up/Testing

- Always visually test the component in **both light and dark modes**.
- If in doubt, inspect similar UI in the app and reuse their classes.
- See `frontend/src/components/user/UserMenu.tsx` or `Header.tsx` for correct palette usage in popups and navigation.

## Updating the Palette

If you need a new semantic color, update the Tailwind config (`tailwind.config.js`) and CSS variable definitions, not the component files.

---
