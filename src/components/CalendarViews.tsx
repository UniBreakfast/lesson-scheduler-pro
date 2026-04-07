import React, { useState, useEffect } from 'react';
import { format, startOfYear, endOfYear, eachMonthOfInterval, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek, eachWeekOfInterval, addMonths, subMonths, addYears, subYears, isSameMonth, isSameDay, addWeeks, subWeeks, addDays, subDays, isToday, startOfDay, endOfDay, getDay, isSameWeek, differenceInMinutes } from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, User as UserIcon, BookOpen, Plus, MoreVertical, LayoutGrid, LayoutList, CalendarDays, CalendarRange, Tag as TagIcon, Search, Edit, Trash2, Send, Mail, Phone } from 'lucide-react';
import { Lesson, Student, ViewType, LessonFilter } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { isWithinInterval, parseISO } from 'date-fns';
import LinkRenderer from './LinkRenderer';
import ConfirmationModal from './ConfirmationModal';

interface CalendarViewsProps {
  lessons: Lesson[];
  students: Student[];
  onAddLesson: (date: Date) => void;
  onEditLesson: (lesson: Lesson, isEditing?: boolean) => void;
  onDeleteLesson: (id: string) => void;
  view: ViewType;
  setView: (view: ViewType) => void;
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
  filters?: LessonFilter;
  onFilterChange?: (filters: LessonFilter) => void;
}

export default function CalendarViews({ lessons, students, onAddLesson, onEditLesson, onDeleteLesson, view, setView, selectedDate, setSelectedDate, filters, onFilterChange }: CalendarViewsProps) {
  const [lessonToDelete, setLessonToDelete] = useState<string | null>(null);
  
  const getLessonTint = (count: number) => {
    if (count === 0) return '';
    if (count === 1) return 'bg-brick-50/50';
    if (count === 2) return 'bg-brick-100/60';
    if (count === 3) return 'bg-brick-200/70';
    return 'bg-brick-300/80';
  };

  const renderYearView = () => {
    const yearStart = startOfYear(selectedDate);
    const yearEnd = endOfYear(selectedDate);
    const months = eachMonthOfInterval({ start: yearStart, end: yearEnd });

    return (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {months.map((month) => {
          const monthLessons = lessons.filter(l => isSameMonth(new Date(l.startTime), month));
          const totalMinutes = monthLessons.reduce((acc, l) => {
            if (!l.completed || !l.endTime) return acc;
            try {
              return acc + differenceInMinutes(new Date(l.endTime), new Date(l.startTime));
            } catch (e) {
              return acc;
            }
          }, 0);
          const totalHours = (totalMinutes / 60).toFixed(1);
          const isCurrentMonth = isSameMonth(month, new Date());

          return (
            <motion.button
              key={month.toString()}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                setSelectedDate(month);
                setView('month');
              }}
              className={`group flex flex-col overflow-hidden rounded-2xl border p-4 text-left shadow-sm transition-all hover:border-brick-300 hover:shadow-md ${
                isCurrentMonth ? 'border-brick-500 bg-brick-50/30 ring-1 ring-brick-500' : 'border-slate-200 bg-white'
              }`}
            >
              <span className={`text-lg font-bold ${isCurrentMonth ? 'text-brick-600' : 'text-slate-900 group-hover:text-brick-600'}`}>
                {format(month, 'MMMM')}
              </span>
              
              <div className="mt-4 hidden sm:flex flex-col gap-1">
                <div className="flex items-center justify-between text-xs font-medium text-slate-500">
                  <span>Lessons</span>
                  <span className="font-bold text-slate-700">{monthLessons.length}</span>
                </div>
                <div className="flex items-center justify-between text-xs font-medium text-slate-500">
                  <span>Hours</span>
                  <span className="font-bold text-slate-700">{totalHours}h</span>
                </div>
              </div>

              <div className="mt-auto flex justify-end sm:hidden">
                <span className="text-[10px] font-bold text-brick-600">{monthLessons.length}L</span>
              </div>
            </motion.button>
          );
        })}
      </div>
    );
  };

  const renderMonthView = () => {
    const monthStart = startOfMonth(selectedDate);
    const monthEnd = endOfMonth(selectedDate);
    const weeks = eachWeekOfInterval({ start: monthStart, end: monthEnd }, { weekStartsOn: 1 });

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-[32px_repeat(7,minmax(0,1fr))] gap-1 sm:gap-2 text-center text-[10px] font-bold uppercase tracking-wider text-slate-400">
          <div className="flex items-center justify-center">Wk</div>
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => <div key={d}>{d}</div>)}
        </div>
        <div className="space-y-2">
          {weeks.map((weekStart, weekIdx) => {
            const isCurrentWeek = isSameWeek(weekStart, new Date(), { weekStartsOn: 1 });
            return (
              <div key={weekIdx} className={`grid grid-cols-[32px_repeat(7,minmax(0,1fr))] gap-1 sm:gap-2 rounded-xl p-1 transition-colors ${isCurrentWeek ? 'bg-brick-50/50 ring-1 ring-brick-100' : ''}`}>
                <button
                  onClick={() => {
                    setSelectedDate(weekStart);
                    setView('week');
                  }}
                  className={`flex items-center justify-center rounded-lg text-[10px] font-bold transition-colors ${
                    isCurrentWeek ? 'bg-brick-600 text-white' : 'bg-slate-100 text-slate-500 hover:bg-brick-100 hover:text-brick-600'
                  }`}
                  title="View Week"
                >
                  {format(weekStart, 'w')}
                </button>
                {eachDayOfInterval({
                  start: startOfWeek(weekStart, { weekStartsOn: 1 }),
                  end: endOfWeek(weekStart, { weekStartsOn: 1 })
                }).map((day) => {
                  const dayLessons = lessons.filter(l => isSameDay(new Date(l.startTime), day));
                  const isCurrentMonth = isSameMonth(day, monthStart);
                  const dayOfWeek = getDay(day);
                  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
                  
                  return (
                    <motion.button
                      key={day.toString()}
                      whileHover={{ scale: 1.02 }}
                      onClick={() => {
                        setSelectedDate(day);
                        setView('day');
                      }}
                      className={`flex min-h-[60px] sm:min-h-[100px] flex-col rounded-xl border p-1 sm:p-2 text-left transition-all ${
                        isCurrentMonth 
                          ? `${dayLessons.length > 0 ? getLessonTint(dayLessons.length) : 'bg-white'} ${isWeekend ? 'shadow-[inset_0_0_0_6px_rgba(239,68,68,0.1)] text-red-600' : ''} border-slate-200` 
                          : 'bg-slate-50 border-slate-100 opacity-50'
                      } ${isToday(day) ? 'ring-2 ring-brick-500 ring-offset-2' : ''}`}
                    >
                      <span className={`text-sm font-bold ${isToday(day) ? 'text-brick-600' : 'text-slate-900'}`}>
                        {format(day, 'd')}
                      </span>
                      <div className="mt-1 hidden sm:flex flex-col gap-1 overflow-hidden">
                        {dayLessons.slice(0, 2).map(l => (
                          <div key={l.id} className="truncate rounded bg-brick-50 px-1.5 py-0.5 text-[10px] font-medium text-brick-700">
                            {l.studentName}
                          </div>
                        ))}
                        {dayLessons.length > 2 && (
                          <div className="text-[10px] font-medium text-slate-400">
                            + {dayLessons.length - 2}
                          </div>
                        )}
                      </div>
                      {dayLessons.length > 0 && (
                        <div className="mt-auto flex justify-end sm:hidden">
                          <span className="text-[10px] font-bold text-brick-600">{dayLessons.length}</span>
                        </div>
                      )}
                    </motion.button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderWeekView = () => {
    const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 });
    const days = eachDayOfInterval({ start: weekStart, end: weekEnd });

    const weekGridTemplate = days.map(day => {
      const hasLessons = lessons.some(l => isSameDay(new Date(l.startTime), day));
      return hasLessons ? 'minmax(120px, 1.5fr)' : 'minmax(60px, 0.6fr)';
    }).join(' ');

    return (
      <div className="flex flex-col gap-4">
        {/* Mobile: Days to choose */}
        <div className="grid grid-cols-7 gap-2 sm:hidden">
          {days.map(day => {
            const dayLessons = lessons.filter(l => isSameDay(new Date(l.startTime), day));
            const dayOfWeek = getDay(day);
            const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
            return (
              <button
                key={day.toString()}
                onClick={() => {
                  setSelectedDate(day);
                  setView('day');
                }}
                className={`flex flex-col items-center rounded-lg p-2 transition-all ${
                  isSameDay(day, selectedDate) 
                    ? 'bg-brick-600 text-white shadow-lg' 
                    : `text-slate-600 border border-slate-200 ${dayLessons.length > 0 ? getLessonTint(dayLessons.length) : (isWeekend ? 'shadow-[inset_0_0_0_4px_rgba(239,68,68,0.1)]' : '')}`
                }`}
              >
                <span className="text-[10px] font-bold uppercase">{format(day, 'EEE')}</span>
                <span className="text-lg font-bold">{format(day, 'd')}</span>
                {dayLessons.length > 0 && !isSameDay(day, selectedDate) && (
                  <span className="mt-0.5 text-[10px] font-black text-brick-600">{dayLessons.length}</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Desktop: Lessons view */}
        <div className="hidden gap-4 sm:grid" style={{ gridTemplateColumns: weekGridTemplate }}>
          {days.map(day => {
            const dayLessons = lessons.filter(l => isSameDay(new Date(l.startTime), day))
              .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
            const dayOfWeek = getDay(day);
            const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
            
            return (
              <div key={day.toString()} className="flex flex-col gap-3">
                <button 
                  onClick={() => {
                    setSelectedDate(day);
                    setView('day');
                  }}
                  className={`flex flex-col items-center rounded-xl py-3 transition-all hover:scale-105 active:scale-95 ${
                    isToday(day) 
                      ? 'bg-brick-600 text-white shadow-lg' 
                      : (isWeekend ? 'bg-white shadow-[inset_0_0_0_6px_rgba(239,68,68,0.1)] text-red-600 hover:bg-red-50' : 'bg-slate-100 text-slate-600 hover:bg-slate-200')
                  }`}
                >
                  <span className="text-xs font-bold uppercase tracking-widest">{format(day, 'EEE')}</span>
                  <span className="text-xl font-black">{format(day, 'd')}</span>
                </button>
                <div className="flex flex-col gap-2">
                  {dayLessons.map(lesson => (
                    <motion.button
                      key={lesson.id}
                      whileHover={{ x: 4 }}
                      onClick={() => onEditLesson(lesson)}
                      className={`flex flex-col rounded-xl border p-3 text-left shadow-sm transition-all hover:border-brick-300 hover:shadow-md ${
                        lesson.completed ? 'bg-emerald-50/30 border-emerald-100' : 'bg-white border-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-brick-600">
                          {format(new Date(lesson.startTime), 'HH:mm')}
                          {lesson.endTime && (
                            <>
                              {' - '}
                              {format(new Date(lesson.endTime), 'HH:mm')}
                              {(() => {
                                const start = new Date(lesson.startTime).getTime();
                                const end = new Date(lesson.endTime).getTime();
                                const hours = (end - start) / (1000 * 60 * 60);
                                return ` (${parseFloat(hours.toFixed(2))}h)`;
                              })()}
                            </>
                          )}
                        </span>
                        {lesson.completed && (
                          <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                        )}
                      </div>
                      <span className="mt-1 text-sm font-bold text-slate-900">{lesson.studentName}</span>
                      <span className="text-[10px] text-slate-500">{lesson.subject}</span>
                    </motion.button>
                  ))}
                  <button
                    onClick={() => onAddLesson(day)}
                    className={`flex items-center justify-center rounded-xl border-2 border-dashed py-4 transition-all hover:border-brick-300 hover:bg-brick-50 hover:text-brick-600 ${
                      isWeekend ? 'border-red-200 text-red-300 shadow-[inset_0_0_0_4px_rgba(239,68,68,0.05)]' : 'border-slate-200 text-slate-400'
                    }`}
                  >
                    <Plus className="h-5 w-5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderDayView = () => {
    const dayLessons = lessons.filter(l => isSameDay(new Date(l.startTime), selectedDate))
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

    const handleAddLesson = () => {
      const now = new Date();
      // If we are looking at today, use current time. Otherwise use the selected date at 09:00 as a sensible default.
      let defaultDate = new Date(selectedDate);
      if (isToday(selectedDate)) {
        defaultDate = now;
      } else {
        defaultDate.setHours(9, 0, 0, 0);
      }
      onAddLesson(defaultDate);
    };

    const dayOfWeek = getDay(selectedDate);
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <div className={`flex items-center justify-between rounded-2xl p-6 border transition-colors ${
          isWeekend 
            ? 'bg-white shadow-[inset_0_0_0_8px_rgba(239,68,68,0.1)] text-red-600 border-red-100' 
            : 'bg-white shadow-sm border-slate-200'
        }`}>
          <div className="flex flex-col">
            <span className={`text-sm font-bold uppercase tracking-widest ${isWeekend ? 'text-red-600' : 'text-brick-600'}`}>
              {format(selectedDate, 'EEEE')}
            </span>
            <h2 className="text-3xl font-black text-slate-900">{format(selectedDate, 'MMMM d, yyyy')}</h2>
          </div>
          <button
            onClick={handleAddLesson}
            className={`flex h-12 w-12 items-center justify-center rounded-full text-white shadow-lg transition-all active:scale-95 ${
              isWeekend ? 'bg-red-600 shadow-red-200 hover:bg-red-700' : 'bg-brick-600 shadow-brick-200 hover:bg-brick-700'
            }`}
          >
            <Plus className="h-6 w-6" />
          </button>
        </div>

        <div className="space-y-4">
          {dayLessons.length > 0 ? (
            dayLessons.map((lesson, idx) => (
              <motion.div
                key={lesson.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                onClick={() => onEditLesson(lesson)}
                className="group relative flex cursor-pointer items-start gap-3 sm:gap-6 rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 transition-all hover:border-brick-300 hover:shadow-xl"
              >
                <div className="flex flex-col items-center gap-1 min-w-[50px]">
                  <span className="text-base sm:text-lg font-black text-slate-900">{format(new Date(lesson.startTime), 'HH:mm')}</span>
                  <div className="h-12 w-px bg-slate-200 group-hover:bg-brick-200" />
                  <span className="text-[10px] sm:text-xs font-medium text-slate-400">
                    {lesson.endTime ? format(new Date(lesson.endTime), 'HH:mm') : '-'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg sm:text-xl font-bold text-slate-900 truncate">{lesson.studentName}</h3>
                      {lesson.completed && (
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-emerald-700 border border-emerald-200 whitespace-nowrap">
                          Completed
                        </span>
                      )}
                    </div>
                    <div className="flex flex-col sm:items-end gap-2">
                      <span className="inline-block rounded-full bg-brick-50 px-3 py-1 text-[10px] sm:text-xs font-bold text-brick-600 w-fit max-w-full truncate sm:max-w-[200px]">
                        {lesson.subject || 'No Subject'}
                      </span>
                      {lesson.tags && lesson.tags.length > 0 && (
                        <div className="flex flex-wrap sm:justify-end gap-1">
                          {lesson.tags.map(tag => (
                            <button
                              key={tag}
                              onClick={(e) => {
                                e.stopPropagation();
                                setView('period');
                                onFilterChange?.({
                                  startDate: null,
                                  endDate: null,
                                  tags: [tag],
                                  search: '',
                                  studentId: null
                                });
                              }}
                              className="flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[9px] sm:text-[10px] font-bold text-slate-500 hover:bg-brick-50 hover:text-brick-600 transition-colors"
                            >
                              <TagIcon className="h-2 w-2" /> {tag}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <p className="mt-2 text-xs sm:text-sm text-slate-500 line-clamp-2">{lesson.notes || 'No notes for this lesson.'}</p>
                  <div className="mt-3">
                    <LinkRenderer links={lesson.links} />
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-200 py-20 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                <CalendarIcon className="h-8 w-8" />
              </div>
              <h3 className="mt-4 text-lg font-bold text-slate-900">No lessons scheduled</h3>
              <p className="mt-1 text-slate-500">Enjoy your free time or schedule a new lesson.</p>
              <button
                onClick={() => onAddLesson(selectedDate)}
                className="mt-6 rounded-xl bg-brick-600 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-brick-200 transition-all hover:bg-brick-700"
              >
                Schedule Lesson
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderPeriodView = () => {
    const [page, setPage] = useState(0);
    const [sortConfig, setSortConfig] = useState<{ key: keyof Lesson | 'studentName'; direction: 'asc' | 'desc' }>({
      key: 'startTime',
      direction: 'desc'
    });
    const pageSize = 50;

    const filteredLessons = lessons.filter(lesson => {
      if (!filters) return true;

      // Date range filter
      if (filters.startDate || filters.endDate) {
        const lessonDate = new Date(lesson.startTime);
        if (filters.startDate && lessonDate < new Date(filters.startDate)) return false;
        if (filters.endDate && lessonDate > endOfDay(new Date(filters.endDate))) return false;
      }

      // Student filter
      if (filters.studentId && lesson.studentId !== filters.studentId) return false;

      // Tags filter
      if (filters.tags.length > 0) {
        if (!lesson.tags || !filters.tags.every(tag => lesson.tags?.includes(tag))) return false;
      }

      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesLesson = 
          lesson.studentName?.toLowerCase().includes(searchLower) ||
          lesson.subject?.toLowerCase().includes(searchLower) ||
          lesson.notes?.toLowerCase().includes(searchLower) ||
          lesson.tags?.some(t => t.toLowerCase().includes(searchLower));
        
        if (!matchesLesson) return false;
      }

      return true;
    });

    const sortedLessons = [...filteredLessons].sort((a, b) => {
      const aValue = a[sortConfig.key] || '';
      const bValue = b[sortConfig.key] || '';
      
      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    const paginatedLessons = sortedLessons.slice(page * pageSize, (page + 1) * pageSize);

    const toggleSort = (key: keyof Lesson | 'studentName') => {
      setSortConfig(prev => ({
        key,
        direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc'
      }));
    };

    const SortIcon = ({ column }: { column: keyof Lesson | 'studentName' }) => {
      if (sortConfig.key !== column) return <MoreVertical className="h-3 w-3 opacity-20" />;
      return sortConfig.direction === 'asc' ? <ChevronLeft className="h-3 w-3 rotate-90" /> : <ChevronLeft className="h-3 w-3 -rotate-90" />;
    };

    const handleFilterChange = (updates: Partial<LessonFilter>) => {
      if (onFilterChange && filters) {
        onFilterChange({ ...filters, ...updates });
        setPage(0);
      }
    };

    const resetFilters = () => {
      if (onFilterChange) {
        onFilterChange({
          startDate: null,
          endDate: null,
          tags: [],
          search: '',
          studentId: null
        });
        setPage(0);
      }
    };

    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-black text-slate-900">Filter Lessons</h2>
            <button
              onClick={resetFilters}
              className="text-xs font-bold uppercase tracking-widest text-brick-600 hover:text-brick-700"
            >
              Reset Filters
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search notes, subject..."
                  value={filters?.search || ''}
                  onChange={e => handleFilterChange({ search: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 py-2 text-sm outline-none focus:border-brick-500 focus:ring-2 focus:ring-brick-200 transition-all"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Student</label>
              <select
                value={filters?.studentId || ''}
                onChange={e => handleFilterChange({ studentId: e.target.value || null })}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm outline-none focus:border-brick-500 focus:ring-2 focus:ring-brick-200 transition-all"
              >
                <option value="">All Students</option>
                {students.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">From Date</label>
              <input
                type="date"
                value={filters?.startDate || ''}
                onChange={e => handleFilterChange({ startDate: e.target.value || null })}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm outline-none focus:border-brick-500 focus:ring-2 focus:ring-brick-200 transition-all"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">To Date</label>
              <input
                type="date"
                value={filters?.endDate || ''}
                onChange={e => handleFilterChange({ endDate: e.target.value || null })}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm outline-none focus:border-brick-500 focus:ring-2 focus:ring-brick-200 transition-all"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Tags</label>
            <div className="flex flex-wrap gap-2">
              {Array.from(new Set(lessons.flatMap(l => l.tags || []))).sort().map(tag => (
                <button
                  key={tag}
                  onClick={() => {
                    const currentTags = filters?.tags || [];
                    const newTags = currentTags.includes(tag)
                      ? currentTags.filter(t => t !== tag)
                      : [...currentTags, tag];
                    handleFilterChange({ tags: newTags });
                  }}
                  className={`rounded-full px-3 py-1 text-xs font-bold transition-all ${
                    filters?.tags.includes(tag)
                      ? 'bg-brick-600 text-white shadow-lg shadow-brick-100'
                      : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                  }`}
                >
                  #{tag}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-black text-slate-900">Results</h2>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500">
              {filteredLessons.length} lessons found
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              disabled={page === 0}
              onClick={() => setPage(p => p - 1)}
              className="rounded-lg border border-slate-200 p-2 disabled:opacity-30 hover:bg-slate-50 transition-colors"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <span className="text-sm font-bold w-16 text-center">Page {page + 1}</span>
            <button
              disabled={(page + 1) * pageSize >= sortedLessons.length}
              onClick={() => setPage(p => p + 1)}
              className="rounded-lg border border-slate-200 p-2 disabled:opacity-30 hover:bg-slate-50 transition-colors"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-[800px] w-full text-left">
            <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th 
                  className="cursor-pointer px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4 hover:bg-slate-100 transition-colors"
                  onClick={() => toggleSort('startTime')}
                >
                  <div className="flex items-center gap-2">
                    Date & Time <SortIcon column="startTime" />
                  </div>
                </th>
                <th 
                  className="cursor-pointer px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4 hover:bg-slate-100 transition-colors"
                  onClick={() => toggleSort('studentName')}
                >
                  <div className="flex items-center gap-2">
                    Student <SortIcon column="studentName" />
                  </div>
                </th>
                <th 
                  className="cursor-pointer px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4 hover:bg-slate-100 transition-colors"
                  onClick={() => toggleSort('subject')}
                >
                  <div className="flex items-center gap-2">
                    Subject <SortIcon column="subject" />
                  </div>
                </th>
                <th className="hidden px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4 lg:table-cell">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedLessons.map(lesson => (
                <tr 
                  key={lesson.id} 
                  className={`group cursor-pointer transition-colors ${lesson.completed ? 'bg-emerald-50/20 hover:bg-emerald-50/40' : 'hover:bg-slate-50'}`}
                  onClick={() => onEditLesson(lesson, false)}
                >
                  <td className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4">
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-900 group-hover:text-brick-600 transition-colors">{format(new Date(lesson.startTime), 'MMM d, yyyy')}</span>
                      <span className="text-xs text-slate-500">
                        {format(new Date(lesson.startTime), 'HH:mm')}
                        {lesson.endTime ? ` - ${format(new Date(lesson.endTime), 'HH:mm')}` : ''}
                      </span>
                    </div>
                  </td>
                  <td className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col gap-1">
                        <span className="font-medium text-slate-900">{lesson.studentName}</span>
                        {lesson.tags && lesson.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {lesson.tags.map(tag => (
                              <button
                                key={tag}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleFilterChange({ tags: [tag] });
                                }}
                                className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold text-slate-500 hover:bg-brick-50 hover:text-brick-600 transition-colors"
                              >
                                #{tag}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      {lesson.completed && (
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-emerald-700 border border-emerald-200">
                          Completed
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4">
                    <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                      {lesson.subject || 'N/A'}
                    </span>
                  </td>
                  <td className="hidden px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4 lg:table-cell">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditLesson(lesson, true);
                        }}
                        className="p-1.5 text-brick-600 hover:bg-brick-50 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setLessonToDelete(lesson.id);
                        }}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const handlePrev = () => {
    if (view === 'year') setSelectedDate(subYears(selectedDate, 1));
    else if (view === 'month') setSelectedDate(subMonths(selectedDate, 1));
    else if (view === 'week') setSelectedDate(subWeeks(selectedDate, 1));
    else if (view === 'day') setSelectedDate(subDays(selectedDate, 1));
  };

  const handleNext = () => {
    if (view === 'year') setSelectedDate(addYears(selectedDate, 1));
    else if (view === 'month') setSelectedDate(addMonths(selectedDate, 1));
    else if (view === 'week') setSelectedDate(addWeeks(selectedDate, 1));
    else if (view === 'day') setSelectedDate(addDays(selectedDate, 1));
  };

  return (
    <div className="space-y-8">
      {view !== 'period' && (
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-black text-slate-900">
              {view === 'year' ? format(selectedDate, 'yyyy') : format(selectedDate, 'MMMM yyyy')}
            </h2>
            <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
              <button onClick={handlePrev} className="rounded-lg p-1.5 hover:bg-slate-100"><ChevronLeft className="h-5 w-5" /></button>
          <button
            onClick={() => setSelectedDate(new Date())}
            className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-all ${
              isToday(selectedDate) ? 'bg-brick-600 text-white rounded-lg shadow-md' : 'hover:bg-slate-100 rounded-lg'
            }`}
          >
            {isToday(selectedDate) ? 'TODAY' : 'Today'}
          </button>
              <button onClick={handleNext} className="rounded-lg p-1.5 hover:bg-slate-100"><ChevronRight className="h-5 w-5" /></button>
            </div>
          </div>

          <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
            <ViewButton active={view === 'year'} onClick={() => setView('year')} icon={<CalendarRange className="h-4 w-4" />} label="Year" />
            <ViewButton active={view === 'month'} onClick={() => setView('month')} icon={<LayoutGrid className="h-4 w-4" />} label="Month" />
            <ViewButton active={view === 'week'} onClick={() => setView('week')} icon={<CalendarDays className="h-4 w-4" />} label="Week" />
            <ViewButton active={view === 'day'} onClick={() => setView('day')} icon={<Clock className="h-4 w-4" />} label="Day" />
          </div>
        </div>
      )}

      <AnimatePresence mode="wait">
        <motion.div
          key={view + selectedDate.toString()}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {view === 'year' && renderYearView()}
          {view === 'month' && renderMonthView()}
          {view === 'week' && renderWeekView()}
          {view === 'day' && renderDayView()}
          {view === 'period' && renderPeriodView()}
        </motion.div>
      </AnimatePresence>

      <AnimatePresence>
        {lessonToDelete && (
          <ConfirmationModal
            isOpen={!!lessonToDelete}
            onClose={() => setLessonToDelete(null)}
            onConfirm={() => {
              if (lessonToDelete) {
                onDeleteLesson(lessonToDelete);
                setLessonToDelete(null);
              }
            }}
            title="Delete Lesson"
            message="Are you sure you want to delete this lesson? This action cannot be undone."
            confirmLabel="Delete"
            variant="danger"
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function ViewButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all ${
        active ? 'bg-brick-600 text-white shadow-lg shadow-brick-100' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
      }`}
    >
      {icon}
      <span className="hidden md:inline">{label}</span>
    </button>
  );
}
