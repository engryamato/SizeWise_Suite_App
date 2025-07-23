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
