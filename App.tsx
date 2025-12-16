import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Globe, LogOut } from 'lucide-react';
import { supabase } from './lib/supabase';
import * as api from './services/supabaseService';
import Auth from './components/Auth';
import AuroraBackground from './components/AuroraBackground';
import Dashboard from './components/Dashboard';
import Dock from './components/Dock';
import FocusTimer from './components/FocusTimer';
import KnowledgeGraph from './components/KnowledgeGraph';
import FreelanceBoard from './components/FreelanceBoard';
import UniversityDashboard from './components/UniversityDashboard';
import FinanceDashboard from './components/FinanceDashboard';
import { AppView, Language, Task, GraphData, Course, Assignment, Insight } from './types';
import { MOCK_TASKS, GRAPH_DATA, MOCK_COURSES, MOCK_ASSIGNMENTS } from './constants';

const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [currentView, setCurrentView] = useState<AppView>(AppView.DASHBOARD);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [language, setLanguage] = useState<Language>('en');

  // --- Data State ---
  const [tasks, setTasks] = useState<Task[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [graphData, setGraphData] = useState<GraphData>({ nodes: [], links: [] });
  const [sessionCount, setSessionCount] = useState<number>(0);

  // --- Auth & Initial Fetch ---
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session) {
      loadData();
    }
  }, [session]);

  const loadData = async () => {
    try {
      // Fetch parallel
      const [t, c, a, g] = await Promise.all([
        api.fetchTasks(),
        api.fetchCourses(),
        api.fetchAssignments(),
        api.fetchGraph()
      ]);
      setTasks(t);
      setCourses(c);
      setAssignments(a);
      setGraphData(g);
    } catch (e) {
      console.error("Error loading data:", e);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  // --- Optimistic Handlers ---

  // Tasks
  const handleSaveTask = async (task: Task) => {
    // Optimistic Update
    setTasks(prev => {
      const exists = prev.find(t => t.id === task.id);
      if (exists) return prev.map(t => t.id === task.id ? task : t);
      return [task, ...prev];
    });
    // DB Save
    const { data, error } = await api.saveTask(task);
    if (data && !error) {
      // Replace temp ID with real DB ID if needed
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, id: data.id } : t));
    }
  };

  const handleDeleteTask = async (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
    await api.deleteTask(id);
  };

  // Courses
  const handleSaveCourse = async (course: Course) => {
    setCourses(prev => {
      const exists = prev.find(c => c.id === course.id);
      if (exists) return prev.map(c => c.id === course.id ? course : c);
      return [...prev, course];
    });
    await api.saveCourse(course);
    loadData(); // Reload to get IDs correctly for simplicity
  };

  const handleDeleteCourse = async (id: string) => {
    setCourses(prev => prev.filter(c => c.id !== id));
    await api.deleteCourse(id);
  };

  // Assignments
  const handleSaveAssignment = async (assign: Assignment) => {
    setAssignments(prev => {
      const exists = prev.find(a => a.id === assign.id);
      if (exists) return prev.map(a => a.id === assign.id ? assign : a);
      return [...prev, assign];
    });
    await api.saveAssignment(assign);
  };

  const handleDeleteAssignment = async (id: string) => {
    setAssignments(prev => prev.filter(a => a.id !== id));
    await api.deleteAssignment(id);
  };

  // Graph
  const handleSaveNode = async (node: Insight, connectedIds: string[]) => {
    const newNodeId = await api.saveNode(node, connectedIds);
    // Simple reload for graph to ensure links are synced
    const g = await api.fetchGraph();
    setGraphData(g);
  };

  const handleDeleteNode = async (id: string) => {
    setGraphData(prev => ({
      nodes: prev.nodes.filter(n => n.id !== id),
      links: prev.links.filter(l => l.source !== id && l.target !== id)
    }));
    await api.deleteNode(id);
  };


  useEffect(() => {
    if (currentView === AppView.FOCUS) {
      setIsFocusMode(true);
    }
  }, [currentView]);

  useEffect(() => {
    document.documentElement.dir = language === 'fa' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language]);

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'en' ? 'fa' : 'en');
  };

  const handleSessionComplete = () => {
    setSessionCount(prev => prev + 1);
  };

  const commonProps = { lang: language };

  const renderView = () => {
    switch (currentView) {
      case AppView.DASHBOARD:
        return <Dashboard
          onEnterFocus={() => setIsFocusMode(true)}
          tasks={tasks}
          courses={courses}
          assignments={assignments}
          {...commonProps}
        />;
      case AppView.FOCUS:
        return <Dashboard
          onEnterFocus={() => setIsFocusMode(true)}
          tasks={tasks}
          courses={courses}
          assignments={assignments}
          {...commonProps}
        />;
      case AppView.BRAIN:
        return <KnowledgeGraph
          graphData={graphData}
          onSaveNode={handleSaveNode}
          onDeleteNode={handleDeleteNode}
          {...commonProps}
        />;
      case AppView.FREELANCE:
        return <FreelanceBoard
          tasks={tasks}
          onSaveTask={handleSaveTask}
          onDeleteTask={handleDeleteTask}
          {...commonProps}
        />;
      case AppView.UNIVERSITY:
        return <UniversityDashboard
          courses={courses}
          assignments={assignments}
          onSaveCourse={handleSaveCourse}
          onDeleteCourse={handleDeleteCourse}
          onSaveAssignment={handleSaveAssignment}
          onDeleteAssignment={handleDeleteAssignment}
          {...commonProps}
        />;
      case AppView.FINANCE:
        return <FinanceDashboard tasks={tasks} {...commonProps} />;
      default:
        return <Dashboard
          onEnterFocus={() => setIsFocusMode(true)}
          tasks={tasks}
          courses={courses}
          assignments={assignments}
          {...commonProps}
        />;
    }
  };

  const handleFocusExit = () => {
    setIsFocusMode(false);
    if (currentView === AppView.FOCUS) {
      setCurrentView(AppView.DASHBOARD);
    }
  };

  if (loading) return <div className="w-screen h-screen bg-black flex items-center justify-center text-white">Loading Nexus OS...</div>;

  return (
    <div className={`relative w-screen h-dvh overflow-hidden text-white selection:bg-pink-500/30 ${language === 'fa' ? 'font-persian' : 'font-sans'}`}>
      <AuroraBackground />

      {!session ? (
        <Auth />
      ) : (
        <>
          <main className="relative z-10 w-full h-full pt-4 pb-24 px-4 md:px-0 max-w-7xl mx-auto">
            {/* Language Switcher & Logout */}
            {!isFocusMode && (
              <div className="absolute top-6 right-6 z-50 rtl:right-auto rtl:left-6 flex gap-2">
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/10 hover:bg-red-500/20 backdrop-blur-md border border-red-500/20 transition-colors text-xs font-medium text-red-200"
                >
                  <LogOut size={14} />
                </button>
                <button
                  onClick={toggleLanguage}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 transition-colors text-xs font-medium"
                >
                  <Globe size={14} />
                  {language === 'en' ? 'FA' : 'EN'}
                </button>
              </div>
            )}

            <AnimatePresence mode="wait">
              <motion.div
                key={`${currentView}-${language}`}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.02 }}
                transition={{ duration: 0.3 }}
                className="w-full h-full"
              >
                {renderView()}
              </motion.div>
            </AnimatePresence>
          </main>

          {/* Navigation Dock */}
          {!isFocusMode && (
            <Dock currentView={currentView} setView={setCurrentView} lang={language} />
          )}

          {/* Focus Mode Overlay */}
          <AnimatePresence>
            {isFocusMode && (
              <FocusTimer
                exitFocus={handleFocusExit}
                lang={language}
                sessionCount={sessionCount}
                onSessionComplete={handleSessionComplete}
              />
            )}
          </AnimatePresence>
        </>
      )}
    </div>
  );
};

export default App;