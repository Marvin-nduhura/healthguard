'use client';

import { useState, useCallback } from 'react';
import { Search, X, ChevronDown, ChevronUp, MapPin, Thermometer, Wind, Users, Activity, TrendingUp, AlertTriangle, Shield } from 'lucide-react';
import type { DistrictPrediction } from '@/types';

interface DistrictDetailsProps {
  predictions: DistrictPrediction[];
  initialSelected?: DistrictPrediction | null;
  loading?: boolean;
}

const RISK_BADGE = {
  'Most Likely': 'bg-red-500/20 text-red-300 border-red-500/30',
  'Likely': 'bg-orange-500/20 text-orange-300 border-orange-500/30',
  'Moderate': 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  'Not Likely': 'bg-green-500/20 text-green-300 border-green-500/30',
};

const RISK_ICON = {
  'Most Likely': '🔴',
  'Likely': '🟠',
  'Moderate': '🟡',
  'Not Likely': '🟢',
};

function ProbBar({ value }: { value: number }) {
  const pct = value * 100;
  const color = pct > 70 ? '#ef4444' : pct > 40 ? '#f97316' : pct > 20 ? '#f59e0b' : '#10b981';
  return (
    <div className="progress-bar mt-1.5">
      <div className="progress-fill" style={{ width: `${pct}%`, background: color }} />
    </div>
  );
}

export default function DistrictDetails({ predictions, initialSelected, loading }: DistrictDetailsProps) {
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<string | null>(initialSelected?.district ?? null);
  const [sortBy, setSortBy] = useState<'name' | 'probability' | 'active'>('probability');
  const [filterRegion, setFilterRegion] = useState<string>('All');

  const regions = ['All', ...Array.from(new Set(predictions.map(p => p.region))).sort()];

  const filtered = predictions
    .filter(p => {
      const matchSearch = p.district.toLowerCase().includes(search.toLowerCase());
      const matchRegion = filterRegion === 'All' || p.region === filterRegion;
      return matchSearch && matchRegion;
    })
    .sort((a, b) => {
      if (sortBy === 'name') return a.district.localeCompare(b.district);
      if (sortBy === 'active') return b.activeCases - a.activeCases;
      return b.probability - a.probability;
    });

  const toggle = useCallback((district: string) => {
    setExpanded(prev => prev === district ? null : district);
  }, []);

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="skeleton h-12 rounded-xl" />
        {Array.from({ length: 8 }).map((_, i) => <div key={i} className="skeleton h-16 rounded-2xl" />)}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-faint)]" />
          <input
            type="text"
            placeholder="Search districts…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="hg-input pl-10 pr-10"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--text-faint)] hover:text-[var(--text-primary)]">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Region filter */}
        <select
          value={filterRegion}
          onChange={e => setFilterRegion(e.target.value)}
          className="hg-input"
          style={{ width: 'auto' }}
        >
          {regions.map(r => <option key={r} value={r}>{r}</option>)}
        </select>

        {/* Sort */}
        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value as typeof sortBy)}
          className="hg-input"
          style={{ width: 'auto' }}
        >
          <option value="probability">Sort: By Risk</option>
          <option value="active">Sort: Active Cases</option>
          <option value="name">Sort: Name A–Z</option>
        </select>
      </div>

      {/* Count */}
      <div className="text-sm text-[var(--text-faint)]">
        Showing <span className="text-[var(--text-primary)] font-medium">{filtered.length}</span> of {predictions.length} districts
        {search && <span className="ml-2">matching &quot;<span className="text-sky-400">{search}</span>&quot;</span>}
      </div>

      {/* District cards */}
      <div className="space-y-2">
        {filtered.map(pred => {
          const isExpanded = expanded === pred.district;
          const badge = RISK_BADGE[pred.riskLevel];

          return (
            <div key={pred.district} className="surface-card overflow-hidden transition-all duration-300 hover:border-[var(--border-md)]">
              {/* Header row */}
              <button
                className="w-full text-left px-5 py-4 flex items-center gap-4"
                onClick={() => toggle(pred.district)}
              >
                <span className="text-xl flex-shrink-0">{RISK_ICON[pred.riskLevel]}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-[var(--text-primary)]">{pred.district}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${badge}`}>{pred.riskLevel}</span>
                    <span className="text-xs text-[var(--text-faint)]">{pred.region}</span>
                  </div>
                  <div className="flex items-center gap-4 mt-0.5">
                    <span className="text-sm font-bold text-[var(--text-primary)]">{(pred.probability * 100).toFixed(1)}%</span>
                    <ProbBar value={pred.probability} />
                  </div>
                </div>
                <div className="text-right flex-shrink-0 hidden sm:block">
                  <div className="text-sm text-[var(--text-muted)]">{pred.activeCases.toLocaleString()} active</div>
                  <div className={`text-xs ${pred.growthRatePct > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                    {pred.growthRatePct > 0 ? '↑' : '↓'}{Math.abs(pred.growthRatePct).toFixed(1)}%
                  </div>
                </div>
                {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-500 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-500 flex-shrink-0" />}
              </button>

              {/* Expanded details */}
              {isExpanded && (
                <div className="px-5 pb-5 border-t border-[var(--border)] animate-slide-up">
                  <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 mt-4">
                    {[
                      { icon: <Activity className="w-4 h-4 text-sky-400" />, label: 'Probability', value: `${(pred.probability * 100).toFixed(1)}%`, sub: pred.modelUsed },
                      { icon: <AlertTriangle className="w-4 h-4 text-red-400" />, label: 'Active Cases', value: pred.activeCases.toLocaleString() },
                      { icon: <TrendingUp className="w-4 h-4 text-orange-400" />, label: '7-Day Avg', value: pred.cases7dayAvg.toFixed(1) },
                      { icon: <Activity className="w-4 h-4 text-yellow-400" />, label: 'Growth Rate', value: `${pred.growthRatePct.toFixed(1)}%`, sub: pred.growthRatePct > 0 ? '↑ increasing' : '↓ decreasing' },
                      { icon: <Shield className="w-4 h-4 text-purple-400" />, label: 'Positivity', value: `${pred.positivityRatePct.toFixed(1)}%` },
                      { icon: <Users className="w-4 h-4 text-green-400" />, label: 'Population', value: pred.population.toLocaleString() },
                      { icon: <Thermometer className="w-4 h-4 text-red-400" />, label: 'Temperature', value: `${pred.temperature.toFixed(1)}°C` },
                      { icon: <Wind className="w-4 h-4 text-blue-400" />, label: 'Humidity', value: `${(pred.humidity * 100).toFixed(0)}%` },
                      { icon: <Activity className="w-4 h-4 text-slate-400" />, label: 'Rainfall', value: `${pred.rainfall.toFixed(1)} mm` },
                      { icon: <MapPin className="w-4 h-4 text-sky-400" />, label: 'Mobility Index', value: pred.mobilityIndex.toFixed(0) },
                      { icon: <Activity className="w-4 h-4 text-green-400" />, label: 'Testing Rate', value: `${pred.testingRate.toFixed(0)}%` },
                      { icon: <Shield className="w-4 h-4 text-orange-400" />, label: 'Cases/100k', value: pred.casesPer100k.toFixed(0) },
                      { icon: <AlertTriangle className="w-4 h-4 text-slate-400" />, label: 'Total Deaths', value: pred.cumulativeDeaths.toLocaleString() },
                      { icon: <Activity className="w-4 h-4 text-purple-400" />, label: 'Tests Done', value: pred.testsConducted.toLocaleString() },
                      { icon: <Shield className="w-4 h-4 text-sky-400" />, label: 'Healthcare/100k', value: pred.healthcareFacilitiesPer100k.toFixed(1) },
                      { icon: <MapPin className="w-4 h-4 text-green-400" />, label: 'Urban Level', value: ['Rural', 'Semi-Urban', 'Urban', 'Major City'][pred.urbanLevel] ?? 'Rural' },
                    ].map(({ icon, label, value, sub }) => (
                      <div key={label} className="surface-card p-3">
                        <div className="flex items-center gap-1.5 mb-1">{icon}<span className="text-[11px] text-[var(--text-faint)]">{label}</span></div>
                        <div className="font-bold text-[var(--text-primary)] text-sm">{value}</div>
                        {sub && <div className="text-[11px] text-[var(--text-faint)] mt-0.5 truncate">{sub}</div>}
                      </div>
                    ))}
                  </div>

                  {/* RF vs PyTorch comparison */}
                  {pred.pytorchProbability !== null && (
                    <div className="mt-4 surface-card p-4">
                      <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-3">Model Comparison</h4>
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <p className="text-xs text-[var(--text-faint)] mb-1">Random Forest</p>
                          <p className="text-xl font-bold text-sky-400">{(pred.rfProbability * 100).toFixed(1)}%</p>
                        </div>
                        <div>
                          <p className="text-xs text-[var(--text-faint)] mb-1">PyTorch NN</p>
                          <p className="text-xl font-bold text-purple-400">{((pred.pytorchProbability ?? 0) * 100).toFixed(1)}%</p>
                        </div>
                        <div>
                          <p className="text-xs text-[var(--text-faint)] mb-1">Ensemble</p>
                          <p className="text-xl font-bold text-[var(--text-primary)]">{(pred.probability * 100).toFixed(1)}%</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 text-[var(--text-faint)]">
          <Search className="w-12 h-12 mx-auto mb-4 opacity-25" />
          <p className="text-sm">No districts match your search</p>
        </div>
      )}
    </div>
  );
}
