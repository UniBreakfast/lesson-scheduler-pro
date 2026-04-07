import React from 'react';
import { BookingRequest, Lesson } from '../types';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import { Check, X, Clock, User as UserIcon, BookOpen, Bell, AlertCircle } from 'lucide-react';

interface NotificationCenterProps {
  requests: BookingRequest[];
  onAccept: (request: BookingRequest) => Promise<void>;
  onDeny: (requestId: string) => Promise<void>;
  onClose: () => void;
}

export default function NotificationCenter({ requests, onAccept, onDeny, onClose }: NotificationCenterProps) {
  const pendingRequests = requests.filter(r => r.status === 'pending');

  return (
    <div 
      className="fixed inset-0 z-[90] overflow-y-auto bg-slate-900/60 p-4 backdrop-blur-md"
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
            <div className="flex items-center gap-3">
              <div className="relative">
                <Bell className="h-6 w-6 text-brick-600" />
                {pendingRequests.length > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white">
                    {pendingRequests.length}
                  </span>
                )}
              </div>
              <h2 className="text-2xl font-black text-slate-900">Booking Requests</h2>
            </div>
            <button onClick={onClose} className="rounded-full p-2 hover:bg-slate-200 transition-colors">
              <X className="h-6 w-6 text-slate-500" />
            </button>
          </div>

          <div className="p-8 space-y-6">
            {pendingRequests.length > 0 ? (
              <div className="space-y-4">
                {pendingRequests.map((request) => (
                  <motion.div
                    key={request.id}
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brick-50 text-brick-600">
                          <UserIcon className="h-6 w-6" />
                        </div>
                        <div>
                          <p className="font-black text-slate-900">{request.studentName}</p>
                          <p className="text-xs text-slate-500">Requested on {format(new Date(request.createdAt), 'MMM d, HH:mm')}</p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-2 rounded-xl bg-slate-50 p-4">
                      <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
                        <Clock className="h-4 w-4" /> {format(new Date(request.startTime), 'PPPP')}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <span className="ml-6">{format(new Date(request.startTime), 'HH:mm')} - {format(new Date(request.endTime), 'HH:mm')}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <BookOpen className="h-4 w-4" /> {request.subject}
                      </div>
                      {request.notes && (
                        <div className="mt-2 text-xs text-slate-500 italic">
                          "{request.notes}"
                        </div>
                      )}
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => onAccept(request)}
                        className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all active:scale-95"
                      >
                        <Check className="h-4 w-4" /> Accept
                      </button>
                      <button
                        onClick={() => onDeny(request.id)}
                        className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-slate-100 px-4 py-3 text-sm font-bold text-slate-600 hover:bg-slate-200 transition-all active:scale-95"
                      >
                        <X className="h-4 w-4" /> Deny
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 space-y-4">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-slate-50 text-slate-300">
                  <Bell className="h-10 w-10" />
                </div>
                <div className="space-y-1">
                  <p className="text-lg font-bold text-slate-900">All caught up!</p>
                  <p className="text-sm text-slate-500">No new booking requests at the moment.</p>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
