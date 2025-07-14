"use client";

import React from "react";
import GlassEffect from "./GlassEffect";

interface GlassButtonProps {
  children: React.ReactNode;
  href?: string;
}

// Button Component
const GlassButton: React.FC<GlassButtonProps> = ({ children, href }) => (
  <GlassEffect
    href={href}
    className="rounded-3xl px-10 py-6 hover:px-11 hover:py-7 hover:rounded-4xl overflow-hidden"
  >
    <div
      className="transition-all duration-700 hover:scale-95"
      style={{
        transitionTimingFunction: "cubic-bezier(0.175, 0.885, 0.32, 2.2)",
      }}
    >
      {children}
    </div>
  </GlassEffect>
);

export default GlassButton;
