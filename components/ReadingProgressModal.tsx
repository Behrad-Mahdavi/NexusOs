import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, BookOpen, Check, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Task } from '../types';

interface ReadingProgressModalProps {
    isOpen: boolean;
    onClose: () => void;
    task: Task;
    onSave: (taskId: string, newPage: number, pagesRead: number) => Promise<void>;
}

const ReadingProgressModal: React.FC<ReadingProgressModalProps> = ({ isOpen, onClose, task, onSave }) => {
    // تبدیل امن به رشته برای اینپوت
    const [currentPage, setCurrentPage] = useState<string>('');
    const [loading, setLoading] = useState(false);

    // همگام‌سازی استیت وقتی مودال باز می‌شود
    useEffect(() => {
        if (isOpen && task.currentPage !== undefined) {
            setCurrentPage(task.currentPage.toString());
        }
    }, [isOpen, task.currentPage]);

    if (!isOpen) return null;

    const totalPages = task.totalPages || 0;
    const currentVal = parseInt(currentPage) || 0;
    const oldPageNum = task.currentPage || 0;

    // محاسبات لحظه‌ای
    const progress = totalPages > 0 ? Math.round((currentVal / totalPages) * 100) : 0;
    const remainingPages = Math.max(0, totalPages - currentVal);
    // تخمین: هر صفحه ۲ دقیقه (می‌توانی این را در تنظیمات گلوبال بگذاری)
    const remainingMinutes = remainingPages * 2; 
    const remainingHours = Math.floor(remainingMinutes / 60);

    // هندل کردن دکمه‌های سریع
    const handleQuickAdd = (amount: number) => {
        const newVal = Math.min(totalPages, currentVal + amount);
        setCurrentPage(newVal.toString());
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (isNaN(currentVal)) {
            toast.error("Please enter a valid number");
            return;
        }

        if (currentVal > totalPages) {
            toast.error(`Book only has ${totalPages} pages!`);
            return;
        }

        if (currentVal < oldPageNum) {
            // اجازه اصلاح اشتباه را می‌دهیم، اما پروگرس منفی ثبت نمی‌کنیم (یا بسته به لاجیک بک‌اندت)
            toast.error("New page cannot be less than current progress.");
            return;
        }

        const pagesRead = currentVal - oldPageNum;
        
        if (pagesRead === 0) {
            onClose();
            return;
        }

        setLoading(true);
        try {
            await onSave(task.id, currentVal, pagesRead);
            // Toast موفقیت در پرنت هندل می‌شود یا اینجا:
            // toast.success(`Read ${pagesRead} pages!`); 
            onClose();
        } catch (error) {
            toast.error("Failed to save progress");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="w-full max-w-sm bg-[#0a0a0a] border border-white/10 rounded-3xl p-6 shadow-2xl relative overflow-hidden"
            >
                {/* Header Decoration */}
                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>

                <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-400 border border-blue-500/20">
                            <BookOpen size={24} />
                        </div>
                        <div>
                            <h3 className="text-white font-bold text-lg leading-tight line-clamp-1">{task.title}</h3>
                            <p className="text-white/50 text-xs font-medium uppercase tracking-wide mt-1">Log Reading</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 -mr-2 -mt-2 text-white/30 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSave}>
                    <div className="space-y-6">
                        {/* Input Section */}
                        <div className="relative">
                            <input
                                type="number"
                                value={currentPage}
                                onChange={(e) => setCurrentPage(e.target.value)}
                                // UX Tip: Select all text on focus
                                onFocus={(e) => e.target.select()} 
                                className={`w-full bg-white/5 border rounded-2xl p-5 text-4xl font-mono font-bold text-center text-white outline-none transition-all
                                    ${currentVal > totalPages ? 'border-red-500/50 text-red-400' : 'border-white/10 focus:border-blue-500/50 focus:bg-white/10'}
                                `}
                                placeholder={oldPageNum.toString()}
                                autoFocus
                            />
                            <div className="text-center mt-2 text-white/30 text-xs font-medium">
                                / {totalPages} pages
                            </div>
                            
                            {/* Validation Message */}
                            {currentVal > totalPages && (
                                <div className="absolute -bottom-6 left-0 w-full flex justify-center items-center gap-1 text-red-400 text-xs">
                                    <AlertCircle size={12} /> Exceeds total pages
                                </div>
                            )}
                        </div>

                        {/* Quick Add Buttons (Mobile Friendly) */}
                        <div className="flex justify-center gap-2">
                            <button type="button" onClick={() => handleQuickAdd(10)} className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl text-white/70 text-sm font-medium transition-colors active:scale-95">
                                +10
                            </button>
                            <button type="button" onClick={() => handleQuickAdd(25)} className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl text-white/70 text-sm font-medium transition-colors active:scale-95">
                                +25
                            </button>
                            <button type="button" onClick={() => handleQuickAdd(50)} className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl text-white/70 text-sm font-medium transition-colors active:scale-95">
                                +50
                            </button>
                        </div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 gap-3 bg-white/5 p-1 rounded-2xl border border-white/5">
                            <div className="py-3 text-center border-r border-white/5">
                                <div className="text-[10px] text-white/40 uppercase font-bold tracking-wider mb-1">Completed</div>
                                <div className="text-xl font-bold text-white tabular-nums">{progress}%</div>
                            </div>
                            <div className="py-3 text-center">
                                <div className="text-[10px] text-white/40 uppercase font-bold tracking-wider mb-1">Time Left</div>
                                <div className="text-xl font-bold text-white tabular-nums">
                                    {remainingHours > 0 ? `${remainingHours}h ` : ''}{remainingMinutes % 60}m
                                </div>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <div>
                            <button
                                type="submit"
                                disabled={loading || currentVal > totalPages || currentVal < oldPageNum}
                                className="w-full py-4 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold rounded-2xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
                            >
                                {loading ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>
                                        Update Progress <Check size={18} strokeWidth={3} />
                                    </>
                                )}
                            </button>
                            
                            {/* Delta Preview */}
                            {(currentVal > oldPageNum) && (
                                <p className="text-center text-[10px] text-green-400/70 mt-3 font-medium">
                                    +{currentVal - oldPageNum} pages added to today's load
                                </p>
                            )}
                        </div>
                    </div>
                </form>
            </motion.div>
        </div>
    );
};

export default ReadingProgressModal;