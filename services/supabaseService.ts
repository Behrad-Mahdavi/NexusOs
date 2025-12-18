import { supabase } from '../lib/supabase';
import { Task, Course, Assignment, GraphData, Insight, Link, TaskContext, TaskStatus } from '../types';

// --- Tasks ---

export const fetchTasks = async (): Promise<Task[]> => {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  if (!data) return [];

  // Map DB columns to App types
  return data.map((t: any) => ({
    id: t.id,
    title: t.title,
    context: t.context as TaskContext,
    status: t.status as TaskStatus,
    energyCost: t.energy_cost,
    dueDate: t.due_date ? t.due_date.split('T')[0] : '',
    completedAt: t.completed_at,
    tags: [], // Tags can be added to DB later if needed
    revenue: t.revenue || 0,
    // Reading Fields
    type: t.type || 'standard',
    totalPages: t.total_pages,
    currentPage: t.current_page
  }));
};

export const saveTask = async (task: Task) => {
  const payload = {
    title: task.title,
    context: task.context,
    status: task.status,
    energy_cost: task.energyCost,
    due_date: task.dueDate ? new Date(task.dueDate).toISOString() : null,
    completed_at: task.completedAt ? new Date(task.completedAt).toISOString() : null,
    revenue: task.revenue,
    // Reading Fields
    type: task.type || 'standard',
    total_pages: task.totalPages,
    current_page: task.currentPage
  };

  if (task.id.length > 30) {
    // Assume long UUIDs are existing DB records, simple timestamp IDs are local/new
    // However, we should handle upsert based on ID. 
    // If ID is numeric timestamp (from old local code), let Supabase gen a new UUID.
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(task.id);

    if (isUUID) {
      return await supabase.from('tasks').update(payload).eq('id', task.id).select().single();
    }
  }

  // Create new
  return await supabase.from('tasks').insert(payload).select().single();
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
    dayOfWeek: c.schedule ? c.schedule.day : 0, // Simplified mapping
    startTime: c.schedule ? c.schedule.start : '00:00',
    endTime: c.schedule ? c.schedule.end : '00:00',
    color: c.color_theme || 'blue',
    location: c.location || ''
  }));
};

export const saveCourse = async (course: Course) => {
  const payload = {
    name: course.name,
    professor_name: course.professor,
    color_theme: course.color,
    schedule: { day: course.dayOfWeek, start: course.startTime, end: course.endTime }, // Store as JSONB
    code: course.code,
    location: course.location
  };

  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(course.id);
  if (isUUID) {
    return await supabase.from('courses').update(payload).eq('id', course.id).select().single();
  }
  return await supabase.from('courses').insert(payload).select().single();
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
  const payload = {
    course_id: assign.courseId,
    title: assign.title,
    type: assign.type,
    due_date: assign.dueDate ? new Date(assign.dueDate).toISOString() : null,
    is_completed: assign.isCompleted
  };

  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(assign.id);
  if (isUUID) {
    return await supabase.from('assignments').update(payload).eq('id', assign.id).select().single();
  }
  return await supabase.from('assignments').insert(payload).select().single();
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
  // 1. Upsert Node
  const nodePayload = {
    label: node.label,
    group_id: node.group,
    val: node.val
  };

  let nodeId = node.id;
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(node.id);

  if (isUUID) {
    await supabase.from('nodes').update(nodePayload).eq('id', nodeId);
  } else {
    const { data } = await supabase.from('nodes').insert(nodePayload).select().single();
    if (data) nodeId = data.id;
  }

  // 2. Manage Links (Simple strategy: delete all for this node and recreate)
  // Find links where this node is source or target
  // Note: RLS allows this.

  // Deleting complex links via ID logic is harder without knowing Link IDs.
  // For this implementation, we will fetch existing links, compare, and add/remove.
  // A simpler approach for the prototype: 
  // Just insert new links that don't exist.

  // Let's implement a clean "Sync Links" manually in UI or just add new ones.
  // For this specific func, let's just insert the new connections provided in connectedIds.

  const newLinks = connectedIds.map(targetId => ({
    source: nodeId,
    target: targetId
  }));

  if (newLinks.length > 0) {
    await supabase.from('links').insert(newLinks);
  }

  return nodeId;
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
}

export const saveFocusSession = async (session: Omit<FocusSession, 'id'>) => {
  return await supabase.from('focus_sessions').insert(session).select().single();
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
  if (error) throw error;
  return data || [];
};

// --- Reading Tracker ---

export const saveReadingSession = async (taskId: string, pagesRead: number) => {
  return await supabase.from('reading_sessions').insert({
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