'use client';

import React, { useEffect, useState } from 'react';
import { CheckCircle2, Info, X } from 'lucide-react';
import type { ToastMessage } from '../types/attendance';

interface SuccessToastProps {
  toast: ToastMessage;
  onDismiss: () => void;
}

export default function SuccessToast({ toast, onDismiss }: SuccessToastProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Trigger entrance animation
    const t = setTimeout(() => setVisible(true), 10);
    return () => clearTimeout(t);
  }, []);

  function handleDismiss() {
    setVisible(false);
    setTimeout(onDismiss, 250);
  }

  const isSuccess = toast.type === 'success';

  return (
    <div
      className={`fixed bottom-6 left-1/2 z-50 w-[calc(100%-2rem)] max-w-sm transition-all duration-250 ease-out ${
        visible
          ? 'opacity-100 translate-y-0 -translate-x-1/2'
          : 'opacity-0 translate-y-4 -translate-x-1/2'
      }`}
      role="alert"
      aria-live="assertive"
    >
      <div
        className={`rounded-xl px-4 py-3.5 shadow-card-lg flex items-start gap-3 border ${
          isSuccess ? 'bg-success/10 border-success/30' : 'bg-info-bg border-info-border'
        }`}
        style={{ backgroundColor: isSuccess ? '#ECFDF5' : '#EFF6FF' }}
      >
        <div className={`flex-shrink-0 mt-0.5 ${isSuccess ? 'text-success' : 'text-info'}`}>
          {isSuccess ? <CheckCircle2 size={20} /> : <Info size={20} />}
        </div>
        <div className="flex-1 min-w-0">
          <p className={`font-bold text-sm ${isSuccess ? 'text-success' : 'text-info'}`}>
            {toast.title}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{toast.message}</p>
        </div>
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 p-1 rounded-lg hover:bg-black/10 transition-colors text-muted-foreground"
          aria-label="Dismiss notification"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
