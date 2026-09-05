import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Sparkles, X, Database, AlertCircle, Send, Loader2, RefreshCw } from 'lucide-react';
import { auth } from '../firebase';

const API_BASE_URL = 'https://journal-backend-931033287675.us-central1.run.app';
const QUICK_QUESTIONS = [
  "What game did I ask you about before?",
  "What have I been working on recently?",
  "What recurring goals have I mentioned?",
  "Summarize key insights from my past entries."
];

export const AskJournalModal = ({ isOpen, onClose }) => {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState(null);
  const [contextUsed, setContextUsed] = useState(null);
  const [isAsking, setIsAsking] = useState(false);
  const [isBackfilling, setIsBackfilling] = useState(false);
  const [backfillMessage, setBackfillMessage] = useState(null);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleAsk = async (qText) => {
    const query = (qText || question).trim();
    if (!query || isAsking) return;

    setIsAsking(true);
    setError(null);
    setAnswer(null);
    setContextUsed(null);

    try {
      if (!auth.currentUser) {
        throw new Error("Active authenticated session required.");
      }
      const token = await auth.currentUser.getIdToken(true);

      const response = await fetch(`${API_BASE_URL}/api/journal/ask`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ question: query })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to retrieve journal insights.");
      }

      setAnswer(data.answer);
      setContextUsed(data.contextUsed);
    } catch (err) {
      setError(err.message || "Gemini is temporarily unavailable. Please try again.");
    } finally {
      setIsAsking(false);
    }
  };

  const handleBackfillMemories = async () => {
    if (isBackfilling) return;
    setIsBackfilling(true);
    setBackfillMessage(null);
    setError(null);

    try {
      if (!auth.currentUser) {
        throw new Error("Active session required.");
      }
      const token = await auth.currentUser.getIdToken(true);

      const response = await fetch(`${API_BASE_URL}/api/journal/backfill-memories`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Backfill failed");
      }

      setBackfillMessage(`Indexed ${data.backfilled} entries into semantic memory (${data.skipped} already indexed).`);
    } catch (err) {
      setError(err.message || "Failed to backfill memories.");
    } finally {
      setIsBackfilling(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="w-full max-w-xl bg-white dark:bg-[#0D0F15] border border-slate-200 dark:border-white/[0.08] rounded-2xl p-6 shadow-2xl relative overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-brand-500/20 border border-indigo-200 dark:border-brand-500/30 flex items-center justify-center">
              <Search className="w-4 h-4 text-indigo-600 dark:text-brand-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Ask My Journal
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Grounded search over your isolated historical memories
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleBackfillMemories}
              disabled={isBackfilling}
              title="Index past entries into memories"
              className="flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/5 transition-colors cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3 h-3 ${isBackfilling ? 'animate-spin' : ''}`} />
              <span>{isBackfilling ? 'Indexing...' : 'Index Past Entries'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 cursor-pointer transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Backfill Success Notification */}
        {backfillMessage && (
          <div className="mb-3 p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-xs text-emerald-700 dark:text-emerald-400 font-mono">
            {backfillMessage}
          </div>
        )}

        {/* Input Field */}
        <div className="relative mb-3">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAsk()}
            placeholder="Ask anything about your past entries..."
            disabled={isAsking}
            className="w-full bg-slate-50 dark:bg-[#121520] border border-slate-200 dark:border-white/[0.08] rounded-xl pl-4 pr-11 py-3 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all"
          />
          <button
            onClick={() => handleAsk()}
            disabled={isAsking || !question.trim()}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-40 transition-all cursor-pointer"
          >
            {isAsking ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Quick Suggestion Chips */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {QUICK_QUESTIONS.map((q, idx) => (
            <button
              key={idx}
              onClick={() => { setQuestion(q); handleAsk(q); }}
              disabled={isAsking}
              className="text-[11px] px-2.5 py-1 rounded-full bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/5 transition-colors cursor-pointer disabled:opacity-50"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Loading Indicator */}
        {isAsking && (
          <div className="p-5 rounded-xl bg-slate-50 dark:bg-[#121520] border border-slate-200 dark:border-white/5 flex items-center gap-3">
            <div className="flex gap-1">
              <span className="w-2 h-2 rounded-full bg-indigo-600 dark:bg-brand-400 animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-2 h-2 rounded-full bg-indigo-600 dark:bg-brand-400 animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-2 h-2 rounded-full bg-indigo-600 dark:bg-brand-400 animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
            <span className="text-xs font-mono text-indigo-700 dark:text-brand-300">
              Gemini is searching and reflecting on your journal...
            </span>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-xs text-red-700 dark:text-red-400 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Grounded Answer Display */}
        {answer && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-xl bg-slate-50 dark:bg-[#121520] border border-slate-200 dark:border-white/[0.08]"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-600 dark:text-accent-emerald font-semibold flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Grounded Gemini Answer
              </span>
              {contextUsed && (
                <span className="text-[10px] font-mono text-slate-500 flex items-center gap-1">
                  <Database className="w-3 h-3" /> Context used · {contextUsed.count} {contextUsed.count === 1 ? 'memory' : 'memories'}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">
              {answer}
            </p>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};