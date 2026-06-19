'use client';

import { useState } from 'react';
import { AlertTriangle, AlertCircle, CheckCircle, Bell, Activity, TrendingUp, Users, Thermometer, Wind } from 'lucide-react';
import type { DistrictPrediction, DashboardStats } from '@/types';

interface AlertsPanelProps {
  predictions: DistrictPrediction[];
  stats?: DashboardStats;
  loading?: boolean;
}

export default function AlertsPanel({ predictions, stats, loading }: AlertsPanelProps) {
  const [expandedAlert, setExpandedAlert] = useState<string | null>(null);
  const [acknowledged, setAcknowledged] = useState<Set<string>>(new Set());

  const highRisk = predictions.filter(p => p.riskLevel === 'Most Likely').sort((a, b) => b.probability - a.probability);
  const medRisk = predictions.filter(p => p.riskLevel === 'Likely').sort((a, b) => b.probability - a.probability);
  const lowRisk = predictions.filter(p => ['Moderate', 'Not Likely'].includes(p.riskLevel));

  const acknowledge = async (district: string) => {
    setAcknowledged(prev => new Set([...prev, district]));
    try {
      await fetch('/api/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          district,
          riskLevel: predictions.find(p => p.district === district)?.riskLevel,
          probability: predictions.find(p => p.district === district)?.probability,
          activeCases: predictions.find(p => p.district === district)?.activeCases,
          growthRate: predictions.find(p => p.district === district)?.growthRatePct,
        }),
      });
    } catch { /* non-critical */ }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="skeleton h-28 rounded-2xl" />
        ))}
      </div>
    );
  }

  const AlertCard = ({ pred, variant }: { pred: DistrictPrediction; variant: 'critical' | 'warning' | 'info' }) => {
    const isExpanded = expandedAlert === pred.district;
    const isAck = acknowledged.has(pred.district);

    const config = {
      critical: {
        border: 'border-red-500/25',
        bg: 'bg-red-500/5',
        headerBg: 'bg-red-500/8',
        icon: <AlertTriangle className="w-5 h-5 text-red-400" />,
        badge: 'bg-red-500/15 text-red-300 border-red-500/25',
        badgeText: '🚨 CRITICAL',
        pulse: 'animate-pulse',
      },
      warning: {
        border: 'border-amber-500/25',
        bg: 'bg-amber-500/5',
        headerBg: 'bg-amber-500/8',
        icon: <AlertCircle className="w-5 h-5 text-amber-400" />,
        badge: 'bg-amber-500/15 text-amber-300 border-amber-500/25',
        badgeText: '⚠️ WARNING',
        pulse: '',
      },
      info: {
        border: 'border-emerald-500/25',
        bg: 'bg-emerald-500/5',
        headerBg: 'bg-emerald-500/8',
        icon: <CheckCircle className="w-5 h-5 text-emerald-400" />,
        badge: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/25',
        badgeText: '✅ SAFE',
        pulse: '',
      },
    }[variant];

    return (
      <div className={`surface-card overflow-hidden transition-all duration-300 ${isAck ? 'opacity-55' : ''}`}>
        <button
          className="w-full text-left"
          onClick={() => setExpandedAlert(isExpanded ? null : pred.district)}
        >
            <div className={`px-5 py-4 ${config.bg} flex items-center gap-4`}>
            <div className={variant === 'critical' && !isAck ? config.pulse : ''}>
              {config.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-[var(--text-primary)]">{pred.district}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full border ${config.badge}`}>
                  {config.badgeText}
                </span>
                {isAck && <span className="text-xs text-[var(--text-faint)] border border-[var(--border)] px-2 py-0.5 rounded-full">Acknowledged</span>}
              </div>
              <div className="flex items-center gap-4 mt-1 text-sm text-[var(--text-muted)]">
                <span><span className="text-[var(--text-primary)] font-semibold">{(pred.probability * 100).toFixed(1)}%</span> probability</span>
                <span>{pred.activeCases.toLocaleString()} active</span>
                <span className={pred.growthRatePct > 0 ? 'text-red-400' : 'text-emerald-400'}>
                  {pred.growthRatePct > 0 ? '+' : ''}{pred.growthRatePct.toFixed(1)}% growth
                </span>
              </div>
            </div>
            <div className="text-xs text-[var(--text-faint)]">{pred.region}</div>
          </div>
        </button>

        {isExpanded && (
          <div className="px-5 py-4 space-y-4 border-t border-[var(--border)] animate-slide-up">
            {/* Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { icon: <Activity className="w-4 h-4 text-sky-400" />, label: '7-Day Avg', value: pred.cases7dayAvg.toFixed(1) },
                { icon: <TrendingUp className="w-4 h-4 text-orange-400" />, label: 'Positivity', value: `${pred.positivityRatePct.toFixed(1)}%` },
                { icon: <Thermometer className="w-4 h-4 text-red-400" />, label: 'Temperature', value: `${pred.temperature.toFixed(1)}°C` },
                { icon: <Wind className="w-4 h-4 text-blue-400" />, label: 'Mobility', value: pred.mobilityIndex.toFixed(0) },
                { icon: <Users className="w-4 h-4 text-purple-400" />, label: 'Population', value: pred.population.toLocaleString() },
                { icon: <Activity className="w-4 h-4 text-emerald-400" />, label: 'Tests', value: pred.testsConducted.toLocaleString() },
                { icon: <AlertTriangle className="w-4 h-4 text-amber-400" />, label: 'Deaths', value: pred.cumulativeDeaths.toLocaleString() },
                { icon: <Activity className="w-4 h-4 text-[var(--text-muted)]" />, label: 'Cases/100k', value: pred.casesPer100k.toFixed(0) },
              ].map(({ icon, label, value }) => (
                <div key={label} className="surface-card p-3">
                  <div className="flex items-center gap-2 mb-1">{icon}<span className="text-[11px] text-[var(--text-faint)]">{label}</span></div>
                  <div className="font-bold text-[var(--text-primary)] text-sm">{value}</div>
                </div>
              ))}
            </div>

            {/* Recommendations */}
            <div className="surface-card p-4">
              <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-3">📋 Recommended Actions</h4>
              <ul className="space-y-1.5">
                {(variant === 'critical' ? [
                  '🚨 Activate emergency response team immediately',
                  '🔬 Surge testing capacity and accelerate contact tracing',
                  '🏥 Prepare isolation facilities and procure medical supplies',
                  '📢 Launch public health communication campaign',
                  '🚁 Consider district-level mobility restrictions',
                ] : variant === 'warning' ? [
                  '⚡ Increase surveillance frequency',
                  '👩‍⚕️ Mobilize additional healthcare workers',
                  '📊 Prepare contingency plans',
                  '💉 Accelerate vaccination outreach',
                ] : [
                  '📅 Routine weekly monitoring',
                  '📈 Continue data collection',
                  '💊 Maintain vaccination schedule',
                ]).map((rec, i) => (
                    <li key={i} className="text-sm text-[var(--text-muted)] flex items-start gap-2">
                      <span className="flex-shrink-0 mt-0.5 text-[var(--text-faint)]">•</span>
                      {rec}
                    </li>
                  ))}
              </ul>
            </div>

            {/* Actions */}
            {!isAck && (
              <div className="flex gap-3">
                <button
                  onClick={() => acknowledge(pred.district)}
                  className="flex-1 py-2.5 rounded-xl bg-sky-500/10 border border-sky-500/25 text-sky-300 text-sm font-medium hover:bg-sky-500/20 transition-all"
                >
                  ✓ Acknowledge Alert
                </button>
                <button className="px-4 py-2.5 rounded-xl surface-card text-[var(--text-muted)] text-sm hover:text-[var(--text-primary)] transition-all">
                  Share
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Critical Alerts',    value: highRisk.length,                                  color: 'text-red-400',   bg: 'border-red-500/20 bg-red-500/5' },
          { label: 'Warning Alerts',     value: medRisk.length,                                   color: 'text-amber-400', bg: 'border-amber-500/20 bg-amber-500/5' },
          { label: 'National Active',    value: stats?.nationalActiveCases?.toLocaleString() ?? '—', color: 'text-sky-400',   bg: 'border-sky-500/20 bg-sky-500/5' },
        ].map(({ label, value, color, bg }) => (
          <div key={label} className={`surface-card p-4 text-center ${bg}`}>
            <p className="text-xs text-[var(--text-faint)] mb-1">{label}</p>
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Critical */}
      {highRisk.length > 0 ? (
        <div className="space-y-3">
          <h3 className="flex items-center gap-2 font-bold text-red-400 text-sm">
            <Bell className="w-4 h-4 animate-pulse" />
            {highRisk.length} Critical Alert{highRisk.length > 1 ? 's' : ''}
          </h3>
          {highRisk.map(p => <AlertCard key={p.district} pred={p} variant="critical" />)}
        </div>
      ) : (
        <div className="surface-card border-emerald-500/20 bg-emerald-500/5 p-6 text-center">
          <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
          <h3 className="font-semibold text-emerald-300">No Critical Alerts</h3>
          <p className="text-sm text-[var(--text-faint)] mt-1">No districts at critical risk right now.</p>
        </div>
      )}

      {/* Medium */}
      {medRisk.length > 0 && (
        <div className="space-y-3">
          <h3 className="flex items-center gap-2 font-bold text-amber-400 text-sm">
            <AlertCircle className="w-4 h-4" />
            {medRisk.length} Warning Alert{medRisk.length > 1 ? 's' : ''}
          </h3>
          {medRisk.slice(0, 10).map(p => <AlertCard key={p.district} pred={p} variant="warning" />)}
          {medRisk.length > 10 && (
            <p className="text-center text-xs text-[var(--text-faint)]">{medRisk.length - 10} more warning alerts not shown</p>
          )}
        </div>
      )}

      {/* Low risk summary */}
      <div className="surface-card border-emerald-500/20 p-4 flex items-center gap-3">
        <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
        <p className="text-sm text-[var(--text-muted)]">
          <span className="font-semibold text-emerald-400">{lowRisk.length} districts</span> at low risk — routine monitoring only
        </p>
      </div>
    </div>
  );
}
