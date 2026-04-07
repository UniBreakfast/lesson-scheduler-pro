import React, { useState } from 'react';
import { format } from 'date-fns';
import { X, Save, Trash2, User as UserIcon, Mail, Phone, FileText, Plus, Search, Send, Tag as TagIcon, LayoutGrid, LayoutList, ChevronLeft, MoreVertical, Edit, ExternalLink } from 'lucide-react';
import { Student, Lesson } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import StudentModal from './StudentModal';
import LinkRenderer from './LinkRenderer';
import ConfirmationModal from './ConfirmationModal';

interface StudentManagerProps {
  students: Student[];
  lessons: Lesson[];
  onSave: (student: Partial<Student>) => void;
  onDelete: (id: string) => void;
  availableTags?: string[];
  onNavigateToLessons?: (filters: any) => void;
}

export default function StudentManager({ students, lessons, onSave, onDelete, availableTags = [], onNavigateToLessons }: StudentManagerProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Partial<Student> | null>(null);
  const [isEditingMode, setIsEditingMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'cards' | 'list'>('cards');
  const [studentToDelete, setStudentToDelete] = useState<string | null>(null);
  const [sortConfig, setSortConfig] = useState<{ key: keyof Student | 'latestActivity'; direction: 'asc' | 'desc' }>({
    key: 'latestActivity',
    direction: 'desc'
  });

  const getLatestActivity = (studentId: string) => {
    const studentLessons = lessons.filter(l => l.studentId === studentId);
    if (studentLessons.length === 0) return 0;
    return Math.max(...studentLessons.map(l => new Date(l.startTime).getTime()));
  };

  const filteredStudents = students
    .filter(s => 
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      s.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.tags?.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    .sort((a, b) => {
      const aValue = sortConfig.key === 'latestActivity' ? getLatestActivity(a.id) : (a[sortConfig.key] || '');
      const bValue = sortConfig.key === 'latestActivity' ? getLatestActivity(b.id) : (b[sortConfig.key] || '');
      
      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

  const toggleSort = (key: keyof Student | 'latestActivity') => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc'
    }));
  };

  const SortIcon = ({ column }: { column: keyof Student | 'latestActivity' }) => {
    if (sortConfig.key !== column) return <MoreVertical className="h-3 w-3 opacity-20" />;
    return sortConfig.direction === 'asc' ? <ChevronLeft className="h-3 w-3 rotate-90" /> : <ChevronLeft className="h-3 w-3 -rotate-90" />;
  };

  React.useEffect(() => {
    setSearchTerm('');
  }, []);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <h2 className="text-3xl font-black text-slate-900">Student Directory</h2>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
              <button
                onClick={() => setViewMode('cards')}
                className={`rounded-lg p-2 transition-all ${viewMode === 'cards' ? 'bg-brick-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-50'}`}
                title="Card View"
              >
                <LayoutGrid className="h-5 w-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`rounded-lg p-2 transition-all ${viewMode === 'list' ? 'bg-brick-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-50'}`}
                title="List View"
              >
                <LayoutList className="h-5 w-5" />
              </button>
            </div>
            <button
              onClick={() => {
                setEditingStudent({ name: '', email: '', phone: '', telegram: '', notes: '', tags: [], links: '' });
                setIsAdding(true);
              }}
              className="flex items-center gap-2 rounded-xl bg-brick-600 p-2.5 sm:px-6 sm:py-2.5 text-sm font-bold text-white shadow-lg shadow-brick-200 transition-all hover:bg-brick-700 active:scale-95"
            >
              <Plus className="h-5 w-5" />
              <span className="hidden sm:inline">Add Student</span>
            </button>
          </div>
        </div>

        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search students or tags..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-3 text-sm shadow-sm focus:border-brick-500 focus:ring-2 focus:ring-brick-200 outline-none transition-all"
          />
        </div>
      </div>

      {viewMode === 'cards' ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredStudents.map(student => (
            <motion.div
              key={student.id}
              whileHover={{ y: -4 }}
              onClick={() => {
                setEditingStudent(student);
                setIsAdding(true);
              }}
              className="group relative flex cursor-pointer flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:border-brick-300 hover:shadow-xl"
            >
              <div className="flex items-start justify-between">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brick-50 text-brick-600 group-hover:bg-brick-600 group-hover:text-white transition-colors">
                  <UserIcon className="h-8 w-8" />
                </div>
                <div className="rounded-lg p-2 text-slate-400 group-hover:text-brick-600 transition-colors">
                  <FileText className="h-5 w-5" />
                </div>
              </div>
              
              <div className="mt-6">
                <h3 className="text-xl font-black text-slate-900">{student.name}</h3>
                
                {student.tags && student.tags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {student.tags.map(tag => (
                      <button
                        key={tag}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSearchTerm(tag);
                        }}
                        className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500 hover:bg-brick-50 hover:text-brick-600 transition-colors"
                      >
                        #{tag}
                      </button>
                    ))}
                  </div>
                )}

                <div className="mt-4 space-y-2">
                  {student.email && (
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <Mail className="h-4 w-4" /> {student.email}
                    </div>
                  )}
                  {student.phone && (
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <Phone className="h-4 w-4" /> {student.phone}
                    </div>
                  )}
                  {student.telegram && (
                    <a 
                      href={`https://t.me/${student.telegram.replace(/^@/, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex w-fit items-center gap-2 text-sm text-brick-600 font-medium hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Send className="h-4 w-4" /> {student.telegram}
                    </a>
                  )}
                </div>
              </div>

              <div className="mt-4">
                <LinkRenderer links={student.links} />
              </div>

              <div className="mt-6 flex-1">
                <p className="text-sm text-slate-500 line-clamp-3 italic">
                  {student.notes || 'No notes for this student.'}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-[800px] w-full text-left">
            <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th 
                  className="cursor-pointer px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4 hover:bg-slate-100 transition-colors"
                  onClick={() => toggleSort('name')}
                >
                  <div className="flex items-center gap-2">
                    Student <SortIcon column="name" />
                  </div>
                </th>
                <th 
                  className="cursor-pointer px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4 hover:bg-slate-100 transition-colors"
                  onClick={() => toggleSort('email')}
                >
                  <div className="flex items-center gap-2">
                    Contact <SortIcon column="email" />
                  </div>
                </th>
                <th 
                  className="cursor-pointer px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4 hover:bg-slate-100 transition-colors"
                  onClick={() => toggleSort('latestActivity')}
                >
                  <div className="flex items-center gap-2">
                    Latest Activity <SortIcon column="latestActivity" />
                  </div>
                </th>
                <th className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4">Tags</th>
                <th className="hidden px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4 text-right lg:table-cell">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.map((student) => {
                const latest = getLatestActivity(student.id);
                return (
                  <tr 
                    key={student.id} 
                    className="group cursor-pointer hover:bg-slate-50 transition-colors"
                    onClick={() => {
                      setEditingStudent(student);
                      setIsAdding(true);
                    }}
                  >
                    <td className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brick-50 text-brick-600 group-hover:bg-brick-600 group-hover:text-white transition-colors">
                          <UserIcon className="h-5 w-5" />
                        </div>
                        <span className="font-bold text-slate-900 group-hover:text-brick-600 transition-colors">{student.name}</span>
                      </div>
                    </td>
                    <td className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4">
                      <div className="flex flex-col gap-1">
                        {student.telegram && (
                          <a 
                            href={`https://t.me/${student.telegram.replace(/^@/, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex w-fit items-center gap-1 text-xs text-brick-600 font-medium hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Send className="h-3 w-3" /> {student.telegram}
                          </a>
                        )}
                        {student.email && (
                          <div className="flex items-center gap-1 text-xs text-slate-500">
                            <Mail className="h-3 w-3" /> {student.email}
                          </div>
                        )}
                        {student.phone && (
                          <div className="flex items-center gap-1 text-xs text-slate-400">
                            <Phone className="h-3 w-3" /> {student.phone}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4">
                      <span className="text-xs font-medium text-slate-600">
                        {latest ? format(latest, 'MMM d, HH:mm') : 'No activity'}
                      </span>
                    </td>
                    <td className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4">
                      <div className="flex flex-wrap gap-1">
                        {student.tags?.map(tag => (
                          <button
                            key={tag}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSearchTerm(tag);
                            }}
                            className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500 hover:bg-brick-50 hover:text-brick-600 transition-colors"
                          >
                            #{tag}
                          </button>
                        ))}
                      </div>
                    </td>
                    <td className="hidden px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4 text-right lg:table-cell">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingStudent(student);
                            setIsEditingMode(true);
                            setIsAdding(true);
                          }}
                          className="p-1.5 text-brick-600 hover:bg-brick-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setStudentToDelete(student.id);
                          }}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <AnimatePresence>
        {studentToDelete && (
          <ConfirmationModal
            isOpen={!!studentToDelete}
            onClose={() => setStudentToDelete(null)}
            onConfirm={() => {
              if (studentToDelete) {
                onDelete(studentToDelete);
                setStudentToDelete(null);
              }
            }}
            title="Delete Student"
            message="Are you sure you want to delete this student? This action cannot be undone and will remove all their data."
            confirmLabel="Delete"
            variant="danger"
          />
        )}
        {isAdding && editingStudent && (
          <StudentModal
            student={editingStudent}
            lessons={lessons}
            availableTags={availableTags}
            onSave={(data) => {
              onSave(data);
              setIsAdding(false);
              setEditingStudent(null);
            }}
            onDelete={(id) => {
              onDelete(id);
              setIsAdding(false);
              setEditingStudent(null);
            }}
            onClose={() => {
              setIsAdding(false);
              setEditingStudent(null);
              setIsEditingMode(false);
            }}
            onTagClick={(tag) => {
              setSearchTerm(tag);
              setIsAdding(false);
              setEditingStudent(null);
            }}
            onSeeAllLessons={(studentId) => onNavigateToLessons?.({ studentId, tags: [], search: '' })}
            initialIsEditing={isEditingMode}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
