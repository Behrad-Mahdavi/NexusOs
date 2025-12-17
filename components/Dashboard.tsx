import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Sun, ArrowUpRight, GraduationCap, DollarSign, CheckCircle2, TrendingUp } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer, Tooltip, XAxis } from 'recharts';
import GlassCard from './GlassCard';
import FocusRing from './FocusRing';
import { Language, Task, Course, Assignment } from '../types';
import { getTranslation } from '../translations';
import FocusAnalytics from './FocusAnalytics';
import { FocusSession } from '../services/supabaseService';

interface DashboardProps {
  onEnterFocus: () => void;
  lang: Language;
  tasks: Task[];
  courses: Course[];
  assignments: Assignment[];
  focusSessions: FocusSession[];
  sessionCount: number;
}

const Dashboard: React.FC<DashboardProps> = ({ onEnterFocus, lang, tasks, courses, assignments, focusSessions, sessionCount }) => {
  const t = getTranslation(lang);

  const today = new Date();
  const dateString = lang === 'fa'
    ? new Intl.DateTimeFormat('fa-IR', { weekday: 'long', month: 'long', day: 'numeric' }).format(today)
    : today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  // --- Dynamic Logic ---

  // Helpers for Dual Energy Model
  const DAILY_CAPACITY = 100;

  const calculateUrgency = (dueDate: string): number => {
    if (!dueDate) return 0.5;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) return 3; // Today or Overdue
    if (diffDays === 1) return 2; // Tomorrow
    if (diffDays <= 7) return 1; // This week
    return 0.5; // Later
  };

  const calculateLoad = (energyCost: number, dueDate: string): number => {
    return energyCost * calculateUrgency(dueDate);
  };

  // 1. Up Next: Sorted by Cognitive Load (Urgency * Effort)
  const upNextTasks = useMemo(() => {
    return tasks
      .filter(task => task.status !== 'done')
      .map(t => ({ ...t, load: calculateLoad(t.energyCost, t.dueDate) }))
      .sort((a, b) => b.load - a.load) // Highest load first
      .slice(0, 3);
  }, [tasks]);

  // 2. Primary Focus: First 'doing' task or first 'todo'
  const primaryFocus = useMemo(() => {
    return tasks.find(t => t.status === 'doing') || tasks.find(t => t.status === 'todo');
  }, [tasks]);

  // 3. Cognitive Load / Capacity Calculation
  const progressStats = useMemo(() => {
    // Capacity logic: 
    // Show how much "Load" has been consumed today vs Daily Capacity.

    // 1. Approved Load: Tasks done TODAY
    const consumedLoad = tasks
      .filter(t => t.status === 'done' && t.completedAt && new Date(t.completedAt).toDateString() === new Date().toDateString())
      .reduce((acc, t) => acc + calculateLoad(t.energyCost, t.dueDate), 0);

    const percentage = Math.min(Math.round((consumedLoad / DAILY_CAPACITY) * 100), 100);

    return { percentage, consumedLoad, totalCapacity: DAILY_CAPACITY };
  }, [tasks]);

  // 4. Smart Income Logic
  // Uses explicit revenue field, falls back to energy estimation if 0 for older data
  const incomeStats = useMemo(() => {
    // Setup current week structure (Start from Saturday for Persian, Monday for English/Global)
    const now = new Date();
    // Simple approach: Get last 7 days including today for the chart
    const chartDays = Array(7).fill(0).map((_, i) => {
      const d = new Date();
      d.setDate(now.getDate() - (6 - i)); // 6 days ago to today
      d.setHours(0, 0, 0, 0);
      return d;
    });

    const chartData = chartDays.map(date => {
      return {
        name: date.toLocaleDateString(lang === 'en' ? 'en-US' : 'fa-IR', { weekday: 'narrow' }),
        dateStr: date.toDateString(),
        value: 0
      };
    });

    let totalEarned = 0;
    let potentialIncome = 0;

    tasks.filter(t => t.context === 'freelance').forEach(task => {
      // If revenue is set, use it. Otherwise 0.
      // Note: Previously we estimated with energy * 150. I removed that to force manual input for accuracy, 
      // or you can fallback: (task.revenue || task.energyCost * 150)
      const value = task.revenue || 0;

      if (task.status === 'done') {
        totalEarned += value;
        // Add to chart if within range
        if (task.completedAt) {
          const doneDate = new Date(task.completedAt).toDateString();
          const dayEntry = chartData.find(d => d.dateStr === doneDate);
          if (dayEntry) {
            dayEntry.value += value;
          }
        }
      } else {
        potentialIncome += value;
      }
    });

    return { totalEarned, potentialIncome, chartData };
  }, [tasks, lang]);

  // 5. University Logic: Nearest Upcoming Assignment
  const nearestAssignment = useMemo(() => {
    const pending = assignments
      .filter(a => !a.isCompleted)
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

    if (pending.length === 0) return null;

    const assignment = pending[0];
    const course = courses.find(c => c.id === assignment.courseId);
    const diffTime = new Date(assignment.dueDate).getTime() - new Date().getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return {
      title: assignment.title,
      courseName: course ? course.name : t.university,
      daysLeft: diffDays,
      type: assignment.type
    };
  }, [assignments, courses, t.university]);

  return (
    <div className="p-4 md:p-6 pb-32 h-full overflow-y-auto no-scrollbar">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-white mb-1">
          {lang === 'fa' ? t.greeting : `${t.greeting}, User`}
        </h1>
        <p className="text-white/60 text-lg">{t.subtitle}</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 auto-rows-[minmax(180px,auto)]">

        {/* Widget 1: Morning Brief (Wide) */}
        <GlassCard className="md:col-span-2 p-6 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <div className="text-white/50 text-sm font-semibold uppercase tracking-wider mb-1">{t.today}</div>
              <div className="text-2xl text-white font-medium">{dateString}</div>
            </div>
            <Sun className="text-yellow-300" size={32} />
          </div>
          <div className="mt-4">
            <div className="text-white/50 text-xs mb-2 uppercase">{t.primaryFocus}</div>
            <div className="flex items-center gap-3">
              <div className={`w-1 h-8 rounded-full ${primaryFocus ? 'bg-blue-400' : 'bg-white/20'}`}></div>
              <span className="text-xl text-white font-medium truncate">
                {primaryFocus ? primaryFocus.title : lang === 'fa' ? "هیچ تسک فعالی ندارید" : "No active tasks"}
              </span>
            </div>
          </div>
        </GlassCard>

        {/* Widget 2: Focus Ring (Square) - Dynamic Energy */}
        <GlassCard
          className="flex flex-col items-center justify-center p-4 cursor-pointer hover:bg-white/20 transition-colors group"
          onClick={onEnterFocus}
        >
          <FocusRing percentage={progressStats.percentage} size={140} label={lang === 'fa' ? 'ظرفیت مغز' : 'Brain Load'} />
          <div className="mt-2 text-white/60 text-sm group-hover:text-white transition-colors flex items-center gap-1">
            {t.tapToFocus} <ArrowUpRight size={14} className="rtl:rotate-180" />
          </div>
        </GlassCard>

        {/* Widget 3: Income (Square) - Smart Logic */}
        <GlassCard className="p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-green-500/20 rounded-full text-green-400">
              <DollarSign size={18} />
            </div>
            <div className="text-right">
              <div className="text-xs text-white/40 uppercase">Potential</div>
              <div className="text-white/80 font-mono text-sm" dir="ltr">${incomeStats.potentialIncome.toLocaleString()}</div>
            </div>
          </div>

          <div className="h-24 w-full -ml-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={incomeStats.chartData}>
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#ffffff60' }} axisLine={false} tickLine={false} interval={0} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#000000aa', border: 'none', borderRadius: '8px', fontSize: '12px' }}
                  itemStyle={{ color: '#4ade80' }}
                  labelStyle={{ display: 'none' }}
                  formatter={(value: number) => [`$${value}`, 'Earned']}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#4ade80"
                  strokeWidth={2}
                  dot={{ r: 2, fill: '#4ade80' }}
                  activeDot={{ r: 4, fill: '#fff' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-1">
            <div className="text-white/50 text-xs uppercase">{t.weeklyIncome}</div>
            <div className="flex items-baseline gap-2">
              <div className="text-2xl text-white font-mono font-bold" dir="ltr">
                ${incomeStats.totalEarned.toLocaleString()}
              </div>
            </div>
          </div>
        </GlassCard>

        {/* Widget 4: Uni Countdown (Wide) - Dynamic */}
        <GlassCard className="md:col-span-2 p-6 flex items-center justify-between">
          {nearestAssignment ? (
            <>
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-500/20 rounded-2xl text-purple-300">
                  <GraduationCap size={32} />
                </div>
                <div>
                  <div className="text-white/50 text-sm uppercase">{nearestAssignment.courseName}</div>
                  <div className="text-xl text-white font-semibold">{nearestAssignment.title}</div>
                </div>
              </div>
              <div className="text-right rtl:text-left">
                <div className={`text-4xl font-mono font-bold ${nearestAssignment.daysLeft < 3 ? 'text-red-400' : 'text-white'}`}>
                  {nearestAssignment.daysLeft}
                </div>
                <div className="text-white/50 text-xs uppercase">{nearestAssignment.daysLeft < 0 ? t.overdue : t.daysLeft}</div>
              </div>
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center gap-4 text-white/50">
              <CheckCircle2 size={32} />
              <span>{lang === 'fa' ? "هیچ تکلیفی باقی نمانده است!" : "No upcoming assignments. You are free!"}</span>
            </div>
          )}
        </GlassCard>

        {/* Widget 5: Quick Task List (Tall) - Dynamic */}
        <GlassCard className="md:col-span-1 md:row-span-2 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-semibold">{t.upNext}</h3>
            <div className="w-2 h-2 rounded-full bg-red-400 animate-pulse"></div>
          </div>
          <div className="space-y-3">
            {upNextTasks.length > 0 ? upNextTasks.map(task => (
              <div key={task.id} className="p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                <div className="text-white text-sm font-medium truncate">{task.title}</div>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${task.context === 'university' ? 'bg-purple-500/20 text-purple-300' :
                    task.context === 'freelance' ? 'bg-green-500/20 text-green-300' :
                      'bg-blue-500/20 text-blue-300'
                    }`}>
                    {t.context[task.context]}
                  </span>
                  <span className="text-white/40 text-[10px]">{task.dueDate}</span>
                </div>
              </div>
            )) : (
              <div className="text-white/40 text-sm text-center py-4">
                {lang === 'fa' ? "همه کارها انجام شده" : "No pending tasks"}
              </div>
            )}
          </div>
        </GlassCard>

        {/* Widget 6: Focus Analytics */}
        <div className="md:col-span-3">
          <FocusAnalytics
            lang={lang}
            sessions={focusSessions}
            todaySessions={sessionCount}
          />
        </div>

      </div>
    </div>
  );
};

export default Dashboard;