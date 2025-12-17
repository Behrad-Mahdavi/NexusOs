import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Brain, Flame, Clock, Target, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, ResponsiveContainer, Tooltip, Cell } from 'recharts';
import GlassCard from './GlassCard';
import { Language } from '../types';
import { getTranslation } from '../translations';
import { FocusSession } from '../services/supabaseService';

interface FocusAnalyticsProps {
    lang: Language;
    sessions: FocusSession[];
    todaySessions: number;
}

const FocusAnalytics: React.FC<FocusAnalyticsProps> = ({ lang, sessions, todaySessions }) => {
    const t = getTranslation(lang);

    // Calculate stats
    const stats = useMemo(() => {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        // Today's focus
        const todayMinutes = sessions
            .filter(s => new Date(s.started_at) >= today && s.completed)
            .reduce((sum, s) => sum + s.duration_minutes, 0);

        // Weekly data (last 7 days)
        const weeklyData = [];
        const dayNames = lang === 'fa'
            ? ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج']
            : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
            const dayEnd = new Date(dayStart);
            dayEnd.setDate(dayEnd.getDate() + 1);

            const dayMinutes = sessions
                .filter(s => {
                    const sDate = new Date(s.started_at);
                    return sDate >= dayStart && sDate < dayEnd && s.completed;
                })
                .reduce((sum, s) => sum + s.duration_minutes, 0);

            weeklyData.push({
                name: dayNames[date.getDay()],
                minutes: dayMinutes,
                isToday: i === 0
            });
        }

        // Streak calculation
        let streak = 0;
        for (let i = 0; i < 30; i++) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
            const dayEnd = new Date(dayStart);
            dayEnd.setDate(dayEnd.getDate() + 1);

            const hasFocus = sessions.some(s => {
                const sDate = new Date(s.started_at);
                return sDate >= dayStart && sDate < dayEnd && s.completed;
            });

            if (hasFocus) {
                streak++;
            } else if (i > 0) {
                break;
            }
        }

        // Total this week
        const weekTotal = weeklyData.reduce((sum, d) => sum + d.minutes, 0);

        return { todayMinutes, weeklyData, streak, weekTotal, todaySessions };
    }, [sessions, lang]);

    const formatMinutes = (mins: number) => {
        if (mins < 60) return `${mins}m`;
        const h = Math.floor(mins / 60);
        const m = mins % 60;
        return m > 0 ? `${h}h ${m}m` : `${h}h`;
    };

    return (
        <div className="space-y-4">
            {/* Top Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {/* Today's Focus */}
                <GlassCard className="p-4 flex items-center gap-3">
                    <div className="p-2 bg-blue-500/20 rounded-xl text-blue-400">
                        <Clock size={20} />
                    </div>
                    <div>
                        <div className="text-white/50 text-xs uppercase">{lang === 'fa' ? 'امروز' : 'Today'}</div>
                        <div className="text-xl font-bold text-white font-mono">{formatMinutes(stats.todayMinutes)}</div>
                    </div>
                </GlassCard>

                {/* Sessions Today */}
                <GlassCard className="p-4 flex items-center gap-3">
                    <div className="p-2 bg-green-500/20 rounded-xl text-green-400">
                        <Target size={20} />
                    </div>
                    <div>
                        <div className="text-white/50 text-xs uppercase">{lang === 'fa' ? 'سشن‌ها' : 'Sessions'}</div>
                        <div className="text-xl font-bold text-white font-mono">{todaySessions}</div>
                    </div>
                </GlassCard>

                {/* Streak */}
                <GlassCard className="p-4 flex items-center gap-3">
                    <div className="p-2 bg-orange-500/20 rounded-xl text-orange-400">
                        <Flame size={20} />
                    </div>
                    <div>
                        <div className="text-white/50 text-xs uppercase">{lang === 'fa' ? 'استریک' : 'Streak'}</div>
                        <div className="text-xl font-bold text-white font-mono">{stats.streak} {lang === 'fa' ? 'روز' : 'days'}</div>
                    </div>
                </GlassCard>

                {/* Week Total */}
                <GlassCard className="p-4 flex items-center gap-3">
                    <div className="p-2 bg-purple-500/20 rounded-xl text-purple-400">
                        <TrendingUp size={20} />
                    </div>
                    <div>
                        <div className="text-white/50 text-xs uppercase">{lang === 'fa' ? 'این هفته' : 'This Week'}</div>
                        <div className="text-xl font-bold text-white font-mono">{formatMinutes(stats.weekTotal)}</div>
                    </div>
                </GlassCard>
            </div>

            {/* Weekly Chart */}
            <GlassCard className="p-4">
                <div className="flex items-center gap-2 mb-4">
                    <Brain size={18} className="text-pink-400" />
                    <h3 className="text-white font-semibold text-sm">{lang === 'fa' ? 'آمار هفتگی' : 'Weekly Focus'}</h3>
                </div>
                <div className="h-32 min-h-[130px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={stats.weeklyData}>
                            <XAxis
                                dataKey="name"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'rgba(0,0,0,0.8)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '8px',
                                    fontSize: '12px'
                                }}
                                formatter={(value: number) => [`${formatMinutes(value)}`, lang === 'fa' ? 'تمرکز' : 'Focus']}
                            />
                            <Bar dataKey="minutes" radius={[4, 4, 0, 0]}>
                                {stats.weeklyData.map((entry, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={entry.isToday ? '#ec4899' : 'rgba(255,255,255,0.2)'}
                                    />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </GlassCard>
        </div>
    );
};

export default FocusAnalytics;
