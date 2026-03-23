'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, X } from 'lucide-react';

export function PrivacyNotice() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const dismissed = sessionStorage.getItem('aegis-privacy-dismissed');
    if (!dismissed) setVisible(true);
  }, []);

  const dismiss = () => {
    setVisible(false);
    sessionStorage.setItem('aegis-privacy-dismissed', '1');
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[9999] max-w-lg w-[calc(100%-2rem)]"
        >
          <div className="bg-[#0c1425] border border-[#1a2744] rounded-xl px-5 py-4 shadow-2xl shadow-black/40 flex items-start gap-3">
            <ShieldCheck className="h-5 w-5 text-emerald-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-slate-200 font-medium mb-1">No cookies. No tracking.</p>
              <p className="text-xs text-slate-400 leading-relaxed">
                AEGIS does not use cookies, store personal data, or track your activity. All data is processed in-session and nothing is saved to your device. Please use this tool responsibly — do not abuse API rate limits or use it for unauthorized purposes.
              </p>
            </div>
            <button
              onClick={dismiss}
              className="text-slate-500 hover:text-slate-300 transition-colors flex-shrink-0 mt-0.5"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
