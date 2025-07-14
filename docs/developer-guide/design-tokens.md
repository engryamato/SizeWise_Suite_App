# Design Tokens

The global design tokens are defined in `app/config/design-tokens.json`. These tokens centralize colors, spacing, and typography for both the legacy frontend and the Next.js application.

## Usage

### CSS

Both `frontend/styles/main.css` and `frontend-nextjs/app/globals.css` expose the tokens as CSS variables under the `:root` selector. Reference them with `var(--color-primary)`, `var(--spacing-md)`, etc.

### Components

When canvas components require colors, tokens are imported directly:

```ts
import tokens from '@/shared/designTokens'
```

This ensures rendering is consistent across modules and avoids hard-coded values.

## Token Structure

```json
{
  "color": { "primary": "#1976d2", "secondary": "#424242", ... },
  "spacing": { "md": "16px", ... },
  "typography": { "font-size-base": "14px", ... }
}
```

Update the JSON file to change the theme globally.
