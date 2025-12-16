import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { AnimatePresence, motion } from 'framer-motion';
import { Plus, X, Trash2, Share2, Network, Sparkles } from 'lucide-react';
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
  
  // UI State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNode, setEditingNode] = useState<Insight | null>(null);
  
  // Form State
  const [label, setLabel] = useState('');
  const [group, setGroup] = useState(1);
  const [connections, setConnections] = useState<string[]>([]);

  // D3 Rendering Logic
  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;
    
    // Clear previous
    d3.select(svgRef.current).selectAll("*").remove();

    // Initial Dimensions
    let width = containerRef.current.clientWidth;
    let height = containerRef.current.clientHeight;
    const margin = 20;

    const svg = d3.select(svgRef.current)
        .attr("viewBox", [0, 0, width, height] as any)
        .style("max-width", "100%")
        .style("height", "auto");

    // Deep copy data for D3 to mutate without affecting React state directly immediately
    const nodes = graphData.nodes.map(d => ({ ...d }));
    const links = graphData.links.map(d => ({ ...d }));

    // Define Simulation
    const simulation = d3.forceSimulation(nodes as any)
        .force("link", d3.forceLink(links).id((d: any) => d.id).distance(100))
        .force("charge", d3.forceManyBody().strength(-200)) // Reduced repulsion for better stability
        .force("collide", d3.forceCollide().radius((d: any) => Math.sqrt(d.val) * 5 + 15)) // Prevent overlap
        .force("center", d3.forceCenter(width / 2, height / 2));
    
    // --- Responsive Handling ---
    const updateDimensions = () => {
        if (!containerRef.current) return;
        width = containerRef.current.clientWidth;
        height = containerRef.current.clientHeight;
        
        svg.attr("viewBox", [0, 0, width, height] as any);
        simulation.force("center", d3.forceCenter(width / 2, height / 2));
        simulation.alpha(0.3).restart();
    };

    const resizeObserver = new ResizeObserver(updateDimensions);
    resizeObserver.observe(containerRef.current);
    // ---------------------------

    const link = svg.append("g")
        .attr("stroke", "rgba(255,255,255,0.2)")
        .attr("stroke-opacity", 0.6)
        .selectAll("line")
        .data(links)
        .join("line")
        .attr("stroke-width", 1.5);

    const node = svg.append("g")
        .attr("stroke", "#fff")
        .attr("stroke-width", 1.5)
        .selectAll("g")
        .data(nodes)
        .join("g")
        .call(drag(simulation) as any)
        .on("click", (event, d: any) => {
            // Find original node data
            const originalNode = graphData.nodes.find(n => n.id === d.id);
            if (originalNode) handleEditNode(originalNode);
        });

    node.append("circle")
        .attr("r", (d: any) => Math.sqrt(d.val) * 5)
        .attr("fill", (d: any) => d.group === 1 ? "#ec4899" : d.group === 2 ? "#38bdf8" : "#a855f7")
        .attr("fill-opacity", 0.7)
        .attr("cursor", "pointer");

    node.append("text")
        .text((d: any) => d.label)
        .attr("font-size", "12px")
        .attr("fill", "rgba(255,255,255,0.9)")
        .attr("dx", 15)
        .attr("dy", 4)
        .style("pointer-events", "none")
        .style("text-shadow", "0 2px 4px rgba(0,0,0,0.8)"); // Improved readability

    simulation.on("tick", () => {
        const radius = margin;

        link
            .attr("x1", (d: any) => d.source.x = Math.max(radius, Math.min(width - radius, d.source.x)))
            .attr("y1", (d: any) => d.source.y = Math.max(radius, Math.min(height - radius, d.source.y)))
            .attr("x2", (d: any) => d.target.x = Math.max(radius, Math.min(width - radius, d.target.x)))
            .attr("y2", (d: any) => d.target.y = Math.max(radius, Math.min(height - radius, d.target.y)));

        node.attr("transform", (d: any) => {
             // Bounding Box Constraint
             d.x = Math.max(radius, Math.min(width - radius, d.x));
             d.y = Math.max(radius, Math.min(height - radius, d.y));
             return `translate(${d.x},${d.y})`;
        });
    });

    function drag(simulation: d3.Simulation<any, undefined>) {
        function dragstarted(event: any) {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            event.subject.fx = event.subject.x;
            event.subject.fy = event.subject.y;
        }

        function dragged(event: any) {
            // Strictly clamp drag coordinates
            event.subject.fx = Math.max(margin, Math.min(width - margin, event.x));
            event.subject.fy = Math.max(margin, Math.min(height - margin, event.y));
        }

        function dragended(event: any) {
            if (!event.active) simulation.alphaTarget(0);
            event.subject.fx = null;
            event.subject.fy = null;
        }

        return d3.drag()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended);
    }

    return () => {
        simulation.stop();
        resizeObserver.disconnect();
    };
  }, [graphData]); // Re-run when data changes

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
      
      // Find existing connections
      const connectedIds = graphData.links
          .filter(l => (l.source as any) === node.id || (l.target as any) === node.id || l.source === node.id || l.target === node.id)
          .map(l => {
             const s = (l.source as any).id || l.source;
             const t = (l.target as any).id || l.target;
             return s === node.id ? t : s;
          });
          
      setConnections(connectedIds);
      setIsModalOpen(true);
  };

  const saveNode = () => {
      if (!label.trim()) return;
      
      let nodeId = editingNode ? editingNode.id : label.replace(/\s+/g, '-').toLowerCase() + '-' + Date.now();
      
      const newNode: Insight = {
          id: nodeId,
          label: label,
          group: group,
          val: 10 + (connections.length * 2) // Dynamic size based on importance
      };

      onSaveNode(newNode, connections);
      setIsModalOpen(false);
  };

  const deleteNode = () => {
      if (!editingNode) return;
      onDeleteNode(editingNode.id);
      setIsModalOpen(false);
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
             className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-full text-white text-sm font-medium flex items-center gap-2 transition-colors"
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

       {/* Edit/Add Modal */}
       <AnimatePresence>
          {isModalOpen && (
              <motion.div 
                className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                  <GlassCard className="w-full max-w-md p-6 max-h-[80vh] flex flex-col" variant="thick">
                      <div className="flex justify-between items-center mb-6">
                          <h3 className="text-xl font-bold text-white">
                              {editingNode ? t.editNode : t.addNode}
                          </h3>
                          <button onClick={() => setIsModalOpen(false)}><X className="text-white/50 hover:text-white" /></button>
                      </div>

                      <div className="space-y-5 overflow-y-auto no-scrollbar flex-1 pr-1">
                          {/* Name */}
                          <div>
                              <label className="text-xs text-white/50 uppercase mb-2 block">{t.nodeName}</label>
                              <input 
                                type="text" 
                                value={label}
                                onChange={(e) => setLabel(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white placeholder-white/30 focus:outline-none focus:border-pink-400 transition-colors"
                                autoFocus
                              />
                          </div>

                          {/* Category */}
                          <div>
                              <label className="text-xs text-white/50 uppercase mb-2 block">{t.nodeCategory}</label>
                              <div className="flex flex-col gap-2">
                                  {[1, 2, 3].map((catId) => (
                                      <button
                                        key={catId}
                                        onClick={() => setGroup(catId)}
                                        className={`w-full p-3 rounded-xl border text-left text-sm transition-all ${
                                            group === catId 
                                            ? catId === 1 ? 'bg-pink-500/20 border-pink-400 text-white' 
                                              : catId === 2 ? 'bg-sky-500/20 border-sky-400 text-white'
                                              : 'bg-purple-500/20 border-purple-400 text-white'
                                            : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
                                        }`}
                                      >
                                          {t.categories[catId as 1|2|3]}
                                      </button>
                                  ))}
                              </div>
                          </div>

                          {/* Connections */}
                          <div>
                              <label className="text-xs text-white/50 uppercase mb-2 block">{t.nodeConnections}</label>
                              <div className="max-h-40 overflow-y-auto rounded-xl border border-white/10 bg-white/5 p-2 space-y-1">
                                  {graphData.nodes
                                    .filter(n => editingNode ? n.id !== editingNode.id : true)
                                    .map(node => (
                                      <button
                                        key={node.id}
                                        onClick={() => toggleConnection(node.id)}
                                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors ${
                                            connections.includes(node.id) 
                                            ? 'bg-white/20 text-white' 
                                            : 'text-white/50 hover:bg-white/10'
                                        }`}
                                      >
                                          <span>{node.label}</span>
                                          {connections.includes(node.id) && <Share2 size={12} />}
                                      </button>
                                  ))}
                                  {graphData.nodes.length <= (editingNode ? 1 : 0) && (
                                      <div className="text-center text-white/30 text-xs py-4">No other nodes to connect</div>
                                  )}
                              </div>
                          </div>
                      </div>

                      <div className="flex gap-3 mt-6 pt-4 border-t border-white/10">
                              {editingNode && (
                                  <button 
                                    onClick={deleteNode}
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
                                onClick={saveNode}
                                className="flex-1 py-3 rounded-xl bg-white text-black font-semibold hover:bg-gray-200 transition-colors"
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