'use client';

import { Cloud, Activity, Database, AlertCircle } from 'lucide-react';
import type { APIStatus } from '@/types';

export default function ApiStatusBar({ apiStatus, cached }: { apiStatus: APIStatus; cached?: boolean }) {
  const items = [
    { icon: <Cloud className="w-3 h-3" />,     label: 'Weather',  value: `${apiStatus.weather.covered}/${apiStatus.weather.total}`,  ok: apiStatus.weather.covered > 0,  src: apiStatus.weather.source },
    { icon: <Activity className="w-3 h-3" />,  label: 'Mobility', value: `${apiStatus.mobility.covered}/${apiStatus.mobility.total}`, ok: apiStatus.mobility.covered > 0, src: apiStatus.mobility.source },
    { icon: <Database className="w-3 h-3" />,  label: 'COVID',    value: `${apiStatus.covid.covered}/${apiStatus.covid.total}`,       ok: apiStatus.covid.covered > 0,    src: apiStatus.covid.live ? 'disease.sh (Live)' : apiStatus.covid.source },
  ];

  return (
    <div className="bg-[var(--bg-surface)] border-b border-[var(--border)] px-4 md:px-6 py-1.5">
      <div className="flex items-center gap-4 overflow-x-auto">
        {cached && (
          <div className="flex items-center gap-1.5 text-amber-400 text-[11px] flex-shrink-0">
            <AlertCircle className="w-3 h-3" />
            Cached data
          </div>
        )}
        {items.map(item => (
          <div key={item.label} className="flex items-center gap-1.5 flex-shrink-0">
            <span className={item.ok ? 'text-emerald-400' : 'text-[var(--text-faint)]'}>{item.icon}</span>
            <span className="text-[11px] text-[var(--text-faint)]">{item.label}:</span>
            <span className={`text-[11px] font-medium ${item.ok ? 'text-[var(--text-primary)]' : 'text-[var(--text-faint)]'}`}>{item.value}</span>
            <span className="hidden sm:inline text-[10px] text-[var(--text-faint)]">· {item.src}</span>
            <div className={`w-1.5 h-1.5 rounded-full ${item.ok ? 'bg-emerald-400 animate-pulse' : 'bg-[var(--text-faint)]'}`} />
          </div>
        ))}
      </div>
    </div>
  );
}
