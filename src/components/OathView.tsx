import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Fingerprint, ShieldCheck, HeartPulse } from 'lucide-react';
import { Player } from '../types';

interface OathViewProps {
  playerA: Player;
  playerB: Player;
  onSealed: () => void;
}

export default function OathView({ playerA, playerB, onSealed }: OathViewProps) {
  const [pressedA, setPressedA] = useState(false);
  const [pressedB, setPressedB] = useState(false);
  const [progress, setProgress] = useState(0); // 0 to 100
  const [isCompleted, setIsCompleted] = useState(false);
  const [isExploding, setIsExploding] = useState(false);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const bothPressed = pressedA && pressedB;

  useEffect(() => {
    if (bothPressed && !isCompleted) {
      intervalRef.current = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            clearInterval(intervalRef.current!);
            setIsCompleted(true);
            setIsExploding(true);
            setTimeout(() => {
              onSealed();
            }, 1300);
            return 100;
          }
          return prev + 6;
        });
      }, 100);
    } else {
      if (!isCompleted) {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
        setProgress(0);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [bothPressed, isCompleted, onSealed]);

  // High-tension vibration animation when pressed
  const shakeAnimation = bothPressed && !isCompleted
    ? {
        x: [0, -3, 3, -3, 3, -1.5, 1.5, 0],
        y: [0, 2, -2, 2, -2, 1, -1, 0],
      }
    : {};

  const shakeTransition = {
    repeat: Infinity,
    duration: 0.15,
    ease: "linear"
  };

  return (
    <div className="fixed inset-0 w-full h-[100dvh] max-h-[100dvh] overflow-hidden select-none px-6 py-4 xs:py-6 sm:py-8 flex flex-col justify-between max-w-sm mx-auto z-10 relative">
      
      {/* Absolute Full-screen Shockwave Particle effects */}
      <AnimatePresence>
        {isExploding && (
          <>
            {/* White/Hot pink bright fullscreen flash overlay */}
            <motion.div
              initial={{ opacity: 1 }}
              animate={{ opacity: 0 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="fixed inset-0 bg-white z-[60] pointer-events-none"
            />
            {/* Shockwave circle 1 */}
            <motion.div
              initial={{ scale: 0.1, opacity: 1, border: '6px solid #FFFFFF' }}
              animate={{ 
                scale: 25, 
                opacity: 0,
                boxShadow: '0 0 120px 40px #FF0844, inset 0 0 80px 20px #B224EF'
              }}
              transition={{ duration: 1.0, ease: "easeOut" }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 rounded-full z-50 pointer-events-none"
            />
            {/* Shockwave circle 2 (delayed & amber accent) */}
            <motion.div
              initial={{ scale: 0.05, opacity: 1, border: '4px solid #FFB199' }}
              animate={{ 
                scale: 35, 
                opacity: 0,
                boxShadow: '0 0 160px 50px #FF9A9E, inset 0 0 100px 30px #FF0844'
              }}
              transition={{ duration: 1.2, ease: "easeOut", delay: 0.1 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 rounded-full z-50 pointer-events-none"
            />
          </>
        )}
      </AnimatePresence>

      {/* Header section (Blows up-left) */}
      <motion.div 
        animate={isExploding ? { y: -800, x: -300, rotate: -45, scale: 0.5, opacity: 0 } : {}}
        transition={{ duration: 0.75, ease: [0.76, 0, 0.24, 1] }}
        className="text-center pt-2"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-[9px] font-sans font-bold tracking-[0.25em] text-rose-300 uppercase mb-4"
        >
          <ShieldCheck className="w-3.5 h-3.5 text-rose-400" />
          <span>CONSENT FRAMEWORK</span>
        </motion.div>
        
        <h2 className="text-5xl font-serif font-semibold text-neutral-100 tracking-wide">
          契之誓
        </h2>
        <p className="text-xs text-neutral-400 mt-2 font-sans tracking-widest font-semibold">
          彼此信赖，彼此交付。
        </p>
      </motion.div>

      {/* Contract terms card (Blows straight upwards) */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={isExploding ? { y: -1000, rotate: 12, scale: 0.4, opacity: 0 } : { opacity: 1, y: 0 }}
        transition={isExploding ? { duration: 0.85, ease: [0.76, 0, 0.24, 1] } : { duration: 0.8, delay: 0.2 }}
        className="my-auto py-8 px-6 rounded-3xl glass-card relative space-y-6 text-center"
      >
        <span className="text-[10px] font-sans font-bold tracking-[0.3em] text-amber-300 uppercase block pb-2 border-b border-white/5">
          誓约准则
        </span>

        <div className="space-y-4 font-serif text-left">
          <div className="flex items-center gap-4 py-1">
            <span className="text-[#FF9A9E] font-bold text-sm">Ⅰ.</span>
            <span className="text-sm font-semibold text-neutral-200">绝对自愿</span>
          </div>

          <div className="flex items-center gap-4 py-1">
            <span className="text-[#FF0844] font-bold text-sm">Ⅱ.</span>
            <span className="text-sm font-semibold text-neutral-200">随时叫停</span>
          </div>

          <div className="flex items-center gap-4 py-1">
            <span className="text-[#B224EF] font-bold text-sm">Ⅲ.</span>
            <span className="text-sm font-semibold text-neutral-200">轻柔交互</span>
          </div>
        </div>
      </motion.div>

      {/* Interaction Bay */}
      <div className="space-y-6">
        <motion.div 
          animate={isExploding ? { opacity: 0, scale: 0.5 } : {}}
          transition={{ duration: 0.4 }}
          className="text-center"
        >
          <p className="text-xs text-neutral-400 font-sans tracking-widest uppercase">
            {!bothPressed ? '同按指纹印录' : '契约印刻中...'}
          </p>
        </motion.div>

        {/* Double fingerprint button grid */}
        <div className="grid grid-cols-2 gap-8 px-2 items-center justify-items-center">
          
          {/* Player A Fingerprint (Blows down-left) */}
          <motion.div 
            animate={isExploding ? { x: -600, y: 600, rotate: -90, scale: 0.3, opacity: 0 } : {}}
            transition={{ duration: 0.7, ease: [0.76, 0, 0.24, 1] }}
            className="flex flex-col items-center space-y-2"
          >
            <motion.button
              id="fingerprint-a"
              whileTap={{ scale: 0.92 }}
              animate={shakeAnimation}
              transition={shakeTransition}
              onMouseDown={() => setPressedA(true)}
              onMouseUp={() => setPressedA(false)}
              onTouchStart={(e) => { e.preventDefault(); setPressedA(true); }}
              onTouchEnd={(e) => { e.preventDefault(); setPressedA(false); }}
              onClick={() => setPressedA(prev => !prev)}
              className={`relative w-20 h-20 rounded-full flex items-center justify-center border transition-all cursor-pointer ${
                pressedA 
                  ? 'border-[#FF9A9E] bg-rose-500/20 shadow-[0_0_30px_rgba(255,154,158,0.5)]' 
                  : 'border-neutral-900 bg-neutral-950/40 text-neutral-500 hover:border-neutral-800'
              }`}
            >
              {pressedA && (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0.8 }}
                  animate={{ scale: 1.5, opacity: 0 }}
                  transition={{ repeat: Infinity, duration: 1.2, ease: "easeOut" }}
                  className="absolute inset-0 rounded-full bg-[#FF9A9E]/35 pointer-events-none"
                />
              )}
              <Fingerprint className={`w-8 h-8 transition-colors ${pressedA ? 'text-rose-200' : 'text-neutral-500'}`} />
            </motion.button>
            <div className="text-center">
              <span className="text-xs font-serif text-neutral-300 font-bold block max-w-[80px] truncate">{playerA.name}</span>
              <span className={`text-[9px] font-sans tracking-wider uppercase font-bold ${pressedA ? 'text-rose-400' : 'text-neutral-500'}`}>
                {pressedA ? '已印录✓' : '长按解锁'}
              </span>
            </div>
          </motion.div>

          {/* Player B Fingerprint (Blows down-right) */}
          <motion.div 
            animate={isExploding ? { x: 600, y: 600, rotate: 90, scale: 0.3, opacity: 0 } : {}}
            transition={{ duration: 0.7, ease: [0.76, 0, 0.24, 1] }}
            className="flex flex-col items-center space-y-2"
          >
            <motion.button
              id="fingerprint-b"
              whileTap={{ scale: 0.92 }}
              animate={shakeAnimation}
              transition={shakeTransition}
              onMouseDown={() => setPressedB(true)}
              onMouseUp={() => setPressedB(false)}
              onTouchStart={(e) => { e.preventDefault(); setPressedB(true); }}
              onTouchEnd={(e) => { e.preventDefault(); setPressedB(false); }}
              onClick={() => setPressedB(prev => !prev)}
              className={`relative w-20 h-20 rounded-full flex items-center justify-center border transition-all cursor-pointer ${
                pressedB 
                  ? 'border-[#FF9A9E] bg-rose-500/20 shadow-[0_0_30px_rgba(255,154,158,0.5)]' 
                  : 'border-neutral-900 bg-neutral-950/40 text-neutral-500 hover:border-neutral-800'
              }`}
            >
              {pressedB && (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0.8 }}
                  animate={{ scale: 1.5, opacity: 0 }}
                  transition={{ repeat: Infinity, duration: 1.2, ease: "easeOut" }}
                  className="absolute inset-0 rounded-full bg-[#FF9A9E]/35 pointer-events-none"
                />
              )}
              <Fingerprint className={`w-8 h-8 transition-colors ${pressedB ? 'text-rose-200' : 'text-neutral-500'}`} />
            </motion.button>
            <div className="text-center">
              <span className="text-xs font-serif text-neutral-300 font-bold block max-w-[80px] truncate">{playerB.name}</span>
              <span className={`text-[9px] font-sans tracking-wider uppercase font-bold ${pressedB ? 'text-rose-400' : 'text-neutral-500'}`}>
                {pressedB ? '已印录✓' : '长按解锁'}
              </span>
            </div>
          </motion.div>
        </div>

        {/* Global Progress bar (Blows straight downwards) */}
        <motion.div 
          animate={isExploding ? { y: 600, scale: 0.4, opacity: 0 } : {}}
          transition={{ duration: 0.65, ease: [0.76, 0, 0.24, 1] }}
          className="px-2"
        >
          <div className="w-full h-1 bg-neutral-950 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-[#FF9A9E] via-[#FF0844] to-[#B224EF]"
              style={{ width: `${progress}%` }}
              transition={{ ease: "easeOut" }}
            />
          </div>
          
          <AnimatePresence>
            {isCompleted && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-center justify-center gap-1.5 mt-3 text-rose-300 text-xs font-sans tracking-widest animate-pulse"
              >
                <HeartPulse className="w-4 h-4 text-rose-400 animate-bounce" />
                <span>誓约印刻・启程</span>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
