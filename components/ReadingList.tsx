import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, BookOpen, Clock, Trash2, X } from 'lucide-react';
import GlassCard from './GlassCard';
import { Language, Task } from '../types';
import { getTranslation } from '../translations';
import ReadingProgressModal from './ReadingProgressModal';

interface ReadingListProps {
    lang: Language;
    tasks: Task[];
    onSaveTask: (task: Task) => Promise<void>;
    onDeleteTask: (id: string) => Promise<void>;
    onReadingProgress: (taskId: string, newPage: number, pagesRead: number) => Promise<void>;
}

const ReadingList: React.FC<ReadingListProps> = ({
    lang,
    tasks,
    onSaveTask,
    onDeleteTask,
    onReadingProgress
}) => {
    const t = getTranslation(lang);
    // فقط تسک‌های ریدینگ را فیلتر کن و مطمئن شو حذف نشده‌اند (safety check)
    const readingTasks = tasks.filter(t => t.type === 'reading');

    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);

    // Form State
    const [title, setTitle] = useState('');
    const [totalPages, setTotalPages] = useState('');

    const handleAddNew = async () => {
        // ۱. اعتبارسنجی قوی‌تر (Validation)
        if (!title.trim() || !totalPages) return;
        
        const pages = parseInt(totalPages);
        if (isNaN(pages) || pages <= 0) {
            alert("Please enter a valid number of pages.");
            return;
        }

        // ۲. تولید UUID واقعی سمت کلاینت (Modern Browser API)
        const tempId = typeof crypto !== 'undefined' && crypto.randomUUID 
            ? crypto.randomUUID() 
            : Date.now().toString(); // Fallback for older browsers

        const newTask: Task = {
            id: tempId,
            title: title.trim(),
            status: 'todo',
            context: 'growth',
            energyCost: 2, // متوسط در نظر بگیر یا ورودی بگیر
            dueDate: new Date().toISOString().split('T')[0],
            type: 'reading',
            totalPages: pages,
            currentPage: 0,
            revenue: 0, // مقدار پیش‌فرض برای جلوگیری از ارور دیتابیس
            tags: []
        };

        await onSaveTask(newTask);
        setIsAddModalOpen(false);
        setTitle('');
        setTotalPages('');
    };

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (confirm('Are you sure you want to remove this book from your library?')) {
            await onDeleteTask(id);
        }
    };

    // ۳. تابع کمکی برای محاسبه درصد ایمن
    const calculateProgress = (current: number = 0, total: number = 1) => {
        if (total <= 0) return 0;
        return Math.min(100, Math.round((current / total) * 100));
    };

    return (
        <div className="p-4 md:p-6 pb-32 h-full overflow-y-auto no-scrollbar">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8 flex justify-between items-end"
            >
                <div>
                    <h1 className="text-3xl font-bold text-white mb-1">Library</h1>
                    <p className="text-white/60 text-lg">Your intellectual journey</p>
                </div>
                <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="px-4 py-2 bg-white text-black rounded-xl font-medium hover:bg-gray-200 transition-colors flex items-center gap-2 active:scale-95"
                >
                    <Plus size={18} /> Add Book
                </button>
            </motion.div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {readingTasks.map(task => {
                    const current = task.currentPage || 0;
                    const total = task.totalPages || 0;
                    const progress = calculateProgress(current, total);
                    const remainingPages = Math.max(0, total - current);
                    // تخمین زمان: هر صفحه ۲ دقیقه (می‌توانی این را داینامیک کنی)
                    const timeLeft = Math.ceil((remainingPages * 2) / 60);

                    return (
                        <GlassCard
                            key={task.id}
                            className="p-4 cursor-pointer hover:bg-white/10 transition-all group relative overflow-hidden"
                            onClick={() => setSelectedTask(task)}
                        >
                            {/* نوار رنگی کناری برای زیبایی بصری */}
                            <div className={`absolute top-0 left-0 w-1 h-full bg-gradient-to-b ${progress === 100 ? 'from-green-400 to-emerald-500' : 'from-blue-400 to-purple-500'}`}></div>

                            <div className="flex justify-between items-start mb-3">
                                <div className="p-2 bg-white/5 rounded-lg text-white/80">
                                    <BookOpen size={20} />
                                </div>
                                <button
                                    onClick={(e) => handleDelete(task.id, e)}
                                    className="text-white/20 hover:text-red-400 hover:bg-red-500/10 p-1.5 rounded-lg transition-colors z-10"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>

                            <h3 className="text-white font-bold text-lg leading-tight mb-2 line-clamp-2 min-h-[3.5rem]" title={task.title}>
                                {task.title}
                            </h3>

                            <div className="space-y-3">
                                {/* Progress Bar */}
                                <div>
                                    <div className="flex justify-between text-xs text-white/50 mb-1 font-mono">
                                        <span>{progress}%</span>
                                        <span>{current} / {total}</span>
                                    </div>
                                    <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                                        <motion.div
                                            className={`h-full bg-gradient-to-r ${progress === 100 ? 'from-green-400 to-emerald-500' : 'from-blue-400 to-purple-500'}`}
                                            initial={{ width: 0 }}
                                            animate={{ width: `${progress}%` }}
                                            transition={{ duration: 1, ease: "easeOut" }}
                                        />
                                    </div>
                                </div>

                                {/* Stats */}
                                <div className="flex items-center gap-3 text-xs text-white/40">
                                    {progress < 100 ? (
                                        <div className="flex items-center gap-1">
                                            <Clock size={12} />
                                            <span>~{timeLeft}h left</span>
                                        </div>
                                    ) : (
                                        <span className="text-green-400 font-medium">Completed</span>
                                    )}
                                </div>
                            </div>
                        </GlassCard>
                    );
                })}
            </div>

            {/* Add Book Modal */}
            <AnimatePresence>
                {isAddModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="w-full max-w-sm bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 shadow-2xl"
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold text-white">Add New Book</h3>
                                <button onClick={() => setIsAddModalOpen(false)} className="p-1 hover:bg-white/10 rounded-full transition-colors">
                                    <X className="text-white/50" size={20} />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs text-white/40 uppercase ml-1 mb-1 block">Title</label>
                                    <input
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        placeholder="e.g. Atomic Habits"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:border-blue-500 focus:bg-white/10 outline-none transition-all"
                                        autoFocus
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-white/40 uppercase ml-1 mb-1 block">Total Pages</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={totalPages}
                                        onChange={(e) => setTotalPages(e.target.value)}
                                        placeholder="e.g. 300"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:border-blue-500 focus:bg-white/10 outline-none transition-all"
                                    />
                                </div>
                                <button
                                    onClick={handleAddNew}
                                    disabled={!title || !totalPages}
                                    className="w-full py-3 bg-white text-black font-bold rounded-xl mt-4 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
                                >
                                    Start Reading
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Reading Progress Modal */}
            {selectedTask && (
                <ReadingProgressModal
                    isOpen={!!selectedTask}
                    onClose={() => setSelectedTask(null)}
                    task={selectedTask}
                    onSave={onReadingProgress}
                />
            )}
        </div>
    );
};

export default ReadingList;