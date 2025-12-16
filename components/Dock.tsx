import React from 'react';
import { LayoutGrid, Focus, Brain, Briefcase, GraduationCap, Wallet } from 'lucide-react';
import { motion } from 'framer-motion';
import { AppView, Language } from '../types';
import { getTranslation } from '../translations';

interface DockProps {
  currentView: AppView;
  setView: (view: AppView) => void;
  lang: Language;
}

const Dock: React.FC<DockProps> = ({ currentView, setView, lang }) => {
  const t = getTranslation(lang);

  const items = [
    { id: AppView.DASHBOARD, icon: LayoutGrid, label: t.home },
    { id: AppView.UNIVERSITY, icon: GraduationCap, label: t.university },
    { id: AppView.FOCUS, icon: Focus, label: t.focus },
    { id: AppView.BRAIN, icon: Brain, label: t.brain },
    { id: AppView.FREELANCE, icon: Briefcase, label: t.work },
    { id: AppView.FINANCE, icon: Wallet, label: t.finance },
  ];

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 rtl:translate-x-1/2 rtl:left-auto rtl:right-1/2">
      <motion.div
        className="flex items-center gap-2 md:gap-4 px-4 py-3 md:px-6 md:py-4 bg-white/20 backdrop-blur-2xl border border-white/20 rounded-full shadow-2xl scale-90 md:scale-100 origin-bottom"
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
      >
        {items.map((item) => {
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              className="relative group flex flex-col items-center justify-center w-12 h-12"
              title={item.label}
            >
              <motion.div
                className={`p-3 rounded-2xl transition-all duration-300 ${isActive ? 'bg-white/30 text-white' : 'text-white/60 hover:text-white hover:bg-white/10'
                  }`}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <item.icon size={24} strokeWidth={isActive ? 2.5 : 2} />
              </motion.div>
              {isActive && (
                <motion.div
                  layoutId="dock-dot"
                  className="absolute -bottom-1 w-1 h-1 bg-white rounded-full"
                />
              )}
            </button>
          );
        })}
      </motion.div>
    </div>
  );
};

export default Dock;