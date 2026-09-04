import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Sparkles, AlertCircle } from 'lucide-react';

const MAX_INPUT_CHARS = 4000;

export const JournalInput = ({ onSubmit, isSubmitting }) => {
  const [content, setContent] = useState('');
  const [charWarning, setCharWarning] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = content.trim();
    if (!trimmed || isSubmitting) return;

    if (trimmed.length > MAX_INPUT_CHARS) {
      setCharWarning(true);
      return;
    }

    setCharWarning(false);
    await onSubmit(trimmed);
    setContent('');
  };

  const handleKeyDown = (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      handleSubmit(e);
    }
  };

  const remainingChars = MAX_INPUT_CHARS - content.length;

  return (
    <div className="bg-white dark:bg-[#0D0F15] border border-slate-200 dark:border-white/[0.08] rounded-2xl p-5 shadow-subtle-elevated dark:shadow-dark-subtle-elevated relative transition-colors">
      <div className="flex items-center justify-between mb-3">
        <label
          htmlFor="journal-textarea"
          className="text-xs font-semibold uppercase tracking-wider text-indigo-700 dark:text-brand-300 flex items-center gap-2"
        >
          <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-brand-400" />
          <span>Record or Brainstorm Thoughts</span>
        </label>
        <span
          className={`text-[11px] font-mono transition-colors ${
            remainingChars < 200
              ? 'text-amber-600 dark:text-amber-400 font-semibold'
              : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          {content.length}/{MAX_INPUT_CHARS}
        </span>
      </div>

      <textarea
        id="journal-textarea"
        rows={4}
        value={content}
        onChange={(e) => {
          setContent(e.target.value);
          if (charWarning && e.target.value.length <= MAX_INPUT_CHARS) {
            setCharWarning(false);
          }
        }}
        onKeyDown={handleKeyDown}
        disabled={isSubmitting}
        placeholder="What's on your mind? Tell Gemini..."
        className="w-full bg-slate-50 dark:bg-[#121520] border border-slate-200 dark:border-white/[0.08] focus:border-indigo-500/50 dark:focus:border-brand-500/40 rounded-xl p-4 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:focus:ring-brand-500/20 transition-all resize-y min-h-[110px]"
      />

      <AnimatePresence>
        {charWarning && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-2 mt-2 text-xs text-amber-600 dark:text-amber-400 font-mono"
          >
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>Exceeds maximum constitutional boundary of {MAX_INPUT_CHARS} characters.</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100 dark:border-white/[0.04]">
        <span className="text-[11px] text-slate-600 dark:text-slate-400 font-mono hidden sm:inline">
          Contextual continuity active • Reads last 3 entries
        </span>

        <div className="flex items-center gap-3 ml-auto">
          {/* Animated Gemini Thinking Indicator */}
          <AnimatePresence>
            {isSubmitting && (
              <motion.div
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 8 }}
                className="flex items-center gap-2 text-xs text-indigo-700 dark:text-brand-300 font-mono bg-indigo-50 dark:bg-brand-500/10 px-3 py-1.5 rounded-lg border border-indigo-200 dark:border-brand-500/20"
              >
                <div className="flex gap-1 items-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 dark:bg-brand-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 dark:bg-brand-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 dark:bg-brand-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span>Gemini is reflecting...</span>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.button
            whileHover={!isSubmitting && content.trim() ? { scale: 1.02 } : {}}
            whileTap={!isSubmitting && content.trim() ? { scale: 0.98 } : {}}
            onClick={handleSubmit}
            disabled={isSubmitting || !content.trim()}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 dark:bg-brand-600 dark:hover:bg-brand-500 dark:active:bg-brand-700 text-white font-medium text-xs shadow-md dark:shadow-glow-indigo flex items-center gap-2 transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Transmit</span>
          </motion.button>
        </div>
      </div>
    </div>
  );
};