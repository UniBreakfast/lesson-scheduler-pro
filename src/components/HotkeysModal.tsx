import React from 'react';
import { X, Keyboard } from 'lucide-react';
import { motion } from 'motion/react';

interface HotkeysModalProps {
  onClose: () => void;
}

export default function HotkeysModal({ onClose }: HotkeysModalProps) {
  const hotkeys = [
    { key: '1', description: 'Switch to Day View' },
    { key: '2', description: 'Switch to Week View' },
    { key: '3', description: 'Switch to Month View' },
    { key: '4', description: 'Switch to Year View' },
    { key: 'C', description: 'Switch to Calendar' },
    { key: 'L', description: 'Switch to Lessons List' },
    { key: 'S', description: 'Switch to Students List' },
    { key: '←', description: 'Previous (Day/Week/Month/Year or Page)' },
    { key: '→', description: 'Next (Day/Week/Month/Year or Page)' },
  ];

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-md"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="flex w-full max-w-md max-h-[90vh] flex-col overflow-hidden rounded-3xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-slate-100 bg-slate-50 px-8 py-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brick-100 text-brick-600">
              <Keyboard className="h-6 w-6" />
            </div>
            <h2 className="text-2xl font-black text-slate-900">Keyboard Shortcuts</h2>
          </div>
          <button onClick={onClose} className="rounded-full p-2 hover:bg-slate-200 transition-colors">
            <X className="h-6 w-6 text-slate-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8">
          <div className="space-y-3">
            {hotkeys.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3 border border-slate-100">
                <span className="text-sm font-medium text-slate-600">{item.description}</span>
                <kbd className="flex h-8 min-w-[32px] items-center justify-center rounded-lg border border-slate-300 bg-white px-2 font-mono text-sm font-bold text-slate-900 shadow-sm">
                  {item.key}
                </kbd>
              </div>
            ))}
          </div>
        </div>
        
        <div className="shrink-0 border-t border-slate-100 p-8 pt-0">
          <button
            onClick={onClose}
            className="mt-8 w-full rounded-xl bg-slate-900 py-4 text-sm font-bold text-white transition-all hover:bg-slate-800 active:scale-95"
          >
            Got it
          </button>
        </div>
      </motion.div>
    </div>
  );
}
