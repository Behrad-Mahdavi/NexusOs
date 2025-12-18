import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { triggerHaptic } from '../utils/feedback';
import GlassCard from './GlassCard';
import { MOCK_CLIENTS } from '../constants';
import { MoreHorizontal, Plus, X, Trash2, Check, Clock, Circle, DollarSign, Briefcase } from 'lucide-react';
import { Language, Task, TaskContext, TaskStatus } from '../types';
import { getTranslation } from '../translations';

interface FreelanceBoardProps {
    lang: Language;
    tasks: Task[];
    onSaveTask: (task: Task) => Promise<void>; // تغییر به Promise برای هندل کردن لودینگ
    onDeleteTask: (id: string) => void;
}

const FreelanceBoard: React.FC<FreelanceBoardProps> = ({ lang, tasks, onSaveTask, onDeleteTask }) => {
    const t = getTranslation(lang);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<Task | null>(null);
    const [isSaving, setIsSaving] = useState(false); // وضعیت لودینگ

    // Form State
    const [title, setTitle] = useState('');
    const [energy, setEnergy] = useState<1 | 2 | 3>(2);
    const [context, setContext] = useState<TaskContext>('freelance');
    const [status, setStatus] = useState<TaskStatus>('todo');
    const [revenue, setRevenue] = useState<string>('');

    const columns = [
        { id: 'todo', label: t.todo, color: 'bg-white/5 border-t-white/10' },
        { id: 'doing', label: t.active, color: 'bg-blue-500/10 border-t-blue-500/30' },
        { id: 'done', label: t.done, color: 'bg-green-500/10 border-t-green-500/30' },
    ];

    // فیلتر کردن تسک‌های فریلنسری
    const freelanceTasks = tasks.filter(t => t.context === 'freelance');

    // محاسبه مجموع درآمد برای نمایش (Optional Polish)
    const totalPotential = freelanceTasks.reduce((acc, t) => acc + (t.revenue || 0), 0);

    const openNewTaskModal = (defaultStatus: TaskStatus = 'todo') => {
        setEditingTask(null);
        setTitle('');
        setEnergy(2);
        setContext('freelance');
        setStatus(defaultStatus);
        setRevenue('');
        setIsModalOpen(true);
    };

    const openEditTaskModal = (task: Task) => {
        setEditingTask(task);
        setTitle(task.title);
        setEnergy(task.energyCost);
        setContext(task.context);
        setStatus(task.status);
        // هندل کردن نمایش تمیز قیمت (بدون صفر اعشار اضافی)
        setRevenue(task.revenue && task.revenue > 0 ? task.revenue.toString() : '');
        setIsModalOpen(true);
    };

    const handleSave = async () => {
        if (!title.trim()) {
            toast.error("Title is required");
            return;
        }

        setIsSaving(true);
        const now = new Date().toISOString();
        const isCompleting = status === 'done' && (editingTask?.status !== 'done');
        const completedAt = isCompleting ? now : (status === 'done' ? (editingTask?.completedAt || now) : undefined);
        
        // ایمن‌سازی ورودی پول
        let revenueNum = parseFloat(revenue);
        if (isNaN(revenueNum) || revenueNum < 0) revenueNum = 0;

        // تولید ID ایمن
        const tempId = editingTask ? editingTask.id : (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Date.now().toString());

        const taskToSave: Task = {
            id: tempId,
            title: title.trim(),
            energyCost: energy,
            context,
            status,
            dueDate: editingTask?.dueDate || new Date().toISOString().split('T')[0],
            completedAt,
            tags: editingTask?.tags || [],
            revenue: revenueNum
        };

        try {
            await onSaveTask(taskToSave);
            triggerHaptic('success');
            
            if (isCompleting) {
                toast.success('Money in the bank! 💰', { description: `$${revenueNum} revenue logged.` });
            } else if (!editingTask) {
                toast.success('Project added');
            } else {
                toast.success('Project updated');
            }
            setIsModalOpen(false);
        } catch (error) {
            console.error(error);
            toast.error("Failed to save. Check connection.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = () => {
        if (editingTask) {
            if(confirm("Delete this project?")) {
                onDeleteTask(editingTask.id);
                setIsModalOpen(false);
                triggerHaptic('medium');
            }
        }
    };

    return (
        <div className="p-4 md:p-6 h-full flex flex-col relative overflow-hidden">
            {/* Header */}
            <div className="flex justify-between items-start mb-6 shrink-0">
                <div>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Briefcase className="text-green-400" size={24}/>
                        {t.freelanceCockpit}
                    </h2>
                    <div className="flex items-center gap-2 mt-1">
                        <p className="text-white/60 text-sm">{t.manageClients}</p>
                        <span className="text-white/20">•</span>
                        <span className="text-green-400/80 text-xs font-mono bg-green-500/10 px-2 py-0.5 rounded">
                            ${totalPotential.toLocaleString()} Pipeline
                        </span>
                    </div>
                </div>
                
                {/* Client Avatars (Visual Only for now) */}
                <div className="flex -space-x-2">
                    {MOCK_CLIENTS.slice(0, 4).map((client, i) => (
                        <div key={client.id} className="w-8 h-8 rounded-full border-2 border-[#0a0a0a] bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center text-[10px] text-white font-bold shadow-lg" style={{zIndex: 4-i}}>
                            {client.name.charAt(0)}
                        </div>
                    ))}
                    <button className="w-8 h-8 rounded-full border-2 border-[#0a0a0a] bg-white/10 flex items-center justify-center text-white/50 hover:bg-white/20 hover:text-white transition-colors">
                        <Plus size={14} />
                    </button>
                </div>
            </div>

            {/* Kanban Columns */}
            <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 min-h-0"> 
                {columns.map(col => (
                    <div key={col.id} className="flex flex-col h-full min-h-0 bg-white/5 rounded-2xl border border-white/5 overflow-hidden">
                        {/* Column Header */}
                        <div className={`flex items-center justify-between p-3 border-t-4 ${col.color} bg-black/20`}>
                            <div className="flex items-center gap-2">
                                <span className="font-semibold text-white text-sm">{col.label}</span>
                                <span className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded text-white/50">
                                    {freelanceTasks.filter(t => t.status === col.id).length}
                                </span>
                            </div>
                            <button onClick={() => openNewTaskModal(col.id as TaskStatus)} className="p-1 rounded hover:bg-white/10 text-white/50 hover:text-white transition-colors">
                                <Plus size={16} />
                            </button>
                        </div>

                        {/* Column Body */}
                        <div className="flex-1 p-3 space-y-3 overflow-y-auto custom-scrollbar">
                            {freelanceTasks.filter(t => t.status === col.id).map(task => (
                                <GlassCard
                                    key={task.id}
                                    className="p-3 cursor-pointer hover:bg-white/10 border border-white/5 hover:border-white/10 transition-all group active:scale-95"
                                    onClick={() => openEditTaskModal(task)}
                                    variant="thin"
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex flex-wrap gap-1">
                                            {task.tags && task.tags.length > 0 ? (
                                                task.tags.map((tag, i) => (
                                                     <span key={i} className="text-[9px] bg-white/10 text-white/70 px-1.5 py-0.5 rounded">{tag}</span>
                                                ))
                                            ) : (
                                                <span className="text-[9px] bg-white/5 text-white/40 px-1.5 py-0.5 rounded">No Tag</span>
                                            )}
                                        </div>
                                        <MoreHorizontal size={14} className="text-white/20 group-hover:text-white/60 transition-colors" />
                                    </div>
                                    
                                    <h4 className="text-white font-medium text-sm mb-3 leading-snug line-clamp-2">{task.title}</h4>
                                    
                                    <div className="flex items-end justify-between border-t border-white/5 pt-2 mt-auto">
                                        <div className="flex gap-0.5">
                                            {[...Array(3)].map((_, i) => (
                                                <div 
                                                    key={i} 
                                                    className={`w-1.5 h-1.5 rounded-full ${i < task.energyCost ? 'bg-blue-400' : 'bg-white/10'}`} 
                                                />
                                            ))}
                                        </div>
                                        {task.revenue && task.revenue > 0 ? (
                                            <span className="text-green-400 text-xs font-mono font-bold bg-green-400/10 px-1.5 py-0.5 rounded">
                                                ${task.revenue.toLocaleString()}
                                            </span>
                                        ) : (
                                            <span className="text-white/20 text-xs">-</span>
                                        )}
                                    </div>
                                </GlassCard>
                            ))}
                            
                            {/* Empty State for Column */}
                            {freelanceTasks.filter(t => t.status === col.id).length === 0 && (
                                <div className="h-24 border border-dashed border-white/10 rounded-xl flex items-center justify-center text-white/20 text-xs">
                                    Empty
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Task Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <motion.div
                        className="absolute inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => !isSaving && setIsModalOpen(false)}
                    >
                        <GlassCard 
                            className="w-full max-w-md p-6 border-white/20 shadow-2xl" 
                            variant="thick"
                            onClick={(e: React.MouseEvent) => e.stopPropagation()}
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                    {editingTask ? <Briefcase size={20} className="text-blue-400"/> : <Plus size={20} className="text-green-400"/>}
                                    {editingTask ? t.editTaskTitle : t.addTaskTitle}
                                </h3>
                                <button onClick={() => setIsModalOpen(false)} disabled={isSaving} className="text-white/50 hover:text-white transition-colors">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="space-y-5">
                                {/* Title Input */}
                                <div>
                                    <label className="text-xs text-white/50 uppercase ml-1 mb-1 block">Project Name</label>
                                    <input
                                        type="text"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        placeholder="e.g. Website Redesign"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white placeholder-white/30 focus:outline-none focus:border-blue-400/50 focus:bg-white/10 transition-all font-medium"
                                        autoFocus
                                    />
                                </div>

                                {/* Controls Grid */}
                                <div className="grid grid-cols-2 gap-4">
                                    {/* Energy Selector */}
                                    <div>
                                        <label className="text-xs text-white/50 uppercase mb-2 block">{t.energyLabel}</label>
                                        <div className="flex gap-1 bg-white/5 p-1 rounded-xl border border-white/10">
                                            {[1, 2, 3].map((level) => (
                                                <button
                                                    key={level}
                                                    onClick={() => setEnergy(level as any)}
                                                    className={`flex-1 h-9 rounded-lg text-sm font-medium transition-all ${
                                                        energy === level 
                                                        ? 'bg-blue-500 text-white shadow-lg' 
                                                        : 'text-white/40 hover:text-white hover:bg-white/5'
                                                    }`}
                                                >
                                                    {level === 1 ? 'Low' : level === 2 ? 'Med' : 'High'}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    
                                    {/* Status Selector */}
                                    <div>
                                        <label className="text-xs text-white/50 uppercase mb-2 block">{t.statusLabel}</label>
                                        <div className="flex gap-2">
                                            <button 
                                                onClick={() => setStatus('todo')} 
                                                className={`flex-1 p-2 rounded-xl border transition-all flex items-center justify-center ${status === 'todo' ? 'bg-white/20 border-white text-white' : 'bg-white/5 border-white/10 text-white/30'}`}
                                            >
                                                <Circle size={18} />
                                            </button>
                                            <button 
                                                onClick={() => setStatus('doing')} 
                                                className={`flex-1 p-2 rounded-xl border transition-all flex items-center justify-center ${status === 'doing' ? 'bg-blue-500/20 border-blue-400 text-blue-400' : 'bg-white/5 border-white/10 text-white/30'}`}
                                            >
                                                <Clock size={18} />
                                            </button>
                                            <button 
                                                onClick={() => setStatus('done')} 
                                                className={`flex-1 p-2 rounded-xl border transition-all flex items-center justify-center ${status === 'done' ? 'bg-green-500/20 border-green-400 text-green-400' : 'bg-white/5 border-white/10 text-white/30'}`}
                                            >
                                                <Check size={18} />
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Revenue Input */}
                                <div>
                                    <label className="text-xs text-white/50 uppercase mb-2 block">{t.revenueLabel}</label>
                                    <div className="relative group">
                                        <div className="absolute left-3 top-3.5 text-green-400/50 group-focus-within:text-green-400 transition-colors">
                                            <DollarSign size={16} />
                                        </div>
                                        <input
                                            type="number"
                                            value={revenue}
                                            onChange={(e) => setRevenue(e.target.value)}
                                            placeholder="0.00"
                                            className="w-full bg-white/5 border border-white/10 rounded-xl p-3 pl-9 text-white placeholder-white/30 focus:outline-none focus:border-green-500/50 focus:bg-green-500/5 transition-all font-mono text-lg"
                                        />
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex gap-3 mt-8 pt-4 border-t border-white/10">
                                    {editingTask && (
                                        <button
                                            onClick={handleDelete}
                                            disabled={isSaving}
                                            className="p-3.5 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-colors disabled:opacity-50"
                                        >
                                            <Trash2 size={20} />
                                        </button>
                                    )}
                                    <button
                                        onClick={() => setIsModalOpen(false)}
                                        disabled={isSaving}
                                        className="flex-1 py-3 rounded-xl bg-white/5 text-white hover:bg-white/10 transition-colors font-medium disabled:opacity-50"
                                    >
                                        {t.cancel}
                                    </button>
                                    <button
                                        onClick={handleSave}
                                        disabled={isSaving}
                                        className="flex-1 py-3 rounded-xl bg-white text-black font-bold hover:bg-gray-200 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        {isSaving ? (
                                            <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin"/>
                                        ) : t.save}
                                    </button>
                                </div>
                            </div>
                        </GlassCard>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default FreelanceBoard;