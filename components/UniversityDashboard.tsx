import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Calendar, Clock, MapPin, CheckCircle2, BookOpen, Trash2, X } from 'lucide-react';
import GlassCard from './GlassCard';
import { Language, Course, Assignment } from '../types';
import { getTranslation } from '../translations';
import { toast } from 'sonner';

interface UniversityDashboardProps {
    lang: Language;
    courses: Course[];
    assignments: Assignment[];
    // تغییر به Promise برای هماهنگی با App.tsx
    onSaveCourse: (c: Course) => Promise<void>;
    onDeleteCourse: (id: string) => Promise<void>;
    onSaveAssignment: (a: Assignment) => Promise<void>;
    onDeleteAssignment: (id: string) => Promise<void>;
}

// حل مشکل Tailwind: تعریف کلاس‌های کامل
const COLOR_MAP: Record<string, string> = {
    blue: 'bg-blue-500',
    purple: 'bg-purple-500',
    pink: 'bg-pink-500',
    orange: 'bg-orange-500',
    green: 'bg-green-500'
};

const UniversityDashboard: React.FC<UniversityDashboardProps> = ({
    lang, courses, assignments, onSaveCourse, onDeleteCourse, onSaveAssignment, onDeleteAssignment
}) => {
    const t = getTranslation(lang);
    const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
    const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false);

    // Form States
    const [courseForm, setCourseForm] = useState<Partial<Course>>({ color: 'purple', dayOfWeek: 0 });
    const [assignmentForm, setAssignmentForm] = useState<Partial<Assignment>>({ type: 'homework' });

    // Helpers
    const currentDay = new Date().getDay(); 
    // تنظیم روز هفته برای مچ شدن با جاوااسکریپت (یکشنبه=0, ...)
    // اگر تقویم شمسی داری، اینجا باید لاجیک تبدیل روز را بنویسی، فعلاً استاندارد JS را نگه داشتم.
    
    const todaysClasses = courses
        .filter(c => c.dayOfWeek === currentDay)
        .sort((a, b) => a.startTime.localeCompare(b.startTime));

    const getDaysUntil = (dateStr: string) => {
        const diff = new Date(dateStr).getTime() - new Date().getTime();
        return Math.ceil(diff / (1000 * 3600 * 24));
    };

    const upcomingAssignments = assignments
        .filter(a => !a.isCompleted)
        .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

    const getColorStyle = (color: string) => {
        const map: any = {
            blue: 'bg-blue-500/20 border-blue-400/30 text-blue-100',
            purple: 'bg-purple-500/20 border-purple-400/30 text-purple-100',
            pink: 'bg-pink-500/20 border-pink-400/30 text-pink-100',
            orange: 'bg-orange-500/20 border-orange-400/30 text-orange-100',
            green: 'bg-green-500/20 border-green-400/30 text-green-100',
        };
        return map[color] || map.blue;
    };

    const handleAddCourse = async () => {
        if (!courseForm.name || !courseForm.code) return;

        // 1. FIX: ID Generation (UUID)
        const tempId = typeof crypto !== 'undefined' && crypto.randomUUID 
            ? crypto.randomUUID() 
            : Date.now().toString();

        const newCourse: Course = {
            id: tempId,
            name: courseForm.name,
            code: courseForm.code,
            professor: courseForm.professor || '',
            dayOfWeek: (courseForm.dayOfWeek ?? 0) as 0 | 1 | 2 | 3 | 4 | 5 | 6,
            startTime: courseForm.startTime || '08:00',
            endTime: courseForm.endTime || '10:00',
            color: (courseForm.color as any) || 'blue',
            location: courseForm.location || ''
        };

        await onSaveCourse(newCourse);
        toast.success("Course added");
        setIsCourseModalOpen(false);
        setCourseForm({ color: 'purple', dayOfWeek: 0 });
    };

    const handleAddAssignment = async () => {
        if (!assignmentForm.title || !assignmentForm.courseId) return;
        
        // 1. FIX: ID Generation (UUID)
        const tempId = typeof crypto !== 'undefined' && crypto.randomUUID 
            ? crypto.randomUUID() 
            : Date.now().toString();

        const newAssignment: Assignment = {
            id: tempId,
            courseId: assignmentForm.courseId,
            title: assignmentForm.title,
            dueDate: assignmentForm.dueDate || new Date().toISOString().split('T')[0],
            type: assignmentForm.type || 'homework',
            isCompleted: false
        };

        await onSaveAssignment(newAssignment);
        toast.success("Assignment added");
        setIsAssignmentModalOpen(false);
        setAssignmentForm({ type: 'homework' });
    };

    const toggleAssignment = async (assignment: Assignment) => {
        await onSaveAssignment({ ...assignment, isCompleted: !assignment.isCompleted });
        toast.success(assignment.isCompleted ? "Marked as todo" : "Assignment completed!");
    };

    const handleDeleteCourseWrapper = async (id: string) => {
        if(confirm("Delete this course and all its assignments?")) {
            await onDeleteCourse(id);
        }
    }

    return (
        <div className="p-4 md:p-6 h-full flex flex-col overflow-y-auto no-scrollbar pb-32">

            {/* Header */}
            <div className="flex justify-between items-end mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        <BookOpen className="text-orange-400" />
                        {t.academicHub}
                    </h2>
                    <p className="text-white/60 text-sm">{t.todaysSchedule}: {t.weekDays[currentDay] || 'Today'}</p>
                </div>
            </div>

            {/* Today's Schedule */}
            <div className="mb-8">
                <h3 className="text-white/50 text-xs uppercase font-bold tracking-wider mb-3">{t.todaysSchedule}</h3>
                {todaysClasses.length > 0 ? (
                    <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
                        {todaysClasses.map(course => (
                            <GlassCard key={course.id} className={`min-w-[200px] p-4 flex-shrink-0 ${getColorStyle(course.color)} !bg-opacity-10`}>
                                <div className="flex justify-between items-start mb-2">
                                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-white/10">{course.code}</span>
                                    <div className="flex items-center gap-1 text-xs opacity-70">
                                        <Clock size={12} />
                                        {course.startTime} - {course.endTime}
                                    </div>
                                </div>
                                <h4 className="font-bold text-lg leading-tight mb-1">{course.name}</h4>
                                <div className="text-sm opacity-80 flex items-center gap-1 mb-1">
                                    <MapPin size={12} /> {course.location}
                                </div>
                                <div className="text-xs opacity-60">{course.professor}</div>
                            </GlassCard>
                        ))}
                    </div>
                ) : (
                    <GlassCard className="p-6 text-center text-white/40 border-dashed border-white/10">
                        {t.noClasses}
                    </GlassCard>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Course List */}
                <div className="flex flex-col h-full">
                    <div className="flex justify-between items-center mb-3">
                        <h3 className="text-white/50 text-xs uppercase font-bold tracking-wider">{t.myCourses}</h3>
                        <button onClick={() => setIsCourseModalOpen(true)} className="text-white/50 hover:text-white p-1 hover:bg-white/10 rounded"><Plus size={16} /></button>
                    </div>
                    <div className="space-y-3">
                        {courses.map(course => (
                            <GlassCard key={course.id} className="p-3 flex items-center justify-between hover:bg-white/5 transition-colors group">
                                <div className="flex items-center gap-3">
                                    <div className={`w-1.5 h-10 rounded-full ${COLOR_MAP[course.color] || 'bg-blue-500'}`}></div>
                                    <div>
                                        <div className="font-bold text-white text-sm">{course.name}</div>
                                        <div className="text-xs text-white/50">{course.professor} • {t.weekDays[course.dayOfWeek]} {course.startTime}</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => {
                                            setAssignmentForm({ ...assignmentForm, courseId: course.id });
                                            setIsAssignmentModalOpen(true);
                                        }}
                                        className="p-2 rounded-full hover:bg-white/10 text-white/30 hover:text-white transition-colors"
                                        title={t.addAssignment}
                                    >
                                        <Plus size={16} />
                                    </button>
                                    <button 
                                        onClick={() => handleDeleteCourseWrapper(course.id)} 
                                        className="p-2 rounded-full hover:bg-red-500/10 text-white/30 hover:text-red-400 transition-colors"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </GlassCard>
                        ))}
                        {courses.length === 0 && <div className="text-white/30 text-sm italic py-4 text-center">No courses added yet.</div>}
                    </div>
                </div>

                {/* Upcoming Assignments */}
                <div className="flex flex-col h-full">
                    <div className="flex justify-between items-center mb-3">
                        <h3 className="text-white/50 text-xs uppercase font-bold tracking-wider">{t.upcomingDeadlines}</h3>
                    </div>
                    <div className="space-y-3">
                        {upcomingAssignments.map(assign => {
                            const daysLeft = getDaysUntil(assign.dueDate);
                            const course = courses.find(c => c.id === assign.courseId);
                            const isUrgent = daysLeft <= 3 && daysLeft >= 0;
                            const isOverdue = daysLeft < 0;

                            return (
                                <GlassCard key={assign.id} className={`p-3 border-l-[3px] ${isOverdue ? 'border-l-red-500' : isUrgent ? 'border-l-orange-500' : 'border-l-green-500'}`}>
                                    <div className="flex items-start gap-3">
                                        <button 
                                            onClick={() => toggleAssignment(assign)} 
                                            className="mt-1 text-white/20 hover:text-green-400 transition-colors p-1"
                                        >
                                            <CheckCircle2 size={18} />
                                        </button>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start">
                                                <span className="text-[10px] font-bold text-white/40 uppercase tracking-wide truncate">
                                                    {assign.type} • {course?.code || 'Unknown Course'}
                                                </span>
                                                <span className={`text-[10px] font-bold ml-2 whitespace-nowrap ${isOverdue ? 'text-red-400' : isUrgent ? 'text-orange-400' : 'text-green-400'}`}>
                                                    {isOverdue ? t.overdue : daysLeft === 0 ? 'Due Today' : `${daysLeft} ${t.days}`}
                                                </span>
                                            </div>
                                            <div className="text-white font-medium text-sm truncate">{assign.title}</div>
                                            <div className="text-[10px] text-white/40 mt-1 flex items-center gap-1">
                                                <Calendar size={10} /> {assign.dueDate}
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => onDeleteAssignment(assign.id)}
                                            className="self-center text-white/10 hover:text-red-400 transition-colors p-1"
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                </GlassCard>
                            )
                        })}
                        {upcomingAssignments.length === 0 && <div className="text-white/30 text-sm italic py-4 text-center">No pending assignments. You are free!</div>}
                    </div>
                </div>
            </div>

            {/* Modals are largely fine, just ensured state resets correctly above */}
            {/* Add Course Modal */}
            <AnimatePresence>
                {isCourseModalOpen && (
                    <motion.div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsCourseModalOpen(false)}>
                        <GlassCard className="w-full max-w-sm p-6" variant="thick" onClick={(e: any) => e.stopPropagation()}>
                            <h3 className="text-xl font-bold text-white mb-4">{t.addCourse}</h3>
                            <div className="space-y-3">
                                <input placeholder={t.courseName} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white placeholder-white/30 focus:border-blue-500 outline-none" value={courseForm.name || ''} onChange={e => setCourseForm({ ...courseForm, name: e.target.value })} autoFocus />
                                <input placeholder={t.courseCode} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white placeholder-white/30 focus:border-blue-500 outline-none" value={courseForm.code || ''} onChange={e => setCourseForm({ ...courseForm, code: e.target.value })} />
                                <input placeholder={t.professor} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white placeholder-white/30 focus:border-blue-500 outline-none" value={courseForm.professor || ''} onChange={e => setCourseForm({ ...courseForm, professor: e.target.value })} />
                                <input placeholder={t.location} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white placeholder-white/30 focus:border-blue-500 outline-none" value={courseForm.location || ''} onChange={e => setCourseForm({ ...courseForm, location: e.target.value })} />

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-xs text-white/50 ml-1 mb-1 block">{t.day}</label>
                                        <select className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white outline-none" value={courseForm.dayOfWeek} onChange={e => setCourseForm({ ...courseForm, dayOfWeek: parseInt(e.target.value) as any })}>
                                            {t.weekDays.map((d, i) => <option key={i} value={i} className="text-black">{d}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs text-white/50 ml-1 mb-1 block">{t.time}</label>
                                        <div className="flex gap-1">
                                            <input type="time" className="w-full bg-white/5 border border-white/10 rounded-xl p-2 text-white text-xs outline-none" value={courseForm.startTime || ''} onChange={e => setCourseForm({ ...courseForm, startTime: e.target.value })} />
                                            <input type="time" className="w-full bg-white/5 border border-white/10 rounded-xl p-2 text-white text-xs outline-none" value={courseForm.endTime || ''} onChange={e => setCourseForm({ ...courseForm, endTime: e.target.value })} />
                                        </div>
                                    </div>
                                </div>

                                {/* 2. FIX: Tailwind Colors */}
                                <div className="flex gap-3 justify-center mt-2">
                                    {Object.keys(COLOR_MAP).map(c => (
                                        <button 
                                            key={c} 
                                            onClick={() => setCourseForm({ ...courseForm, color: c as any })} 
                                            className={`w-8 h-8 rounded-full transition-transform ${COLOR_MAP[c]} ${courseForm.color === c ? 'ring-2 ring-white scale-110' : 'opacity-70 hover:opacity-100'}`} 
                                        />
                                    ))}
                                </div>
                            </div>
                            <div className="flex gap-3 mt-6">
                                <button onClick={() => setIsCourseModalOpen(false)} className="flex-1 py-3 bg-white/5 rounded-xl text-white hover:bg-white/10 transition-colors">{t.cancel}</button>
                                <button onClick={handleAddCourse} className="flex-1 py-3 bg-white text-black font-bold rounded-xl hover:bg-gray-200 transition-colors">{t.save}</button>
                            </div>
                        </GlassCard>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Add Assignment Modal (Similar cleanups) */}
            <AnimatePresence>
                {isAssignmentModalOpen && (
                    <motion.div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsAssignmentModalOpen(false)}>
                        <GlassCard className="w-full max-w-sm p-6" variant="thick" onClick={(e: any) => e.stopPropagation()}>
                            <h3 className="text-xl font-bold text-white mb-4">{t.addAssignment}</h3>
                            <div className="space-y-3">
                                <select className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white outline-none" value={assignmentForm.courseId || ''} onChange={e => setAssignmentForm({ ...assignmentForm, courseId: e.target.value })}>
                                    <option value="" disabled className="text-black">Select Course</option>
                                    {courses.map(c => <option key={c.id} value={c.id} className="text-black">{c.name}</option>)}
                                </select>
                                <input placeholder={t.assignmentTitle} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white placeholder-white/30 focus:border-blue-500 outline-none" value={assignmentForm.title || ''} onChange={e => setAssignmentForm({ ...assignmentForm, title: e.target.value })} />

                                <div>
                                    <label className="text-xs text-white/50 ml-1 mb-1 block">{t.dueDate}</label>
                                    <input type="date" className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white outline-none" value={assignmentForm.dueDate || ''} onChange={e => setAssignmentForm({ ...assignmentForm, dueDate: e.target.value })} />
                                </div>

                                <div>
                                    <label className="text-xs text-white/50 ml-1 mb-1 block">{t.type}</label>
                                    <div className="flex gap-2 mt-1">
                                        {(['homework', 'exam', 'project'] as const).map(type => (
                                            <button
                                                key={type}
                                                onClick={() => setAssignmentForm({ ...assignmentForm, type: type })}
                                                className={`flex-1 py-2 rounded-xl text-xs border transition-colors ${assignmentForm.type === type ? 'bg-white text-black border-white font-bold' : 'bg-transparent text-white/60 border-white/10 hover:bg-white/5'}`}
                                            >
                                                {t[type]}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-3 mt-6">
                                <button onClick={() => setIsAssignmentModalOpen(false)} className="flex-1 py-3 bg-white/5 rounded-xl text-white hover:bg-white/10 transition-colors">{t.cancel}</button>
                                <button onClick={handleAddAssignment} className="flex-1 py-3 bg-white text-black font-bold rounded-xl hover:bg-gray-200 transition-colors">{t.save}</button>
                            </div>
                        </GlassCard>
                    </motion.div>
                )}
            </AnimatePresence>

        </div>
    );
};

export default UniversityDashboard;