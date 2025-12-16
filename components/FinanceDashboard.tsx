import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, TrendingUp, PieChart, Wallet } from 'lucide-react';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell, AreaChart, Area } from 'recharts';
import GlassCard from './GlassCard';
import { Language, Task } from '../types';
import { getTranslation } from '../translations';

interface FinanceDashboardProps {
  lang: Language;
  tasks: Task[];
}

const FinanceDashboard: React.FC<FinanceDashboardProps> = ({ lang, tasks }) => {
  const t = getTranslation(lang);

  // --- Logic ---
  
  // 1. Filter Completed Freelance Tasks
  const earnings = useMemo(() => {
    return tasks
      .filter(t => t.context === 'freelance' && t.status === 'done')
      .map(t => ({
          ...t,
          amount: t.revenue || 0, // Use explicit revenue or 0
          date: new Date(t.completedAt || t.dueDate)
      }))
      .sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [tasks]);

  // 2. Total Revenue
  const totalRevenue = useMemo(() => earnings.reduce((sum, item) => sum + item.amount, 0), [earnings]);

  // 3. Monthly Income Data
  const monthlyData = useMemo(() => {
      const grouped: Record<string, number> = {};
      const months = lang === 'fa' 
        ? ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند']
        : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

      earnings.forEach(item => {
          const monthIndex = item.date.getMonth();
          const key = months[monthIndex]; // Simplify for demo: just use month name
          grouped[key] = (grouped[key] || 0) + item.amount;
      });

      // Transform to array
      return Object.keys(grouped).map(key => ({
          name: key,
          value: grouped[key]
      }));
  }, [earnings, lang]);

  // 4. Project Revenue Data (Group by Tag)
  const projectData = useMemo(() => {
      const grouped: Record<string, number> = {};
      earnings.forEach(item => {
          // Use first tag as Project Name, or "Uncategorized"
          const project = item.tags.length > 0 ? item.tags[0] : (lang === 'fa' ? 'دسته‌بندی نشده' : 'Uncategorized');
          grouped[project] = (grouped[project] || 0) + item.amount;
      });

      return Object.keys(grouped)
        .map(key => ({ name: key, value: grouped[key] }))
        .sort((a, b) => b.value - a.value);
  }, [earnings, lang]);

  // 5. This Month's Income
  const thisMonthIncome = useMemo(() => {
      const now = new Date();
      return earnings
        .filter(e => e.date.getMonth() === now.getMonth() && e.date.getFullYear() === now.getFullYear())
        .reduce((sum, e) => sum + e.amount, 0);
  }, [earnings]);


  const COLORS = ['#ec4899', '#8b5cf6', '#3b82f6', '#10b981', '#f59e0b'];

  return (
    <div className="p-6 h-full flex flex-col overflow-y-auto no-scrollbar pb-32">
        {/* Header */}
        <div className="flex justify-between items-end mb-6">
            <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <Wallet className="text-green-400" />
                {t.financialOverview}
            </h2>
            <p className="text-white/60 text-sm">{t.manageClients}</p>
            </div>
        </div>

        {/* Top Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <GlassCard className="p-6 flex items-center justify-between">
                <div>
                    <div className="text-white/50 text-xs uppercase font-bold tracking-wider mb-1">{t.totalRevenue}</div>
                    <div className="text-4xl font-mono font-bold text-white" dir="ltr">${totalRevenue.toLocaleString()}</div>
                </div>
                <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center text-green-400">
                    <DollarSign size={24} />
                </div>
            </GlassCard>

            <GlassCard className="p-6 flex items-center justify-between">
                <div>
                    <div className="text-white/50 text-xs uppercase font-bold tracking-wider mb-1">{t.thisMonth}</div>
                    <div className="text-4xl font-mono font-bold text-white" dir="ltr">${thisMonthIncome.toLocaleString()}</div>
                </div>
                <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">
                    <TrendingUp size={24} />
                </div>
            </GlassCard>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            
            {/* Monthly Income Chart */}
            <GlassCard className="p-6 flex flex-col h-[300px]">
                <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                    <TrendingUp size={16} className="text-pink-400" /> {t.monthlyIncome}
                </h3>
                <div className="flex-1 w-full min-h-0">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={monthlyData}>
                            <defs>
                                <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#ec4899" stopOpacity={0.8}/>
                                    <stop offset="95%" stopColor="#ec4899" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <XAxis dataKey="name" stroke="rgba(255,255,255,0.3)" tick={{fill: 'rgba(255,255,255,0.5)', fontSize: 12}} />
                            <Tooltip 
                                contentStyle={{backgroundColor: '#000000aa', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px'}}
                                itemStyle={{color: '#fff'}}
                                formatter={(value: number) => [`$${value}`, t.monthlyIncome]}
                            />
                            <Area type="monotone" dataKey="value" stroke="#ec4899" fillOpacity={1} fill="url(#colorIncome)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </GlassCard>

            {/* Project Revenue Breakdown */}
            <GlassCard className="p-6 flex flex-col h-[300px]">
                <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                    <PieChart size={16} className="text-purple-400" /> {t.projectRevenue}
                </h3>
                <div className="flex-1 overflow-y-auto no-scrollbar space-y-3">
                    {projectData.map((project, index) => (
                        <div key={project.name} className="relative">
                            <div className="flex justify-between text-sm mb-1">
                                <span className="text-white">{project.name}</span>
                                <span className="text-white/60 font-mono" dir="ltr">${project.value}</span>
                            </div>
                            <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                                <motion.div 
                                    className="h-full rounded-full"
                                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                                    initial={{ width: 0 }}
                                    animate={{ width: `${(project.value / totalRevenue) * 100}%` }}
                                    transition={{ duration: 1, delay: index * 0.1 }}
                                />
                            </div>
                        </div>
                    ))}
                    {projectData.length === 0 && (
                        <div className="text-white/30 text-center py-10">No project data available</div>
                    )}
                </div>
            </GlassCard>
        </div>

        {/* Recent Transactions List */}
        <GlassCard className="p-6 flex-1">
             <h3 className="text-white font-bold mb-4">{t.recentTransactions}</h3>
             <div className="space-y-3">
                 {earnings.slice(0, 5).map((earn, i) => (
                     <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                         <div className="flex items-center gap-3">
                             <div className="w-10 h-10 rounded-full bg-gradient-to-br from-white/10 to-white/5 border border-white/10 flex items-center justify-center text-white/50 font-bold">
                                 {earn.title.substring(0, 1)}
                             </div>
                             <div>
                                 <div className="text-white font-medium text-sm">{earn.title}</div>
                                 <div className="text-white/40 text-xs">{earn.date.toLocaleDateString()}</div>
                             </div>
                         </div>
                         <div className="text-green-400 font-mono font-bold" dir="ltr">
                             +${earn.amount}
                         </div>
                     </div>
                 ))}
                  {earnings.length === 0 && (
                        <div className="text-white/30 text-center py-4">No transactions yet</div>
                    )}
             </div>
        </GlassCard>
    </div>
  );
};

export default FinanceDashboard;