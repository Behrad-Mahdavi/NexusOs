import React from 'react';
import { motion } from 'framer-motion';

const AuroraBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 w-full h-full -z-10 bg-[#0f1014] overflow-hidden">
      {/* Orb 1: Blue/Purple - Optimized */}
      <motion.div
        className="absolute top-[-10%] left-[-10%] w-[70vw] h-[70vw] rounded-full mix-blend-screen filter blur-[60px] md:blur-[100px] opacity-20 md:opacity-40 will-change-transform"
        style={{ background: 'radial-gradient(circle, rgba(56, 189, 248, 0.8) 0%, rgba(129, 140, 248, 0) 70%)' }}
        animate={{
          x: [0, 50, -50, 0],
          y: [0, -50, 50, 0],
        }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
      />

      {/* Orb 2: Pink/Red - Optimized */}
      <motion.div
        className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] rounded-full mix-blend-screen filter blur-[50px] md:blur-[100px] opacity-20 md:opacity-30 will-change-transform"
        style={{ background: 'radial-gradient(circle, rgba(236, 72, 153, 0.8) 0%, rgba(239, 68, 68, 0) 70%)' }}
        animate={{
          x: [0, -70, 30, 0],
          y: [0, 40, -40, 0],
        }}
        transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
      />

      {/* Orb 3: Cyan/Green - Optimized */}
      <motion.div
        className="absolute top-[40%] left-[30%] w-[50vw] h-[50vw] rounded-full mix-blend-screen filter blur-[40px] md:blur-[80px] opacity-20 md:opacity-30 will-change-transform"
        style={{ background: 'radial-gradient(circle, rgba(45, 212, 191, 0.8) 0%, rgba(52, 211, 153, 0) 70%)' }}
        animate={{
          x: [0, 40, -40, 0],
          y: [0, -30, 30, 0],
        }}
        transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
      />

      <div className="absolute inset-0 bg-black/20" />
    </div>
  );
};

export default AuroraBackground;