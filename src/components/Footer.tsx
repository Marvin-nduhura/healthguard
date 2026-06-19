'use client';

import { Shield, Heart, ExternalLink } from 'lucide-react';
import type { ModelInfo } from '@/types';

export default function Footer({ modelInfo }: { modelInfo?: ModelInfo }) {
  return (
    <footer className="border-t border-[var(--border)] bg-[var(--bg-surface)] px-4 md:px-6 py-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">

        {/* Brand */}
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-sky-500 to-purple-600 flex items-center justify-center flex-shrink-0">
            <Shield className="w-3.5 h-3.5 text-white" />
          </div>
          <div>
            <p className="text-xs font-bold gradient-text leading-tight">HealthGuard PWA</p>
            <p className="text-[10px] text-[var(--text-faint)] flex items-center gap-1">
              Developed with <Heart className="w-2.5 h-2.5 text-red-400" /> by{' '}
              <span className="text-[var(--text-primary)] font-medium">NDUHURA MARVIN</span> —{' '}
              <span className="text-sky-400">ANGEL TECHNOLOGIES LTD</span>
            </p>
          </div>
        </div>

        {/* Model stats */}
        {modelInfo && (
          <div className="flex items-center gap-4 text-[11px] text-[var(--text-faint)]">
            <span>RF Accuracy: <b className="text-sky-400">{(modelInfo.accuracy * 100).toFixed(1)}%</b></span>
            <span>ROC-AUC: <b className="text-violet-400">{modelInfo.rocAuc.toFixed(4)}</b></span>
            <span>Features: <b className="text-[var(--text-muted)]">{modelInfo.numFeatures}</b></span>
            <span className={modelInfo.pytorchAvailable ? 'text-emerald-400' : 'text-[var(--text-faint)]'}>
              PyTorch: {modelInfo.pytorchAvailable ? '✓' : '✗'}
            </span>
          </div>
        )}

        {/* Sources */}
        <div className="flex items-center gap-3 text-[10px] text-[var(--text-faint)]">
          {[
            { label: 'Weather', url: 'https://open-meteo.com' },
            { label: 'COVID', url: 'https://disease.sh' },
            { label: 'Population', url: 'https://ubos.org' },
          ].map(({ label, url }) => (
            <a key={label} href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-0.5 hover:text-sky-400 transition-colors">
              {label} <ExternalLink className="w-2.5 h-2.5" />
            </a>
          ))}
          <span>© 2025 HealthGuard</span>
        </div>
      </div>
    </footer>
  );
}
