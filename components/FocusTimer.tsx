import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Play, Pause, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { triggerHaptic } from '../utils/feedback';
import { Language } from '../types';
import { getTranslation } from '../translations';

interface FocusTimerProps {
  exitFocus: () => void;
  lang: Language;
  onSessionComplete: () => void;
  sessionCount: number;
}

const STORAGE_KEY = 'focus_timer_end_time';
const DEFAULT_TIME = 25 * 60;

const FocusTimer: React.FC<FocusTimerProps> = ({ exitFocus, lang, onSessionComplete, sessionCount }) => {
  const t = getTranslation(lang);
  
  // State ها
  const [timeLeft, setTimeLeft] = useState(DEFAULT_TIME);
  const [isActive, setIsActive] = useState(false);
  const [endTime, setEndTime] = useState<number | null>(null);

  // ۱. مقداردهی اولیه از LocalStorage
  useEffect(() => {
    const savedEndTime = localStorage.getItem(STORAGE_KEY);
    if (savedEndTime) {
      const end = parseInt(savedEndTime, 10);
      const now = Date.now();
      
      if (end > now) {
        setEndTime(end);
        setIsActive(true);
        setTimeLeft(Math.round((end - now) / 1000));
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    }

    triggerHaptic('light');
    toast(t.deepWorkMode, {
      icon: '🧠',
      description: 'Focus on the present task.'
    });
  }, [t.deepWorkMode]);

  // ۲. منطق اصلی تایمر (دقیق و بدون لغزش)
  useEffect(() => {
    let interval: number;

    if (isActive && endTime) {
      interval = window.setInterval(() => {
        const now = Date.now();
        const remaining = Math.max(0, Math.round((endTime - now) / 1000));

        if (remaining <= 0) {
          handleComplete();
        } else {
          setTimeLeft(remaining);
        }
      }, 500); // چک کردن هر ۵۰۰ میلی‌ثانیه برای نرمی نمایشگر
    }

    return () => clearInterval(interval);
  }, [isActive, endTime]);

  // ۳. توابع کنترلر
  const handleComplete = useCallback(() => {
    setIsActive(false);
    setEndTime(null);
    setTimeLeft(DEFAULT_TIME);
    localStorage.removeItem(STORAGE_KEY);
    onSessionComplete();
    if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
    toast.success('Session Completed!');
  }, [onSessionComplete]);

  const toggleTimer = () => {
    if (!isActive) {
      const newEndTime = Date.now() + timeLeft * 1000;
      setEndTime(newEndTime);
      setIsActive(true);
      localStorage.setItem(STORAGE_KEY, newEndTime.toString());
    } else {
      setIsActive(false);
      setEndTime(null);
      localStorage.removeItem(STORAGE_KEY);
      // وقتی متوقف می‌شود، timeLeft آخرین مقدارش را حفظ می‌کند
    }
    triggerHaptic('medium');
  };

  const resetTimer = () => {
    setIsActive(false);
    setEndTime(null);
    setTimeLeft(DEFAULT_TIME);
    localStorage.removeItem(STORAGE_KEY);
    triggerHaptic('light');
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/80 backdrop-blur-3xl"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* دکمه خروج */}
      <button
        onClick={exitFocus}
        className="absolute top-8 right-8 rtl:right-auto rtl:left-8 p-3 rounded-full bg-white/10 text-white/70 hover:bg-white/20 transition-colors"
      >
        <X size={24} />
      </button>

      <div className="flex flex-col items-center">
        <motion.div
          className="text-white/50 text-sm uppercase tracking-[0.2em] mb-4"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
          {t.deepWorkMode}
        </motion.div>

        {/* نمایشگر تایمر */}
        <motion.div
          className="text-[120px] md:text-[180px] font-mono font-bold text-white leading-none tracking-tighter tabular-nums"
          layoutId="timer-display"
        >
          {formatTime(timeLeft)}
        </motion.div>

        {/* دکمه‌های کنترل */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 flex items-center gap-4"
        >
          <button
            onClick={toggleTimer}
            className={`flex items-center gap-3 px-10 py-5 rounded-full font-bold text-xl transition-all active:scale-95 ${
              isActive 
                ? 'bg-white/10 text-white border border-white/20' 
                : 'bg-white text-black hover:scale-105'
            }`}
          >
            {isActive ? <Pause size={28} fill="currentColor" /> : <Play size={28} fill="currentColor" />}
            {isActive ? t.pause : t.startFocus}
          </button>

          <button
            onClick={resetTimer}
            className="p-5 rounded-full bg-white/5 text-white/50 hover:bg-white/10 hover:text-white transition-colors"
            title="Reset"
          >
            <RefreshCw size={24} />
          </button>
        </motion.div>

        {/* ایندیکاتور جلسات */}
        <div className="mt-16 flex flex-col items-center gap-4">
          <div className="flex gap-3">
            {[...Array(4)].map((_, i) => (
              <motion.div
                key={i}
                className={`w-3 h-3 rounded-full ${i < sessionCount ? 'bg-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.5)]' : 'bg-white/20'}`}
                animate={i === sessionCount && isActive ? { scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] } : {}}
                transition={{ repeat: Infinity, duration: 2 }}
              />
            ))}
          </div>
          <p className="text-white/40 text-sm font-medium tracking-wide">
            {sessionCount} {t.sessionsCompleted}
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default FocusTimer;