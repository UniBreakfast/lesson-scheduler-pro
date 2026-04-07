import React from 'react';
import { auth, signOut, googleProvider, signInWithPopup } from '../firebase';
import { User } from 'firebase/auth';
import { LogOut, LogIn, Calendar, Users, List, Download, Upload, Bell, Link as LinkIcon, Keyboard } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Lesson } from '../types';
import { isSameDay, isSameWeek, isSameMonth, isSameYear, differenceInMinutes } from 'date-fns';

interface LayoutProps {
  user: User | null;
  children: React.ReactNode;
  activeView: string;
  onViewChange: (view: any) => void;
  onSaveData?: () => void;
  onLoadData?: () => void;
  pendingRequestsCount?: number;
  onOpenNotifications?: () => void;
  onOpenBookingLinks?: () => void;
  onOpenHotkeys?: () => void;
  lessons?: Lesson[];
  selectedDate?: Date;
}

export default function Layout({ 
  user, 
  children, 
  activeView, 
  onViewChange, 
  onSaveData, 
  onLoadData, 
  pendingRequestsCount = 0, 
  onOpenNotifications, 
  onOpenBookingLinks,
  onOpenHotkeys,
  lessons = [],
  selectedDate = new Date()
}: LayoutProps) {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  const stats = React.useMemo(() => {
    if (!lessons.length || !['year', 'month', 'week', 'day'].includes(activeView)) return null;

    const filteredLessons = lessons.filter(l => {
      const lDate = new Date(l.startTime);
      if (activeView === 'day') return isSameDay(lDate, selectedDate);
      if (activeView === 'week') return isSameWeek(lDate, selectedDate, { weekStartsOn: 1 });
      if (activeView === 'month') return isSameMonth(lDate, selectedDate);
      if (activeView === 'year') return isSameYear(lDate, selectedDate);
      return false;
    });

    const totalMinutes = filteredLessons.reduce((acc, l) => {
      if (!l.endTime) return acc;
      try {
        return acc + differenceInMinutes(new Date(l.endTime), new Date(l.startTime));
      } catch (e) {
        return acc;
      }
    }, 0);

    return {
      count: filteredLessons.length,
      hours: (totalMinutes / 60).toFixed(1)
    };
  }, [lessons, selectedDate, activeView]);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <nav className="sticky top-0 z-50 border-b border-slate-200 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 relative" ref={menuRef}>
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-brick-600 text-white shadow-lg shadow-brick-200 transition-transform active:scale-95 hover:bg-brick-700"
            >
              <Calendar className="h-6 w-6" />
            </button>
            <h1 className="hidden text-xl font-bold tracking-tight text-slate-900 sm:block">
              LessonScheduler<span className="text-brick-600">Pro</span>
            </h1>

            <AnimatePresence>
              {isMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute left-0 top-full mt-2 w-56 rounded-2xl bg-white p-2 shadow-2xl border border-slate-100"
                >
                    <button
                      onClick={() => {
                        onOpenBookingLinks?.();
                        setIsMenuOpen(false);
                      }}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 hover:text-brick-600 transition-all"
                    >
                      <LinkIcon className="h-4 w-4" />
                      Booking Links History
                    </button>
                    <button
                      onClick={() => {
                        onOpenHotkeys?.();
                        setIsMenuOpen(false);
                      }}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 hover:text-brick-600 transition-all"
                    >
                      <Keyboard className="h-4 w-4" />
                      Keyboard Shortcuts
                    </button>
                    <div className="px-3 py-2 mb-1 mt-2">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Data Management</p>
                    </div>
                  <button
                    onClick={() => {
                      onSaveData?.();
                      setIsMenuOpen(false);
                    }}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 hover:text-brick-600 transition-all"
                  >
                    <Download className="h-4 w-4" />
                    Save all data as JSON
                  </button>
                  <button
                    onClick={() => {
                      onLoadData?.();
                      setIsMenuOpen(false);
                    }}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 hover:text-brick-600 transition-all"
                  >
                    <Upload className="h-4 w-4" />
                    Load data from JSON
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            {user ? (
              <>
                <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1 sm:gap-2">
                  <NavButton
                    active={activeView === 'year' || activeView === 'month' || activeView === 'week' || activeView === 'day'}
                    onClick={() => onViewChange('month')}
                    icon={<Calendar className="h-4 w-4" />}
                    label="Calendar"
                  />
                  <NavButton
                    active={activeView === 'period'}
                    onClick={() => onViewChange('period')}
                    icon={<List className="h-4 w-4" />}
                    label="List"
                  />
                  <NavButton
                    active={activeView === 'students'}
                    onClick={() => onViewChange('students')}
                    icon={<Users className="h-4 w-4" />}
                    label="Students"
                  />
                </div>

                <div className="h-6 w-px bg-slate-200" />

                <div className="flex items-center gap-3">
                  <button
                    onClick={onOpenNotifications}
                    className="relative flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-brick-600 transition-colors"
                    title="Booking Requests"
                  >
                    <Bell className="h-5 w-5" />
                    {pendingRequestsCount > 0 && (
                      <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white">
                        {pendingRequestsCount}
                      </span>
                    )}
                  </button>
                  <div className="hidden flex-col items-end lg:flex">
                    <span className="text-sm font-medium">{user.displayName}</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-black uppercase tracking-tighter text-brick-500 bg-brick-50 px-1.5 py-0.5 rounded">
                        {Intl.DateTimeFormat().resolvedOptions().timeZone}
                      </span>
                      <span className="text-xs text-slate-500">{user.email}</span>
                    </div>
                  </div>
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt="Profile"
                      className="h-9 w-9 rounded-full border border-slate-200 shadow-sm"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brick-100 text-brick-600">
                      {user.displayName?.[0] || user.email?.[0]}
                    </div>
                  )}
                  <button
                    onClick={handleLogout}
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                    title="Logout"
                  >
                    <LogOut className="h-5 w-5" />
                  </button>
                </div>
              </>
            ) : (
              <button
                onClick={handleLogin}
                className="flex items-center gap-2 rounded-lg bg-brick-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-brick-200 transition-all hover:bg-brick-700 active:scale-95"
              >
                <LogIn className="h-4 w-4" />
                Sign In with Google
              </button>
            )}
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {children}
      </main>

      <footer className="mt-auto border-t border-slate-200 bg-white py-8">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          {stats && (
            <div className="mb-4 flex items-center justify-center gap-6">
              <div className="flex flex-col items-center">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Lessons</span>
                <span className="text-lg font-bold text-slate-900">{stats.count}</span>
              </div>
              <div className="h-8 w-px bg-slate-200" />
              <div className="flex flex-col items-center">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Hours</span>
                <span className="text-lg font-bold text-slate-900">{stats.hours}h</span>
              </div>
            </div>
          )}
          <div className="text-sm text-slate-500">
            &copy; {new Date().getFullYear()} LessonSchedulerPro.
          </div>
        </div>
      </footer>
    </div>
  );
}

function NavButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-all ${
        active
          ? 'bg-white text-brick-600 shadow-sm'
          : 'text-slate-600 hover:bg-slate-200/50 hover:text-slate-900'
      }`}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}
