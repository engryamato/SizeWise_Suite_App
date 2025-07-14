"use client";

import React from "react";
import { GlassCard, GlassDock, GlassButton, GlassFilter, type DockIcon } from "@/components/glassmorphism";

export default function DemoPage() {
  const dockIcons: DockIcon[] = [
    {
      src: "https://parsefiles.back4app.com/JPaQcFfEEQ1ePBxbf6wvzkPMEqKYHhPYv8boI1Rc/a13d1acfd046f503f987c1c95af582c8_low_res_Claude.png",
      alt: "Claude",
    },
    {
      src: "https://parsefiles.back4app.com/JPaQcFfEEQ1ePBxbf6wvzkPMEqKYHhPYv8boI1Rc/9e80c50a5802d3b0a7ec66f3fe4ce348_low_res_Finder.png",
      alt: "Finder",
    },
    {
      src: "https://parsefiles.back4app.com/JPaQcFfEEQ1ePBxbf6wvzkPMEqKYHhPYv8boI1Rc/c2c4a538c2d42a8dc0927d7d6530d125_low_res_ChatGPT___Liquid_Glass__Default_.png",
      alt: "ChatGPT",
    },
  ];

  return (
    <div
      className="min-h-screen h-full flex flex-col items-center justify-center font-light relative overflow-hidden w-full p-8"
      style={{
        background: `linear-gradient(135deg, #667eea 0%, #764ba2 100%)`,
      }}
    >
      <GlassFilter />

      <div className="flex flex-col gap-8 items-center justify-center w-full max-w-4xl">
        <h1 className="text-4xl font-bold text-white mb-8 text-center">
          Glassmorphism Components Demo
        </h1>

        {/* Glass Effect Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
          <GlassCard
            title="Backdrop Blur"
            description="This is a glass effect card with beautiful backdrop blur and smooth transitions."
          />

          <GlassCard
            title="Hover Effects"
            description="Another glass card with smooth animations and interactive hover effects."
          />

          <GlassCard
            title="Visual Hierarchy"
            description="Glass morphism creates depth and visual hierarchy in modern UI design."
          />
        </div>

        {/* Glass Dock */}
        <div className="flex flex-col items-center gap-4">
          <h2 className="text-2xl font-semibold text-white">Glass Dock</h2>
          <GlassDock icons={dockIcons} />
        </div>

        {/* Glass Buttons */}
        <div className="flex flex-col items-center gap-4">
          <h2 className="text-2xl font-semibold text-white">Glass Buttons</h2>
          <div className="flex flex-wrap gap-4 justify-center">
            <GlassButton>
              <span className="text-white font-medium">Primary Button</span>
            </GlassButton>
            
            <GlassButton href="/">
              <span className="text-white font-medium">Link Button</span>
            </GlassButton>
            
            <GlassButton>
              <span className="text-white font-medium">Another Button</span>
            </GlassButton>
          </div>
        </div>

        {/* Navigation */}
        <div className="mt-8">
          <GlassButton href="/">
            <span className="text-white font-medium">← Back to Home</span>
          </GlassButton>
        </div>
      </div>
    </div>
  );
}
