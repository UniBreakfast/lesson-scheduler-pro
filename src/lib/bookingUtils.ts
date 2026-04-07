import { Lesson } from '../types';
import { addMinutes, differenceInMinutes, isAfter, isBefore, parseISO, startOfDay, endOfDay, format } from 'date-fns';

export interface TimeSlot {
  start: Date;
  end: Date;
}

export const parseDate = (val: any) => {
  if (!val) return new Date(NaN);
  if (typeof val.toDate === 'function') return val.toDate();
  return new Date(val);
};

export const getLocalDateString = (date: Date) => {
  const d = parseDate(date);
  if (isNaN(d.getTime())) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

export function calculateFreeSlots(
  date: Date,
  workStart: Date,
  workEnd: Date,
  lessons: Lesson[]
): TimeSlot[] {
  const dayLessons = lessons
    .filter(l => {
      const lStart = parseDate(l.startTime);
      return !isNaN(lStart.getTime()) && format(lStart, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd');
    })
    .sort((a, b) => parseDate(a.startTime).getTime() - parseDate(b.startTime).getTime());

  const freeSlots: TimeSlot[] = [];
  let current = workStart;

  for (const lesson of dayLessons) {
    const lessonStart = parseDate(lesson.startTime);
    const lessonEnd = lesson.endTime ? parseDate(lesson.endTime) : addMinutes(lessonStart, 60);

    if (isAfter(lessonStart, current)) {
      freeSlots.push({ start: current, end: lessonStart });
    }
    
    if (isAfter(lessonEnd, current)) {
      current = lessonEnd;
    }
  }

  if (isBefore(current, workEnd)) {
    freeSlots.push({ start: current, end: workEnd });
  }

  return freeSlots.filter(slot => differenceInMinutes(slot.end, slot.start) >= 15);
}
