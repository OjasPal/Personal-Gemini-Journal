import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, User, Calendar, CheckCircle2, Trash2, Loader2 } from 'lucide-react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

marked.setOptions({
  gfm: true,
  breaks: true,
});

DOMPurify.addHook('afterSanitizeAttributes', (node) => {
  if ('target' in node) {
    node.setAttribute('target', '_blank');
    node.setAttribute('rel', 'noopener noreferrer');
  }
});

export const JournalEntry = ({ entry, onDelete }) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const sanitizedAiHtml = useMemo(() => {
    if (!entry.aiSummary) return '';
    const rawParsed = marked.parse(entry.aiSummary);
    return DOMPurify.sanitize(rawParsed, {
      USE_PROFILES: { html: true },
      ALLOWED_TAGS: [
        'p', 'br', 'strong', 'em', 'b', 'i', 'code', 'pre',
        'blockquote', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'a', 'span'
      ],
      ALLOWED_ATTR: ['href', 'target', 'rel', 'class']
    });
  }, [entry.aiSummary]);

  const formattedDate = useMemo(() => {
    if (!entry.createdAt) return 'Recent';
    try {
      const d = new Date(entry.createdAt);
      return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(d);
    } catch {
      return 'Recent';
    }
  }, [entry.createdAt]);

  const handleDeleteClick = async () => {
    if (!showConfirm) {
      setShowConfirm(true);
      return;
    }

    setIsDeleting(true);
    try {
      await onDelete(entry.id);
    } catch {
      setIsDeleting(false);
      setShowConfirm(false);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="group bg-white dark:bg-[#0D0F15] hover:bg-slate-50/80 dark:hover:bg-[#121520]/70 border border-slate-200 dark:border-white/[0.08] hover:border-slate-300 dark:hover:border-white/15 rounded-2xl p-5 shadow-subtle-elevated dark:shadow-dark-subtle-elevated transition-all duration-200 mb-4 relative"
    >
      {/* Header: User Prompt & Action Bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-md bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center">
              <User className="w-3 h-3 text-slate-600 dark:text-slate-400" />
            </div>
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-600 dark:text-slate-400 font-semibold">
              You
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-500 dark:text-slate-400">
              <Calendar className="w-3 h-3" />
              <span>{formattedDate}</span>
            </div>

            {/* Subtle Styled Delete Trigger */}
            <div className="flex items-center">
              {showConfirm ? (
                <div className="flex items-center gap-1 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-lg p-1">
                  <button
                    onClick={handleDeleteClick}
                    disabled={isDeleting}
                    className="px-2 py-0.5 text-[10px] font-mono font-semibold text-red-600 dark:text-red-400 hover:underline cursor-pointer disabled:opacity-50"
                  >
                    {isDeleting ? "Wiping..." : "Confirm"}
                  </button>
                  <button
                    onClick={() => setShowConfirm(false)}
                    disabled={isDeleting}
                    className="px-1 py-0.5 text-[10px] font-mono text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowConfirm(true)}
                  disabled={isDeleting}
                  aria-label="Delete entry"
                  title="Permanently remove entry"
                  className="opacity-0 group-hover:opacity-100 focus:opacity-100 p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all duration-150 cursor-pointer disabled:opacity-40"
                >
                  {isDeleting ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-red-400" />
                  ) : (
                    <Trash2 className="w-3.5 h-3.5" />
                  )}
                </button>
              )}
            </div>
          </div>
        </div>

        <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap pl-7">
          {entry.userPrompt}
        </p>
      </div>

      {/* Divider */}
      <div className="h-[1px] bg-gradient-to-r from-transparent via-slate-200 dark:via-white/[0.08] to-transparent my-3.5" />

      {/* Gemini Analysis Section */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-md bg-emerald-50 dark:bg-accent-emerald-glow border border-emerald-200 dark:border-accent-emerald/30 flex items-center justify-center">
              <Sparkles className="w-3 h-3 text-emerald-600 dark:text-accent-emerald" />
            </div>
            <span className="text-[11px] font-mono uppercase tracking-wider text-emerald-700 dark:text-accent-emerald font-semibold flex items-center gap-1.5">
              <span>Gemini Companion</span>
              <CheckCircle2 className="w-3 h-3 opacity-70" />
            </span>
          </div>
        </div>

        <div
          className="gemini-prose pl-7"
          dangerouslySetInnerHTML={{ __html: sanitizedAiHtml }}
        />
      </div>
    </motion.div>
  );
};