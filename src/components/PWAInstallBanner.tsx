'use client';

import { useState, useEffect } from 'react';
import { Download, X, Smartphone, Monitor } from 'lucide-react';

export default function PWAInstallBanner() {
  const [show, setShow] = useState(false);
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const alreadyDismissed = sessionStorage.getItem('pwa-banner-dismissed');
    if (alreadyDismissed) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setPrompt(e as BeforeInstallPromptEvent);
      setShow(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const install = async () => {
    if (!prompt) return;
    prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === 'accepted') setShow(false);
    setPrompt(null);
  };

  const dismiss = () => {
    setShow(false);
    setDismissed(true);
    sessionStorage.setItem('pwa-banner-dismissed', '1');
  };

  if (!show || dismissed) return null;

  return (
    <div className="relative z-50 bg-gradient-to-r from-sky-600/90 to-purple-600/90 backdrop-blur-sm border-b border-white/20 px-4 py-3 animate-slide-up">
      <div className="max-w-screen-2xl mx-auto flex items-center gap-4">
        <div className="flex items-center gap-3 flex-1">
          <div className="flex items-center gap-1.5 text-white/70 text-xs hidden sm:flex">
            <Smartphone className="w-4 h-4" />
            <Monitor className="w-4 h-4" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Install HealthGuard PWA</p>
            <p className="text-xs text-white/70 hidden sm:block">
              Works offline · Install on Windows, Linux, iOS, Android, desktop &amp; mobile
            </p>
          </div>
        </div>
        <button
          onClick={install}
          className="flex items-center gap-1.5 px-4 py-2 bg-white text-sky-700 rounded-xl text-sm font-bold hover:bg-white/90 transition-all shadow-lg flex-shrink-0"
        >
          <Download className="w-4 h-4" />
          Install
        </button>
        <button onClick={dismiss} className="text-white/60 hover:text-white transition-colors flex-shrink-0">
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

declare global {
  interface BeforeInstallPromptEvent extends Event {
    readonly platforms: string[];
    readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
    prompt(): Promise<void>;
  }
}
