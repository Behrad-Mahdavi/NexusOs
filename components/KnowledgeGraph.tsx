import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as d3 from 'd3';
import { AnimatePresence, motion } from 'framer-motion';
import { Plus, X, Trash2, Share2, Network, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { triggerHaptic } from '../utils/feedback';
import GlassCard from './GlassCard';
import { Language, GraphData, Insight } from '../types';
import { getTranslation } from '../translations';

interface KnowledgeGraphProps {
    lang: Language;
    graphData: GraphData;
    onSaveNode: (node: Insight, connections: string[]) => void;
    onDeleteNode: (id: string) => void;
}

const KnowledgeGraph: React.FC<KnowledgeGraphProps> = ({ lang, graphData, onSaveNode, onDeleteNode }) => {
    const t = getTranslation(lang);
    const svgRef = useRef<SVGSVGElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    
    // نگهداری رفرنس سیمولیشن برای جلوگیری از ریست شدن پوزیشن‌ها
    const simulationRef = useRef<d3.Simulation<any, undefined> | null>(null);

    // UI State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingNode, setEditingNode] = useState<Insight | null>(null);

    // Form State
    const [label, setLabel] = useState('');
    const [group, setGroup] = useState(1);
    const [connections, setConnections] = useState<string[]>([]);

    // --- D3 Logic ---
    useEffect(() => {
        if (!svgRef.current || !containerRef.current) return;

        const width = containerRef.current.clientWidth;
        const height = containerRef.current.clientHeight;

        // ۱. تنظیم اولیه SVG (فقط یک بار انجام شود بهتر است، اما اینجا برای ریسپانسیو بودن آپدیت می‌کنیم)
        const svg = d3.select(svgRef.current);
        svg.attr("viewBox", [0, 0, width, height] as any);

        // ۲. ادغام هوشمند دیتا (Smart Data Merging)
        // این بخش حیاتی است: مختصات نودهای قبلی را حفظ می‌کنیم
        const oldNodes = new Map(simulationRef.current?.nodes().map(d => [d.id, d]));
        
        const nodes = graphData.nodes.map(d => {
            const old = oldNodes.get(d.id);
            // اگر نود قبلاً وجود داشته، مختصات و سرعتش را کپی کن تا نپرد
            return old ? Object.assign(old, d) : { ...d }; 
        });

        const links = graphData.links.map(d => ({ ...d }));

        // ۳. رسم المان‌ها
        // برای سادگی اینجا پاک می‌کنیم، اما چون مختصات (nodes) را حفظ کردیم، پرش نخواهیم داشت
        svg.selectAll("*").remove(); 

        const linkGroup = svg.append("g").attr("class", "links");
        const nodeGroup = svg.append("g").attr("class", "nodes");
        const textGroup = svg.append("g").attr("class", "labels");

        const link = linkGroup
            .attr("stroke", "rgba(255,255,255,0.2)")
            .selectAll("line")
            .data(links)
            .join("line")
            .attr("stroke-width", 1.5);

        const node = nodeGroup
            .selectAll("circle")
            .data(nodes)
            .join("circle")
            .attr("r", (d: any) => Math.sqrt(d.val || 10) * 4 + 5) // سایز داینامیک
            .attr("fill", (d: any) => d.group === 1 ? "#ec4899" : d.group === 2 ? "#38bdf8" : "#a855f7")
            .attr("fill-opacity", 0.9)
            .attr("stroke", "#fff")
            .attr("stroke-width", 1.5)
            .attr("cursor", "grab")
            .call(drag(simulationRef) as any)
            .on("click", (event, d: any) => {
                event.stopPropagation(); // جلوگیری از تداخل با درگ
                const originalNode = graphData.nodes.find(n => n.id === d.id);
                if (originalNode) handleEditNode(originalNode);
            });

        const text = textGroup
            .selectAll("text")
            .data(nodes)
            .join("text")
            .text((d: any) => d.label)
            .attr("font-size", "11px")
            .attr("fill", "rgba(255,255,255,0.9)")
            .attr("dx", 15)
            .attr("dy", 4)
            .style("pointer-events", "none")
            .style("text-shadow", "0 2px 4px rgba(0,0,0,0.8)");

        // ۴. آپدیت یا ایجاد سیمولیشن
        if (!simulationRef.current) {
            // ایجاد برای اولین بار
            simulationRef.current = d3.forceSimulation(nodes)
                .force("link", d3.forceLink(links).id((d: any) => d.id).distance(100))
                .force("charge", d3.forceManyBody().strength(-300))
                .force("center", d3.forceCenter(width / 2, height / 2))
                .force("collide", d3.forceCollide().radius((d: any) => Math.sqrt(d.val || 10) * 4 + 15));
        } else {
            // آپدیت نرم: فقط دیتا را عوض کن و موتور را کمی گرم کن (Alpha Restart)
            simulationRef.current.nodes(nodes);
            (simulationRef.current.force("link") as d3.ForceLink<any, any>).links(links);
            simulationRef.current.alpha(0.3).restart();
        }

        // ۵. تابع تیک (Tick) برای انیمیشن
        simulationRef.current.on("tick", () => {
             // محدود کردن نودها در کادر (Bounding Box)
            const radius = 20; 

            link
                .attr("x1", (d: any) => d.source.x)
                .attr("y1", (d: any) => d.source.y)
                .attr("x2", (d: any) => d.target.x)
                .attr("y2", (d: any) => d.target.y);

            node
                .attr("cx", (d: any) => d.x = Math.max(radius, Math.min(width - radius, d.x)))
                .attr("cy", (d: any) => d.y = Math.max(radius, Math.min(height - radius, d.y)));

            text
                .attr("x", (d: any) => d.x)
                .attr("y", (d: any) => d.y);
        });

        // Cleanup
        return () => {
            simulationRef.current?.stop();
        };
    }, [graphData.nodes.length, graphData.links.length]); // فقط وقتی تعداد تغییر کرد رندر سنگین انجام بده

    // --- منطق درگ کردن (Drag Logic) ---
    function drag(simRef: React.MutableRefObject<d3.Simulation<any, undefined> | null>) {
        function dragstarted(event: any) {
            if (!event.active) simRef.current?.alphaTarget(0.3).restart();
            event.subject.fx = event.subject.x;
            event.subject.fy = event.subject.y;
            d3.select(event.sourceEvent.target).attr("cursor", "grabbing");
        }

        function dragged(event: any) {
            event.subject.fx = event.x;
            event.subject.fy = event.y;
        }

        function dragended(event: any) {
            if (!event.active) simRef.current?.alphaTarget(0);
            event.subject.fx = null;
            event.subject.fy = null;
            d3.select(event.sourceEvent.target).attr("cursor", "grab");
        }

        return d3.drag()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended);
    }

    // Modal Handlers
    const handleAddNode = () => {
        setEditingNode(null);
        setLabel('');
        setGroup(2);
        setConnections([]);
        setIsModalOpen(true);
    };

    const handleEditNode = (node: Insight) => {
        setEditingNode(node);
        setLabel(node.label);
        setGroup(node.group);

        // پیدا کردن کانکشن‌های موجود به صورت ایمن
        const connectedIds = graphData.links
            .filter(l => {
                const s = typeof l.source === 'object' ? (l.source as any).id : l.source;
                const t = typeof l.target === 'object' ? (l.target as any).id : l.target;
                return s === node.id || t === node.id;
            })
            .map(l => {
                const s = typeof l.source === 'object' ? (l.source as any).id : l.source;
                const t = typeof l.target === 'object' ? (l.target as any).id : l.target;
                return s === node.id ? t : s;
            });

        setConnections(connectedIds);
        setIsModalOpen(true);
    };

    const saveNode = () => {
        if (!label.trim()) return;

        // تولید آیدی بهتر
        let nodeId = editingNode ? editingNode.id : (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Date.now().toString());

        const newNode: Insight = {
            id: nodeId,
            label: label,
            group: group,
            val: 10 + (connections.length * 2)
        };

        onSaveNode(newNode, connections);
        triggerHaptic('success');
        toast.success(editingNode ? 'Node updated' : 'Node created');
        setIsModalOpen(false);
    };

    const deleteNode = () => {
        if (!editingNode) return;
        if(confirm(t.deleteConfirm || "Delete this node?")) {
            onDeleteNode(editingNode.id);
            setIsModalOpen(false);
        }
    };

    const toggleConnection = (targetId: string) => {
        if (connections.includes(targetId)) {
            setConnections(prev => prev.filter(id => id !== targetId));
        } else {
            setConnections(prev => [...prev, targetId]);
        }
    };

    return (
        <div className="p-6 h-full flex flex-col relative">
            <div className="flex justify-between items-end mb-4">
                <div>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Network className="text-pink-400" />
                        {t.secondBrain}
                    </h2>
                    <p className="text-white/60">{t.knowledgeGraph}</p>
                </div>
                <button
                    onClick={handleAddNode}
                    className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-full text-white text-sm font-medium flex items-center gap-2 transition-colors active:scale-95"
                >
                    <Plus size={16} /> {t.addNode}
                </button>
            </div>

            <GlassCard className="flex-1 w-full overflow-hidden relative" variant="thick">
                {graphData.nodes.length === 0 ? (
                    <div className="w-full h-full flex flex-col items-center justify-center text-white/30">
                        <Sparkles size={48} className="mb-4 opacity-50" />
                        <h3 className="text-lg font-semibold text-white/50 mb-2">Empty Canvas</h3>
                        <p className="text-sm max-w-xs text-center mb-6">Start building your second brain by connecting your first idea.</p>
                        <button onClick={handleAddNode} className="px-6 py-2 bg-white/10 hover:bg-white/20 rounded-full text-white border border-white/20 transition-colors">
                            Create First Idea
                        </button>
                    </div>
                ) : (
                    <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing">
                        <svg ref={svgRef} className="w-full h-full"></svg>
                    </div>
                )}
            </GlassCard>

            {/* Modal Components (Add/Edit) */}
            <AnimatePresence>
                {isModalOpen && (
                    <motion.div
                        className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsModalOpen(false)}
                    >
                        <GlassCard 
                            className="w-full max-w-md p-6 max-h-[85vh] flex flex-col shadow-2xl border-white/20" 
                            variant="thick"
                            onClick={(e: React.MouseEvent) => e.stopPropagation()} 
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold text-white">
                                    {editingNode ? t.editNode : t.addNode}
                                </h3>
                                <button onClick={() => setIsModalOpen(false)} className="p-1 hover:bg-white/10 rounded-full transition-colors">
                                    <X className="text-white/50 hover:text-white" />
                                </button>
                            </div>

                            <div className="space-y-5 overflow-y-auto no-scrollbar flex-1 pr-1">
                                {/* Name Input */}
                                <div>
                                    <label className="text-xs text-white/50 uppercase mb-2 block font-semibold">{t.nodeName}</label>
                                    <input
                                        type="text"
                                        value={label}
                                        onChange={(e) => setLabel(e.target.value)}
                                        className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-white placeholder-white/30 focus:outline-none focus:border-pink-500/50 focus:bg-black/40 transition-all"
                                        placeholder="e.g. Artificial Intelligence"
                                        autoFocus
                                    />
                                </div>

                                {/* Category Selection */}
                                <div>
                                    <label className="text-xs text-white/50 uppercase mb-2 block font-semibold">{t.nodeCategory}</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {[1, 2, 3].map((catId) => (
                                            <button
                                                key={catId}
                                                onClick={() => setGroup(catId)}
                                                className={`py-2 px-1 rounded-lg border text-center text-xs font-medium transition-all ${group === catId
                                                        ? catId === 1 ? 'bg-pink-500 text-white border-pink-600 shadow-lg shadow-pink-500/20'
                                                            : catId === 2 ? 'bg-sky-500 text-white border-sky-600 shadow-lg shadow-sky-500/20'
                                                                : 'bg-purple-500 text-white border-purple-600 shadow-lg shadow-purple-500/20'
                                                        : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
                                                    }`}
                                            >
                                                {t.categories[catId as 1 | 2 | 3] || `Type ${catId}`}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Connections Logic */}
                                <div>
                                    <label className="text-xs text-white/50 uppercase mb-2 block font-semibold">{t.nodeConnections}</label>
                                    <div className="max-h-48 overflow-y-auto rounded-xl border border-white/10 bg-black/20 p-2 space-y-1 custom-scrollbar">
                                        {graphData.nodes
                                            .filter(n => editingNode ? n.id !== editingNode.id : true)
                                            .map(node => (
                                                <button
                                                    key={node.id}
                                                    onClick={() => toggleConnection(node.id)}
                                                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs transition-colors ${connections.includes(node.id)
                                                            ? 'bg-white/20 text-white border border-white/10'
                                                            : 'text-white/50 hover:bg-white/5 border border-transparent'
                                                        }`}
                                                >
                                                    <span className="truncate max-w-[80%]">{node.label}</span>
                                                    {connections.includes(node.id) && <Share2 size={12} className="text-green-400" />}
                                                </button>
                                            ))}
                                        {graphData.nodes.length <= (editingNode ? 1 : 0) && (
                                            <div className="text-center text-white/30 text-xs py-8 italic">
                                                Add more nodes to create connections
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-3 mt-6 pt-4 border-t border-white/10">
                                {editingNode && (
                                    <button
                                        onClick={deleteNode}
                                        className="p-3 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/10 transition-colors"
                                        title="Delete Node"
                                    >
                                        <Trash2 size={20} />
                                    </button>
                                )}
                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 py-3 rounded-xl bg-white/5 text-white hover:bg-white/10 border border-white/5 transition-colors font-medium"
                                >
                                    {t.cancel}
                                </button>
                                <button
                                    onClick={saveNode}
                                    className="flex-1 py-3 rounded-xl bg-white text-black font-bold hover:bg-gray-200 transition-colors shadow-lg shadow-white/10"
                                >
                                    {t.save}
                                </button>
                            </div>
                        </GlassCard>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default KnowledgeGraph;