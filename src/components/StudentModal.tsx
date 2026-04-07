import React, { useState, useEffect } from 'react';
import { X, Save, Trash2, Send, Link as LinkIcon, Edit3, User, Mail, Phone, Tag as TagIcon, FileText } from 'lucide-react';
import { Student, Lesson } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { differenceInMinutes } from 'date-fns';
import TagSelector from './TagSelector';
import LinkRenderer from './LinkRenderer';
import ConfirmationModal from './ConfirmationModal';

interface StudentModalProps {
  student: Partial<Student> | null;
  lessons?: Lesson[];
  onSave: (student: Partial<Student>) => void;
  onDelete?: (id: string) => void;
  onClose: () => void;
  availableTags?: string[];
  onTagClick?: (tag: string) => void;
  onSeeAllLessons?: (studentId: string) => void;
  initialIsEditing?: boolean;
}

export default function StudentModal({ student, lessons = [], onSave, onDelete, onClose, availableTags = [], onTagClick, onSeeAllLessons, initialIsEditing = false }: StudentModalProps) {
  // Lock body scroll when modal is open
  useEffect(() => {
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, []);

  const [isEditing, setIsEditing] = useState(initialIsEditing || !student?.id);
  const [showConfirmClose, setShowConfirmClose] = useState(false);

  const [formData, setFormData] = useState<Partial<Student>>({
    name: '',
    email: '',
    phone: '',
    telegram: '',
    notes: '',
    tags: [],
    links: '',
    ...student
  });

  const studentLessons = lessons.filter(l => l.studentId === student?.id);
  const completedLessons = studentLessons.filter(l => l.completed);
  const totalMinutes = completedLessons.reduce((acc, l) => {
    if (!l.endTime) return acc;
    return acc + differenceInMinutes(new Date(l.endTime), new Date(l.startTime));
  }, 0);
  const totalHours = (totalMinutes / 60).toFixed(1);

  useEffect(() => {
    if (student) {
      setFormData(prev => ({ ...prev, ...student }));
    }
  }, [student]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const hasChanges = () => {
    if (!isEditing) return false;
    
    const initial = {
      name: '',
      email: '',
      phone: '',
      telegram: '',
      notes: '',
      tags: [],
      links: '',
      ...student
    };

    if (formData.name !== initial.name) return true;
    if (formData.email !== initial.email) return true;
    if (formData.phone !== initial.phone) return true;
    if (formData.telegram !== initial.telegram) return true;
    if (formData.notes !== initial.notes) return true;
    if (formData.links !== initial.links) return true;
    
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
    <div className="fixed inset-0 z-[70] overflow-y-auto bg-slate-900/60 p-4 backdrop-blur-md">
      <div className="flex min-h-full items-center justify-center py-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl"
        >
          <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-8 py-6">
            <h2 className="text-2xl font-black text-slate-900">
              {student?.id ? (isEditing ? 'Edit Student' : 'Student Profile') : 'New Student'}
            </h2>
            <div className="flex items-center gap-2">
              {student?.id && !isEditing && (
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

          <form onSubmit={handleSave} className="p-8 space-y-6">
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
                <User className="h-4 w-4" /> Full Name
              </label>
              {isEditing ? (
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-medium focus:border-brick-500 focus:ring-2 focus:ring-brick-200 outline-none transition-all"
                />
              ) : (
                <div className="flex items-center justify-between gap-4">
                  <div className="rounded-xl bg-slate-50 px-4 py-3 font-medium text-slate-900 border border-transparent flex-1">
                    {formData.name}
                  </div>
                  {student?.id && (
                    <button
                      type="button"
                      onClick={() => {
                        onSeeAllLessons?.(student.id!);
                        onClose();
                      }}
                      className="rounded-xl bg-brick-600 px-4 py-3 text-xs font-bold text-white shadow-lg shadow-brick-100 hover:bg-brick-700 transition-all active:scale-95"
                    >
                      See All Lessons
                    </button>
                  )}
                </div>
              )}
            </div>

            {!isEditing && student?.id && (
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-2xl bg-emerald-50 p-4 border border-emerald-100">
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Completed Lessons</span>
                  <p className="text-2xl font-black text-emerald-900">{completedLessons.length}</p>
                </div>
                <div className="rounded-2xl bg-brick-50 p-4 border border-brick-100">
                  <span className="text-[10px] font-black uppercase tracking-widest text-brick-600">Total Hours</span>
                  <p className="text-2xl font-black text-brick-900">{totalHours}h</p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {(isEditing || formData.email) && (
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
                    <Mail className="h-4 w-4" /> Email
                  </label>
                  {isEditing ? (
                  <input
                      type="email"
                      value={formData.email}
                      onChange={e => setFormData({ ...formData, email: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-medium focus:border-brick-500 focus:ring-2 focus:ring-brick-200 outline-none transition-all"
                    />
                  ) : (
                    <div className="rounded-xl bg-slate-50 px-4 py-3 font-medium text-slate-900 border border-transparent truncate">
                      {formData.email}
                    </div>
                  )}
                </div>
              )}
              {(isEditing || formData.phone) && (
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
                    <Phone className="h-4 w-4" /> Phone
                  </label>
                  {isEditing ? (
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={e => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-medium focus:border-brick-500 focus:ring-2 focus:ring-brick-200 outline-none transition-all"
                    />
                  ) : (
                    <div className="rounded-xl bg-slate-50 px-4 py-3 font-medium text-slate-900 border border-transparent">
                      {formData.phone}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {(isEditing || formData.telegram) && (
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
                    <Send className="h-4 w-4" /> Telegram
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      placeholder="@username"
                      value={formData.telegram}
                      onChange={e => setFormData({ ...formData, telegram: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-medium focus:border-brick-500 focus:ring-2 focus:ring-brick-200 outline-none transition-all"
                    />
                  ) : (
                    <div className="rounded-xl bg-slate-50 px-4 py-3 font-medium text-slate-900 border border-transparent">
                      <a 
                        href={`https://t.me/${formData.telegram!.replace(/^@/, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-brick-600 hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {formData.telegram}
                      </a>
                    </div>
                  )}
                </div>
              )}
              {(isEditing || formData.links) && (
                <div className="space-y-2">
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
            </div>

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
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
                  <FileText className="h-4 w-4" /> Notes
                </label>
                {isEditing ? (
                  <textarea
                    rows={4}
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

            <div className="flex items-center justify-between pt-4">
              {student?.id && isEditing && onDelete ? (
                <button
                  type="button"
                  onClick={() => onDelete(student.id!)}
                  className="flex items-center gap-2 text-sm font-bold text-red-500 hover:bg-red-50 px-4 py-2 rounded-xl transition-colors"
                >
                  <Trash2 className="h-5 w-5" /> Delete
                </button>
              ) : <div />}

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={handleCloseAttempt}
                  className="px-6 py-3 text-sm font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  {isEditing ? 'Cancel' : 'Close'}
                </button>
                {isEditing && (
                  <button
                    type="submit"
                    className="flex items-center gap-2 rounded-xl bg-brick-600 px-8 py-3 text-sm font-bold text-white shadow-lg shadow-brick-200 transition-all hover:bg-brick-700 active:scale-95"
                  >
                    <Save className="h-5 w-5" /> Save Student
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

