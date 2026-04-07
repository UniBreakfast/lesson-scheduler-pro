import React, { useState, useEffect } from 'react';
import { db, collection, query, where, onSnapshot, doc, setDoc, deleteDoc } from '../firebase';
import { BookingLink, Student } from '../types';
import { format, isAfter, parseISO } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import { Link as LinkIcon, Trash2, ExternalLink, CheckCircle2, AlertCircle, Clock, User as UserIcon, Calendar, Filter, Search, X } from 'lucide-react';
import { parseDate } from '../lib/bookingUtils';

interface BookingLinksManagerProps {
  teacherUid: string;
  students: Student[];
  onClose: () => void;
}

export default function BookingLinksManager({ teacherUid, students, onClose }: BookingLinksManagerProps) {
  const [links, setLinks] = useState<BookingLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'used' | 'invalid'>('all');

  useEffect(() => {
    const q = query(collection(db, 'bookingLinks'), where('teacherUid', '==', teacherUid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const linksData = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as BookingLink));
      setLinks(linksData.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      setLoading(false);
    });
    return unsubscribe;
  }, [teacherUid]);

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this booking link?')) {
      await deleteDoc(doc(db, 'bookingLinks', id));
    }
  };

  const handleToggleStatus = async (link: BookingLink) => {
    const newStatus = link.status === 'active' ? 'invalid' : 'active';
    await setDoc(doc(db, 'bookingLinks', link.id), { status: newStatus }, { merge: true });
  };

  const filteredLinks = links.filter(link => {
    const matchesSearch = 
      link.studentName.toLowerCase().includes(search.toLowerCase()) ||
      link.date.includes(search);
    const matchesStatus = statusFilter === 'all' || link.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-emerald-700 border border-emerald-200">Active</span>;
      case 'used':
        return <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-blue-700 border border-blue-200">Used</span>;
      case 'invalid':
        return <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-slate-700 border border-slate-200">Invalid</span>;
      default:
        return null;
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[100] overflow-y-auto bg-slate-900/60 p-4 backdrop-blur-md"
      onClick={onClose}
    >
      <div className="flex min-h-full items-center justify-center py-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="w-full max-w-4xl overflow-hidden rounded-3xl bg-white shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-8 py-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brick-600 text-white shadow-lg shadow-brick-200">
                <LinkIcon className="h-6 w-6" />
              </div>
              <h2 className="text-2xl font-black text-slate-900">Booking Links History</h2>
            </div>
            <button onClick={onClose} className="rounded-full p-2 hover:bg-slate-200 transition-colors">
              <X className="h-6 w-6 text-slate-500" />
            </button>
          </div>

          <div className="p-8">
            <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by student or date..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 py-3 text-sm font-medium focus:border-brick-500 focus:ring-2 focus:ring-brick-200 outline-none transition-all"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-slate-400" />
                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value as any)}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700 focus:border-brick-500 outline-none transition-all"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="used">Used</option>
                  <option value="invalid">Invalid</option>
                </select>
              </div>
            </div>

            <div className="space-y-4">
              {loading ? (
                <div className="py-20 text-center text-slate-400 font-medium">Loading history...</div>
              ) : filteredLinks.length > 0 ? (
                <div className="grid grid-cols-1 gap-4">
                  {filteredLinks.map((link) => (
                    <motion.div
                      key={link.id}
                      layout
                      className="group relative flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-6 transition-all hover:border-brick-200 hover:shadow-lg"
                    >
                      <div className="flex items-start gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-50 text-slate-400 group-hover:bg-brick-50 group-hover:text-brick-600 transition-colors">
                          <UserIcon className="h-6 w-6" />
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-black text-slate-900">{link.studentName}</h3>
                            {getStatusBadge(link.status)}
                          </div>
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-medium text-slate-500">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" /> {format(new Date(link.date), 'PPP')}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" /> {format(new Date(link.workStartTime), 'HH:mm')} - {format(new Date(link.workEndTime), 'HH:mm')}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400">Created {format(new Date(link.createdAt), 'MMM d, HH:mm')}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            const url = new URL(window.location.href);
                            url.searchParams.set('booking', link.id);
                            window.open(url.toString(), '_blank');
                          }}
                          className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-slate-500 hover:bg-brick-50 hover:text-brick-600 transition-all"
                          title="Open Link"
                        >
                          <ExternalLink className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(link)}
                          className={`flex h-10 w-10 items-center justify-center rounded-xl transition-all ${
                            link.status === 'active' 
                              ? 'bg-slate-50 text-slate-500 hover:bg-red-50 hover:text-red-600' 
                              : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                          }`}
                          title={link.status === 'active' ? 'Deactivate' : 'Activate'}
                        >
                          {link.status === 'active' ? <X className="h-5 w-5" /> : <CheckCircle2 className="h-5 w-5" />}
                        </button>
                        <button
                          onClick={() => handleDelete(link.id)}
                          className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-slate-500 hover:bg-red-50 hover:text-red-600 transition-all"
                          title="Delete"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-50 text-slate-300">
                    <LinkIcon className="h-8 w-8" />
                  </div>
                  <h3 className="mt-4 text-lg font-bold text-slate-900">No links found</h3>
                  <p className="mt-1 text-slate-500">Links you generate will appear here.</p>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
