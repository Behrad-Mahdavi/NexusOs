import React, { useMemo } from 'react';
import { Brain, Flame, Clock, Target, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, ResponsiveContainer, Tooltip, Cell } from 'recharts';
import GlassCard from './GlassCard';
import { Language } from '../types';
import { getTranslation } from '../translations';
import { FocusSession } from '../services/supabaseService';

interface FocusAnalyticsProps {
    lang: Language;
    sessions: FocusSession[];
    todaySessions: number; // این پراپ را نگه داشتم اما بهتر است خودمان محاسبه کنیم تا داده‌ها یکپارچه باشند
}

// Helper: تبدیل تاریخ به فرمت YYYY-MM-DD بر اساس لوکال تایم کاربر
// این کلید طلایی برای جلوگیری از باگ‌های Timezone است
const getLocalDateKey = (dateInput: string | Date): string => {
    const date = new Date(dateInput);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

const FocusAnalytics: React.FC<FocusAnalyticsProps> = ({ lang, sessions }) => {
    const t = getTranslation(lang);

    const stats = useMemo(() => {
        const todayKey = getLocalDateKey(new Date());
        
        // 1. Data Aggregation (O(N))
        // به جای اینکه ۱۰ بار فیلتر کنیم، یک بار می‌چرخیم و همه چیز را مپ می‌کنیم
        const sessionsMap = new Map<string, { minutes: number; count: number }>();
        
        sessions.forEach(session => {
            if (!session.completed || !session.started_at) return;
            
            const key = getLocalDateKey(session.started_at);
            const current = sessionsMap.get(key) || { minutes: 0, count: 0 };
            
            sessionsMap.set(key, {
                minutes: current.minutes + session.duration_minutes,
                count: current.count + 1
            });
        });

        // 2. Today's Stats
        const todayData = sessionsMap.get(todayKey) || { minutes: 0, count: 0 };

        // 3. Weekly Data Generation
        const weeklyData = [];
        const dayNames = lang === 'fa'
            ? ['ی', 'د', 'س', 'چ', 'پ', 'ج', 'ش'] // ترتیب استاندارد js getDay برای شنبه (6) کمی گیج کننده است، اینجا دستی هندل میکنیم
            : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

        let weekTotal = 0;

        // از 6 روز پیش تا امروز
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const key = getLocalDateKey(d);
            const data = sessionsMap.get(key) || { minutes: 0 };
            
            weekTotal += data.minutes;

            // هندل کردن نام روزها به صورت صحیح
            let dayNameIndex = d.getDay();
            
            weeklyData.push({
                name: dayNames[dayNameIndex],
                minutes: data.minutes,
                date: key, // برای دیباگ یا استفاده‌های بعدی
                isToday: key === todayKey
            });
        }

        // 4. Bulletproof Streak Logic
        // الگوریتم: از امروز (یا دیروز) شروع کن و عقب برو. تا جایی که وقفه بیفتد.
        let streak = 0;
        let checkDate = new Date();
        let checkKey = getLocalDateKey(checkDate);

        // اگر امروز فعالیتی نداشته، چک کردن را از دیروز شروع کن
        // تا استریک کاربر بیخودی صفر نشود.
        if (!sessionsMap.has(checkKey)) {
             checkDate.setDate(checkDate.getDate() - 1);
             checkKey = getLocalDateKey(checkDate);
        }

        // حالا عقبگرد برو تا زنجیره پاره شود
        while (sessionsMap.has(checkKey)) {
            streak++;
            checkDate.setDate(checkDate.getDate() - 1);
            checkKey = getLocalDateKey(checkDate);
        }

        return { 
            todayMinutes: todayData.minutes, 
            todayCount: todayData.count,
            weeklyData, 
            streak, 
            weekTotal 
        };
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
                        <div className="text-xl font-bold text-white font-mono">{stats.todayCount}</div>
                    </div>
                </GlassCard>

                {/* Streak */}
                <GlassCard className="p-4 flex items-center gap-3">
                    <div className="p-2 bg-orange-500/20 rounded-xl text-orange-400">
                        <Flame size={20} />
                    </div>
                    <div>
                        <div className="text-white/50 text-xs uppercase">{lang === 'fa' ? 'زنجیره' : 'Streak'}</div>
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
                <div className="h-32 min-h-[130px]" dir="ltr">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={stats.weeklyData}>
                            <XAxis
                                dataKey="name"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }}
                            />
                            <Tooltip
                                cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                contentStyle={{
                                    backgroundColor: '#000000',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '8px',
                                    fontSize: '12px',
                                    color: '#fff'
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