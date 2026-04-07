/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { auth, db, onAuthStateChanged, collection, query, where, onSnapshot, setDoc, doc, deleteDoc, User, OperationType, handleFirestoreError, testConnection } from './firebase';
import Layout from './components/Layout';
import CalendarViews from './components/CalendarViews';
import LessonDetails from './components/LessonDetails';
import StudentManager from './components/StudentManager';
import StudentModal from './components/StudentModal';
import { Lesson, Student, ViewType, LessonFilter } from './types';
import { format, addHours, startOfMonth, endOfMonth } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import { AlertCircle, Loader2 } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [view, setView] = useState<ViewType | 'students'>('month');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [editingLesson, setEditingLesson] = useState<Partial<Lesson> | null>(null);
  const [isEditingLessonMode, setIsEditingLessonMode] = useState(false);
  const [isAddingStudentFromLesson, setIsAddingStudentFromLesson] = useState(false);
  const [viewingStudentId, setViewingStudentId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [lessonFilters, setLessonFilters] = useState<LessonFilter>({
    startDate: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    endDate: format(endOfMonth(new Date()), 'yyyy-MM-dd'),
    tags: [],
    search: '',
    studentId: null
  });

  const handleNavigateToLessons = (filters: Partial<LessonFilter>) => {
    setLessonFilters(prev => ({ ...prev, ...filters }));
    setView('period');
  };

  useEffect(() => {
    testConnection();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user || !isAuthReady) {
      setLessons([]);
      setStudents([]);
      return;
    }

    const lessonsQuery = query(collection(db, 'lessons'), where('teacherUid', '==', user.uid));
    const studentsQuery = query(collection(db, 'students'), where('teacherUid', '==', user.uid));

    const unsubscribeLessons = onSnapshot(lessonsQuery, (snapshot) => {
      const lessonsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Lesson));
      setLessons(lessonsData);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'lessons'));

    const unsubscribeStudents = onSnapshot(studentsQuery, (snapshot) => {
      const studentsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Student));
      setStudents(studentsData);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'students'));

    return () => {
      unsubscribeLessons();
      unsubscribeStudents();
    };
  }, [user, isAuthReady]);

  // Collect unique tags from both students and lessons
  const availableTags = Array.from(new Set([
    ...students.flatMap(s => s.tags || []),
    ...lessons.flatMap(l => l.tags || [])
  ])).sort();

  const handleSaveLesson = async (lessonData: Partial<Lesson>) => {
    if (!user) return;
    try {
      const lessonId = lessonData.id || doc(collection(db, 'lessons')).id;
      
      // Clean up undefined values so they are removed from Firestore
      const finalData: any = {
        ...lessonData,
        id: lessonId,
        teacherUid: user.uid,
      };

      // Explicitly remove undefined fields to ensure they are deleted in Firestore
      Object.keys(finalData).forEach(key => {
        if (finalData[key] === undefined) {
          delete finalData[key];
        }
      });

      await setDoc(doc(db, 'lessons', lessonId), finalData);
      setEditingLesson(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'lessons');
    }
  };

  const handleDeleteLesson = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'lessons', id));
      setEditingLesson(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, 'lessons');
    }
  };

  const handleSaveStudent = async (studentData: Partial<Student>) => {
    if (!user) return;
    try {
      const studentId = studentData.id || doc(collection(db, 'students')).id;
      const finalData = {
        ...studentData,
        id: studentId,
        teacherUid: user.uid,
      };
      await setDoc(doc(db, 'students', studentId), finalData);
      return studentId;
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'students');
    }
  };

  const handleDeleteStudent = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'students', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, 'students');
    }
  };

  const handleSaveData = () => {
    if (!user) return;
    
    const data = {
      version: '1.1',
      exportDate: new Date().toISOString(),
      teacherUid: user.uid,
      lessons: lessons.map(({ teacherUid, ...rest }) => rest),
      students: students.map(({ teacherUid, ...rest }) => rest)
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const kyivDate = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Europe/Kyiv',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(new Date());

    const link = document.createElement('a');
    link.href = url;
    link.download = `lsp-${kyivDate}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleLoadData = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file || !user) return;

      setIsImporting(true);
      try {
        const text = await file.text();
        const data = JSON.parse(text);

        if (!data.lessons || !data.students) {
          throw new Error('Invalid file format: missing lessons or students data');
        }

        const isSameAccount = data.teacherUid === user.uid;
        const studentIdMap: Record<string, string> = {};

        // Import students
        const studentPromises = data.students.map(async (s: any) => {
          if (!s.id || !s.name) return;
          
          const oldId = s.id;
          // If different account, generate a new ID. If same, keep original to update.
          const newId = isSameAccount ? oldId : doc(collection(db, 'students')).id;
          studentIdMap[oldId] = newId;

          const { id, teacherUid, ...rest } = s;
          await setDoc(doc(db, 'students', newId), {
            ...rest,
            id: newId,
            teacherUid: user.uid
          });
        });

        // Wait for students to be processed so we have the ID map
        await Promise.all(studentPromises);

        // Import lessons
        const lessonPromises = data.lessons.map(async (l: any) => {
          if (!l.id || !l.startTime) return;

          const oldId = l.id;
          const newId = isSameAccount ? oldId : doc(collection(db, 'lessons')).id;
          
          const { id, teacherUid, studentId, ...rest } = l;
          
          // Link to the new student ID if we generated one
          const mappedStudentId = studentId ? (studentIdMap[studentId] || studentId) : studentId;

          await setDoc(doc(db, 'lessons', newId), {
            ...rest,
            id: newId,
            studentId: mappedStudentId,
            teacherUid: user.uid
          });
        });

        await Promise.all(lessonPromises);
        alert('Data imported successfully!');
      } catch (err) {
        console.error('Import failed:', err);
        setError(err instanceof Error ? err.message : 'Failed to import data');
      } finally {
        setIsImporting(false);
      }
    };
    input.click();
  };

  if (!isAuthReady) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
        >
          <Loader2 className="h-10 w-10 text-brick-600" />
        </motion.div>
      </div>
    );
  }

  return (
    <Layout 
      user={user} 
      activeView={view} 
      onViewChange={setView}
      onSaveData={handleSaveData}
      onLoadData={handleLoadData}
    >
      <AnimatePresence mode="wait">
        {!user ? (
          <motion.div
            key="login-prompt"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-20 text-center"
          >
            <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-brick-100 text-brick-600 shadow-xl shadow-brick-100">
              <AlertCircle className="h-12 w-12" />
            </div>
            <h2 className="mt-8 text-4xl font-black text-slate-900">Welcome to LessonSchedulerPro</h2>
            <p className="mt-4 max-w-md text-lg text-slate-500">
              Your intelligent assistant for managing students and lessons. Sign in to start scheduling.
            </p>
          </motion.div>
        ) : (
          <motion.div
            key={view}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {view === 'students' ? (
              <StudentManager
                students={students}
                lessons={lessons}
                availableTags={availableTags}
                onSave={handleSaveStudent}
                onDelete={handleDeleteStudent}
                onNavigateToLessons={handleNavigateToLessons}
              />
            ) : (
              <CalendarViews
                lessons={lessons}
                students={students}
                view={view as ViewType}
                setView={(v) => setView(v as ViewType)}
                selectedDate={selectedDate}
                setSelectedDate={setSelectedDate}
                onAddLesson={(date) => {
                  setIsEditingLessonMode(true);
                  setEditingLesson({ 
                    startTime: date.toISOString(), 
                    tags: [],
                    links: ''
                  });
                }}
                onEditLesson={(lesson, isEditing = false) => {
                  setIsEditingLessonMode(isEditing);
                  setEditingLesson(lesson);
                }}
                onDeleteLesson={handleDeleteLesson}
                filters={lessonFilters}
                onFilterChange={setLessonFilters}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {editingLesson && (
          <LessonDetails
            lesson={editingLesson}
            students={students}
            availableTags={availableTags}
            onSave={handleSaveLesson}
            onDelete={handleDeleteLesson}
            onClose={() => {
              setEditingLesson(null);
              setIsEditingLessonMode(false);
            }}
            onAddNewStudent={() => setIsAddingStudentFromLesson(true)}
            onViewStudent={(studentId) => setViewingStudentId(studentId)}
            onTagClick={(tag) => handleNavigateToLessons({ tags: [tag], studentId: null, search: '' })}
            initialIsEditing={isEditingLessonMode}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isAddingStudentFromLesson && (
          <StudentModal
            student={{ name: '', email: '', phone: '', telegram: '', notes: '', tags: [], links: '' }}
            lessons={lessons}
            availableTags={availableTags}
            onSave={async (data) => {
              const newId = await handleSaveStudent(data);
              if (newId && editingLesson) {
                setEditingLesson({ ...editingLesson, studentId: newId });
              }
              setIsAddingStudentFromLesson(false);
            }}
            onClose={() => setIsAddingStudentFromLesson(false)}
            onTagClick={(tag) => handleNavigateToLessons({ tags: [tag], studentId: null, search: '' })}
            onSeeAllLessons={(studentId) => handleNavigateToLessons({ studentId, tags: [], search: '' })}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {viewingStudentId && (
          <StudentModal
            student={students.find(s => s.id === viewingStudentId) || null}
            lessons={lessons}
            availableTags={availableTags}
            onSave={handleSaveStudent}
            onClose={() => setViewingStudentId(null)}
            onTagClick={(tag) => {
              setViewingStudentId(null);
              setEditingLesson(null);
              handleNavigateToLessons({ tags: [tag], studentId: null, search: '' });
            }}
            onSeeAllLessons={(studentId) => {
              setViewingStudentId(null);
              setEditingLesson(null);
              handleNavigateToLessons({ studentId, tags: [], search: '' });
            }}
          />
        )}
      </AnimatePresence>

      {error && (
        <div className="fixed bottom-8 right-8 z-[100] max-w-md animate-bounce rounded-2xl bg-red-600 p-4 text-white shadow-2xl">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-6 w-6" />
            <div className="flex-1">
              <p className="font-bold">An error occurred</p>
              <p className="text-sm opacity-90">{error}</p>
            </div>
            <button onClick={() => setError(null)} className="rounded-full p-1 hover:bg-white/20">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      {isImporting && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
          <div className="rounded-3xl bg-white p-8 shadow-2xl text-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
              className="mx-auto mb-4"
            >
              <Loader2 className="h-10 w-10 text-brick-600" />
            </motion.div>
            <p className="font-bold text-slate-900">Importing Data...</p>
            <p className="text-sm text-slate-500">Please wait while we update your database.</p>
          </div>
        </div>
      )}
    </Layout>
  );
}

function X({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6 6 18" /><path d="m6 6 12 12" />
    </svg>
  );
}

