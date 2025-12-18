export type UUID = string;
export type ISO8601 = string;

export type Language = 'en' | 'fa';

export type TaskContext = 'university' | 'freelance' | 'growth' | 'life';
export type TaskStatus = 'todo' | 'doing' | 'done';
export type TaskType = 'standard' | 'reading';

export interface Task {
  id: UUID;
  title: string;
  context: TaskContext;
  status: TaskStatus;
  energyCost: 1 | 2 | 3;
  dueDate: ISO8601;
  completedAt?: ISO8601; // New field to track income timing
  relatedEntityId?: UUID;
  tags: string[];
  revenue?: number; // Explicit revenue amount
  // Reading Tracker
  type?: TaskType;
  totalPages?: number;
  currentPage?: number;
}

export interface Client {
  id: UUID;
  name: string;
  avatarUrl?: string;
  hourlyRate?: number;
  currency: 'USD' | 'EUR' | 'AED';
}

export interface Invoice {
  id: UUID;
  clientId: UUID;
  amount: number;
  status: 'draft' | 'sent' | 'paid';
  issueDate: ISO8601;
}

export interface Insight {
  id: UUID;
  label: string;
  group: number;
  val: number;
}

export interface Link {
  source: string;
  target: string;
}

export interface GraphData {
  nodes: Insight[];
  links: Link[];
}

// --- University Module ---
export interface Course {
  id: UUID;
  name: string;
  code: string;
  professor: string;
  dayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0=Sunday, 6=Saturday (aligned with JS getDay for simplicity, mapped in UI)
  startTime: string; // "14:00"
  endTime: string; // "16:00"
  color: 'blue' | 'purple' | 'pink' | 'orange' | 'green';
  location?: string;
}

export interface Assignment {
  id: UUID;
  courseId: UUID;
  title: string;
  dueDate: ISO8601;
  type: 'homework' | 'exam' | 'project';
  isCompleted: boolean;
}

export enum AppView {
  DASHBOARD = 'dashboard',
  FOCUS = 'focus',
  BRAIN = 'brain',
  FREELANCE = 'freelance',
  UNIVERSITY = 'university',
  FINANCE = 'finance'
}