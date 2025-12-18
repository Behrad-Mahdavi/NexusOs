import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import GlassCard from './GlassCard';
import { MOCK_CLIENTS } from '../constants';
import { MoreHorizontal, Plus, X, Trash2, Check, Clock, Circle, DollarSign } from 'lucide-react';
import { Language, Task, TaskContext, TaskStatus } from '../types';
import { getTranslation } from '../translations';

interface FreelanceBoardProps {
    lang: Language;
    tasks: Task[];
    onSaveTask: (task: Task) => void;
    onDeleteTask: (id: string) => void;
}

const FreelanceBoard: React.FC<FreelanceBoardProps> = ({ lang, tasks, onSaveTask, onDeleteTask }) => {
    const t = getTranslation(lang);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<Task | null>(null);

    // Form State
    const [title, setTitle] = useState('');
    const [energy, setEnergy] = useState<1 | 2 | 3>(2);
    const [context, setContext] = useState<TaskContext>('freelance');
    const [status, setStatus] = useState<TaskStatus>('todo');
    const [revenue, setRevenue] = useState<string>(''); // Handle as string for input

    const columns = [
        { id: 'todo', label: t.todo, color: 'bg-white/10' },
        { id: 'doing', label: t.active, color: 'bg-blue-500/20' },
        { id: 'done', label: t.done, color: 'bg-green-500/20' },
    ];

    const freelanceTasks = tasks.filter(t => t.context === 'freelance');

    const openNewTaskModal = () => {
        setEditingTask(null);
        setTitle('');
        setEnergy(2);
        setContext('freelance');
        setStatus('todo');
        setRevenue('');
        setIsModalOpen(true);
    };

    const openEditTaskModal = (task: Task) => {
        setEditingTask(task);
        setTitle(task.title);
        setEnergy(task.energyCost);
        setContext(task.context);
        setStatus(task.status);
        setRevenue(task.revenue ? task.revenue.toString() : '');
        setIsModalOpen(true);
    };

    const handleSave = () => {
        if (!title.trim()) return;

        const now = new Date().toISOString();
        // Determine if just completed
        const isCompleting = status === 'done' && (editingTask?.status !== 'done');
        const completedAt = isCompleting ? now : (status === 'done' ? (editingTask?.completedAt || now) : undefined);
        const revenueNum = revenue ? parseFloat(revenue) : 0;

        const taskToSave: Task = {
            id: editingTask ? editingTask.id : Date.now().toString(), // Temp ID if new
            title,
            energyCost: energy,
            context,
            status,
            dueDate: editingTask?.dueDate || new Date().toISOString().split('T')[0],
            completedAt,
            tags: editingTask?.tags || [],
            revenue: revenueNum
        };

        onSaveTask(taskToSave);
        setIsModalOpen(false);
    };

    const handleDelete = () => {
        if (editingTask) {
            onDeleteTask(editingTask.id);
            setIsModalOpen(false);
        }
    };

    return (
        <div className="p-4 md:p-6 h-full flex flex-col relative">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-white">{t.freelanceCockpit}</h2>
                    <p className="text-white/60">{t.manageClients}</p>
                </div>
                <div className="flex gap-2">
                    {MOCK_CLIENTS.map(client => (
                        <GlassCard key={client.id} className="px-3 py-1 flex items-center gap-2 !rounded-full">
                            <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-orange-400 to-red-500 flex items-center justify-center text-[10px] font-bold text-white">
                                {client.name.substring(0, 1)}
                            </div>
                            <span className="text-sm text-white/80">{client.name}</span>
                        </GlassCard>
                    ))}
                </div>
            </div>

            <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 overflow-y-auto md:overflow-hidden pb-20 md:pb-0">
                {columns.map(col => (
                    <div key={col.id} className="flex flex-col h-full">
                        <div className={`flex items-center justify-between p-3 rounded-t-xl ${col.color} backdrop-blur-md border-t border-x border-white/10`}>
                            <span className="font-semibold text-white text-sm">{col.label}</span>
                            <button onClick={openNewTaskModal} className="text-white/50 hover:text-white"><Plus size={16} /></button>
                        </div>
                        <div className="flex-1 bg-black/20 backdrop-blur-sm border-x border-b border-white/5 rounded-b-xl p-3 space-y-3 overflow-y-auto no-scrollbar">
                            {freelanceTasks.filter(t => t.status === col.id).map(task => (
                                <GlassCard
                                    key={task.id}
                                    className="p-4 cursor-pointer hover:translate-y-[-2px] transition-transform"
                                    onClick={() => openEditTaskModal(task)}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="px-2 py-0.5 rounded bg-white/10 text-[10px] text-white/60">
                                            {t.context[task.context]}
                                        </span>
                                        <MoreHorizontal size={14} className="text-white/40" />
                                    </div>
                                    <h4 className="text-white font-medium text-sm mb-2">{task.title}</h4>
                                    <div className="flex items-center justify-between">
                                        <div className="flex -space-x-2">
                                            {[...Array(task.energyCost)].map((_, i) => (
                                                <div key={i} className="w-2 h-2 rounded-full bg-blue-400"></div>
                                            ))}
                                        </div>
                                        <span className="text-white/60 text-xs font-mono font-medium" dir="ltr">
                                            {task.revenue ? `$${task.revenue.toLocaleString()}` : '-'}
                                        </span>
                                    </div>
                                </GlassCard>
                            ))}
                            {col.id === 'todo' && (
                                <button
                                    onClick={openNewTaskModal}
                                    className="w-full py-3 rounded-xl border border-dashed border-white/20 text-white/30 text-sm hover:border-white/40 hover:text-white/60 transition-colors"
                                >
                                    {t.newTask}
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Task Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <motion.div
                        className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <GlassCard className="w-full max-w-md p-6" variant="thick">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold text-white">
                                    {editingTask ? t.editTaskTitle : t.addTaskTitle}
                                </h3>
                                <button onClick={() => setIsModalOpen(false)}><X className="text-white/50 hover:text-white" /></button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <input
                                        type="text"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        placeholder={t.taskTitlePlaceholder}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white placeholder-white/30 focus:outline-none focus:border-blue-400 transition-colors"
                                        autoFocus
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs text-white/50 uppercase mb-2 block">{t.energyLabel}</label>
                                        <div className="flex gap-2">
                                            {[1, 2, 3].map((level) => (
                                                <button
                                                    key={level}
                                                    onClick={() => setEnergy(level as any)}
                                                    className={`flex-1 h-8 rounded-lg border flex items-center justify-center transition-all ${energy === level ? 'bg-blue-500 border-blue-400 text-white' : 'bg-white/5 border-white/10 text-white/40'
                                                        }`}
                                                >
                                                    {level}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-xs text-white/50 uppercase mb-2 block">{t.statusLabel}</label>
                                        <div className="flex gap-2">
                                            <button onClick={() => setStatus('todo')} className={`p-2 rounded-lg border ${status === 'todo' ? 'bg-white/20 border-white text-white' : 'bg-white/5 border-white/10 text-white/40'}`}><Circle size={16} /></button>
                                            <button onClick={() => setStatus('doing')} className={`p-2 rounded-lg border ${status === 'doing' ? 'bg-blue-500/20 border-blue-400 text-blue-400' : 'bg-white/5 border-white/10 text-white/40'}`}><Clock size={16} /></button>
                                            <button onClick={() => setStatus('done')} className={`p-2 rounded-lg border ${status === 'done' ? 'bg-green-500/20 border-green-400 text-green-400' : 'bg-white/5 border-white/10 text-white/40'}`}><Check size={16} /></button>
                                        </div>
                                    </div>
                                </div>

                                {/* Revenue Input */}
                                <div>
                                    <label className="text-xs text-white/50 uppercase mb-2 block">{t.revenueLabel}</label>
                                    <div className="relative">
                                        <DollarSign size={16} className="absolute left-3 top-3 text-white/50" />
                                        <input
                                            type="number"
                                            value={revenue}
                                            onChange={(e) => setRevenue(e.target.value)}
                                            placeholder="0.00"
                                            className="w-full bg-white/5 border border-white/10 rounded-xl p-3 pl-9 text-white placeholder-white/30 focus:outline-none focus:border-green-400 transition-colors font-mono"
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-3 mt-8 pt-4 border-t border-white/10">
                                    {editingTask && (
                                        <button
                                            onClick={handleDelete}
                                            className="p-3 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                                        >
                                            <Trash2 size={20} />
                                        </button>
                                    )}
                                    <button
                                        onClick={() => setIsModalOpen(false)}
                                        className="flex-1 py-3 rounded-xl bg-white/5 text-white hover:bg-white/10 transition-colors"
                                    >
                                        {t.cancel}
                                    </button>
                                    <button
                                        onClick={handleSave}
                                        className="flex-1 py-3 rounded-xl bg-white text-black font-semibold hover:bg-gray-200 transition-colors"
                                    >
                                        {t.save}
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