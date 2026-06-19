'use client';

import { useState, useEffect } from 'react';
import { Menu, Bell, Download, Activity, Shield } from 'lucide-react';
import type { ModelChoice } from '@/types';

interface HeaderProps {
  onMenuClick: () => void;
  alertCount: number;
  loading: boolean;
  modelChoice: ModelChoice;
  pytorchAvailable: boolean;
  cached?: boolean;
  onRefresh: () => void;
}

const MODEL_LABELS: Record<ModelChoice, { label: string; color: string }> = {
  ensemble: { label: 'Ensemble',     color: 'text-sky-400' },
  rf:       { label: 'Random Forest', color: 'text-emerald-400' },
  pytorch:  { label: 'PyTorch NN',    color: 'text-purple-400' },
};

export default function Header({
  onMenuClick, alertCount, loading, modelChoice, pytorchAvailable, cached,
}: HeaderProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [time, setTime] = useState('');

  useEffect(() => {
    const tick = () => setTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    tick();
    const t = setInterval(tick, 30000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const handler = (e: Event) => { e.preventDefault(); setDeferredPrompt(e as BeforeInstallPromptEvent); };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const install = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
  };

  const ml = MODEL_LABELS[modelChoice];

  return (
    <header className="h-14 flex-shrink-0 flex items-center px-4 gap-3 bg-[var(--bg-surface)] border-b border-[var(--border)] z-30">
      {/* Mobile hamburger */}
      <button
        onClick={onMenuClick}
        className="lg:hidden p-2 rounded-xl hover:bg-white/5 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-all"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Mobile logo (hidden on desktop — sidebar has it) */}
      <div className="flex lg:hidden items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-sky-500 to-purple-600 flex items-center justify-center">
          <Shield className="w-4 h-4 text-white" />
        </div>
        <span className="text-sm font-bold gradient-text">HealthGuard</span>
      </div>

      <div className="flex-1" />

      {/* Active model badge */}
      <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-[var(--border-md)] text-xs">
        <Activity className="w-3 h-3 text-sky-400" />
        <span className="text-[var(--text-muted)]">Model:</span>
        <span className={`font-semibold ${ml.color}`}>{ml.label}</span>
      </div>

      {/* Loading indicator */}
      {loading && (
        <div className="w-4 h-4 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
      )}

      {/* Cached badge */}
      {cached && (
        <span className="hidden sm:flex text-xs px-2 py-1 bg-yellow-500/15 text-yellow-400 border border-yellow-500/30 rounded-full">
          Cached
        </span>
      )}

      {/* Time */}
      <span className="hidden md:block text-xs text-[var(--text-faint)] font-mono">{time}</span>

      {/* Alert bell */}
      <button className="relative p-2 rounded-xl hover:bg-white/5 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-all">
        <Bell className="w-5 h-5" />
        {alertCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-[9px] text-white font-bold animate-bounce-in">
            {alertCount > 9 ? '9+' : alertCount}
          </span>
        )}
      </button>

      {/* Install PWA */}
      {deferredPrompt && (
        <button
          onClick={install}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-sky-500 to-purple-600 text-white text-xs font-semibold hover:opacity-90 transition-all shadow"
        >
          <Download className="w-3.5 h-3.5" />
          Install
        </button>
      )}
    </header>
  );
}

declare global {
  interface BeforeInstallPromptEvent extends Event {
    readonly platforms: string[];
    readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
    prompt(): Promise<void>;
  }
}
