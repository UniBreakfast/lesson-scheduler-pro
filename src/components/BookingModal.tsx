import React, { useState, useEffect } from 'react';
import { X, Copy, Share2, Clock, User as UserIcon, Calendar, Check, AlertCircle } from 'lucide-react';
import { Student, Lesson, BookingLink } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { format, setHours, setMinutes, startOfDay, endOfDay, isBefore, isAfter, addMinutes } from 'date-fns';
import { calculateFreeSlots, TimeSlot, parseDate, getLocalDateString } from '../lib/bookingUtils';

interface BookingModalProps {
  date: Date;
  students: Student[];
  lessons: Lesson[];
  onGenerateLink: (linkData: Partial<BookingLink>) => Promise<string>;
  onClose: () => void;
}

export default function BookingModal({ date, students, lessons, onGenerateLink, onClose }: BookingModalProps) {
  const [workStart, setWorkStart] = useState(format(setHours(setMinutes(date, 0), 9), "yyyy-MM-dd'T'HH:mm"));
  const [workEnd, setWorkEnd] = useState(format(setHours(setMinutes(date, 0), 18), "yyyy-MM-dd'T'HH:mm"));
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [freeSlots, setFreeSlots] = useState<TimeSlot[]>([]);
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [isCopying, setIsCopying] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    const start = new Date(workStart);
    const end = new Date(workEnd);
    if (!isNaN(start.getTime()) && !isNaN(end.getTime()) && isBefore(start, end)) {
      const slots = calculateFreeSlots(date, start, end, lessons);
      setFreeSlots(slots);
    } else {
      setFreeSlots([]);
    }
  }, [workStart, workEnd, date, lessons]);

  const handleGenerate = async () => {
    if (!selectedStudentId || freeSlots.length === 0) return;
    
    setIsGenerating(true);
    try {
      const student = students.find(s => s.id === selectedStudentId);
      const linkId = await onGenerateLink({
        studentId: selectedStudentId,
        studentName: student?.name || 'Student',
        date: getLocalDateString(date),
        workStartTime: new Date(workStart).toISOString(),
        workEndTime: new Date(workEnd).toISOString(),
        lessonsSnapshot: lessons
          .filter(l => getLocalDateString(parseDate(l.startTime)) === getLocalDateString(date))
          .map(l => l.id),
        busySlots: lessons
          .filter(l => getLocalDateString(parseDate(l.startTime)) === getLocalDateString(date))
          .map(l => {
            const start = parseDate(l.startTime);
            const end = l.endTime ? parseDate(l.endTime) : addMinutes(start, 60);
            return {
              startTime: start.toISOString(),
              endTime: end.toISOString()
            };
          }),
        status: 'active'
      });
      
      const url = new URL(window.location.href);
      url.searchParams.set('booking', linkId);
      setGeneratedLink(url.toString());
    } catch (error) {
      console.error('Failed to generate link:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = () => {
    if (!generatedLink) return;
    navigator.clipboard.writeText(generatedLink);
    setIsCopying(true);
    setTimeout(() => setIsCopying(false), 2000);
  };

  const handleShare = async () => {
    if (!generatedLink) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Book a Lesson',
          text: `Hi! Here are my free slots for ${format(date, 'PPPP')}. Please pick a time that works for you.`,
          url: generatedLink,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      copyToClipboard();
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[80] overflow-y-auto bg-slate-900/60 p-4 backdrop-blur-md"
      onClick={onClose}
    >
      <div className="flex min-h-full items-center justify-center py-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-8 py-6">
            <h2 className="text-2xl font-black text-slate-900">Booking Availability</h2>
            <button onClick={onClose} className="rounded-full p-2 hover:bg-slate-200 transition-colors">
              <X className="h-6 w-6 text-slate-500" />
            </button>
          </div>

          <div className="p-8 space-y-6">
            <div className="rounded-2xl bg-brick-50 p-4 border border-brick-100 flex items-center gap-4">
              <Calendar className="h-8 w-8 text-brick-600" />
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-brick-600">Selected Date</p>
                <p className="text-lg font-bold text-brick-900">{format(date, 'PPPP')}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
                  <Clock className="h-4 w-4" /> Work Start
                </label>
                <input
                  type="datetime-local"
                  value={workStart}
                  onChange={e => setWorkStart(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-medium focus:border-brick-500 focus:ring-2 focus:ring-brick-200 outline-none transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
                  <Clock className="h-4 w-4" /> Work End
                </label>
                <input
                  type="datetime-local"
                  value={workEnd}
                  onChange={e => setWorkEnd(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-medium focus:border-brick-500 focus:ring-2 focus:ring-brick-200 outline-none transition-all"
                />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Free Intervals</h3>
              {freeSlots.length > 0 ? (
                <div className="grid grid-cols-1 gap-2">
                  {freeSlots.map((slot, idx) => (
                    <div key={idx} className="flex items-center justify-between rounded-xl bg-emerald-50 px-4 py-3 border border-emerald-100">
                      <span className="font-bold text-emerald-700">
                        {format(slot.start, 'HH:mm')} - {format(slot.end, 'HH:mm')}
                      </span>
                      <span className="text-xs font-medium text-emerald-600">
                        {Math.floor((slot.end.getTime() - slot.start.getTime()) / 60000)} min free
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl bg-slate-50 p-4 text-center border border-dashed border-slate-200">
                  <p className="text-sm text-slate-500">No free intervals found for this time range.</p>
                </div>
              )}
            </div>

            {!generatedLink ? (
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
                    <UserIcon className="h-4 w-4" /> Select Student
                  </label>
                  <select
                    value={selectedStudentId}
                    onChange={e => setSelectedStudentId(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-medium focus:border-brick-500 focus:ring-2 focus:ring-brick-200 outline-none transition-all"
                  >
                    <option value="">Choose a student...</option>
                    {students.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={handleGenerate}
                  disabled={!selectedStudentId || freeSlots.length === 0 || isGenerating}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-brick-600 px-8 py-4 text-sm font-bold text-white shadow-lg shadow-brick-200 transition-all hover:bg-brick-700 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isGenerating ? 'Generating...' : 'Provide Booking Link'}
                </button>
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4 pt-4 border-t border-slate-100"
              >
                <div className="rounded-2xl bg-emerald-50 p-4 border border-emerald-100 flex items-start gap-3">
                  <Check className="h-5 w-5 text-emerald-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-emerald-900">Link Generated!</p>
                    <p className="text-xs text-emerald-700">This link will become invalid if your schedule for this date changes.</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <div className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs font-mono text-slate-600 truncate">
                    {generatedLink}
                  </div>
                  <button
                    onClick={copyToClipboard}
                    className={`flex items-center justify-center rounded-xl px-4 transition-all ${isCopying ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                  >
                    {isCopying ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
                  </button>
                  <button
                    onClick={handleShare}
                    className="flex items-center justify-center rounded-xl bg-brick-600 px-4 text-white hover:bg-brick-700"
                  >
                    <Share2 className="h-5 w-5" />
                  </button>
                </div>
                <button
                  onClick={() => setGeneratedLink(null)}
                  className="w-full py-2 text-xs font-bold text-slate-400 hover:text-brick-600 transition-colors"
                >
                  Generate another link
                </button>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
