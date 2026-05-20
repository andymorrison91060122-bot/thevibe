import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Heart, HelpCircle, X, Shield } from 'lucide-react';

interface LandingViewProps {
  onStart: () => void;
}

export default function LandingView({ onStart }: LandingViewProps) {
  const [showInfo, setShowInfo] = useState(false);

  return (
    <div className="fixed inset-0 w-full h-[100dvh] max-h-[100dvh] overflow-hidden select-none px-6 py-4 xs:py-6 sm:py-8 flex flex-col items-center justify-center max-w-sm mx-auto z-10 relative">
      
      {/* Top Floating Helper Badge */}
      <div className="absolute top-6 right-6">
        <button 
          onClick={() => setShowInfo(true)}
          className="w-10 h-10 rounded-full glass-panel flex items-center justify-center text-rose-300 hover:text-white transition-colors cursor-pointer border border-white/10"
        >
          <HelpCircle className="w-5 h-5 stroke-[1.5]" />
        </button>
      </div>

      {/* Extreme Minimalist Branding */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.0, ease: "easeOut" }}
        className="mb-8"
      >
        <span className="text-[10px] font-sans font-bold tracking-[0.4em] text-neutral-400 uppercase">THE INTIMACY COPLAY</span>
        <h1 className="mt-2 text-7xl font-serif font-semibold tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-rose-200 via-rose-100 to-amber-200">
          The Vibe
        </h1>
        <p className="mt-4 text-xs tracking-[0.5em] text-rose-300/65 font-sans font-semibold uppercase">
          意境 · 意趣 · 灼热
        </p>
      </motion.div>

      {/* Minimal Hero Shield Panel */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.2, delay: 0.2 }}
        className="w-full max-w-xs p-8 mb-12 glass-card rounded-3xl relative overflow-hidden flex flex-col items-center"
      >
        <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/10 rounded-full blur-2xl" />
        <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl" />

        <div className="text-rose-400 mb-6">
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
          >
            <Heart className="w-12 h-12 stroke-[1.1] fill-rose-500/30 text-rose-400" />
          </motion.div>
        </div>

        <h2 className="text-xl font-serif font-medium text-neutral-100 tracking-wider mb-2">
          私密温度
        </h2>
        
        <p className="text-xs text-neutral-400 font-sans tracking-widest uppercase mb-8">
          双向誓言 · 氛围主导
        </p>

        {/* Start button with minimal label */}
        <motion.button
          id="btn-start-journey"
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          onClick={onStart}
          className="w-full bg-gradient-to-r from-rose-500 to-amber-500 rounded-2xl text-xs font-bold tracking-[0.3em] text-white shadow-[0_8px_30px_rgba(244,63,94,0.35)] hover:shadow-[0_8px_40px_rgba(244,63,94,0.55)] transition-all cursor-pointer relative overflow-hidden group/btn select-none"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            paddingTop: 0,
            paddingBottom: 0,
            lineHeight: 1,
            minHeight: "56px"
          }}
        >
          {/* Shine effect */}
          <div className="absolute inset-0 w-1/2 h-full bg-white/15 skew-x-12 translate-x-[-120%] group-hover/btn:translate-x-[250%] transition-transform duration-1000 ease-in-out" />
          
          <span className="flex items-center justify-center gap-2 pointer-events-none">
            <span className="pl-[0.3em]">进入</span>
            <Sparkles className="w-4 h-4 text-amber-200 flex-shrink-0" />
          </span>
        </motion.button>
      </motion.div>

      {/* Click Modal for rules - keeps main screen clean */}
      <AnimatePresence>
        {showInfo && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/85 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-sm p-6 glass-card rounded-3xl border border-rose-500/20 text-left relative"
            >
              <button 
                onClick={() => setShowInfo(false)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-neutral-900 flex items-center justify-center text-neutral-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <h3 className="text-lg font-serif font-medium text-neutral-100 mb-3 block">
                关于 The Vibe
              </h3>
              
              <div className="space-y-4 text-xs text-neutral-300 leading-relaxed font-sans">
                <p>
                  《The Vibe》是一款旨在消除两性互动尴尬、兼具高级意境与绝对掌控度的情侣心动卡牌。
                </p>
                <p>
                  <strong>核心规则:</strong> 轮流抽取任务牌，双方可以无条件自主拒绝执行。如果选择认怂跳过，则旋转命运轮盘抽取温和惩罚以保持公平！
                </p>
                <p>
                  <strong>三大阶段:</strong>
                  <br />- 阶段 1: 破冰微温（走心话题与轻手拉手）
                  <br />- 阶段 2: 微醺灼热（感官触碰与耳畔呢喃）
                  <br />- 阶段 3: 沸腾极乐（无遮拦终极肢体接触）
                </p>
                <div className="flex items-center gap-2 text-[10px] text-amber-400 font-sans border-t border-neutral-900 pt-3 mt-4">
                  <Shield className="w-4 h-4 text-amber-500" />
                  <span>本游戏绝对保护您的离线本地隐私。</span>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Safety Badge */}
      <div className="flex items-center gap-1.5 text-[9px] text-neutral-500 font-sans tracking-widest uppercase">
        <span>CONSENT PROTOCOL ✓</span>
      </div>
    </div>
  );
}
