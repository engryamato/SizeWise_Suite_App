# Toast Notification System

**Phase:** 0.1 (core, documentation)
**Role:** UI, Service

## Overview

SizeWise Suite uses a single, unified toast notification system based on the `ToasterProvider` and `useToast` hook from `lib/hooks/useToaster.tsx`.

> **Note:** The legacy `components/ui/Toaster.tsx` is deprecated and should NOT be used.

---

## Usage

### 1. Provider Setup
Wrap your app in the `ToasterProvider` (already done in `app/layout.tsx`):

```tsx
import { ToasterProvider } from '@/lib/hooks/useToaster';

<ToasterProvider position="bottom-left" maxToasts={5}>
  <AppShell>{children}</AppShell>
</ToasterProvider>
```

### 2. Showing Toasts
Use the `useToast` hook in any component:

```tsx
import { useToast } from '@/lib/hooks/useToaster';

const toast = useToast();

toast.success('Saved!', 'Your project was saved successfully.');
toast.error('Error!', 'Something went wrong.');
toast.info('Heads up!', 'This is an info message.');
toast.warning('Warning!', 'Please check your input.');
```

#### Custom Toast
```tsx
toast.addToast({
  title: 'Custom',
  type: 'success',
  message: 'Custom toast message',
  duration: 3000,
});
```

### 3. Dismissing Toasts
Toasts can be dismissed by user action (close button) or auto-dismissed after their duration.

---

## Migration Notice
- **Do NOT use `components/ui/Toaster.tsx`.**
- All new toast logic must use `lib/hooks/useToaster.tsx`.

---

## Test Strategy
- Unit tests for `ToasterProvider` are in `/tests/lib/hooks/useToaster.test.tsx`.
- Tests cover: adding, auto-dismissing, and manually dismissing toasts.

---

## i18n
- All user-facing toast strings must use i18n loaders and reference locale files in `/i18n/locales/`. Do not hardcode strings in production code.

---

## Example
```tsx
const toast = useToast();
toast.success(t('project.saved_title'), t('project.saved_message'));
```
