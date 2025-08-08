"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

// Stub implementation for ScrollAreaPrimitive to avoid @radix-ui dependency
const ScrollAreaPrimitive = {
  Root: React.forwardRef<HTMLDivElement, any>(({ className, children, ...props }, ref) => (
    <div ref={ref} className={cn("relative overflow-hidden", className)} {...props}>
      {children}
    </div>
  )),

  Viewport: React.forwardRef<HTMLDivElement, any>(({ className, children, ...props }, ref) => (
    <div ref={ref} className={cn("h-full w-full rounded-[inherit] overflow-auto", className)} {...props}>
      {children}
    </div>
  )),
  Scrollbar: React.forwardRef<HTMLDivElement, any>(({ className, orientation = "vertical", ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "flex touch-none select-none transition-colors",
        orientation === "vertical" && "h-full w-2.5 border-l border-l-transparent p-[1px]",
        orientation === "horizontal" && "h-2.5 flex-col border-t border-t-transparent p-[1px]",
        className
      )}
      {...props}
    />
  )),
  ScrollAreaScrollbar: React.forwardRef<HTMLDivElement, any>(({ className, orientation = "vertical", children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "flex touch-none select-none transition-colors",
        orientation === "vertical" && "h-full w-2.5 border-l border-l-transparent p-[1px]",
        orientation === "horizontal" && "h-2.5 flex-col border-t border-t-transparent p-[1px]",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )),
  Thumb: React.forwardRef<HTMLDivElement, any>(({ className, ...props }, ref) => (
    <div ref={ref} className={cn("relative flex-1 rounded-full bg-gray-300", className)} {...props} />
  )),
  ScrollAreaThumb: React.forwardRef<HTMLDivElement, any>(({ className, ...props }, ref) => (
    <div ref={ref} className={cn("relative flex-1 rounded-full bg-gray-300", className)} {...props} />
  )),
  Corner: ({ className, ...props }: any) => (
    <div className={cn("bg-gray-100", className)} {...props} />
  ),
};

// Add displayName for compatibility
// Additional displayNames for ESLint react/display-name rule
ScrollAreaPrimitive.Root.displayName = "ScrollAreaRoot";
ScrollAreaPrimitive.Viewport.displayName = "ScrollAreaViewport";
ScrollAreaPrimitive.Scrollbar.displayName = "ScrollAreaScrollbar";
ScrollAreaPrimitive.Thumb.displayName = "ScrollAreaThumb";
ScrollAreaPrimitive.ScrollAreaThumb.displayName = "ScrollAreaThumb";

ScrollAreaPrimitive.ScrollAreaScrollbar.displayName = "ScrollAreaScrollbar";

const ScrollArea = React.forwardRef<
  React.ElementRef<typeof ScrollAreaPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.Root>
>(({ className, children, ...props }, ref) => (
  <ScrollAreaPrimitive.Root
    ref={ref}
    className={cn("relative overflow-hidden", className)}
    {...props}
  >
    <ScrollAreaPrimitive.Viewport className="h-full w-full rounded-[inherit]">
      {children}
    </ScrollAreaPrimitive.Viewport>
    <ScrollBar />
    <ScrollAreaPrimitive.Corner />
  </ScrollAreaPrimitive.Root>
));
ScrollArea.displayName = ScrollAreaPrimitive.Root.displayName;

const ScrollBar = React.forwardRef<
  React.ElementRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>,
  React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>
>(({ className, orientation = "vertical", ...props }, ref) => (
  <ScrollAreaPrimitive.ScrollAreaScrollbar
    ref={ref}
    orientation={orientation}
    className={cn(
      "flex touch-none select-none transition-colors",
      orientation === "vertical" &&
        "h-full w-2.5 border-l border-l-transparent p-[1px]",
      orientation === "horizontal" &&
        "h-2.5 flex-col border-t border-t-transparent p-[1px]",
      className
    )}
    {...props}
  >
    <ScrollAreaPrimitive.ScrollAreaThumb className="relative flex-1 rounded-full bg-border" />
  </ScrollAreaPrimitive.ScrollAreaScrollbar>
));
ScrollBar.displayName = ScrollAreaPrimitive.ScrollAreaScrollbar.displayName;

export { ScrollArea, ScrollBar };
