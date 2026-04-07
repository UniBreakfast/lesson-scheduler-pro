import React, { useState, useEffect } from 'react';
import { db, collection, doc, getDoc, setDoc, query, where, getDocs } from '../firebase';
import { BookingLink, BookingRequest, Lesson } from '../types';
import { format, isBefore, isAfter, addMinutes, parseISO } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import { Clock, Calendar, User as UserIcon, BookOpen, FileText, Check, AlertCircle, Loader2 } from 'lucide-react';
import { calculateFreeSlots, TimeSlot, parseDate, getLocalDateString } from '../lib/bookingUtils';

interface StudentBookingViewProps {
  linkId: string;
}

export default function StudentBookingView({ linkId }: StudentBookingViewProps) {
  const [link, setLink] = useState<BookingLink | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [freeSlots, setFreeSlots] = useState<TimeSlot[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [formData, setFormData] = useState({
    startTime: '',
    endTime: '',
    subject: '',
    notes: ''
  });

  useEffect(() => {
    async function fetchLink() {
      try {
        const linkDoc = await getDoc(doc(db, 'bookingLinks', linkId));
        if (!linkDoc.exists()) {
          setError('This booking link does not exist.');
          return;
        }
        const linkData = { id: linkDoc.id, ...linkDoc.data() } as BookingLink;
        
        if (linkData.status !== 'active') {
          setError('This booking link is no longer active.');
          return;
        }

        setLink(linkData);
        
        // Convert busySlots to Lesson-like objects for calculateFreeSlots
        const mockLessons: Lesson[] = (linkData.busySlots || []).map((slot, idx) => ({
          id: `busy-${idx}`,
          startTime: slot.startTime,
          endTime: slot.endTime,
          teacherUid: linkData.teacherUid
        }));

        const slots = calculateFreeSlots(
          new Date(linkData.date),
          new Date(linkData.workStartTime),
          new Date(linkData.workEndTime),
          mockLessons
        );
        setFreeSlots(slots);
        
        // Default form times
        if (slots.length > 0) {
          setFormData(prev => ({
            ...prev,
            startTime: format(slots[0].start, "yyyy-MM-dd'T'HH:mm"),
            endTime: format(addMinutes(slots[0].start, 60), "yyyy-MM-dd'T'HH:mm")
          }));
        }

      } catch (err) {
        console.error('Error fetching booking link:', err);
        setError('Failed to load booking information.');
      } finally {
        setLoading(false);
      }
    }

    fetchLink();
  }, [linkId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!link) return;

    const start = new Date(formData.startTime);
    const end = new Date(formData.endTime);

    if (isBefore(end, start)) {
      alert('End time must be after start time.');
      return;
    }

    // Check if within free slots
    const isWithinSlot = freeSlots.some(slot => 
      (isAfter(start, slot.start) || start.getTime() === slot.start.getTime()) &&
      (isBefore(end, slot.end) || end.getTime() === slot.end.getTime())
    );

    if (!isWithinSlot) {
      alert('Selected time is not within the available free slots.');
      return;
    }

    setIsSubmitting(true);
    try {
      const requestId = doc(collection(db, 'bookingRequests')).id;
      const request: BookingRequest = {
        id: requestId,
        studentId: link.studentId,
        studentName: link.studentName,
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        subject: formData.subject,
        notes: formData.notes,
        teacherUid: link.teacherUid,
        status: 'pending',
        createdAt: new Date().toISOString(),
        bookingLinkId: link.id
      };

      await setDoc(doc(db, 'bookingRequests', requestId), request);
      setSubmitted(true);
    } catch (err) {
      console.error('Error submitting booking request:', err);
      alert('Failed to submit booking request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-brick-600 mx-auto" />
          <p className="text-slate-600 font-medium">Loading availability...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
        <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-xl border border-red-100 text-center space-y-6">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-600">
            <AlertCircle className="h-8 w-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-slate-900">Link Invalid</h2>
            <p className="text-slate-500">{error}</p>
          </div>
          <button 
            onClick={() => window.location.href = '/'}
            className="w-full rounded-xl bg-slate-100 py-3 text-sm font-bold text-slate-600 hover:bg-slate-200 transition-colors"
          >
            Go to Homepage
          </button>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md rounded-3xl bg-white p-8 shadow-xl border border-emerald-100 text-center space-y-6"
        >
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
            <Check className="h-8 w-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-slate-900">Request Sent!</h2>
            <p className="text-slate-500">Your booking request has been sent to {link?.teacherName}. You will be notified once they accept or deny it.</p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4 text-left space-y-2">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
              <Calendar className="h-4 w-4" /> {format(new Date(formData.startTime), 'PPPP')}
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Clock className="h-4 w-4" /> {format(new Date(formData.startTime), 'HH:mm')} - {format(new Date(formData.endTime), 'HH:mm')}
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="mx-auto max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="overflow-hidden rounded-3xl bg-white shadow-xl"
        >
          <div className="bg-brick-600 p-8 text-white">
            <h1 className="text-3xl font-black">Book a Lesson</h1>
            <p className="mt-2 opacity-90 font-medium">with {link?.teacherName}</p>
          </div>

          <div className="p-8 space-y-8">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <h3 className="flex items-center gap-2 text-sm font-bold text-slate-700 uppercase tracking-wider">
                  <Calendar className="h-4 w-4" /> Date & Availability
                </h3>
                <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100">
                  <p className="text-lg font-bold text-slate-900">{format(new Date(link!.date), 'PPPP')}</p>
                </div>
                
                <div className="space-y-2">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Free Slots</p>
                  <div className="flex flex-wrap gap-2">
                    {freeSlots.map((slot, idx) => (
                      <div key={idx} className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 border border-emerald-100">
                        {format(slot.start, 'HH:mm')} - {format(slot.end, 'HH:mm')}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <h3 className="flex items-center gap-2 text-sm font-bold text-slate-700 uppercase tracking-wider">
                  <Clock className="h-4 w-4" /> Your Request
                </h3>
                
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500">Start Time</label>
                    <input
                      type="datetime-local"
                      required
                      value={formData.startTime}
                      onChange={e => setFormData({ ...formData, startTime: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-medium focus:border-brick-500 focus:ring-2 focus:ring-brick-200 outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500">End Time</label>
                    <input
                      type="datetime-local"
                      required
                      value={formData.endTime}
                      onChange={e => setFormData({ ...formData, endTime: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-medium focus:border-brick-500 focus:ring-2 focus:ring-brick-200 outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-500">
                    <BookOpen className="h-3 w-3" /> Subject
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="What do you want to learn?"
                    value={formData.subject}
                    onChange={e => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-medium focus:border-brick-500 focus:ring-2 focus:ring-brick-200 outline-none transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-500">
                    <FileText className="h-3 w-3" /> Notes (Optional)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Any specific topics or questions?"
                    value={formData.notes}
                    onChange={e => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-medium focus:border-brick-500 focus:ring-2 focus:ring-brick-200 outline-none transition-all"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-brick-600 px-8 py-4 text-sm font-bold text-white shadow-lg shadow-brick-200 transition-all hover:bg-brick-700 active:scale-95 disabled:opacity-50"
                >
                  {isSubmitting ? 'Submitting...' : 'Book a Lesson'}
                </button>
              </form>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
