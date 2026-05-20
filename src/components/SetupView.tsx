import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Shield, Sparkles, User, Flame, ArrowRight, HelpCircle } from 'lucide-react';
import { Player } from '../types';

interface SetupViewProps {
  onConfirm: (config: {
    playerA: Player;
    playerB: Player;
    intensityLimit: 'level1' | 'level2' | 'all';
  }) => void;
  onIntensityChange?: (level: 'level1' | 'level2' | 'all') => void;
}

export default function SetupView({ onConfirm, onIntensityChange }: SetupViewProps) {
  // Local state for Setup parameters
  const [playerAName, setPlayerAName] = useState('她 / A');
  const [playerBName, setPlayerBName] = useState('他 / B');

  const [playerARole, setPlayerARole] = useState<'initiator' | 'receiver'>('initiator');
  const [playerBRole, setPlayerBRole] = useState<'initiator' | 'receiver'>('receiver');

  // Intensity levels
  const [intensity, setIntensity] = useState<'level1' | 'level2' | 'all'>('level2');

  const handleIntensityChange = (level: 'level1' | 'level2' | 'all') => {
    setIntensity(level);
    if (onIntensityChange) {
      onIntensityChange(level);
    }
  };

  const handleRoleToggleA = (role: 'initiator' | 'receiver') => {
    setPlayerARole(role);
    setPlayerBRole(role === 'initiator' ? 'receiver' : 'initiator');
  };

  const handleRoleToggleB = (role: 'initiator' | 'receiver') => {
    setPlayerBRole(role);
    setPlayerARole(role === 'initiator' ? 'receiver' : 'initiator');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm({
      playerA: { name: playerAName.trim() || 'A', role: playerARole },
      playerB: { name: playerBName.trim() || 'B', role: playerBRole },
      intensityLimit: intensity
    });
  };

  return (
    <div 
      className="fixed inset-0 w-full h-[100dvh] max-h-[100dvh] overflow-hidden select-none px-6 flex flex-col justify-start max-w-sm mx-auto z-10"
      style={{ paddingTop: "max(24px, env(safe-area-inset-top))" }}
    >
      <style dangerouslySetInnerHTML={{ __html: `
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

      {/* 1. Header (Fixed, flex-shrink-0) */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-center flex-shrink-0 pt-2 mb-3"
      >
        <span className="text-[10px] font-sans font-bold tracking-[0.3em] text-rose-300/60 uppercase">SET SCHEMA</span>
        <h2 className="text-3xl xs:text-4xl font-serif font-semibold text-neutral-100 mt-0.5 tracking-wide">
          基本设定
        </h2>
        <p className="text-xs text-neutral-400 mt-1 tracking-widest font-sans font-semibold">
          约定今夜的角色与极限承受度。
        </p>
      </motion.div>

      {/* 2. Scrollable Body containing form inputs */}
      <div className="flex-grow overflow-y-auto overflow-x-hidden custom-scrollbar pb-[136px] pt-1 min-h-0 w-full">
        <form id="setup-form" onSubmit={handleSubmit} className="space-y-5">
          {/* Players Card Grid */}
          <div className="grid grid-cols-2 gap-3.5">
            {/* Player A Container */}
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.1 }}
              className={`p-3.5 rounded-3xl glass-panel border transition-all ${
                playerARole === 'initiator' ? 'border-[#FF9A9E]/30 bg-rose-950/10' : 'border-neutral-900'
              }`}
            >
              <div className="flex items-center justify-center gap-1 text-[10px] font-sans font-bold tracking-widest mb-2.5 text-neutral-400">
                <User className="w-3.5 h-3.5 text-rose-300" />
                <span>昵称 A</span>
              </div>
              <input
                id="input-player-a"
                type="text"
                value={playerAName}
                onChange={(e) => setPlayerAName(e.target.value)}
                className="w-full text-xs py-2 px-2 rounded-xl bg-neutral-950/70 border border-neutral-900 text-white focus:outline-none focus:border-rose-500/40 text-center font-sans tracking-wide font-bold"
                placeholder="A的名字"
                maxLength={12}
              />
              {/* Role Options */}
              <div className="mt-3 flex flex-col gap-1.5">
                <button
                  id="btn-role-a-initiator"
                  type="button"
                  onClick={() => handleRoleToggleA('initiator')}
                  className={`py-2 text-[10px] tracking-wider rounded-xl border text-center transition-all cursor-pointer ${
                    playerARole === 'initiator'
                      ? 'border-[#FF9A9E] text-rose-100 bg-rose-500/10 font-bold'
                      : 'border-transparent text-neutral-500 hover:text-neutral-300'
                  }`}
                >
                  主导者
                </button>
                <button
                  id="btn-role-a-receiver"
                  type="button"
                  onClick={() => handleRoleToggleA('receiver')}
                  className={`py-2 text-[10px] tracking-wider rounded-xl border text-center transition-all cursor-pointer ${
                    playerARole === 'receiver'
                      ? 'border-[#FFB199] text-amber-100 bg-amber-500/10 font-bold'
                      : 'border-transparent text-neutral-500 hover:text-neutral-300'
                  }`}
                >
                  配合者
                </button>
              </div>
            </motion.div>

            {/* Player B Container */}
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.1 }}
              className={`p-3.5 rounded-3xl glass-panel border transition-all ${
                playerBRole === 'initiator' ? 'border-[#FF9A9E]/30 bg-rose-950/10' : 'border-neutral-900'
              }`}
            >
              <div className="flex items-center justify-center gap-1 text-[10px] font-sans font-bold tracking-widest mb-2.5 text-neutral-400">
                <User className="w-3.5 h-3.5 text-rose-300" />
                <span>昵称 B</span>
              </div>
              <input
                id="input-player-b"
                type="text"
                value={playerBName}
                onChange={(e) => setPlayerBName(e.target.value)}
                className="w-full text-xs py-2 px-2 rounded-xl bg-neutral-950/70 border border-neutral-900 text-white focus:outline-none focus:border-rose-500/40 text-center font-sans tracking-wide font-bold"
                placeholder="B的名字"
                maxLength={12}
              />
              {/* Role Options */}
              <div className="mt-3 flex flex-col gap-1.5">
                <button
                  id="btn-role-b-initiator"
                  type="button"
                  onClick={() => handleRoleToggleB('initiator')}
                  className={`py-2 text-[10px] tracking-wider rounded-xl border text-center transition-all cursor-pointer ${
                    playerBRole === 'initiator'
                      ? 'border-[#FF9A9E] text-rose-100 bg-rose-500/10 font-bold'
                      : 'border-transparent text-neutral-500 hover:text-neutral-300'
                  }`}
                >
                  主导者
                </button>
                <button
                  id="btn-role-b-receiver"
                  type="button"
                  onClick={() => handleRoleToggleB('receiver')}
                  className={`py-2 text-[10px] tracking-wider rounded-xl border text-center transition-all cursor-pointer ${
                    playerBRole === 'receiver'
                      ? 'border-[#FFB199] text-amber-100 bg-amber-500/10 font-bold'
                      : 'border-transparent text-neutral-500 hover:text-neutral-300'
                  }`}
                >
                  配合者
                </button>
              </div>
            </motion.div>
          </div>

          {/* Intensity Selection Card */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="p-4 rounded-3xl glass-panel border border-neutral-900"
          >
            <div className="flex items-center gap-2 text-[10px] font-sans font-bold tracking-widest mb-3 text-neutral-400 uppercase">
              <Flame className="w-4 h-4 text-[#FF0844]" />
              <span>深度刻度 Scale</span>
            </div>

            <div className="space-y-2.5">
              {/* Level 1 Option */}
              <div
                id="intensity-btn-level1"
                onClick={() => handleIntensityChange('level1')}
                className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                  intensity === 'level1'
                    ? 'border-[#FF9A9E] bg-rose-950/15 text-white'
                    : 'border-neutral-900 bg-neutral-950/30 text-neutral-400 hover:text-neutral-200'
                }`}
              >
                <div>
                  <span className="text-xs font-serif font-semibold block">微温 Melt</span>
                  <span className="text-[9.5px] text-neutral-400/80 mt-0.5 block font-sans">
                    深度对话・倾听
                  </span>
                </div>
                {intensity === 'level1' ? (
                  <div className="w-2 h-2 rounded-full bg-[#FF9A9E] shadow-[0_0_10px_#FF9A9E]" />
                ) : (
                  <div className="w-2 h-2 rounded-full border border-neutral-700" />
                )}
              </div>

              {/* Level 2 Option */}
              <div
                id="intensity-btn-level2"
                onClick={() => handleIntensityChange('level2')}
                className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                  intensity === 'level2'
                    ? 'border-[#FF0844] bg-rose-950/15 text-white'
                    : 'border-neutral-900 bg-neutral-950/30 text-neutral-400 hover:text-neutral-200'
                }`}
              >
                <div>
                  <span className="text-xs font-serif font-semibold block">灼热 Scorching</span>
                  <span className="text-[9.5px] text-neutral-400/80 mt-0.5 block font-sans">
                    温柔凝视・肌肤触感
                  </span>
                </div>
                {intensity === 'level2' ? (
                  <div className="w-2 h-2 rounded-full bg-[#FF0844] shadow-[0_0_10px_#FF0844]" />
                ) : (
                  <div className="w-2 h-2 rounded-full border border-neutral-700" />
                )}
              </div>

              {/* All Options Capped */}
              <div
                id="intensity-btn-all"
                onClick={() => handleIntensityChange('all')}
                className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                  intensity === 'all'
                    ? 'border-[#B224EF] bg-rose-950/15 text-white'
                    : 'border-neutral-900 bg-neutral-950/30 text-neutral-400 hover:text-neutral-200'
                }`}
              >
                <div>
                  <span className="text-xs font-serif font-semibold block">沸腾 Boil</span>
                  <span className="text-[9.5px] text-neutral-400/80 mt-0.5 block font-sans">
                    极乐荷尔蒙・无限制感官
                  </span>
                </div>
                {intensity === 'all' ? (
                  <div className="w-2 h-2 rounded-full bg-[#B224EF] shadow-[0_0_10px_#B224EF] animate-pulse" />
                ) : (
                  <div className="w-2 h-2 rounded-full border border-neutral-700" />
                )}
              </div>
            </div>
          </motion.div>
        </form>
      </div>

      {/* 3. Sticky Footer (Always floating at bottom) */}
      <div 
        className="absolute left-6 right-6 z-[99] flex flex-col gap-2.5 pb-2 pointer-events-auto bg-transparent"
        style={{ bottom: "max(16px, env(safe-area-inset-bottom))" }}
      >
        {/* Minimalized safety check */}
        <div className="flex items-center justify-center gap-1.5 text-[9.5px] text-neutral-500 font-sans tracking-wider text-center uppercase py-0.5 pointer-events-none">
          <Shield className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
          <span>自愿与随时跳过的安全共识</span>
        </div>

        {/* Submit button */}
        <motion.button
          id="btn-confirm-preferences"
          type="submit"
          form="setup-form"
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          className="w-full bg-gradient-to-r from-[#FF0844] to-[#B224EF] rounded-2xl text-xs font-bold tracking-[0.45em] text-white shadow-[0_8px_30px_rgba(255,8,68,0.3)] hover:shadow-[0_8px_45px_rgba(255,8,68,0.5)] cursor-pointer flex items-center justify-center gap-2 transition-all duration-300 text-center font-sans select-none relative overflow-hidden"
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
          {/* Visual glow overlay highlight for premium feel */}
          <span className="absolute inset-x-0 top-0 h-[1px] bg-white/20 pointer-events-none" />
          <span className="pl-[0.45em]">契约</span>
          <ArrowRight className="w-4 h-4 flex-shrink-0" />
        </motion.button>
      </div>
    </div>
  );
}
