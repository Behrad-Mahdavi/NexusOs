import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Calendar, Clock, MapPin, AlertCircle, CheckCircle2, BookOpen, X, Trash2 } from 'lucide-react';
import GlassCard from './GlassCard';
import { Language, Course, Assignment } from '../types';
import { getTranslation } from '../translations';

interface UniversityDashboardProps {
  lang: Language;
  courses: Course[];
  assignments: Assignment[];
  onSaveCourse: (c: Course) => void;
  onDeleteCourse: (id: string) => void;
  onSaveAssignment: (a: Assignment) => void;
  onDeleteAssignment: (id: string) => void;
}

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
  const currentDay = new Date().getDay(); // 0-6
  const todaysClasses = courses.filter(c => c.dayOfWeek === currentDay).sort((a, b) => a.startTime.localeCompare(b.startTime));

  const getDaysUntil = (dateStr: string) => {
    const diff = new Date(dateStr).getTime() - new Date().getTime();
    return Math.ceil(diff / (1000 * 3600 * 24));
  };

  const upcomingAssignments = assignments
    .filter(a => !a.isCompleted)
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

  const getColorClass = (color: string) => {
    const map: any = {
      blue: 'bg-blue-500/20 border-blue-400/30 text-blue-100',
      purple: 'bg-purple-500/20 border-purple-400/30 text-purple-100',
      pink: 'bg-pink-500/20 border-pink-400/30 text-pink-100',
      orange: 'bg-orange-500/20 border-orange-400/30 text-orange-100',
      green: 'bg-green-500/20 border-green-400/30 text-green-100',
    };
    return map[color] || map.blue;
  };

  const handleAddCourse = () => {
    if(!courseForm.name || !courseForm.code) return;
    const newCourse: Course = {
        id: Date.now().toString(),
        name: courseForm.name || '',
        code: courseForm.code || '',
        professor: courseForm.professor || '',
        dayOfWeek: courseForm.dayOfWeek as any,
        startTime: courseForm.startTime || '08:00',
        endTime: courseForm.endTime || '10:00',
        color: courseForm.color as any || 'blue',
        location: courseForm.location || ''
    };
    onSaveCourse(newCourse);
    setIsCourseModalOpen(false);
    setCourseForm({ color: 'purple', dayOfWeek: 0 });
  };

  const handleAddAssignment = () => {
      if(!assignmentForm.title || !assignmentForm.courseId) return;
      const newAssignment: Assignment = {
          id: Date.now().toString(),
          courseId: assignmentForm.courseId,
          title: assignmentForm.title,
          dueDate: assignmentForm.dueDate || new Date().toISOString().split('T')[0],
          type: assignmentForm.type as any,
          isCompleted: false
      };
      onSaveAssignment(newAssignment);
      setIsAssignmentModalOpen(false);
      setAssignmentForm({ type: 'homework' });
  };

  const toggleAssignment = (assignment: Assignment) => {
      onSaveAssignment({ ...assignment, isCompleted: !assignment.isCompleted });
  };

  return (
    <div className="p-6 h-full flex flex-col overflow-y-auto no-scrollbar pb-32">
      
      {/* Header */}
      <div className="flex justify-between items-end mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <BookOpen className="text-orange-400" />
            {t.academicHub}
          </h2>
          <p className="text-white/60 text-sm">{t.todaysSchedule}: {t.weekDays[currentDay]}</p>
        </div>
      </div>

      {/* Today's Schedule (Horizontal Scroll) */}
      <div className="mb-8">
        <h3 className="text-white/50 text-xs uppercase font-bold tracking-wider mb-3">{t.todaysSchedule}</h3>
        {todaysClasses.length > 0 ? (
          <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
            {todaysClasses.map(course => (
              <GlassCard key={course.id} className={`min-w-[200px] p-4 flex-shrink-0 ${getColorClass(course.color)} !bg-opacity-10`}>
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
          <GlassCard className="p-6 text-center text-white/40">
              {t.noClasses}
          </GlassCard>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Course List */}
          <div className="flex flex-col h-full">
               <div className="flex justify-between items-center mb-3">
                   <h3 className="text-white/50 text-xs uppercase font-bold tracking-wider">{t.myCourses}</h3>
                   <button onClick={() => setIsCourseModalOpen(true)} className="text-white/50 hover:text-white"><Plus size={16}/></button>
               </div>
               <div className="grid grid-cols-1 gap-3">
                   {courses.map(course => (
                       <GlassCard key={course.id} className="p-3 flex items-center justify-between hover:bg-white/5 transition-colors group">
                           <div className="flex items-center gap-3">
                               <div className={`w-3 h-12 rounded-full ${getColorClass(course.color).split(' ')[0]} bg-opacity-50`}></div>
                               <div>
                                   <div className="font-bold text-white">{course.name}</div>
                                   <div className="text-xs text-white/50">{course.professor} • {t.weekDays[course.dayOfWeek]} {course.startTime}</div>
                               </div>
                           </div>
                           <button 
                             onClick={() => {
                                 setAssignmentForm({ ...assignmentForm, courseId: course.id });
                                 setIsAssignmentModalOpen(true);
                             }}
                             className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-white/50 hover:text-white"
                             title={t.addAssignment}
                           >
                               <Plus size={16} />
                           </button>
                           <button onClick={() => onDeleteCourse(course.id)} className="opacity-0 group-hover:opacity-100 text-red-400 p-2"><Trash2 size={14} /></button>
                       </GlassCard>
                   ))}
                   {courses.length === 0 && <div className="text-white/30 text-sm italic">Add your courses to get started.</div>}
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
                       const isUrgent = daysLeft <= 3;
                       
                       return (
                           <GlassCard key={assign.id} className={`p-3 border-l-4 ${isUrgent ? 'border-l-red-400' : 'border-l-green-400'}`}>
                               <div className="flex items-start gap-3">
                                   <button onClick={() => toggleAssignment(assign)} className="mt-1 text-white/30 hover:text-green-400">
                                       <CheckCircle2 size={20} />
                                   </button>
                                   <div className="flex-1">
                                       <div className="flex justify-between">
                                           <span className="text-xs font-bold text-white/50 uppercase">{assign.type} • {course?.code}</span>
                                           <span className={`text-xs font-bold ${isUrgent ? 'text-red-400' : 'text-green-400'}`}>
                                               {daysLeft < 0 ? t.overdue : `${t.dueIn} ${daysLeft} ${t.days}`}
                                           </span>
                                       </div>
                                       <div className="text-white font-medium">{assign.title}</div>
                                       <div className="text-xs text-white/40 mt-1 flex items-center gap-1">
                                           <Calendar size={10} /> {assign.dueDate}
                                       </div>
                                   </div>
                               </div>
                           </GlassCard>
                       )
                   })}
                   {upcomingAssignments.length === 0 && <div className="text-white/30 text-sm italic">No pending assignments. Great job!</div>}
               </div>
          </div>
      </div>

      {/* Add Course Modal */}
      <AnimatePresence>
          {isCourseModalOpen && (
               <motion.div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
               initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
                   <GlassCard className="w-full max-w-sm p-6" variant="thick">
                       <h3 className="text-xl font-bold text-white mb-4">{t.addCourse}</h3>
                       <div className="space-y-3">
                           <input placeholder={t.courseName} className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-white" value={courseForm.name || ''} onChange={e => setCourseForm({...courseForm, name: e.target.value})} />
                           <input placeholder={t.courseCode} className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-white" value={courseForm.code || ''} onChange={e => setCourseForm({...courseForm, code: e.target.value})} />
                           <input placeholder={t.professor} className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-white" value={courseForm.professor || ''} onChange={e => setCourseForm({...courseForm, professor: e.target.value})} />
                           <input placeholder={t.location} className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-white" value={courseForm.location || ''} onChange={e => setCourseForm({...courseForm, location: e.target.value})} />
                           
                           <div className="grid grid-cols-2 gap-2">
                               <div>
                                   <label className="text-xs text-white/50">{t.day}</label>
                                   <select className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-white" value={courseForm.dayOfWeek} onChange={e => setCourseForm({...courseForm, dayOfWeek: parseInt(e.target.value) as any})}>
                                       {t.weekDays.map((d, i) => <option key={i} value={i} className="text-black">{d}</option>)}
                                   </select>
                               </div>
                               <div>
                                   <label className="text-xs text-white/50">{t.time}</label>
                                   <div className="flex gap-1">
                                       <input type="time" className="w-full bg-white/5 border border-white/10 rounded-lg p-1 text-white text-xs" value={courseForm.startTime || ''} onChange={e => setCourseForm({...courseForm, startTime: e.target.value})} />
                                       <input type="time" className="w-full bg-white/5 border border-white/10 rounded-lg p-1 text-white text-xs" value={courseForm.endTime || ''} onChange={e => setCourseForm({...courseForm, endTime: e.target.value})} />
                                   </div>
                               </div>
                           </div>
                           
                           <div className="flex gap-2">
                               {['blue', 'purple', 'pink', 'orange', 'green'].map(c => (
                                   <button key={c} onClick={() => setCourseForm({...courseForm, color: c as any})} className={`w-6 h-6 rounded-full bg-${c}-500 ${courseForm.color === c ? 'ring-2 ring-white' : ''}`} />
                               ))}
                           </div>
                       </div>
                       <div className="flex gap-2 mt-6">
                           <button onClick={() => setIsCourseModalOpen(false)} className="flex-1 py-2 bg-white/5 rounded-lg text-white">{t.cancel}</button>
                           <button onClick={handleAddCourse} className="flex-1 py-2 bg-white text-black font-bold rounded-lg">{t.save}</button>
                       </div>
                   </GlassCard>
               </motion.div>
          )}
      </AnimatePresence>

      {/* Add Assignment Modal */}
      <AnimatePresence>
          {isAssignmentModalOpen && (
               <motion.div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
               initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
                   <GlassCard className="w-full max-w-sm p-6" variant="thick">
                       <h3 className="text-xl font-bold text-white mb-4">{t.addAssignment}</h3>
                       <div className="space-y-3">
                           <select className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-white" value={assignmentForm.courseId || ''} onChange={e => setAssignmentForm({...assignmentForm, courseId: e.target.value})}>
                               <option value="" disabled className="text-black">Select Course</option>
                               {courses.map(c => <option key={c.id} value={c.id} className="text-black">{c.name}</option>)}
                           </select>
                           <input placeholder={t.assignmentTitle} className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-white" value={assignmentForm.title || ''} onChange={e => setAssignmentForm({...assignmentForm, title: e.target.value})} />
                           
                           <div>
                               <label className="text-xs text-white/50">{t.dueDate}</label>
                               <input type="date" className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-white" value={assignmentForm.dueDate || ''} onChange={e => setAssignmentForm({...assignmentForm, dueDate: e.target.value})} />
                           </div>

                           <div>
                               <label className="text-xs text-white/50">{t.type}</label>
                               <div className="flex gap-2 mt-1">
                                   {(['homework', 'exam', 'project'] as const).map(type => (
                                       <button 
                                        key={type} 
                                        onClick={() => setAssignmentForm({...assignmentForm, type: type})}
                                        className={`flex-1 py-1 rounded text-xs border ${assignmentForm.type === type ? 'bg-white text-black border-white' : 'bg-transparent text-white border-white/20'}`}
                                       >
                                           {t[type]}
                                       </button>
                                   ))}
                               </div>
                           </div>
                       </div>
                       <div className="flex gap-2 mt-6">
                           <button onClick={() => setIsAssignmentModalOpen(false)} className="flex-1 py-2 bg-white/5 rounded-lg text-white">{t.cancel}</button>
                           <button onClick={handleAddAssignment} className="flex-1 py-2 bg-white text-black font-bold rounded-lg">{t.save}</button>
                       </div>
                   </GlassCard>
               </motion.div>
          )}
      </AnimatePresence>

    </div>
  );
};

export default UniversityDashboard;