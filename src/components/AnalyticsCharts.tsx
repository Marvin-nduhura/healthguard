'use client';

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, ScatterChart, Scatter, ZAxis,
  RadarChart, PolarGrid, PolarAngleAxis, Radar, Legend,
} from 'recharts';
import type { DistrictPrediction, ModelInfo } from '@/types';

interface Props {
  predictions: DistrictPrediction[];
  modelInfo?: ModelInfo;
  loading?: boolean;
}

const RISK_COLORS = {
  'Most Likely': '#ef4444',
  'Likely': '#f97316',
  'Moderate': '#f59e0b',
  'Not Likely': '#10b981',
};

const ChartCard = ({ title, children, className = '' }: { title: string; children: React.ReactNode; className?: string }) => (
  <div className={`surface-card p-5 ${className}`}>
    <h3 className="font-semibold text-[var(--text-primary)] mb-4 text-sm">{title}</h3>
    {children}
  </div>
);

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="surface-card px-3 py-2.5 text-xs shadow-xl border border-[var(--border-md)]">
      {label && <p className="text-[var(--text-muted)] font-medium mb-1">{label}</p>}
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }}>{p.name}: {typeof p.value === 'number' && p.value < 2 ? (p.value * 100).toFixed(1) + '%' : p.value?.toLocaleString()}</p>
      ))}
    </div>
  );
};

export default function AnalyticsCharts({ predictions, modelInfo, loading }: Props) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="surface-card p-5 h-72">
            <div className="skeleton h-4 w-40 mb-4 rounded" />
            <div className="skeleton w-full h-52 rounded-xl" />
          </div>
        ))}
      </div>
    );
  }

  // Risk distribution pie
  const riskCounts = Object.entries(
    predictions.reduce((acc, p) => {
      acc[p.riskLevel] = (acc[p.riskLevel] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  ).map(([name, value]) => ({ name, value }));

  // Regional averages bar
  const regionData = Object.entries(
    predictions.reduce((acc, p) => {
      if (!acc[p.region]) acc[p.region] = { sum: 0, count: 0, active: 0 };
      acc[p.region].sum += p.probability;
      acc[p.region].count++;
      acc[p.region].active += p.activeCases;
      return acc;
    }, {} as Record<string, { sum: number; count: number; active: number }>)
  ).map(([region, d]) => ({
    region,
    avgRisk: +(d.sum / d.count * 100).toFixed(1),
    activeCases: d.active,
  })).sort((a, b) => b.avgRisk - a.avgRisk);

  // All districts sorted by probability
  const districtProb = [...predictions]
    .sort((a, b) => b.probability - a.probability)
    .slice(0, 30)
    .map(p => ({
      name: p.district.length > 10 ? p.district.slice(0, 10) + '…' : p.district,
      full: p.district,
      prob: +(p.probability * 100).toFixed(1),
      fill: RISK_COLORS[p.riskLevel],
    }));

  // RF vs PyTorch scatter
  const scatterData = predictions
    .filter(p => p.pytorchProbability !== null)
    .map(p => ({
      rf: +(p.rfProbability * 100).toFixed(1),
      pt: +((p.pytorchProbability ?? 0) * 100).toFixed(1),
      name: p.district,
    }));

  // Feature importance
  const featureImportance = (modelInfo?.featureImportance ?? [])
    .slice(0, 10)
    .map(f => ({
      name: f.feature.replace(/_/g, ' '),
      value: +(f.importance * 100).toFixed(2),
    }))
    .reverse();

  // Top 10 active cases
  const topActive = [...predictions]
    .sort((a, b) => b.activeCases - a.activeCases)
    .slice(0, 10)
    .map(p => ({ name: p.district, activeCases: p.activeCases, growth: +p.growthRatePct.toFixed(1) }));

  // Radar — regional risk profile
  const radarRegions = [...new Set(predictions.map(p => p.region))];
  const radarData = radarRegions.map(region => {
    const rPreds = predictions.filter(p => p.region === region);
    const avgRisk = rPreds.reduce((s, p) => s + p.probability * 100, 0) / (rPreds.length || 1);
    const avgActive = rPreds.reduce((s, p) => s + p.activeCases / p.population * 10000, 0) / (rPreds.length || 1);
    return { region, avgRisk: +avgRisk.toFixed(1), avgActive: +avgActive.toFixed(2) };
  });

  const TICK = { fill: 'var(--text-muted)', fontSize: 11 } as const;
  const TICK_SM = { fill: 'var(--text-muted)', fontSize: 10 } as const;
  const TICK_XS = { fill: 'var(--text-muted)', fontSize: 9 } as const;
  const GRID = 'var(--bg-surface2)';

  return (
    <div className="space-y-5">
      {/* Row 1 */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {/* Risk pie */}
        <ChartCard title="🎯 Risk Level Distribution">
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={riskCounts}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={90}
                paddingAngle={3}
                dataKey="value"
                label={({ value }) => `${value}`}
                labelLine={false}
              >
                {riskCounts.map((entry) => (
                  <Cell key={entry.name} fill={RISK_COLORS[entry.name as keyof typeof RISK_COLORS] || '#64748b'} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend formatter={(v) => <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>{v}</span>} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Regional bar */}
        <ChartCard title="🗺️ Average Risk by Region">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={regionData} margin={{ top: 5, right: 10, bottom: 5, left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID} />
              <XAxis dataKey="region" tick={TICK_SM} />
              <YAxis tick={TICK_SM} unit="%" />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="avgRisk" name="Avg Risk %" radius={[6, 6, 0, 0]}>
                {regionData.map((entry) => (
                  <Cell key={entry.region} fill={
                    entry.avgRisk > 50 ? '#ef4444' :
                    entry.avgRisk > 30 ? '#f97316' :
                    entry.avgRisk > 15 ? '#f59e0b' : '#10b981'
                  } />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Active cases top 10 */}
        <ChartCard title="🔬 Top 10 by Active Cases">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={topActive} layout="vertical" margin={{ top: 0, right: 20, bottom: 0, left: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID} horizontal={false} />
              <XAxis type="number" tick={TICK_XS} />
              <YAxis type="category" dataKey="name" tick={TICK_SM} width={60} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="activeCases" name="Active Cases" fill="#0ea5e9" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Row 2 */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {/* Top 30 districts probability */}
        <ChartCard title="📊 Outbreak Probability — Top 30 Districts" className="xl:col-span-2">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={districtProb} margin={{ top: 10, right: 10, bottom: 60, left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID} />
              <XAxis dataKey="name" tick={TICK_XS} angle={-45} textAnchor="end" interval={0} />
              <YAxis tick={TICK} unit="%" domain={[0, 100]} />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const d = payload[0]?.payload as typeof districtProb[0];
                  return (
                    <div className="surface-card px-3 py-2.5 text-xs shadow-xl">
                      <p className="text-[var(--text-primary)] font-semibold">{d?.full}</p>
                      <p className="text-sky-400">Probability: {d?.prob}%</p>
                    </div>
                  );
                }}
              />
              <Bar dataKey="prob" name="Probability %" radius={[4, 4, 0, 0]}>
                {districtProb.map((d, i) => <Cell key={i} fill={d.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="flex gap-4 mt-3 justify-center flex-wrap">
            {Object.entries(RISK_COLORS).map(([k, v]) => (
              <div key={k} className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
                <div className="w-3 h-3 rounded-sm" style={{ background: v }} />
                {k}
              </div>
            ))}
          </div>
        </ChartCard>
      </div>

      {/* Row 3 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* RF vs PyTorch scatter */}
        {scatterData.length > 0 && (
          <ChartCard title="🤖 Random Forest vs PyTorch">
            <ResponsiveContainer width="100%" height={240}>
              <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={GRID} />
                <XAxis dataKey="rf" name="Random Forest" unit="%" type="number" domain={[0, 100]} tick={TICK_SM}
                  label={{ value: 'RF %', position: 'insideBottom', offset: -10, fill: 'var(--text-faint)', fontSize: 11 }} />
                <YAxis dataKey="pt" name="PyTorch" unit="%" type="number" domain={[0, 100]} tick={TICK_SM}
                  label={{ value: 'PyTorch %', angle: -90, position: 'insideLeft', fill: 'var(--text-faint)', fontSize: 11 }} />
                <ZAxis range={[40, 40]} />
                <Tooltip
                  cursor={{ strokeDasharray: '3 3' }}
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const d = payload[0]?.payload as { name: string; rf: number; pt: number };
                    return (
                      <div className="surface-card px-3 py-2.5 text-xs shadow-xl">
                        <p className="text-[var(--text-primary)] font-semibold">{d?.name}</p>
                        <p className="text-sky-400">RF: {d?.rf}%</p>
                        <p className="text-purple-400">PyTorch: {d?.pt}%</p>
                      </div>
                    );
                  }}
                />
                <Scatter data={scatterData} fill="#0ea5e9" opacity={0.75} />
              </ScatterChart>
            </ResponsiveContainer>
            <p className="text-[11px] text-[var(--text-faint)] mt-2 text-center">Points near diagonal = models agree</p>
          </ChartCard>
        )}

        {/* Feature importance */}
        {featureImportance.length > 0 && (
          <ChartCard title="🎯 Top 10 Feature Importances (RF)">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={featureImportance} layout="vertical" margin={{ top: 0, right: 30, bottom: 0, left: 130 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={GRID} horizontal={false} />
                <XAxis type="number" tick={TICK_SM} unit="%" />
                <YAxis type="category" dataKey="name" tick={TICK_XS} width={125} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" name="Importance %" radius={[0, 4, 4, 0]}>
                  {featureImportance.map((_, i) => (
                    <Cell key={i} fill={`hsl(${200 + i * 15}, 75%, ${58 - i * 2}%)`} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        )}
      </div>

      {/* Model info cards */}
      {modelInfo && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'RF Accuracy',        value: `${(modelInfo.accuracy * 100).toFixed(1)}%`, color: 'text-sky-400' },
            { label: 'ROC-AUC',            value: modelInfo.rocAuc.toFixed(4),                 color: 'text-purple-400' },
            { label: 'Features',           value: modelInfo.numFeatures,                        color: 'text-emerald-400' },
            { label: 'Training Districts', value: modelInfo.totalDistricts,                     color: 'text-orange-400' },
          ].map(({ label, value, color }) => (
            <div key={label} className="surface-card p-4 text-center">
              <p className="text-xs text-[var(--text-faint)] mb-1">{label}</p>
              <p className={`text-2xl font-bold ${color}`}>{value}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
