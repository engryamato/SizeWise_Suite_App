"use client";

import React from "react";
import GlassEffect from "./GlassEffect";

interface GlassCardProps {
  title: string;
  description: string;
  className?: string;
}

// Card Component
const GlassCard: React.FC<GlassCardProps> = ({ title, description, className = "" }) => (
  <GlassEffect className={`rounded-3xl p-6 hover:p-7 ${className}`}>
    <div className="text-center">
      <h3 className="text-xl font-semibold mb-3 text-white">{title}</h3>
      <p className="text-gray-200 leading-relaxed">{description}</p>
    </div>
  </GlassEffect>
);

export default GlassCard;
