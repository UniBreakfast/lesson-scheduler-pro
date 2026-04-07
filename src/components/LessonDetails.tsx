import React, { useState, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import { X, Save, Trash2, Clock, User as UserIcon, BookOpen, FileText, Link as LinkIcon, Edit3, Tag as TagIcon, CheckCircle } from 'lucide-react';
import { Lesson, Student } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import TagSelector from './TagSelector';
import LinkRenderer from './LinkRenderer';
import { isSameDay } from 'date-fns';
import ConfirmationModal from './ConfirmationModal';

interface LessonDetailsProps {
  lesson: Partial<Lesson> | null;
  students: Student[];
  onSave: (lesson: Partial<Lesson>) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
  onAddNewStudent: () => void;
  onViewStudent?: (studentId: string) => void;
  availableTags?: string[];
  onTagClick?: (tag: string) => void;
  initialIsEditing?: boolean;
}

export default function LessonDetails({ lesson, students, onSave, onDelete, onClose, onAddNewStudent, onViewStudent, availableTags = [], onTagClick, initialIsEditing = false }: LessonDetailsProps) {
  // Lock body scroll when modal is open
  useEffect(() => {
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, []);

  const [isEditing, setIsEditing] = useState(initialIsEditing || !lesson?.id);
  const [showConfirmClose, setShowConfirmClose] = useState(false);

  // Helper to convert UTC ISO string to local datetime-local format (YYYY-MM-DDTHH:mm)
  const toLocalDatetime = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      // Format as YYYY-MM-DDTHH:mm in local time
      return format(date, "yyyy-MM-dd'T'HH:mm");
    } catch (e) {
      return '';
    }
  };

  const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  const [formData, setFormData] = useState<Partial<Lesson>>({
    studentId: '',
    startTime: new Date().toISOString(),
    subject: '',
    notes: '',
    summary: '',
    tags: [],
    links: '',
    completed: false,
    ...lesson
  });

  useEffect(() => {
    if (lesson) {
      setFormData(prev => ({ ...prev, ...lesson }));
    }
  }, [lesson]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const student = students.find(s => s.id === formData.studentId);
    onSave({ ...formData, studentName: student?.name || 'Unspecified Student' });
  };

  const handleStudentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === 'ADD_NEW') {
      onAddNewStudent();
    } else {
      setFormData({ ...formData, studentId: val });
    }
  };

  const selectedStudent = students.find(s => s.id === formData.studentId);

  const hasChanges = () => {
    if (!isEditing) return false;
    
    const initial = {
      studentId: '',
      startTime: '',
      endTime: undefined,
      subject: '',
      notes: '',
      summary: '',
      tags: [],
      links: '',
      completed: false,
      ...lesson
    };

    if (formData.studentId !== initial.studentId) return true;
    if (formData.startTime !== initial.startTime) return true;
    if (formData.endTime !== initial.endTime) return true;
    if (formData.subject !== initial.subject) return true;
    if (formData.notes !== initial.notes) return true;
    if (formData.summary !== initial.summary) return true;
    if (formData.links !== initial.links) return true;
    if (formData.completed !== initial.completed) return true;
    
    const tags1 = [...(formData.tags || [])].sort();
    const tags2 = [...(initial.tags || [])].sort();
    if (JSON.stringify(tags1) !== JSON.stringify(tags2)) return true;

    return false;
  };

  const handleCloseAttempt = () => {
    if (hasChanges()) {
      setShowConfirmClose(true);
    } else {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[60] overflow-y-auto bg-slate-900/60 p-4 backdrop-blur-md"
      onClick={handleCloseAttempt}
    >
      <div className="flex min-h-full items-center justify-center py-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-8 py-6">
          <div className="flex items-center gap-4">
            <div>
              <h2 className="text-2xl font-black text-slate-900">
                {lesson?.id ? (isEditing ? 'Edit Lesson' : 'Lesson Details') : 'Schedule Lesson'}
              </h2>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                Timezone: {userTimeZone}
              </p>
            </div>
            {formData.completed && !isEditing && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const newCompleted = !formData.completed;
                  setFormData(prev => ({ ...prev, completed: newCompleted }));
                  onSave({ ...formData, completed: newCompleted });
                }}
                className="flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-emerald-700 border border-emerald-200 hover:bg-emerald-200 transition-colors"
              >
                <CheckCircle className="h-3 w-3" /> Completed
              </button>
            )}
            {!formData.completed && !isEditing && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const newCompleted = true;
                  setFormData(prev => ({ ...prev, completed: newCompleted }));
                  onSave({ ...formData, completed: newCompleted });
                }}
                className="flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-slate-400 border border-slate-200 hover:bg-slate-200 transition-colors"
              >
                <Clock className="h-3 w-3" /> Mark Completed
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            {lesson?.id && !isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 rounded-xl bg-brick-50 px-4 py-2 text-sm font-bold text-brick-600 hover:bg-brick-100 transition-colors"
              >
                <Edit3 className="h-4 w-4" /> Edit
              </button>
            )}
            <button onClick={handleCloseAttempt} className="rounded-full p-2 hover:bg-slate-200 transition-colors">
              <X className="h-6 w-6 text-slate-500" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-8">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div className="col-span-full space-y-2">
              <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
                <UserIcon className="h-4 w-4" /> Student
              </label>
              {isEditing ? (
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                  <select
                    value={formData.studentId}
                    onChange={handleStudentChange}
                    className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-medium focus:border-brick-500 focus:ring-2 focus:ring-brick-200 outline-none transition-all"
                  >
                    <option value="">Unspecified Student</option>
                    <option value="ADD_NEW" className="font-bold text-brick-600">+ Add New Student...</option>
                    {students.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                  <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 transition-all hover:bg-slate-100">
                    <input
                      type="checkbox"
                      checked={formData.completed}
                      onChange={e => setFormData({ ...formData, completed: e.target.checked })}
                      className="h-5 w-5 rounded border-slate-300 text-brick-600 focus:ring-brick-500"
                    />
                    <span className="text-sm font-bold text-slate-700">Completed</span>
                  </label>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    if (formData.studentId) {
                      onViewStudent?.(formData.studentId);
                    }
                  }}
                  className="w-full rounded-xl bg-slate-50 px-4 py-3 font-medium text-slate-900 border border-transparent text-left hover:bg-slate-100 hover:border-slate-200 transition-all group"
                >
                  <span className="group-hover:text-brick-600 transition-colors">
                    {selectedStudent?.name || 'Unspecified Student'}
                  </span>
                  {formData.studentId && (
                    <span className="ml-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 group-hover:text-brick-400">
                      (View Profile)
                    </span>
                  )}
                </button>
              )}
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
                <Clock className="h-4 w-4" /> Start Time
              </label>
              {isEditing ? (
                <input
                  type="datetime-local"
                  required
                  value={toLocalDatetime(formData.startTime)}
                  onChange={e => {
                    const date = new Date(e.target.value);
                    if (!isNaN(date.getTime())) {
                      setFormData({ ...formData, startTime: date.toISOString() });
                    }
                  }}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-medium focus:border-brick-500 focus:ring-2 focus:ring-brick-200 outline-none transition-all"
                />
              ) : (
                <div className="rounded-xl bg-slate-50 px-4 py-3 font-medium text-slate-900 border border-transparent">
                  {formData.startTime ? format(new Date(formData.startTime), 'PPP HH:mm') : '-'}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
                  <Clock className="h-4 w-4" /> End Time
                </label>
                {isEditing && formData.endTime && (
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, endTime: undefined })}
                    className="text-[10px] font-black uppercase tracking-wider text-brick-600 hover:text-brick-700"
                  >
                    Clear
                  </button>
                )}
              </div>
              {isEditing ? (
                <input
                  type="datetime-local"
                  value={toLocalDatetime(formData.endTime)}
                  onChange={e => {
                    const val = e.target.value;
                    if (!val) {
                      setFormData({ ...formData, endTime: undefined });
                      return;
                    }
                    const date = new Date(val);
                    if (!isNaN(date.getTime())) {
                      setFormData({ ...formData, endTime: date.toISOString() });
                    }
                  }}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-medium focus:border-brick-500 focus:ring-2 focus:ring-brick-200 outline-none transition-all"
                />
              ) : (
                <div className="rounded-xl bg-slate-50 px-4 py-3 font-medium text-slate-900 border border-transparent">
                  {formData.endTime ? (
                    (formData.startTime && isSameDay(new Date(formData.startTime), new Date(formData.endTime)))
                      ? format(new Date(formData.endTime), 'HH:mm')
                      : format(new Date(formData.endTime), 'PPP HH:mm')
                  ) : '-'}
                </div>
              )}
            </div>

            {(isEditing || formData.subject) && (
              <div className="col-span-full space-y-2">
                <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
                  <BookOpen className="h-4 w-4" /> Subject
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    placeholder="e.g. Advanced Calculus"
                    value={formData.subject}
                    onChange={e => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-medium focus:border-brick-500 focus:ring-2 focus:ring-brick-200 outline-none transition-all"
                  />
                ) : (
                  <div className="rounded-xl bg-slate-50 px-4 py-3 font-medium text-slate-900 border border-transparent">
                    {formData.subject}
                  </div>
                )}
              </div>
            )}

            {(isEditing || formData.links) && (
              <div className="col-span-full space-y-2">
                <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
                  <LinkIcon className="h-4 w-4" /> Links
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    placeholder="https://example.com"
                    value={formData.links}
                    onChange={e => setFormData({ ...formData, links: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-medium focus:border-brick-500 focus:ring-2 focus:ring-brick-200 outline-none transition-all"
                  />
                ) : (
                  <div className="rounded-xl bg-slate-50 px-4 py-3 font-medium text-slate-900 border border-transparent">
                    <LinkRenderer links={formData.links || ''} />
                  </div>
                )}
              </div>
            )}

            {(isEditing || (formData.tags && formData.tags.length > 0)) && (
              <div className="col-span-full">
                {isEditing ? (
                  <TagSelector
                    selectedTags={formData.tags || []}
                    onChange={tags => setFormData({ ...formData, tags })}
                    availableTags={availableTags}
                  />
                ) : (
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
                      <TagIcon className="h-4 w-4" /> Tags
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {formData.tags?.map(tag => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => {
                            onTagClick?.(tag);
                            onClose();
                          }}
                          className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600 border border-slate-200 hover:bg-brick-50 hover:text-brick-600 hover:border-brick-200 transition-all"
                        >
                          #{tag}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {(isEditing || formData.notes) && (
              <div className="col-span-full space-y-2">
                <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
                  <FileText className="h-4 w-4" /> Lesson Notes
                </label>
                {isEditing ? (
                  <textarea
                    rows={4}
                    placeholder="What did you cover? What needs more work?"
                    value={formData.notes}
                    onChange={e => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-medium focus:border-brick-500 focus:ring-2 focus:ring-brick-200 outline-none transition-all"
                  />
                ) : (
                  <div className="rounded-xl bg-slate-50 px-4 py-3 font-medium text-slate-900 border border-transparent whitespace-pre-wrap min-h-[100px]">
                    {formData.notes}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="mt-10 flex items-center justify-between border-t border-slate-100 pt-8">
            {lesson?.id && isEditing ? (
              <button
                type="button"
                onClick={() => onDelete(lesson.id!)}
                className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold text-red-500 hover:bg-red-50 transition-colors"
              >
                <Trash2 className="h-5 w-5" /> Delete
              </button>
            ) : <div />}

            <div className="flex gap-4">
              <button
                type="button"
                onClick={handleCloseAttempt}
                className="rounded-xl px-6 py-3 text-sm font-bold text-slate-500 hover:bg-slate-100 transition-colors"
              >
                {isEditing ? 'Cancel' : 'Close'}
              </button>
              {isEditing && (
                <button
                  type="submit"
                  className="flex items-center gap-2 rounded-xl bg-brick-600 px-8 py-3 text-sm font-bold text-white shadow-lg shadow-brick-200 transition-all hover:bg-brick-700 active:scale-95"
                >
                  <Save className="h-5 w-5" /> Save Lesson
                </button>
              )}
            </div>
          </div>
        </form>
      </motion.div>
      </div>

      <ConfirmationModal
        isOpen={showConfirmClose}
        onClose={() => setShowConfirmClose(false)}
        onConfirm={onClose}
        title="Discard Changes?"
        message="You have unsaved changes. Are you sure you want to discard them?"
        confirmLabel="Discard"
        cancelLabel="Keep Editing"
        variant="warning"
      />
    </div>
  );
}

