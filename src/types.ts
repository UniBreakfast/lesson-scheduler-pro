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

export interface BusySlot {
  startTime: string; // ISO 8601
  endTime: string;   // ISO 8601
}

export interface BookingLink {
  id: string;
  studentId: string;
  studentName: string;
  date: string; // ISO 8601 (date part only)
  workStartTime: string; // ISO 8601
  workEndTime: string; // ISO 8601
  teacherUid: string;
  teacherName: string;
  createdAt: string;
  status: 'active' | 'used' | 'invalid';
  lessonsSnapshot: string[]; // IDs of lessons on that date when link was created
  busySlots: BusySlot[]; // Busy intervals at the time of creation
}

export interface BookingRequest {
  id: string;
  studentId: string;
  studentName: string;
  startTime: string; // ISO 8601
  endTime: string; // ISO 8601
  subject: string;
  notes: string;
  teacherUid: string;
  status: 'pending' | 'accepted' | 'denied';
  createdAt: string;
  bookingLinkId: string;
}

export type ViewType = 'year' | 'month' | 'week' | 'day' | 'period' | 'details' | 'booking';

export interface LessonFilter {
  startDate: string | null;
  endDate: string | null;
  tags: string[];
  search: string;
  studentId: string | null;
}
