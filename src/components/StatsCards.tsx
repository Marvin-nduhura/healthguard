'use client';

import { useEffect, useRef } from 'react';
import { AlertTriangle, AlertCircle, CheckCircle, TrendingUp, Users, Activity } from 'lucide-react';
import type { DashboardStats } from '@/types';

function AnimatedNumber({ value, suffix = '' }: { value: number; suffix?: string }) {
  const ref  = useRef<HTMLSpanElement>(null);
  const prev = useRef(0);

  useEffect(() => {
    const start = prev.current, end = value;
    const duration = 700, t0 = performance.now();
    const run = (now: number) => {
      const p = Math.min((now - t0) / duration, 1);
      const v = Math.round(start + (end - start) * (1 - Math.pow(1 - p, 3)));
      if (ref.current) ref.current.textContent = v.toLocaleString() + suffix;
      if (p < 1) requestAnimationFrame(run);
    };
    requestAnimationFrame(run);
    prev.current = end;
  }, [value, suffix]);

  return <span ref={ref}>{value.toLocaleString()}{suffix}</span>;
}

interface CardDef {
  icon: React.ReactNode;
  label: string;
  value: number;
  suffix?: string;
  subtext?: string;
  accent: string;
  border: string;
}

function StatCard({ icon, label, value, suffix, subtext, accent, border, loading }: CardDef & { loading?: boolean }) {
  if (loading) return (
    <div className="surface-card p-4">
      <div className="skeleton h-3.5 w-20 mb-3 rounded" />
      <div className="skeleton h-8 w-24 mb-2 rounded" />
      <div className="skeleton h-3 w-16 rounded" />
    </div>
  );

  return (
    <div className={`surface-card p-4 card-hover border-l-4 ${border} relative overflow-hidden`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-[var(--text-muted)] font-medium">{label}</span>
        <div className={`p-1.5 rounded-lg ${accent} bg-opacity-15`}>{icon}</div>
      </div>
      <p className="text-2xl font-bold text-[var(--text-primary)]">
        <AnimatedNumber value={value} suffix={suffix} />
      </p>
      {subtext && <p className="text-[11px] text-[var(--text-faint)] mt-1">{subtext}</p>}
      <div className={`absolute -bottom-4 -right-4 w-16 h-16 rounded-full ${accent} opacity-5`} />
    </div>
  );
}

export default function StatsCards({ stats, loading }: { stats: DashboardStats; loading?: boolean }) {
  const cards: CardDef[] = [
    {
      icon: <AlertTriangle className="w-4 h-4 text-red-400" />,
      label: 'High Risk', value: stats?.highRiskCount ?? 0,
      subtext: `${stats?.totalDistricts ? ((stats.highRiskCount / stats.totalDistricts) * 100).toFixed(0) : 0}% of districts`,
      accent: 'bg-red-500', border: 'border-red-500',
    },
    {
      icon: <AlertCircle className="w-4 h-4 text-amber-400" />,
      label: 'Medium Risk', value: stats?.mediumRiskCount ?? 0,
      subtext: `${stats?.totalDistricts ? ((stats.mediumRiskCount / stats.totalDistricts) * 100).toFixed(0) : 0}% of districts`,
      accent: 'bg-amber-500', border: 'border-amber-500',
    },
    {
      icon: <CheckCircle className="w-4 h-4 text-emerald-400" />,
      label: 'Low Risk', value: stats?.lowRiskCount ?? 0,
      subtext: 'Routine monitoring',
      accent: 'bg-emerald-500', border: 'border-emerald-500',
    },
    {
      icon: <TrendingUp className="w-4 h-4 text-sky-400" />,
      label: 'Avg Probability', value: stats?.avgProbability ? Math.round(stats.avgProbability * 100) : 0,
      suffix: '%', subtext: 'Across all districts',
      accent: 'bg-sky-500', border: 'border-sky-500',
    },
    {
      icon: <Users className="w-4 h-4 text-violet-400" />,
      label: 'Active Cases', value: stats?.nationalActiveCases ?? 0,
      subtext: 'National total',
      accent: 'bg-violet-500', border: 'border-violet-500',
    },
    {
      icon: <Activity className="w-4 h-4 text-orange-400" />,
      label: 'Districts', value: stats?.totalDistricts ?? 0,
      subtext: 'All Uganda districts',
      accent: 'bg-orange-500', border: 'border-orange-500',
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
      {cards.map(c => <StatCard key={c.label} {...c} loading={loading} />)}
    </div>
  );
}
