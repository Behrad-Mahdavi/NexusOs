import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, BookOpen, Clock, Trash2, MoreHorizontal, X } from 'lucide-react';
import GlassCard from './GlassCard';
import { Language, Task, TaskType } from '../types';
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
    const readingTasks = tasks.filter(t => t.type === 'reading');

    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);

    // Form State
    const [title, setTitle] = useState('');
    const [totalPages, setTotalPages] = useState('');

    const handleAddNew = async () => {
        if (!title || !totalPages) return;

        const newTask: Task = {
            id: Date.now().toString(),
            title,
            status: 'todo',
            context: 'growth', // Default context for reading
            energyCost: 3, // High cognitive load by default
            dueDate: new Date().toISOString().split('T')[0], // Default to today
            type: 'reading',
            totalPages: parseInt(totalPages),
            currentPage: 0,
            tags: []
        };

        await onSaveTask(newTask);
        setIsAddModalOpen(false);
        setTitle('');
        setTotalPages('');
    };

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (confirm('Delete this book?')) {
            await onDeleteTask(id);
        }
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
                    className="px-4 py-2 bg-white text-black rounded-xl font-medium hover:bg-gray-200 transition-colors flex items-center gap-2"
                >
                    <Plus size={18} /> Add Book
                </button>
            </motion.div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {readingTasks.map(task => {
                    const progress = task.totalPages ? Math.round(((task.currentPage || 0) / task.totalPages) * 100) : 0;
                    const remainingPages = (task.totalPages || 0) - (task.currentPage || 0);
                    const timeLeft = Math.ceil((remainingPages * 2) / 60); // Hours

                    return (
                        <GlassCard
                            key={task.id}
                            className="p-4 cursor-pointer hover:bg-white/10 transition-all group relative overflow-hidden"
                            onClick={() => setSelectedTask(task)}
                        >
                            <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-blue-400 to-purple-500"></div>

                            <div className="flex justify-between items-start mb-3">
                                <div className="p-2 bg-white/5 rounded-lg text-white/80">
                                    <BookOpen size={20} />
                                </div>
                                <button
                                    onClick={(e) => handleDelete(task.id, e)}
                                    className="text-white/20 hover:text-red-400 transition-colors"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>

                            <h3 className="text-white font-bold text-lg leading-tight mb-2 line-clamp-2 min-h-[3.5rem]">
                                {task.title}
                            </h3>

                            <div className="space-y-3">
                                {/* Progress Bar */}
                                <div>
                                    <div className="flex justify-between text-xs text-white/50 mb-1">
                                        <span>{progress}%</span>
                                        <span>{task.currentPage} / {task.totalPages}</span>
                                    </div>
                                    <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                                        <motion.div
                                            className="h-full bg-gradient-to-r from-blue-400 to-purple-500"
                                            initial={{ width: 0 }}
                                            animate={{ width: `${progress}%` }}
                                        />
                                    </div>
                                </div>

                                {/* Stats */}
                                <div className="flex items-center gap-3 text-xs text-white/40">
                                    <div className="flex items-center gap-1">
                                        <Clock size={12} />
                                        <span>~{timeLeft}h left</span>
                                    </div>
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
                            className="w-full max-w-sm bg-gray-900 border border-white/10 rounded-2xl p-6"
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold text-white">Add New Book</h3>
                                <button onClick={() => setIsAddModalOpen(false)}><X className="text-white/50" /></button>
                            </div>

                            <div className="space-y-4">
                                <input
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="Book Title"
                                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:border-blue-500 outline-none"
                                    autoFocus
                                />
                                <input
                                    type="number"
                                    value={totalPages}
                                    onChange={(e) => setTotalPages(e.target.value)}
                                    placeholder="Total Pages"
                                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:border-blue-500 outline-none"
                                />
                                <button
                                    onClick={handleAddNew}
                                    className="w-full py-3 bg-white text-black font-bold rounded-xl mt-4"
                                >
                                    Add to Library
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Reading Progress Modal (Reused) */}
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
