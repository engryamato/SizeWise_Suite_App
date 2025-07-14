# 🎨 Canvas Drawing – Interactive Layout & Drawing Behavior

_See docs/README.md for the documentation map and update rules._

_Last updated: 2025-07-13_

---

## 1. What Is the Canvas?

The **canvas** is the main workspace where users lay out rooms, draw air ducts, and visualize HVAC systems.  
It’s designed to be user-friendly for both beginners and professionals, supporting both simple and advanced workflows.

---

## 2. What Can Users Do on the Canvas?

- **Draw rooms:** Create rectangular “boxes” representing spaces (with dimensions and names)
- **Draw duct segments:** Connect rooms using straight lines, elbows, and branches; segments snap to grid by default
- **Edit/move/delete:** Select, resize, or move rooms and segments; right-click or use toolbar for context actions
- **Snap to grid:** Toggle grid snapping ON/OFF for precision or freeform drawing
- **Select and assign properties:** Click any room/segment to open properties in the sidebar (length, material, airflow, etc.)
- **Add air outlets and equipment:** Place supply/return registers, air handling units, etc. (from sidebar or drag-and-drop)
- **Zoom and pan:** Use mouse/touch to navigate large drawings

---

## 3. Free vs Pro Limits (Drawing)

- **Free:** Up to 3 rooms and 25 duct segments per project; grid snap always ON; basic undo/redo
- **Pro:** Unlimited rooms/segments; grid snap toggle; advanced editing tools (multi-select, group move); live simulation overlay (see simulation mode)
- If user reaches Free limit, show upgrade modal and lock further drawing

---

## 4. Drawing Workflow

### 4.1 Onboarding

- User is guided to create their first room (Room 1) after project creation
- Tooltip: “Click and drag to draw a room”

### 4.2 Drawing a Room

- Click “Add Room” or use canvas shortcut
- Click and drag to set room size
- Enter room name (optional), function, and dimensions in sidebar panel (see `ui-components.md`)

### 4.3 Drawing Duct Segments

- Select starting room/point, drag to another room or endpoint
- Segments snap at 90°/45° angles by default (hold Shift for free angle)
- Auto-suggests elbows, branches where needed
- Properties for each segment appear in sidebar on selection (see `ui-components.md`)

### 4.4 Editing/Deleting

- Click to select room/segment; use handles to resize/move
- Delete via toolbar button, right-click, or keyboard shortcut (DEL)
- Undo/redo supported (with tier-based history depth)

---

## 5. Property/Selection Rules

- Only one room or segment selected at a time (Free); Pro supports multi-select
- When selected, all properties shown/edited in sidebar
- Changes auto-apply and update all calculations (see `logic-validators.md`)
- Warning badges shown directly on segments/rooms with issues

---

## 6. Visual Feedback & Warnings

- **Live color coding:** Segments/rooms change color if a validation warning exists (e.g., red for velocity too high)
- **Badges:** Warning icons appear on problematic rooms/segments; hover for details
- **Simulation Mode (Pro):** Overlays animated airflow, velocity, and pressure (see simulation documentation)

---

## 7. Out of Scope for This File

- Does NOT define UI panel layouts or sidebar fields (see `ui-components.md`)
- Does NOT specify calculation logic or formulas (see `logic-validators.md`)
- Does NOT define JSON schema for rooms/segments (see `data-models-schemas.md`)
- Does NOT cover export/report logic (see `exports-reports.md`)

---

## 8. Keeping This File Up To Date

- Any change to how rooms/segments are drawn, edited, or managed on the canvas—**update this file and the README index FIRST**
- Cross-link to related panels/fields as needed

---

*This document is your master reference for canvas interaction and drawing behavior.  
For sidebar fields, calculation rules, or export logic, see the linked markdowns in README.md!*
