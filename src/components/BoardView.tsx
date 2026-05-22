import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from 'motion/react';
import { 
  Flame, 
  Sparkles, 
  AlertCircle, 
  RefreshCw, 
  GlassWater,
  Smile, 
  UserCheck,
  Fingerprint,
  LockKeyhole,
  MessageCircleHeart,
  HandHeart,
  WandSparkles
} from 'lucide-react';
import { Card, CARDS_POOL, PENALTY_POOL, PenaltyTask } from '../data/cards';
import { PHASE_THREE_THRESHOLD, PHASE_TWO_THRESHOLD } from '../constants/game';
import { Player } from '../types';
import { triggerVibration } from '../utils/haptics';

interface Particle {
  id: number;
  x: number;
  y: number;
  color: string;
  size: number;
}

interface DragEndInfo {
  offset: {
    x: number;
  };
}

interface BoardViewProps {
  playerA: Player;
  playerB: Player;
  intensityLimit: 'level1' | 'level2' | 'all';
  onClimax: () => void;
  onTemperatureChange: (temp: number) => void;
}

interface ResonanceHeartbeatProps {
  active: boolean;
  completed: boolean;
  ratio: number;
  pulseDuration: number;
}

const SKIP_TEMPERATURE_PENALTY = 5;
const RESONANCE_COMPLETE = 100;
const RESONANCE_STEP = 4;
const CARD_REVEAL_DELAY_MS = 420;
const CARD_EXIT_SETTLE_MS = 120;
const CARD_SWIPE_RESET_MS = 540;
const PUNISHMENT_CLOSE_SETTLE_MS = 180;

function ResonanceHeartbeat({ active, completed, ratio, pulseDuration }: ResonanceHeartbeatProps) {
  const pathLength = active || completed ? Math.min(1, 0.36 + ratio * 0.64) : 0.28;
  const glowOpacity = completed ? 0.86 : active ? 0.42 + ratio * 0.42 : 0.18;
  const strokeColor = completed ? '#fce7f3' : active ? '#fb7185' : '#7f1d1d';
  const accentColor = completed ? '#f0abfc' : active ? '#ffb199' : '#3f121c';

  return (
    <div className="order-2 relative h-28 flex items-center justify-center">
      <motion.div
        animate={{
          opacity: [glowOpacity * 0.45, glowOpacity, glowOpacity * 0.45],
          scaleX: active ? [0.88, 1.04, 0.88] : 0.86,
        }}
        transition={{ repeat: Infinity, duration: pulseDuration, ease: "easeInOut" }}
        className="absolute h-16 w-full rounded-full bg-[radial-gradient(ellipse_at_center,rgba(255,8,68,0.30),rgba(178,36,239,0.18),transparent_68%)]"
      />

      <motion.svg
        viewBox="0 0 260 88"
        role="img"
        aria-label="共燃心跳线"
        className="relative z-10 h-24 w-full overflow-visible"
        animate={{ scale: active ? [0.98, 1.025, 0.98] : 1 }}
        transition={{ repeat: Infinity, duration: pulseDuration, ease: "easeInOut" }}
      >
        <defs>
          <linearGradient id="resonancePulseGradient" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor="transparent" />
            <stop offset="24%" stopColor={accentColor} />
            <stop offset="50%" stopColor={strokeColor} />
            <stop offset="76%" stopColor="#b224ef" />
            <stop offset="100%" stopColor="transparent" />
          </linearGradient>
          <filter id="resonanceSoftGlow" x="-20%" y="-80%" width="140%" height="260%">
            <feGaussianBlur stdDeviation="2.4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <motion.path
          d="M10 44 H38 L47 34 L57 56 L70 18 L84 44 H114"
          fill="none"
          stroke="url(#resonancePulseGradient)"
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter="url(#resonanceSoftGlow)"
          initial={false}
          animate={{
            pathLength,
            opacity: active ? [0.58, 1, 0.58] : 0.38,
            x: active ? [0, 3, 0] : 0,
          }}
          transition={{ repeat: Infinity, duration: pulseDuration, ease: "easeInOut" }}
        />
        <motion.path
          d="M250 44 H222 L213 34 L203 56 L190 18 L176 44 H146"
          fill="none"
          stroke="url(#resonancePulseGradient)"
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter="url(#resonanceSoftGlow)"
          initial={false}
          animate={{
            pathLength,
            opacity: active ? [0.58, 1, 0.58] : 0.38,
            x: active ? [0, -3, 0] : 0,
          }}
          transition={{ repeat: Infinity, duration: pulseDuration, ease: "easeInOut" }}
        />
        <motion.path
          d="M130 56 C119 47 112 41 112 32 C112 25 117 20 124 20 C128 20 131 22 130 26 C132 22 136 20 140 20 C147 20 152 25 152 32 C152 41 141 49 130 56 Z"
          fill={completed ? 'rgba(252,231,243,0.34)' : active ? 'rgba(251,113,133,0.24)' : 'rgba(127,29,29,0.16)'}
          stroke={strokeColor}
          strokeWidth="2"
          filter="url(#resonanceSoftGlow)"
          initial={false}
          animate={{
            scale: active ? [1, 1.16 + ratio * 0.08, 1] : 1,
            opacity: active || completed ? 1 : 0.48,
          }}
          style={{ originX: '50%', originY: '50%' }}
          transition={{ repeat: Infinity, duration: pulseDuration, ease: "easeInOut" }}
        />
        {completed && (
          <motion.path
            d="M92 44 H168"
            fill="none"
            stroke="#fce7f3"
            strokeWidth="1.6"
            strokeLinecap="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: [0, 1, 0.4], opacity: [0, 1, 0] }}
            transition={{ duration: 0.85, ease: "easeOut" }}
          />
        )}
      </motion.svg>
    </div>
  );
}

type CardType = Card['type'];

const CARD_TYPE_META: Record<CardType, {
  label: string;
  accent: string;
  softBg: string;
  aura: string;
  Icon: React.ComponentType<{ className?: string }>;
}> = {
  topic: {
    label: '走心',
    accent: '#FFB199',
    softBg: 'rgba(255,177,153,0.11)',
    aura: 'radial-gradient(circle, rgba(255,177,153,0.36) 0%, transparent 72%)',
    Icon: MessageCircleHeart,
  },
  game: {
    label: '默契',
    accent: '#FECFEF',
    softBg: 'rgba(254,207,239,0.10)',
    aura: 'radial-gradient(circle, rgba(254,207,239,0.34) 0%, transparent 72%)',
    Icon: Sparkles,
  },
  action: {
    label: '触碰',
    accent: '#FF0844',
    softBg: 'rgba(255,8,68,0.11)',
    aura: 'radial-gradient(circle, rgba(255,8,68,0.32) 0%, transparent 72%)',
    Icon: HandHeart,
  },
  play: {
    label: '玩乐',
    accent: '#B224EF',
    softBg: 'rgba(178,36,239,0.13)',
    aura: 'radial-gradient(circle, rgba(178,36,239,0.36) 0%, rgba(255,177,153,0.12) 42%, transparent 76%)',
    Icon: WandSparkles,
  },
};

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
  const [temperature, setTemperature] = useState(0);
  const [currentTurn, setCurrentTurn] = useState<'A' | 'B'>('A'); // Turn alternates A and B
  const [phase3Unlocked, setPhase3Unlocked] = useState(false);
  const [phase3OptedOut, setPhase3OptedOut] = useState(false);
  
  // Card revelation flow
  const [activeCard, setActiveCard] = useState<Card | null>(null);
  const [isFlipped, setIsFlipped] = useState(false);
  const [cardDrawKey, setCardDrawKey] = useState(0); // Trigger physical animation on draw

  // Starburst particle states
  const [particles, setParticles] = useState<Particle[]>([]);

  const triggerParticleReveal = (phase: number) => {
    const count = 5 + Math.floor(Math.random() * 2);
    const newParticles: Particle[] = [];
    const colors = phase === 1 
      ? ['#FF9A9E', '#FECFEF', '#FFD1FF', '#FFBDC3']
      : phase === 2 
        ? ['#FF0844', '#FF4E50', '#FF416C', '#FF9A9E']
        : ['#B224EF', '#7579FF', '#FF0844', '#EC4899', '#A855F7'];

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const distance = 28 + Math.random() * 54;
      const xOffset = Math.cos(angle) * distance;
      const yOffset = Math.sin(angle) * distance;
      const size = 2.5 + Math.random() * 3.5;

      newParticles.push({
        id: Date.now() + i + Math.random(),
        x: xOffset,
        y: yOffset,
        color: colors[Math.floor(Math.random() * colors.length)],
        size,
      });
    }

    setParticles(newParticles);

    setTimeout(() => {
      setParticles([]);
    }, 460);
  };

  // Dynamic animations & feedback states
  const [isSkipping, setIsSkipping] = useState(false);
  const [burstTrigger, setBurstTrigger] = useState(0);
  const [burstPhase, setBurstPhase] = useState(1);
  const [showResonanceConfirm, setShowResonanceConfirm] = useState(false);
  const [resonancePressedA, setResonancePressedA] = useState(false);
  const [resonancePressedB, setResonancePressedB] = useState(false);
  const [resonanceProgress, setResonanceProgress] = useState(0);
  const [resonanceCompleted, setResonanceCompleted] = useState(false);
  const resonanceTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const resonanceCompleteTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Swipe logic
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-15, 15]);
  const acceptOpacity = useTransform(x, [0, 100], [0, 1]);
  const skipOpacity = useTransform(x, [-100, 0], [1, 0]);
  const cardRectRef = useRef<DOMRect | null>(null);
  const pointerFrameRef = useRef<number | null>(null);
  const pendingPointerRef = useRef<{
    element: HTMLDivElement;
    x: number;
    y: number;
  } | null>(null);
  const [isDraggingCard, setIsDraggingCard] = useState(false);

  // Reset offset on card draw or state reset
  useEffect(() => {
    x.set(0);
  }, [cardDrawKey, x]);

  const handleDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: DragEndInfo) => {
    setIsDraggingCard(false);
    cardRectRef.current = null;
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

  const resetCardSpotlight = useCallback((card: HTMLDivElement) => {
    card.style.setProperty('--mouse-x', '-999px');
    card.style.setProperty('--mouse-y', '-999px');
  }, []);

  const handlePointerEnter = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    cardRectRef.current = e.currentTarget.getBoundingClientRect();
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (isDraggingCard) return;

    const rect = cardRectRef.current ?? e.currentTarget.getBoundingClientRect();
    cardRectRef.current = rect;
    pendingPointerRef.current = {
      element: e.currentTarget,
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };

    if (pointerFrameRef.current !== null) return;

    pointerFrameRef.current = window.requestAnimationFrame(() => {
      pointerFrameRef.current = null;
      const pending = pendingPointerRef.current;
      if (!pending) return;

      pending.element.style.setProperty('--mouse-x', `${pending.x}px`);
      pending.element.style.setProperty('--mouse-y', `${pending.y}px`);
    });
  }, [isDraggingCard]);

  const handlePointerLeave = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    cardRectRef.current = null;
    pendingPointerRef.current = null;
    if (pointerFrameRef.current !== null) {
      window.cancelAnimationFrame(pointerFrameRef.current);
      pointerFrameRef.current = null;
    }
    resetCardSpotlight(e.currentTarget);
  }, [resetCardSpotlight]);

  useEffect(() => {
    return () => {
      if (pointerFrameRef.current !== null) {
        window.cancelAnimationFrame(pointerFrameRef.current);
      }
    };
  }, []);

  // Punishment Wheel States
  const [showPunishModal, setShowPunishModal] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const [chosenPunish, setChosenPunish] = useState<PenaltyTask | null>(null);

  // Stage up interrupt banner ceremony
  const [activeStageUpgrade, setActiveStageUpgrade] = useState<{
    phase: 1 | 2 | 3;
    title: string;
    subtitle: string;
  } | null>(null);
  const upgradeTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const [phaseBanners, setPhaseBanners] = useState<string[]>([]);
  const [currentPhase, setCurrentPhase] = useState<1 | 2 | 3>(1);

  // Active player info helper
  const activePlayer = currentTurn === 'A' ? playerA : playerB;
  const passivePlayer = currentTurn === 'A' ? playerB : playerA;

  // Determine current active game phase dynamically from temperature
  const computedPhase = React.useMemo<1 | 2 | 3>(() => {
    if (intensityLimit === 'level1') return 1;
    if (temperature < PHASE_TWO_THRESHOLD) return 1;
    if (intensityLimit === 'level2') return 2;
    if (temperature < PHASE_THREE_THRESHOLD || !phase3Unlocked || phase3OptedOut) return 2;
    return 3;
  }, [intensityLimit, phase3OptedOut, phase3Unlocked, temperature]);

  const visibleMilestones = React.useMemo(() => {
    if (intensityLimit === 'level1') {
      return [
        { phase: 1 as const, label: '微温', range: '0-100%', locked: false },
      ];
    }

    if (intensityLimit === 'level2') {
      return [
        { phase: 1 as const, label: '微温', range: '0-39%', locked: false },
        { phase: 2 as const, label: '灼热', range: '40-100%', locked: false },
      ];
    }

    return [
      { phase: 1 as const, label: '微温', range: '0-39%', locked: false },
      { phase: 2 as const, label: '灼热', range: '40-79%', locked: false },
      { phase: 3 as const, label: '沸腾', range: '80-100%', locked: !phase3Unlocked },
    ];
  }, [intensityLimit, phase3Unlocked]);

  const ambientTemperatureFor = useCallback((temp: number) => {
    if (intensityLimit === 'level1') return Math.min(temp, PHASE_TWO_THRESHOLD - 1);
    if (intensityLimit === 'level2') return Math.min(temp, PHASE_THREE_THRESHOLD - 1);
    if (!phase3Unlocked || phase3OptedOut) return Math.min(temp, PHASE_THREE_THRESHOLD - 1);
    return temp;
  }, [intensityLimit, phase3OptedOut, phase3Unlocked]);

  // Dynamic phase details representing temperature stages strictly to fix any phase-one ambiguity
  const currentPhaseInfo = React.useMemo(() => {
    if (computedPhase === 1) {
      return {
        number: 1,
        label: intensityLimit === 'level1' ? "微温进度" : "微温",
        engLabel: "WARM",
        colorClass: "text-amber-300 border-amber-500/20 bg-amber-500/10",
        flameColor: "text-amber-400 fill-amber-500 animate-[flame-float_2.4s_infinite_ease-in-out]",
        bgGradient: "linear-gradient(90deg, #b45309, #f59e0b, #fb7185, #f59e0b, #b45309)",
        animDuration: intensityLimit === 'level1' ? "5.5s" : "3.5s",
        glowEffect: "shadow-[0_0_10px_rgba(245,158,11,0.08)]",
      };
    } else if (computedPhase === 2) {
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
  }, [computedPhase, intensityLimit]);

  // Watch for phase upgrades to trigger visual banners
  useEffect(() => {
    if (computedPhase !== currentPhase) {
      if (computedPhase > currentPhase) {
        const title = computedPhase === 2 ? "温度升高" : "共振打开";
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
        }, computedPhase === 2 ? 1800 : 3600);

        // Keep standard console or mini banner backup
        const upgradeMsg = computedPhase === 2 
          ? "关系升温，灼热阶段已点亮" 
          : "双方已确认，沸腾阶段开启";
        setPhaseBanners(prev => [...prev, upgradeMsg]);

        setCurrentPhase(computedPhase);
      } else {
        setCurrentPhase(computedPhase);
      }
    }
  }, [computedPhase, currentPhase]);

  // Clean up timer strictly on component unmount
  useEffect(() => {
    return () => {
      if (upgradeTimerRef.current) {
        clearTimeout(upgradeTimerRef.current);
      }
      if (resonanceTimerRef.current) {
        clearInterval(resonanceTimerRef.current);
      }
      if (resonanceCompleteTimerRef.current) {
        clearTimeout(resonanceCompleteTimerRef.current);
      }
    };
  }, []);

  const resonanceBothPressed = resonancePressedA && resonancePressedB;

  useEffect(() => {
    if (!showResonanceConfirm || resonanceCompleted) {
      if (resonanceTimerRef.current) {
        clearInterval(resonanceTimerRef.current);
        resonanceTimerRef.current = null;
      }
      return;
    }

    resonanceTimerRef.current = setInterval(() => {
      setResonanceProgress(prev => {
        const next = resonanceBothPressed
          ? Math.min(RESONANCE_COMPLETE, prev + RESONANCE_STEP)
          : Math.max(0, prev - RESONANCE_STEP * 1.5);

        if (next >= RESONANCE_COMPLETE) {
          if (resonanceTimerRef.current) {
            clearInterval(resonanceTimerRef.current);
            resonanceTimerRef.current = null;
          }
          setResonanceCompleted(true);
          triggerVibration([30, 70, 30, 120, 50]);
          resonanceCompleteTimerRef.current = setTimeout(() => {
            setShowResonanceConfirm(false);
            setPhase3Unlocked(true);
            setResonancePressedA(false);
            setResonancePressedB(false);
            setResonanceProgress(0);
            setResonanceCompleted(false);
            onTemperatureChange(Math.max(PHASE_THREE_THRESHOLD, temperature));
          }, 850);
        }

        return next;
      });
    }, 95);

    return () => {
      if (resonanceTimerRef.current) {
        clearInterval(resonanceTimerRef.current);
        resonanceTimerRef.current = null;
      }
    };
  }, [onTemperatureChange, resonanceBothPressed, resonanceCompleted, showResonanceConfirm, temperature]);

  const handleStayInPhaseTwo = () => {
    setPhase3OptedOut(true);
    setShowResonanceConfirm(false);
    setResonancePressedA(false);
    setResonancePressedB(false);
    setResonanceProgress(0);
    setResonanceCompleted(false);
    onTemperatureChange(Math.min(temperature, PHASE_THREE_THRESHOLD - 1));
  };

  const shouldPromptPhaseThree = useCallback((temp: number) => (
    intensityLimit === 'all' &&
    temp >= PHASE_THREE_THRESHOLD &&
    !phase3Unlocked &&
    !phase3OptedOut
  ), [intensityLimit, phase3OptedOut, phase3Unlocked]);

  // Filter possible cards based on current phase (level-up dynamics)
  // This ensures players don't draw Phase 3 cards immediately even if 'all' is selected.
  // Instead, the active draw stack delivers cards matching the temperature scale!
  const getNextAppropriateCard = () => {
    // Determine target phase scope
    const targetPhasesAllowed = [1];
    if (intensityLimit !== 'level1' && temperature >= PHASE_TWO_THRESHOLD) {
      targetPhasesAllowed.push(2);
    }
    if (
      intensityLimit === 'all' &&
      temperature >= PHASE_THREE_THRESHOLD &&
      phase3Unlocked &&
      !phase3OptedOut
    ) {
      targetPhasesAllowed.push(3);
    }

    // Look for a card in deck that matches allowed phase scope
    let index = deck.findIndex(c => targetPhasesAllowed.includes(c.phase));

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
      if (shouldPromptPhaseThree(temperature)) {
        setShowResonanceConfirm(true);
        return;
      }
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
    }, CARD_REVEAL_DELAY_MS);
  };

  const handleAcceptCard = (points: number) => {
    // Sound confirmation or device feedback can be simulated visually
    const nextTemp = Math.min(100, temperature + points);
    setTemperature(nextTemp);
    onTemperatureChange(ambientTemperatureFor(nextTemp));
    
    // Keep the accepted card offscreen during its exit animation, then reset for the next draw.
    setActiveCard(null);
    setIsFlipped(false);
    setParticles([]);
    setDiscardedCount(prev => prev + 1);
    setTimeout(() => {
      x.set(0);
    }, CARD_SWIPE_RESET_MS);

    if (shouldPromptPhaseThree(nextTemp)) {
      setShowResonanceConfirm(true);
    }

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
    setParticles([]);
    setIsFlipped(false);
    setActiveCard(null);
    setTimeout(() => {
      x.set(0);
    }, CARD_SWIPE_RESET_MS);

    setTimeout(() => {
      setShowPunishModal(true);
      setChosenPunish(null);
      setIsSkipping(false);
    }, CARD_EXIT_SETTLE_MS);
  };

  // Spin the penalty wheel
  const startPunishRoulette = () => {
    if (spinning) return;
    setSpinning(true);
    setChosenPunish(null);

    let counter = 0;
    const totalSpins = 8;
    const interval = setInterval(() => {
      const tempPunish = PENALTY_POOL[Math.floor(Math.random() * PENALTY_POOL.length)];
      setChosenPunish(tempPunish);
      counter++;

      if (counter >= totalSpins) {
        clearInterval(interval);
        // Decelerate and choose final
        const finalPunish = PENALTY_POOL[Math.floor(Math.random() * PENALTY_POOL.length)];
        setChosenPunish(finalPunish);
        setSpinning(false);
      }
    }, 120);
  };

  const finishPunishment = () => {
    setShowPunishModal(false);

    setTimeout(() => {
      // Dismiss active card and transition turn without changing temperature
      x.set(0);
      setActiveCard(null);
      setIsFlipped(false);
      setDiscardedCount(prev => prev + 1);

      if (deck.length === 0) {
        setTimeout(() => {
          onClimax();
        }, 1200);
      } else {
        setCurrentTurn(prev => prev === 'A' ? 'B' : 'A');
      }
    }, PUNISHMENT_CLOSE_SETTLE_MS);
  };

  const handleDirectSkip = () => {
    setShowPunishModal(false);
    const nextTemp = Math.max(0, temperature - SKIP_TEMPERATURE_PENALTY);
    setTemperature(nextTemp);
    onTemperatureChange(ambientTemperatureFor(nextTemp));

    setTimeout(() => {
      x.set(0);
      setActiveCard(null);
      setIsFlipped(false);
      setDiscardedCount(prev => prev + 1);

      if (deck.length === 0) {
        setTimeout(() => {
          onClimax();
        }, 1200);
      } else {
        setCurrentTurn(prev => prev === 'A' ? 'B' : 'A');
      }
    }, PUNISHMENT_CLOSE_SETTLE_MS);
  };

  const activeCardTypeMeta = activeCard ? CARD_TYPE_META[activeCard.type] : null;
  const ActiveCardTypeIcon = activeCardTypeMeta?.Icon;
  const resonanceRatio = resonanceProgress / RESONANCE_COMPLETE;
  const resonancePulseDuration = Math.max(0.32, 1.35 - resonanceRatio * 0.95);

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
              <span>{intensityLimit === 'level1' ? currentPhaseInfo.label : `Phase ${currentPhaseInfo.number} · ${currentPhaseInfo.label}`}</span>
            </motion.div>
          </div>
          
          <div className="text-right flex items-baseline gap-1 animate-none">
            <span className="text-[9px] font-sans font-bold tracking-wider text-neutral-500 uppercase">今晚温度</span>
            <span className="text-base font-mono font-black text-rose-400 min-w-[50px] text-right">
              {temperature}°C
            </span>
          </div>
        </div>

        {/* Liquid Progress Bar with dynamic breathing container glow */}
        <div className="relative w-full h-3.5">
          <div className={`w-full h-full bg-neutral-950 rounded-full p-0.5 border transition-all duration-700 ease-out ${
            computedPhase === 1 
              ? "border-neutral-900/40 shadow-[inset_0_2px_4px_rgba(0,0,0,0.65)]" 
              : computedPhase === 2 
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
                  boxShadow: computedPhase === 1 
                    ? "0 0 6px 1.5px #ffd1a4, 0 0 12px 2px #f59e0b" 
                    : computedPhase === 2 
                    ? "0 0 10px 2px #ff7c9c, 0 0 18px 3px #ff0844" 
                    : "0 0 12px 2.5px #e29eff, 0 0 22px 4px #b224ef",
                  animation: computedPhase === 3 ? "glow-dot-pulse 1s infinite ease-in-out" : undefined
                }}
              />
            </motion.div>
          )}
        </div>

        {intensityLimit === 'level1' ? (
          <div className="pt-1 text-center text-[9.5px] font-sans font-bold tracking-[0.24em] text-neutral-500 uppercase">
            微温模式 · 只记录今晚慢慢升起的温度
          </div>
        ) : (
          <div
            className="grid text-center text-[10px] font-sans font-bold tracking-wider relative pt-0.5"
            style={{ gridTemplateColumns: `repeat(${visibleMilestones.length}, minmax(0, 1fr))` }}
          >
            {visibleMilestones.map((milestone) => {
              const isActive = computedPhase === milestone.phase;
              const phaseColor = milestone.phase === 1 ? '#f59e0b' : milestone.phase === 2 ? '#f43f5e' : '#a855f7';
              const gradient = milestone.phase === 1
                ? "linear-gradient(120deg, #f59e0b 0%, #ff8008 50%, #f59e0b 100%)"
                : milestone.phase === 2
                  ? "linear-gradient(120deg, #f43f5e 0%, #fb7185 50%, #f43f5e 100%)"
                  : "linear-gradient(120deg, #a855f7 0%, #c084fc 50%, #a855f7 100%)";

              return (
                <div key={milestone.phase} className="flex flex-col items-center justify-between relative py-0.5 min-h-[34px] sm:min-h-[42px]">
                  <motion.div
                    animate={isActive ? { scale: 1.05, opacity: 1 } : { scale: 0.94, opacity: milestone.locked ? 0.28 : 0.42 }}
                    transition={{ duration: 0.5, ease: "easeInOut" }}
                    className="flex flex-col items-center cursor-default select-none animate-none"
                  >
                    <span
                      className="inline-flex items-center gap-1 text-center font-sans font-black transition-colors duration-500 text-xs tracking-wider"
                      style={{
                        backgroundImage: isActive ? gradient : "none",
                        backgroundSize: "200% auto",
                        backgroundClip: isActive ? "text" : "none",
                        WebkitBackgroundClip: isActive ? "text" : "none",
                        color: isActive ? "transparent" : "rgba(163, 163, 163, 0.75)",
                        textShadow: isActive ? `0 0 10px ${phaseColor}40` : "none",
                        animation: isActive ? "label-shimmer 2.2s infinite linear" : "none"
                      }}
                    >
                      {milestone.locked && <LockKeyhole className="w-3 h-3 text-neutral-600" />}
                      {milestone.label}
                    </span>
                    <span className="text-[8px] font-mono font-medium text-neutral-500 tracking-normal opacity-80 mt-0.5">
                      {milestone.range}
                    </span>
                  </motion.div>

                  <div className="h-[3px] w-6 relative mt-1 flex items-center justify-center">
                    {isActive && (
                      <motion.span
                        layoutId="active-milestone-bar"
                        className="absolute inset-x-0 h-[2.5px] rounded-full"
                        style={{
                          backgroundColor: phaseColor,
                          boxShadow: `0 0 6px ${phaseColor}`,
                        }}
                        transition={{ type: "spring", stiffness: 350, damping: 25 }}
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
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
              dragElastic={0.45}
              dragMomentum={false}
              onDragStart={() => setIsDraggingCard(true)}
              onDragEnd={handleDragEnd}
              initial={{ opacity: 0, y: 120, scale: 0.97, x: 0 }}
              animate={{ opacity: 1, y: 0, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: "tween", ease: [0.22, 1, 0.36, 1], duration: 0.46 }}
              className={`w-full max-w-sm flex items-center justify-center flex-grow mb-[20px] min-h-0 select-none cursor-grab active:cursor-grabbing ${isDraggingCard ? 'card-dragging' : ''}`}
            >
              {/* Perspective container for elegant 3D card flipping */}
              <div 
                style={{ perspective: "1500px" }} 
                className="w-[280px] h-[386px] xs:w-[320px] xs:h-[442px] sm:w-[365px] sm:h-[504px] relative flex items-center justify-center min-h-0"
                onPointerEnter={handlePointerEnter}
                onPointerMove={handlePointerMove}
                onPointerLeave={handlePointerLeave}
              >
                <motion.div
                  animate={{ rotateY: isFlipped ? 180 : 0 }}
                  transition={{ type: "tween", ease: [0.22, 1, 0.36, 1], duration: 0.62 }}
                  style={{ transformStyle: "preserve-3d", willChange: "transform" }}
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
                      <div className="absolute -top-32 -left-32 w-64 h-64 rounded-full bg-rose-500/5 blur-2xl" />
                      <div className="absolute -bottom-32 -right-32 w-64 h-64 rounded-full bg-indigo-500/5 blur-2xl" />
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
                        <Sparkles className="w-6 h-6 text-rose-400 opacity-60" />
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
                      animate={isFlipped && !isDraggingCard ? { opacity: 0.24, scale: 1.01 } : { opacity: 0, scale: 1 }}
                      transition={{ 
                        delay: 0.25, 
                        duration: 0.4, 
                        ease: "easeOut" 
                      }}
                      className="card-aura absolute inset-0 -z-20 rounded-3xl filter blur-sm pointer-events-none"
                      style={{
                        backgroundImage: activeCardTypeMeta?.aura,
                      }}
                    />

                    <div
                      className="absolute -top-16 -right-16 w-32 h-32 rounded-full blur-2xl opacity-[0.18]"
                      style={{ backgroundColor: activeCardTypeMeta?.accent }}
                    />

                    {/* Front Content Fluid Main Container */}
                    <div className="flex-1 min-h-0 w-full flex flex-col justify-between space-y-2.5 overflow-hidden">
                      
                      {/* Dynamic Particle Reveal Dust Effect */}
                      {particles.map(p => (
                        <motion.div
                          key={p.id}
                          initial={{ x: 0, y: 0, scale: 0, opacity: 0.8, filter: "blur(0.5px)" }}
                          animate={{ x: p.x, y: p.y, scale: [0, 1.2, 0.4], opacity: [1, 1, 0] }}
                          transition={{ duration: 0.42, ease: [0.25, 0.1, 0.25, 1.0] }}
                          className="absolute pointer-events-none rounded-full"
                          style={{
                            left: '50%',
                            top: '50%',
                            width: `${p.size}px`,
                            height: `${p.size}px`,
                            backgroundColor: p.color,
                            boxShadow: `0 0 6px ${p.color}`,
                            transform: 'translate(-50%, -50%)',
                            zIndex: 50,
                          }}
                        />
                      ))}

                      {/* Phase & Points Header */}
                      <motion.div 
                        initial={{ y: 8, scale: 1.03, opacity: 0 }}
                        animate={isFlipped ? { y: 0, scale: 1.0, opacity: 1 } : {}}
                        transition={{ duration: 0.48, ease: [0.22, 1, 0.36, 1], delay: 0.02 }}
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
                          initial={{ y: 6, scale: 1.03, opacity: 0 }}
                          animate={isFlipped ? { y: 0, scale: 1.0, opacity: 1 } : {}}
                          transition={{ duration: 0.48, ease: [0.22, 1, 0.36, 1], delay: 0.04 }}
                          className="inline-flex items-center justify-center gap-1.5 rounded-full border px-2.5 py-1 text-[clamp(8px,2.2vw,10px)] font-sans font-bold uppercase tracking-widest mb-1"
                          style={{
                            color: activeCardTypeMeta?.accent,
                            backgroundColor: activeCardTypeMeta?.softBg,
                            borderColor: `${activeCardTypeMeta?.accent}33`,
                          }}
                        >
                          {ActiveCardTypeIcon && <ActiveCardTypeIcon className="w-3 h-3" />}
                          {activeCardTypeMeta?.label}
                        </motion.span>
                        
                        <motion.h3 
                          initial={{ y: 8, scale: 1.03, opacity: 0 }}
                          animate={isFlipped ? { y: 0, scale: 1.0, opacity: 1 } : {}}
                          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: 0.06 }}
                          className="font-serif font-black text-neutral-100 tracking-wide leading-snug text-[clamp(13px,4vw,20px)] text-shimmer"
                        >
                          {activeCard.title}
                        </motion.h3>
                      </div>

                      {/* Main prompt body */}
                      <motion.div 
                        initial={{ y: 10, scale: 1.03, opacity: 0 }}
                        animate={isFlipped ? { y: 0, scale: 1.0, opacity: 1 } : {}}
                        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
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
                          initial={{ y: 10, scale: 1.02, opacity: 0 }}
                          animate={isFlipped ? { y: 0, scale: 1.0, opacity: 1 } : {}}
                          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: 0.14 }}
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
                          initial={{ y: 10, scale: 1.02, opacity: 0 }}
                          animate={isFlipped ? { y: 0, scale: 1.0, opacity: 1 } : {}}
                          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: 0.18 }}
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
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/86 backdrop-blur-lg overflow-hidden animate-none">
            
            {/* Soft pause glow, less punitive and more like a quiet turn in the road */}
            <motion.div
              initial={{ opacity: 0.18 }}
              animate={{ opacity: [0.18, 0.34, 0.18], scale: [1, 1.05, 1] }}
              transition={{ repeat: Infinity, duration: 4.5, ease: "easeInOut" }}
              className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,177,153,0.18),transparent_62%)] pointer-events-none"
            />

            <motion.div
              animate={{ opacity: [0.08, 0.18, 0.08] }}
              transition={{ repeat: Infinity, duration: 3.8, ease: "easeInOut" }}
              className="absolute inset-0 bg-rose-950/20 pointer-events-none"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 18 }}
              animate={{ 
                opacity: 1, 
                scale: 1, 
                y: 0
              }}
              exit={{ opacity: 0, scale: 0.94, y: 12 }}
              transition={{ 
                type: "spring",
                stiffness: 260,
                damping: 24
              }}
              className="w-full max-w-sm p-6 glass-card rounded-3xl border border-rose-500/20 text-center relative shadow-[0_0_48px_rgba(255,177,153,0.16)] bg-neutral-950/95"
            >
              {/* Header */}
              <div className="flex justify-center mb-3">
                <div className="w-10 h-10 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-300 border border-rose-500/20">
                  <GlassWater className="w-5 h-5" />
                </div>
              </div>
              <h3 className="text-xl font-serif font-bold text-rose-100 tracking-wide">
                缓一缓
              </h3>
              <p className="mt-2 text-[10px] text-neutral-500 font-sans tracking-[0.18em] uppercase">
                换一种方式，把今晚的节奏接住
              </p>

              {/* Roulette Visual Display */}
              <div className="my-6 p-4 rounded-3xl bg-neutral-950/70 border border-neutral-900 min-h-[118px] flex flex-col items-center justify-center relative overflow-hidden">
                {/* Visual spinning ring layout decoration */}
                <div className="absolute inset-0 border border-dashed border-rose-500/10 rounded-full animate-spin [animation-duration:34s] pointer-events-none" />

                <AnimatePresence mode="wait">
                  {chosenPunish ? (
                    <motion.div
                      key={chosenPunish.id}
                      initial={{ opacity: 0, scale: 1.45, y: -20 }}
                      animate={{ 
                        opacity: 1, 
                        scale: 1, 
                        y: 0, 
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
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-[9px] font-sans font-bold border uppercase tracking-wider bg-rose-500/15 text-rose-300 border-rose-500/30">
                        惩罚
                      </span>
                      <p className="text-xs text-neutral-200 px-2 font-sans leading-relaxed font-semibold">
                        {chosenPunish.text}
                      </p>
                    </motion.div>
                  ) : (
                    <div className="text-neutral-500 space-y-1">
                      <p className="text-xs font-sans font-bold tracking-widest uppercase">等待抽取替代任务</p>
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
                      : 'bg-gradient-to-r from-[#FFB199] to-[#FF0844] text-white shadow-[0_4px_20px_rgba(255,8,68,0.22)]'
                  }`}
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${spinning ? 'animate-spin' : ''}`} />
                  {spinning ? '抽取中' : chosenPunish ? '换一个' : '随机惩罚'}
                </motion.button>

                {chosenPunish && !spinning && (
                  <motion.button
                    id="btn-complete-punishment"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    onClick={finishPunishment}
                    className="w-full py-3 bg-neutral-900/90 hover:bg-neutral-850 border border-neutral-800 rounded-2xl text-xs font-bold text-neutral-200 cursor-pointer"
                  >
                    确认完成
                  </motion.button>
                )}

                <motion.button
                  id="btn-direct-skip"
                  whileTap={{ scale: 0.98 }}
                  onClick={handleDirectSkip}
                  disabled={spinning}
                  className="w-full py-3 bg-transparent border border-neutral-800/80 rounded-2xl text-xs font-bold text-neutral-500 hover:text-neutral-300 hover:border-neutral-700 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  直接跳过 -5
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 6. PHASE 3 CONSENT RESONANCE */}
      <AnimatePresence>
        {showResonanceConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.55, ease: "easeInOut" }}
            className="fixed inset-0 z-[95] flex flex-col items-center justify-center bg-black/94 text-center overflow-hidden px-5"
          >
            <motion.div
              animate={{ opacity: [0.18, 0.38, 0.18], scale: [1, 1.08, 1] }}
              transition={{ repeat: Infinity, duration: 5.2, ease: "easeInOut" }}
              className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(178,36,239,0.26),transparent_58%)] pointer-events-none"
            />

            <div className="relative z-10 w-full max-w-md mx-auto flex flex-col items-center">
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.65 }}
                className="mb-9"
              >
                <span className="text-[9px] font-sans font-bold tracking-[0.42em] text-rose-300/60 uppercase">
                  FINAL CONSENT
                </span>
                <h2 className="mt-3 text-4xl font-serif font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-rose-200 via-fuchsia-200 to-purple-300">
                  共燃确认
                </h2>
                <p className="mt-4 text-xs leading-relaxed text-neutral-400 font-sans tracking-wider max-w-xs mx-auto">
                  接下来的卡牌会更直接、更身体化。只有双方同时确认，沸腾阶段才会开启。
                </p>
              </motion.div>

              <div className="w-full grid grid-cols-[72px_1fr_72px] items-center gap-4">
                {[
                  { key: 'A', player: playerA, pressed: resonancePressedA, setPressed: setResonancePressedA },
                  { key: 'B', player: playerB, pressed: resonancePressedB, setPressed: setResonancePressedB },
                ].map((item, index) => (
                  <div key={item.key} className={`${index === 0 ? 'order-1' : 'order-3'} flex flex-col items-center gap-2 min-w-0`}>
                    <motion.button
                      type="button"
                      onPointerDown={(event) => {
                        event.preventDefault();
                        item.setPressed(true);
                      }}
                      onPointerUp={() => item.setPressed(false)}
                      onPointerLeave={() => item.setPressed(false)}
                      onPointerCancel={() => item.setPressed(false)}
                      className={`relative w-[68px] h-[68px] rounded-full border flex items-center justify-center cursor-pointer select-none transition-colors ${
                        item.pressed
                          ? 'border-rose-300/70 bg-rose-500/15 text-rose-100 shadow-[0_0_28px_rgba(255,154,158,0.32)]'
                          : 'border-white/10 bg-white/[0.035] text-neutral-500'
                      }`}
                    >
                      {item.pressed && (
                        <motion.span
                          initial={{ scale: 0.82, opacity: 0.65 }}
                          animate={{ scale: 1.75, opacity: 0 }}
                          transition={{ repeat: Infinity, duration: resonancePulseDuration, ease: "easeOut" }}
                          className="absolute inset-0 rounded-full bg-rose-300/25 pointer-events-none"
                        />
                      )}
                      <Fingerprint className="w-7 h-7 stroke-[1.25]" />
                    </motion.button>
                    <span className="max-w-[72px] truncate text-[10px] text-neutral-400 font-serif font-bold">
                      {item.player.name}
                    </span>
                  </div>
                ))}

                <ResonanceHeartbeat
                  active={resonanceBothPressed}
                  completed={resonanceCompleted}
                  ratio={resonanceRatio}
                  pulseDuration={resonancePulseDuration}
                />
              </div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.25 }}
                className="mt-8 min-h-[38px] flex flex-col items-center gap-2"
              >
                <p className="text-xs font-sans font-bold tracking-[0.24em] text-rose-200 uppercase">
                  {resonanceCompleted
                    ? '双方已确认，沸腾阶段开启'
                    : resonanceBothPressed
                      ? '保持共振中'
                      : '等待双方再次确认'}
                </p>
                <div className="w-40 h-[3px] rounded-full bg-white/5 overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-[#FFB199] via-[#FF0844] to-[#B224EF]"
                    style={{ width: `${resonanceProgress}%` }}
                  />
                </div>
              </motion.div>

              <button
                type="button"
                onClick={handleStayInPhaseTwo}
                className="mt-9 text-[10px] font-sans font-bold tracking-[0.24em] text-neutral-500 hover:text-neutral-300 transition-colors uppercase"
              >
                停留在灼热阶段
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 7. FULL-SCREEN STAGE UP CEREMONY OVERLAY */}
      <AnimatePresence>
        {activeStageUpgrade && (
          activeStageUpgrade.phase === 2 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="fixed inset-0 z-[100] flex items-center justify-center bg-black/48 text-center overflow-hidden px-6"
            >
              <motion.div
                initial={{ scaleX: 0.2, opacity: 0 }}
                animate={{ scaleX: [0.2, 1, 1.08], opacity: [0, 0.42, 0] }}
                transition={{ duration: 1.65, ease: "easeOut" }}
                className="absolute h-40 w-full max-w-md rounded-full bg-[radial-gradient(ellipse_at_center,rgba(255,8,68,0.34),rgba(255,177,153,0.13),transparent_72%)]"
              />
              <motion.div
                initial={{ y: 12, opacity: 0, scale: 0.96 }}
                animate={{ y: 0, opacity: [0, 1, 1, 0], scale: [0.96, 1, 1.01, 0.99] }}
                transition={{ duration: 1.65, times: [0, 0.2, 0.78, 1], ease: "easeInOut" }}
                className="relative z-10 space-y-4"
              >
                <span className="text-[9px] font-sans font-bold tracking-[0.45em] text-rose-300/60 uppercase">
                  WARMER NOW
                </span>
                <h1 className="text-4xl font-serif font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-[#FFB199] via-[#FF0844] to-[#FECFEF]">
                  {activeStageUpgrade.title}
                </h1>
                <p className="text-xs text-neutral-400 font-sans tracking-[0.25em] uppercase">
                  {activeStageUpgrade.subtitle}
                </p>
              </motion.div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.36, ease: "easeInOut" }}
              className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/98 text-center overflow-hidden"
            >
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: [0, 0.46, 0.32, 0], scale: [0.9, 1.08, 1.15, 1.22] }}
                  transition={{ times: [0, 0.24, 0.78, 1], duration: 3.4, ease: "easeOut" }}
                  className="stage-motion-layer absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(178,36,239,0.34),rgba(255,8,68,0.14),transparent_64%)]"
                />
                <motion.div
                  initial={{ scaleX: 0, opacity: 0 }}
                  animate={{ scaleX: [0, 1, 1.08, 0], opacity: [0, 1, 0.9, 0] }}
                  transition={{ times: [0, 0.24, 0.72, 1], duration: 3.4, ease: [0.22, 1, 0.36, 1] }}
                  className="stage-motion-layer absolute top-1/2 left-1/2 h-[2px] w-[78vw] max-w-sm origin-center -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-r from-transparent via-fuchsia-200 to-transparent shadow-[0_0_28px_rgba(178,36,239,0.65)]"
                />
              </div>

              <motion.div
                initial={{ opacity: 0, scale: 0.92, y: 12 }}
                animate={{ opacity: [0, 1, 1, 0], scale: [0.92, 1, 1.015, 0.98], y: [12, 0, 0, -6] }}
                transition={{ times: [0, 0.24, 0.84, 1], duration: 3.4, ease: [0.22, 1, 0.36, 1] }}
                className="relative z-20 max-w-md mx-auto space-y-6 px-8 py-10 text-center"
              >
                <motion.div
                  initial={{ letterSpacing: "0.25em", opacity: 0 }}
                  animate={{ letterSpacing: "0.45em", opacity: 0.44 }}
                  transition={{ delay: 0.8, duration: 1.0 }}
                  className="text-[9px] font-sans font-bold tracking-[0.45em] text-[#FF9A9E] uppercase mb-1"
                >
                  RESONANCE OPENED
                </motion.div>
                <h1
                  className="text-5xl md:text-6xl font-serif font-black tracking-widest leading-none text-transparent bg-clip-text"
                  style={{
                    backgroundImage: "linear-gradient(to right, #E0C3FC, #B224EF, #750050)",
                    filter: "drop-shadow(0 0 16px rgba(255, 8, 68, 0.22))",
                  }}
                >
                  {activeStageUpgrade.title}
                </h1>
                <div className="flex flex-col items-center gap-3">
                  <div className="w-12 h-[1px] bg-gradient-to-r from-transparent via-white/25 to-transparent" />
                  <p className="text-sm text-neutral-300 font-sans tracking-[0.25em] font-medium uppercase">
                    {activeStageUpgrade.subtitle}
                  </p>
                  <div className="w-12 h-[1px] bg-gradient-to-r from-transparent via-white/25 to-transparent" />
                </div>
                <p className="text-[10px] text-neutral-500 font-sans tracking-widest mt-2">
                  —— 灵魂与体温终在此处沸腾 ——
                </p>
              </motion.div>

              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_30%,rgba(0,0,0,0.9)_100%)] pointer-events-none z-30" />
            </motion.div>
          )
        )}
      </AnimatePresence>
    </div>
  );
}
