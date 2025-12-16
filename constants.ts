import { Task, GraphData, Client, Course, Assignment } from './types';

export const MOCK_TASKS: Task[] = [
  {
    id: '1',
    title: 'Finalize Design System v2',
    context: 'freelance',
    status: 'doing',
    energyCost: 3,
    dueDate: '2023-11-20',
    tags: ['Figma', 'System'],
    revenue: 450
  },
  {
    id: '2',
    title: 'HCI Research Paper',
    context: 'university',
    status: 'todo',
    energyCost: 2,
    dueDate: '2023-11-15',
    tags: ['Research', 'Writing']
  },
  {
    id: '3',
    title: 'Learn Framer Motion',
    context: 'growth',
    status: 'todo',
    energyCost: 1,
    dueDate: '2023-12-01',
    tags: ['Code', 'Animation']
  }
];

export const MOCK_CLIENTS: Client[] = [
  { id: 'c1', name: 'Acme Corp', currency: 'USD', hourlyRate: 80 },
  { id: 'c2', name: 'Stark Ind', currency: 'EUR', hourlyRate: 120 },
];

export const MOCK_COURSES: Course[] = [
  { 
    id: 'u1', name: 'Human Computer Interaction', code: 'CS-401', professor: 'Dr. Naderi', 
    dayOfWeek: 1, startTime: '10:00', endTime: '12:00', color: 'purple', location: 'Room 302' 
  },
  { 
    id: 'u2', name: 'Data Structures', code: 'CS-202', professor: 'Dr. Ahmadi', 
    dayOfWeek: 3, startTime: '14:00', endTime: '16:00', color: 'blue', location: 'Lab 2' 
  },
  { 
    id: 'u3', name: 'Visual Arts History', code: 'ART-105', professor: 'Prof. Sarah', 
    dayOfWeek: 6, startTime: '08:00', endTime: '10:00', color: 'pink', location: 'Hall A' 
  }
];

export const MOCK_ASSIGNMENTS: Assignment[] = [
  { id: 'a1', courseId: 'u1', title: 'Midterm Project Proposal', dueDate: '2023-11-25', type: 'project', isCompleted: false },
  { id: 'a2', courseId: 'u2', title: 'Binary Tree Implementation', dueDate: '2023-11-18', type: 'homework', isCompleted: false },
];

export const GRAPH_DATA: GraphData = {
  nodes: [
    { id: 'Design Systems', label: 'Design Systems', group: 1, val: 20 },
    { id: 'React', label: 'React', group: 2, val: 15 },
    { id: 'Typography', label: 'Typography', group: 1, val: 10 },
    { id: 'Color Theory', label: 'Color Theory', group: 1, val: 10 },
    { id: 'Accessibility', label: 'Accessibility', group: 1, val: 12 },
    { id: 'Framer Motion', label: 'Framer Motion', group: 2, val: 8 },
    { id: 'Tailwind', label: 'Tailwind', group: 2, val: 8 },
    { id: 'UX Research', label: 'UX Research', group: 3, val: 15 },
  ],
  links: [
    { source: 'Design Systems', target: 'Typography' },
    { source: 'Design Systems', target: 'Color Theory' },
    { source: 'Design Systems', target: 'Accessibility' },
    { source: 'React', target: 'Framer Motion' },
    { source: 'React', target: 'Tailwind' },
    { source: 'Design Systems', target: 'React' },
    { source: 'UX Research', target: 'Accessibility' },
  ]
};

export const INCOME_DATA = [
  { name: 'Mon', value: 400 },
  { name: 'Tue', value: 300 },
  { name: 'Wed', value: 550 },
  { name: 'Thu', value: 450 },
  { name: 'Fri', value: 700 },
  { name: 'Sat', value: 200 },
  { name: 'Sun', value: 100 },
];