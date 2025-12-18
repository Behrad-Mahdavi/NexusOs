import { supabase } from '../lib/supabase';
import { Task, Course, Assignment, GraphData, Insight, Link, TaskContext, TaskStatus } from '../types';

// --- Helper: Get Current User ---
const getCurrentUserId = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("User not authenticated");
  return user.id;
};

// --- Tasks ---

export const fetchTasks = async (): Promise<Task[]> => {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  if (!data) return [];

  return data.map((t: any) => ({
    id: t.id,
    title: t.title,
    context: t.context as TaskContext,
    status: t.status as TaskStatus,
    energyCost: t.energy_cost,
    dueDate: t.due_date ? t.due_date.split('T')[0] : '',
    completedAt: t.completed_at,
    tags: [],
    revenue: t.revenue || 0,
    type: t.type || 'standard',
    totalPages: t.total_pages,
    currentPage: t.current_page
  }));
};

// *** اصلاح شده ***
export const saveTask = async (task: Task) => {
  const userId = await getCurrentUserId();
  
  // ۱. آیدی را حتما در پیلود قرار می‌دهیم
  const payload = {
    id: task.id, // <--- بسیار مهم برای Upsert
    user_id: userId,
    title: task.title,
    context: task.context,
    status: task.status,
    energy_cost: task.energyCost,
    due_date: task.dueDate ? new Date(task.dueDate).toISOString() : null,
    completed_at: task.completedAt ? new Date(task.completedAt).toISOString() : null,
    revenue: task.revenue,
    type: task.type || 'standard',
    total_pages: task.totalPages,
    current_page: task.currentPage
  };

  // ۲. استفاده از upsert به جای منطق شرطی insert/update
  // این متد خودش می‌فهمد اگر ID جدید است بسازد، اگر هست آپدیت کند.
  const { data, error } = await supabase
    .from('tasks')
    .upsert(payload) 
    .select()
    .single();

  if (error) {
    console.error("Save Task Error:", error);
    throw error;
  }

  return data;
};

export const deleteTask = async (id: string) => {
  return await supabase.from('tasks').delete().eq('id', id);
};

// --- Courses & Assignments ---

export const fetchCourses = async (): Promise<Course[]> => {
  const { data, error } = await supabase.from('courses').select('*');
  if (error) throw error;
  return data.map((c: any) => ({
    id: c.id,
    name: c.name,
    code: c.code || '',
    professor: c.professor_name || '',
    dayOfWeek: c.schedule ? c.schedule.day : 0,
    startTime: c.schedule ? c.schedule.start : '00:00',
    endTime: c.schedule ? c.schedule.end : '00:00',
    color: c.color_theme || 'blue',
    location: c.location || ''
  }));
};

export const saveCourse = async (course: Course) => {
  const userId = await getCurrentUserId();

  const payload = {
    id: course.id, // اضافه شده برای upsert
    user_id: userId,
    name: course.name,
    professor_name: course.professor,
    color_theme: course.color,
    schedule: { day: course.dayOfWeek, start: course.startTime, end: course.endTime },
    code: course.code,
    location: course.location
  };

  // اینجا هم upsert بهتر است
  return await supabase.from('courses').upsert(payload).select().single();
};

export const deleteCourse = async (id: string) => {
  return await supabase.from('courses').delete().eq('id', id);
};

export const fetchAssignments = async (): Promise<Assignment[]> => {
  const { data, error } = await supabase.from('assignments').select('*');
  if (error) throw error;
  return data.map((a: any) => ({
    id: a.id,
    courseId: a.course_id,
    title: a.title,
    type: a.type,
    dueDate: a.due_date ? a.due_date.split('T')[0] : '',
    isCompleted: a.is_completed
  }));
};

export const saveAssignment = async (assign: Assignment) => {
  const userId = await getCurrentUserId();

  const payload = {
    id: assign.id, // اضافه شده برای upsert
    user_id: userId, 
    course_id: assign.courseId,
    title: assign.title,
    type: assign.type,
    due_date: assign.dueDate ? new Date(assign.dueDate).toISOString() : null,
    is_completed: assign.isCompleted
  };

  return await supabase.from('assignments').upsert(payload).select().single();
};

export const deleteAssignment = async (id: string) => {
  return await supabase.from('assignments').delete().eq('id', id);
};

// --- Graph ---

export const fetchGraph = async (): Promise<GraphData> => {
  const [nodesResult, linksResult] = await Promise.all([
    supabase.from('nodes').select('*'),
    supabase.from('links').select('*')
  ]);

  if (nodesResult.error) throw nodesResult.error;
  if (linksResult.error) throw linksResult.error;

  const nodes: Insight[] = nodesResult.data.map((n: any) => ({
    id: n.id,
    label: n.label,
    group: n.group_id,
    val: n.val
  }));

  const links: Link[] = linksResult.data.map((l: any) => ({
    source: l.source,
    target: l.target
  }));

  return { nodes, links };
};

export const saveNode = async (node: Insight, connectedIds: string[]) => {
  const userId = await getCurrentUserId();
  
  const nodePayload = {
    id: node.id, // اضافه شده برای upsert
    user_id: userId,
    label: node.label,
    group_id: node.group,
    val: node.val
  };

  // Upsert Node
  await supabase.from('nodes').upsert(nodePayload);

  // Links handling
  // برای لینک‌ها کمی پیچیده‌تر است چون ID نداریم، اما استراتژی فعلی (Insert) کار می‌کند
  // به شرطی که تکراری نسازیم. برای سادگی فعلاً همان اینسرت باقی می‌ماند
  const newLinks = connectedIds.map(targetId => ({
    user_id: userId, // یادت نرود ستون user_id را در دیتابیس برای links اضافه کرده باشی
    source: node.id,
    target: targetId
  }));

  if (newLinks.length > 0) {
    await supabase.from('links').insert(newLinks);
  }

  return node.id;
};

export const deleteNode = async (id: string) => {
  return await supabase.from('nodes').delete().eq('id', id);
};

// --- Focus Sessions ---

export interface FocusSession {
  id?: string;
  started_at: string;
  ended_at?: string;
  duration_minutes: number;
  completed: boolean;
  user_id?: string; 
}

export const saveFocusSession = async (session: Omit<FocusSession, 'id'>) => {
  const userId = await getCurrentUserId();
  const payload = { ...session, user_id: userId };

  const { data, error } = await supabase
    .from('focus_sessions')
    .insert(payload)
    .select()
    .single();

  if (error) {
    console.error("Supabase Save Error:", error);
    throw error;
  }
  return data;
};

export const fetchFocusSessions = async (days: number = 30): Promise<FocusSession[]> => {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const { data, error } = await supabase
    .from('focus_sessions')
    .select('*')
    .gte('started_at', since.toISOString())
    .order('started_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

// --- Reading Tracker ---

export const saveReadingSession = async (taskId: string, pagesRead: number) => {
  const userId = await getCurrentUserId();
  
  return await supabase.from('reading_sessions').insert({
    user_id: userId, 
    task_id: taskId,
    pages_read: pagesRead
  });
};

export const fetchTodayReadingSessions = async (): Promise<{ task_id: string; pages_read: number }[]> => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { data, error } = await supabase
    .from('reading_sessions')
    .select('task_id, pages_read')
    .gte('session_date', today.toISOString());

  if (error || !data) return [];
  return data;
};