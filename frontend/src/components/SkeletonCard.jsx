import React from 'react';
import { motion } from 'framer-motion';

export const SkeletonCard = () => {
  return (
    <motion.div
      initial={{ opacity: 0.6 }}
      animate={{ opacity: 1 }}
      className="bg-white dark:bg-[#0D0F15] border border-slate-200 dark:border-white/[0.08] rounded-2xl p-5 mb-4 relative overflow-hidden transition-colors"
    >
      {/* Animated shimmer beam */}
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-black/[0.02] dark:via-white/[0.03] to-transparent" />

      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-md bg-slate-100 dark:bg-white/5 animate-pulse" />
          <div className="w-16 h-3 bg-slate-200 dark:bg-white/10 rounded animate-pulse" />
        </div>
        <div className="w-20 h-3 bg-slate-100 dark:bg-white/5 rounded animate-pulse" />
      </div>

      <div className="space-y-2 pl-7 mb-4">
        <div className="w-full h-3.5 bg-slate-200 dark:bg-white/[0.07] rounded animate-pulse" />
        <div className="w-3/4 h-3.5 bg-slate-100 dark:bg-white/[0.05] rounded animate-pulse" />
      </div>

      <div className="h-[1px] bg-slate-100 dark:bg-white/[0.04] my-3" />

      <div className="flex items-center gap-2 mb-3">
        <div className="w-5 h-5 rounded-md bg-emerald-50 dark:bg-brand-500/10 animate-pulse" />
        <div className="w-24 h-3 bg-emerald-100 dark:bg-brand-500/20 rounded animate-pulse" />
      </div>

      <div className="space-y-2.5 pl-7">
        <div className="w-full h-3.5 bg-slate-200 dark:bg-white/[0.06] rounded animate-pulse" />
        <div className="w-5/6 h-3.5 bg-slate-150 bg-slate-100 dark:bg-white/[0.06] rounded animate-pulse" />
        <div className="w-1/2 h-3.5 bg-slate-100 dark:bg-white/[0.04] rounded animate-pulse" />
      </div>
    </motion.div>
  );
};