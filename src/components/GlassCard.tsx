import { motion } from "motion/react";
import React, { ReactNode } from "react";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  hover?: boolean;
  key?: React.Key;
}

export default function GlassCard({ children, className = "", onClick, hover = true }: GlassCardProps) {
  return (
    <motion.div
      whileHover={hover ? { scale: 1.01, backgroundColor: "rgba(255, 255, 255, 0.25)" } : {}}
      whileTap={hover ? { 
        scale: 0.98, 
        boxShadow: "0 0 20px rgba(16, 185, 129, 0.4)",
        backgroundColor: "rgba(255, 255, 255, 0.3)"
      } : {}}
      onClick={onClick}
      className={`glass rounded-3xl p-6 transition-colors duration-300 ${onClick ? "cursor-pointer" : ""} ${className}`}
    >
      {children}
    </motion.div>
  );
}
