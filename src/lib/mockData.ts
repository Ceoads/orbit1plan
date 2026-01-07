// Mock data for a 10th-grade student

export type Subject = {
  id: string;
  name: string;
  colorKey: 'math' | 'history' | 'physics' | 'english' | 'chemistry';
  teacher: string;
  icon: string;
};

export type CalendarEvent = {
  id: string;
  title: string;
  subjectId: string;
  startTime: string;
  endTime: string;
  type: 'class' | 'exam';
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, etc.
};

export type Note = {
  id: string;
  subjectId: string;
  mediaUrl: string;
  rawText: string;
  aiSummary: string;
  timestamp: Date;
  eventId?: string;
};

export type Task = {
  id: string;
  title: string;
  status: 'todo' | 'done';
  priorityScore: number;
  energyLevel: 'low' | 'medium' | 'high';
  dueDate: Date;
  linkedNoteId?: string;
  subjectId?: string;
  parentTaskId?: string;
  isSubtask?: boolean;
};

export type Exam = {
  id: string;
  subjectId: string;
  title: string;
  date: Date;
  linkedNotes: string[];
};

export const subjects: Subject[] = [
  { id: 'math', name: 'Mathematics', colorKey: 'math', teacher: 'Mr. Thompson', icon: '📐' },
  { id: 'history', name: 'World History', colorKey: 'history', teacher: 'Ms. Garcia', icon: '📜' },
  { id: 'physics', name: 'Physics', colorKey: 'physics', teacher: 'Dr. Chen', icon: '⚡' },
  { id: 'english', name: 'English Literature', colorKey: 'english', teacher: 'Mrs. Williams', icon: '📚' },
  { id: 'chemistry', name: 'Chemistry', colorKey: 'chemistry', teacher: 'Mr. Patel', icon: '🧪' },
];

// Get current day info for scheduling
const today = new Date();
const dayOfWeek = today.getDay();

export const schedule: CalendarEvent[] = [
  { id: 'e1', title: 'Mathematics', subjectId: 'math', startTime: '09:00', endTime: '10:00', type: 'class', dayOfWeek: 1 },
  { id: 'e2', title: 'World History', subjectId: 'history', startTime: '10:00', endTime: '11:00', type: 'class', dayOfWeek: 1 },
  { id: 'e3', title: 'Physics', subjectId: 'physics', startTime: '11:15', endTime: '12:15', type: 'class', dayOfWeek: 1 },
  { id: 'e4', title: 'English Literature', subjectId: 'english', startTime: '13:30', endTime: '14:30', type: 'class', dayOfWeek: 1 },
  { id: 'e5', title: 'Chemistry', subjectId: 'chemistry', startTime: '14:45', endTime: '15:45', type: 'class', dayOfWeek: 1 },
  
  // Tuesday
  { id: 'e6', title: 'Physics', subjectId: 'physics', startTime: '09:00', endTime: '10:00', type: 'class', dayOfWeek: 2 },
  { id: 'e7', title: 'Mathematics', subjectId: 'math', startTime: '10:00', endTime: '11:00', type: 'class', dayOfWeek: 2 },
  { id: 'e8', title: 'English Literature', subjectId: 'english', startTime: '11:15', endTime: '12:15', type: 'class', dayOfWeek: 2 },
  
  // Wednesday
  { id: 'e9', title: 'Chemistry', subjectId: 'chemistry', startTime: '09:00', endTime: '10:00', type: 'class', dayOfWeek: 3 },
  { id: 'e10', title: 'World History', subjectId: 'history', startTime: '10:00', endTime: '11:00', type: 'class', dayOfWeek: 3 },
  
  // Thursday
  { id: 'e11', title: 'Mathematics', subjectId: 'math', startTime: '09:00', endTime: '10:00', type: 'class', dayOfWeek: 4 },
  { id: 'e12', title: 'Physics', subjectId: 'physics', startTime: '10:00', endTime: '11:00', type: 'class', dayOfWeek: 4 },
  
  // Friday - Exam Day!
  { id: 'exam1', title: 'Physics Final Exam', subjectId: 'physics', startTime: '09:00', endTime: '11:00', type: 'exam', dayOfWeek: 5 },
  { id: 'e13', title: 'World History', subjectId: 'history', startTime: '13:00', endTime: '14:00', type: 'class', dayOfWeek: 5 },
];

export const mockNotes: Note[] = [
  {
    id: 'n1',
    subjectId: 'physics',
    mediaUrl: '/placeholder.svg',
    rawText: 'Newton\'s Laws of Motion: 1. An object at rest stays at rest. 2. F=ma. 3. Every action has equal and opposite reaction.',
    aiSummary: 'Key physics concepts: Newton\'s three laws explain motion and forces.',
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    eventId: 'e3',
  },
  {
    id: 'n2',
    subjectId: 'physics',
    mediaUrl: '/placeholder.svg',
    rawText: 'Kinematic equations: v = v0 + at, x = x0 + v0t + 1/2at²',
    aiSummary: 'Motion formulas for calculating velocity and position over time.',
    timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    eventId: 'e6',
  },
  {
    id: 'n3',
    subjectId: 'math',
    mediaUrl: '/placeholder.svg',
    rawText: 'Quadratic formula: x = (-b ± √(b²-4ac)) / 2a',
    aiSummary: 'Formula for solving quadratic equations.',
    timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    eventId: 'e1',
  },
  {
    id: 'n4',
    subjectId: 'history',
    mediaUrl: '/placeholder.svg',
    rawText: 'World War I causes: Militarism, Alliances, Imperialism, Nationalism (MAIN)',
    aiSummary: 'Remember MAIN acronym for WWI causes.',
    timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
    eventId: 'e2',
  },
];

export const mockTasks: Task[] = [
  {
    id: 't1',
    title: 'Review Physics Notes for Exam',
    status: 'todo',
    priorityScore: 95,
    energyLevel: 'high',
    dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    subjectId: 'physics',
  },
  {
    id: 't2',
    title: 'Complete Math Problem Set',
    status: 'todo',
    priorityScore: 70,
    energyLevel: 'medium',
    dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
    subjectId: 'math',
  },
  {
    id: 't3',
    title: 'Read History Chapter 5',
    status: 'todo',
    priorityScore: 50,
    energyLevel: 'low',
    dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    subjectId: 'history',
  },
  {
    id: 't4',
    title: 'Practice Physics Formulas',
    status: 'todo',
    priorityScore: 85,
    energyLevel: 'medium',
    dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
    subjectId: 'physics',
  },
  {
    id: 't5',
    title: 'Write English Essay Outline',
    status: 'done',
    priorityScore: 60,
    energyLevel: 'high',
    dueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    subjectId: 'english',
  },
];

export const mockExams: Exam[] = [
  {
    id: 'exam1',
    subjectId: 'physics',
    title: 'Physics Final Exam',
    date: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
    linkedNotes: ['n1', 'n2'],
  },
  {
    id: 'exam2',
    subjectId: 'math',
    title: 'Math Midterm',
    date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
    linkedNotes: ['n3'],
  },
  {
    id: 'exam3',
    subjectId: 'history',
    title: 'History Quiz',
    date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    linkedNotes: ['n4'],
  },
];

// Helper function to get current class based on time
export const getCurrentClass = (): CalendarEvent | null => {
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const currentTime = currentHour * 60 + currentMinute;
  const currentDay = now.getDay();
  
  const todayClasses = schedule.filter(e => e.dayOfWeek === currentDay);
  
  for (const event of todayClasses) {
    const [startHour, startMin] = event.startTime.split(':').map(Number);
    const [endHour, endMin] = event.endTime.split(':').map(Number);
    const startTime = startHour * 60 + startMin;
    const endTime = endHour * 60 + endMin;
    
    if (currentTime >= startTime && currentTime <= endTime) {
      return event;
    }
  }
  
  return null;
};

// Get next upcoming class
export const getNextClass = (): CalendarEvent | null => {
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const currentTime = currentHour * 60 + currentMinute;
  const currentDay = now.getDay();
  
  const todayClasses = schedule
    .filter(e => e.dayOfWeek === currentDay)
    .sort((a, b) => {
      const [aH, aM] = a.startTime.split(':').map(Number);
      const [bH, bM] = b.startTime.split(':').map(Number);
      return (aH * 60 + aM) - (bH * 60 + bM);
    });
  
  for (const event of todayClasses) {
    const [startHour, startMin] = event.startTime.split(':').map(Number);
    const startTime = startHour * 60 + startMin;
    
    if (currentTime < startTime) {
      return event;
    }
  }
  
  // Return first class of next day
  const tomorrow = (currentDay + 1) % 7;
  const tomorrowClasses = schedule.filter(e => e.dayOfWeek === tomorrow);
  return tomorrowClasses[0] || null;
};

export const getSubjectById = (id: string): Subject | undefined => {
  return subjects.find(s => s.id === id);
};

export const getHighestPriorityTask = (): Task | undefined => {
  return mockTasks
    .filter(t => t.status === 'todo')
    .sort((a, b) => b.priorityScore - a.priorityScore)[0];
};

export const getTasksByEnergy = (energy: 'low' | 'medium' | 'high'): Task[] => {
  return mockTasks.filter(t => t.energyLevel === energy && t.status === 'todo');
};

export const getNotesBySubject = (subjectId: string): Note[] => {
  return mockNotes.filter(n => n.subjectId === subjectId);
};

export const getDaysUntil = (date: Date): number => {
  const now = new Date();
  const diff = date.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};
