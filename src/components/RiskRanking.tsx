'use client';

import { useState } from 'react';
import { TrendingUp, TrendingDown, Minus, ChevronRight } from 'lucide-react';
import type { DistrictPrediction } from '@/types';

interface RiskRankingProps {
  predictions: DistrictPrediction[];
  onDistrictClick: (d: DistrictPrediction) => void;
  selectedDistrict?: string | null;
}

const CFG = {
  'Most Likely': { bar: '#ef4444', dot: 'bg-red-500',    text: 'text-red-400',    ring: 'ring-red-500/30' },
  'Likely':      { bar: '#f97316', dot: 'bg-orange-500', text: 'text-orange-400', ring: 'ring-orange-500/30' },
  'Moderate':    { bar: '#f59e0b', dot: 'bg-amber-500',  text: 'text-amber-400',  ring: 'ring-amber-500/30' },
  'Not Likely':  { bar: '#10b981', dot: 'bg-emerald-500',text: 'text-emerald-400',ring: 'ring-emerald-500/30' },
} as const;

export default function RiskRanking({ predictions, onDistrictClick, selectedDistrict }: RiskRankingProps) {
  const [showAll, setShowAll] = useState(false);
  const sorted    = [...predictions].sort((a, b) => b.probability - a.probability);
  const displayed = showAll ? sorted : sorted.slice(0, 30);

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-3 flex-shrink-0">
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">Risk Ranking</h3>
        <span className="text-[11px] text-[var(--text-faint)]">{sorted.length} total</span>
      </div>

      <div className="flex-1 overflow-y-auto space-y-1 pr-0.5">
        {displayed.map((pred, idx) => {
          const c          = CFG[pred.riskLevel] ?? CFG['Not Likely'];
          const isSelected = pred.district === selectedDistrict;

          return (
            <button
              key={pred.district}
              onClick={() => onDistrictClick(pred)}
              className={`w-full text-left px-3 py-2.5 rounded-xl border transition-all duration-150 group
                ${isSelected
                  ? `bg-[var(--bg-surface2)] border-sky-500/40 ring-1 ring-sky-500/20`
                  : 'border-[var(--border)] hover:border-[var(--border-md)] hover:bg-[var(--bg-surface2)]'
                }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-[var(--text-faint)] w-4 flex-shrink-0 text-right">{idx + 1}</span>
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${c.dot} ${isSelected ? 'animate-pulse' : ''}`} />
                <span className="flex-1 text-xs font-medium text-[var(--text-primary)] truncate">{pred.district}</span>
                <span className={`text-xs font-bold flex-shrink-0 ${c.text}`}>{(pred.probability * 100).toFixed(0)}%</span>
                {pred.growthRatePct > 5  && <TrendingUp   className="w-3 h-3 text-red-400 flex-shrink-0" />}
                {pred.growthRatePct < -5 && <TrendingDown  className="w-3 h-3 text-emerald-400 flex-shrink-0" />}
                {Math.abs(pred.growthRatePct) <= 5 && <Minus className="w-3 h-3 text-[var(--text-faint)] flex-shrink-0" />}
                <ChevronRight className="w-3 h-3 text-[var(--text-faint)] opacity-0 group-hover:opacity-100 flex-shrink-0 transition-opacity" />
              </div>
              {/* Progress bar */}
              <div className="mt-1.5 h-1 rounded-full bg-[var(--border)] overflow-hidden">
                <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pred.probability * 100}%`, background: c.bar }} />
              </div>
            </button>
          );
        })}
      </div>

      {!showAll && sorted.length > 30 && (
        <button
          onClick={() => setShowAll(true)}
          className="mt-2 w-full py-2 rounded-xl border border-[var(--border)] text-xs text-[var(--text-muted)] hover:bg-[var(--bg-surface2)] transition-colors"
        >
          Show all {sorted.length}
        </button>
      )}
      {showAll && (
        <button
          onClick={() => setShowAll(false)}
          className="mt-2 w-full py-2 rounded-xl border border-[var(--border)] text-xs text-[var(--text-muted)] hover:bg-[var(--bg-surface2)] transition-colors"
        >
          Show less
        </button>
      )}
    </div>
  );
}
