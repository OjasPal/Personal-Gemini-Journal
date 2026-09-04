import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { JournalEntry } from './JournalEntry';
import { SkeletonCard } from './SkeletonCard';
import { Inbox, ShieldAlert } from 'lucide-react';
import { auth } from '../firebase';

const API_BASE_URL = 'http://localhost:5000';

export const JournalStream = ({ entries, setEntries, isLoading, error, onRetry }) => {
  const [deleteError, setDeleteError] = useState(null);

  /**
   * Rule 1: Acquires verified ID token and executes DELETE /api/journal/:entryId
   */
  const handleDeleteEntry = async (entryId) => {
    setDeleteError(null);

    try {
      if (!auth.currentUser) {
        throw new Error("Unauthorized: Active session required.");
      }

      // Force cryptographic token refresh to verify active identity
      const token = await auth.currentUser.getIdToken(true);

      const response = await fetch(`${API_BASE_URL}/api/journal/${encodeURIComponent(entryId)}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Server rejected deletion (${response.status})`);
      }

      // Optimistically/immediately filter local React state
      setEntries((prevEntries) => prevEntries.filter((item) => item.id !== entryId));

    } catch (err) {
      console.error("Deletion failure:", err.message);
      setDeleteError(err.message || "Failed to remove entry.");
      throw err;
    }
  };

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

  return (
    <div className="space-y-3">
      {/* Dynamic inline notification for failed deletions */}
      <AnimatePresence>
        {deleteError && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="p-3 mb-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs font-mono text-red-400 flex items-center justify-between"
          >
            <span>{deleteError}</span>
            <button
              onClick={() => setDeleteError(null)}
              className="text-slate-400 hover:text-white"
            >
              Dismiss
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {entries.length === 0 ? (
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
      ) : (
        <AnimatePresence initial={false}>
          {entries.map((entry) => (
            <JournalEntry
              key={entry.id}
              entry={entry}
              onDelete={handleDeleteEntry}
            />
          ))}
        </AnimatePresence>
      )}
    </div>
  );
};