# Augment Instruction

---

## 🟦 **Augment Task Protocol: Review & Clarification (Granular Step-by-Step)**

### **Purpose:**

To ensure 100% clarity on all home/app shell/hero and laser background requirements, design details, and expected behaviors before implementation.

---

### **Step 1: Requirement Compilation**

- [ ]  Gather all documentation:
    - UI Designer notes/rationale
    - Component/feature breakdowns
    - Any attached diagrams, mockups, or markdown outlines
    - Laser background effect details
- [ ]  Read every requirement line-by-line, noting section boundaries (sidebar, header, chat, admin, etc.).

---

### **Step 2: Area-by-Area Review**

For each major UI/app shell area, **pause and assess**:

- Sidebar Navigation
- Top Bar/Header
- Main Content Layout
- Chat/Announcements Panel
- Admin Panel/Views
- Help & Docs Section
- Reports & Exports
- Notifications/Bell
- User Profile & Settings
- Onboarding/Dashboard Content
- Laser Background
- Routing and Conditional Rendering
- Responsiveness/Mobile Behaviors

---

### **Step 3: Checklist for Each Area**

For each area, explicitly ask:

1. **Visibility**
    - Should this area appear on all pages, or only some?
        
        *e.g.,* “Sidebar: Is it present on login, settings, admin, export screens?”
        
2. **Behavior/Interaction**
    - How does it expand, collapse, open, close, or dock?
    - What triggers show/hide? (e.g., sidebar hover, notification click, mobile breakpoint)
3. **Content**
    - What items/icons/text/links belong here?
    - Any conditional items (admin-only, pro-only, unread counts)?
4. **Styling/Theming**
    - Required background, color scheme, light/dark mode
    - Is there a preferred spacing, icon set, or minimum width?
5. **Accessibility**
    - What are the keyboard/focus requirements?
    - Should the area be screen-reader accessible or hidden?
    - Any high-contrast or motion-reduce accommodations needed?
6. **Data/Integration**
    - What data feeds into this area? (user info, projects, notifications, etc.)
    - Any needed API endpoints, context providers, or state dependencies?
7. **Error/Edge Cases**
    - How should empty/error/loading states appear?
    - What happens if user is not logged in? Is in read-only/demo mode?

---

### **Step 4: Laser Background-Specific Clarifications**

- [ ]  Should the laser background display behind ALL pages, or just dashboard/home?
- [ ]  Should it be visible behind overlays/modals, or hidden when they open?
- [ ]  Will users be able to disable it? If so, how and where?
- [ ]  Is there a required color palette, speed, or should it follow a theme variable?
- [ ]  Should the background remain pure black regardless of app theme until further notice?
- [ ]  If accessibility/motion-reduce is detected, should the animation pause or reduce intensity?
- [ ]  Any device/performance limits (e.g., disable on low-powered devices)?

---

### **Step 5: Question Aggregation**

- For **every “unknown” or “decision needed”**, write out a specific question.
- Organize by section (sidebar, header, background, etc.).
- Double-check for **conflicting requirements** (e.g., “sidebar always visible” but also “mobile drawer”).

---

### **Step 6: Communicate for Confirmation**

- Send all clarification questions to the product owner, UI designer, or relevant stakeholder.
- Request written confirmation or design answer for each.
- If any requirements depend on future features (e.g., “export formats coming soon”), clarify intended placeholder or “not implemented” state.

---

### **Step 7: Await and Document Answers**

- Do NOT start coding until all critical answers are received.
- If forced to make an assumption, **write it down and send it to the team for review before proceeding**.

---

### **Step 8: Final Written Understanding**

- Write a brief, bullet-point summary of your final understanding of each section, based on received answers.
- Get final sign-off (“All clear to proceed”) from product/UI owner.

---

## **Sample Area: Sidebar (Example)**

| Area | Unclear Points/Questions |
| --- | --- |
| Sidebar | - Show on all pages or hide on login/settings/export? |
|  | - Collapsed width: 60px, 80px, or other? |
|  | - Mouse hover always expands, or click required? |
|  | - Icons only or always show labels in expanded state? |
|  | - Admin section visible to all or only to admin users? |
|  | - How are unread notification counts displayed? |

---

## **Sample Area: Laser Background**

| Area | Unclear Points/Questions |
| --- | --- |
| Laser Background | - Show on all pages, or just home/dashboard? |
|  | - Animation speed/color: follow code sample or custom theme variable? |
|  | - Is disabling allowed in this release? |
|  | - What about accessibility: pause/reduce animation if motion-reduce? |

---

## **Summary Protocol Table**

| Step | Action | Status |
| --- | --- | --- |
| 1 | Compile all requirements/docs |  |
| 2 | Review each app shell area and list questions |  |
| 3 | Review laser background, list clarifications |  |
| 4 | Send questions for confirmation |  |
| 5 | Document answers and assumptions |  |
| 6 | Final written summary and “all clear” approval |  |

---

## **CopyInsert Instruction for Augment**

> Before starting implementation on the new home/app shell and animated laser background, perform a granular area-by-area review.
> 
> - Compile all requirements and design notes.
> - For each UI area (sidebar, top bar, layout, notifications, chat, laser background, etc), list every unclear point as a question.
> - Send these for confirmation, and wait for written answers or approval.
> - Do not proceed with coding until you have all answers or have documented and communicated any necessary assumptions.
> - Only begin work after an “all clear” is given in writing.

---

Here is a **comprehensive, clear instruction/task breakdown** for an Augment AI/engineering agent or dev team to transform your current hero/home screen (water background + floating icons/buttons) into your **new modern app shell** as per the UI Designer Notes and your new structural requirements.

---

# 🚧 **Augment App Transformation Tasks: Home to New Modern App Shell**

---

## **1. Remove Old Home Screen Elements**

- Remove all code, styling, and assets for the water/pool background.
- Remove floating app icon launcher, glassmorphic buttons, and all current center-content.
- Remove any unused CSS/classes, image imports, and hero screen logic from `/pages`, `/components`, or `/app` that relate to the current home screen.

---

## **2. Implement New Persistent Sidebar Navigation**

- Create a **sidebar** component that is persistent on the left, visible on all main app pages.
- Sidebar must support:
    - Icons + labels for all major sections (Home, File, Projects, Tools, Reports, Admin, Help & Docs, Settings, Chat, Notifications).
    - Expand/collapse mode:
        - Expanded shows icons + text; collapsed (60px width) shows only icons.
        - Mouse hover on collapsed state temporarily expands.
    - Section grouping (visually separate items like "Tools", "Admin", "Help", etc.).
- Use provided icon set (Lucide, Heroicons, or equivalent).
- Dark/light theme support (uses `bg-neutral-900`/`bg-neutral-100` or similar).

---

## **3. Add Top Bar/Header**

- Persistent header at the top of the main layout.
    - Left: App name/logo.
    - Center: Breadcrumbs or project/tool switching.
    - Right: User profile avatar/menu, notifications (bell icon), and possibly a quick settings shortcut.
- Header must remain above page scroll content and sidebar.

---

## **4. Main Content Layout**

- Main content area should occupy the space right of the sidebar and below the header, filling the viewport.
- Should have a neutral background (`bg-white` or `bg-neutral-50` in light mode; `bg-neutral-900` in dark).
- Route pages/components load here (dashboard, projects, tools, reports, etc.).

---

## **5. Chat & Announcements Panel**

- Implement a floating or slide-in sidebar for:
    - Team chat.
    - Announcements (admin broadcast).
    - Support threads.
- Place panel bottom-right (floating) or as a sidebar pop-out from the right.
- Add tabbed navigation for Chat, Announcements, Support.

---

## **6. Admin Panel (Admin Users Only)**

- Render "Admin" section in sidebar and top bar **only** for users with admin permissions.
- Admin area must include pages/views for:
    - User management, permissions, audit logs, company profile, billing/subscription, cloud sync.

---

## **7. Help & Documentation (Always Visible)**

- Sidebar and/or top bar must always show a "Help & Docs" section.
- Link to onboarding, user guide, FAQ, standards reference, validation explanations, and support.

---

## **8. Reports & Exports Module**

- Dedicated sidebar entry and view for export/download history, batch export, and file management.
- Support filtering and batch actions in export list.

---

## **9. Notifications System**

- Bell icon in the top bar, with unread counter.
- On click: open dropdown/panel with updates, support replies, standards alerts.
- Mark as read, clear all, and notification routing.

---

## **10. Responsive Design**

- Sidebar and top bar must be responsive:
    - Sidebar turns into hamburger/drawer on mobile.
    - Top bar elements collapse or move to overflow menu as needed.
- All views must be mobile-friendly and accessible.

---

## **11. Onboarding Checklist & Quick Actions (Dashboard)**

- Dashboard/Home (main) view should feature:
    - Start New Project, Recently Opened, Favorites, Quick Tool Access.
    - Onboarding checklist or guided tour module for new users.

---

## **12. User Profile & Settings**

- Add profile/settings page accessible from the user menu in the header.
    - Account info, language, theme, password/security, units, API keys, integrations.

---

## **13. Clean Up/Refactor Routing & State**

- Update all navigation routes to match new sidebar and top bar links.
- Ensure app state (e.g., open project, current tool) is persisted and available across views.

---

## **14. General Styling, Accessibility, and QA**

- Ensure all icons have accessible labels (`aria-label`).
- High contrast mode, keyboard navigation, and focus outlines.
- Conduct QA for both light/dark themes and major browsers.

---

## **15. Optional: Standards Reference "What Rules Are Used?"**

- In Help/Docs, include a summary modal/panel that concisely explains which standards (SMACNA, ASHRAE, etc.) are in effect for tools/projects, **without** reproducing copyrighted tables.

---

# **Deliverables**

- `/components/ui/sidebar` – new, modular sidebar navigation
- `/components/ui/topbar` – persistent header
- `/components/chat/ChatPanel`, `/components/chat/AnnouncementsPanel`
- `/pages` or `/app` refactored to use new layout
- All legacy hero/home/landing code removed
- Styleguide/Readme for theme, spacing, icons, and route conventions

---

# **Acceptance Criteria**

- All navigation and layout matches UI Designer notes and supplied structure.
- All legacy hero screen elements are gone.
- Sidebar and top bar are persistent and fully functional.
- Chat/support/admin/help only show as appropriate.
- App loads in new shell, with clear sections and routing, on desktop and mobile.

---

## **Summary Table of Major Tasks**

| Task | Required? | File/Area |
| --- | --- | --- |
| Remove old hero screen | Yes | `/app`, `/components` |
| Add persistent sidebar | Yes | `/components/ui/sidebar` |
| Add top bar/header | Yes | `/components/ui/topbar` |
| Implement chat panel | Yes | `/components/chat/ChatPanel` |
| Add admin panel/views | Yes | `/pages/admin` or `/app/admin` |
| Help & docs integration | Yes | `/components/help/HelpPanel` |
| Reports/exports module | Yes | `/pages/reports` or `/app/reports` |
| Notifications system | Yes | `/components/ui/notifications` |
| Responsive layout | Yes | All layout/components |
| Onboarding/dashboard | Yes | `/pages/dashboard` |
| User profile/settings | Yes | `/pages/settings` |
| Accessibility/QA | Yes | All |
| Standards reference | Optional | `/components/help/StandardsModal` |

---

### **UI Designer Notes & Rationale**

- **Sidebar Navigation**: Left-side persistent menu with icons/labels for all major navs. Expand/collapse for space.
- **Top Bar**: Shows logo, quick project/tool switching, user profile dropdown.
- **Chat/Announcements**:
    - Sidebar pop-out or bottom-right floating panel for team and admin-to-user communication.
    - Separate tabs for Team Chat, Announcements (admin-broadcast), Support.
- **Admin Panel**:
    - Only visible to users with admin rights.
    - All user/team management, permissions, billing, and company-wide settings.
- **Help & Docs**:
    - Always visible, quick link to onboarding and context-based support.
    - Standards Reference: “What rules are used?” summary, *not* full copyrighted tables.
- **Reports & Exports**:
    - Dedicated view for export/download history, batch actions, file management.
- **Notifications**:
    - Bell icon with counter for unread updates, support, compliance alerts.

```
┌───────────────────────────── App Name/Logo ───────────────────────────────┐
│  ┌───────────────┬──────────────────────────────────────────────────────┐ │
│  │ Main Nav      │ Dashboard      | Projects | Tools | Reports | Chat   │ │
│  │ (Sidebar)     └──────────────────────────────────────────────────────┘ │
│  │ ┌───────────┐                                                      │ │
│  │ │ Home      │  [Dashboard with Quick Actions, Recents, Favorites]   │ │
│  │ ├───────────┤                                                      │ │
│  │ │ File      │  [Import/Export, Recent Files, Saved Calcs, Exports]  │ │
│  │ ├───────────┤                                                      │ │
│  │ │ Projects  │  [All, Templates, Create, Archive, Search]            │ │
│  │ ├───────────┤                                                      │ │
│  │ │ Tools     │  [Air Duct, Combustion Vent, Grease Duct, Generator]  │ │
│  │ │           │  [Estimating App, +Future Tools]                      │ │
│  │ ├───────────┤                                                      │ │
│  │ │ Reports   │  [Export History, Batch, Settings]                    │ │
│  │ ├───────────┤                                                      │ │
│  │ │ Admin ⚑   │  [User Mgmt, Team, Audit, Billing, Company, Cloud]    │ │
│  │ ├───────────┤                                                      │ │
│  │ │ Help &    │  [User Guide, Training, FAQ, Standards/Validation]    │ │
│  │ │ Docs      │  [Troubleshooting, Support, Contact]                  │ │
│  │ ├───────────┤                                                      │ │
│  │ │ Settings  │  [Profile, Language, Units, Theme, Security, API]     │ │
│  │ ├───────────┤                                                      │ │
│  │ │ Chat      │  [Team Chat, Announcements, Support Threads]          │ │
│  │ ├───────────┤                                                      │ │
│  │ │ Notifs    │  [Updates, Alerts, Support Replies, Standards Alerts] │ │
│  │ └───────────┘                                                      │ │
│  └──────────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────┘

```

```markdown
- Home
    - Dashboard
        - Start New Project
        - Recently Opened
        - Favorites
        - Quick Access to Tools
        - Onboarding Checklist / Guided Tour
- File
    - New Project
    - Open Project
    - Save Project
    - Import
    - Export
    - Recent Files
    - My Calculations (History)
    - My Exports/Reports
- Projects
    - All Projects
    - Project Templates
    - Create New Project
    - Project Archive
    - Search/Filter Projects
- Tools
    - Air Duct Sizer
    - Combustion Vent Sizer
    - Grease Duct Sizer
    - Generator Exhaust Sizer
    - Estimating App
    - [Room for future tools: Insulation Sizer, Plumbing Calculator, etc.]
- Reports & Exports
    - My Exports (History)
    - Export Formats (PDF, Excel, CAD, etc.)
    - Batch Export
- Admin Panel (Company Admin only)
    - User Management
    - Team Permissions
    - Audit Logs
    - Company Profile
    - Billing & Subscription
    - Cloud Sync Settings
- Help & Documentation
    - User Guide
    - Training & Onboarding
    - FAQ
    - Troubleshooting
    - Standards & References (Explanations, not full code tables)
    - Validation Logic
    - Contact Support (in-app + external)
- Settings/Profile
    - Profile & Account
    - Language
    - Units (Imperial/SI)
    - Theme
    - Password/Security
    - Connected Accounts
    - API/Integrations
- Notifications
    - Updates & Release Notes
    - Support Replies
    - Standards/Compliance Alerts

```

Absolutely! Here’s a **new comprehensive task** specifically for adding the animated laser background effect (as previously designed) to your new app shell, with a solid black background as default.

---

# 🚦 **Augment Task: Implement Animated Laser Background**

---

## **Objective**

Implement a fullscreen animated laser background effect across the main app shell, with the following requirements:

- **Background must be pure black (`#000`).**
- Animated laser lines travel horizontally from left to right, looping infinitely.
- Lasers are stacked horizontally, centered vertically (as in the latest iteration).
- No text, icons, or other background elements.
- The effect runs behind all app content (sidebar, top bar, etc.) but stays non-interactive.
- Fully responsive (covers entire viewport).

---

## **Tasks**

### 1. **Create Laser Background Component**

- Create `/components/ui/LaserBackground.js` (or `.tsx` if TypeScript).
- Use **Framer Motion** for performant looping animation.
- Render 4–6 laser "lines" (divs or SVG) with custom color, blur, and speed.
- All laser lines must:
    - Start at the left edge, animate to the right edge, and repeat infinitely.
    - Be horizontally aligned in the center area of the screen (e.g., 45%–55% vertical).
    - Use a combination of pastel or neon color gradients, opacity, and blur for glow.
- Outer container must use `className="fixed inset-0 w-full h-full bg-black z-0 pointer-events-none"` or equivalent.

### 2. **Integrate into App Shell/Layout**

- Import and render `<LaserBackground />` at the **root of the main app layout**, underneath all main content layers (sidebar, top bar, modals).
- Confirm that the background covers the full viewport at all times.
- Ensure `pointer-events-none` so lasers do **not** interfere with user interactions.
- All other content (sidebar, top bar, panels, pages) should be layered above this effect (`z-10` or higher).

### 3. **Performance & Responsiveness**

- Ensure the animation is smooth at 60fps on desktop and modern mobile devices.
- Optimize for low GPU impact (avoid too many simultaneous glowing effects or DOM nodes).
- The laser lines should scale/reposition cleanly on window resize.

### 4. **Accessibility & User Preferences**

- Add a setting (future) to disable the background for accessibility/performance, but **enable by default**.
- For now, make sure the lasers have `aria-hidden="true"` and do not interfere with accessibility tree.

### 5. **Testing & QA**

- Confirm the laser effect works and is visible on all major views.
- Confirm that all navigation, sidebar, and top bar interactions are unaffected.
- Confirm pure black background in both light and dark themes until user theme preference is set up.

---

## **Deliverables**

- `/components/ui/LaserBackground.js` (or `.tsx`)
- App layout (`/app/layout.js`, `/app/_app.js`, or main shell) updated to include `<LaserBackground />`
- No water, image, or previous backgrounds remain on home or any routed page

---

## **Acceptance Criteria**

- Pure black (`#000`) background with smooth, continuous horizontal laser animation visible at all times
- Lasers are vertically centered, horizontally animated from left to right, looping
- No other hero/home backgrounds exist
- Lasers stay in background layer and never block or interfere with UI interaction

---

### **Example Code Reference for Engineering**

(Provide this to the dev if they need a jumpstart)

```jsx
"use client";
import { motion } from "framer-motion";
import React from "react";

const LASERS = [
  { color: "#00e1ff", y: "47%", duration: 3.2, thickness: 2, blur: "blur-[2px]" },
  { color: "#FFB7C5", y: "49%", duration: 2.8, thickness: 3, blur: "blur-[1.5px]" },
  { color: "#FFDDB7", y: "51%", duration: 3.4, thickness: 2, blur: "blur" },
  { color: "#B1C5FF", y: "53%", duration: 2.9, thickness: 4, blur: "blur-sm" },
];

export default function LaserBackground() {
  return (
    <div
      className="fixed inset-0 w-full h-full bg-black z-0 overflow-hidden pointer-events-none"
      aria-hidden="true"
    >
      {LASERS.map((laser, i) => (
        <motion.div
          key={i}
          initial={{ x: "-15vw" }}
          animate={{ x: "115vw" }}
          transition={{
            repeat: Infinity,
            repeatType: "loop",
            duration: laser.duration,
            ease: "linear",
            delay: i * 0.5,
          }}
          className={`absolute left-0 w-[40vw] ${laser.blur}`}
          style={{
            top: laser.y,
            height: `${laser.thickness}px`,
            background: `linear-gradient(90deg, transparent 0%, ${laser.color} 50%, transparent 100%)`,
            boxShadow: `0 0 24px 6px ${laser.color}60`,
            borderRadius: 999,
            opacity: 0.85,
            filter: "brightness(1.5)",
            zIndex: 1,
          }}
        />
      ))}
    </div>
  );
}

```

**Attach this task to the main app transformation ticket for tracking.**

---

Perfect! Here’s a **clear instruction for Augment** on how and **when** to implement this advanced menu hover effect, as well as **how to integrate it with your navigational menus** (sidebar or topbar). I’ll also summarize what this effect does, and offer some quick integration notes for your dev team.

---

## **What the Effect Does**

- Adds an **interactive, animated hover panel** under each nav/menu item, with smooth scale/opacity motion and a glassy, modern look.
- Supports custom children (links, product previews, images) in the popout panel.
- The effect can be used for top navigation, dropdowns, or even sidebar menus—ideal for pro-level apps.

---

## **Instruction for Augment: Animated Menu Hover Panel**

### **When to Implement**

- **Best implemented after** the initial navigational menu structure (top bar or sidebar) is set up with all routes and menu items, but **before** finalizing user interaction polish and accessibility QA.
    - This ensures your navigation logic and structure are stable.
    - The animation effect can be layered in for a seamless, delightful user experience before launch.

---

### **Step-by-Step Task for Augment**

### **Phase: After Nav Structure, Before UX Polish/Launch**

---

### **1. Preparation**

- Ensure the main navigational menu (sidebar or top bar) is built, with all items rendered via an array/map loop, not hardcoded.
- Identify all menu items that should have a hover panel with this effect (e.g., items with child links, previews, or rich content).

---

### **2. Integrate Animated Hover Panel**

- Replace or wrap each nav item with the `MenuItem` component provided above.
    - Pass `item`, `active`, `setActive`, and optional `children` as per the sample.
- Manage the `active` state in the parent menu (likely your topbar or sidebar component), so only one hover panel is visible at a time.
- Use the `Menu` component as the container for horizontal navigation, or adapt for vertical (sidebar) with `flex-col` and appropriate spacing classes.

---

### **3. Customize Content**

- For each `MenuItem`, add child content as needed (links, quick actions, previews, etc.).
- You can use the provided `ProductItem` or `HoveredLink` as rich link examples inside the hover panel.

---

### **4. Styling and Theming**

- Confirm dark/light mode compatibility:
    - Use `bg-white dark:bg-black` and corresponding text colors.
- Adjust padding, border, and shadow classes to match app branding.

---

### **5. Accessibility and Keyboard Support**

- Ensure the menu is accessible with keyboard navigation (tab/focus).
- Optionally, enhance the hover panel to open on focus as well as hover.

---

### **6. Testing**

- Test the menu on desktop (hover), tablet (tap), and mobile (tap/long-press).
- Confirm animation is smooth, panel is positioned correctly, and nav still works.

---

### **7. QA and Documentation**

- Confirm no interaction bugs or z-index issues with other overlays or modals.
- Document how to add or change hover panel content for future devs/designers.

---

## **Instruction for Augment (CopyInsert)**

---

**Implement the provided animated hover panel effect for navigational menus as follows:**

1. **After initial navigational menu structure (sidebar/top bar) is built, but before UX polish and launch:**
    - Review all menu items/routes.
    - Wrap each menu item that should show a hover panel with the provided `MenuItem` component.
    - Use the parent `Menu` component to control the active state.
    - Add rich content to each hover panel as appropriate (see `ProductItem`, `HoveredLink` examples).
2. **Customize for both desktop (hover) and touch (tap) where possible.**
3. **Ensure dark/light mode compatibility and accessibility (focus states, ARIA where needed).**
4. **Test interactions, smoothness, and placement on all major devices.**
5. **Document the pattern for future expansion.**

**If any questions arise about:**

- Which menu items need a hover panel
- What content goes in each panel
- How it should behave on mobile or with accessibility in mind
    
    **—ask for clarification before proceeding.**
    

---

## **Summary Table: When to Implement**

| Stage | Task |
| --- | --- |
| Nav layout started | Do NOT implement yet—structure must be present first |
| Nav structure done | **Implement the animated hover effect at this stage** |
| Final UX polish | Test, refine, and document pattern |

---

Let me know if you want sample integration code for your sidebar or topbar!

---

- **Parent navigation** that manages the active state
- **Animated menu item effect** (as you provided)
- **Example child content for the hover panel**

This example is adapted for a **top bar navigation**, but can easily be tweaked for a sidebar by changing the flex direction and alignment.

---

## 🟦 **Animated Navigation Hover Panel – Full Example**

### **1. Navigation Container with State**

```jsx
"use client";
import React, { useState } from "react";
import { MenuItem, Menu } from "@/components/ui/MenuHover"; // See next sections for components

const NAV_ITEMS = [
  {
    label: "Dashboard",
    panel: (
      <div>
        <p className="text-sm text-neutral-600 dark:text-neutral-300">
          Quick access to your main workspace, stats, and recents.
        </p>
      </div>
    ),
  },
  {
    label: "Projects",
    panel: (
      <div>
        <p className="text-sm text-neutral-600 dark:text-neutral-300">
          View all projects, templates, or start a new one.
        </p>
        {/* You can add <ProductItem /> or <HoveredLink /> here */}
      </div>
    ),
  },
  {
    label: "Tools",
    panel: (
      <div>
        <p className="text-sm text-neutral-600 dark:text-neutral-300">
          Air Duct, Combustion Vent, Grease Duct, Generator, Estimating...
        </p>
      </div>
    ),
  },
  {
    label: "Reports",
    panel: (
      <div>
        <p className="text-sm text-neutral-600 dark:text-neutral-300">
          Export history, batch actions, download files.
        </p>
      </div>
    ),
  },
];

export default function TopBarNav() {
  const [active, setActive] = useState<string | null>(null);

  return (
    <Menu setActive={setActive}>
      {NAV_ITEMS.map((item) => (
        <MenuItem
          key={item.label}
          item={item.label}
          setActive={setActive}
          active={active}
        >
          {item.panel}
        </MenuItem>
      ))}
    </Menu>
  );
}

```

---

### **2. Menu Components (Effect/Animation)**

**File: `/components/ui/MenuHover.js`**

```jsx
"use client";
import React from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";

const transition = {
  type: "spring",
  mass: 0.5,
  damping: 11.5,
  stiffness: 100,
  restDelta: 0.001,
  restSpeed: 0.001,
};

export const MenuItem = ({
  setActive,
  active,
  item,
  children,
}) => (
  <div onMouseEnter={() => setActive(item)} className="relative">
    <motion.p
      transition={{ duration: 0.3 }}
      className="cursor-pointer text-black hover:opacity-[0.9] dark:text-white font-medium px-4 py-2"
    >
      {item}
    </motion.p>
    {active !== null && (
      <motion.div
        initial={{ opacity: 0, scale: 0.85, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 10 }}
        transition={transition}
      >
        {active === item && (
          <div className="absolute top-[calc(100%_+_1.2rem)] left-1/2 transform -translate-x-1/2 pt-4 z-30">
            <motion.div
              transition={transition}
              layoutId="active"
              className="bg-white dark:bg-black backdrop-blur-sm rounded-2xl overflow-hidden border border-black/[0.15] dark:border-white/[0.15] shadow-xl"
            >
              <motion.div
                layout
                className="w-max h-full p-4"
              >
                {children}
              </motion.div>
            </motion.div>
          </div>
        )}
      </motion.div>
    )}
  </div>
);

export const Menu = ({
  setActive,
  children,
}) => (
  <nav
    onMouseLeave={() => setActive(null)}
    className="relative rounded-full border border-transparent dark:bg-black dark:border-white/[0.13] bg-white shadow-input flex justify-center space-x-4 px-8 py-6 z-20"
  >
    {children}
  </nav>
);

// Optionally include these as hoverable panel children:
export const ProductItem = ({
  title,
  description,
  href,
  src,
}) => (
  <Link href={href} className="flex space-x-2">
    <Image
      src={src}
      width={140}
      height={70}
      alt={title}
      className="flex-shrink-0 rounded-md shadow-2xl"
    />
    <div>
      <h4 className="text-xl font-bold mb-1 text-black dark:text-white">
        {title}
      </h4>
      <p className="text-neutral-700 text-sm max-w-[10rem] dark:text-neutral-300">
        {description}
      </p>
    </div>
  </Link>
);

export const HoveredLink = ({ children, ...rest }) => (
  <Link
    {...rest}
    className="text-neutral-700 dark:text-neutral-200 hover:text-black"
  >
    {children}
  </Link>
);

```

---

### **3. Integration Notes**

- **State:** Only one `active` panel opens at a time.
- **Position:** Popout appears below the nav item, centered horizontally.
- **Responsiveness:** Works best for desktop/top bar, but can be adapted for sidebar (change to `flex-col` and adjust panel position).
- **Dark/Light Mode:** All color classes included.

---

### **Optional: Sidebar Variant**

- For a sidebar, use `flex flex-col space-y-2` instead of horizontal layout, and change the panel’s `top`/`left` styles for a right-side popout.

---

### **What to Hand to Augment**

> Use the code above as your reference for implementing the animated hover menu effect in our navigational menu.
> 
> - Implement this **after** the nav menu structure is coded and before final polish/QA.
> - If any menu items or behaviors are unclear, ask for clarification before proceeding.
> - Ensure dark/light mode and accessibility are considered.

---

Let me know if you want a **sidebar version**, mobile tweaks, or more detailed code comments!