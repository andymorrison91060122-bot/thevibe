import React, { useMemo } from 'react';
import { motion } from 'motion/react';

interface BackgroundGlowProps {
  temperature: number; // 0 to 100
  isIdle?: boolean;
}

export default function BackgroundGlow({ temperature, isIdle = false }: BackgroundGlowProps) {
  // Classify temperature into 3 phases with high-fidelity thresholds:
  // Phase 1: <= 33
  // Phase 2: >= 34 && <= 66
  // Phase 3: >= 67
  const phase = useMemo(() => {
    if (temperature <= 33) return 1;
    if (temperature <= 66) return 2;
    return 3;
  }, [temperature]);

  // Configure dynamic settings based on phase
  const config = useMemo(() => {
    switch (phase) {
      case 1:
        return {
          // Soft-warm pastel colors like sunrise peachy mist
          blobA: '#FF9A9E',
          blobB: '#FECFEF',
          blobC: '#FFD1FF',
          blobD: '#FFF0F5',
          opacityA: 0.22,
          opacityB: 0.18,
          opacityC: 0.15,
          opacityD: 0.15,
          scale: 1.0,
          blur: 'blur-[72px]',
          duration: 15, // extremely slow & dreamy
          // Ambient background mesh gradient
          bgStyle: 'from-[#140810] via-[#0b0307] to-[#040003]',
          pulseColor: 'rgba(255, 154, 158, 0.05)',
        };
      case 2:
        return {
          // Warm glowing tipsy peach & scarlet red
          blobA: '#FF0844',
          blobB: '#FFB199',
          blobC: '#F5576C',
          blobD: '#FF85A1',
          opacityA: 0.45,
          opacityB: 0.35,
          opacityC: 0.30,
          opacityD: 0.25,
          scale: 1.3,
          blur: 'blur-[80px]',
          duration: 8, // swifter tipsy movement
          bgStyle: 'from-[#2e0007] via-[#120002] to-[#050001]',
          pulseColor: 'rgba(255, 8, 68, 0.12)',
        };
      case 3:
      default:
        return {
          // Rich, highly passionate, deep neon-purple and magenta high-contrast climax
          blobA: '#B224EF',
          blobB: '#750050',
          blobC: '#FF0844',
          blobD: '#9d00ff',
          opacityA: 0.65,
          opacityB: 0.55,
          opacityC: 0.45,
          opacityD: 0.40,
          scale: 1.6,
          blur: 'blur-[90px]',
          duration: 4, // extremely passionate, fast-flowing
          bgStyle: 'from-[#210031] via-[#090013] to-[#020005]',
          pulseColor: 'rgba(178, 36, 239, 0.25)',
        };
    }
  }, [phase]);

  const animationDuration = isIdle ? 25 : config.duration;

  return (
    <div className={`fixed inset-0 -z-50 overflow-hidden bg-gradient-to-b ${config.bgStyle} transition-colors duration-1000 select-none`}>
      
      {/* Container for fluid dynamic blobs */}
      <div className="absolute inset-0 overflow-hidden mix-blend-screen opacity-90">
        
        {/* Blob A - Top Left quadrant moving non-linearly */}
        <motion.div
          animate={{
            x: [0, 160, -90, 80, 0],
            y: [0, -120, 100, -140, 0],
          }}
          transition={{
            duration: animationDuration,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className={`ambient-blob absolute -top-10 -left-10 w-96 h-96 ${config.blur} mix-blend-screen transition-opacity duration-[1200ms] pointer-events-none`}
          style={{
            backgroundColor: config.blobA,
            opacity: config.opacityA,
            scale: config.scale,
            borderRadius: "42% 58% 70% 30% / 45% 45% 55% 55%",
          }}
        />

        {/* Blob B - Bottom Right quadrant moving non-linearly */}
        <motion.div
          animate={{
            x: [0, -110, 140, -60, 0],
            y: [0, 140, -90, 110, 0],
          }}
          transition={{
            duration: animationDuration * 1.1,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className={`ambient-blob absolute -bottom-10 -right-10 w-96 h-96 ${config.blur} mix-blend-screen transition-opacity duration-[1200ms] pointer-events-none`}
          style={{
            backgroundColor: config.blobB,
            opacity: config.opacityB,
            scale: config.scale,
            borderRadius: "50% 50% 50% 50% / 50% 50% 50% 50%",
          }}
        />

        {/* Blob C - Center/Left wandering */}
        <motion.div
          animate={{
            x: [0, 120, -130, 90, 0],
            y: [0, 90, -110, -90, 0],
          }}
          transition={{
            duration: animationDuration * 0.9,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className={`ambient-blob absolute top-1/4 left-1/4 w-80 h-80 ${config.blur} mix-blend-screen transition-opacity duration-[1200ms] pointer-events-none`}
          style={{
            backgroundColor: config.blobC,
            opacity: config.opacityC,
            scale: config.scale,
            borderRadius: "60% 40% 55% 45% / 40% 50% 50% 60%",
          }}
        />

        {/* Blob D - Center/Right wandering */}
        <motion.div
          animate={{
            x: [0, -130, 110, -100, 0],
            y: [0, -90, 130, 100, 0],
          }}
          transition={{
            duration: animationDuration * 1.2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className={`ambient-blob absolute bottom-1/4 right-1/4 w-80 h-80 ${config.blur} mix-blend-screen transition-opacity duration-[1200ms] pointer-events-none`}
          style={{
            backgroundColor: config.blobD,
            opacity: config.opacityD,
            scale: config.scale,
            borderRadius: "35% 65% 45% 55% / 55% 45% 65% 35%",
          }}
        />
      </div>

      {/* Edge breathing shadow or heartbeat pulse glow for Phase 3 (Climax) */}
      {phase === 3 && (
        <motion.div
          animate={{
            boxShadow: [
              "inset 0 0 40px rgba(178,36,239,0.3)",
              "inset 0 0 100px rgba(255,8,68,0.75)",
              "inset 0 0 40px rgba(178,36,239,0.3)"
            ]
          }}
          transition={{
            repeat: Infinity,
            duration: 1.0, // Heartbeat rhythm (64bpm)
            ease: "easeInOut"
          }}
          className="absolute inset-0 z-10 pointer-events-none rounded-none"
        />
      )}

      {/* Regular ambient glow center overlay */}
      <div 
        className="absolute inset-0 transition-opacity duration-1000 z-10 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle at center, ${config.pulseColor}, transparent 74%)`,
        }}
      />

      {/* High contrast center soft darkness */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_35%,rgba(4,1,6,0.95)_100%)] z-20 pointer-events-none" />

      {/* Retro scanline aesthetic overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,24,0)_1.5px,rgba(18,16,24,0.03)_1.5px)] bg-[size:100%_3px] pointer-events-none opacity-20 z-35" />
    </div>
  );
}
