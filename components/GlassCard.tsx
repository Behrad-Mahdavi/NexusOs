import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

interface GlassCardProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
  variant?: 'regular' | 'thick';
  className?: string;
}

const GlassCard: React.FC<GlassCardProps> = ({ 
  children, 
  variant = 'regular', 
  className = '',
  ...props 
}) => {
  const baseStyles = "rounded-3xl border shadow-[0_20px_40px_rgba(0,0,0,0.1)] relative overflow-hidden transition-colors";
  
  const variants = {
    regular: "bg-white/10 backdrop-blur-xl border-white/20 hover:bg-white/15",
    thick: "bg-white/30 backdrop-blur-2xl border-white/30 hover:bg-white/35"
  };

  return (
    <motion.div 
      className={`${baseStyles} ${variants[variant]} ${className}`}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 200, damping: 20 }}
      {...props}
    >
      {/* Light Source Highlight */}
      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/50 to-transparent opacity-50" />
      {children}
    </motion.div>
  );
};

export default GlassCard;