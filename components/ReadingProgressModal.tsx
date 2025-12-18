import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, BookOpen, ChevronRight, Check } from 'lucide-react';
import { Task } from '../types';

interface ReadingProgressModalProps {
    isOpen: boolean;
    onClose: () => void;
    task: Task;
    onSave: (taskId: string, newPage: number, pagesRead: number) => Promise<void>;
}

const ReadingProgressModal: React.FC<ReadingProgressModalProps> = ({ isOpen, onClose, task, onSave }) => {
    const [currentPage, setCurrentPage] = useState<string>(task.currentPage?.toString() || '0');
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        const newPageNum = parseInt(currentPage);
        const oldPageNum = task.currentPage || 0;

        if (isNaN(newPageNum) || newPageNum < oldPageNum) {
            alert('Invalid page number');
            return;
        }

        const pagesRead = newPageNum - oldPageNum;
        if (pagesRead === 0) {
            onClose();
            return;
        }

        setLoading(true);
        await onSave(task.id, newPageNum, pagesRead);
        setLoading(false);
        onClose();
    };

    const progress = task.totalPages ? Math.round(((parseInt(currentPage) || 0) / task.totalPages) * 100) : 0;

    // Calculate Time Remaining (MVP: 2 min per page)
    const remainingPages = (task.totalPages || 0) - (parseInt(currentPage) || 0);
    const remainingMinutes = remainingPages * 2;
    const remainingHours = Math.floor(remainingMinutes / 60);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-sm bg-gray-900 border border-white/10 rounded-2xl p-6 shadow-2xl relative overflow-hidden"
            >
                {/* Background gradient effect */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-purple-500"></div>

                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors"
                >
                    <X size={20} />
                </button>

                <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-blue-500/20 rounded-xl text-blue-400">
                        <BookOpen size={24} />
                    </div>
                    <div>
                        <h3 className="text-white font-bold text-lg truncate max-w-[200px]">{task.title}</h3>
                        <p className="text-white/50 text-xs uppercase tracking-wider">Update Progress</p>
                    </div>
                </div>

                <form onSubmit={handleSave}>
                    <div className="space-y-4">
                        <div>
                            <label className="text-xs text-white/50 uppercase font-semibold mb-2 block">Current Page Number</label>
                            <div className="relative">
                                <input
                                    type="number"
                                    value={currentPage}
                                    onChange={(e) => setCurrentPage(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-2xl font-mono text-white focus:border-blue-500 outline-none transition-colors"
                                    placeholder="0"
                                    autoFocus
                                />
                                {task.totalPages && (
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 text-sm">
                                        / {task.totalPages}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Scoped Stats */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-white/5 rounded-lg p-3 text-center">
                                <div className="text-xs text-white/40 uppercase mb-1">Progress</div>
                                <div className="text-lg font-bold text-white">{progress}%</div>
                            </div>
                            <div className="bg-white/5 rounded-lg p-3 text-center">
                                <div className="text-xs text-white/40 uppercase mb-1">Remaining</div>
                                <div className="text-lg font-bold text-white">
                                    {remainingHours > 0 ? `${remainingHours}h ` : ''}{remainingMinutes % 60}m
                                </div>
                            </div>
                        </div>

                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
                            >
                                {loading ? 'Saving...' : (
                                    <>
                                        <Check size={18} /> Update & Sync Energy
                                    </>
                                )}
                            </button>
                            <p className="text-center text-xs text-white/30 mt-3">
                                +{Math.max(0, parseInt(currentPage) - (task.currentPage || 0))} pages will be added to today's load
                            </p>
                        </div>
                    </div>
                </form>

            </motion.div>
        </div>
    );
};

export default ReadingProgressModal;
