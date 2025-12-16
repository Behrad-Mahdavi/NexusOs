import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Play, Pause } from 'lucide-react';
import { Language } from '../types';
import { getTranslation } from '../translations';

interface FocusTimerProps {
  exitFocus: () => void;
  lang: Language;
  onSessionComplete: () => void;
  sessionCount: number;
}

const FocusTimer: React.FC<FocusTimerProps> = ({ exitFocus, lang, onSessionComplete, sessionCount }) => {
  const t = getTranslation(lang);
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 minutes
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    let interval: any;

    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsActive(false);
      onSessionComplete();
      setTimeLeft(25 * 60); // Reset
      if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
    }

    return () => clearInterval(interval);
  }, [isActive, timeLeft, onSessionComplete]);

  const toggleTimer = () => setIsActive(!isActive);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <motion.div 
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/60 backdrop-blur-3xl"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <button 
        onClick={exitFocus}
        className="absolute top-8 right-8 rtl:right-auto rtl:left-8 p-3 rounded-full bg-white/10 text-white/70 hover:bg-white/20 hover:text-white transition-colors"
      >
        <X size={24} />
      </button>

      <div className="flex flex-col items-center">
        <motion.div
          className="text-white/50 text-sm uppercase tracking-[0.2em] mb-4"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {t.deepWorkMode}
        </motion.div>

        <motion.div 
          className="text-[120px] md:text-[180px] font-mono font-bold text-white leading-none tracking-tighter tabular-nums"
          layoutId="timer-display"
        >
          {formatTime(timeLeft)}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-8 flex items-center gap-6"
        >
           <button 
             onClick={toggleTimer}
             className="flex items-center gap-3 px-8 py-4 bg-white text-black rounded-full font-semibold text-lg hover:scale-105 transition-transform active:scale-95"
           >
             {isActive ? <Pause size={24} fill="black" /> : <Play size={24} fill="black" />}
             {isActive ? t.pause : t.startFocus}
           </button>
        </motion.div>

        <div className="mt-12 flex gap-2">
            {[...Array(4)].map((_, i) => (
                <div 
                    key={i} 
                    className={`w-3 h-3 rounded-full ${i < sessionCount ? 'bg-white' : 'bg-white/20'}`}
                />
            ))}
        </div>
        <p className="mt-4 text-white/40 text-sm">{t.sessionsCompleted}</p>
      </div>
    </motion.div>
  );
};

export default FocusTimer;