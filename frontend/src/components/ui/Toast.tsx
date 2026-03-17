import React, { useEffect, useRef } from 'react';
import { useAppStore } from '../../store/appStore';

export function ToastContainer() {
  const { toasts, removeToast } = useAppStore();
  if (!toasts.length) return null;
  return (
    <div className="fixed top-20 right-4 z-[200] flex flex-col gap-2">
      {toasts.map(t => {
        const colors: Record<string, string> = {
          success: 'border-electricCyan text-electricCyan',
          error:   'border-electricMagenta text-electricMagenta',
          warning: 'border-orange-400 text-orange-400',
          info:    'border-white/30 text-white/70',
        };
        return (
          <div
            key={t.id}
            className={`glass-panel px-4 py-3 rounded border-l-2 text-xs font-mono max-w-xs slide-up ${colors[t.type] ?? colors.info}`}
            onClick={() => removeToast(t.id)}
          >
            <span className="opacity-60 mr-2">[{t.type.toUpperCase()}]</span>
            {t.message}
          </div>
        );
      })}
    </div>
  );
}
