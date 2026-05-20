import React, { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ScreenType, Player } from './types';
import BackgroundGlow from './components/BackgroundGlow';
import LandingView from './components/LandingView';
import SetupView from './components/SetupView';
import OathView from './components/OathView';
import BoardView from './components/BoardView';
import AfterglowView from './components/AfterglowView';
import { useIdleTime } from './hooks/useIdleTime';

export default function App() {
  const isIdle = useIdleTime(30000);
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('landing');
  
  // Game Setup parameters
  const [playerA, setPlayerA] = useState<Player>({ name: '她 / A', role: 'initiator' });
  const [playerB, setPlayerB] = useState<Player>({ name: '他 / B', role: 'receiver' });
  const [intensityLimit, setIntensityLimit] = useState<'level1' | 'level2' | 'all'>('level2');

  // Ambient temperature driving the Color Palette
  const [ambientTemp, setAmbientTemp] = useState<number>(15);

  // Preview background temperature during preference selection
  const handleIntensityPreview = (level: 'level1' | 'level2' | 'all') => {
    if (level === 'level1') {
      setAmbientTemp(15); // soft warm peach
    } else if (level === 'level2') {
      setAmbientTemp(50); // micro-red burgundy
    } else {
      setAmbientTemp(85); // electric midnight purple
    }
  };

  const handleStartGame = () => {
    setCurrentScreen('setup');
    // Start with default selected level 2 (warm burgundy preview)
    setAmbientTemp(50);
  };

  const handleSetupConfirm = (config: {
    playerA: Player;
    playerB: Player;
    intensityLimit: 'level1' | 'level2' | 'all';
  }) => {
    setPlayerA(config.playerA);
    setPlayerB(config.playerB);
    setIntensityLimit(config.intensityLimit);
    
    // Smoothly drop to 15 degrees for the sacred Oath ritual scene
    setAmbientTemp(15);
    setCurrentScreen('oath');
  };

  const handleOathSealed = () => {
    // Game begins, start game score at 20 degrees
    setAmbientTemp(20);
    setCurrentScreen('board');
  };

  const handleClimaxTriggered = () => {
    // Fill up scale and take them to Afterglow
    setAmbientTemp(100);
    setCurrentScreen('afterglow');
  };

  const handleGameReset = () => {
    // Reset all game states back to Home
    setAmbientTemp(15);
    setCurrentScreen('landing');
  };

  return (
    <div className={`min-h-screen text-white font-sans relative antialiased selection:bg-rose-500/30 transition-colors duration-500 ${isIdle ? 'is-idle' : ''}`}>
      {/* Dynamic Ambient Fluid Shader */}
      <BackgroundGlow temperature={ambientTemp} isIdle={isIdle} />

      {/* View Transition Frame */}
      <main className="relative z-10 w-full min-h-screen flex flex-col justify-between">
        <AnimatePresence mode="wait">
          {currentScreen === 'landing' && (
            <motion.div
              key="screen-landing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6 }}
              className="w-full flex-1"
            >
              <LandingView onStart={handleStartGame} />
            </motion.div>
          )}

          {currentScreen === 'setup' && (
            <motion.div
              key="screen-setup"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="w-full flex-1"
            >
              <SetupView 
                onConfirm={handleSetupConfirm} 
                onIntensityChange={handleIntensityPreview}
              />
            </motion.div>
          )}

          {currentScreen === 'oath' && (
            <motion.div
              key="screen-oath"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6 }}
              className="w-full flex-1"
            >
              <OathView 
                playerA={playerA} 
                playerB={playerB} 
                onSealed={handleOathSealed} 
              />
            </motion.div>
          )}

          {currentScreen === 'board' && (
            <motion.div
              key="screen-board"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.6 }}
              className="w-full flex-1"
            >
              <BoardView 
                playerA={playerA} 
                playerB={playerB} 
                intensityLimit={intensityLimit} 
                onClimax={handleClimaxTriggered}
                onTemperatureChange={setAmbientTemp}
              />
            </motion.div>
          )}

          {currentScreen === 'afterglow' && (
            <motion.div
              key="screen-afterglow"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.5 }} // Slow dreamy transition to the screensaver
              className="w-full flex-1"
            >
              <AfterglowView onRestart={handleGameReset} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
