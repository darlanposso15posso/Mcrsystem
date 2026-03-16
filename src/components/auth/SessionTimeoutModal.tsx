import React, { useEffect, useState } from 'react';
import { Clock, LogOut, RefreshCw } from 'lucide-react';

interface Props {
  onStay: () => void;
  onLogout: () => void;
}

const WARNING_DURATION = 5 * 60; // 5 minutes countdown

export default function SessionTimeoutModal({ onStay, onLogout }: Props) {
  const [countdown, setCountdown] = useState(WARNING_DURATION);

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          onLogout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [onLogout]);

  const minutes = Math.floor(countdown / 60);
  const seconds = countdown % 60;
  const pct = (countdown / WARNING_DURATION) * 100;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-amber-500/30 rounded-3xl p-8 max-w-sm w-full shadow-2xl text-center">
        {/* Circular progress */}
        <div className="relative w-20 h-20 mx-auto mb-6">
          <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
            <circle cx="40" cy="40" r="34" fill="none" stroke="#1e293b" strokeWidth="6" />
            <circle
              cx="40" cy="40" r="34"
              fill="none"
              stroke="#f59e0b"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 34}`}
              strokeDashoffset={`${2 * Math.PI * 34 * (1 - pct / 100)}`}
              className="transition-all duration-1000"
            />
          </svg>
          <Clock size={24} className="text-amber-400 absolute inset-0 m-auto" />
        </div>

        <h2 className="text-lg font-black text-white uppercase tracking-widest italic mb-2">Sessão Expirando</h2>
        <p className="text-slate-400 text-[11px] font-bold uppercase tracking-widest mb-4 leading-relaxed">
          Você ficou inativo. A sessão será encerrada em:
        </p>
        <div className="text-4xl font-black text-amber-400 mb-6 tabular-nums">
          {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
        </div>

        <div className="flex gap-3">
          <button
            onClick={onLogout}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-white/5 hover:bg-white/10 text-slate-400 rounded-2xl font-black text-[10px] uppercase tracking-widest border border-white/10 transition-all"
          >
            <LogOut size={14} /> Sair
          </button>
          <button
            onClick={onStay}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all"
          >
            <RefreshCw size={14} /> Continuar
          </button>
        </div>
      </div>
    </div>
  );
}
