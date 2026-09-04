import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { JournalEntry } from './JournalEntry';
import { SkeletonCard } from './SkeletonCard';
import { Inbox, ShieldAlert } from 'lucide-react';

export const JournalStream = ({ entries, isLoading, error, onRetry }) => {
  if (isLoading) {
    return (
      <div className="space-y-3">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="p-6 rounded-2xl bg-red-50 dark:bg-red-500/5 border border-red-200 dark:border-red-500/20 text-center flex flex-col items-center transition-colors"
      >
        <ShieldAlert className="w-8 h-8 text-red-600 dark:text-red-400 mb-2" />
        <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-200 mb-1">
          Unable to Load Isolated Entries
        </h4>
        <p className="text-xs text-slate-600 dark:text-slate-400 font-mono max-w-sm mb-4">
          {error}
        </p>
        <button
          onClick={onRetry}
          className="px-3.5 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 dark:bg-white/5 dark:hover:bg-white/10 text-slate-800 dark:text-slate-200 text-xs font-mono transition-colors cursor-pointer"
        >
          Retry Fetch
        </button>
      </motion.div>
    );
  }

  if (entries.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-12 text-center border border-dashed border-slate-300 dark:border-white/[0.08] rounded-2xl flex flex-col items-center justify-center bg-white/60 dark:bg-[#0D0F15]/50 transition-colors"
      >
        <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center mb-3">
          <Inbox className="w-6 h-6 text-slate-400 dark:text-slate-500" />
        </div>
        <h4 className="text-sm font-medium text-slate-800 dark:text-slate-300 mb-1">
          No records in this isolated session
        </h4>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs">
          Record your first thought above. Gemini will persist and contextualize future sessions.
        </p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-3">
      <AnimatePresence initial={false}>
        {entries.map((entry) => (
          <JournalEntry key={entry.id} entry={entry} />
        ))}
      </AnimatePresence>
    </div>
  );
};