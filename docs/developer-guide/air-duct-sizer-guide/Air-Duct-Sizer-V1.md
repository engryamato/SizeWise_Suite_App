# SizeWise Task V1 (Computer/Desktop/Laptop/Tablet)

Status: Not started

### Testing

- [ ]  Must have a production ready deployment with admin access;
- [ ]  Must have a production ready deployment with user access only;

### Global UI

- Background
    - [ ]  Dark Mode - Black
    - [ ]  Light Mode - White
    - [ ]  System - Dark/Light Mode
- Navigation Structure
    
    # **SizeWise Suite – Centered Top Navigation (No Sidebar, Minimalist, Desktop-First)**
    
    ---
    
    ## **UI Designer Notes & Rationale**
    
    - **Centered Top Bar Navigation**
        - The main navigation bar is centered at the top of the screen and always visible on all desktop/tablet/iPad layouts.
        - All primary workflow items—including Home, File, Projects, Tools, and Profile—are aligned horizontally, with equal visual weight and dropdown submenus for each.
        - The **Profile menu** is inline with other top nav items (not isolated at the top-right) and uses a user icon or avatar; its dropdown includes Profile & Account, Settings, Reports & Exports, Administrative Access (if user is admin), and all relevant personal/user settings.
        - No top-right “island”—all navigation is unified and centered for symmetry and easy scanning.
    - **No Sidebar, No Mobile/Responsive Navigation**
        - The UI is designed strictly for desktop, laptop, and tablet/iPad; there is no sidebar or bottom/hamburger nav.
        - All navigation, quick access, and context switching are handled through the top bar and its dropdowns/popovers.
    - **Bottom-Right Corner (Persistent)**
        - A rectangular button for **Chat & Notifications** sits above a round “?” Help & Docs button.
        - **Chat & Notifications**: Clicking opens a compact modal with tabs for Team Chat, Support, and Notifications (Updates, Alerts); the modal can be expanded/maximized.
        - **Help & Docs**: A persistent question-mark button at the bottom right corner opens a pop-up help/docs window, which can also be maximized from the same position.
    - **Clarity, Discoverability, and Focus**
        - No clutter, redundancy, or visual confusion. All major workflows and user/account features are immediately accessible, with the Profile menu inline for clarity.
        - Quick actions, recent files, and settings are logically grouped in dropdowns.
        - Support, documentation, and team communication tools are always available—never hidden or multiple clicks away.
        - The entire layout is optimized for professionals working on larger screens who expect everything to be quickly accessible and discoverable without mobile-specific patterns.
    
    ---
    
    ## **Navigation Layout Mockup**
    
    ```
plaintext
    CopyEdit
    ┌─────────────────────────────────────────────────────────────────────────────┐
    │          LOGO     |  Home  |  File  |  Projects  |  Tools  |  Profile  |    │
    └─────────────────────────────────────────────────────────────────────────────┘
    
    [Profile Menu Dropdown]
        - Profile & Account
            - Password/Security
            - Connected Accounts
            - API/Integrations
        - Settings
            - Language
            - Units (Imperial/SI)
            - Theme
        - Reports & Exports
            - My Exports (History)
            - Export Formats (PDF, Excel, CAD, etc.)
            - Batch Export
        - Administrative Access (admin only)
            - User Management
            - Team Permissions
            - Audit Logs
            - Company Profile
            - Billing & Subscription
            - Cloud Sync Settings
        - Logout
    
    [Bottom Right Corner]
        [⬛]
        ┌───────────────────┐
        │  🔔 Notifications │
        │  💬 Chat         │
        └───────────────────┘
    
        [❓]
        ┌───────────────────────────┐
        │  Help & Documentation     │
        │  (with maximize button)   │
        └───────────────────────────┘
```
    
    ## **Detailed Navigation Content (for Dev/UI Handoff)**
    
    ```markdown
markdown
    CopyEdit
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
    - Profile
        - Profile & Account
            - Password/Security
            - Connected Accounts
            - API/Integrations
        - Settings
            - Language
            - Global Units (Imperial/SI)
            - Theme
        - Reports & Exports
            - My Exports (History)
            - Export Formats (PDF, Excel, CAD, etc.)
            - Batch Export
        - Administrative Access (admin only)
            - User Management
            - Team Permissions
            - Audit Logs
            - Company Profile
            - Billing & Subscription
            - Cloud Sync Settings
        - Logout
    
    [Bottom Right Corner]
        - [Rectangular Button: Notifications & Chat]
    	    - Opens help/documentation pop-up, with maximize option.
            - 🔔 Notifications (tab)
                - Updates & Release Notes
                - Support Replies
                - Standards/Compliance Alerts
            - 💬 Chat (tab)
                - Team Chat
                - Announcements (admin-broadcast)
                - Support
        - [❓ Help & Docs Button]
    	    - Opens help/documentation pop-up, with maximize option.
```
    
    ---
    
    ## **Summary Rationale for Designer/Dev Handoff**
    
    - **No sidebar**: Reduces cognitive clutter, maximizes workspace, and matches your vision for a desktop-class tool.
    - **Top bar is always centered**, minimal, and clear.
    - **Profile menu**: All personal, admin, and export/reporting controls unified here.
    - **Help/Docs**: Persistent, bottom-right, out of the way but always accessible, pop-up with maximize.
    - **Chat/Notifications**: Grouped above Help, in a compact, easily reached rectangle.
    - **No command palette or mobile nav** for now.
    - **All admin functions** are discoverable but secured within Profile.
- Dashboard
    
    # **SizeWise Suite Dashboard – Minimalist Layout (v1, Context-Aware)**
    
    ---
    
    ## **UI Designer & Developer Rationale**
    
    ### **Key Principles**
    
    - **Maximal focus:** Only show controls, actions, and info relevant to the current user context.
    - **Clean workspace:** No persistent messages or help buttons except on the dashboard (never on tool or detail screens).
    - **Modern B2B UX:** Aligns with pro-grade engineering/SaaS standards (Linear, Vercel, Notion).
    - **Scalable & future-proof:** Layout accommodates future expansion (KPI/stats, team modules) without redesign.
    
    ---
    
    ### **1. Top Bar (Centered Navigation)**
    
    - Centered, horizontal navigation with dropdowns:
        - **Home** (Dashboard)
        - **File**
        - **Projects**
        - **Tools**
        - **Profile** (with Settings, Reports/Exports, Admin—if user is admin)
    
    ---
    
    ### **2. Dashboard Content Sections**
    
    **A. Top Section – Quick Actions**
    
    - Horizontally aligned buttons:
        - Start New Project
        - Start New Calculation
        - Import Plan
        - Export Report
    
    ---
    
    **B. Section 1 – Projects & Recent Activity (Combined)**
    
    - **Active Projects**
        - Card/list view for each active project:
            - Project Name & Icon
            - Status (in progress, awaiting, completed)
            - Deadline/Last updated
            - Actions: Open, Resume
        - **Recently Opened** (chip or small icon)
        - **Favorites** (optional)
        - **Recent Activity**
            - Inline with each project: last calculation, export, or edit with timestamp (“Last export: 1 hour ago”, “Last calculation: 10:34 AM”)
            - “Resume” button for incomplete/draft work
    
    ---
    
    **C. Section 2 – Tools Shortcuts**
    
    - Icon cards or buttons for each core tool:
        - Air Duct Sizer
        - Combustion Vent Sizer
        - Grease Duct Sizer
        - Generator Exhaust Sizer
        - Estimating App
    - Optionally: Highlight “Last Used” or most popular tools
    
    ---
    
    **D. Messages & Help (Context-Aware)**
    
    - **Dashboard only:**
        - Bottom right:
            - [💬 Messages] — Rectangular button opens modal with notifications, chat, support
            - [❓ Help] — Circular button opens modal with onboarding, FAQ, guided tour, training links
    - **All other screens:**
        - *Neither button is shown.*
        - Maximum workspace—no floating UI elements
    
    ---
    
    **E. Getting Started**
    
    - Accessed from the Help button (never persistent on dashboard)
    - Includes onboarding checklist, app tour, training resources
    
    ---
    
    **What’s Not Present (by design):**
    
    - KPIs/Stats — not on v1 dashboard
    - Team/Collab Feed — not in v1
    - System/Account Status — found under Profile, not dashboard
    - No floating messages/help except on dashboard
    
    ---
    
    ## **Minimalist Dashboard Wireframe**
    
    ```
plaintext
    CopyEdit
    ┌────────────────────────────────────────────────────────────────────────────┐
    │      Home  |  File  |  Projects  |  Tools  |  Profile   [Centered Top Bar] │
    └────────────────────────────────────────────────────────────────────────────┘
    
    [Start New Project]   [Start Calculation]   [Import Plan]   [Export Report]
    
    ─────────────────────────────────────────────────────────────
    
    Active Projects & Recent Activity
    [Project Card]   [Project Card]   [Project Card]
      - Name        - Status         - Last Activity
      - Actions: Open/Resume/Favorite
      - Recent: Last calc/export/edit (timestamp, inline)
    
    ─────────────────────────────────────────────────────────────
    
    Tools Shortcuts
    [Air Duct Sizer]   [Combustion Vent Sizer]   [Grease Duct Sizer]
    [Generator Exhaust]   [Estimating App]
    
    ─────────────────────────────────────────────────────────────
    
    Bottom right (dashboard only):
      [💬] Messages  [❓] Help
    
    *On any other screen (tools, project detail): NO messages/help buttons shown*
```
    
    ---
    
    ## **Summary Table: Dashboard Elements**
    
    | Section | Shown On Dashboard | Shown In Tools/Other |
    | --- | --- | --- |
    | Top Nav Bar | ✔ | ✔ |
    | Quick Actions | ✔ | ✗ |
    | Projects/Recent Activity | ✔ | ✗ |
    | Tools Shortcuts | ✔ | ✗ |
    | Messages & Help Buttons | ✔ | ✗ |
    
    ---
    
    ## **Key Rationale Points**
    
    - **Only relevant actions and info are ever visible.**
    - **Messages/help never distract from actual work; dashboard is the “control center” for notifications and onboarding.**
    - **Cards are visually minimalist, well-spaced, and ready for new sections as you scale.**
    - **All navigation, action, and info is at most one click away, without persistent clutter.**
- Navigation Menu
    - [ ]  Navigation Menu to be at the top of the screen always
        - [ ]  Navigation Menu to be at the top of the screen in window mode
        - [ ]  Navigation Menu hidden in full screen mode
- Effects
    
    
    - [ ]  Frame
    
    - Code
        
        ```tsx

```
        
    
    - [ ]  Navigation Menu
    
    - dock-label-at-hover
        
        ```tsx
import * as React from "react"
        import { motion } from "framer-motion"
        import { cn } from "@/lib/utils"
        import { LucideIcon } from "lucide-react"
        
        interface DockProps {
          className?: string
          items: {
            icon: LucideIcon
            label: string
            onClick?: () => void
          }[]
        }
        
        interface DockIconButtonProps {
          icon: LucideIcon
          label: string
          onClick?: () => void
          className?: string
        }
        
        const floatingAnimation = {
          initial: { y: 0 },
          animate: {
            y: [-2, 2, -2],
            transition: {
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut"
            }
          }
        }
        
        const DockIconButton = React.forwardRef<HTMLButtonElement, DockIconButtonProps>(
          ({ icon: Icon, label, onClick, className }, ref) => {
            return (
              <motion.button
                ref={ref}
                whileHover={{ scale: 1.1, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={onClick}
                className={cn(
                  "relative group p-3 rounded-lg",
                  "hover:bg-secondary transition-colors",
                  className
                )}
              >
                <Icon className="w-5 h-5 text-foreground" />
                <span className={cn(
                  "absolute -top-8 left-1/2 -translate-x-1/2",
                  "px-2 py-1 rounded text-xs",
                  "bg-popover text-popover-foreground",
                  "opacity-0 group-hover:opacity-100",
                  "transition-opacity whitespace-nowrap pointer-events-none"
                )}>
                  {label}
                </span>
              </motion.button>
            )
          }
        )
        DockIconButton.displayName = "DockIconButton"
        
        const Dock = React.forwardRef<HTMLDivElement, DockProps>(
          ({ items, className }, ref) => {
            return (
              <div ref={ref} className={cn("w-full h-64 flex items-center justify-center p-2", className)}>
                <div className="w-full max-w-4xl h-64 rounded-2xl flex items-center justify-center relative">
                  <motion.div
                    initial="initial"
                    animate="animate"
                    variants={floatingAnimation}
                    className={cn(
                      "flex items-center gap-1 p-2 rounded-2xl",
                      "backdrop-blur-lg border shadow-lg",
                      "bg-background/90 border-border",
                      "hover:shadow-xl transition-shadow duration-300"
                    )}
                  >
                    {items.map((item) => (
                      <DockIconButton key={item.label} {...item} />
                    ))}
                  </motion.div>
                </div>
              </div>
            )
          }
        )
        Dock.displayName = "Dock"
        
        export { Dock }
```
        
    - Messages and Notification pop-up
        - Toast
            
            ```typescript
'use client'
            
            import { forwardRef, useImperativeHandle, useRef } from 'react';
            import { motion } from 'framer-motion';
            import {
              Toaster as SonnerToaster,
              toast as sonnerToast,
            } from 'sonner';
            import {
              CheckCircle,
              AlertCircle,
              Info,
              AlertTriangle,
              X,
            } from 'lucide-react';
            
            import { Button } from '@/components/ui/button';
            import { cn } from '@/lib/utils';
            
            type Variant = 'default' | 'success' | 'error' | 'warning';
            type Position =
              | 'top-left'
              | 'top-center'
              | 'top-right'
              | 'bottom-left'
              | 'bottom-center'
              | 'bottom-right';
            
            interface ActionButton {
              label: string;
              onClick: () => void;
              variant?: 'default' | 'outline' | 'ghost';
            }
            
            interface ToasterProps {
              title?: string;
              message: string;
              variant?: Variant;
              duration?: number;
              position?: Position;
              actions?: ActionButton;
              onDismiss?: () => void;
              highlightTitle?: boolean;
            }
            
            export interface ToasterRef {
              show: (props: ToasterProps) => void;
            }
            
            const variantStyles: Record<Variant, string> = {
              default: 'bg-card border-border text-foreground',
              success: 'bg-card border-green-600/50',
              error: 'bg-card border-destructive/50',
              warning: 'bg-card border-amber-600/50',
            };
            
            const titleColor: Record<Variant, string> = {
              default: 'text-foreground',
              success: 'text-green-600 dark:text-green-400',
              error: 'text-destructive',
              warning: 'text-amber-600 dark:text-amber-400',
            };
            
            const iconColor: Record<Variant, string> = {
              default: 'text-muted-foreground',
              success: 'text-green-600 dark:text-green-400',
              error: 'text-destructive',
              warning: 'text-amber-600 dark:text-amber-400',
            };
            
            const variantIcons: Record<Variant, React.ComponentType<{ className?: string }>> = {
              default: Info,
              success: CheckCircle,
              error: AlertCircle,
              warning: AlertTriangle,
            };
            
            const toastAnimation = {
              initial: { opacity: 0, y: 50, scale: 0.95 },
              animate: { opacity: 1, y: 0, scale: 1 },
              exit: { opacity: 0, y: 50, scale: 0.95 },
            };
            
            const Toaster = forwardRef<ToasterRef, { defaultPosition?: Position }>(
              ({ defaultPosition = 'bottom-right' }, ref) => {
                const toastReference = useRef<ReturnType<typeof sonnerToast.custom> | null>(null);
            
                useImperativeHandle(ref, () => ({
                  show({
                    title,
                    message,
                    variant = 'default',
                    duration = 4000,
                    position = defaultPosition,
                    actions,
                    onDismiss,
                    highlightTitle,
                  }) {
                    const Icon = variantIcons[variant];
            
                    toastReference.current = sonnerToast.custom(
                      (toastId) => (
                        <motion.div
                          variants={toastAnimation}
                          initial="initial"
                          animate="animate"
                          exit="exit"
                          transition={{ duration: 0.3, ease: 'easeOut' }}
                          className={cn(
                            'flex items-center justify-between w-full max-w-xs p-3 rounded-xl border shadow-md',
                            variantStyles[variant]
                          )}
                        >
                          <div className="flex items-start gap-2">
                            <Icon className={cn('h-4 w-4 mt-0.5 flex-shrink-0', iconColor[variant])} />
                            <div className="space-y-0.5">
                              {title && (
                                <h3
                                  className={cn(
                                    'text-xs font-medium leading-none',
                                    titleColor[variant],
                                    highlightTitle && titleColor['success'] // override for meeting case
                                  )}
                                >
                                  {title}
                                </h3>
                              )}
                              <p className="text-xs text-muted-foreground">{message}</p>
                            </div>
                          </div>
            
                          <div className="flex items-center gap-2">
                            {actions?.label && (
                              <Button
                                variant={actions.variant || 'outline'}
                                size="sm"
                                onClick={() => {
                                  actions.onClick();
                                  sonnerToast.dismiss(toastId);
                                }}
                                className={cn(
                                  'cursor-pointer',
                                  variant === 'success'
                                    ? 'text-green-600 border-green-600 hover:bg-green-600/10 dark:hover:bg-green-400/20'
                                    : variant === 'error'
                                    ? 'text-destructive border-destructive hover:bg-destructive/10 dark:hover:bg-destructive/20'
                                    : variant === 'warning'
                                    ? 'text-amber-600 border-amber-600 hover:bg-amber-600/10 dark:hover:bg-amber-400/20'
                                    : 'text-foreground border-border hover:bg-muted/10 dark:hover:bg-muted/20'
                                )}
                              >
                                {actions.label}
                              </Button>
                            )}
            
                            <button
                              onClick={() => {
                                sonnerToast.dismiss(toastId);
                                onDismiss?.();
                              }}
                              className="rounded-full p-1 hover:bg-muted/50 dark:hover:bg-muted/30 transition-colors focus:outline-none focus:ring-2 focus:ring-ring"
                              aria-label="Dismiss notification"
                            >
                              <X className="h-3 w-3 text-muted-foreground" />
                            </button>
                          </div>
                        </motion.div>
                      ),
                      { duration, position }
                    );
                  },
                }));
            
                return (
                  <SonnerToaster
                    position={defaultPosition}
                    toastOptions={{ unstyled: true, className: 'flex justify-end' }}
                  />
                );
              }
            );
            
            export default Toaster;
```
            
        - button
            
            ```typescript
import * as React from "react"
            import { Slot } from "@radix-ui/react-slot"
            import { cva, type VariantProps } from "class-variance-authority"
            
            import { cn } from "@/lib/utils"
            
            const buttonVariants = cva(
              "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
              {
                variants: {
                  variant: {
                    default: "bg-primary text-primary-foreground hover:bg-primary/90",
                    destructive:
                      "bg-destructive text-destructive-foreground hover:bg-destructive/90",
                    outline:
                      "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
                    secondary:
                      "bg-secondary text-secondary-foreground hover:bg-secondary/80",
                    ghost: "hover:bg-accent hover:text-accent-foreground",
                    link: "text-primary underline-offset-4 hover:underline",
                  },
                  size: {
                    default: "h-10 px-4 py-2",
                    sm: "h-9 rounded-md px-3",
                    lg: "h-11 rounded-md px-8",
                    icon: "h-10 w-10",
                  },
                },
                defaultVariants: {
                  variant: "default",
                  size: "default",
                },
              },
            )
            
            export interface ButtonProps
              extends React.ButtonHTMLAttributes<HTMLButtonElement>,
                VariantProps<typeof buttonVariants> {
              asChild?: boolean
            }
            
            const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
              ({ className, variant, size, asChild = false, ...props }, ref) => {
                const Comp = asChild ? Slot : "button"
                return (
                  <Comp
                    className={cn(buttonVariants({ variant, size, className }))}
                    ref={ref}
                    {...props}
                  />
                )
              },
            )
            Button.displayName = "Button"
            
            export { Button, buttonVariants }
```
            
        - Task for Augment
            
            ```javascript
Absolutely! Here’s a step-by-step Augment implementation protocol (including integration code samples) so this animated Toaster notification effect will be used for all warnings, errors, and info toasts throughout your app and tools.
            
            ⸻
            
            🚦 Task for Augment: Apply Custom Toaster Effect for All Warnings, Info, Errors in SizeWise Suite
            
            ⸻
            
            1. Centralize the Toaster
            
            a. Place the Toaster component once at the root of your app shell (usually in /app/layout.tsx), so that all pages and components can trigger toasts.
            
            // /app/layout.tsx
            import Toaster, { ToasterRef } from '@/components/ui/Toaster';
            import React, { useRef } from 'react';
            
            export default function RootLayout({ children }) {
              const toasterRef = useRef<ToasterRef>(null);
            
              // You may pass this ref via context/provider to children if needed
            
              return (
                <html lang="en">
                  <body>
                    {/* ...AppShell/sidebar/header... */}
                    {children}
                    <Toaster ref={toasterRef} defaultPosition="bottom-right" />
                  </body>
                </html>
              );
            }
            
            ⸻
            
            2. Make the Toaster Globally Triggerable
            
            a. Expose a global toast utility, e.g. via React Context or a custom hook.
            b. Example: useToaster hook (placed in /lib/hooks/useToaster.ts):
            
            // /lib/hooks/useToaster.ts
            import React, { useContext, createContext, useRef } from "react";
            import Toaster, { ToasterRef } from "@/components/ui/Toaster";
            
            const ToasterContext = createContext<React.RefObject<ToasterRef> | null>(null);
            
            export function ToasterProvider({ children }: { children: React.ReactNode }) {
              const toasterRef = useRef<ToasterRef>(null);
              return (
                <ToasterContext.Provider value={toasterRef}>
                  {children}
                  <Toaster ref={toasterRef} defaultPosition="bottom-right" />
                </ToasterContext.Provider>
              );
            }
            
            export function useToaster() {
              const ctx = useContext(ToasterContext);
              if (!ctx) throw new Error("useToaster must be within ToasterProvider");
              return ctx;
            }
            
            c. Then, wrap your RootLayout or AppShell with <ToasterProvider>:
            
            // /app/layout.tsx or /app/AppShell.tsx
            import { ToasterProvider } from "@/lib/hooks/useToaster";
            
            export default function RootLayout({ children }) {
              return (
                <html lang="en">
                  <body>
                    <ToasterProvider>
                      {/* ...rest of app... */}
                      {children}
                    </ToasterProvider>
                  </body>
                </html>
              );
            }
            
            ⸻
            
            3. Trigger Toaster Notifications Anywhere
            
            a. In any component (tool, validation, warning, etc):
            
            import { useToaster } from "@/lib/hooks/useToaster";
            
            export default function MyComponent() {
              const toasterRef = useToaster();
            
              function handleError() {
                toasterRef.current?.show({
                  variant: "error",
                  title: "Calculation Error",
                  message: "Input is invalid or exceeds SMACNA limits.",
                  actions: {
                    label: "Fix Input",
                    onClick: () => {
                      // focus or scroll to input field
                    },
                  },
                });
              }
            
              return (
                <button onClick={handleError}>
                  Trigger Error Toast
                </button>
              );
            }
            
            	•	Use "error", "warning", "success", or "default" as needed.
            	•	You can use this for warnings, validation errors, user notifications, export success, etc.
            
            ⸻
            
            4. Apply in All Tools & App-wide
            
            a. Replace all usages of window.alert, console.warn, or existing basic toasts/snackbars with the new Toaster effect.
            	•	In tools (e.g., Air Duct Sizer), trigger a warning when a value exceeds standards.
            	•	In project screens, notify on successful save/export.
            	•	In admin, use for permission errors or confirmations.
            
            b. Example for validation inside a tool:
            
            if (input > MAX_VALUE) {
              toasterRef.current?.show({
                variant: "warning",
                title: "Value Too High",
                message: "The value entered exceeds the allowed maximum for this tool.",
                highlightTitle: true,
              });
            }
            
            c. For async events or API errors:
            
            try {
              await api.saveProject(data);
              toasterRef.current?.show({
                variant: "success",
                title: "Saved",
                message: "Your project was saved successfully!",
              });
            } catch (e) {
              toasterRef.current?.show({
                variant: "error",
                title: "Save Failed",
                message: "There was a problem saving your project.",
              });
            }
            
            ⸻
            
            5. Design Consistency
            	•	Always use the Toaster for warnings, validation errors, status alerts, and user feedback in all core tools and app sections.
            	•	Ensure that only one or two toasts are visible at a time for clarity.
            	•	Adjust variant, actions, and position as appropriate for the UX context.
            
            ⸻
            
            Summary for Augment
            
            Implement the custom Toaster effect as the universal notification system:
            	•	Place <Toaster /> at the root layout, using context if needed for global access.
            	•	Provide a hook (useToaster) so any component can trigger notifications.
            	•	Refactor all warnings, errors, and info messages in all tools/app screens to use this effect instead of browser alerts or legacy toasts.
            	•	Reference and build upon the code samples above for consistency and accessibility.
            	•	Test in all themes and on mobile/desktop.
            
            ⸻
            
            If any tool or page still uses old alert methods, update to this new system.
            If you need code or integration help for a specific tool, request clarification.
            
            ⸻
            
            Let me know if you want an admin-only override, custom themes, or a more advanced API!
```
            
    - Augment Implementation protocol
        
        Here’s an **instruction set for Augment** that is clear, precise, and ready for team implementation.
        
        This covers both **navigation menu hover effect** and **universal animated Toaster notifications**—with explicit expectations and reference code.
        
        ---
        
        ## 🚦 Augment Implementation Protocol
        
        ### 1. **Navigation Menu – “Dock Label at Hover” Effect**
        
        **Requirement:**
        
        All items in the top navigation menu must use the `dock-label-at-hover` effect (animated label reveal on hover, floating animation for icons).
        
        **Integration Steps:**
        
        - **Use the provided Dock component for all nav icons/menus:**
            
            ```tsx
import { Dock } from "@/components/ui/Dock";
            // Sample usage:
            <Dock
              items={[
                { icon: Home, label: "Home", onClick: ... },
                { icon: Folder, label: "File", onClick: ... },
                // ...other nav items
              ]}
            />
```
            
        - **Effect:**
            - Icon floats gently (framer-motion animation)
            - Label fades in above icon on hover
            - Applies to all main nav items (Home, File, Projects, Tools, Profile, etc.)
        - **Where:**
            - Top navigation bar, centered horizontally, all dropdowns and menu groups.
        
        ---
        
        ### 2. **Messages and Notification Pop-up – Universal Animated Toaster**
        
        **Requirement:**
        
        All system messages, notifications, validation warnings, and status alerts must use the **custom Toaster effect**—no window alerts or legacy snackbars.
        
        **Implementation Steps:**
        
        - **Step 1:**
            - Place the `<Toaster />` component at the app’s root (usually in `/app/layout.tsx`).
            - Reference code as provided (see above for import/useRef).
        - **Step 2:**
            - Wrap the app in a `ToasterProvider` to make toaster ref available globally.
            - Use the `useToaster()` hook to trigger notifications from any component or tool.
        - **Step 3:**
            - Replace all alert/info/error/warning messages with `toasterRef.current?.show({ ... })`
            - Use variants: `"success"`, `"warning"`, `"error"`, `"default"` as context requires.
            - Add action buttons when user remediation is possible (“Fix Input”, “Retry”, etc).
        - **Step 4:**
            - Test in all supported color themes and ensure only one or two toasts show at once.
        - **Code Samples:**
            - See code blocks in your message for direct integration (Dock, Toaster, Button).
        
        ---
        
        ### 3. **General Instructions**
        
        - **Accessibility:**
            - All navigation and notifications must be keyboard and screen-reader accessible.
        - **Consistency:**
            - Use these effects everywhere (across all tools/modules).
            - Do not mix with older notification styles.
        - **Testing:**
            - QA across all major browsers, desktop, and tablet/iPad layouts.
        - **Customization:**
            - If admin-only override or custom themes are needed, consult design/system team before extending.
        
        ---
        
        ## **Summary**
        
        - **Apply Dock “label-at-hover” animation for all main top navigation items.**
        - **Implement universal animated Toaster (bottom-right) for all notifications and user feedback.**
        - **Ensure code samples provided are referenced and used as implementation baseline.**
        - **Phase out all legacy alerts/snackbars in favor of these new, unified effects.**
        
        ---
        
        **If any part of the code or workflow integration is unclear, ask for clarification or further breakdown per tool or screen.**
        
    
    - [ ]  Theme
    
    - [ ]  Light Mode - White
    - [ ]  Dark Mode - Black
    - [ ]  System - Dark/Light Mode

### SizeWise Home Page

- Background
    - Background Effects
        - Laser Background
            
            ```tsx

```
            
        - Black Background Color
            
            ```tsx

```
            

### Air Duct Sizer

- **Canvas, Panel & Interaction Specs**
    
    ### **Air Duct Sizer 3D Tool — Canvas, Panel & Interaction Specification**
    
    ---
    
    - **UI Placement Summary Table**
        
        
        | Element ID | Component | Type | Placement | Visibility | Purpose |
        | --- | --- | --- | --- | --- | --- |
        | 1 | **Project Properties** | Retractable panel | Top-left | On demand | Project metadata |
        | 2 | **3D Canvas** | Workspace | Full center viewport | Always | Drawing stick lines & interacting with 3D ducts |
        | 3 | **Drawing Tool Pencil FAB** | Toggle button | Bottom-right | Always | Draw stick lines ON/OFF |
        | 4 | **Convert to 3D Ducts** | Primary button | Bottom-right cluster or Calc Bar | On demand | Convert stick lines to 3D duct models |
        | 5 | **Selection Pop-Up** | Contextual window | Anchored near element | On selection | Quick edit/properties |
        | 6 | **Calculation Bar** | Persistent bar | Bottom full-width | Always | Key results & quick actions |
        | 7 | **Import/Export Panel** | Collapsible panel | Above Calculation Bar | On demand | Manage files |
        | 8 | **Warning Panel** | Retractable panel | Right edge viewport | On demand | List and resolve warnings |
        | 9 | **View Cube** | Navigation aid | Top-right | Always | 3D orientation |
    
    ---
    
    - **1. Project Properties Panel**
        
        # **Project Properties Panel — Complete Documentation**
        
        ---
        
        ## **A. Overview & Rationale**
        
        The **Project Properties Panel** provides a single, discoverable entry point for managing all project-wide data, settings, and metadata. Its design minimizes workspace intrusion, maximizes accessibility, and matches modern professional UI patterns found in top SaaS and CAD tools.
        
        ---
        
        ## **B. Collapsed State (“Retracted”)**
        
        ### **Trigger Button**
        
        - **Location:** Top-left, docked flush to the viewport’s left/top edge, always visible.
        - **Dimensions:** 44 px tall × 56 px wide (icon only, default) or up to 160 px (icon + label on wider screens).
        - **Icon:**
            - **Folder** (`folder_open` recommended, Material/Apple style, filled for modern look).
            - **Color:**
                - Default: #90A4AE (cool gray)
                - Hover/Focus: background increases opacity to rgba(255,255,255,0.96), folder icon gets a subtle #FF9800 (orange) glow.
                - Active (panel open): icon highlights #FF9800, folder background stays frosted.
        - **Label (Optional):**
            - Text: “Project” (15–16 px, semi-bold, #424242)
            - Visible beside icon if enough space.
        - **Background:**
            - Frosted glass: rgba(255,255,255,0.92), border #E0E0E0 (2 px, 25% opacity).
            - Corners: top-left 16 px, others 0 px.
            - Subtle shadow: 0 1px 8px rgba(180,190,200,0.10)
        - **Affordance:**
            - Cursor: pointer on hover
            - Tooltip: “Project Properties”
            - ARIA label: `aria-label="Open Project Properties Panel"`
            - Tab/Enter/Space opens panel
        
        ---
        
        ## **C. Expanded State (“Open”)**
        
        ### **Panel Layout & Appearance**
        
        - **Expansion Animation:**
            - Panel slides in from the left (≤200 ms, cubic-ease), icon/label animate to “pressed” state.
        - **Dimensions:**
            - Width: 320–360 px (responsive, never collapses thinner than 320 px)
            - Height: 100% viewport (full vertical)
        - **Background:**
            - Frosted glass (rgba(255,255,255,0.92)), same as collapsed
            - Liquid glass border (#E0E0E0), 2 px, 25% opacity, top-left 16 px
            - Subtle drop shadow (0 2px 24px #B0BEC5)
        - **Header:**
            - 44–56 px tall: folder icon (now orange #FF9800), label “Project Properties,” and [×] close button at right
            - Header background: slightly more opaque (for focus), no shadow
        
        ---
        
        ### **D. Contents & Organization**
        
        ### **Section A: Project Information** *(Always expanded)*
        
        - **Project Name** (text input)
        - **Project Number** (text input)
        - **Project Description** (multiline textarea)
        - **Project Location** (text input or dropdown)
        - **Client Name** (text input)
        - **Estimator Name** (auto-filled, editable)
        - **Date Created** (read-only)
        - **Last Modified** (read-only)
        - **Version** (read-only, links to Version Control if available)
        - **Company Logo** (upload field, square with rounded corner preview 40×40 px)
        
        ### **Section B: Code References** *(Collapsible dropdown)*
        
        - **Duct Sizing Standard** (dropdown: SMACNA, ASHRAE, Local, etc.)
        - **Material Standard** (dropdown or multi-select)
        - **Fire Safety Standard** (dropdown: UL, NFPA, Local, etc.)
        - **Local Regulations** (text input)
        - **Import Standards** (button)
        - **Export Standards** (button)
        
        ### **Section C: Global Defaults** *(Collapsible dropdown)*
        
        - **Measurement Units** (dropdown: Imperial/Metric)
        - **Default Duct Size** (width × height or diameter, numeric input, 8” default if no input from user)
        - **Default Material** (dropdown)
        - **Default Insulation Type** (dropdown)
        - **Default Fitting Type** (dropdown)
        - **Calibration Mode** (toggle: Auto/Manual)
        - **Design Parameters** (custom fields, optional)
        
        ### **Section D: Team & Collaboration** *(Collapsible dropdown)*
        
        - **Project Owner** (avatar/name, dropdown reassign)
        - **Team Members** (list, add/remove, assign roles)
        - **User Roles** (per member: Editor, Viewer, Admin)
        - **Share Project** (toggle)
        - **Activity Log** (read-only, scrollable)
        
        ### **Section E: Project Administration** *(Collapsible dropdown)*
        
        - **Project Status** (dropdown: Design, Bid, Construction, As-Built)
        - **Project Notes** (rich textarea, time-stamped)
        - **Stakeholder Contacts** (Name, Role, Email, Phone—repeatable fields)
        - **Custom Fields** (user-defined label/value)
        - **Archive Project** (button; confirmation dialog opens)
        - **Export Project** (button)
        
        ---
        
        ### **E. Interaction Details**
        
        - **Expand/collapse:**
            - Clicking a section header toggles open/closed (arrow rotates, section animates <150 ms)
        - **Inputs:**
            - All fields use “liquid glass” styling—subtle transparent white, sharp contrast text, rounded corners.
        - **Movability:**
            - Panel is fixed—cannot be moved or detached.
        - **Dismissal:**
            - Click [×] in header, click outside panel, or press Esc to close.
            - Panel always returns to last scroll position when reopened.
        - **Accessibility:**
            - All fields and headers are tab-navigable.
            - Section headers announce “expand/collapse” to screen readers.
            - Close button is last in tab sequence.
        
        ---
        
        ### **F. Visual & Theming Details**
        
        - **Panel BG:** rgba(255,255,255,0.92)
        - **Border:** #E0E0E0, 2 px
        - **Input BG:** rgba(255,255,255,0.82), border #D1D1D1
        - **Active icon:** #FF9800 (orange highlight)
        - **Text:** #212121 (90% opacity)
        - **Headers:** #424242, semi-bold, 16–17 px
        - **Labels:** #616161, regular, 15 px
        - **Dropdowns/Buttons:** Slightly raised with liquid glass effect; clear hover/active states
        
        ---
        
        ### **G. Summary Table**
        
        | Element | State | Description |
        | --- | --- | --- |
        | Trigger Button (Panel) | Collapsed | Top-left, folder icon, frosted glass, 44×56 px |
        | Panel (Main) | Expanded | 320–360 px wide, 100% tall, frosted, 5 section layout |
        | Header | Expanded | Icon + label + close (×) |
        | Section: Info | Always open | Name, Number, Client, Estimator, Logo, Dates, Version |
        | Section: Codes | Collapsible | Standards, regs, import/export |
        | Section: Defaults | Collapsible | Units, material, fitting, calibration, params |
        | Section: Team | Collapsible | Owner, team, sharing, log |
        | Section: Admin | Collapsible | Status, notes, contacts, custom, archive/export |
        | Dismissal | Any | Esc, outside click, × button |
        | Accessibility | Any | Tab, ARIA, tooltips, contrast, keyboard |
        
        ---
        
        ## **H. Example Figma Wireframe Guidance**
        
        - **Collapsed state:** folder icon (left), label “Project” (if space), frosted glass, fixed top-left
        - **Expanded state:** slides out over canvas, full-height, all sections laid out vertically, first section open, rest as dropdowns
        - **Inputs:** liquid glass, iconography matches rest of app, consistent paddings (16 px horizontal, 20 px section heads)
        - **States:** clear active, hover, focus for every field/button
        
        ---
        
        ## **I. Rationale & UX Justification**
        
        - **One-click access** for all project-level data
        - **Non-intrusive**: stays out of the way when not in use, instantly accessible when needed
        - **Scalable**: new fields, standards, and metadata can be added via custom fields
        - **Professional, trusted look** for engineers and PMs—evokes trust in data, easy to handoff for QA/compliance.
    
    ---
    
    - **2. 3D Canvas Workspace**
        
        # **3D Canvas Workspace — Full Documentation**
        
        ---
        
        ## **A. Overview**
        
        The **3D Canvas Workspace** is the heart of the Air Duct Sizer tool—serving as the interactive, visual area for creating, editing, and reviewing duct layouts and system models in real time.
        
        ---
        
        ## **B. Placement & Appearance**
        
        - **Coverage:**
            - Occupies the entire main viewport except for overlaying panels, floating toolbars (FAB, View Cube, etc.), and status bars.
            - **Always visible and maximized**—no scrollbars unless the user zooms/pans.
        - **Background:**
            - Clean, soft-white (#FAFBFC) for maximum contrast with drawn elements.
            - Subtle, non-intrusive grid (optional: #E3E7EA, 15% opacity) aids alignment.
        - **Edges:**
            - No borders, but a gentle drop shadow at the top and bottom edges may indicate workspace boundaries (optional for app style).
        
        ---
        
        ## **C. Core Interactions**
        
        ### **1. Mouse and Touch Controls**
        
        ### **a. Navigation**
        
        - **Right-click + Drag:**
            - **Pan** the view horizontally and vertically.
            - **Cursor:** changes to “hand” while panning.
        - **Mouse Scroll Wheel / Two-finger Pinch (Touch):**
            - **Zoom in/out** centered on cursor position.
            - **Zoom levels:** min 10%, max 500%.
        - **Left-click + Drag (Empty Space):**
            - **Rotate 3D Canvas:**
                - **Without modifier:**
                    - Rotates 3D view (orbit camera around model)
                - **With [Shift] key held:**
                    - Restricts rotation to a single axis (horizontal/vertical based on drag direction)—enables “2D rotate” for precise plan/top/side views.
        - **Double-click (Empty Space):**
            - **Reset view** to default orientation (top or isometric, configurable).
        
        ### **b. Drawing vs. Selection**
        
        - **Pencil Tool OFF:**
            - **Left-click on element:** selects duct, fitting, or equipment.
                - **Ctrl/Cmd+Click:** multi-select.
            - **Left-click + drag (on empty):** rotates canvas (see above).
        - **Pencil Tool ON:**
            - **Left-click:**
                - Click = Place new node for stick line.
                - Double-click = End current duct run.
                - Right-click (while drawing) = temporarily pan without breaking line.
            - **Esc key:** cancels active drawing without placing the last segment.
        
        ---
        
        ### **2. Keyboard Shortcuts**
        
        | Shortcut | Action |
        | --- | --- |
        | Esc | Cancel current drawing/selection |
        | Ctrl/Cmd + Z | Undo last action |
        | Ctrl/Cmd + Y | Redo last undone action |
        | Ctrl/Cmd + A | Select all (if focus in canvas) |
        | Shift (hold) | Restrict rotation to single axis |
        | Spacebar | Quick-toggle between select/draw tool |
        | F | Frame selected object(s) |
        
        ---
        
        ### **3. Visual Feedback**
        
        - **Selection:**
            - Selected elements outlined with high-contrast (e.g., #FF9800 orange glow) and “grip” handles for moving/resizing.
        - **Drawing Mode:**
            - Current stick line shows as semi-transparent orange (#FFA726, 80% opacity).
            - Next node preview: ghosted circle at cursor.
        - **Warnings:**
            - Any duct/fitting with a warning: glows with red/yellow, matching severity.
        - **Hover States:**
            - Elements under cursor highlight (light blue #00BCD4, 40% opacity).
        - **Grid & Origin:**
            - Optional grid fades in as user zooms closer; X/Y/Z origin marker always visible at bottom-left of canvas.
        
        ---
        
        ## **D. Accessibility**
        
        - **Tab navigation:**
            - All overlay/floating controls and context menus are focusable, but canvas itself is not tab-navigable (avoids trapping keyboard users).
        - **Keyboard users:**
            - All drawing, selection, and navigation accessible via keyboard shortcuts.
        - **Screen reader:**
            - Notifies user of selection, warnings, and draw mode changes (“Drawing Mode Active”, “Duct Selected”, etc.).
        - **High contrast mode:**
            - Orange, blue, and red states meet WCAG AA for contrast on light backgrounds.
        
        ---
        
        ## **E. Resilience & Error Handling**
        
        - **No action is destructive by default**—drawing, moving, or rotating can be undone/redone via history controls.
        - **Auto-save:**
            - Canvas state is periodically saved; restoring from crash reloads last auto-saved model.
        - **Edge protection:**
            - If a user drags or pans past model bounds, canvas gently “bounces” or fades to show end of workspace.
        
        ---
        
        ## **F. Rationale & UX Justification**
        
        - **Direct, “what you see is what you get” (WYSIWYG)** workspace encourages experimentation and minimizes user error.
        - **Professional standards** (orbit, pan, zoom, undo/redo) familiar to any engineer, designer, or estimator.
        - **Maximal visibility**—by hiding all non-essential panels, user focus stays on modeling and reviewing system layout.
        
        ---
        
        ## **G. Example Interaction Flow**
        
        1. **User opens project; canvas is empty or shows last saved state.**
        2. **User pans with right-click, zooms with scroll, rotates view with left-click+drag.**
        3. **User enables Pencil Tool (FAB): left-click places first node, continues drawing stick line for centerline.**
        4. **User double-clicks to finish run, presses Esc to cancel segment, or right-clicks to pan without leaving draw mode.**
        5. **User disables Pencil Tool, selects element(s), moves/edits as needed.**
        6. **User can rotate in 2D by holding Shift while dragging, useful for aligning to plans or elevations.**
        7. **Any drawing or element with warnings glows as appropriate; hovering shows quick highlights.**
        
        ---
        
        ## **H. Table: Mouse/Key Interactions**
        
        | Action | Mouse/Key | Result |
        | --- | --- | --- |
        | Pan view | Right-click + drag | Moves viewport |
        | Zoom | Scroll/pinch | In/out zoom centered on cursor |
        | 3D Rotate | Left-click + drag | Rotates 3D view |
        | 2D Rotate | Shift + Left-click+drag | Restricts to horizontal/vertical |
        | Draw stick lines | Pencil ON + Left-click | Places nodes for new duct runs |
        | End stick line | Pencil ON + Double-click | Ends duct run |
        | Cancel drawing | Esc | Exits drawing mode |
        | Select element | Pencil OFF + Left-click | Selects duct/fitting/equipment |
        | Multi-select | Ctrl/Cmd + Click | Adds to selection |
        | Undo/Redo | Ctrl/Cmd+Z / Ctrl/Cmd+Y | Undo/redo any change |
        
        ---
        
        ## **I. Theming & Visuals**
        
        - **Background:** #FAFBFC (white, very light)
        - **Grid (optional):** #E3E7EA, 15% opacity
        - **Selection Outline:** #FF9800 (orange)
        - **Drawing Line:** #FFA726 (orange, 80% opacity)
        - **Hover:** #00BCD4 (light blue, 40% opacity)
        - **Warning:** #FF5252 (red) / #FFEB3B (yellow) depending on severity
    
    ---
    
    - **3. Drawing Tool (Floating Action Button – FAB)**
        
        # **3. Drawing Tool FAB (Floating Action Button) — FINAL SPECIFICATION**
        
        ---
        
        ## **A. Naming**
        
        - **UI Short Name:** Drawing Tool FAB
        - **System Label:** “Draw Duct Lines”
        - **Icon:** Standard Pencil (aligned with international design and CAD conventions)
        - **State Names:** OFF, ON, Drawing In Progress
        
        ---
        
        ## **B. Placement**
        
        - **Viewport Location:** Always floating at bottom-right corner of the 3D canvas.
            - Never obstructed by overlays or panels.
            - Smart repositioning for mobile/tablet or accessibility modes.
            - Z-index above other floating controls (but beneath pop-up panels).
        
        ---
        
        ## **C. Behavior & State Logic**
        
        ### **State 1: OFF**
        
        - **Visual:**
            - FAB appears neutral grey (`#BDBDBD`), high-contrast icon, 100% opacity.
            - Tooltip: **“Draw Duct Lines (OFF)”**
        - **Interaction:**
            - Left-click toggles ON (draw mode).
            - FAB can be toggled with keyboard shortcut **D** (documented in tooltip).
            - On canvas, all clicks are for selection (no drawing).
        
        ---
        
        ### **State 2: ON (Ready, Not Drawing)**
        
        - **Visual:**
            - FAB becomes orange (`#FF9800`), highly visible, 100% opacity.
            - Cursor changes to pencil/crosshair.
            - Tooltip: **“Draw Duct Lines (ON)”**
        - **Interaction:**
            - Left-click anywhere on canvas:
                - **Immediately creates the first node.**
                - **Immediately triggers a Pop-Up Property Panel (“Duct Properties”)** with fields:
                    - **Width, Height, or Diameter:** (user can select shape: rectangular or round)
                    - **Material Type:** (dropdown)
                    - **Insulation:** (Y/N, thickness)
                    - **Default Duct Name:** (editable)
                - User sets/accepts duct properties for the current run.
                - Closing this pop-up (by confirming or hitting Enter) resumes drawing (with those properties pre-applied).
            - Drawing stick line proceeds node-by-node as before (click = place node, double-click = end line/run).
            - **Right-click:** Pan (even in draw mode).
            - **Esc:** Cancels the current line segment (returns to ready to start new line, ON state).
        
        ---
        
        ### **State 3: Drawing in Progress**
        
        - **Visual:**
            - FAB maintains orange, but opacity reduced to **60%** (signals in-progress action).
            - Tooltip: **“Drawing in progress…”**
        - **Interaction:**
            - Can click FAB to exit draw mode at any time (see next).
            - Drawing ends when user double-clicks, presses Esc, or toggles FAB OFF.
        
        ---
        
        ### **Toggle OFF — Ending Draw Mode**
        
        - **Action:**
            - **Clicking the FAB** (or pressing “D”) while ON **auto-converts all in-progress lines** to 3D ducts:
                - Ducts extruded using the most recently entered properties (or properties assigned per run).
                - Each segment inherits the properties assigned in its run.
                - Any disconnected or incomplete lines are validated; user is warned if conversion cannot complete (e.g., floating lines).
            - Tooltip: **“Draw Duct Lines (OFF)”**
            - FAB returns to grey/neutral visual.
        
        ---
        
        ## **D. Pop-Up Property Panel (“Duct Properties”)**
        
        - **Trigger:** Immediately upon placing the first node (start of a new run).
        - **Fields:**
            - **Duct Shape:** (Rectangular, Round; radio select)
            - **Width, Height, Diameter:** (based on shape)
            - **Material Type:** (dropdown; e.g., Galv. Steel, Aluminum, Stainless)
            - **Insulation:** (toggle + numeric input for thickness)
            - **Duct Name/Tag:** (auto-increment; editable)
        - **Behavior:**
            - Panel stays centered on screen or near click (space permitting).
            - Confirm applies values to current drawing run; cancels returns to drawing mode but aborts run.
            - Panel is fully keyboard navigable and accessible.
        
        ---
        
        ## **E. Accessibility**
        
        - **Keyboard:**
            - FAB is in tab order (can tab to, press Enter/Space to toggle).
            - “D” key toggles draw mode ON/OFF.
            - Esc cancels line in progress.
            - Pop-Up panel is fully accessible (tab/arrow keys, Enter/Esc).
        - **Screen Reader:**
            - ARIA label always reflects state: “Draw Duct Lines, OFF/ON/Drawing in progress…”
        - **Color Contrast:**
            - Orange (`#FF9800`) and grey (`#BDBDBD`) meet/exceed WCAG 2.1 AA for icons and backgrounds.
        - **Tooltip:**
            - Always visible on hover/focus, with dynamic state message.
        - **Placement:**
            - FAB never obstructed, repositionable for accessibility needs.
        
        ---
        
        ## **F. Visual & Interaction Feedback**
        
        - **Opacity:** FAB dims to signal in-progress drawing.
        - **Cursor:** Pencil/crosshair when ON; pointer when OFF.
        - **Transition:** FAB color/opacity transitions animated (≤150ms).
        - **Pop-Up Panel:** Zoom/fade-in animation; dismisses with Enter/Esc.
        - **Auto-conversion:** All drawn lines extruded instantly on mode exit (no “convert” button needed).
        
        ---
        
        ## **G. Rationale & Engineering Practice Alignment**
        
        - **Efficiency:** Immediate property input removes extra steps and prevents error-prone generic line drawing.
        - **Professional Standard:** Mirrors Revit, CAD, and leading BIM tools: drawing mode always starts with property context.
        - **Clarity:** FAB always reflects state (color, tooltip, opacity) for user confidence and safety.
        - **Speed:** Auto-conversion on toggle OFF allows engineers to draw, edit, and iterate in a rapid, natural workflow.
        - **Accessibility:** No mouse required for any core interaction.
        
        ---
        
        **This is the canonical spec for the Drawing Tool FAB for Air Duct Sizer 3D Tool MVP. All logic, UI, interaction, accessibility, and engineering rationale is covered.**
        
    
    ---
    
    - **4. Convert to 3D Button**
        
        ### **Purpose**
        
        Transforms **all drawn stick lines** (duct centerlines) into **actual 3D duct models** with default dimensions and fittings.
        
        ### **Better Naming Suggestions**
        
        1. **Generate Duct Model** (clear for engineers)
        2. **Convert to 3D Ducts** (explicit, user-friendly)
        3. **Build Ductwork** (natural-language, workflow-oriented – **recommended**)
        4. **Extrude Duct Lines** (technical, CAD-like)
        
        ### **Specifications**
        
        - **Type:** Large primary button (persistent, floating or placed in Calculation Bar — suggestion below)
        - **Placement (Recommended):** **Left of the FAB** (bottom-right cluster) OR **in the Calculation Bar** for workflow consistency
        - **Behavior:**
            - **On Click:**
                - Processes all connected stick lines into 3D extruded duct sections (based on default or user-specified dimensions)
                - Auto-detects intersections and inserts default fittings (e.g., elbows, tees).
            - **Progress Indicator:**
                - Shows a spinning loader over the button or temporary “Generating…” toast
            - **Undo Option:**
                - After generation, shows **“Undo Conversion”** as a secondary action for 10 seconds (or until a new change is made).
    
    ---
    
    - **5. Context Property Panel**
        
        ### **Context Property Panel — Air Duct Sizer 3D Tool**
        
        - **1. Name & Role**
            - Official Name: Context Property Panel
            - Internal Reference: ContextPropertyPanel
            - Purpose:
            An interactive, floating UI panel that appears when the user selects any element(s) (duct, fitting, room, equipment, or multi-select group) within the 3D canvas. It provides immediate access to key actions, editable properties, and element-specific status in a context-driven, visually modern interface.
        - **2. Trigger & Lifecycle**
            - Display Trigger:
                - Panel appears whenever one or more selectable elements are highlighted (clicked or multi-selected) in the 3D canvas.
            - Dismissal:
                - Panel disappears (“zooms out”) when the user:
                    - Deselects all elements,
                    - Clicks outside both the panel and the selection,
                    - Presses Esc (keyboard).
            - Persistence:
                - Panel remains visible and interactive as long as the selection exists, regardless of panning/zooming the view.
        - **3. Placement & Movement**
            - Initial Placement:
                - Panel dynamically appears in the largest available open space nearest to the first selected element (centroid for multi-select).
                - Never overlaps the selected geometry or obstructs critical UI.
                - Automatically repositions if window is resized and would otherwise occlude a selection.
            - Movability:
                - User can move the panel anywhere within the viewport by clicking and dragging on any part of the panel (not just a header/grip).
            - Resizing:
                - Four resize handles (standard corner grabbers) are displayed on panel hover, one at each corner.
                - Panel can only be resized by dragging a corner handle—edges and borders do not respond.
                - Minimum and maximum sizes enforced to preserve usability.
        - **4. Animation**
            - Panel Appearance:
                - Zooms in: Panel animates from the first selected element—scaling and fading in (e.g., scale from 0.6 to 1.0, opacity 0.6 to 1.0) to its calculated position in the viewport.
            - Panel Dismissal:
                - Zooms out: On dismissal, panel animates back toward the first selected element, scaling down and fading to opacity 0.
            - Resize Handle Animation:
                - On hover, each corner handle animates in place (e.g., expands, glows, or gains offset/parallel marks) to signal interactivity.
        - **5. Visual Design**
            - Background:
                - Frosted Glass:
                    - Semi-transparent white, high blur (e.g., rgba(255,255,255,0.55), 24px backdrop blur).
                    - Color and effect remain the same in light and dark modes (panel and canvas do not invert or change).
            - Border:
                - Liquid Glass:
                    - Semi-transparent white or icy-blue, smooth glowing effect, visually “liquid” (not flat/solid).
                    - Thickness: ~2px; color consistent across all themes.
            - Drop Shadow:
                - Soft white or subtle blue outer glow, low opacity, for depth without distraction.
            - Resize Handles:
                - Four circular grabbers at the corners, semi-translucent, glowing on hover.
                - On hover, each handle may animate (e.g., pulse or gain double-parallel offset marks for visibility).
            - Hover State (Panel):
                - Entire panel receives a faint white/blue glow on hover, enhancing discoverability.
        - **6. Contents & Layout**
            - Panel Orientation:
                - Horizontal bar, arranged as follows for both single and multiple selection:
                    1. Quick Actions
                        - Horizontally grouped at the end of the panel closest to the selected element(s).
                        - Always includes:
                            - Add (contextual: Add Branch, Add Equipment, etc.)
                            - Remove (removes current selection)
                        - No “edit” action—editing is always direct via property fields.
                    2. Editable Properties
                        - Centered within the panel, occupying most of the horizontal space.
                        - Displays all modifiable fields for the selected element(s):
                            - For multi-select, shows only shared properties; unique properties shown as “(varied)” or disabled.
                            - Examples:
                                - Duct: size, material, length, flow
                                - Room: name, type, target flow
                                - Equipment: type, capacity
                        - All fields have liquid glass background (slightly higher opacity frosted glass), with unit hints and always-labeled.
                        - Field Hover/Focus: Fields brighten or glow gently on hover/focus, with no harsh contrast.
                    3. Status Section
                        - At the far end of the panel, furthest from selection.
                        - Contains:
                            - Warning/error badges (color-coded: red, yellow, green)
                            - Lock indicators (if property is read-only or tier-locked)
                            - Selection summary (for multi-select: total length, combined flow, etc.)
                            - Info tooltips linked to code/standard references (e.g., SMACNA, ASHRAE)
        - **7. Accessibility**
            - Keyboard Navigation:
                - Full tab/arrow key support for quick actions, properties, and status section.
                - ESC closes the panel and deselects.
                - Resize handles are focusable via tab and adjustable with keyboard (arrow keys when focused).
                - Panel movement can be triggered by keyboard shortcut (e.g., Alt+Arrow).
            - Screen Reader Support:
                - Panel announces itself as: “Context Property Panel for [element type] selected.”
                - Each action, field, and badge fully described.
                - Announces field state changes (“Size: 12x8 inches, required field, warning: velocity exceeds limit.”)
            - Contrast & Visibility:
                - Text, icons, fields, and handles always meet or exceed WCAG 2.1 AA.
                - Frosted and liquid glass never reduce essential contrast or legibility.
        - **8. Rationale**
            - Modern Professionalism:
                - The frosted glass and liquid glass border provide a contemporary, high-end visual, in line with top-tier engineering software.
            - Contextual Workflow:
                - Panel placement and animation reinforce focus on selected elements, boosting user orientation and reducing cognitive load.
            - Direct Editing:
                - Removing the edit action streamlines interaction—users work directly with property fields, with instant feedback.
            - Discoverability:
                - Movability and resize handles are clear, visually prominent, and universally understood by professional users.
            - Single Source of Interaction:
                - Only one Context Property Panel is ever shown at a time, even for multi-select—keeps the workspace clean.
        - **9. Edge Cases & Constraints**
            - Panel cannot be resized by edge or border—only by visible corner handles.
            - Panel never covers the selected element or blocks essential UI (smart placement logic).
            - Multi-select always shows the same Context Property Panel; non-shared fields are shown as “(varied)” or disabled, not hidden.
            - Panel does not collapse or auto-move during canvas pan/zoom—remains until user acts.
        - **10. Summary Table**
            
            
            | **Attribute** | **Description** |
            | --- | --- |
            | Name | Context Property Panel |
            | Trigger | Selection of any element(s) in 3D canvas |
            | Placement | Smart float, nearest open space to first selection; user can move |
            | Animation | Zoom in from/to first selection (panel); resize handles animate on hover |
            | Background | Frosted glass (same for light/dark), semi-transparent, blurred |
            | Border | Liquid glass (white/icy-blue glow), consistent across themes |
            | Actions | Add (contextual), Remove |
            | Editable Fields | Centered, liquid glass input style, clear labels, shared fields for multi-select |
            | Status Section | Warnings, lock, summary, info tooltips |
            | Resize | Corner handles only, visible on hover, keyboard and mouse accessible |
            | Accessibility | Full tab/arrow nav, ARIA labeling, contrast AA, move/resize by keyboard and mouse |
            | Persistence | Never auto-hides, only user-dismissed, always one panel |
            | Rationale | Professional, context-driven, clutter-free, matches modern engineering/CAD UI paradigms |
        - **11. Context Property Panel — Color Codes**
            
            ---
            
            ## **Context Property Panel — Color Codes Specification**
            
            ---
            
            ### **Panel Background (Frosted Glass)**
            
            - **Primary Panel:**
                - `background: rgba(247, 250, 255, 0.55)`
                    
                    *(Very light, clean white-blue; soft frost. Ensures contrast on both light/dark canvas.)*
                    
                - **HEX Preview:** `#F7FAFF` at 55% opacity
            - **Backdrop Blur:**
                - *CSS*: `backdrop-filter: blur(24px);`
            
            ---
            
            ### **Panel Border (Liquid Glass)**
            
            - **Color:**
                - `border: 2px solid rgba(168, 212, 255, 0.70)`
                - **HEX Preview:** `#A8D4FF` at 70% opacity
            - **Glow (Box-Shadow):**
                - `box-shadow: 0 0 16px 2px rgba(168, 212, 255, 0.18)`
                - **HEX Preview:** `#A8D4FF` at 18% opacity
            
            ---
            
            ### **Resize Handles**
            
            - **Normal:**
                - `background: rgba(168, 212, 255, 0.70)`
                - **HEX:** `#A8D4FF` at 70%
            - **On Hover:**
                - `background: rgba(127, 211, 255, 0.85)`
                - **HEX:** `#7FD3FF` at 85%
            
            ---
            
            ### **Quick Action Buttons (Add, Remove)**
            
            - **Default:**
                - `background: rgba(247, 250, 255, 0.80)`
                - `color: #0A2540` *(Dark blue for icon/text)*
            - **Hover/Active:**
                - `background: rgba(127, 211, 255, 0.32)`
                - **Glow:** `box-shadow: 0 0 6px 2px #7FD3FF55`
            
            ---
            
            ### **Editable Fields (Liquid Glass Input)**
            
            - **Field Background:**
                - `background: rgba(247, 250, 255, 0.72)`
                - **HEX:** `#F7FAFF` at 72%
            - **Focus State:**
                - `border: 2px solid #A8D4FF`
                - `box-shadow: 0 0 6px 2px #7FD3FF88`
            - **Label/Text:**
                - `color: #1C2E3B` *(Charcoal blue for clarity)*
            - **Unit Hint:**
                - `color: #6A89A6` *(Soft slate blue)*
            
            ---
            
            ### **Status Badges**
            
            - **Warning (Critical):**
                - `background: #F54C4C` *(red)*
                - `color: #FFF`
            - **Warning (Caution):**
                - `background: #F8B037` *(yellow/orange)*
                - `color: #191919`
            - **Warning (Info):**
                - `background: #46C6EF` *(blue)*
                - `color: #fff`
            - **Lock/Read-Only:**
                - `background: #E6EAF1`
                - `color: #8395B0`
            - **Tooltip/Info:**
                - `background: #1E365B`
                - `color: #FFFFFF`
                - *Shadow:* `box-shadow: 0 2px 8px 0 #1E365B33`
            
            ---
            
            ### **Panel Shadow/Outer Glow**
            
            - **General:**
                - `box-shadow: 0 4px 40px 0 rgba(127, 211, 255, 0.14)`
            
            ---
            
            ## **Quick Visual Reference Table**
            
            | Element | HEX/Alpha Example | Usage Example |
            | --- | --- | --- |
            | Frosted Glass | #F7FAFF / 55–72% | Panel, Fields |
            | Liquid Glass Border | #A8D4FF / 70% | Panel Border, Handles |
            | Resize Handle Hover | #7FD3FF / 85% | Handle on Hover |
            | Quick Action Button | #F7FAFF / 80% | Add, Remove, etc. |
            | Quick Action Hover | #7FD3FF / 32% | Button on Hover |
            | Field Label/Text | #1C2E3B | Labels, Values |
            | Field Unit Hint | #6A89A6 | CFM, FPM, etc. |
            | Warning Critical | #F54C4C | Velocity exceed |
            | Warning Caution | #F8B037 | Near-limit alert |
            | Warning Info | #46C6EF | Info badge |
            | Lock Indicator | #E6EAF1 / #8395B0 | Read-only field badge |
            | Info Tooltip | #1E365B / #FFFFFF | Standard ref/info |
            | Panel Shadow | #7FD3FF / 14% | Subtle glow/outer shadow |
    
    ---
    
    - **6. Model Summary Panel (Result & Warnings)**
        
        ---
        
        **1. Naming**
        
        - **Element Name:** Model Summary Panel
            
            *(Use “panel” for clarity, as it’s a movable, dockable UI surface rather than a bar or pop-up.)*
            
        - **Trigger/Button Name (in Status Bar):** Summary
        
        ---
        
        **2. Core Purpose**
        
        > Primary function:
        > 
        > 
        > Provide a unified, system-by-system summary of computational results, fan sizing and CFM requirements (per SMACNA/ASHRAE/UL/local code), and a real-time warning log, with report export/copy and quick navigation to errors.
        > 
        
        ---
        
        **3. Behavior & Interaction**
        
        ### **A. Launch/Visibility**
        
        - **Appears when user clicks the “Summary” button** in the status bar.
        - **Dock effect:** Slides in (docks) at the bottom of the viewport above the status bar, or floats as a movable, resizable panel if undocked.
        - **Panel is always-on-top**, but does **not overlap** the drawn model or any core workspace controls.
        - **Pin option:** User may pin the panel in place; if pinned, panel avoids overlapping important on-screen content (auto reposition if needed).
        
        ### **B. Dismissal**
        
        - Close via “X” button, `Esc` key, or clicking outside (if floating).
        - **Docked state:** Panel collapses down/out of viewport with smooth animation.
        
        ---
        
        ### **4. Layout & Content**
        
        ### **A. System Selector**
        
        - **Dropdown or segmented control** at panel top.
        - User can switch between results for:
            - Each unique duct “system” (branch, rooftop, single main run, etc.)
            - All systems combined (aggregate)
        - **Selection state** is visually prominent and sticky until changed.
        
        ### **B. Live Results Section**
        
        - **Fan Requirement** (computed by system):
            - Fan static pressure (in. W.C. / Pa)
            - Fan airflow (CFM / L/s)
            - Recommended fan model (if implemented, else leave out)
        - **CFM Requirement** per room (for all rooms in system)
        - **Total Duct Pressure Loss** (for current system)
        - **Length and Size Summary** (total length, average/main size)
        - **Copy Button:** Copies the visible results as a computation report (plain text, rich text, or CSV).
        
        ### **C. Warnings Section**
        
        - **Warnings Badge/Icon:**
            - Shows total count (live), color-coded:
                - **Critical:** Red/white
                - **Caution:** Yellow/white
                - **Info:** Neutral/grey/white
        - **Codes Referenced:**
            - Shows all standards in use (SMACNA, ASHRAE, UL, Local).
            - Each warning references the specific code/rule/section, and what triggered it.
            - Local codes: Displayed if user inputted; otherwise, omitted.
        - **Warning List:**
            - **Critical** first, then caution, then info.
            - Each warning is actionable: **Clicking a warning zooms to/highlights** affected duct in the drawing (jump-to-error).
            - Affected portions of the ductwork in the canvas **glow** (yellow for caution, red for critical) as long as warnings persist.
            - If all OK, shows a “Compliant” badge with code references.
        
        ### **D. Tips Icon**
        
        - **Small “Tips” icon** (lightbulb or “?”) at upper-right corner of panel.
            - Click opens a context-aware mini-window with usage tips or best practices (placement: floating above/beside the icon, not overlapping key results).
        
        ---
        
        ### **5. Panel Style & Accessibility**
        
        ### **A. Visual Design**
        
        - **All-white/neutral palette**:
            - Panel BG: `rgba(255,255,255,0.60)` (Frosted glass)
            - Borders/shadow: `rgba(255,255,255,0.80)`
            - Section headers: #2D2D2D or #222428
            - Warnings: Use white badge w/ colored text & subtle colored glow only for contrast
            - Copy Button: Subtle outline, hover raises with 6% more opacity
            - Tips Icon: Light outline, hover effect
        - **Panel shadow**: Soft white, never “pop” blue or orange.
        
        ### **B. Accessibility**
        
        - **Keyboard navigation:**
            - Tab between system selector, live results, copy button, warning list, tips icon.
            - All warnings/fields accessible by screen reader, with ARIA labels referencing codes.
            - Focus outline is visible but subtle (e.g., 2px #E5E5E5)
        - **Responsive/dockable:**
            - Panel shrinks on small screens, scrolls if needed.
        
        ---
        
        ### **6. Example Layout (Wireframe Block)**
        
        ```
╭───────────────────────────── Model Summary Panel ─────────────────────────────╮
        │ System: [ Rooftop 1 ▼ ]         [ Copy Report ]               [ Tips (i) ]   │
        │                                                                             │
        │  Fan Requirement:           3200 CFM   |   2.1 in. W.C.                     │
        │  Pressure Loss:             1.7 in. W.C.   |   Total Length: 128 ft         │
        │  Room CFM:                  Room 101 – 300, Room 102 – 450, ...             │
        │                                                                             │
        │  Warnings  [ 2 Critical | 1 Caution ]  [Show Codes: SMACNA 2021 §5-1, ... ] │
        │  ──────────────────────────────────────────────────────────────────────────  │
        │   [!] Velocity exceeds SMACNA Table 4-1 in branch (Duct B), jump-to-error    │
        │   [!] Pressure loss over 2 in. W.C. in Main Run, jump-to-error               │
        │   [⚠] CFM below room spec in Room 103, jump-to-error                         │
        │   [✓] Compliant with all referenced codes (if no warnings)                   │
        ╰──────────────────────────────────────────────────────────────────────────────╯
```
        
        ---
        
        ### **7. Rationale**
        
        - **Why this approach:**
            - Keeps all essential *model-level* results and compliance in one persistent place, without clutter or redundancy.
            - *System selector* supports real HVAC design workflow (multiple systems per project).
            - *Copy button* streamlines reporting/export.
            - *Warnings* map clearly to drawn elements, using real codes—improves traceability and compliance.
            - *Tips* icon provides just-in-time guidance, not cluttering the main results.
        
        ---
        
        ### **8. Interactivity Recap**
        
        - **Model Summary Panel** appears docked or floating on click, always above Status Bar.
        - **System selector** toggles between system results.
        - **Copy**: Instantly copies formatted computation results.
        - **Warnings**: Live, color-coded, jump-to-error in canvas, fully actionable.
        - **Tips**: Always available, never intrusive.
        - **Pin:** Keeps panel persistent if desired, but intelligently avoids overlap.
        - **Closes** with X, Esc, or click-away.
    
    ---
    
    - **7. Status Bar**
        
        # **Status Bar**
        
        ---
        
        ## **Overview**
        
        The **Status Bar** is a single-line, always-visible UI strip, docked at the absolute bottom of the Air Duct Sizer 3D Tool workspace.
        
        It serves as the command center for global actions, state, and quick reference—**never for navigation or tool switching**.
        
        **Key features:**
        
        - Minimal vertical height (≤40 px), never wraps or grows vertically
        - All elements strictly horizontally aligned; adjusts dynamically as elements expand/collapse
        - Maximum accessibility and professional clarity
        - All icons, controls, and states have descriptive ARIA labels and tooltips
        
        ---
        
        ## **Layout: Left to Right Order (Final)**
        
        ```
╭───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────╮
        │ [⏳▾ Version Control] [● Save Status] [● Connection] [◩ Grid Toggle] [⚠️ Warning Glow Toggle] [▤ Model Summary] [🔍 Search…] [Units ▼] │
        ╰───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────╯
```
        
        - **Single line**
        - **No stacking or wrapping, ever**
        - **Expanding elements shift siblings smoothly to avoid overlap**
        - **All controls ARIA-labeled, tooltipped, and tab-order consistent**
        - **Docked to the absolute bottom of the viewport**
        
        ---
        
        ## **Element-by-Element Specification**
        
        ---
        
        ### **1. Version Control**
        
        - **Expert Name:** Version Control
        - **Icon:** ⏳ with caret/flyout indicator (▾)
        - **Type:** Flyout/Popover panel (expands up or overlays upward above bar)
        - **Function:**
            - View version history (auto-save, manual saves, restore points)
            - Preview and restore previous states
        - **Behavior:**
            - Click opens version list (timestamps, labels, actions)
            - Only one flyout open at a time; keyboard navigable
        - **Tooltip:** “Version history: view and restore previous saves”
        - **Accessibility:** ARIA role=“menu/button”; labeled by icon and tooltip; full keyboard support
        - **Responsive Behavior:** Collapses to icon-only on narrow widths; always accessible by tabbing
        
        ---
        
        ### **2. Save Status**
        
        - **Expert Name:** Save Status
        - **Icon:** Animated dot ● (plus text, e.g. “All changes saved”)
        - **Type:** Status chip (passive for auto-save; active button if manual save)
        - **States:**
            - **Auto-Save:** “All changes saved ●” (green dot, pulsing if saving in progress)
            - **Manual Save:** “Save Now” (active, highlighted when unsaved changes)
        - **Tooltip:** “Auto-save enabled” or “Manual save—click to save now”
        - **Accessibility:** ARIA live region; full keyboard/reader support
        - **Responsive Behavior:** Text may collapse to just icon if bar contracts
        
        ---
        
        ### **3. Connection Status**
        
        - **Expert Name:** Connection Status
        - **Icon:** Single dot ●
        - **Colors:**
            - Online: #00C853 (Green)
            - Warning: #FF9100 (Orange)
            - Offline: #BDBDBD (Grey)
        - **Tooltip:** “Connection: Online / Warning / Offline”
        - **Accessibility:** ARIA role=“status”; screen reader announced on state change
        - **Responsive Behavior:** Always visible, shifts position if other elements expand
        
        ---
        
        ### **4. Grid Toggle**
        
        **A. Naming & Iconography**
        
        - **Expert Name:** Grid Toggle
        - **UI Label (ARIA/Tooltip):** “Toggle grid overlay”
        - **Icon:** Minimalist 3x3 square grid (Apple/Adobe/Figma style)
            - **Unicode fallback:** ◩ or SVG grid
        - **Placement:** Immediately right of Connection Status on status bar
        
        **B. UI States**
        
        - **On:**
            - Icon is filled (white fill, #222 border), subtle blue border or background glow (e.g., #90CAF9 at 25% opacity)
            - Tooltip: “Hide grid overlay”
        - **Off:**
            - Icon outlined only (no fill), normal border (#BDBDBD)
            - Tooltip: “Show grid overlay”
        
        **C. Behavior**
        
        - **Click:** Toggles overlay gridlines (aligned with 3D canvas plane, default grid spacing set in project or settings panel)
        - **State Persistence:** Remembers state for user/session (restores on reload)
        - **Animation:** Grid fades in/out (200 ms fade), icon animates subtle glow when toggled on
        - **Feedback:** ARIA live region announces “Grid overlay enabled/disabled”
        - **Tab Order:** Tab to select, space/enter toggles
        
        **D. Accessibility**
        
        - **ARIA role:** `role="switch" aria-checked="true|false"`
        - **Label:** “Toggle grid overlay”
        - **Keyboard:** Full tab/space/enter support
        
        **E. Rationale**
        
        - **Why:** Engineers and designers benefit from visual alignment aids when drawing ducts, equipment, or reference geometry.
        - **Minimal icon:** Recognized instantly in CAD/BIM/3D software.
        - **Never occludes content:** Grid is faint, always below drawn elements, color-contrasted for both light/dark canvas modes.
        
        **F. Visual Spec**
        
        - **Icon On:**
            - White squares (#FFFFFF) with faint blue border (#90CAF9)
            - 24×24 px, touch target 40×40 px
            - Blue glow or background fill for active
        - **Icon Off:**
            - No fill, border only (#BDBDBD)
        
        ---
        
        ### **5. Warning Highlight Toggle** *(“Warning Glow”)*
        
        **A. Naming & Iconography**
        
        - **Expert Name:** Warning Highlight Toggle
        - **UI Label (ARIA/Tooltip):** “Toggle warning glow”
        - **Icon:** Triangle warning icon (⚠️ or custom SVG with subtle drop shadow)
        - **Placement:** Right of Grid Toggle, before Model Summary
        
        **B. UI States**
        
        - **On:**
            - Icon glows yellow (#FFEB3B at 60% opacity), possibly animated pulse
            - Tooltip: “Highlight all ducts with warnings”
        - **Off:**
            - Icon outlined, no fill, standard border (#BDBDBD)
            - Tooltip: “Disable warning highlight”
        
        **C. Behavior**
        
        - **Click:**
            - **On:** All duct elements or nodes with active warnings glow with a colored outline/glow (red/yellow as appropriate for severity)
            - **Off:** No additional glow applied to ductwork, only base colors visible
        - **Live Feedback:**
            - As warnings resolve/appear, affected ducts animate their glow in/out (200 ms)
        - **Animation:** Subtle pulsing glow for critical (red), soft glow for caution (yellow)
        - **Persistence:** State retained for session; restores on reload
        - **Feedback:** ARIA region announces “Warning highlight enabled/disabled”
        - **Tab Order:** Tab/space/enter control
        
        **D. Accessibility**
        
        - **ARIA role:** `role="switch" aria-checked="true|false"`
        - **Label:** “Toggle warning highlight on ducts”
        - **Keyboard:** Tab/space/enter fully supported
        
        **E. Rationale**
        
        - **Why:** Instantly visualizes compliance/risk areas without opening Model Summary or popovers; reduces missed warnings.
        - **Best Practice:** Engineers expect direct error highlighting—this toggle streamlines QA/validation during rapid design/edits.
        
        **F. Visual Spec**
        
        - **Icon On:**
            - Triangle filled yellow (#FFEB3B), faint yellow glow or pulse around icon
            - 24×24 px, 40×40 px touch area
        - **Icon Off:**
            - Outlined triangle, no fill, grey border (#BDBDBD)
        - **Glow on Model:**
            - Ducts: Shadow/glow color matches warning (red for critical, yellow for caution), 4–8 px soft outer glow
            - Animation: 200 ms fade in/out, pulse for new critical warnings
        
        ---
        
        ### **6. Model Summary**
        
        - **Expert Name:** Model Summary
        - **Icon:** ▤ (dashboard/summary bars)
        - **Type:** Button (with active/focused state)
        - **Function:**
            - Opens Model Summary dock/panel (system metrics, warnings, code compliance)
            - Includes: Live results by system, selection for systems, copy button, warning summary, jump-to-error, tips, compliance sources (SMACNA, ASHRAE, UL, user inputted local codes)
            - Color-coded warning badges: Red (critical), Yellow (caution), Grey (info)
            - Panel appears above status bar, never blocks bar or main canvas
        - **Tooltip:** “Show model summary and compliance results”
        - **Accessibility:** ARIA role=“button”; labeled; keyboard and focusable
        - **Responsive Behavior:** Button shrinks to icon-only on smaller widths
        
        ---
        
        ### **7. Quick Search**
        
        - **Expert Name:** Quick Search
        - **Icon:** 🔍 (magnifying glass, pill-style input)
        - **Type:** Expanding input
        - **Function:**
            - Click or press `/` to expand for searching tips, help, or docs
            - Suggestions show live as user types
            - Results accessible with keyboard
        - **Tooltip:** “Search help, tips, and documentation”
        - **Accessibility:** ARIA role=“search”; live region; keyboard navigation; tab order
        - **Responsive Behavior:** Collapses to icon on bar width reduction, but expands smoothly when used; all elements slide to accommodate
        
        ---
        
        ### **8. Units Selector**
        
        - **Expert Name:** Units Selector
        - **Icon:** Dropdown with label (“Imperial ▼” or “SI ▼”); ruler icon optional
        - **Type:** Dropdown menu
        - **Function:**
            - Click to switch global units (Imperial/SI/custom)
            - Updates all tool fields and results instantly
        - **Tooltip:** “Change units: Imperial, SI, …”
        - **Accessibility:** ARIA role=“combobox”; keyboard navigable
        - **Responsive Behavior:** Text may shorten to icon or initials (“in”, “mm”) as bar narrows
        
        ---
        
        ## **Dynamic Behavior & Responsiveness**
        
        - **Single-line guarantee:** All elements scale, contract, or show only icons as needed, but **never stack or wrap.**
        - **Expanding elements (e.g., Search, Model Summary):**
            - When expanded, adjacent controls shift smoothly to accommodate width change (with minimum/maximum bounds to prevent overlap).
            - If multiple elements are expanded, priority order is maintained (core state controls always visible).
        - **Consistent tab order and ARIA live region announcements**
        - **Panel/flyouts always open above bar, never occlude bar or main canvas**
        
        ---
        
        ## **Visual Design & Color**
        
        - **Background:** White (#FFFFFF) with 92% opacity (frosted glass blur effect)
        - **Border:** Subtle “liquid glass” (#E0E0E0, 18% opacity)
        - **Text & Icons:** Charcoal (#222222) for highest contrast
        - **Active/Focus States:**
            - Slightly increased border/blur on hover/focus
            - Model Summary shows a faint accent glow when open
            - Quick Search expands with gentle animation
        - **Color cues for status:**
            - Connection: Green / Orange / Grey
            - Save: Green (saved), Orange (saving), Red (error)
            - Warnings: As above (Red/Yellow/Grey)
        
        ---
        
        ## **Accessibility**
        
        - **Keyboard:**
            - All controls accessible and focusable in tab order left ➔ right
            - Quick Search can be focused with `/`
            - Dropdowns navigable via arrows/enter
        - **Screen Readers:**
            - Descriptive ARIA labels on all elements
            - State changes announced live (e.g., connection change, save status)
        - **Tooltips:**
            - On hover/focus, descriptive tooltips for every element
        
        ---
        
        ## **Rationale & Best Practice Alignment**
        
        - **Professional conventions:**
            - Single-line status bar mirrors Figma, Adobe, macOS, CAD suites for engineering clarity
            - Left-to-right priority: file/actions → save/state → output/metrics → search → units
        - **No navigation, drawing, or view controls**: Only workspace state and context actions.
        - **No notification center unless future need arises**
        - **Dynamic expansion:** Elements adjust seamlessly—never covering or wrapping the bar.
        
        ---
        
        **This documentation is the authoritative reference for the Status Bar in the Air Duct Sizer 3D Tool, meeting all requirements for professional-grade, high-performance engineering applications.**
        
    
    ---
    
    - **8. View Cube**
        
        # **Air Duct Sizer 3D Tool — View Cube Specification (Final)**
        
        ---
        
        ## **1. Naming**
        
        - **Element Name:** View Cube
        - **Expert Rationale:**
            
            The term "View Cube" is universally recognized in 3D CAD, BIM, and design tools (e.g., Autodesk, SketchUp, Revit) as a standard for orientation control, maximizing clarity for engineers and advanced users.
            
        
        ---
        
        ## **2. Placement**
        
        - **Location:**
            
            **Top-right corner** of the 3D workspace canvas.
            
            - Always overlays the 3D canvas (not docked to any panel).
            - Floating margin (suggested: 24 px from top/right edge).
            - Never overlaps persistent UI panels (context panels, status bar).
        
        ---
        
        ## **3. Appearance & Design**
        
        - **Form:**
            - 3D cube (or, optionally, rounded cuboid) with labeled faces.
            - Size: 56 × 56 px (standard; scalable for accessibility).
        - **Face Labels:**
            - “Top”, “Front”, “Right”, “Left”, “Back”, “Bottom” (at least Top/Front/Right always visible)
            - Isometric edge or corner visually emphasized.
        - **Color:**
            - **Faces:** Light glassy white (#F9FAFB, 90% opacity) with subtle shadow
            - **Labels:** Deep grey (#222222), bold, always visible on all backgrounds
            - **Outline:** Liquid glass border (#E0E0E0, 25% opacity)
        - **Opacity:**
            - **Default:** 50%
            - **On hover/focus:** 100%
            - **On drag/interaction:** 100%
        - **Interaction Cursor:**
            - Default: pointer/hand
            - On hover: faces highlight with faint color (e.g., #FF9800 for current, #90CAF9 for hover)
        
        ---
        
        ## **4. Behavior & Functionality**
        
        - **Action:**
            - **Clicking a face:** Instantly rotates the camera/view to the respective orthogonal view (Top, Front, Right, etc.)
            - **Clicking an edge/corner:** Rotates to nearest isometric/perspective view
        - **Animated Feedback:**
            - Smooth 3D animation rotates the model and the View Cube in sync (≤300 ms, matches CAD standards)
        - **Focus:**
            - Cube remains above main canvas and 3D content at all times.
            - Never blocks interaction with selected objects or UI overlays (z-order is above 3D, below modal panels).
        - **Responsiveness:**
            - Scales for high DPI, tablets, touchscreens (minimum 44×44 px tap target)
        
        ---
        
        ## **5. Accessibility**
        
        - **Keyboard:**
            - Tab-to-focus enabled (focus ring appears around cube)
            - Arrows to move selection (cycles faces/edges)
            - Enter/Space applies view change
        - **ARIA:**
            - role=“toolbar”, labels for each face (“Set view: Top”, etc.)
            - Announce current view on change (“View set to: Right”)
        - **Contrast:**
            - Face label contrast ≥4.5:1 on all backgrounds
        - **Tooltip:**
            - On hover/focus, tooltips such as: “Click to set view: Top”
        
        ---
        
        ## **6. Rationale**
        
        - **Instant spatial context:** Engineers need to orient models quickly, especially when troubleshooting or aligning ductwork.
        - **Universal UI convention:** Mirrors industry leaders (Autodesk, BricsCAD, Fusion 360) for zero learning curve.
        - **Unobtrusive:** Default semi-transparent style ensures cube never obscures workspace or content, but is always available.
        - **Keyboard/touch:** Accessible for all users and devices, including mouse, touch, and keyboard workflows.
        
        ---
        
        ## **7. Example Wireframe (ASCII)**
        
        ```
┌───────────────────────────── Air Duct Sizer 3D Canvas ─────────────────────────────┐
           │                                                                                   │
           │                                                      ┌───────┐                    │
           │                                                      │ Top   │  ◀── View Cube     │
           │                                                      │  ┌─┐  │                    │
           │                                                      │ F │R│ │                    │
           │                                                      └─┘─┘─┘                    │
           │                                                                                   │
           └───────────────────────────────────────────────────────────────────────────────────┘
```
        
        - **Top-right corner, floats above 3D canvas**
        - **Faces clearly labeled and visible**
        
        ---
        
        ## **Color Codes**
        
        - **Face Background:** #F9FAFB, 90% opacity (rgba(249,250,251,0.9))
        - **Face Label/Text:** #222222
        - **Active Face Hover:** #FF9800 (Orange, only subtle)
        - **Cube Outline:** #E0E0E0, 25% opacity (rgba(224,224,224,0.25))
        
        ---
        
        ## **Exclusions**
        
        - **Never docked to panel or moved by user**
        - **No custom view labels (unless user can configure)**
        - **No animation > 300 ms**
        
        ---
        
        ## **Summary Table**
        
        | Property | Value |
        | --- | --- |
        | Name | View Cube |
        | Placement | Top-right 3D canvas (floating, never blocked) |
        | Size | 56×56 px (scalable, min 44×44 px for touch) |
        | Faces | Top, Front, Right, (others as needed) |
        | Opacity | 50% default, 100% hover/active |
        | Labels | #222222 (deep grey) |
        | Face BG | #F9FAFB (white glass), 90% opacity |
        | Border | #E0E0E0, 25% opacity |
        | Accessibility | Keyboard, ARIA, tooltips |
    
    ---
    
    - **Interaction Workflow**
        - **Draw Phase:**
            - Toggle Pencil ON → draw stick lines (left-click); right-click to pan at any time
        - **Build Phase:**
            - Click *Build Ductwork* (on Results & Warnings Bar) → generates 3D ducts
            - Any issues appear immediately in the bar and warnings overlay
        - **Edit/Inspect:**
            - Select duct/fitting → pop-up for properties
        - **Export/Status:**
            - All file actions, calibration, and help accessed via Status Bar (bottom)
            - System notifications and health always visible
    
    ---
    
- **Drawing Elements**
    - **Element definitions:** Ducts, Fittings, Equipment, Rooms
    - **Full canonical list of supported Fittings (with expansion placeholder)**
    - **How drawn lines behave (centerlines, snapping, editing, states)**
    - **Interaction/UX conventions**
    
    ---
    
    # **Drawing Elements Specification — Air Duct Sizer 3D Tool**
    
    ---
    
    ## **1. Element Definitions & Roles**
    
    ### **A. Duct**
    
    - **Type:** Linear segment (stick/centerline before extrusion)
    - **Purpose:** Represents the main airflow path; becomes a 3D duct upon conversion.
    - **Behavior:** Always starts/ends at a node; can be straight or multi-segmented (not freeform curves for this MVP).
    
    ### **B. Fittings**
    
    - **Type:** Junction or directional change component
    - **Purpose:** Connects duct segments, allows transitions, splits, or directional changes.
    - **Behavior:** Auto-inserted at geometry nodes (e.g., intersection, angle) OR user-selected for manual override.
    
    ### **Canonical Fittings List (MVP)**
    
    *(All auto-named on insertion; user can rename/edit properties after generation)*
    
    | Category | Fitting Type | Typical Insertion Trigger | Properties Editable? |
    | --- | --- | --- | --- |
    | Directional Change | Elbow (90°, 45°) | Angle between segments | Yes |
    | Junction | Tee | 3-way intersection | Yes |
    | Junction | Cross | 4-way intersection | Yes |
    | Transition | Reducer/Enlarger | Change in duct size | Yes |
    | Transition | Offset | Two parallel ducts offset | Yes |
    | Control | Damper | Inserted at user-selected segment | Yes |
    | Terminal | End Cap | Segment ends (not open to a room) | Yes |
    | Specialty | Access Door | User-inserted only | Yes |
    | Adapter | Round-to-Rect | At transition between shapes | Yes |
    | Adapter | Rect-to-Round | At transition between shapes | Yes |
    
    **(Future/Pro: Lateral, Saddle Tap, Wye, Spin-In, Volume Box, etc.)**
    
    ---
    
    ### **C. Equipment**
    
    - **Type:** Discrete device node
    - **Purpose:** HVAC device at duct ends/midpoints (e.g., fans, air handlers, diffusers)
    - **Behavior:** User-placed; connects to duct segments; has properties (CFM, static pressure, etc.)
    
    | Equipment Type | Placement | Key Properties (MVP) |
    | --- | --- | --- |
    | Supply Fan | Duct start/end | CFM, static pressure |
    | Return Fan | Duct start/end | CFM, static pressure |
    | Air Handling Unit | In-line, branch | CFM, ESP, filter type |
    | Diffuser | Duct terminal | CFM, noise criteria |
    | VAV Box | In-line/terminal | CFM, setpoint |
    | Exhaust Fan | Duct end | CFM, static pressure |
    
    *(Future: Reheat Coil, HEPA Filter, Fire/Smoke Damper, etc.)*
    
    ---
    
    ### **D. Room**
    
    - **Type:** Polygon or box region (represented as “room” node or polygon)
    - **Purpose:** Represents zone or space with airflow requirement
    - **Behavior:** Snap to duct terminal OR as named polygon; displays required/actual CFM.
    
    | Room Property | Type | Usage |
    | --- | --- | --- |
    | Room Name | Text | User- or auto-assigned |
    | Room Area | Number | For future load calcs |
    | Required CFM | Number | Based on code/ASHRAE table |
    | Supplied CFM | Number | Calculated, always shown |
    
    ---
    
    ## **2. Drawing & Behavior of Lines (Centerlines)**
    
    ### **A. Creation**
    
    - **Trigger:** Pencil Tool ON (FAB)
    - **Interaction:**
        - **Left-click:** Place node (start or continue line)
        - **Double-click:** End current line/segment
        - **Snap:** Lines snap to grid, existing nodes, or equipment/room
        - **Shift key:** Constrains angle to 0/45/90° for orthogonal/diagonal lines
        - **Right-click:** Pan, even while drawing
    
    ### **B. Behavior and States**
    
    - **Visual State:**
        - **Active Drawing:** Line is orange (#FF9800), semi-opaque as it’s being drawn
        - **Completed (Unselected):** Neutral grey (#BDBDBD), 100% opacity
        - **Selected:** Blue highlight (#1976D2) plus nodes/handles visible
        - **Warning/Invalid:** Red or yellow glow if velocity/pressure limit exceeded (matches warnings bar/panel)
    - **Node Types:**
        - **Standard Node:** White fill, blue border (when selected)
        - **Fitting Node:** Special shape/icon (circle for elbows, tee, etc.)
        - **Equipment Node:** Device icon at node
    - **Editing:**
        - **Select:** Click on line or node (Pencil OFF)
        - **Move:** Drag node (drags connected segments)
        - **Add Node:** Click on line to add mid-node
        - **Delete Segment/Node:** Select, then press `Del` or context action
        - **Properties:** Select → edit in Context Property Panel
    - **Snap & Constraint:**
        - **Snap-to-grid**: If grid enabled, cursor snaps to grid intersections
        - **Smart Snap:** Auto-aligns to other nearby lines or endpoints
        - **Connection Rules:** No “floating” lines—all lines must start/end at room, equipment, or another duct node (warn if not connected)
    
    ### **C. Converting to 3D**
    
    - **Action:** “Build Ductwork” button in Results/Warnings Bar or Calculation Bar
    - **Effect:** All centerlines are extruded into 3D duct/fitting geometry using default/user-set properties
    - **Fittings:** Auto-inserted at each relevant node
    - **Validation:** Warns if open/unconnected lines, overlaps, code violations
    
    ---
    
    ## **3. Element Metadata & Properties**
    
    - **Duct:**
        - Name/Tag (auto/incremental, e.g., D-101)
        - Size (W x H or Dia)
        - Material (steel, aluminum, etc.)
        - Insulation (Y/N, thickness)
        - Static pressure loss (auto-calc)
        - Flow rate (auto-calc or assigned)
    - **Fitting:**
        - Type/subtype
        - Connected ducts (names)
        - Loss coefficient (K-factor, auto from table)
    - **Equipment:**
        - Name/Tag
        - Device type
        - Design/required CFM, actual CFM
        - Status/notes
    - **Room:**
        - Name
        - Area
        - Required CFM
        - Actual supplied CFM
        - Code reference (for compliance)
    
    ---
    
    ## **4. Accessibility & Usability**
    
    - **All drawing/editing features are keyboard-accessible:**
        - Tab to cycle elements
        - Arrow keys to move selected node/segment
        - Enter to edit properties
    - **Visual states have high contrast**
    - **Tooltips and ARIA labels** for all controls and drawn elements
    
    ---
    
    ## **5. Professional Rationale**
    
    - **Mimics professional CAD/BIM drawing but optimized for duct systems**
    - **Granular element filter** (see prior doc) ensures efficient workflows and error prevention
    - **Auto-insertion and smart snapping** support both rapid design and code compliance
    
    ---
    
    ## **6. Example Visual Guide**
    
    ```
[Room A]—(Duct)—[Elbow]—(Duct)—[Tee]—(Duct)—[Fan]
               │
            (Branch)
             [Room B]
```
    
    - Blue: selected, Orange: drawing, Red/yellow: warning, Grey: normal
    
    ---
    
    **This documentation is the canonical specification for all Drawing Elements, fitting types, and centerline behaviors in the Air Duct Sizer 3D Tool MVP. All drawing behaviors, editing options, and fitting/equipment metadata are covered for engineering-grade implementation and team handoff.**
    
    Let me know if you want visuals or a rendered element sample!
    
- **Drawing Elements Filter Panel**
    
    # **Drawing Elements Filter Panel — Hierarchical Specification**
    
    ---
    
    ## **Purpose**
    
    The Drawing Elements Filter Panel enables users to **filter and target specific element types** for selection and editing in the 3D workspace, supporting both high-level categories and granular item selection.
    
    This prevents accidental modifications, accelerates batch actions, and mirrors industry-standard engineering workflows.
    
    ---
    
    ## **Naming**
    
    - **Canonical Name:** Drawing Elements Filter Panel
    - **UI Label (ARIA):** “Drawing Elements Filter”
    - **Retracted Icon:** Filter/Funnel (Material “filter_list”)
    - **Expanded Header:** “Drawing Elements” + icon
    
    ---
    
    ## **Placement**
    
    - **Vertical Anchor:** Directly below the Drawing Tool FAB, right edge of canvas.
    - **Spacing:** 8–16px below FAB, always visible when collapsed (icon only).
    
    ---
    
    ## **States & Interactivity**
    
    ### **A. Retracted State**
    
    - **Icon Only:** Circular filter icon (~44x44px), frosted glass, subtle shadow.
    - **Tooltip:** “Filter selectable element types”
    - **Keyboard/Pointer activation:** Expands panel.
    
    ### **B. Expanded State**
    
    - **Panel appears leftward/downward** from icon anchor (180ms animation).
    - **Header:** “Drawing Elements” (bold, 16px) + filter icon.
    - **Main Category Checkboxes:** (all checked by default)
        - [✔] **Duct**
        - [✔] **Fitting**
        - [✔] **Equipment**
        - [✔] **Room**
    - **Expand/Collapse Arrows:** Each category can be expanded (▸/▾) to show a detailed list:
        - **Duct:** Sub-types (e.g., Main Duct, Branch Duct, Return Duct, etc.)
        - **Fitting:** (e.g., Elbow, Tee, Reducer, Damper…)
        - **Equipment:** (e.g., Fan, AHU, Diffuser…)
        - **Room:** (e.g., Room 101, Lab A, Office 2.1… auto-populated from project data)
    - **Sub-list checkboxes:** Each item can be individually checked/unchecked.
    - **Reset All:** Link at the bottom to re-check all.
    - **State Persistence:** Remembers per project/session.
    - **Collapse triggers:** Click-away, Esc key, keyboard navigation.
    
    ---
    
    ## **Accessibility**
    
    - **ARIA structure:**
        - Panel: `role="region"` labeled “Drawing Elements Filter”
        - Main checkboxes: `role="checkbox"`, labeled with category and state
        - Expand/collapse: `aria-expanded`, full keyboard support
        - Each sub-item: labeled with name/type
    - **Tab, arrows:** For moving between controls; Space/Enter to toggle.
    - **Panel close:** Esc key returns focus to filter icon.
    
    ---
    
    ## **Visual & Style Guide**
    
    | Element | Style / Color |
    | --- | --- |
    | Panel Background | Frosted white (#FFFFFFEE), rounded 16px corners |
    | Border | Liquid glass #E0E0E0, 18% opacity, 1px |
    | Header Text/Icon | Charcoal #222222, filter icon #B0BEC5 |
    | Checkbox (on) | Blue #1565C0, white check, blue border |
    | Checkbox (off) | Grey #B0BEC5 outline |
    | Expand/Collapse | Arrow #1976D2, rotates 90° when expanded |
    | Sub-item | Indented, lighter text (#424242), hover blue |
    | Reset Link | Blue #1976D2, underlined on hover |
    
    ---
    
    ## **Responsiveness**
    
    - **Panel always stays within viewport.**
    - **Expands vertically up to 320px, scrollable if too many sub-items.**
    - **Remembers last expanded/collapsed state per session.**
    
    ---
    
    ## **Behavior Example**
    
    1. **Panel retracted:** Just a filter icon below FAB.
    2. **User clicks icon:** Panel expands, showing all four main checkboxes.
    3. **User clicks arrow beside “Room”:** Expands to show all room names, each with a checkbox.
    4. **User unchecks “Lab A”:** This room becomes unselectable in 3D canvas.
    5. **User clicks Reset:** All main and sub-items are checked again.
    6. **Panel collapses:** State is saved.
    
    ---
    
    ## **UX Rationale**
    
    - **Granular control**: Allows selection/filtering at both type and instance level.
    - **Error prevention**: Prevents accidental edits to the wrong system or room.
    - **Professional alignment**: Mimics layer/visibility/selection filters in CAD/BIM.
    
    ---
    
    ## **Authoritative Summary**
    
    > The Drawing Elements Filter Panel is a right-anchored, retractable utility below the Drawing Tool FAB.
    > 
    > 
    > It allows users to filter and select by main element type (Duct, Fitting, Equipment, Room) and, via expandable lists, by individual item.
    > 
    > All states, labels, and focus behaviors are fully accessible and persist per session.
    > 
    > The design follows best-in-class engineering UI patterns for both speed and precision.
    > 
    
    ---
    
- **PDF Import Feature**
    - [ ]  Tool must enable pdf import for front view and plan view
    - [ ]  Tool must have a PDF import layout wizard capable of pop-up
        - [ ]  Wizard must have scaling input field - Canvas scale must follow the user’s input and reflect to the scaling field in the tool screen.
        - Codes for pop-up hover screen
            - morphing-popover
                
                ```tsx
'use client';
                
                import {
                  useState,
                  useId,
                  useRef,
                  useEffect,
                  createContext,
                  useContext,
                  isValidElement,
                } from 'react';
                import {
                  AnimatePresence,
                  MotionConfig,
                  motion,
                  Transition,
                  Variants,
                } from 'motion/react';
                import { useClickOutside } from '@/hooks/use-click-outside';
                import { cn } from '@/lib/utils';
                
                const TRANSITION = {
                  type: 'spring',
                  bounce: 0.1,
                  duration: 0.4,
                };
                
                type MorphingPopoverContextValue = {
                  isOpen: boolean;
                  open: () => void;
                  close: () => void;
                  uniqueId: string;
                  variants?: Variants;
                };
                
                const MorphingPopoverContext =
                  createContext<MorphingPopoverContextValue | null>(null);
                
                function usePopoverLogic({
                  defaultOpen = false,
                  open: controlledOpen,
                  onOpenChange,
                }: {
                  defaultOpen?: boolean;
                  open?: boolean;
                  onOpenChange?: (open: boolean) => void;
                } = {}) {
                  const uniqueId = useId();
                  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
                
                  const isOpen = controlledOpen ?? uncontrolledOpen;
                
                  const open = () => {
                    if (controlledOpen === undefined) {
                      setUncontrolledOpen(true);
                    }
                    onOpenChange?.(true);
                  };
                
                  const close = () => {
                    if (controlledOpen === undefined) {
                      setUncontrolledOpen(false);
                    }
                    onOpenChange?.(false);
                  };
                
                  return { isOpen, open, close, uniqueId };
                }
                
                export type MorphingPopoverProps = {
                  children: React.ReactNode;
                  transition?: Transition;
                  defaultOpen?: boolean;
                  open?: boolean;
                  onOpenChange?: (open: boolean) => void;
                  variants?: Variants;
                  className?: string;
                } & React.ComponentProps<'div'>;
                
                function MorphingPopover({
                  children,
                  transition = TRANSITION,
                  defaultOpen,
                  open,
                  onOpenChange,
                  variants,
                  className,
                  ...props
                }: MorphingPopoverProps) {
                  const popoverLogic = usePopoverLogic({ defaultOpen, open, onOpenChange });
                
                  return (
                    <MorphingPopoverContext.Provider value={{ ...popoverLogic, variants }}>
                      <MotionConfig transition={transition}>
                        <div
                          className={cn('relative flex items-center justify-center', className)}
                          key={popoverLogic.uniqueId}
                          {...props}
                        >
                          {children}
                        </div>
                      </MotionConfig>
                    </MorphingPopoverContext.Provider>
                  );
                }
                
                export type MorphingPopoverTriggerProps = {
                  asChild?: boolean;
                  children: React.ReactNode;
                  className?: string;
                } & React.ComponentProps<typeof motion.button>;
                
                function MorphingPopoverTrigger({
                  children,
                  className,
                  asChild = false,
                  ...props
                }: MorphingPopoverTriggerProps) {
                  const context = useContext(MorphingPopoverContext);
                  if (!context) {
                    throw new Error(
                      'MorphingPopoverTrigger must be used within MorphingPopover'
                    );
                  }
                
                  if (asChild && isValidElement(children)) {
                    const MotionComponent = motion.create(
                      children.type as React.ForwardRefExoticComponent<any>
                    );
                    const childProps = children.props as Record<string, unknown>;
                
                    return (
                      <MotionComponent
                        {...childProps}
                        onClick={context.open}
                        layoutId={`popover-trigger-${context.uniqueId}`}
                        className={childProps.className}
                        key={context.uniqueId}
                        aria-expanded={context.isOpen}
                        aria-controls={`popover-content-${context.uniqueId}`}
                      />
                    );
                  }
                
                  return (
                    <motion.div
                      key={context.uniqueId}
                      layoutId={`popover-trigger-${context.uniqueId}`}
                      onClick={context.open}
                    >
                      <motion.button
                        {...props}
                        layoutId={`popover-label-${context.uniqueId}`}
                        key={context.uniqueId}
                        className={className}
                        aria-expanded={context.isOpen}
                        aria-controls={`popover-content-${context.uniqueId}`}
                      >
                        {children}
                      </motion.button>
                    </motion.div>
                  );
                }
                
                export type MorphingPopoverContentProps = {
                  children: React.ReactNode;
                  className?: string;
                } & React.ComponentProps<typeof motion.div>;
                
                function MorphingPopoverContent({
                  children,
                  className,
                  ...props
                }: MorphingPopoverContentProps) {
                  const context = useContext(MorphingPopoverContext);
                  if (!context)
                    throw new Error(
                      'MorphingPopoverContent must be used within MorphingPopover'
                    );
                
                  const ref = useRef<HTMLDivElement>(null);
                  useClickOutside(ref, context.close);
                
                  useEffect(() => {
                    if (!context.isOpen) return;
                
                    const handleKeyDown = (event: KeyboardEvent) => {
                      if (event.key === 'Escape') context.close();
                    };
                
                    document.addEventListener('keydown', handleKeyDown);
                    return () => document.removeEventListener('keydown', handleKeyDown);
                  }, [context.isOpen, context.close]);
                
                  return (
                    <AnimatePresence>
                      {context.isOpen && (
                        <>
                          <motion.div
                            {...props}
                            ref={ref}
                            layoutId={`popover-trigger-${context.uniqueId}`}
                            key={context.uniqueId}
                            id={`popover-content-${context.uniqueId}`}
                            role='dialog'
                            aria-modal='true'
                            className={cn(
                              'absolute overflow-hidden rounded-md border border-zinc-950/10 bg-white p-2 text-zinc-950 shadow-md dark:border-zinc-50/10 dark:bg-zinc-700 dark:text-zinc-50',
                              className
                            )}
                            initial='initial'
                            animate='animate'
                            exit='exit'
                            variants={context.variants}
                          >
                            {children}
                          </motion.div>
                        </>
                      )}
                    </AnimatePresence>
                  );
                }
                
                export { MorphingPopover, MorphingPopoverTrigger, MorphingPopoverContent };
```
                
            - use-click-outside
                
                ```tsx
import { RefObject, useEffect } from 'react'
                
                type Handler = (event: MouseEvent | TouchEvent) => void
                
                export function useClickOutside<T extends HTMLElement = HTMLElement>(
                  ref: RefObject<T>,
                  handler: Handler,
                  mouseEvent: 'mousedown' | 'mouseup' = 'mousedown'
                ): void {
                  useEffect(() => {
                    const listener = (event: MouseEvent | TouchEvent) => {
                      const el = ref?.current
                      const target = event.target
                
                      // Do nothing if clicking ref's element or descendent elements
                      if (!el || !target || el.contains(target as Node)) {
                        return
                      }
                
                      handler(event)
                    }
                
                    document.addEventListener(mouseEvent, listener)
                    document.addEventListener('touchstart', listener)
                
                    return () => {
                      document.removeEventListener(mouseEvent, listener)
                      document.removeEventListener('touchstart', listener)
                    }
                  }, [ref, handler, mouseEvent])
                }
```
                
    - [ ]  PDF import layout wizard to be placed at the bottom of the screen
- **Canvas Feature**
    - [ ]  Air Duct Sizer tool must have a 3D Canvas

### Handling Bug Reports from User

- [ ]  Report Bug

### Security

Make sure there will be no security leaks

Private credentials must be protected# SizeWise Task V1 (Computer/Desktop/Laptop/Tablet)

Status: Not started

### Testing

- [ ]  Must have a production ready deployment with admin access;
- [ ]  Must have a production ready deployment with user access only;

### Global UI

- Background
    - [ ]  Dark Mode - Black
    - [ ]  Light Mode - White
    - [ ]  System - Dark/Light Mode
- Navigation Structure
    
    # **SizeWise Suite – Centered Top Navigation (No Sidebar, Minimalist, Desktop-First)**
    
    ---
    
    ## **UI Designer Notes & Rationale**
    
    - **Centered Top Bar Navigation**
        - The main navigation bar is centered at the top of the screen and always visible on all desktop/tablet/iPad layouts.
        - All primary workflow items—including Home, File, Projects, Tools, and Profile—are aligned horizontally, with equal visual weight and dropdown submenus for each.
        - The **Profile menu** is inline with other top nav items (not isolated at the top-right) and uses a user icon or avatar; its dropdown includes Profile & Account, Settings, Reports & Exports, Administrative Access (if user is admin), and all relevant personal/user settings.
        - No top-right “island”—all navigation is unified and centered for symmetry and easy scanning.
    - **No Sidebar, No Mobile/Responsive Navigation**
        - The UI is designed strictly for desktop, laptop, and tablet/iPad; there is no sidebar or bottom/hamburger nav.
        - All navigation, quick access, and context switching are handled through the top bar and its dropdowns/popovers.
    - **Bottom-Right Corner (Persistent)**
        - A rectangular button for **Chat & Notifications** sits above a round “?” Help & Docs button.
        - **Chat & Notifications**: Clicking opens a compact modal with tabs for Team Chat, Support, and Notifications (Updates, Alerts); the modal can be expanded/maximized.
        - **Help & Docs**: A persistent question-mark button at the bottom right corner opens a pop-up help/docs window, which can also be maximized from the same position.
    - **Clarity, Discoverability, and Focus**
        - No clutter, redundancy, or visual confusion. All major workflows and user/account features are immediately accessible, with the Profile menu inline for clarity.
        - Quick actions, recent files, and settings are logically grouped in dropdowns.
        - Support, documentation, and team communication tools are always available—never hidden or multiple clicks away.
        - The entire layout is optimized for professionals working on larger screens who expect everything to be quickly accessible and discoverable without mobile-specific patterns.
    
    ---
    
    ## **Navigation Layout Mockup**
    
    ```
    plaintext
    CopyEdit
    ┌─────────────────────────────────────────────────────────────────────────────┐
    │          LOGO     |  Home  |  File  |  Projects  |  Tools  |  Profile  |    │
    └─────────────────────────────────────────────────────────────────────────────┘
    
    [Profile Menu Dropdown]
        - Profile & Account
            - Password/Security
            - Connected Accounts
            - API/Integrations
        - Settings
            - Language
            - Units (Imperial/SI)
            - Theme
        - Reports & Exports
            - My Exports (History)
            - Export Formats (PDF, Excel, CAD, etc.)
            - Batch Export
        - Administrative Access (admin only)
            - User Management
            - Team Permissions
            - Audit Logs
            - Company Profile
            - Billing & Subscription
            - Cloud Sync Settings
        - Logout
    
    [Bottom Right Corner]
        [⬛]
        ┌───────────────────┐
        │  🔔 Notifications │
        │  💬 Chat         │
        └───────────────────┘
    
        [❓]
        ┌───────────────────────────┐
        │  Help & Documentation     │
        │  (with maximize button)   │
        └───────────────────────────┘
    
    ```
    
    ## **Detailed Navigation Content (for Dev/UI Handoff)**
    
    ```markdown
    markdown
    CopyEdit
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
    - Profile
        - Profile & Account
            - Password/Security
            - Connected Accounts
            - API/Integrations
        - Settings
            - Language
            - Global Units (Imperial/SI)
            - Theme
        - Reports & Exports
            - My Exports (History)
            - Export Formats (PDF, Excel, CAD, etc.)
            - Batch Export
        - Administrative Access (admin only)
            - User Management
            - Team Permissions
            - Audit Logs
            - Company Profile
            - Billing & Subscription
            - Cloud Sync Settings
        - Logout
    
    [Bottom Right Corner]
        - [Rectangular Button: Notifications & Chat]
    	    - Opens help/documentation pop-up, with maximize option.
            - 🔔 Notifications (tab)
                - Updates & Release Notes
                - Support Replies
                - Standards/Compliance Alerts
            - 💬 Chat (tab)
                - Team Chat
                - Announcements (admin-broadcast)
                - Support
        - [❓ Help & Docs Button]
    	    - Opens help/documentation pop-up, with maximize option.
    
    ```
    
    ---
    
    ## **Summary Rationale for Designer/Dev Handoff**
    
    - **No sidebar**: Reduces cognitive clutter, maximizes workspace, and matches your vision for a desktop-class tool.
    - **Top bar is always centered**, minimal, and clear.
    - **Profile menu**: All personal, admin, and export/reporting controls unified here.
    - **Help/Docs**: Persistent, bottom-right, out of the way but always accessible, pop-up with maximize.
    - **Chat/Notifications**: Grouped above Help, in a compact, easily reached rectangle.
    - **No command palette or mobile nav** for now.
    - **All admin functions** are discoverable but secured within Profile.
- Dashboard
    
    # **SizeWise Suite Dashboard – Minimalist Layout (v1, Context-Aware)**
    
    ---
    
    ## **UI Designer & Developer Rationale**
    
    ### **Key Principles**
    
    - **Maximal focus:** Only show controls, actions, and info relevant to the current user context.
    - **Clean workspace:** No persistent messages or help buttons except on the dashboard (never on tool or detail screens).
    - **Modern B2B UX:** Aligns with pro-grade engineering/SaaS standards (Linear, Vercel, Notion).
    - **Scalable & future-proof:** Layout accommodates future expansion (KPI/stats, team modules) without redesign.
    
    ---
    
    ### **1. Top Bar (Centered Navigation)**
    
    - Centered, horizontal navigation with dropdowns:
        - **Home** (Dashboard)
        - **File**
        - **Projects**
        - **Tools**
        - **Profile** (with Settings, Reports/Exports, Admin—if user is admin)
    
    ---
    
    ### **2. Dashboard Content Sections**
    
    **A. Top Section – Quick Actions**
    
    - Horizontally aligned buttons:
        - Start New Project
        - Start New Calculation
        - Import Plan
        - Export Report
    
    ---
    
    **B. Section 1 – Projects & Recent Activity (Combined)**
    
    - **Active Projects**
        - Card/list view for each active project:
            - Project Name & Icon
            - Status (in progress, awaiting, completed)
            - Deadline/Last updated
            - Actions: Open, Resume
        - **Recently Opened** (chip or small icon)
        - **Favorites** (optional)
        - **Recent Activity**
            - Inline with each project: last calculation, export, or edit with timestamp (“Last export: 1 hour ago”, “Last calculation: 10:34 AM”)
            - “Resume” button for incomplete/draft work
    
    ---
    
    **C. Section 2 – Tools Shortcuts**
    
    - Icon cards or buttons for each core tool:
        - Air Duct Sizer
        - Combustion Vent Sizer
        - Grease Duct Sizer
        - Generator Exhaust Sizer
        - Estimating App
    - Optionally: Highlight “Last Used” or most popular tools
    
    ---
    
    **D. Messages & Help (Context-Aware)**
    
    - **Dashboard only:**
        - Bottom right:
            - [💬 Messages] — Rectangular button opens modal with notifications, chat, support
            - [❓ Help] — Circular button opens modal with onboarding, FAQ, guided tour, training links
    - **All other screens:**
        - *Neither button is shown.*
        - Maximum workspace—no floating UI elements
    
    ---
    
    **E. Getting Started**
    
    - Accessed from the Help button (never persistent on dashboard)
    - Includes onboarding checklist, app tour, training resources
    
    ---
    
    **What’s Not Present (by design):**
    
    - KPIs/Stats — not on v1 dashboard
    - Team/Collab Feed — not in v1
    - System/Account Status — found under Profile, not dashboard
    - No floating messages/help except on dashboard
    
    ---
    
    ## **Minimalist Dashboard Wireframe**
    
    ```
    plaintext
    CopyEdit
    ┌────────────────────────────────────────────────────────────────────────────┐
    │      Home  |  File  |  Projects  |  Tools  |  Profile   [Centered Top Bar] │
    └────────────────────────────────────────────────────────────────────────────┘
    
    [Start New Project]   [Start Calculation]   [Import Plan]   [Export Report]
    
    ─────────────────────────────────────────────────────────────
    
    Active Projects & Recent Activity
    [Project Card]   [Project Card]   [Project Card]
      - Name        - Status         - Last Activity
      - Actions: Open/Resume/Favorite
      - Recent: Last calc/export/edit (timestamp, inline)
    
    ─────────────────────────────────────────────────────────────
    
    Tools Shortcuts
    [Air Duct Sizer]   [Combustion Vent Sizer]   [Grease Duct Sizer]
    [Generator Exhaust]   [Estimating App]
    
    ─────────────────────────────────────────────────────────────
    
    Bottom right (dashboard only):
      [💬] Messages  [❓] Help
    
    *On any other screen (tools, project detail): NO messages/help buttons shown*
    
    ```
    
    ---
    
    ## **Summary Table: Dashboard Elements**
    
    | Section | Shown On Dashboard | Shown In Tools/Other |
    | --- | --- | --- |
    | Top Nav Bar | ✔ | ✔ |
    | Quick Actions | ✔ | ✗ |
    | Projects/Recent Activity | ✔ | ✗ |
    | Tools Shortcuts | ✔ | ✗ |
    | Messages & Help Buttons | ✔ | ✗ |
    
    ---
    
    ## **Key Rationale Points**
    
    - **Only relevant actions and info are ever visible.**
    - **Messages/help never distract from actual work; dashboard is the “control center” for notifications and onboarding.**
    - **Cards are visually minimalist, well-spaced, and ready for new sections as you scale.**
    - **All navigation, action, and info is at most one click away, without persistent clutter.**
- Navigation Menu
    - [ ]  Navigation Menu to be at the top of the screen always
        - [ ]  Navigation Menu to be at the top of the screen in window mode
        - [ ]  Navigation Menu hidden in full screen mode
- Effects
    
    
    - [ ]  Frame
    
    - Code
        
        ```tsx
        
        ```
        
    
    - [ ]  Navigation Menu
    
    - dock-label-at-hover
        
        ```tsx
        import * as React from "react"
        import { motion } from "framer-motion"
        import { cn } from "@/lib/utils"
        import { LucideIcon } from "lucide-react"
        
        interface DockProps {
          className?: string
          items: {
            icon: LucideIcon
            label: string
            onClick?: () => void
          }[]
        }
        
        interface DockIconButtonProps {
          icon: LucideIcon
          label: string
          onClick?: () => void
          className?: string
        }
        
        const floatingAnimation = {
          initial: { y: 0 },
          animate: {
            y: [-2, 2, -2],
            transition: {
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut"
            }
          }
        }
        
        const DockIconButton = React.forwardRef<HTMLButtonElement, DockIconButtonProps>(
          ({ icon: Icon, label, onClick, className }, ref) => {
            return (
              <motion.button
                ref={ref}
                whileHover={{ scale: 1.1, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={onClick}
                className={cn(
                  "relative group p-3 rounded-lg",
                  "hover:bg-secondary transition-colors",
                  className
                )}
              >
                <Icon className="w-5 h-5 text-foreground" />
                <span className={cn(
                  "absolute -top-8 left-1/2 -translate-x-1/2",
                  "px-2 py-1 rounded text-xs",
                  "bg-popover text-popover-foreground",
                  "opacity-0 group-hover:opacity-100",
                  "transition-opacity whitespace-nowrap pointer-events-none"
                )}>
                  {label}
                </span>
              </motion.button>
            )
          }
        )
        DockIconButton.displayName = "DockIconButton"
        
        const Dock = React.forwardRef<HTMLDivElement, DockProps>(
          ({ items, className }, ref) => {
            return (
              <div ref={ref} className={cn("w-full h-64 flex items-center justify-center p-2", className)}>
                <div className="w-full max-w-4xl h-64 rounded-2xl flex items-center justify-center relative">
                  <motion.div
                    initial="initial"
                    animate="animate"
                    variants={floatingAnimation}
                    className={cn(
                      "flex items-center gap-1 p-2 rounded-2xl",
                      "backdrop-blur-lg border shadow-lg",
                      "bg-background/90 border-border",
                      "hover:shadow-xl transition-shadow duration-300"
                    )}
                  >
                    {items.map((item) => (
                      <DockIconButton key={item.label} {...item} />
                    ))}
                  </motion.div>
                </div>
              </div>
            )
          }
        )
        Dock.displayName = "Dock"
        
        export { Dock }
        ```
        
    - Messages and Notification pop-up
        - Toast
            
            ```
            'use client'
            
            import { forwardRef, useImperativeHandle, useRef } from 'react';
            import { motion } from 'framer-motion';
            import {
              Toaster as SonnerToaster,
              toast as sonnerToast,
            } from 'sonner';
            import {
              CheckCircle,
              AlertCircle,
              Info,
              AlertTriangle,
              X,
            } from 'lucide-react';
            
            import { Button } from '@/components/ui/button';
            import { cn } from '@/lib/utils';
            
            type Variant = 'default' | 'success' | 'error' | 'warning';
            type Position =
              | 'top-left'
              | 'top-center'
              | 'top-right'
              | 'bottom-left'
              | 'bottom-center'
              | 'bottom-right';
            
            interface ActionButton {
              label: string;
              onClick: () => void;
              variant?: 'default' | 'outline' | 'ghost';
            }
            
            interface ToasterProps {
              title?: string;
              message: string;
              variant?: Variant;
              duration?: number;
              position?: Position;
              actions?: ActionButton;
              onDismiss?: () => void;
              highlightTitle?: boolean;
            }
            
            export interface ToasterRef {
              show: (props: ToasterProps) => void;
            }
            
            const variantStyles: Record<Variant, string> = {
              default: 'bg-card border-border text-foreground',
              success: 'bg-card border-green-600/50',
              error: 'bg-card border-destructive/50',
              warning: 'bg-card border-amber-600/50',
            };
            
            const titleColor: Record<Variant, string> = {
              default: 'text-foreground',
              success: 'text-green-600 dark:text-green-400',
              error: 'text-destructive',
              warning: 'text-amber-600 dark:text-amber-400',
            };
            
            const iconColor: Record<Variant, string> = {
              default: 'text-muted-foreground',
              success: 'text-green-600 dark:text-green-400',
              error: 'text-destructive',
              warning: 'text-amber-600 dark:text-amber-400',
            };
            
            const variantIcons: Record<Variant, React.ComponentType<{ className?: string }>> = {
              default: Info,
              success: CheckCircle,
              error: AlertCircle,
              warning: AlertTriangle,
            };
            
            const toastAnimation = {
              initial: { opacity: 0, y: 50, scale: 0.95 },
              animate: { opacity: 1, y: 0, scale: 1 },
              exit: { opacity: 0, y: 50, scale: 0.95 },
            };
            
            const Toaster = forwardRef<ToasterRef, { defaultPosition?: Position }>(
              ({ defaultPosition = 'bottom-right' }, ref) => {
                const toastReference = useRef<ReturnType<typeof sonnerToast.custom> | null>(null);
            
                useImperativeHandle(ref, () => ({
                  show({
                    title,
                    message,
                    variant = 'default',
                    duration = 4000,
                    position = defaultPosition,
                    actions,
                    onDismiss,
                    highlightTitle,
                  }) {
                    const Icon = variantIcons[variant];
            
                    toastReference.current = sonnerToast.custom(
                      (toastId) => (
                        <motion.div
                          variants={toastAnimation}
                          initial="initial"
                          animate="animate"
                          exit="exit"
                          transition={{ duration: 0.3, ease: 'easeOut' }}
                          className={cn(
                            'flex items-center justify-between w-full max-w-xs p-3 rounded-xl border shadow-md',
                            variantStyles[variant]
                          )}
                        >
                          <div className="flex items-start gap-2">
                            <Icon className={cn('h-4 w-4 mt-0.5 flex-shrink-0', iconColor[variant])} />
                            <div className="space-y-0.5">
                              {title && (
                                <h3
                                  className={cn(
                                    'text-xs font-medium leading-none',
                                    titleColor[variant],
                                    highlightTitle && titleColor['success'] // override for meeting case
                                  )}
                                >
                                  {title}
                                </h3>
                              )}
                              <p className="text-xs text-muted-foreground">{message}</p>
                            </div>
                          </div>
            
                          <div className="flex items-center gap-2">
                            {actions?.label && (
                              <Button
                                variant={actions.variant || 'outline'}
                                size="sm"
                                onClick={() => {
                                  actions.onClick();
                                  sonnerToast.dismiss(toastId);
                                }}
                                className={cn(
                                  'cursor-pointer',
                                  variant === 'success'
                                    ? 'text-green-600 border-green-600 hover:bg-green-600/10 dark:hover:bg-green-400/20'
                                    : variant === 'error'
                                    ? 'text-destructive border-destructive hover:bg-destructive/10 dark:hover:bg-destructive/20'
                                    : variant === 'warning'
                                    ? 'text-amber-600 border-amber-600 hover:bg-amber-600/10 dark:hover:bg-amber-400/20'
                                    : 'text-foreground border-border hover:bg-muted/10 dark:hover:bg-muted/20'
                                )}
                              >
                                {actions.label}
                              </Button>
                            )}
            
                            <button
                              onClick={() => {
                                sonnerToast.dismiss(toastId);
                                onDismiss?.();
                              }}
                              className="rounded-full p-1 hover:bg-muted/50 dark:hover:bg-muted/30 transition-colors focus:outline-none focus:ring-2 focus:ring-ring"
                              aria-label="Dismiss notification"
                            >
                              <X className="h-3 w-3 text-muted-foreground" />
                            </button>
                          </div>
                        </motion.div>
                      ),
                      { duration, position }
                    );
                  },
                }));
            
                return (
                  <SonnerToaster
                    position={defaultPosition}
                    toastOptions={{ unstyled: true, className: 'flex justify-end' }}
                  />
                );
              }
            );
            
            export default Toaster;
            
            ```
            
        - button
            
            ```
            import * as React from "react"
            import { Slot } from "@radix-ui/react-slot"
            import { cva, type VariantProps } from "class-variance-authority"
            
            import { cn } from "@/lib/utils"
            
            const buttonVariants = cva(
              "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
              {
                variants: {
                  variant: {
                    default: "bg-primary text-primary-foreground hover:bg-primary/90",
                    destructive:
                      "bg-destructive text-destructive-foreground hover:bg-destructive/90",
                    outline:
                      "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
                    secondary:
                      "bg-secondary text-secondary-foreground hover:bg-secondary/80",
                    ghost: "hover:bg-accent hover:text-accent-foreground",
                    link: "text-primary underline-offset-4 hover:underline",
                  },
                  size: {
                    default: "h-10 px-4 py-2",
                    sm: "h-9 rounded-md px-3",
                    lg: "h-11 rounded-md px-8",
                    icon: "h-10 w-10",
                  },
                },
                defaultVariants: {
                  variant: "default",
                  size: "default",
                },
              },
            )
            
            export interface ButtonProps
              extends React.ButtonHTMLAttributes<HTMLButtonElement>,
                VariantProps<typeof buttonVariants> {
              asChild?: boolean
            }
            
            const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
              ({ className, variant, size, asChild = false, ...props }, ref) => {
                const Comp = asChild ? Slot : "button"
                return (
                  <Comp
                    className={cn(buttonVariants({ variant, size, className }))}
                    ref={ref}
                    {...props}
                  />
                )
              },
            )
            Button.displayName = "Button"
            
            export { Button, buttonVariants }
            
            ```
            
        - Task for Augment
            
            ```
            Absolutely! Here’s a step-by-step Augment implementation protocol (including integration code samples) so this animated Toaster notification effect will be used for all warnings, errors, and info toasts throughout your app and tools.
            
            ⸻
            
            🚦 Task for Augment: Apply Custom Toaster Effect for All Warnings, Info, Errors in SizeWise Suite
            
            ⸻
            
            1. Centralize the Toaster
            
            a. Place the Toaster component once at the root of your app shell (usually in /app/layout.tsx), so that all pages and components can trigger toasts.
            
            // /app/layout.tsx
            import Toaster, { ToasterRef } from '@/components/ui/Toaster';
            import React, { useRef } from 'react';
            
            export default function RootLayout({ children }) {
              const toasterRef = useRef<ToasterRef>(null);
            
              // You may pass this ref via context/provider to children if needed
            
              return (
                <html lang="en">
                  <body>
                    {/* ...AppShell/sidebar/header... */}
                    {children}
                    <Toaster ref={toasterRef} defaultPosition="bottom-right" />
                  </body>
                </html>
              );
            }
            
            ⸻
            
            2. Make the Toaster Globally Triggerable
            
            a. Expose a global toast utility, e.g. via React Context or a custom hook.
            b. Example: useToaster hook (placed in /lib/hooks/useToaster.ts):
            
            // /lib/hooks/useToaster.ts
            import React, { useContext, createContext, useRef } from "react";
            import Toaster, { ToasterRef } from "@/components/ui/Toaster";
            
            const ToasterContext = createContext<React.RefObject<ToasterRef> | null>(null);
            
            export function ToasterProvider({ children }: { children: React.ReactNode }) {
              const toasterRef = useRef<ToasterRef>(null);
              return (
                <ToasterContext.Provider value={toasterRef}>
                  {children}
                  <Toaster ref={toasterRef} defaultPosition="bottom-right" />
                </ToasterContext.Provider>
              );
            }
            
            export function useToaster() {
              const ctx = useContext(ToasterContext);
              if (!ctx) throw new Error("useToaster must be within ToasterProvider");
              return ctx;
            }
            
            c. Then, wrap your RootLayout or AppShell with <ToasterProvider>:
            
            // /app/layout.tsx or /app/AppShell.tsx
            import { ToasterProvider } from "@/lib/hooks/useToaster";
            
            export default function RootLayout({ children }) {
              return (
                <html lang="en">
                  <body>
                    <ToasterProvider>
                      {/* ...rest of app... */}
                      {children}
                    </ToasterProvider>
                  </body>
                </html>
              );
            }
            
            ⸻
            
            3. Trigger Toaster Notifications Anywhere
            
            a. In any component (tool, validation, warning, etc):
            
            import { useToaster } from "@/lib/hooks/useToaster";
            
            export default function MyComponent() {
              const toasterRef = useToaster();
            
              function handleError() {
                toasterRef.current?.show({
                  variant: "error",
                  title: "Calculation Error",
                  message: "Input is invalid or exceeds SMACNA limits.",
                  actions: {
                    label: "Fix Input",
                    onClick: () => {
                      // focus or scroll to input field
                    },
                  },
                });
              }
            
              return (
                <button onClick={handleError}>
                  Trigger Error Toast
                </button>
              );
            }
            
            	•	Use "error", "warning", "success", or "default" as needed.
            	•	You can use this for warnings, validation errors, user notifications, export success, etc.
            
            ⸻
            
            4. Apply in All Tools & App-wide
            
            a. Replace all usages of window.alert, console.warn, or existing basic toasts/snackbars with the new Toaster effect.
            	•	In tools (e.g., Air Duct Sizer), trigger a warning when a value exceeds standards.
            	•	In project screens, notify on successful save/export.
            	•	In admin, use for permission errors or confirmations.
            
            b. Example for validation inside a tool:
            
            if (input > MAX_VALUE) {
              toasterRef.current?.show({
                variant: "warning",
                title: "Value Too High",
                message: "The value entered exceeds the allowed maximum for this tool.",
                highlightTitle: true,
              });
            }
            
            c. For async events or API errors:
            
            try {
              await api.saveProject(data);
              toasterRef.current?.show({
                variant: "success",
                title: "Saved",
                message: "Your project was saved successfully!",
              });
            } catch (e) {
              toasterRef.current?.show({
                variant: "error",
                title: "Save Failed",
                message: "There was a problem saving your project.",
              });
            }
            
            ⸻
            
            5. Design Consistency
            	•	Always use the Toaster for warnings, validation errors, status alerts, and user feedback in all core tools and app sections.
            	•	Ensure that only one or two toasts are visible at a time for clarity.
            	•	Adjust variant, actions, and position as appropriate for the UX context.
            
            ⸻
            
            Summary for Augment
            
            Implement the custom Toaster effect as the universal notification system:
            	•	Place <Toaster /> at the root layout, using context if needed for global access.
            	•	Provide a hook (useToaster) so any component can trigger notifications.
            	•	Refactor all warnings, errors, and info messages in all tools/app screens to use this effect instead of browser alerts or legacy toasts.
            	•	Reference and build upon the code samples above for consistency and accessibility.
            	•	Test in all themes and on mobile/desktop.
            
            ⸻
            
            If any tool or page still uses old alert methods, update to this new system.
            If you need code or integration help for a specific tool, request clarification.
            
            ⸻
            
            Let me know if you want an admin-only override, custom themes, or a more advanced API!
            ```
            
    - Augment Implementation protocol
        
        Here’s an **instruction set for Augment** that is clear, precise, and ready for team implementation.
        
        This covers both **navigation menu hover effect** and **universal animated Toaster notifications**—with explicit expectations and reference code.
        
        ---
        
        ## 🚦 Augment Implementation Protocol
        
        ### 1. **Navigation Menu – “Dock Label at Hover” Effect**
        
        **Requirement:**
        
        All items in the top navigation menu must use the `dock-label-at-hover` effect (animated label reveal on hover, floating animation for icons).
        
        **Integration Steps:**
        
        - **Use the provided Dock component for all nav icons/menus:**
            
            ```tsx
            import { Dock } from "@/components/ui/Dock";
            // Sample usage:
            <Dock
              items={[
                { icon: Home, label: "Home", onClick: ... },
                { icon: Folder, label: "File", onClick: ... },
                // ...other nav items
              ]}
            />
            
            ```
            
        - **Effect:**
            - Icon floats gently (framer-motion animation)
            - Label fades in above icon on hover
            - Applies to all main nav items (Home, File, Projects, Tools, Profile, etc.)
        - **Where:**
            - Top navigation bar, centered horizontally, all dropdowns and menu groups.
        
        ---
        
        ### 2. **Messages and Notification Pop-up – Universal Animated Toaster**
        
        **Requirement:**
        
        All system messages, notifications, validation warnings, and status alerts must use the **custom Toaster effect**—no window alerts or legacy snackbars.
        
        **Implementation Steps:**
        
        - **Step 1:**
            - Place the `<Toaster />` component at the app’s root (usually in `/app/layout.tsx`).
            - Reference code as provided (see above for import/useRef).
        - **Step 2:**
            - Wrap the app in a `ToasterProvider` to make toaster ref available globally.
            - Use the `useToaster()` hook to trigger notifications from any component or tool.
        - **Step 3:**
            - Replace all alert/info/error/warning messages with `toasterRef.current?.show({ ... })`
            - Use variants: `"success"`, `"warning"`, `"error"`, `"default"` as context requires.
            - Add action buttons when user remediation is possible (“Fix Input”, “Retry”, etc).
        - **Step 4:**
            - Test in all supported color themes and ensure only one or two toasts show at once.
        - **Code Samples:**
            - See code blocks in your message for direct integration (Dock, Toaster, Button).
        
        ---
        
        ### 3. **General Instructions**
        
        - **Accessibility:**
            - All navigation and notifications must be keyboard and screen-reader accessible.
        - **Consistency:**
            - Use these effects everywhere (across all tools/modules).
            - Do not mix with older notification styles.
        - **Testing:**
            - QA across all major browsers, desktop, and tablet/iPad layouts.
        - **Customization:**
            - If admin-only override or custom themes are needed, consult design/system team before extending.
        
        ---
        
        ## **Summary**
        
        - **Apply Dock “label-at-hover” animation for all main top navigation items.**
        - **Implement universal animated Toaster (bottom-right) for all notifications and user feedback.**
        - **Ensure code samples provided are referenced and used as implementation baseline.**
        - **Phase out all legacy alerts/snackbars in favor of these new, unified effects.**
        
        ---
        
        **If any part of the code or workflow integration is unclear, ask for clarification or further breakdown per tool or screen.**
        
    
    - [ ]  Theme
    
    - [ ]  Light Mode - White
    - [ ]  Dark Mode - Black
    - [ ]  System - Dark/Light Mode

### SizeWise Home Page

- Background
    - Background Effects
        - Laser Background
            
            ```tsx
            
            ```
            
        - Black Background Color
            
            ```tsx
            
            ```
            

### Air Duct Sizer

- **Canvas, Panel & Interaction Specs**
    
    ### **Air Duct Sizer 3D Tool — Canvas, Panel & Interaction Specification**
    
    ---
    
    - **UI Placement Summary Table**
        
        
        | Element ID | Component | Type | Placement | Visibility | Purpose |
        | --- | --- | --- | --- | --- | --- |
        | 1 | **Project Properties** | Retractable panel | Top-left | On demand | Project metadata |
        | 2 | **3D Canvas** | Workspace | Full center viewport | Always | Drawing stick lines & interacting with 3D ducts |
        | 3 | **Drawing Tool Pencil FAB** | Toggle button | Bottom-right | Always | Draw stick lines ON/OFF |
        | 4 | **Convert to 3D Ducts** | Primary button | Bottom-right cluster or Calc Bar | On demand | Convert stick lines to 3D duct models |
        | 5 | **Selection Pop-Up** | Contextual window | Anchored near element | On selection | Quick edit/properties |
        | 6 | **Calculation Bar** | Persistent bar | Bottom full-width | Always | Key results & quick actions |
        | 7 | **Import/Export Panel** | Collapsible panel | Above Calculation Bar | On demand | Manage files |
        | 8 | **Warning Panel** | Retractable panel | Right edge viewport | On demand | List and resolve warnings |
        | 9 | **View Cube** | Navigation aid | Top-right | Always | 3D orientation |
    
    ---
    
    - **1. Project Properties Panel**
        
        # **Project Properties Panel — Complete Documentation**
        
        ---
        
        ## **A. Overview & Rationale**
        
        The **Project Properties Panel** provides a single, discoverable entry point for managing all project-wide data, settings, and metadata. Its design minimizes workspace intrusion, maximizes accessibility, and matches modern professional UI patterns found in top SaaS and CAD tools.
        
        ---
        
        ## **B. Collapsed State (“Retracted”)**
        
        ### **Trigger Button**
        
        - **Location:** Top-left, docked flush to the viewport’s left/top edge, always visible.
        - **Dimensions:** 44 px tall × 56 px wide (icon only, default) or up to 160 px (icon + label on wider screens).
        - **Icon:**
            - **Folder** (`folder_open` recommended, Material/Apple style, filled for modern look).
            - **Color:**
                - Default: #90A4AE (cool gray)
                - Hover/Focus: background increases opacity to rgba(255,255,255,0.96), folder icon gets a subtle #FF9800 (orange) glow.
                - Active (panel open): icon highlights #FF9800, folder background stays frosted.
        - **Label (Optional):**
            - Text: “Project” (15–16 px, semi-bold, #424242)
            - Visible beside icon if enough space.
        - **Background:**
            - Frosted glass: rgba(255,255,255,0.92), border #E0E0E0 (2 px, 25% opacity).
            - Corners: top-left 16 px, others 0 px.
            - Subtle shadow: 0 1px 8px rgba(180,190,200,0.10)
        - **Affordance:**
            - Cursor: pointer on hover
            - Tooltip: “Project Properties”
            - ARIA label: `aria-label="Open Project Properties Panel"`
            - Tab/Enter/Space opens panel
        
        ---
        
        ## **C. Expanded State (“Open”)**
        
        ### **Panel Layout & Appearance**
        
        - **Expansion Animation:**
            - Panel slides in from the left (≤200 ms, cubic-ease), icon/label animate to “pressed” state.
        - **Dimensions:**
            - Width: 320–360 px (responsive, never collapses thinner than 320 px)
            - Height: 100% viewport (full vertical)
        - **Background:**
            - Frosted glass (rgba(255,255,255,0.92)), same as collapsed
            - Liquid glass border (#E0E0E0), 2 px, 25% opacity, top-left 16 px
            - Subtle drop shadow (0 2px 24px #B0BEC5)
        - **Header:**
            - 44–56 px tall: folder icon (now orange #FF9800), label “Project Properties,” and [×] close button at right
            - Header background: slightly more opaque (for focus), no shadow
        
        ---
        
        ### **D. Contents & Organization**
        
        ### **Section A: Project Information** *(Always expanded)*
        
        - **Project Name** (text input)
        - **Project Number** (text input)
        - **Project Description** (multiline textarea)
        - **Project Location** (text input or dropdown)
        - **Client Name** (text input)
        - **Estimator Name** (auto-filled, editable)
        - **Date Created** (read-only)
        - **Last Modified** (read-only)
        - **Version** (read-only, links to Version Control if available)
        - **Company Logo** (upload field, square with rounded corner preview 40×40 px)
        
        ### **Section B: Code References** *(Collapsible dropdown)*
        
        - **Duct Sizing Standard** (dropdown: SMACNA, ASHRAE, Local, etc.)
        - **Material Standard** (dropdown or multi-select)
        - **Fire Safety Standard** (dropdown: UL, NFPA, Local, etc.)
        - **Local Regulations** (text input)
        - **Import Standards** (button)
        - **Export Standards** (button)
        
        ### **Section C: Global Defaults** *(Collapsible dropdown)*
        
        - **Measurement Units** (dropdown: Imperial/Metric)
        - **Default Duct Size** (width × height or diameter, numeric input, 8” default if no input from user)
        - **Default Material** (dropdown)
        - **Default Insulation Type** (dropdown)
        - **Default Fitting Type** (dropdown)
        - **Calibration Mode** (toggle: Auto/Manual)
        - **Design Parameters** (custom fields, optional)
        
        ### **Section D: Team & Collaboration** *(Collapsible dropdown)*
        
        - **Project Owner** (avatar/name, dropdown reassign)
        - **Team Members** (list, add/remove, assign roles)
        - **User Roles** (per member: Editor, Viewer, Admin)
        - **Share Project** (toggle)
        - **Activity Log** (read-only, scrollable)
        
        ### **Section E: Project Administration** *(Collapsible dropdown)*
        
        - **Project Status** (dropdown: Design, Bid, Construction, As-Built)
        - **Project Notes** (rich textarea, time-stamped)
        - **Stakeholder Contacts** (Name, Role, Email, Phone—repeatable fields)
        - **Custom Fields** (user-defined label/value)
        - **Archive Project** (button; confirmation dialog opens)
        - **Export Project** (button)
        
        ---
        
        ### **E. Interaction Details**
        
        - **Expand/collapse:**
            - Clicking a section header toggles open/closed (arrow rotates, section animates <150 ms)
        - **Inputs:**
            - All fields use “liquid glass” styling—subtle transparent white, sharp contrast text, rounded corners.
        - **Movability:**
            - Panel is fixed—cannot be moved or detached.
        - **Dismissal:**
            - Click [×] in header, click outside panel, or press Esc to close.
            - Panel always returns to last scroll position when reopened.
        - **Accessibility:**
            - All fields and headers are tab-navigable.
            - Section headers announce “expand/collapse” to screen readers.
            - Close button is last in tab sequence.
        
        ---
        
        ### **F. Visual & Theming Details**
        
        - **Panel BG:** rgba(255,255,255,0.92)
        - **Border:** #E0E0E0, 2 px
        - **Input BG:** rgba(255,255,255,0.82), border #D1D1D1
        - **Active icon:** #FF9800 (orange highlight)
        - **Text:** #212121 (90% opacity)
        - **Headers:** #424242, semi-bold, 16–17 px
        - **Labels:** #616161, regular, 15 px
        - **Dropdowns/Buttons:** Slightly raised with liquid glass effect; clear hover/active states
        
        ---
        
        ### **G. Summary Table**
        
        | Element | State | Description |
        | --- | --- | --- |
        | Trigger Button (Panel) | Collapsed | Top-left, folder icon, frosted glass, 44×56 px |
        | Panel (Main) | Expanded | 320–360 px wide, 100% tall, frosted, 5 section layout |
        | Header | Expanded | Icon + label + close (×) |
        | Section: Info | Always open | Name, Number, Client, Estimator, Logo, Dates, Version |
        | Section: Codes | Collapsible | Standards, regs, import/export |
        | Section: Defaults | Collapsible | Units, material, fitting, calibration, params |
        | Section: Team | Collapsible | Owner, team, sharing, log |
        | Section: Admin | Collapsible | Status, notes, contacts, custom, archive/export |
        | Dismissal | Any | Esc, outside click, × button |
        | Accessibility | Any | Tab, ARIA, tooltips, contrast, keyboard |
        
        ---
        
        ## **H. Example Figma Wireframe Guidance**
        
        - **Collapsed state:** folder icon (left), label “Project” (if space), frosted glass, fixed top-left
        - **Expanded state:** slides out over canvas, full-height, all sections laid out vertically, first section open, rest as dropdowns
        - **Inputs:** liquid glass, iconography matches rest of app, consistent paddings (16 px horizontal, 20 px section heads)
        - **States:** clear active, hover, focus for every field/button
        
        ---
        
        ## **I. Rationale & UX Justification**
        
        - **One-click access** for all project-level data
        - **Non-intrusive**: stays out of the way when not in use, instantly accessible when needed
        - **Scalable**: new fields, standards, and metadata can be added via custom fields
        - **Professional, trusted look** for engineers and PMs—evokes trust in data, easy to handoff for QA/compliance.
    
    ---
    
    - **2. 3D Canvas Workspace**
        
        # **3D Canvas Workspace — Full Documentation**
        
        ---
        
        ## **A. Overview**
        
        The **3D Canvas Workspace** is the heart of the Air Duct Sizer tool—serving as the interactive, visual area for creating, editing, and reviewing duct layouts and system models in real time.
        
        ---
        
        ## **B. Placement & Appearance**
        
        - **Coverage:**
            - Occupies the entire main viewport except for overlaying panels, floating toolbars (FAB, View Cube, etc.), and status bars.
            - **Always visible and maximized**—no scrollbars unless the user zooms/pans.
        - **Background:**
            - Clean, soft-white (#FAFBFC) for maximum contrast with drawn elements.
            - Subtle, non-intrusive grid (optional: #E3E7EA, 15% opacity) aids alignment.
        - **Edges:**
            - No borders, but a gentle drop shadow at the top and bottom edges may indicate workspace boundaries (optional for app style).
        
        ---
        
        ## **C. Core Interactions**
        
        ### **1. Mouse and Touch Controls**
        
        ### **a. Navigation**
        
        - **Right-click + Drag:**
            - **Pan** the view horizontally and vertically.
            - **Cursor:** changes to “hand” while panning.
        - **Mouse Scroll Wheel / Two-finger Pinch (Touch):**
            - **Zoom in/out** centered on cursor position.
            - **Zoom levels:** min 10%, max 500%.
        - **Left-click + Drag (Empty Space):**
            - **Rotate 3D Canvas:**
                - **Without modifier:**
                    - Rotates 3D view (orbit camera around model)
                - **With [Shift] key held:**
                    - Restricts rotation to a single axis (horizontal/vertical based on drag direction)—enables “2D rotate” for precise plan/top/side views.
        - **Double-click (Empty Space):**
            - **Reset view** to default orientation (top or isometric, configurable).
        
        ### **b. Drawing vs. Selection**
        
        - **Pencil Tool OFF:**
            - **Left-click on element:** selects duct, fitting, or equipment.
                - **Ctrl/Cmd+Click:** multi-select.
            - **Left-click + drag (on empty):** rotates canvas (see above).
        - **Pencil Tool ON:**
            - **Left-click:**
                - Click = Place new node for stick line.
                - Double-click = End current duct run.
                - Right-click (while drawing) = temporarily pan without breaking line.
            - **Esc key:** cancels active drawing without placing the last segment.
        
        ---
        
        ### **2. Keyboard Shortcuts**
        
        | Shortcut | Action |
        | --- | --- |
        | Esc | Cancel current drawing/selection |
        | Ctrl/Cmd + Z | Undo last action |
        | Ctrl/Cmd + Y | Redo last undone action |
        | Ctrl/Cmd + A | Select all (if focus in canvas) |
        | Shift (hold) | Restrict rotation to single axis |
        | Spacebar | Quick-toggle between select/draw tool |
        | F | Frame selected object(s) |
        
        ---
        
        ### **3. Visual Feedback**
        
        - **Selection:**
            - Selected elements outlined with high-contrast (e.g., #FF9800 orange glow) and “grip” handles for moving/resizing.
        - **Drawing Mode:**
            - Current stick line shows as semi-transparent orange (#FFA726, 80% opacity).
            - Next node preview: ghosted circle at cursor.
        - **Warnings:**
            - Any duct/fitting with a warning: glows with red/yellow, matching severity.
        - **Hover States:**
            - Elements under cursor highlight (light blue #00BCD4, 40% opacity).
        - **Grid & Origin:**
            - Optional grid fades in as user zooms closer; X/Y/Z origin marker always visible at bottom-left of canvas.
        
        ---
        
        ## **D. Accessibility**
        
        - **Tab navigation:**
            - All overlay/floating controls and context menus are focusable, but canvas itself is not tab-navigable (avoids trapping keyboard users).
        - **Keyboard users:**
            - All drawing, selection, and navigation accessible via keyboard shortcuts.
        - **Screen reader:**
            - Notifies user of selection, warnings, and draw mode changes (“Drawing Mode Active”, “Duct Selected”, etc.).
        - **High contrast mode:**
            - Orange, blue, and red states meet WCAG AA for contrast on light backgrounds.
        
        ---
        
        ## **E. Resilience & Error Handling**
        
        - **No action is destructive by default**—drawing, moving, or rotating can be undone/redone via history controls.
        - **Auto-save:**
            - Canvas state is periodically saved; restoring from crash reloads last auto-saved model.
        - **Edge protection:**
            - If a user drags or pans past model bounds, canvas gently “bounces” or fades to show end of workspace.
        
        ---
        
        ## **F. Rationale & UX Justification**
        
        - **Direct, “what you see is what you get” (WYSIWYG)** workspace encourages experimentation and minimizes user error.
        - **Professional standards** (orbit, pan, zoom, undo/redo) familiar to any engineer, designer, or estimator.
        - **Maximal visibility**—by hiding all non-essential panels, user focus stays on modeling and reviewing system layout.
        
        ---
        
        ## **G. Example Interaction Flow**
        
        1. **User opens project; canvas is empty or shows last saved state.**
        2. **User pans with right-click, zooms with scroll, rotates view with left-click+drag.**
        3. **User enables Pencil Tool (FAB): left-click places first node, continues drawing stick line for centerline.**
        4. **User double-clicks to finish run, presses Esc to cancel segment, or right-clicks to pan without leaving draw mode.**
        5. **User disables Pencil Tool, selects element(s), moves/edits as needed.**
        6. **User can rotate in 2D by holding Shift while dragging, useful for aligning to plans or elevations.**
        7. **Any drawing or element with warnings glows as appropriate; hovering shows quick highlights.**
        
        ---
        
        ## **H. Table: Mouse/Key Interactions**
        
        | Action | Mouse/Key | Result |
        | --- | --- | --- |
        | Pan view | Right-click + drag | Moves viewport |
        | Zoom | Scroll/pinch | In/out zoom centered on cursor |
        | 3D Rotate | Left-click + drag | Rotates 3D view |
        | 2D Rotate | Shift + Left-click+drag | Restricts to horizontal/vertical |
        | Draw stick lines | Pencil ON + Left-click | Places nodes for new duct runs |
        | End stick line | Pencil ON + Double-click | Ends duct run |
        | Cancel drawing | Esc | Exits drawing mode |
        | Select element | Pencil OFF + Left-click | Selects duct/fitting/equipment |
        | Multi-select | Ctrl/Cmd + Click | Adds to selection |
        | Undo/Redo | Ctrl/Cmd+Z / Ctrl/Cmd+Y | Undo/redo any change |
        
        ---
        
        ## **I. Theming & Visuals**
        
        - **Background:** #FAFBFC (white, very light)
        - **Grid (optional):** #E3E7EA, 15% opacity
        - **Selection Outline:** #FF9800 (orange)
        - **Drawing Line:** #FFA726 (orange, 80% opacity)
        - **Hover:** #00BCD4 (light blue, 40% opacity)
        - **Warning:** #FF5252 (red) / #FFEB3B (yellow) depending on severity
    
    ---
    
    - **3. Drawing Tool (Floating Action Button – FAB)**
        
        # **3. Drawing Tool FAB (Floating Action Button) — FINAL SPECIFICATION**
        
        ---
        
        ## **A. Naming**
        
        - **UI Short Name:** Drawing Tool FAB
        - **System Label:** “Draw Duct Lines”
        - **Icon:** Standard Pencil (aligned with international design and CAD conventions)
        - **State Names:** OFF, ON, Drawing In Progress
        
        ---
        
        ## **B. Placement**
        
        - **Viewport Location:** Always floating at bottom-right corner of the 3D canvas.
            - Never obstructed by overlays or panels.
            - Smart repositioning for mobile/tablet or accessibility modes.
            - Z-index above other floating controls (but beneath pop-up panels).
        
        ---
        
        ## **C. Behavior & State Logic**
        
        ### **State 1: OFF**
        
        - **Visual:**
            - FAB appears neutral grey (`#BDBDBD`), high-contrast icon, 100% opacity.
            - Tooltip: **“Draw Duct Lines (OFF)”**
        - **Interaction:**
            - Left-click toggles ON (draw mode).
            - FAB can be toggled with keyboard shortcut **D** (documented in tooltip).
            - On canvas, all clicks are for selection (no drawing).
        
        ---
        
        ### **State 2: ON (Ready, Not Drawing)**
        
        - **Visual:**
            - FAB becomes orange (`#FF9800`), highly visible, 100% opacity.
            - Cursor changes to pencil/crosshair.
            - Tooltip: **“Draw Duct Lines (ON)”**
        - **Interaction:**
            - Left-click anywhere on canvas:
                - **Immediately creates the first node.**
                - **Immediately triggers a Pop-Up Property Panel (“Duct Properties”)** with fields:
                    - **Width, Height, or Diameter:** (user can select shape: rectangular or round)
                    - **Material Type:** (dropdown)
                    - **Insulation:** (Y/N, thickness)
                    - **Default Duct Name:** (editable)
                - User sets/accepts duct properties for the current run.
                - Closing this pop-up (by confirming or hitting Enter) resumes drawing (with those properties pre-applied).
            - Drawing stick line proceeds node-by-node as before (click = place node, double-click = end line/run).
            - **Right-click:** Pan (even in draw mode).
            - **Esc:** Cancels the current line segment (returns to ready to start new line, ON state).
        
        ---
        
        ### **State 3: Drawing in Progress**
        
        - **Visual:**
            - FAB maintains orange, but opacity reduced to **60%** (signals in-progress action).
            - Tooltip: **“Drawing in progress…”**
        - **Interaction:**
            - Can click FAB to exit draw mode at any time (see next).
            - Drawing ends when user double-clicks, presses Esc, or toggles FAB OFF.
        
        ---
        
        ### **Toggle OFF — Ending Draw Mode**
        
        - **Action:**
            - **Clicking the FAB** (or pressing “D”) while ON **auto-converts all in-progress lines** to 3D ducts:
                - Ducts extruded using the most recently entered properties (or properties assigned per run).
                - Each segment inherits the properties assigned in its run.
                - Any disconnected or incomplete lines are validated; user is warned if conversion cannot complete (e.g., floating lines).
            - Tooltip: **“Draw Duct Lines (OFF)”**
            - FAB returns to grey/neutral visual.
        
        ---
        
        ## **D. Pop-Up Property Panel (“Duct Properties”)**
        
        - **Trigger:** Immediately upon placing the first node (start of a new run).
        - **Fields:**
            - **Duct Shape:** (Rectangular, Round; radio select)
            - **Width, Height, Diameter:** (based on shape)
            - **Material Type:** (dropdown; e.g., Galv. Steel, Aluminum, Stainless)
            - **Insulation:** (toggle + numeric input for thickness)
            - **Duct Name/Tag:** (auto-increment; editable)
        - **Behavior:**
            - Panel stays centered on screen or near click (space permitting).
            - Confirm applies values to current drawing run; cancels returns to drawing mode but aborts run.
            - Panel is fully keyboard navigable and accessible.
        
        ---
        
        ## **E. Accessibility**
        
        - **Keyboard:**
            - FAB is in tab order (can tab to, press Enter/Space to toggle).
            - “D” key toggles draw mode ON/OFF.
            - Esc cancels line in progress.
            - Pop-Up panel is fully accessible (tab/arrow keys, Enter/Esc).
        - **Screen Reader:**
            - ARIA label always reflects state: “Draw Duct Lines, OFF/ON/Drawing in progress…”
        - **Color Contrast:**
            - Orange (`#FF9800`) and grey (`#BDBDBD`) meet/exceed WCAG 2.1 AA for icons and backgrounds.
        - **Tooltip:**
            - Always visible on hover/focus, with dynamic state message.
        - **Placement:**
            - FAB never obstructed, repositionable for accessibility needs.
        
        ---
        
        ## **F. Visual & Interaction Feedback**
        
        - **Opacity:** FAB dims to signal in-progress drawing.
        - **Cursor:** Pencil/crosshair when ON; pointer when OFF.
        - **Transition:** FAB color/opacity transitions animated (≤150ms).
        - **Pop-Up Panel:** Zoom/fade-in animation; dismisses with Enter/Esc.
        - **Auto-conversion:** All drawn lines extruded instantly on mode exit (no “convert” button needed).
        
        ---
        
        ## **G. Rationale & Engineering Practice Alignment**
        
        - **Efficiency:** Immediate property input removes extra steps and prevents error-prone generic line drawing.
        - **Professional Standard:** Mirrors Revit, CAD, and leading BIM tools: drawing mode always starts with property context.
        - **Clarity:** FAB always reflects state (color, tooltip, opacity) for user confidence and safety.
        - **Speed:** Auto-conversion on toggle OFF allows engineers to draw, edit, and iterate in a rapid, natural workflow.
        - **Accessibility:** No mouse required for any core interaction.
        
        ---
        
        **This is the canonical spec for the Drawing Tool FAB for Air Duct Sizer 3D Tool MVP. All logic, UI, interaction, accessibility, and engineering rationale is covered.**
        
    
    ---
    
    - **4. Convert to 3D Button**
        
        ### **Purpose**
        
        Transforms **all drawn stick lines** (duct centerlines) into **actual 3D duct models** with default dimensions and fittings.
        
        ### **Better Naming Suggestions**
        
        1. **Generate Duct Model** (clear for engineers)
        2. **Convert to 3D Ducts** (explicit, user-friendly)
        3. **Build Ductwork** (natural-language, workflow-oriented – **recommended**)
        4. **Extrude Duct Lines** (technical, CAD-like)
        
        ### **Specifications**
        
        - **Type:** Large primary button (persistent, floating or placed in Calculation Bar — suggestion below)
        - **Placement (Recommended):** **Left of the FAB** (bottom-right cluster) OR **in the Calculation Bar** for workflow consistency
        - **Behavior:**
            - **On Click:**
                - Processes all connected stick lines into 3D extruded duct sections (based on default or user-specified dimensions)
                - Auto-detects intersections and inserts default fittings (e.g., elbows, tees).
            - **Progress Indicator:**
                - Shows a spinning loader over the button or temporary “Generating…” toast
            - **Undo Option:**
                - After generation, shows **“Undo Conversion”** as a secondary action for 10 seconds (or until a new change is made).
    
    ---
    
    - **5. Context Property Panel**
        
        ### **Context Property Panel — Air Duct Sizer 3D Tool**
        
        - **1. Name & Role**
            - Official Name: Context Property Panel
            - Internal Reference: ContextPropertyPanel
            - Purpose:
            An interactive, floating UI panel that appears when the user selects any element(s) (duct, fitting, room, equipment, or multi-select group) within the 3D canvas. It provides immediate access to key actions, editable properties, and element-specific status in a context-driven, visually modern interface.
        - **2. Trigger & Lifecycle**
            - Display Trigger:
                - Panel appears whenever one or more selectable elements are highlighted (clicked or multi-selected) in the 3D canvas.
            - Dismissal:
                - Panel disappears (“zooms out”) when the user:
                    - Deselects all elements,
                    - Clicks outside both the panel and the selection,
                    - Presses Esc (keyboard).
            - Persistence:
                - Panel remains visible and interactive as long as the selection exists, regardless of panning/zooming the view.
        - **3. Placement & Movement**
            - Initial Placement:
                - Panel dynamically appears in the largest available open space nearest to the first selected element (centroid for multi-select).
                - Never overlaps the selected geometry or obstructs critical UI.
                - Automatically repositions if window is resized and would otherwise occlude a selection.
            - Movability:
                - User can move the panel anywhere within the viewport by clicking and dragging on any part of the panel (not just a header/grip).
            - Resizing:
                - Four resize handles (standard corner grabbers) are displayed on panel hover, one at each corner.
                - Panel can only be resized by dragging a corner handle—edges and borders do not respond.
                - Minimum and maximum sizes enforced to preserve usability.
        - **4. Animation**
            - Panel Appearance:
                - Zooms in: Panel animates from the first selected element—scaling and fading in (e.g., scale from 0.6 to 1.0, opacity 0.6 to 1.0) to its calculated position in the viewport.
            - Panel Dismissal:
                - Zooms out: On dismissal, panel animates back toward the first selected element, scaling down and fading to opacity 0.
            - Resize Handle Animation:
                - On hover, each corner handle animates in place (e.g., expands, glows, or gains offset/parallel marks) to signal interactivity.
        - **5. Visual Design**
            - Background:
                - Frosted Glass:
                    - Semi-transparent white, high blur (e.g., rgba(255,255,255,0.55), 24px backdrop blur).
                    - Color and effect remain the same in light and dark modes (panel and canvas do not invert or change).
            - Border:
                - Liquid Glass:
                    - Semi-transparent white or icy-blue, smooth glowing effect, visually “liquid” (not flat/solid).
                    - Thickness: ~2px; color consistent across all themes.
            - Drop Shadow:
                - Soft white or subtle blue outer glow, low opacity, for depth without distraction.
            - Resize Handles:
                - Four circular grabbers at the corners, semi-translucent, glowing on hover.
                - On hover, each handle may animate (e.g., pulse or gain double-parallel offset marks for visibility).
            - Hover State (Panel):
                - Entire panel receives a faint white/blue glow on hover, enhancing discoverability.
        - **6. Contents & Layout**
            - Panel Orientation:
                - Horizontal bar, arranged as follows for both single and multiple selection:
                    1. Quick Actions
                        - Horizontally grouped at the end of the panel closest to the selected element(s).
                        - Always includes:
                            - Add (contextual: Add Branch, Add Equipment, etc.)
                            - Remove (removes current selection)
                        - No “edit” action—editing is always direct via property fields.
                    2. Editable Properties
                        - Centered within the panel, occupying most of the horizontal space.
                        - Displays all modifiable fields for the selected element(s):
                            - For multi-select, shows only shared properties; unique properties shown as “(varied)” or disabled.
                            - Examples:
                                - Duct: size, material, length, flow
                                - Room: name, type, target flow
                                - Equipment: type, capacity
                        - All fields have liquid glass background (slightly higher opacity frosted glass), with unit hints and always-labeled.
                        - Field Hover/Focus: Fields brighten or glow gently on hover/focus, with no harsh contrast.
                    3. Status Section
                        - At the far end of the panel, furthest from selection.
                        - Contains:
                            - Warning/error badges (color-coded: red, yellow, green)
                            - Lock indicators (if property is read-only or tier-locked)
                            - Selection summary (for multi-select: total length, combined flow, etc.)
                            - Info tooltips linked to code/standard references (e.g., SMACNA, ASHRAE)
        - **7. Accessibility**
            - Keyboard Navigation:
                - Full tab/arrow key support for quick actions, properties, and status section.
                - ESC closes the panel and deselects.
                - Resize handles are focusable via tab and adjustable with keyboard (arrow keys when focused).
                - Panel movement can be triggered by keyboard shortcut (e.g., Alt+Arrow).
            - Screen Reader Support:
                - Panel announces itself as: “Context Property Panel for [element type] selected.”
                - Each action, field, and badge fully described.
                - Announces field state changes (“Size: 12x8 inches, required field, warning: velocity exceeds limit.”)
            - Contrast & Visibility:
                - Text, icons, fields, and handles always meet or exceed WCAG 2.1 AA.
                - Frosted and liquid glass never reduce essential contrast or legibility.
        - **8. Rationale**
            - Modern Professionalism:
                - The frosted glass and liquid glass border provide a contemporary, high-end visual, in line with top-tier engineering software.
            - Contextual Workflow:
                - Panel placement and animation reinforce focus on selected elements, boosting user orientation and reducing cognitive load.
            - Direct Editing:
                - Removing the edit action streamlines interaction—users work directly with property fields, with instant feedback.
            - Discoverability:
                - Movability and resize handles are clear, visually prominent, and universally understood by professional users.
            - Single Source of Interaction:
                - Only one Context Property Panel is ever shown at a time, even for multi-select—keeps the workspace clean.
        - **9. Edge Cases & Constraints**
            - Panel cannot be resized by edge or border—only by visible corner handles.
            - Panel never covers the selected element or blocks essential UI (smart placement logic).
            - Multi-select always shows the same Context Property Panel; non-shared fields are shown as “(varied)” or disabled, not hidden.
            - Panel does not collapse or auto-move during canvas pan/zoom—remains until user acts.
        - **10. Summary Table**
            
            
            | **Attribute** | **Description** |
            | --- | --- |
            | Name | Context Property Panel |
            | Trigger | Selection of any element(s) in 3D canvas |
            | Placement | Smart float, nearest open space to first selection; user can move |
            | Animation | Zoom in from/to first selection (panel); resize handles animate on hover |
            | Background | Frosted glass (same for light/dark), semi-transparent, blurred |
            | Border | Liquid glass (white/icy-blue glow), consistent across themes |
            | Actions | Add (contextual), Remove |
            | Editable Fields | Centered, liquid glass input style, clear labels, shared fields for multi-select |
            | Status Section | Warnings, lock, summary, info tooltips |
            | Resize | Corner handles only, visible on hover, keyboard and mouse accessible |
            | Accessibility | Full tab/arrow nav, ARIA labeling, contrast AA, move/resize by keyboard and mouse |
            | Persistence | Never auto-hides, only user-dismissed, always one panel |
            | Rationale | Professional, context-driven, clutter-free, matches modern engineering/CAD UI paradigms |
        - **11. Context Property Panel — Color Codes**
            
            ---
            
            ## **Context Property Panel — Color Codes Specification**
            
            ---
            
            ### **Panel Background (Frosted Glass)**
            
            - **Primary Panel:**
                - `background: rgba(247, 250, 255, 0.55)`
                    
                    *(Very light, clean white-blue; soft frost. Ensures contrast on both light/dark canvas.)*
                    
                - **HEX Preview:** `#F7FAFF` at 55% opacity
            - **Backdrop Blur:**
                - *CSS*: `backdrop-filter: blur(24px);`
            
            ---
            
            ### **Panel Border (Liquid Glass)**
            
            - **Color:**
                - `border: 2px solid rgba(168, 212, 255, 0.70)`
                - **HEX Preview:** `#A8D4FF` at 70% opacity
            - **Glow (Box-Shadow):**
                - `box-shadow: 0 0 16px 2px rgba(168, 212, 255, 0.18)`
                - **HEX Preview:** `#A8D4FF` at 18% opacity
            
            ---
            
            ### **Resize Handles**
            
            - **Normal:**
                - `background: rgba(168, 212, 255, 0.70)`
                - **HEX:** `#A8D4FF` at 70%
            - **On Hover:**
                - `background: rgba(127, 211, 255, 0.85)`
                - **HEX:** `#7FD3FF` at 85%
            
            ---
            
            ### **Quick Action Buttons (Add, Remove)**
            
            - **Default:**
                - `background: rgba(247, 250, 255, 0.80)`
                - `color: #0A2540` *(Dark blue for icon/text)*
            - **Hover/Active:**
                - `background: rgba(127, 211, 255, 0.32)`
                - **Glow:** `box-shadow: 0 0 6px 2px #7FD3FF55`
            
            ---
            
            ### **Editable Fields (Liquid Glass Input)**
            
            - **Field Background:**
                - `background: rgba(247, 250, 255, 0.72)`
                - **HEX:** `#F7FAFF` at 72%
            - **Focus State:**
                - `border: 2px solid #A8D4FF`
                - `box-shadow: 0 0 6px 2px #7FD3FF88`
            - **Label/Text:**
                - `color: #1C2E3B` *(Charcoal blue for clarity)*
            - **Unit Hint:**
                - `color: #6A89A6` *(Soft slate blue)*
            
            ---
            
            ### **Status Badges**
            
            - **Warning (Critical):**
                - `background: #F54C4C` *(red)*
                - `color: #FFF`
            - **Warning (Caution):**
                - `background: #F8B037` *(yellow/orange)*
                - `color: #191919`
            - **Warning (Info):**
                - `background: #46C6EF` *(blue)*
                - `color: #fff`
            - **Lock/Read-Only:**
                - `background: #E6EAF1`
                - `color: #8395B0`
            - **Tooltip/Info:**
                - `background: #1E365B`
                - `color: #FFFFFF`
                - *Shadow:* `box-shadow: 0 2px 8px 0 #1E365B33`
            
            ---
            
            ### **Panel Shadow/Outer Glow**
            
            - **General:**
                - `box-shadow: 0 4px 40px 0 rgba(127, 211, 255, 0.14)`
            
            ---
            
            ## **Quick Visual Reference Table**
            
            | Element | HEX/Alpha Example | Usage Example |
            | --- | --- | --- |
            | Frosted Glass | #F7FAFF / 55–72% | Panel, Fields |
            | Liquid Glass Border | #A8D4FF / 70% | Panel Border, Handles |
            | Resize Handle Hover | #7FD3FF / 85% | Handle on Hover |
            | Quick Action Button | #F7FAFF / 80% | Add, Remove, etc. |
            | Quick Action Hover | #7FD3FF / 32% | Button on Hover |
            | Field Label/Text | #1C2E3B | Labels, Values |
            | Field Unit Hint | #6A89A6 | CFM, FPM, etc. |
            | Warning Critical | #F54C4C | Velocity exceed |
            | Warning Caution | #F8B037 | Near-limit alert |
            | Warning Info | #46C6EF | Info badge |
            | Lock Indicator | #E6EAF1 / #8395B0 | Read-only field badge |
            | Info Tooltip | #1E365B / #FFFFFF | Standard ref/info |
            | Panel Shadow | #7FD3FF / 14% | Subtle glow/outer shadow |
    
    ---
    
    - **6. Model Summary Panel (Result & Warnings)**
        
        ---
        
        **1. Naming**
        
        - **Element Name:** Model Summary Panel
            
            *(Use “panel” for clarity, as it’s a movable, dockable UI surface rather than a bar or pop-up.)*
            
        - **Trigger/Button Name (in Status Bar):** Summary
        
        ---
        
        **2. Core Purpose**
        
        > Primary function:
        > 
        > 
        > Provide a unified, system-by-system summary of computational results, fan sizing and CFM requirements (per SMACNA/ASHRAE/UL/local code), and a real-time warning log, with report export/copy and quick navigation to errors.
        > 
        
        ---
        
        **3. Behavior & Interaction**
        
        ### **A. Launch/Visibility**
        
        - **Appears when user clicks the “Summary” button** in the status bar.
        - **Dock effect:** Slides in (docks) at the bottom of the viewport above the status bar, or floats as a movable, resizable panel if undocked.
        - **Panel is always-on-top**, but does **not overlap** the drawn model or any core workspace controls.
        - **Pin option:** User may pin the panel in place; if pinned, panel avoids overlapping important on-screen content (auto reposition if needed).
        
        ### **B. Dismissal**
        
        - Close via “X” button, `Esc` key, or clicking outside (if floating).
        - **Docked state:** Panel collapses down/out of viewport with smooth animation.
        
        ---
        
        ### **4. Layout & Content**
        
        ### **A. System Selector**
        
        - **Dropdown or segmented control** at panel top.
        - User can switch between results for:
            - Each unique duct “system” (branch, rooftop, single main run, etc.)
            - All systems combined (aggregate)
        - **Selection state** is visually prominent and sticky until changed.
        
        ### **B. Live Results Section**
        
        - **Fan Requirement** (computed by system):
            - Fan static pressure (in. W.C. / Pa)
            - Fan airflow (CFM / L/s)
            - Recommended fan model (if implemented, else leave out)
        - **CFM Requirement** per room (for all rooms in system)
        - **Total Duct Pressure Loss** (for current system)
        - **Length and Size Summary** (total length, average/main size)
        - **Copy Button:** Copies the visible results as a computation report (plain text, rich text, or CSV).
        
        ### **C. Warnings Section**
        
        - **Warnings Badge/Icon:**
            - Shows total count (live), color-coded:
                - **Critical:** Red/white
                - **Caution:** Yellow/white
                - **Info:** Neutral/grey/white
        - **Codes Referenced:**
            - Shows all standards in use (SMACNA, ASHRAE, UL, Local).
            - Each warning references the specific code/rule/section, and what triggered it.
            - Local codes: Displayed if user inputted; otherwise, omitted.
        - **Warning List:**
            - **Critical** first, then caution, then info.
            - Each warning is actionable: **Clicking a warning zooms to/highlights** affected duct in the drawing (jump-to-error).
            - Affected portions of the ductwork in the canvas **glow** (yellow for caution, red for critical) as long as warnings persist.
            - If all OK, shows a “Compliant” badge with code references.
        
        ### **D. Tips Icon**
        
        - **Small “Tips” icon** (lightbulb or “?”) at upper-right corner of panel.
            - Click opens a context-aware mini-window with usage tips or best practices (placement: floating above/beside the icon, not overlapping key results).
        
        ---
        
        ### **5. Panel Style & Accessibility**
        
        ### **A. Visual Design**
        
        - **All-white/neutral palette**:
            - Panel BG: `rgba(255,255,255,0.60)` (Frosted glass)
            - Borders/shadow: `rgba(255,255,255,0.80)`
            - Section headers: #2D2D2D or #222428
            - Warnings: Use white badge w/ colored text & subtle colored glow only for contrast
            - Copy Button: Subtle outline, hover raises with 6% more opacity
            - Tips Icon: Light outline, hover effect
        - **Panel shadow**: Soft white, never “pop” blue or orange.
        
        ### **B. Accessibility**
        
        - **Keyboard navigation:**
            - Tab between system selector, live results, copy button, warning list, tips icon.
            - All warnings/fields accessible by screen reader, with ARIA labels referencing codes.
            - Focus outline is visible but subtle (e.g., 2px #E5E5E5)
        - **Responsive/dockable:**
            - Panel shrinks on small screens, scrolls if needed.
        
        ---
        
        ### **6. Example Layout (Wireframe Block)**
        
        ```
        ╭───────────────────────────── Model Summary Panel ─────────────────────────────╮
        │ System: [ Rooftop 1 ▼ ]         [ Copy Report ]               [ Tips (i) ]   │
        │                                                                             │
        │  Fan Requirement:           3200 CFM   |   2.1 in. W.C.                     │
        │  Pressure Loss:             1.7 in. W.C.   |   Total Length: 128 ft         │
        │  Room CFM:                  Room 101 – 300, Room 102 – 450, ...             │
        │                                                                             │
        │  Warnings  [ 2 Critical | 1 Caution ]  [Show Codes: SMACNA 2021 §5-1, ... ] │
        │  ──────────────────────────────────────────────────────────────────────────  │
        │   [!] Velocity exceeds SMACNA Table 4-1 in branch (Duct B), jump-to-error    │
        │   [!] Pressure loss over 2 in. W.C. in Main Run, jump-to-error               │
        │   [⚠] CFM below room spec in Room 103, jump-to-error                         │
        │   [✓] Compliant with all referenced codes (if no warnings)                   │
        ╰──────────────────────────────────────────────────────────────────────────────╯
        
        ```
        
        ---
        
        ### **7. Rationale**
        
        - **Why this approach:**
            - Keeps all essential *model-level* results and compliance in one persistent place, without clutter or redundancy.
            - *System selector* supports real HVAC design workflow (multiple systems per project).
            - *Copy button* streamlines reporting/export.
            - *Warnings* map clearly to drawn elements, using real codes—improves traceability and compliance.
            - *Tips* icon provides just-in-time guidance, not cluttering the main results.
        
        ---
        
        ### **8. Interactivity Recap**
        
        - **Model Summary Panel** appears docked or floating on click, always above Status Bar.
        - **System selector** toggles between system results.
        - **Copy**: Instantly copies formatted computation results.
        - **Warnings**: Live, color-coded, jump-to-error in canvas, fully actionable.
        - **Tips**: Always available, never intrusive.
        - **Pin:** Keeps panel persistent if desired, but intelligently avoids overlap.
        - **Closes** with X, Esc, or click-away.
    
    ---
    
    - **7. Status Bar**
        
        # **Status Bar**
        
        ---
        
        ## **Overview**
        
        The **Status Bar** is a single-line, always-visible UI strip, docked at the absolute bottom of the Air Duct Sizer 3D Tool workspace.
        
        It serves as the command center for global actions, state, and quick reference—**never for navigation or tool switching**.
        
        **Key features:**
        
        - Minimal vertical height (≤40 px), never wraps or grows vertically
        - All elements strictly horizontally aligned; adjusts dynamically as elements expand/collapse
        - Maximum accessibility and professional clarity
        - All icons, controls, and states have descriptive ARIA labels and tooltips
        
        ---
        
        ## **Layout: Left to Right Order (Final)**
        
        ```
        ╭───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────╮
        │ [⏳▾ Version Control] [● Save Status] [● Connection] [◩ Grid Toggle] [⚠️ Warning Glow Toggle] [▤ Model Summary] [🔍 Search…] [Units ▼] │
        ╰───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────╯
        
        ```
        
        - **Single line**
        - **No stacking or wrapping, ever**
        - **Expanding elements shift siblings smoothly to avoid overlap**
        - **All controls ARIA-labeled, tooltipped, and tab-order consistent**
        - **Docked to the absolute bottom of the viewport**
        
        ---
        
        ## **Element-by-Element Specification**
        
        ---
        
        ### **1. Version Control**
        
        - **Expert Name:** Version Control
        - **Icon:** ⏳ with caret/flyout indicator (▾)
        - **Type:** Flyout/Popover panel (expands up or overlays upward above bar)
        - **Function:**
            - View version history (auto-save, manual saves, restore points)
            - Preview and restore previous states
        - **Behavior:**
            - Click opens version list (timestamps, labels, actions)
            - Only one flyout open at a time; keyboard navigable
        - **Tooltip:** “Version history: view and restore previous saves”
        - **Accessibility:** ARIA role=“menu/button”; labeled by icon and tooltip; full keyboard support
        - **Responsive Behavior:** Collapses to icon-only on narrow widths; always accessible by tabbing
        
        ---
        
        ### **2. Save Status**
        
        - **Expert Name:** Save Status
        - **Icon:** Animated dot ● (plus text, e.g. “All changes saved”)
        - **Type:** Status chip (passive for auto-save; active button if manual save)
        - **States:**
            - **Auto-Save:** “All changes saved ●” (green dot, pulsing if saving in progress)
            - **Manual Save:** “Save Now” (active, highlighted when unsaved changes)
        - **Tooltip:** “Auto-save enabled” or “Manual save—click to save now”
        - **Accessibility:** ARIA live region; full keyboard/reader support
        - **Responsive Behavior:** Text may collapse to just icon if bar contracts
        
        ---
        
        ### **3. Connection Status**
        
        - **Expert Name:** Connection Status
        - **Icon:** Single dot ●
        - **Colors:**
            - Online: #00C853 (Green)
            - Warning: #FF9100 (Orange)
            - Offline: #BDBDBD (Grey)
        - **Tooltip:** “Connection: Online / Warning / Offline”
        - **Accessibility:** ARIA role=“status”; screen reader announced on state change
        - **Responsive Behavior:** Always visible, shifts position if other elements expand
        
        ---
        
        ### **4. Grid Toggle**
        
        **A. Naming & Iconography**
        
        - **Expert Name:** Grid Toggle
        - **UI Label (ARIA/Tooltip):** “Toggle grid overlay”
        - **Icon:** Minimalist 3x3 square grid (Apple/Adobe/Figma style)
            - **Unicode fallback:** ◩ or SVG grid
        - **Placement:** Immediately right of Connection Status on status bar
        
        **B. UI States**
        
        - **On:**
            - Icon is filled (white fill, #222 border), subtle blue border or background glow (e.g., #90CAF9 at 25% opacity)
            - Tooltip: “Hide grid overlay”
        - **Off:**
            - Icon outlined only (no fill), normal border (#BDBDBD)
            - Tooltip: “Show grid overlay”
        
        **C. Behavior**
        
        - **Click:** Toggles overlay gridlines (aligned with 3D canvas plane, default grid spacing set in project or settings panel)
        - **State Persistence:** Remembers state for user/session (restores on reload)
        - **Animation:** Grid fades in/out (200 ms fade), icon animates subtle glow when toggled on
        - **Feedback:** ARIA live region announces “Grid overlay enabled/disabled”
        - **Tab Order:** Tab to select, space/enter toggles
        
        **D. Accessibility**
        
        - **ARIA role:** `role="switch" aria-checked="true|false"`
        - **Label:** “Toggle grid overlay”
        - **Keyboard:** Full tab/space/enter support
        
        **E. Rationale**
        
        - **Why:** Engineers and designers benefit from visual alignment aids when drawing ducts, equipment, or reference geometry.
        - **Minimal icon:** Recognized instantly in CAD/BIM/3D software.
        - **Never occludes content:** Grid is faint, always below drawn elements, color-contrasted for both light/dark canvas modes.
        
        **F. Visual Spec**
        
        - **Icon On:**
            - White squares (#FFFFFF) with faint blue border (#90CAF9)
            - 24×24 px, touch target 40×40 px
            - Blue glow or background fill for active
        - **Icon Off:**
            - No fill, border only (#BDBDBD)
        
        ---
        
        ### **5. Warning Highlight Toggle** *(“Warning Glow”)*
        
        **A. Naming & Iconography**
        
        - **Expert Name:** Warning Highlight Toggle
        - **UI Label (ARIA/Tooltip):** “Toggle warning glow”
        - **Icon:** Triangle warning icon (⚠️ or custom SVG with subtle drop shadow)
        - **Placement:** Right of Grid Toggle, before Model Summary
        
        **B. UI States**
        
        - **On:**
            - Icon glows yellow (#FFEB3B at 60% opacity), possibly animated pulse
            - Tooltip: “Highlight all ducts with warnings”
        - **Off:**
            - Icon outlined, no fill, standard border (#BDBDBD)
            - Tooltip: “Disable warning highlight”
        
        **C. Behavior**
        
        - **Click:**
            - **On:** All duct elements or nodes with active warnings glow with a colored outline/glow (red/yellow as appropriate for severity)
            - **Off:** No additional glow applied to ductwork, only base colors visible
        - **Live Feedback:**
            - As warnings resolve/appear, affected ducts animate their glow in/out (200 ms)
        - **Animation:** Subtle pulsing glow for critical (red), soft glow for caution (yellow)
        - **Persistence:** State retained for session; restores on reload
        - **Feedback:** ARIA region announces “Warning highlight enabled/disabled”
        - **Tab Order:** Tab/space/enter control
        
        **D. Accessibility**
        
        - **ARIA role:** `role="switch" aria-checked="true|false"`
        - **Label:** “Toggle warning highlight on ducts”
        - **Keyboard:** Tab/space/enter fully supported
        
        **E. Rationale**
        
        - **Why:** Instantly visualizes compliance/risk areas without opening Model Summary or popovers; reduces missed warnings.
        - **Best Practice:** Engineers expect direct error highlighting—this toggle streamlines QA/validation during rapid design/edits.
        
        **F. Visual Spec**
        
        - **Icon On:**
            - Triangle filled yellow (#FFEB3B), faint yellow glow or pulse around icon
            - 24×24 px, 40×40 px touch area
        - **Icon Off:**
            - Outlined triangle, no fill, grey border (#BDBDBD)
        - **Glow on Model:**
            - Ducts: Shadow/glow color matches warning (red for critical, yellow for caution), 4–8 px soft outer glow
            - Animation: 200 ms fade in/out, pulse for new critical warnings
        
        ---
        
        ### **6. Model Summary**
        
        - **Expert Name:** Model Summary
        - **Icon:** ▤ (dashboard/summary bars)
        - **Type:** Button (with active/focused state)
        - **Function:**
            - Opens Model Summary dock/panel (system metrics, warnings, code compliance)
            - Includes: Live results by system, selection for systems, copy button, warning summary, jump-to-error, tips, compliance sources (SMACNA, ASHRAE, UL, user inputted local codes)
            - Color-coded warning badges: Red (critical), Yellow (caution), Grey (info)
            - Panel appears above status bar, never blocks bar or main canvas
        - **Tooltip:** “Show model summary and compliance results”
        - **Accessibility:** ARIA role=“button”; labeled; keyboard and focusable
        - **Responsive Behavior:** Button shrinks to icon-only on smaller widths
        
        ---
        
        ### **7. Quick Search**
        
        - **Expert Name:** Quick Search
        - **Icon:** 🔍 (magnifying glass, pill-style input)
        - **Type:** Expanding input
        - **Function:**
            - Click or press `/` to expand for searching tips, help, or docs
            - Suggestions show live as user types
            - Results accessible with keyboard
        - **Tooltip:** “Search help, tips, and documentation”
        - **Accessibility:** ARIA role=“search”; live region; keyboard navigation; tab order
        - **Responsive Behavior:** Collapses to icon on bar width reduction, but expands smoothly when used; all elements slide to accommodate
        
        ---
        
        ### **8. Units Selector**
        
        - **Expert Name:** Units Selector
        - **Icon:** Dropdown with label (“Imperial ▼” or “SI ▼”); ruler icon optional
        - **Type:** Dropdown menu
        - **Function:**
            - Click to switch global units (Imperial/SI/custom)
            - Updates all tool fields and results instantly
        - **Tooltip:** “Change units: Imperial, SI, …”
        - **Accessibility:** ARIA role=“combobox”; keyboard navigable
        - **Responsive Behavior:** Text may shorten to icon or initials (“in”, “mm”) as bar narrows
        
        ---
        
        ## **Dynamic Behavior & Responsiveness**
        
        - **Single-line guarantee:** All elements scale, contract, or show only icons as needed, but **never stack or wrap.**
        - **Expanding elements (e.g., Search, Model Summary):**
            - When expanded, adjacent controls shift smoothly to accommodate width change (with minimum/maximum bounds to prevent overlap).
            - If multiple elements are expanded, priority order is maintained (core state controls always visible).
        - **Consistent tab order and ARIA live region announcements**
        - **Panel/flyouts always open above bar, never occlude bar or main canvas**
        
        ---
        
        ## **Visual Design & Color**
        
        - **Background:** White (#FFFFFF) with 92% opacity (frosted glass blur effect)
        - **Border:** Subtle “liquid glass” (#E0E0E0, 18% opacity)
        - **Text & Icons:** Charcoal (#222222) for highest contrast
        - **Active/Focus States:**
            - Slightly increased border/blur on hover/focus
            - Model Summary shows a faint accent glow when open
            - Quick Search expands with gentle animation
        - **Color cues for status:**
            - Connection: Green / Orange / Grey
            - Save: Green (saved), Orange (saving), Red (error)
            - Warnings: As above (Red/Yellow/Grey)
        
        ---
        
        ## **Accessibility**
        
        - **Keyboard:**
            - All controls accessible and focusable in tab order left ➔ right
            - Quick Search can be focused with `/`
            - Dropdowns navigable via arrows/enter
        - **Screen Readers:**
            - Descriptive ARIA labels on all elements
            - State changes announced live (e.g., connection change, save status)
        - **Tooltips:**
            - On hover/focus, descriptive tooltips for every element
        
        ---
        
        ## **Rationale & Best Practice Alignment**
        
        - **Professional conventions:**
            - Single-line status bar mirrors Figma, Adobe, macOS, CAD suites for engineering clarity
            - Left-to-right priority: file/actions → save/state → output/metrics → search → units
        - **No navigation, drawing, or view controls**: Only workspace state and context actions.
        - **No notification center unless future need arises**
        - **Dynamic expansion:** Elements adjust seamlessly—never covering or wrapping the bar.
        
        ---
        
        **This documentation is the authoritative reference for the Status Bar in the Air Duct Sizer 3D Tool, meeting all requirements for professional-grade, high-performance engineering applications.**
        
    
    ---
    
    - **8. View Cube**
        
        # **Air Duct Sizer 3D Tool — View Cube Specification (Final)**
        
        ---
        
        ## **1. Naming**
        
        - **Element Name:** View Cube
        - **Expert Rationale:**
            
            The term "View Cube" is universally recognized in 3D CAD, BIM, and design tools (e.g., Autodesk, SketchUp, Revit) as a standard for orientation control, maximizing clarity for engineers and advanced users.
            
        
        ---
        
        ## **2. Placement**
        
        - **Location:**
            
            **Top-right corner** of the 3D workspace canvas.
            
            - Always overlays the 3D canvas (not docked to any panel).
            - Floating margin (suggested: 24 px from top/right edge).
            - Never overlaps persistent UI panels (context panels, status bar).
        
        ---
        
        ## **3. Appearance & Design**
        
        - **Form:**
            - 3D cube (or, optionally, rounded cuboid) with labeled faces.
            - Size: 56 × 56 px (standard; scalable for accessibility).
        - **Face Labels:**
            - “Top”, “Front”, “Right”, “Left”, “Back”, “Bottom” (at least Top/Front/Right always visible)
            - Isometric edge or corner visually emphasized.
        - **Color:**
            - **Faces:** Light glassy white (#F9FAFB, 90% opacity) with subtle shadow
            - **Labels:** Deep grey (#222222), bold, always visible on all backgrounds
            - **Outline:** Liquid glass border (#E0E0E0, 25% opacity)
        - **Opacity:**
            - **Default:** 50%
            - **On hover/focus:** 100%
            - **On drag/interaction:** 100%
        - **Interaction Cursor:**
            - Default: pointer/hand
            - On hover: faces highlight with faint color (e.g., #FF9800 for current, #90CAF9 for hover)
        
        ---
        
        ## **4. Behavior & Functionality**
        
        - **Action:**
            - **Clicking a face:** Instantly rotates the camera/view to the respective orthogonal view (Top, Front, Right, etc.)
            - **Clicking an edge/corner:** Rotates to nearest isometric/perspective view
        - **Animated Feedback:**
            - Smooth 3D animation rotates the model and the View Cube in sync (≤300 ms, matches CAD standards)
        - **Focus:**
            - Cube remains above main canvas and 3D content at all times.
            - Never blocks interaction with selected objects or UI overlays (z-order is above 3D, below modal panels).
        - **Responsiveness:**
            - Scales for high DPI, tablets, touchscreens (minimum 44×44 px tap target)
        
        ---
        
        ## **5. Accessibility**
        
        - **Keyboard:**
            - Tab-to-focus enabled (focus ring appears around cube)
            - Arrows to move selection (cycles faces/edges)
            - Enter/Space applies view change
        - **ARIA:**
            - role=“toolbar”, labels for each face (“Set view: Top”, etc.)
            - Announce current view on change (“View set to: Right”)
        - **Contrast:**
            - Face label contrast ≥4.5:1 on all backgrounds
        - **Tooltip:**
            - On hover/focus, tooltips such as: “Click to set view: Top”
        
        ---
        
        ## **6. Rationale**
        
        - **Instant spatial context:** Engineers need to orient models quickly, especially when troubleshooting or aligning ductwork.
        - **Universal UI convention:** Mirrors industry leaders (Autodesk, BricsCAD, Fusion 360) for zero learning curve.
        - **Unobtrusive:** Default semi-transparent style ensures cube never obscures workspace or content, but is always available.
        - **Keyboard/touch:** Accessible for all users and devices, including mouse, touch, and keyboard workflows.
        
        ---
        
        ## **7. Example Wireframe (ASCII)**
        
        ```
           ┌───────────────────────────── Air Duct Sizer 3D Canvas ─────────────────────────────┐
           │                                                                                   │
           │                                                      ┌───────┐                    │
           │                                                      │ Top   │  ◀── View Cube     │
           │                                                      │  ┌─┐  │                    │
           │                                                      │ F │R│ │                    │
           │                                                      └─┘─┘─┘                    │
           │                                                                                   │
           └───────────────────────────────────────────────────────────────────────────────────┘
        
        ```
        
        - **Top-right corner, floats above 3D canvas**
        - **Faces clearly labeled and visible**
        
        ---
        
        ## **Color Codes**
        
        - **Face Background:** #F9FAFB, 90% opacity (rgba(249,250,251,0.9))
        - **Face Label/Text:** #222222
        - **Active Face Hover:** #FF9800 (Orange, only subtle)
        - **Cube Outline:** #E0E0E0, 25% opacity (rgba(224,224,224,0.25))
        
        ---
        
        ## **Exclusions**
        
        - **Never docked to panel or moved by user**
        - **No custom view labels (unless user can configure)**
        - **No animation > 300 ms**
        
        ---
        
        ## **Summary Table**
        
        | Property | Value |
        | --- | --- |
        | Name | View Cube |
        | Placement | Top-right 3D canvas (floating, never blocked) |
        | Size | 56×56 px (scalable, min 44×44 px for touch) |
        | Faces | Top, Front, Right, (others as needed) |
        | Opacity | 50% default, 100% hover/active |
        | Labels | #222222 (deep grey) |
        | Face BG | #F9FAFB (white glass), 90% opacity |
        | Border | #E0E0E0, 25% opacity |
        | Accessibility | Keyboard, ARIA, tooltips |
    
    ---
    
    - **Interaction Workflow**
        - **Draw Phase:**
            - Toggle Pencil ON → draw stick lines (left-click); right-click to pan at any time
        - **Build Phase:**
            - Click *Build Ductwork* (on Results & Warnings Bar) → generates 3D ducts
            - Any issues appear immediately in the bar and warnings overlay
        - **Edit/Inspect:**
            - Select duct/fitting → pop-up for properties
        - **Export/Status:**
            - All file actions, calibration, and help accessed via Status Bar (bottom)
            - System notifications and health always visible
    
    ---
    
- **Drawing Elements**
    - **Element definitions:** Ducts, Fittings, Equipment, Rooms
    - **Full canonical list of supported Fittings (with expansion placeholder)**
    - **How drawn lines behave (centerlines, snapping, editing, states)**
    - **Interaction/UX conventions**
    
    ---
    
    # **Drawing Elements Specification — Air Duct Sizer 3D Tool**
    
    ---
    
    ## **1. Element Definitions & Roles**
    
    ### **A. Duct**
    
    - **Type:** Linear segment (stick/centerline before extrusion)
    - **Purpose:** Represents the main airflow path; becomes a 3D duct upon conversion.
    - **Behavior:** Always starts/ends at a node; can be straight or multi-segmented (not freeform curves for this MVP).
    
    ### **B. Fittings**
    
    - **Type:** Junction or directional change component
    - **Purpose:** Connects duct segments, allows transitions, splits, or directional changes.
    - **Behavior:** Auto-inserted at geometry nodes (e.g., intersection, angle) OR user-selected for manual override.
    
    ### **Canonical Fittings List (MVP)**
    
    *(All auto-named on insertion; user can rename/edit properties after generation)*
    
    | Category | Fitting Type | Typical Insertion Trigger | Properties Editable? |
    | --- | --- | --- | --- |
    | Directional Change | Elbow (90°, 45°) | Angle between segments | Yes |
    | Junction | Tee | 3-way intersection | Yes |
    | Junction | Cross | 4-way intersection | Yes |
    | Transition | Reducer/Enlarger | Change in duct size | Yes |
    | Transition | Offset | Two parallel ducts offset | Yes |
    | Control | Damper | Inserted at user-selected segment | Yes |
    | Terminal | End Cap | Segment ends (not open to a room) | Yes |
    | Specialty | Access Door | User-inserted only | Yes |
    | Adapter | Round-to-Rect | At transition between shapes | Yes |
    | Adapter | Rect-to-Round | At transition between shapes | Yes |
    
    **(Future/Pro: Lateral, Saddle Tap, Wye, Spin-In, Volume Box, etc.)**
    
    ---
    
    ### **C. Equipment**
    
    - **Type:** Discrete device node
    - **Purpose:** HVAC device at duct ends/midpoints (e.g., fans, air handlers, diffusers)
    - **Behavior:** User-placed; connects to duct segments; has properties (CFM, static pressure, etc.)
    
    | Equipment Type | Placement | Key Properties (MVP) |
    | --- | --- | --- |
    | Supply Fan | Duct start/end | CFM, static pressure |
    | Return Fan | Duct start/end | CFM, static pressure |
    | Air Handling Unit | In-line, branch | CFM, ESP, filter type |
    | Diffuser | Duct terminal | CFM, noise criteria |
    | VAV Box | In-line/terminal | CFM, setpoint |
    | Exhaust Fan | Duct end | CFM, static pressure |
    
    *(Future: Reheat Coil, HEPA Filter, Fire/Smoke Damper, etc.)*
    
    ---
    
    ### **D. Room**
    
    - **Type:** Polygon or box region (represented as “room” node or polygon)
    - **Purpose:** Represents zone or space with airflow requirement
    - **Behavior:** Snap to duct terminal OR as named polygon; displays required/actual CFM.
    
    | Room Property | Type | Usage |
    | --- | --- | --- |
    | Room Name | Text | User- or auto-assigned |
    | Room Area | Number | For future load calcs |
    | Required CFM | Number | Based on code/ASHRAE table |
    | Supplied CFM | Number | Calculated, always shown |
    
    ---
    
    ## **2. Drawing & Behavior of Lines (Centerlines)**
    
    ### **A. Creation**
    
    - **Trigger:** Pencil Tool ON (FAB)
    - **Interaction:**
        - **Left-click:** Place node (start or continue line)
        - **Double-click:** End current line/segment
        - **Snap:** Lines snap to grid, existing nodes, or equipment/room
        - **Shift key:** Constrains angle to 0/45/90° for orthogonal/diagonal lines
        - **Right-click:** Pan, even while drawing
    
    ### **B. Behavior and States**
    
    - **Visual State:**
        - **Active Drawing:** Line is orange (#FF9800), semi-opaque as it’s being drawn
        - **Completed (Unselected):** Neutral grey (#BDBDBD), 100% opacity
        - **Selected:** Blue highlight (#1976D2) plus nodes/handles visible
        - **Warning/Invalid:** Red or yellow glow if velocity/pressure limit exceeded (matches warnings bar/panel)
    - **Node Types:**
        - **Standard Node:** White fill, blue border (when selected)
        - **Fitting Node:** Special shape/icon (circle for elbows, tee, etc.)
        - **Equipment Node:** Device icon at node
    - **Editing:**
        - **Select:** Click on line or node (Pencil OFF)
        - **Move:** Drag node (drags connected segments)
        - **Add Node:** Click on line to add mid-node
        - **Delete Segment/Node:** Select, then press `Del` or context action
        - **Properties:** Select → edit in Context Property Panel
    - **Snap & Constraint:**
        - **Snap-to-grid**: If grid enabled, cursor snaps to grid intersections
        - **Smart Snap:** Auto-aligns to other nearby lines or endpoints
        - **Connection Rules:** No “floating” lines—all lines must start/end at room, equipment, or another duct node (warn if not connected)
    
    ### **C. Converting to 3D**
    
    - **Action:** “Build Ductwork” button in Results/Warnings Bar or Calculation Bar
    - **Effect:** All centerlines are extruded into 3D duct/fitting geometry using default/user-set properties
    - **Fittings:** Auto-inserted at each relevant node
    - **Validation:** Warns if open/unconnected lines, overlaps, code violations
    
    ---
    
    ## **3. Element Metadata & Properties**
    
    - **Duct:**
        - Name/Tag (auto/incremental, e.g., D-101)
        - Size (W x H or Dia)
        - Material (steel, aluminum, etc.)
        - Insulation (Y/N, thickness)
        - Static pressure loss (auto-calc)
        - Flow rate (auto-calc or assigned)
    - **Fitting:**
        - Type/subtype
        - Connected ducts (names)
        - Loss coefficient (K-factor, auto from table)
    - **Equipment:**
        - Name/Tag
        - Device type
        - Design/required CFM, actual CFM
        - Status/notes
    - **Room:**
        - Name
        - Area
        - Required CFM
        - Actual supplied CFM
        - Code reference (for compliance)
    
    ---
    
    ## **4. Accessibility & Usability**
    
    - **All drawing/editing features are keyboard-accessible:**
        - Tab to cycle elements
        - Arrow keys to move selected node/segment
        - Enter to edit properties
    - **Visual states have high contrast**
    - **Tooltips and ARIA labels** for all controls and drawn elements
    
    ---
    
    ## **5. Professional Rationale**
    
    - **Mimics professional CAD/BIM drawing but optimized for duct systems**
    - **Granular element filter** (see prior doc) ensures efficient workflows and error prevention
    - **Auto-insertion and smart snapping** support both rapid design and code compliance
    
    ---
    
    ## **6. Example Visual Guide**
    
    ```
    [Room A]—(Duct)—[Elbow]—(Duct)—[Tee]—(Duct)—[Fan]
               │
            (Branch)
             [Room B]
    
    ```
    
    - Blue: selected, Orange: drawing, Red/yellow: warning, Grey: normal
    
    ---
    
    **This documentation is the canonical specification for all Drawing Elements, fitting types, and centerline behaviors in the Air Duct Sizer 3D Tool MVP. All drawing behaviors, editing options, and fitting/equipment metadata are covered for engineering-grade implementation and team handoff.**
    
    Let me know if you want visuals or a rendered element sample!
    
- **Drawing Elements Filter Panel**
    
    # **Drawing Elements Filter Panel — Hierarchical Specification**
    
    ---
    
    ## **Purpose**
    
    The Drawing Elements Filter Panel enables users to **filter and target specific element types** for selection and editing in the 3D workspace, supporting both high-level categories and granular item selection.
    
    This prevents accidental modifications, accelerates batch actions, and mirrors industry-standard engineering workflows.
    
    ---
    
    ## **Naming**
    
    - **Canonical Name:** Drawing Elements Filter Panel
    - **UI Label (ARIA):** “Drawing Elements Filter”
    - **Retracted Icon:** Filter/Funnel (Material “filter_list”)
    - **Expanded Header:** “Drawing Elements” + icon
    
    ---
    
    ## **Placement**
    
    - **Vertical Anchor:** Directly below the Drawing Tool FAB, right edge of canvas.
    - **Spacing:** 8–16px below FAB, always visible when collapsed (icon only).
    
    ---
    
    ## **States & Interactivity**
    
    ### **A. Retracted State**
    
    - **Icon Only:** Circular filter icon (~44x44px), frosted glass, subtle shadow.
    - **Tooltip:** “Filter selectable element types”
    - **Keyboard/Pointer activation:** Expands panel.
    
    ### **B. Expanded State**
    
    - **Panel appears leftward/downward** from icon anchor (180ms animation).
    - **Header:** “Drawing Elements” (bold, 16px) + filter icon.
    - **Main Category Checkboxes:** (all checked by default)
        - [✔] **Duct**
        - [✔] **Fitting**
        - [✔] **Equipment**
        - [✔] **Room**
    - **Expand/Collapse Arrows:** Each category can be expanded (▸/▾) to show a detailed list:
        - **Duct:** Sub-types (e.g., Main Duct, Branch Duct, Return Duct, etc.)
        - **Fitting:** (e.g., Elbow, Tee, Reducer, Damper…)
        - **Equipment:** (e.g., Fan, AHU, Diffuser…)
        - **Room:** (e.g., Room 101, Lab A, Office 2.1… auto-populated from project data)
    - **Sub-list checkboxes:** Each item can be individually checked/unchecked.
    - **Reset All:** Link at the bottom to re-check all.
    - **State Persistence:** Remembers per project/session.
    - **Collapse triggers:** Click-away, Esc key, keyboard navigation.
    
    ---
    
    ## **Accessibility**
    
    - **ARIA structure:**
        - Panel: `role="region"` labeled “Drawing Elements Filter”
        - Main checkboxes: `role="checkbox"`, labeled with category and state
        - Expand/collapse: `aria-expanded`, full keyboard support
        - Each sub-item: labeled with name/type
    - **Tab, arrows:** For moving between controls; Space/Enter to toggle.
    - **Panel close:** Esc key returns focus to filter icon.
    
    ---
    
    ## **Visual & Style Guide**
    
    | Element | Style / Color |
    | --- | --- |
    | Panel Background | Frosted white (#FFFFFFEE), rounded 16px corners |
    | Border | Liquid glass #E0E0E0, 18% opacity, 1px |
    | Header Text/Icon | Charcoal #222222, filter icon #B0BEC5 |
    | Checkbox (on) | Blue #1565C0, white check, blue border |
    | Checkbox (off) | Grey #B0BEC5 outline |
    | Expand/Collapse | Arrow #1976D2, rotates 90° when expanded |
    | Sub-item | Indented, lighter text (#424242), hover blue |
    | Reset Link | Blue #1976D2, underlined on hover |
    
    ---
    
    ## **Responsiveness**
    
    - **Panel always stays within viewport.**
    - **Expands vertically up to 320px, scrollable if too many sub-items.**
    - **Remembers last expanded/collapsed state per session.**
    
    ---
    
    ## **Behavior Example**
    
    1. **Panel retracted:** Just a filter icon below FAB.
    2. **User clicks icon:** Panel expands, showing all four main checkboxes.
    3. **User clicks arrow beside “Room”:** Expands to show all room names, each with a checkbox.
    4. **User unchecks “Lab A”:** This room becomes unselectable in 3D canvas.
    5. **User clicks Reset:** All main and sub-items are checked again.
    6. **Panel collapses:** State is saved.
    
    ---
    
    ## **UX Rationale**
    
    - **Granular control**: Allows selection/filtering at both type and instance level.
    - **Error prevention**: Prevents accidental edits to the wrong system or room.
    - **Professional alignment**: Mimics layer/visibility/selection filters in CAD/BIM.
    
    ---
    
    ## **Authoritative Summary**
    
    > The Drawing Elements Filter Panel is a right-anchored, retractable utility below the Drawing Tool FAB.
    > 
    > 
    > It allows users to filter and select by main element type (Duct, Fitting, Equipment, Room) and, via expandable lists, by individual item.
    > 
    > All states, labels, and focus behaviors are fully accessible and persist per session.
    > 
    > The design follows best-in-class engineering UI patterns for both speed and precision.
    > 
    
    ---
    
- **PDF Import Feature**
    - [ ]  Tool must enable pdf import for front view and plan view
    - [ ]  Tool must have a PDF import layout wizard capable of pop-up
        - [ ]  Wizard must have scaling input field - Canvas scale must follow the user’s input and reflect to the scaling field in the tool screen.
        - Codes for pop-up hover screen
            - morphing-popover
                
                ```tsx
                'use client';
                
                import {
                  useState,
                  useId,
                  useRef,
                  useEffect,
                  createContext,
                  useContext,
                  isValidElement,
                } from 'react';
                import {
                  AnimatePresence,
                  MotionConfig,
                  motion,
                  Transition,
                  Variants,
                } from 'motion/react';
                import { useClickOutside } from '@/hooks/use-click-outside';
                import { cn } from '@/lib/utils';
                
                const TRANSITION = {
                  type: 'spring',
                  bounce: 0.1,
                  duration: 0.4,
                };
                
                type MorphingPopoverContextValue = {
                  isOpen: boolean;
                  open: () => void;
                  close: () => void;
                  uniqueId: string;
                  variants?: Variants;
                };
                
                const MorphingPopoverContext =
                  createContext<MorphingPopoverContextValue | null>(null);
                
                function usePopoverLogic({
                  defaultOpen = false,
                  open: controlledOpen,
                  onOpenChange,
                }: {
                  defaultOpen?: boolean;
                  open?: boolean;
                  onOpenChange?: (open: boolean) => void;
                } = {}) {
                  const uniqueId = useId();
                  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
                
                  const isOpen = controlledOpen ?? uncontrolledOpen;
                
                  const open = () => {
                    if (controlledOpen === undefined) {
                      setUncontrolledOpen(true);
                    }
                    onOpenChange?.(true);
                  };
                
                  const close = () => {
                    if (controlledOpen === undefined) {
                      setUncontrolledOpen(false);
                    }
                    onOpenChange?.(false);
                  };
                
                  return { isOpen, open, close, uniqueId };
                }
                
                export type MorphingPopoverProps = {
                  children: React.ReactNode;
                  transition?: Transition;
                  defaultOpen?: boolean;
                  open?: boolean;
                  onOpenChange?: (open: boolean) => void;
                  variants?: Variants;
                  className?: string;
                } & React.ComponentProps<'div'>;
                
                function MorphingPopover({
                  children,
                  transition = TRANSITION,
                  defaultOpen,
                  open,
                  onOpenChange,
                  variants,
                  className,
                  ...props
                }: MorphingPopoverProps) {
                  const popoverLogic = usePopoverLogic({ defaultOpen, open, onOpenChange });
                
                  return (
                    <MorphingPopoverContext.Provider value={{ ...popoverLogic, variants }}>
                      <MotionConfig transition={transition}>
                        <div
                          className={cn('relative flex items-center justify-center', className)}
                          key={popoverLogic.uniqueId}
                          {...props}
                        >
                          {children}
                        </div>
                      </MotionConfig>
                    </MorphingPopoverContext.Provider>
                  );
                }
                
                export type MorphingPopoverTriggerProps = {
                  asChild?: boolean;
                  children: React.ReactNode;
                  className?: string;
                } & React.ComponentProps<typeof motion.button>;
                
                function MorphingPopoverTrigger({
                  children,
                  className,
                  asChild = false,
                  ...props
                }: MorphingPopoverTriggerProps) {
                  const context = useContext(MorphingPopoverContext);
                  if (!context) {
                    throw new Error(
                      'MorphingPopoverTrigger must be used within MorphingPopover'
                    );
                  }
                
                  if (asChild && isValidElement(children)) {
                    const MotionComponent = motion.create(
                      children.type as React.ForwardRefExoticComponent<any>
                    );
                    const childProps = children.props as Record<string, unknown>;
                
                    return (
                      <MotionComponent
                        {...childProps}
                        onClick={context.open}
                        layoutId={`popover-trigger-${context.uniqueId}`}
                        className={childProps.className}
                        key={context.uniqueId}
                        aria-expanded={context.isOpen}
                        aria-controls={`popover-content-${context.uniqueId}`}
                      />
                    );
                  }
                
                  return (
                    <motion.div
                      key={context.uniqueId}
                      layoutId={`popover-trigger-${context.uniqueId}`}
                      onClick={context.open}
                    >
                      <motion.button
                        {...props}
                        layoutId={`popover-label-${context.uniqueId}`}
                        key={context.uniqueId}
                        className={className}
                        aria-expanded={context.isOpen}
                        aria-controls={`popover-content-${context.uniqueId}`}
                      >
                        {children}
                      </motion.button>
                    </motion.div>
                  );
                }
                
                export type MorphingPopoverContentProps = {
                  children: React.ReactNode;
                  className?: string;
                } & React.ComponentProps<typeof motion.div>;
                
                function MorphingPopoverContent({
                  children,
                  className,
                  ...props
                }: MorphingPopoverContentProps) {
                  const context = useContext(MorphingPopoverContext);
                  if (!context)
                    throw new Error(
                      'MorphingPopoverContent must be used within MorphingPopover'
                    );
                
                  const ref = useRef<HTMLDivElement>(null);
                  useClickOutside(ref, context.close);
                
                  useEffect(() => {
                    if (!context.isOpen) return;
                
                    const handleKeyDown = (event: KeyboardEvent) => {
                      if (event.key === 'Escape') context.close();
                    };
                
                    document.addEventListener('keydown', handleKeyDown);
                    return () => document.removeEventListener('keydown', handleKeyDown);
                  }, [context.isOpen, context.close]);
                
                  return (
                    <AnimatePresence>
                      {context.isOpen && (
                        <>
                          <motion.div
                            {...props}
                            ref={ref}
                            layoutId={`popover-trigger-${context.uniqueId}`}
                            key={context.uniqueId}
                            id={`popover-content-${context.uniqueId}`}
                            role='dialog'
                            aria-modal='true'
                            className={cn(
                              'absolute overflow-hidden rounded-md border border-zinc-950/10 bg-white p-2 text-zinc-950 shadow-md dark:border-zinc-50/10 dark:bg-zinc-700 dark:text-zinc-50',
                              className
                            )}
                            initial='initial'
                            animate='animate'
                            exit='exit'
                            variants={context.variants}
                          >
                            {children}
                          </motion.div>
                        </>
                      )}
                    </AnimatePresence>
                  );
                }
                
                export { MorphingPopover, MorphingPopoverTrigger, MorphingPopoverContent };
                
                ```
                
            - use-click-outside
                
                ```tsx
                import { RefObject, useEffect } from 'react'
                
                type Handler = (event: MouseEvent | TouchEvent) => void
                
                export function useClickOutside<T extends HTMLElement = HTMLElement>(
                  ref: RefObject<T>,
                  handler: Handler,
                  mouseEvent: 'mousedown' | 'mouseup' = 'mousedown'
                ): void {
                  useEffect(() => {
                    const listener = (event: MouseEvent | TouchEvent) => {
                      const el = ref?.current
                      const target = event.target
                
                      // Do nothing if clicking ref's element or descendent elements
                      if (!el || !target || el.contains(target as Node)) {
                        return
                      }
                
                      handler(event)
                    }
                
                    document.addEventListener(mouseEvent, listener)
                    document.addEventListener('touchstart', listener)
                
                    return () => {
                      document.removeEventListener(mouseEvent, listener)
                      document.removeEventListener('touchstart', listener)
                    }
                  }, [ref, handler, mouseEvent])
                }
                ```
                
    - [ ]  PDF import layout wizard to be placed at the bottom of the screen
- **Canvas Feature**
    - [ ]  Air Duct Sizer tool must have a 3D Canvas

### Handling Bug Reports from User

- [ ]  Report Bug

### Security

Make sure there will be no security leaks

Private credentials must be protected