"use client";

import React from "react";
import Image from "next/image";
import GlassEffect from "./GlassEffect";

interface DockIcon {
  src: string;
  alt: string;
  onClick?: () => void;
}

interface GlassDockProps {
  icons: DockIcon[];
  href?: string;
}

// Dock Component
const GlassDock: React.FC<GlassDockProps> = ({ icons, href }) => (
  <GlassEffect
    href={href}
    className="rounded-3xl p-3 hover:p-4 hover:rounded-4xl"
  >
    <div className="flex items-center justify-center gap-2 rounded-3xl p-3 py-0 px-0.5 overflow-hidden">
      {icons.map((icon, index) => (
        <Image
          key={index}
          src={icon.src}
          alt={icon.alt}
          width={64}
          height={64}
          className="w-16 h-16 transition-all duration-700 hover:scale-110 cursor-pointer"
          style={{
            transformOrigin: "center center",
            transitionTimingFunction: "cubic-bezier(0.175, 0.885, 0.32, 2.2)",
          }}
          onClick={icon.onClick}
        />
      ))}
    </div>
  </GlassEffect>
);

export default GlassDock;
export type { DockIcon };
