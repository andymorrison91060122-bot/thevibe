import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft } from 'lucide-react';

interface AfterglowViewProps {
  onRestart?: () => void;
}

export default function AfterglowView({ onRestart }: AfterglowViewProps) {
  const [isFadingOut, setIsFadingOut] = useState(false);

  const handleReturnClick = () => {
    setIsFadingOut(true);
  };

  return (
    <div className="fixed inset-0 z-40 bg-neutral-950 text-white flex flex-col justify-center items-center px-8 select-none overflow-hidden">
      
      {/* Intense high-climax ambient flowing colors based on phase 3 */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Deep, glowing light orb A */}
        <motion.div
          animate={{
            scale: [1, 1.2, 0.9, 1.1, 1],
            x: [0, 40, -30, 20, 0],
            y: [0, -50, 40, -10, 0],
            opacity: [0.3, 0.45, 0.25, 0.4, 0.3],
          }}
          transition={{
            repeat: Infinity,
            duration: 15,
            ease: "easeInOut",
          }}
          className="absolute -top-1/4 -left-1/4 w-[150%] h-[150%] rounded-full bg-gradient-to-br from-[#FF0844]/25 via-transparent to-transparent filter blur-[150px]"
        />

        {/* Deep, glowing light orb B */}
        <motion.div
          animate={{
            scale: [1, 0.85, 1.15, 0.95, 1],
            x: [0, -50, 20, -40, 0],
            y: [0, 30, -50, 20, 0],
            opacity: [0.25, 0.4, 0.2, 0.35, 0.25],
          }}
          transition={{
            repeat: Infinity,
            duration: 18,
            ease: "easeInOut",
          }}
          className="absolute -bottom-1/4 -right-1/4 w-[140%] h-[140%] rounded-full bg-gradient-to-tl from-[#B224EF]/20 via-transparent to-transparent filter blur-[160px]"
        />

        {/* Ambient center focus */}
        <motion.div
          animate={{
            scale: [0.9, 1.05, 0.95, 1],
            opacity: [0.4, 0.55, 0.45, 0.4],
          }}
          transition={{
            repeat: Infinity,
            duration: 8,
            ease: "easeInOut",
          }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-rose-500/10 filter blur-[100px]"
        />
      </div>

      {/* Center content - extremely minimalist and aesthetic */}
      <div className="relative z-10 text-center space-y-4 max-w-sm">
        <motion.span
          initial={{ opacity: 0, letterSpacing: "0.2em" }}
          animate={{ opacity: 0.35, letterSpacing: "0.45em" }}
          transition={{ duration: 2.2, ease: "easeOut" }}
          className="text-[9px] font-sans font-bold text-rose-400 uppercase block tracking-[0.45em] mb-4"
        >
          AFTERGLOW
        </motion.span>

        <motion.h1
          initial={{ opacity: 0, y: 15, scale: 0.96 }}
          animate={{ opacity: 0.9, y: 0, scale: 1 }}
          transition={{ duration: 2.5, ease: [0.25, 1, 0.5, 1] }}
          className="text-3xl md:text-4xl font-serif font-bold text-neutral-100 tracking-widest leading-relaxed py-2"
          style={{ textShadow: "0 0 40px rgba(255, 8, 68, 0.2)" }}
        >
          牌抽完了，夜还很长
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.4 }}
          transition={{ delay: 1.2, duration: 2.0 }}
          className="text-[10px] font-sans tracking-[0.2em] text-neutral-400"
        >
          THE DECK IS EMPTY, THE NIGHT IS YOUNG.
        </motion.p>
      </div>

      {/* Gently Return Button: delayed by 4.5s, fades in like mist */}
      <motion.button
        id="btn-return-home"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 0.35, y: 0 }}
        whileHover={{ 
          opacity: 0.85,
          scale: 1.02,
          transition: { duration: 0.5, ease: "easeOut" }
        }}
        transition={{
          delay: 4.5,
          duration: 2.0,
          ease: "easeInOut"
        }}
        className="absolute bottom-20 left-1/2 -translate-x-1/2 cursor-pointer flex flex-col items-center gap-1.5 group p-5 select-none rounded-full z-[999] pointer-events-auto"
        onClick={handleReturnClick}
      >
        {/* Glow Sweep Aura beneath on hover */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          whileHover={{ opacity: 1, scale: 1.3 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="absolute inset-0 -z-10 rounded-full bg-[radial-gradient(circle,rgba(255,8,68,0.18)_0%,transparent_70%)] filter blur-md pointer-events-none"
        />

        {/* Thin delicate return arrow icon */}
        <ArrowLeft className="w-4 h-4 text-neutral-400 group-hover:text-rose-400/90 transition-colors duration-500 stroke-[1.25]" />
        
        {/* Sleek lowercase / elegant micro-lettering */}
        <span className="text-[10px] font-sans font-medium tracking-[0.25em] text-neutral-400 group-hover:text-rose-300/90 transition-colors duration-500 uppercase mt-0.5">
          Gently Return
        </span>
        <span className="text-[9px] font-sans font-light tracking-widest text-neutral-500 group-hover:text-neutral-400/80 transition-colors duration-500">
          温柔返回
        </span>
      </motion.button>

      {/* High-fidelity solid black fade overlay for clean return transition */}
      <AnimatePresence>
        {isFadingOut && (
          <motion.div
            key="fade-out-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
            onAnimationComplete={() => {
              if (onRestart) {
                onRestart();
              }
            }}
            className="fixed inset-0 z-[100] bg-black"
          />
        )}
      </AnimatePresence>

    </div>
  );
}
