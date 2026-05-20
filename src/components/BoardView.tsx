import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from 'motion/react';
import { 
  Flame, 
  Sparkles, 
  ChevronRight, 
  VolumeX, 
  RotateCcw, 
  AlertCircle, 
  RefreshCw, 
  GlassWater, 
  HelpCircle, 
  Smile, 
  UserCheck 
} from 'lucide-react';
import { Card, CARDS_POOL, PUNISHMENTS, Punishment } from '../data/cards';
import { Player } from '../types';
import { triggerVibration } from '../utils/haptics';

interface Particle {
  id: number;
  x: number;
  y: number;
  color: string;
  size: number;
}

interface BoardViewProps {
  playerA: Player;
  playerB: Player;
  intensityLimit: 'level1' | 'level2' | 'all';
  onClimax: () => void;
  onTemperatureChange: (temp: number) => void;
}

export default function BoardView({ playerA, playerB, intensityLimit, onClimax, onTemperatureChange }: BoardViewProps) {
  // 1. Filter card pool based on selected intensity
  const initialPool = React.useMemo(() => {
    let pool = CARDS_POOL;
    if (intensityLimit === 'level1') {
      pool = CARDS_POOL.filter(c => c.phase === 1);
    } else if (intensityLimit === 'level2') {
      pool = CARDS_POOL.filter(c => c.phase === 1 || c.phase === 2);
    }
    // Shuffle the pool initially
    return [...pool].sort(() => Math.random() - 0.5);
  }, [intensityLimit]);

  // Game States
  const [deck, setDeck] = useState<Card[]>(initialPool);
  const [discardedCount, setDiscardedCount] = useState(0);
  const [temperature, setTemperature] = useState(15); // Starts warm at 15
  const [currentTurn, setCurrentTurn] = useState<'A' | 'B'>('A'); // Turn alternates A and B
  
  // Card revelation flow
  const [activeCard, setActiveCard] = useState<Card | null>(null);
  const [isFlipped, setIsFlipped] = useState(false);
  const [cardDrawKey, setCardDrawKey] = useState(0); // Trigger physical animation on draw

  // Starburst particle states
  const [particles, setParticles] = useState<Particle[]>([]);

  const triggerParticleReveal = (phase: number) => {
    const count = 12 + Math.floor(Math.random() * 4); // 12-15 particles
    const newParticles: Particle[] = [];
    const colors = phase === 1 
      ? ['#FF9A9E', '#FECFEF', '#FFD1FF', '#FFBDC3']
      : phase === 2 
        ? ['#FF0844', '#FF4E50', '#FF416C', '#FF9A9E']
        : ['#B224EF', '#7579FF', '#FF0844', '#EC4899', '#A855F7'];

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const distance = 40 + Math.random() * 85; 
      const xOffset = Math.cos(angle) * distance;
      const yOffset = Math.sin(angle) * distance;
      const size = 3.5 + Math.random() * 5.5; // size of tiny blurred glowing dots

      newParticles.push({
        id: Date.now() + i + Math.random(),
        x: xOffset,
        y: yOffset,
        color: colors[Math.floor(Math.random() * colors.length)],
        size,
      });
    }

    setParticles(newParticles);

    // Fade out / remove elements after 600ms
    setTimeout(() => {
      setParticles([]);
    }, 600);
  };

  // Dynamic animations & feedback states
  const [isSkipping, setIsSkipping] = useState(false);
  const [burstTrigger, setBurstTrigger] = useState(0);
  const [burstPhase, setBurstPhase] = useState(1);

  // Swipe logic
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-15, 15]);
  const acceptOpacity = useTransform(x, [0, 100], [0, 1]);
  const skipOpacity = useTransform(x, [-100, 0], [1, 0]);

  // Reset offset on card draw or state reset
  useEffect(() => {
    x.set(0);
  }, [cardDrawKey, x]);

  const handleDragEnd = (_event: any, info: any) => {
    const offset = info.offset.x;
    if (offset > 120) {
      animate(x, 600, { duration: 0.3, ease: "easeOut" }).then(() => {
        handleAcceptCard(activeCard?.points || 1);
      });
    } else if (offset < -120) {
      animate(x, -600, { duration: 0.3, ease: "easeOut" }).then(() => {
        handleSkipCard();
      });
    } else {
      animate(x, 0, { type: "spring", stiffness: 300, damping: 20 });
    }
  };

  // Pointer tracking for reactive light glow & edge shimmer (120fps hardware-accelerated style changes)
  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    card.style.setProperty('--mouse-x', `${px}px`);
    card.style.setProperty('--mouse-y', `${py}px`);
  };

  const handlePointerLeave = (e: React.PointerEvent<HTMLDivElement>) => {
    const card = e.currentTarget;
    card.style.setProperty('--mouse-x', '-999px');
    card.style.setProperty('--mouse-y', '-999px');
  };

  // Punishment Wheel States
  const [showPunishModal, setShowPunishModal] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const [chosenPunish, setChosenPunish] = useState<Punishment | null>(null);

  // Stage up interrupt banner ceremony
  const [activeStageUpgrade, setActiveStageUpgrade] = useState<{
    phase: 1 | 2 | 3;
    title: string;
    subtitle: string;
  } | null>(null);
  const upgradeTimerRef = React.useRef<any>(null);
  const [phaseBanners, setPhaseBanners] = useState<string[]>([]);
  const [currentPhase, setCurrentPhase] = useState<1 | 2 | 3>(1);

  // Active player info helper
  const activePlayer = currentTurn === 'A' ? playerA : playerB;
  const passivePlayer = currentTurn === 'A' ? playerB : playerA;

  // Determine current active game phase dynamically from temperature
  const computedPhase = React.useMemo(() => {
    if (temperature <= 33) return 1;
    if (temperature <= 66) return 2;
    return 3;
  }, [temperature]);

  // Dynamic phase details representing temperature stages strictly to fix any phase-one ambiguity
  const currentPhaseInfo = React.useMemo(() => {
    if (temperature <= 33) {
      return {
        number: 1,
        label: "微温",
        engLabel: "WARM",
        colorClass: "text-amber-300 border-amber-500/20 bg-amber-500/10",
        flameColor: "text-amber-400 fill-amber-500 animate-[flame-float_2.4s_infinite_ease-in-out]",
        bgGradient: "linear-gradient(90deg, #d97706, #f59e0b, #ef4444, #f59e0b, #d97706)",
        animDuration: "3.5s",
        glowEffect: "shadow-[0_0_10px_rgba(245,158,11,0.08)]",
      };
    } else if (temperature <= 66) {
      return {
        number: 2,
        label: "灼热",
        engLabel: "HOT",
        colorClass: "text-rose-300 border-rose-500/20 bg-rose-500/10",
        flameColor: "text-rose-400 fill-rose-500 animate-[flame-float_1.5s_infinite_ease-in-out]",
        bgGradient: "linear-gradient(90deg, #e11d48, #ec4899, #f43f5e, #e11d48)",
        animDuration: "2.0s",
        glowEffect: "shadow-[0_0_16px_rgba(244,63,94,0.4)]",
      };
    } else {
      return {
        number: 3,
        label: "沸腾",
        engLabel: "BOILING",
        colorClass: "text-purple-300 border-purple-500/20 bg-purple-500/10 animate-pulse",
        flameColor: "text-purple-400 fill-purple-500 animate-[flame-float_0.8s_infinite_ease-in-out]",
        bgGradient: "linear-gradient(90deg, #7c3aed, #ec4899, #a855f7, #6366f1, #7c3aed)",
        animDuration: "0.95s",
        glowEffect: "shadow-[0_0_24px_rgba(168,85,247,0.75)]",
      };
    }
  }, [temperature]);

  // Watch for phase upgrades to trigger visual banners
  useEffect(() => {
    if (computedPhase !== currentPhase) {
      if (computedPhase > currentPhase) {
        const title = computedPhase === 2 ? "温度升高" : "毫无保留";
        const subtitle = computedPhase === 2 ? "PHASE 02 · 微醺灼热" : "PHASE 03 · 沸腾高潮";
        
        setActiveStageUpgrade({
          phase: computedPhase as 1 | 2 | 3,
          title,
          subtitle
        });

        // Trigger two-beat heartbeat vibration if we reach Phase 3 (Boiling Point)!
        if (computedPhase === 3) {
          triggerVibration([40, 100, 40]);
        }

        if (upgradeTimerRef.current) {
          clearTimeout(upgradeTimerRef.current);
        }

        upgradeTimerRef.current = setTimeout(() => {
          setActiveStageUpgrade(null);
          upgradeTimerRef.current = null;
        }, 4800);

        // Keep standard console or mini banner backup
        const upgradeMsg = computedPhase === 2 
          ? "✨ 关系升温！解锁『微醺灼热』卡牌集 ✨" 
          : "💀 激情沸腾！解锁全灵感官『沸腾高潮』卡牌集 💀";
        setPhaseBanners(prev => [...prev, upgradeMsg]);

        setCurrentPhase(computedPhase as any);
      } else {
        setCurrentPhase(computedPhase as any);
      }
    }
  }, [computedPhase, currentPhase]);

  // Clean up timer strictly on component unmount
  useEffect(() => {
    return () => {
      if (upgradeTimerRef.current) {
        clearTimeout(upgradeTimerRef.current);
      }
    };
  }, []);

  // Filter possible cards based on current phase (level-up dynamics)
  // This ensures players don't draw Phase 3 cards immediately even if 'all' is selected.
  // Instead, the active draw stack delivers cards matching the temperature scale!
  const getNextAppropriateCard = () => {
    // Determine target phase scope
    const targetPhasesAllowed = [1];
    if (temperature >= 34) targetPhasesAllowed.push(2);
    if (temperature >= 67 && intensityLimit === 'all') targetPhasesAllowed.push(3);

    // Look for a card in deck that matches allowed phase scope
    let index = deck.findIndex(c => targetPhasesAllowed.includes(c.phase));
    
    // If no phase-matched cards are left, draw any remaining card in the deck
    if (index === -1 && deck.length > 0) {
      index = 0;
    }

    if (index !== -1) {
      const card = deck[index];
      // Remove from deck
      const newDeck = [...deck];
      newDeck.splice(index, 1);
      setDeck(newDeck);
      return card;
    }

    // Depleted! Returns null
    return null;
  };

  // Turn management
  const handleDrawCard = () => {
    if (activeCard) return; // Must finish current card
    const card = getNextAppropriateCard();
    if (!card) {
      onClimax();
      return;
    }
    
    // Draw micro-vibration
    triggerVibration(15);

    x.set(0); // Synchronously reset swipe offset
    setActiveCard(card);
    setIsFlipped(false);
    setCardDrawKey(prev => prev + 1);
    setBurstPhase(card.phase);
    setBurstTrigger(prev => prev + 1);

    // Autoplay small flip delay for excitement
    setTimeout(() => {
      setIsFlipped(true);
      // Flip reveal micro-vibration & spectacular starry particle reveal
      triggerVibration(15);
      triggerParticleReveal(card.phase);
    }, 600);
  };

  const handleAcceptCard = (points: number) => {
    // Sound confirmation or device feedback can be simulated visually
    const nextTemp = Math.min(100, temperature + points);
    setTemperature(nextTemp);
    onTemperatureChange(nextTemp);
    
    // Close card and swap turn
    x.set(0); // Synchronously reset swipe offset
    setActiveCard(null);
    setIsFlipped(false);
    setDiscardedCount(prev => prev + 1);

    if (deck.length === 0) {
      // Trigger elegant climax view only when the last card is fully completed and processed
      setTimeout(() => {
        onClimax();
      }, 1200);
    } else {
      // Switch turn
      setCurrentTurn(currentTurn === 'A' ? 'B' : 'A');
    }
  };

  const handleSkipCard = () => {
    setIsSkipping(true);
    // After high-velocity swipe out animation completes (350ms), show punishment modal
    setTimeout(() => {
      setShowPunishModal(true);
      setChosenPunish(null);
      setIsSkipping(false);
    }, 350);
  };

  // Spin the penalty wheel
  const startPunishRoulette = () => {
    if (spinning) return;
    setSpinning(true);
    setChosenPunish(null);

    let counter = 0;
    const totalSpins = 12;
    const interval = setInterval(() => {
      const tempPunish = PUNISHMENTS[Math.floor(Math.random() * PUNISHMENTS.length)];
      setChosenPunish(tempPunish);
      counter++;

      if (counter >= totalSpins) {
        clearInterval(interval);
        // Decelerate and choose final
        const finalPunish = PUNISHMENTS[Math.floor(Math.random() * PUNISHMENTS.length)];
        setChosenPunish(finalPunish);
        setSpinning(false);
      }
    }, 150);
  };

  const finishPunishment = () => {
    setShowPunishModal(false);
    // Dismiss active card and transition turn without rising temperature much
    x.set(0); // Synchronously reset swipe offset
    setActiveCard(null);
    setIsFlipped(false);
    setDiscardedCount(prev => prev + 1);
    
    if (deck.length === 0) {
      // Clean landing on final skipped card
      setTimeout(() => {
        onClimax();
      }, 1200);
    } else {
      setCurrentTurn(currentTurn === 'A' ? 'B' : 'A');
    }
  };

  return (
    <div className="fixed inset-0 w-full h-[100dvh] max-h-[100dvh] overflow-hidden select-none px-4 py-3 sm:py-5 flex flex-col justify-between max-w-sm sm:max-w-md mx-auto relative z-10">
      {/* 1. Header / Thermometer block with rich liquid flow and dual-binding variables */}
      <div className="space-y-1.5 xs:space-y-2.5 sm:space-y-3.5 flex-shrink-0">
        {/* CSS Animation classes injection for liquid flowing position and pulse heartbeat effects */}
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes liquid-flow {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
          @keyframes glow-dot-pulse {
            0%, 100% { 
              transform: scale(1); 
              opacity: 0.9; 
              filter: drop-shadow(0 0 3px rgba(255,255,255,0.85)); 
            }
            50% { 
              transform: scale(1.3); 
              opacity: 1; 
              filter: drop-shadow(0 0 12px rgba(255,255,255,1)); 
            }
          }
          @keyframes flame-float {
            0%, 100% { transform: translateY(0) scale(1); }
            50% { transform: translateY(-1.5px) scale(1.05); }
          }
          @keyframes label-shimmer {
            0% { background-position: -200% 0; }
            100% { background-position: 200% 0; }
          }
          .custom-scrollbar::-webkit-scrollbar {
            width: 3px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: transparent;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.15);
            border-radius: 99px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: rgba(255, 255, 255, 0.3);
          }
        `}} />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 animate-none">
            <span className="text-[10px] font-sans font-black tracking-[0.25em] text-neutral-400">THE VIBE</span>
            <motion.div 
              key={`phase-badge-${currentPhaseInfo.number}`}
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 350, damping: 15 }}
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-sans font-bold border transition-all duration-500 ${currentPhaseInfo.colorClass}`}
            >
              <Flame className={`w-3 h-3 transition-colors duration-500 ${currentPhaseInfo.flameColor}`} />
              <span>Phase {currentPhaseInfo.number} · {currentPhaseInfo.label}</span>
            </motion.div>
          </div>
          
          <div className="text-right flex items-baseline gap-1 animate-none">
            <span className="text-[9px] font-sans font-bold tracking-wider text-neutral-500 uppercase">当前温度</span>
            <span className="text-base font-mono font-black text-rose-400 min-w-[50px] text-right">
              {temperature}°C
            </span>
          </div>
        </div>

        {/* Liquid Progress Bar with dynamic breathing container glow */}
        <div className="relative w-full h-3.5">
          <div className={`w-full h-full bg-neutral-950 rounded-full p-0.5 border transition-all duration-700 ease-out ${
            temperature <= 33 
              ? "border-neutral-900/40 shadow-[inset_0_2px_4px_rgba(0,0,0,0.65)]" 
              : temperature <= 66 
              ? "border-rose-500/20 shadow-[inset_0_2px_4px_rgba(0,0,0,0.65),0_0_12px_rgba(244,63,94,0.18)]" 
              : "border-purple-500/40 shadow-[inset_0_2px_4px_rgba(0,0,0,0.65),0_0_20px_rgba(168,85,247,0.38)]"
          }`}>
            <div className="w-full h-full relative rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full relative transition-all duration-100 ease-out"
                style={{ 
                  width: `${temperature}%`,
                  backgroundImage: currentPhaseInfo.bgGradient,
                  backgroundSize: "200% auto",
                  animation: `liquid-flow ${currentPhaseInfo.animDuration} linear infinite`,
                  boxShadow: currentPhaseInfo.glowEffect,
                }}
                layout
                transition={{ type: "spring", stiffness: 100, damping: 20 }}
              >
                {/* Internal Gloss sheen lines */}
                <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.22),transparent)] pointer-events-none select-none rounded-full" />
                
                {/* Flowing highlight ripple */}
                <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_25%,rgba(255,255,255,0.15)_50%,transparent_75%)] bg-[length:150%_100%] animate-[liquid-flow_3s_linear_infinite] pointer-events-none" />
              </motion.div>
            </div>
          </div>

          {/* Glowing dot positioned absolutely on the parent wrapper (which has no overflow-hidden) */}
          {temperature > 0 && (
            <motion.div 
              className="absolute w-3 h-3 -mt-1.5 -ml-1.5 pointer-events-none select-none z-10 flex items-center justify-center animate-[none]"
              style={{ 
                left: `calc(2px + (${temperature / 100} * (100% - 4px)))`,
                top: '50%'
              }}
              layout
              transition={{ type: "spring", stiffness: 100, damping: 20 }}
            >
              <div 
                className="w-2.5 h-2.5 rounded-full bg-white shrink-0"
                style={{
                  boxShadow: temperature <= 33 
                    ? "0 0 6px 1.5px #ffd1a4, 0 0 12px 2px #f59e0b" 
                    : temperature <= 66 
                    ? "0 0 10px 2px #ff7c9c, 0 0 18px 3px #ff0844" 
                    : "0 0 12px 2.5px #e29eff, 0 0 22px 4px #b224ef",
                  animation: temperature >= 67 ? "glow-dot-pulse 1s infinite ease-in-out" : undefined
                }}
              />
            </motion.div>
          )}
        </div>

        {/* Phase milestone labels under indicator, responding seamlessly with slide layouts */}
        <div className="grid grid-cols-3 text-center text-[10px] font-sans font-bold tracking-wider relative pt-0.5">
          {/* Milestone 1: 微温 */}
          <div className="flex flex-col items-center justify-between relative py-0.5 min-h-[34px] sm:min-h-[42px]">
            <motion.div
              animate={temperature <= 33 
                ? { 
                    scale: 1.05, 
                    opacity: 1,
                  } 
                : { 
                    scale: 0.94, 
                    opacity: 0.42,
                  }
              }
              transition={{ duration: 0.5, ease: "easeInOut" }}
              className="flex flex-col items-center cursor-default select-none animate-none"
            >
              <span 
                className="text-center font-sans font-black transition-colors duration-500 text-xs tracking-wider"
                style={{
                  backgroundImage: temperature <= 33 ? "linear-gradient(120deg, #f59e0b 0%, #ff8008 50%, #f59e0b 100%)" : "none",
                  backgroundSize: "200% auto",
                  backgroundClip: temperature <= 33 ? "text" : "none",
                  WebkitBackgroundClip: temperature <= 33 ? "text" : "none",
                  color: temperature <= 33 ? "transparent" : "rgba(163, 163, 163, 0.75)",
                  textShadow: temperature <= 33 ? "0 0 10px rgba(251,191,36,0.25)" : "none",
                  animation: temperature <= 33 ? "label-shimmer 2.2s infinite linear" : "none"
                }}
              >
                微温
              </span>
              <span className="text-[8px] font-mono font-medium text-neutral-500 tracking-normal opacity-80 mt-0.5">
                0-33%
              </span>
            </motion.div>
            
            {/* Elegant active bar placed strictly and centered under the milestone */}
            <div className="h-[3px] w-6 relative mt-1 flex items-center justify-center">
              {temperature <= 33 && (
                <motion.span 
                  layoutId="active-milestone-bar"
                  className="absolute inset-x-0 h-[2.5px] bg-[#f59e0b] rounded-full shadow-[0_0_6px_#f59e0b]"
                  transition={{ type: "spring", stiffness: 350, damping: 25 }}
                />
              )}
            </div>
          </div>

          {/* Milestone 2: 灼热 */}
          <div className="flex flex-col items-center justify-between relative py-0.5 min-h-[34px] sm:min-h-[42px]">
            <motion.div
              animate={(temperature >= 34 && temperature <= 66)
                ? { 
                    scale: 1.05, 
                    opacity: 1,
                  } 
                : { 
                    scale: 0.94, 
                    opacity: 0.42,
                  }
              }
              transition={{ duration: 0.5, ease: "easeInOut" }}
              className="flex flex-col items-center cursor-default select-none animate-none"
            >
              <span 
                className="text-center font-sans font-black transition-colors duration-500 text-xs tracking-wider"
                style={{
                  backgroundImage: (temperature >= 34 && temperature <= 66) ? "linear-gradient(120deg, #f43f5e 0%, #fb7185 50%, #f43f5e 100%)" : "none",
                  backgroundSize: "200% auto",
                  backgroundClip: (temperature >= 34 && temperature <= 66) ? "text" : "none",
                  WebkitBackgroundClip: (temperature >= 34 && temperature <= 66) ? "text" : "none",
                  color: (temperature >= 34 && temperature <= 66) ? "transparent" : "rgba(163, 163, 163, 0.75)",
                  textShadow: (temperature >= 34 && temperature <= 66) ? "0 0 10px rgba(244,63,94,0.25)" : "none",
                  animation: (temperature >= 34 && temperature <= 66) ? "label-shimmer 2.2s infinite linear" : "none"
                }}
              >
                灼热
              </span>
              <span className="text-[8px] font-mono font-medium text-neutral-500 tracking-normal opacity-80 mt-0.5">
                34-66%
              </span>
            </motion.div>
            
            {/* Elegant active bar placed strictly and centered under the milestone */}
            <div className="h-[3px] w-6 relative mt-1 flex items-center justify-center">
              {(temperature >= 34 && temperature <= 66) && (
                <motion.span 
                  layoutId="active-milestone-bar"
                  className="absolute inset-x-0 h-[2.5px] bg-[#f43f5e] rounded-full shadow-[0_0_6px_#f43f5e]"
                  transition={{ type: "spring", stiffness: 350, damping: 25 }}
                />
              )}
            </div>
          </div>

          {/* Milestone 3: 沸腾 */}
          <div className="flex flex-col items-center justify-between relative py-0.5 min-h-[34px] sm:min-h-[42px]">
            <motion.div
              animate={temperature >= 67 
                ? { 
                    scale: 1.05, 
                    opacity: 1,
                  } 
                : { 
                    scale: 0.94, 
                    opacity: 0.42,
                  }
              }
              transition={{ duration: 0.5, ease: "easeInOut" }}
              className="flex flex-col items-center cursor-default select-none animate-none"
            >
              <span 
                className="text-center font-sans font-black transition-colors duration-500 text-xs tracking-wider"
                style={{
                  backgroundImage: temperature >= 67 ? "linear-gradient(120deg, #a855f7 0%, #c084fc 50%, #a855f7 100%)" : "none",
                  backgroundSize: "200% auto",
                  backgroundClip: temperature >= 67 ? "text" : "none",
                  WebkitBackgroundClip: temperature >= 67 ? "text" : "none",
                  color: temperature >= 67 ? "transparent" : "rgba(163, 163, 163, 0.75)",
                  textShadow: temperature >= 67 ? "0 0 10px rgba(168,85,247,0.25)" : "none",
                  animation: temperature >= 67 ? "label-shimmer 2.2s infinite linear" : "none"
                }}
              >
                沸腾
              </span>
              <span className="text-[8px] font-mono font-medium text-neutral-500 tracking-normal opacity-80 mt-0.5">
                67-100%
              </span>
            </motion.div>
            
            {/* Elegant active bar placed strictly and centered under the milestone */}
            <div className="h-[3px] w-6 relative mt-1 flex items-center justify-center">
              {temperature >= 67 && (
                <motion.span 
                  layoutId="active-milestone-bar"
                  className="absolute inset-x-0 h-[2.5px] bg-[#a855f7] rounded-full shadow-[0_0_6px_#a855f7]"
                  transition={{ type: "spring", stiffness: 350, damping: 25 }}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 2. LEVEL UP FLOATING BANNER NOTIFIER */}
      <AnimatePresence>
        {phaseBanners.map((msg, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10 }}
            onAnimationComplete={() => {
              // Automatically clear message after 3 seconds
              setTimeout(() => {
                setPhaseBanners(prev => prev.filter(m => m !== msg));
              }, 3000);
            }}
            className="absolute top-16 left-4 right-4 z-50 p-4 text-center glass-card border-rose-500/40 text-rose-200 text-xs font-serif tracking-wide rounded-xl shadow-2xl"
          >
            {msg}
          </motion.div>
        ))}
      </AnimatePresence>

      {/* 3. Center Deck Arena */}
      <div className="flex-1 w-full min-h-0 flex flex-col items-center justify-center relative py-1 xs:py-2.5 sm:py-4 overflow-hidden">
        <AnimatePresence mode="wait">
          {!activeCard ? (
            // DRAWING INSTRUCTION STATE
            <motion.div 
              key="deck-clickable"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.4 }}
              className="flex flex-col items-center space-y-4"
            >
              {/* Beautiful 3D playing card deck stack */}
              <div className="relative w-48 h-64 xs:w-56 xs:h-76 cursor-pointer group" onClick={handleDrawCard} id="btn-draw-card">
                {/* Back card 3 */}
                <div className="absolute inset-0 rounded-2xl bg-neutral-950/80 border border-neutral-900 translate-x-2.5 translate-y-2.5 rotate-3 shadow-lg" />
                {/* Back card 2 */}
                <div className="absolute inset-0 rounded-2xl bg-neutral-900/90 border border-neutral-800 translate-x-1.5 translate-y-1.5 rotate-1 shadow-md" />
                
                {/* Top facing card */}
                <motion.div 
                  whileHover={{ y: -6, scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="absolute inset-0 rounded-2xl bg-gradient-to-b from-neutral-900 to-neutral-950 border border-neutral-800/80 shadow-2xl flex flex-col items-center justify-between p-6 overflow-hidden"
                >
                  {/* Visual accents in deck cover */}
                  <div className="absolute -top-12 -right-12 w-28 h-28 bg-rose-500/5 rounded-full blur-2xl" />
                  <div className="absolute -bottom-12 -left-12 w-28 h-28 bg-amber-500/5 rounded-full blur-2xl" />
                  
                  {/* Brand and mini logo */}
                  <div className="text-center font-sans text-[8px] font-bold tracking-[0.4em] text-neutral-600 uppercase pt-2">
                    THE VIBE
                  </div>

                  <div className="flex flex-col items-center justify-center">
                    <div className="w-14 h-14 rounded-full bg-neutral-950/70 border border-neutral-800/80 flex items-center justify-center text-rose-400 group-hover:text-rose-300 transition-colors">
                      <Sparkles className="w-6 h-6 stroke-[1.2] animate-pulse" />
                    </div>
                    <span className="text-4xl font-serif font-black tracking-[0.25em] text-neutral-200 mt-6 group-hover:text-white transition-all text-shimmer">
                      抽牌
                    </span>
                  </div>

                  {/* Turn reminder inside deck cover */}
                  <div className="text-center pb-2">
                    <span className="text-xs font-serif font-bold text-[#FF9A9E] text-shimmer">
                      {activePlayer.name}
                    </span>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          ) : (
            // CARD REVEAL STATE (FLIPPED ON FLIP ANIMATION)
            <motion.div
              key={`reveal-card-${cardDrawKey}`}
              style={{ x, rotate, touchAction: "pan-y" }}
              drag={isFlipped ? "x" : false}
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.8}
              onDragEnd={handleDragEnd}
              initial={{ opacity: 0, y: 120, scale: 0.97, x: 0 }}
              animate={{ opacity: 1, y: 0, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: "tween", ease: "easeInOut", duration: 0.6 }}
              className="w-full max-w-sm flex items-center justify-center flex-grow mb-[20px] min-h-0 select-none cursor-grab active:cursor-grabbing"
            >
              {/* Perspective container for elegant 3D card flipping */}
              <div 
                style={{ perspective: "1500px" }} 
                className="w-[280px] h-[386px] xs:w-[320px] xs:h-[442px] sm:w-[365px] sm:h-[504px] relative flex items-center justify-center min-h-0"
                onPointerMove={handlePointerMove}
                onPointerLeave={handlePointerLeave}
              >
                <motion.div
                  animate={{ rotateY: isFlipped ? 180 : 0 }}
                  transition={{ type: "tween", ease: "easeInOut", duration: 0.8 }}
                  style={{ transformStyle: "preserve-3d" }}
                  className="w-full h-full relative"
                >
                  
                  {/* FACE 1: CARD BACK SIDE (Visible initially) */}
                  <div
                    style={{ 
                      backfaceVisibility: "hidden",
                      WebkitBackfaceVisibility: "hidden"
                    }}
                    className="absolute inset-0 w-full h-full rounded-3xl glass-card border border-white/10 flex flex-col justify-between px-3.5 py-3 xs:px-4.5 xs:py-3.5 sm:px-5 sm:py-4 shadow-2xl bg-neutral-950/98 select-none overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-neutral-950/45 pointer-events-none rounded-3xl overflow-hidden">
                      <div className="absolute -top-32 -left-32 w-64 h-64 rounded-full bg-rose-500/5 blur-3xl animate-pulse" />
                      <div className="absolute -bottom-32 -right-32 w-64 h-64 rounded-full bg-indigo-500/5 blur-3xl animate-pulse" />
                    </div>

                    {/* Back Header */}
                    <div className="flex justify-between items-center border-b border-neutral-900/60 pb-3">
                      <span className="text-[9px] font-sans font-bold tracking-[0.3em] text-neutral-500">
                        WHISPER DECK
                      </span>
                      <span className="text-[9px] font-mono text-neutral-500 italic">
                        SECRETS
                      </span>
                    </div>

                    {/* Back Center Logo with slow warm pulse */}
                    <div className="flex flex-col items-center justify-center space-y-4">
                      <div className="w-16 h-16 rounded-full border border-rose-500/10 flex items-center justify-center bg-rose-500/[0.02]">
                        <Sparkles className="w-6 h-6 text-rose-400 opacity-60 animate-pulse" />
                      </div>
                      <p className="text-xs text-neutral-400 font-serif tracking-widest text-center italic text-shimmer">
                        闭上双眼，感受彼此的呼吸
                      </p>
                    </div>

                    {/* Back Footer */}
                    <div className="text-center pb-2">
                      <span className="text-[10px] font-sans font-bold tracking-[0.2em] text-[#FF9A9E] animate-pulse text-shimmer">
                        牌即将揭开...
                      </span>
                    </div>
                  </div>

                  {/* FACE 2: CARD FRONT SIDE (Visible after flipped) */}
                  <div
                    style={{ 
                      backfaceVisibility: "hidden",
                      WebkitBackfaceVisibility: "hidden",
                      transform: "rotateY(180deg)"
                    }}
                    className="absolute inset-0 w-full h-full rounded-3xl glass-card border border-white/10 flex flex-col px-3.5 py-3 xs:px-4.5 xs:py-3.5 sm:px-5 sm:py-4 shadow-2xl bg-neutral-950/95 select-none overflow-hidden"
                  >
                    {/* Swipe Watermark Overlays */}
                    {isFlipped && (
                      <>
                        {/* Accept dynamic overlay (Swipe right) */}
                        <motion.div 
                          style={{ opacity: acceptOpacity }}
                          className="absolute inset-0 bg-emerald-500/10 pointer-events-none rounded-3xl border-2 border-emerald-500/30 flex items-center justify-center z-30"
                        >
                          <div className="bg-neutral-950/90 border border-emerald-500/40 px-5 py-2.5 rounded-2xl flex items-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                            <Sparkles className="w-5 h-5 text-emerald-400 animate-pulse flex-shrink-0" />
                            <span className="text-emerald-400 font-sans font-black text-xs tracking-[0.25em] pl-[0.25em]">完成 APPROVE</span>
                          </div>
                        </motion.div>

                        {/* Skip dynamic overlay (Swipe left) */}
                        <motion.div 
                          style={{ opacity: skipOpacity }}
                          className="absolute inset-0 bg-neutral-500/10 pointer-events-none rounded-3xl border-2 border-white/10 flex items-center justify-center z-30"
                        >
                          <div className="bg-neutral-950/90 border border-neutral-700 px-5 py-2.5 rounded-2xl flex items-center gap-2 shadow-xl">
                            <AlertCircle className="w-5 h-5 text-neutral-400 flex-shrink-0" />
                            <span className="text-neutral-400 font-sans font-black text-xs tracking-[0.25em] pl-[0.25em]">认怂 SKIP</span>
                          </div>
                        </motion.div>
                      </>
                    )}

                    {/* Glowing Aura emitted match with cards phase */}
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={isFlipped ? { 
                        opacity: [0.35, 0.7, 0.35],
                        scale: [1.02, 1.07, 1.02]
                      } : {}}
                      transition={{ 
                        delay: 0.4, 
                        duration: 3.0, 
                        repeat: Infinity, 
                        ease: "easeInOut" 
                      }}
                      className="absolute inset-0 -z-20 rounded-3xl filter blur-2xl pointer-events-none"
                      style={{
                        backgroundImage: activeCard.phase === 1 
                          ? 'radial-gradient(circle, rgba(255,154,158,0.55) 0%, transparent 80%)' 
                          : activeCard.phase === 2 
                           ? 'radial-gradient(circle, rgba(255,8,68,0.5) 0%, transparent 80%)' 
                          : 'radial-gradient(circle, rgba(178,36,239,0.55) 0%, transparent 80%)',
                      }}
                    />

                    <div className={`absolute -top-16 -right-16 w-36 h-36 rounded-full blur-3xl opacity-25 ${
                      activeCard.phase === 1 ? 'bg-amber-500/20' : activeCard.phase === 2 ? 'bg-rose-500/20' : 'bg-purple-500/20'
                    }`} />

                    {/* Front Content Fluid Main Container */}
                    <div className="flex-1 min-h-0 w-full flex flex-col justify-between space-y-2.5 overflow-hidden">
                      
                      {/* Dynamic Particle Reveal Dust Effect */}
                      {particles.map(p => (
                        <motion.div
                          key={p.id}
                          initial={{ x: 0, y: 0, scale: 0, opacity: 1, filter: "blur(1.5px)" }}
                          animate={{ x: p.x, y: p.y, scale: [0, 1.2, 0.4], opacity: [1, 1, 0] }}
                          transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1.0] }}
                          className="absolute pointer-events-none rounded-full"
                          style={{
                            left: '50%',
                            top: '50%',
                            width: `${p.size}px`,
                            height: `${p.size}px`,
                            backgroundColor: p.color,
                            boxShadow: `0 0 8px ${p.color}, 0 0 16px ${p.color}`,
                            transform: 'translate(-50%, -50%)',
                            zIndex: 50,
                          }}
                        />
                      ))}

                      {/* Phase & Points Header */}
                      <motion.div 
                        initial={{ filter: "blur(10px)", scale: 1.05, opacity: 0 }}
                        animate={isFlipped ? { filter: "blur(0px)", scale: 1.0, opacity: 1 } : {}}
                        transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1.0], delay: 0.02 }}
                        className="flex items-center justify-between border-b border-neutral-900/45 pb-1.5 flex-shrink-0"
                      >
                        <span className={`text-[9.5px] sm:text-[10px] font-sans font-bold tracking-[0.25em] uppercase ${
                          activeCard.phase === 1 ? 'text-[#FF9A9E]' : activeCard.phase === 2 ? 'text-[#FF0844]' : 'text-[#B224EF]'
                        }`}>
                          {activeCard.phase === 1 ? 'PHASE 01' : activeCard.phase === 2 ? 'PHASE 02' : 'PHASE 03'}
                        </span>
                        <span className="text-[9.5px] sm:text-[10px] font-mono font-bold text-neutral-400">
                          +{activeCard.points}°C
                        </span>
                      </motion.div>

                      {/* Icon & Title */}
                      <div className="text-center py-0.5 flex-shrink-0">
                        <motion.span 
                          initial={{ filter: "blur(10px)", scale: 1.05, opacity: 0 }}
                          animate={isFlipped ? { filter: "blur(0px)", scale: 1.0, opacity: 1 } : {}}
                          transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1.0], delay: 0.05 }}
                          className="text-[clamp(8px,2.2vw,10px)] font-sans font-bold text-neutral-500 uppercase tracking-widest block mb-0.5"
                        >
                          {activeCard.type === 'topic' ? '走心' : activeCard.type === 'action' ? '触碰' : '默契'}
                        </motion.span>
                        
                        <motion.h3 
                          initial={{ filter: "blur(10px)", scale: 1.05, opacity: 0 }}
                          animate={isFlipped ? { filter: "blur(0px)", scale: 1.0, opacity: 1 } : {}}
                          transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1.0], delay: 0.08 }}
                          className="font-serif font-black text-neutral-100 tracking-wide leading-snug text-[clamp(13px,4vw,20px)] text-shimmer"
                        >
                          {activeCard.title}
                        </motion.h3>
                      </div>

                      {/* Main prompt body */}
                      <motion.div 
                        initial={{ filter: "blur(10px)", scale: 1.05, opacity: 0 }}
                        animate={isFlipped ? { filter: "blur(0px)", scale: 1.0, opacity: 1 } : {}}
                        transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1.0], delay: 0.15 }}
                        className="text-center px-1 py-1.5 sm:py-2.5 bg-neutral-950/40 rounded-xl border border-neutral-900/60 flex items-center justify-center flex-shrink-0"
                      >
                        <p className="text-[clamp(11px,3.1vw,14px)] text-neutral-300 font-sans leading-relaxed tracking-wide px-1 text-shimmer">
                          {activeCard.content}
                        </p>
                      </motion.div>

                      {/* Role Specific Prompts */}
                      <div className="space-y-2.5 mt-1.5 pt-2.5 border-t border-dashed border-neutral-900/80 flex-shrink-0 w-full font-sans">
                        {/* Active turn player instruction */}
                        <motion.div 
                          initial={{ filter: "blur(10px)", scale: 1.05, opacity: 0 }}
                          animate={isFlipped ? { filter: "blur(0px)", scale: 1.0, opacity: 1 } : {}}
                          transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1.0], delay: 0.22 }}
                          className="p-1.5 px-2.5 rounded-xl bg-rose-950/10 border border-rose-500/10 text-left flex-shrink-0 w-full"
                        >
                          <div className="flex items-center gap-1 text-[clamp(8.5px,2.4vw,11px)] font-sans font-bold tracking-wider text-rose-300 w-full min-w-0 mb-0.5">
                            <UserCheck className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
                            <span className="truncate flex-1">呼叫：{activePlayer.name}</span>
                          </div>
                          <p className="text-[clamp(9.5px,2.6vw,12px)] text-neutral-300 leading-relaxed font-sans h-auto flex-shrink-0 select-text text-shimmer">
                            {activePlayer.role === 'initiator' ? activeCard.initiatorPrompt : activeCard.receiverPrompt}
                          </p>
                        </motion.div>

                        {/* Passive player instruction */}
                        <motion.div 
                          initial={{ filter: "blur(10px)", scale: 1.05, opacity: 0 }}
                          animate={isFlipped ? { filter: "blur(0px)", scale: 1.0, opacity: 1 } : {}}
                          transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1.0], delay: 0.28 }}
                          className="p-1.5 px-2.5 rounded-xl bg-neutral-950/30 border border-neutral-900 text-left flex-shrink-0 w-full"
                        >
                          <div className="flex items-center gap-1 text-[clamp(8.5px,2.4vw,11px)] font-sans font-bold tracking-wider text-neutral-500 w-full min-w-0 mb-0.5">
                            <Smile className="w-3.5 h-3.5 text-neutral-500 flex-shrink-0" />
                            <span className="truncate flex-1">响应：{passivePlayer.name}</span>
                          </div>
                          <p className="text-[clamp(9.5px,2.6vw,12px)] text-neutral-400 leading-relaxed font-sans h-auto flex-shrink-0 select-text text-shimmer">
                            {passivePlayer.role === 'initiator' ? activeCard.initiatorPrompt : activeCard.receiverPrompt}
                          </p>
                        </motion.div>
                      </div>

                    </div>
                  </div>

                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 4. Bottom Area: Conditional Action Panel OR static active turn state indicators */}
      <div className="w-full mt-2.5 sm:mt-4 flex-shrink-0">
        <AnimatePresence mode="wait">
          {activeCard && isFlipped ? (
            <motion.div
              key="action-panel"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="w-full px-5 flex flex-col gap-3"
            >
              <div className="w-full text-center py-3 px-4 rounded-xl sm:rounded-2xl bg-neutral-950/40 border border-neutral-900/60 shadow-[0_2px_12px_rgba(0,0,0,0.4)]">
                <div className="flex items-center justify-between text-neutral-400 text-xs font-sans tracking-widest select-none">
                  <span className="flex items-center gap-1 text-neutral-500 font-bold hover:text-neutral-400 transition-colors">
                    <span>👈 向左滑认怂</span>
                  </span>
                  <span className="text-[9px] uppercase text-neutral-600 font-bold tracking-[0.2em] animate-pulse">
                    手势操作
                  </span>
                  <span className="flex items-center gap-1 text-[#FF9A9E] font-bold hover:text-rose-300 transition-colors">
                    <span>确认完成 👉</span>
                  </span>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="turn-indicator"
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="p-2.5 xs:p-4 rounded-2xl sm:rounded-3xl glass-panel border border-neutral-900 text-center flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                <span className="text-xs font-serif font-bold text-neutral-300">
                  {activePlayer.name} 回合
                </span>
              </div>
              <span className="text-[9px] sm:text-[10px] font-sans font-bold tracking-widest text-[#FFB199] uppercase">
                NEXT: {passivePlayer.name}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 5. PUNISHMENT WHEEL MODAL */}
      <AnimatePresence>
        {showPunishModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/92 backdrop-blur-md overflow-hidden animate-none">
            
            {/* Blood red pulsing strobe heartbeat effect */}
            <motion.div
              initial={{ opacity: 0.65 }}
              animate={{ opacity: [0.65, 0.1, 0.9, 0.05, 0.8, 0.15, 0.65] }}
              transition={{ repeat: Infinity, duration: 2.0, ease: "linear" }}
              className="absolute inset-0 bg-red-950/40 mix-blend-color-dodge pointer-events-none"
            />

            {/* Simulated electrical lightning strobe lines */}
            <motion.div
              animate={{ opacity: [0, 1, 0, 0.8, 0, 0, 0, 0.9, 0, 0] }}
              transition={{ repeat: Infinity, duration: 3.5, times: [0, 0.03, 0.06, 0.09, 0.12, 0.45, 0.48, 0.51, 0.54, 1] }}
              className="absolute inset-0 bg-red-50/10 pointer-events-none"
            />

            {/* Heavy stamp slap modal box slamming center */}
            <motion.div
              initial={{ opacity: 0, scale: 3.0, filter: 'blur(10px)', rotate: -12 }}
              animate={{ 
                opacity: 1, 
                scale: 1, 
                filter: 'blur(0px)', 
                rotate: 0,
                x: [0, -5, 5, -3, 3, 0],
                y: [0, 6, -6, 4, -4, 0]
              }}
              exit={{ opacity: 0, scale: 0.7, rotate: 8 }}
              transition={{ 
                scale: { type: "spring", stiffness: 450, damping: 14 },
                rotate: { type: "spring", stiffness: 450, damping: 14 },
                x: { type: "tween", ease: "easeInOut", duration: 0.45 },
                y: { type: "tween", ease: "easeInOut", duration: 0.45 },
                default: { duration: 0.45 }
              }}
              className="w-full max-w-sm p-6 glass-card rounded-3xl border border-rose-500/50 text-center relative shadow-[0_0_50px_rgba(255,8,68,0.25)] bg-neutral-950/95"
            >
              {/* Header */}
              <div className="flex justify-center mb-3">
                <div className="w-10 h-10 rounded-full bg-red-550/15 flex items-center justify-center text-rose-400 border border-red-500/25">
                  <GlassWater className="w-5 h-5" />
                </div>
              </div>
              <h3 className="text-xl font-serif font-bold text-rose-100">
                命运惩罚
              </h3>

              {/* Roulette Visual Display */}
              <div className="my-6 p-4 rounded-3xl bg-neutral-955 border border-neutral-900 min-h-[110px] flex flex-col items-center justify-center relative overflow-hidden">
                {/* Visual spinning ring layout decoration */}
                <div className="absolute inset-0 border border-dashed border-rose-500/5 rounded-full animate-spin [animation-duration:30s] pointer-events-none" />

                <AnimatePresence mode="wait">
                  {chosenPunish ? (
                    <motion.div
                      key={chosenPunish.id}
                      initial={{ opacity: 0, scale: 1.8, y: -25, filter: 'blur(4px)' }}
                      animate={{ 
                        opacity: 1, 
                        scale: 1, 
                        y: 0, 
                        filter: 'blur(0px)',
                        x: [0, -3, 3, 0]
                      }}
                      exit={{ opacity: 0 }}
                      transition={{ 
                        scale: { type: "spring", stiffness: 350, damping: 14 },
                        y: { type: "spring", stiffness: 350, damping: 14 },
                        x: { type: "tween", ease: "easeInOut", duration: 0.35 },
                        default: { duration: 0.35 }
                      }}
                      className="space-y-2 pt-1 z-10"
                    >
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-sans font-bold border uppercase tracking-wider ${
                        chosenPunish.type === 'drink' ? 'bg-amber-500/15 text-amber-300 border-amber-500/30' :
                        chosenPunish.type === 'truth' ? 'bg-teal-500/15 text-teal-300 border-teal-500/30' :
                        'bg-rose-500/15 text-rose-300 border-rose-500/30'
                      }`}>
                        {chosenPunish.type === 'drink' ? '罚酒' : chosenPunish.type === 'truth' ? '真心' : '亲密'}
                      </span>
                      <p className="text-xs text-neutral-200 px-2 font-sans leading-relaxed font-black">
                        {chosenPunish.text}
                      </p>
                    </motion.div>
                  ) : (
                    <div className="text-neutral-500 space-y-1">
                      <p className="text-xs font-sans font-bold tracking-widest uppercase">STANDBY</p>
                    </div>
                  )}
                </AnimatePresence>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <motion.button
                  id="btn-spin-roulette"
                  whileTap={{ scale: 0.97 }}
                  onClick={startPunishRoulette}
                  disabled={spinning}
                  className={`w-full py-4 rounded-2xl text-xs font-bold cursor-pointer flex items-center justify-center gap-2 transition-all ${
                    spinning 
                      ? 'bg-neutral-900 text-neutral-600 border border-transparent' 
                      : 'bg-gradient-to-r from-amber-500 to-amber-600 text-neutral-950 shadow-[0_4px_15px_rgba(245,158,11,0.25)]'
                  }`}
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${spinning ? 'animate-spin' : ''}`} />
                  {spinning ? '旋转' : '启动'}
                </motion.button>

                {chosenPunish && !spinning && (
                  <motion.button
                    id="btn-complete-punishment"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    onClick={finishPunishment}
                    className="w-full py-3 bg-neutral-900 hover:bg-neutral-850 border border-neutral-900 rounded-2xl text-xs font-bold text-neutral-300 cursor-pointer"
                  >
                    交替
                  </motion.button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 6. FULL-SCREEN STAGE UP CEREMONY OVERLAY */}
      <AnimatePresence>
        {activeStageUpgrade && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, filter: "blur(15px)" }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
            className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/98 text-center overflow-hidden"
          >
            {/* BACKGROUND LIQUID VORTEX CONVERGE -> RIPPLE BLOOM */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden scale-110">
              
              {/* Converging / Pulsing Core Outer Glow */}
              <motion.div
                initial={{ scale: 0.1, opacity: 0 }}
                animate={{
                  scale: [0.1, 1.8, 1.4, 2.5],
                  opacity: [0, 0.45, 0.8, 0],
                }}
                transition={{
                  times: [0, 0.25, 0.5, 1], // vortex small -> accumulate -> expanding wave -> done
                  duration: 4.8,
                  ease: "easeInOut",
                }}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full filter blur-[100px]"
                style={{
                  backgroundImage: activeStageUpgrade.phase === 2 
                    ? "radial-gradient(circle, #FF0844 0%, #FFB199 50%, transparent 100%)" 
                    : "radial-gradient(circle, #B224EF 0%, #750050 50%, transparent 100%)",
                }}
              />

              {/* Central Vortex (Swallows the screen initially, then spreads out) */}
              <motion.div
                initial={{ scale: 3, opacity: 0.8, rotate: 0 }}
                animate={{
                  scale: [3, 0.4, 6],
                  opacity: [1, 0.95, 0],
                  rotate: [0, 360, 720],
                }}
                transition={{
                  times: [0, 0.28, 1],
                  duration: 4.8,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] rounded-full filter blur-[70px] bg-neutral-950"
                style={{
                  border: activeStageUpgrade.phase === 2
                    ? "20px double rgba(255, 8, 68, 0.65)"
                    : "20px double rgba(178, 36, 239, 0.65)",
                }}
              />

              {/* Second Blooming Aura (ripple ring) */}
              <motion.div
                initial={{ scale: 0.1, opacity: 0 }}
                animate={{
                  scale: [0.1, 0.1, 2.2, 3.8],
                  opacity: [0, 0, 0.9, 0],
                }}
                transition={{
                  times: [0, 0.25, 0.6, 1],
                  duration: 4.8,
                  ease: "easeOut",
                }}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full border-[10px] filter blur-[4px]"
                style={{
                  borderColor: activeStageUpgrade.phase === 2 ? "#FF0844" : "#B224EF",
                  boxShadow: activeStageUpgrade.phase === 2 
                    ? "0 0 80px rgba(255, 8, 68, 0.8)" 
                    : "0 0 80px rgba(178, 36, 239, 0.8)"
                }}
              />

              {/* Continuous micro ambient light background transition */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0.4, 0.75, 1] }}
                transition={{ duration: 4.8, ease: "linear" }}
                className="absolute inset-0 bg-neutral-950/25"
              />
            </div>

            {/* CINEMATIC TEXT CONTROLLER (FADES & BREATHES (0.95 to 1.05) WITH MORPHING GLASS) */}
            <motion.div
              initial={{ opacity: 0, scale: 0.92, filter: "blur(12px)" }}
              animate={{
                opacity: [0, 1, 1, 0],
                scale: [0.92, 0.98, 1.04, 0.95],
                filter: ["blur(12px)", "blur(0px)", "blur(0px)", "blur(16px)"],
              }}
              transition={{
                times: [0, 0.28, 0.86, 1],
                duration: 4.8,
                ease: [0.25, 1, 0.5, 1],
              }}
              className="relative z-20 max-w-md mx-auto space-y-6 px-8 py-10 rounded-3xl border border-white/5 bg-white/[0.02] backdrop-blur-2xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.05),0_24px_50px_-12px_rgba(0,0,0,0.9)] text-center"
            >
              {/* Top micro tag */}
              <motion.div
                initial={{ letterSpacing: "0.25em", opacity: 0 }}
                animate={{ letterSpacing: "0.45em", opacity: 0.4 }}
                transition={{ delay: 1.5, duration: 1.5 }}
                className="text-[9px] font-sans font-bold tracking-[0.45em] text-[#FF9A9E] uppercase mb-1"
              >
                RELATIONSHIP LEVEL UP
              </motion.div>

              {/* Title style */}
              <h1 
                className="text-5xl md:text-6xl font-serif font-black tracking-widest leading-none text-transparent bg-clip-text"
                style={{
                  backgroundImage: activeStageUpgrade.phase === 2 
                    ? "linear-gradient(to right, #FF9A9E, #FF0844, #FFB199)" 
                    : "linear-gradient(to right, #E0C3FC, #B224EF, #750050)",
                  filter: "drop-shadow(0 0 25px rgba(255, 8, 68, 0.25))",
                }}
              >
                {activeStageUpgrade.title}
              </h1>

              {/* Subtitle / Desc with gradient-line accent */}
              <div className="flex flex-col items-center gap-3">
                <div className="w-12 h-[1px] bg-gradient-to-r from-transparent via-white/25 to-transparent" />
                <p className="text-sm text-neutral-300 font-sans tracking-[0.25em] font-medium uppercase">
                  {activeStageUpgrade.subtitle}
                </p>
                <div className="w-12 h-[1px] bg-gradient-to-r from-transparent via-white/25 to-transparent" />
              </div>

              {/* Breathing tip text */}
              <p className="text-[10px] text-neutral-500 font-sans tracking-widest mt-2">
                {activeStageUpgrade.phase === 2 ? "—— 距离被悄然抹平 ——" : "—— 灵魂与体温终在此处沸腾 ——"}
              </p>
            </motion.div>

            {/* Ambient vignette lines */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_30%,rgba(0,0,0,0.9)_100%)] pointer-events-none z-30" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
