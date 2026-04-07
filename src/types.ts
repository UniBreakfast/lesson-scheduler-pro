export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  role?: 'admin' | 'client';
}

export interface Student {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  telegram?: string;
  notes?: string;
  tags?: string[];
  links?: string;
  teacherUid: string;
}

export interface Lesson {
  id: string;
  studentId?: string;
  studentName?: string;
  startTime: string; // ISO 8601
  endTime?: string;   // ISO 8601
  subject?: string;
  notes?: string;
  summary?: string;
  tags?: string[];
  links?: string;
  teacherUid: string;
  completed?: boolean;
}

export type ViewType = 'year' | 'month' | 'week' | 'day' | 'period' | 'details';

export interface LessonFilter {
  startDate: string | null;
  endDate: string | null;
  tags: string[];
  search: string;
  studentId: string | null;
}
