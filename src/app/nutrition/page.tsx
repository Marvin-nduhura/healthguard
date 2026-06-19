'use client';

import { useState } from 'react';
import { ArrowLeft, Activity, AlertTriangle, CheckCircle, User, MapPin, Ruler, Weight, Info, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { UGANDA_DISTRICTS } from '@/lib/districts';

type ScreeningResult = {
  result: 'severe' | 'moderate' | 'mild' | 'normal';
  confidence: number;
  muac?: number;
  age?: number;
  recommendations: string[];
  timestamp: string;
};

const RESULT_CONFIG = {
  severe: { color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/30', icon: '🚨', label: 'Severe Acute Malnutrition (SAM)', badge: 'bg-red-500/20 text-red-300' },
  moderate: { color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/30', icon: '⚠️', label: 'Moderate Acute Malnutrition (MAM)', badge: 'bg-orange-500/20 text-orange-300' },
  mild: { color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/30', icon: '📋', label: 'Mild Malnutrition', badge: 'bg-yellow-500/20 text-yellow-300' },
  normal: { color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/30', icon: '✅', label: 'Normal / Adequate Nutrition', badge: 'bg-green-500/20 text-green-300' },
};

export default function NutritionPage() {
  const [form, setForm] = useState({ age: '', sex: 'Male', district: '', muac: '', weight: '', height: '', notes: '' });
  const [result, setResult] = useState<ScreeningResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<ScreeningResult[]>([]);

  const districts = Object.keys(UGANDA_DISTRICTS).sort();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/nutrition', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          age: form.age ? parseInt(form.age) : undefined,
          sex: form.sex,
          district: form.district || undefined,
          muac: form.muac ? parseFloat(form.muac) : undefined,
          weight: form.weight ? parseFloat(form.weight) : undefined,
          height: form.height ? parseFloat(form.height) : undefined,
          notes: form.notes || undefined,
        }),
      });
      const data = await res.json();
      setResult(data);
      setHistory(prev => [data, ...prev.slice(0, 9)]);
    } catch {
      alert('Screening failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const cfg = result ? RESULT_CONFIG[result.result] : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b border-white/10 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <Link href="/" className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-all">
            <ArrowLeft className="w-5 h-5 text-slate-400" />
          </Link>
          <div>
            <h1 className="font-bold text-white">🥗 Malnutrition Detection</h1>
            <p className="text-xs text-slate-500">Image-Based & MUAC Screening Tool · Uganda</p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Info banner */}
        <div className="glass rounded-2xl border border-sky-500/20 bg-sky-500/5 p-4 flex gap-3">
          <Info className="w-5 h-5 text-sky-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-slate-300">
            <p className="font-semibold text-sky-300 mb-1">WHO MUAC Classification</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              {[
                { label: 'Severe (SAM)', range: '< 115 mm', color: 'text-red-400' },
                { label: 'Moderate (MAM)', range: '115–125 mm', color: 'text-orange-400' },
                { label: 'Mild', range: '125–135 mm', color: 'text-yellow-400' },
                { label: 'Normal', range: '≥ 135 mm', color: 'text-green-400' },
              ].map(({ label, range, color }) => (
                <div key={label} className="glass rounded-lg border border-white/5 p-2 text-center">
                  <div className={`font-semibold ${color}`}>{label}</div>
                  <div className="text-slate-500">{range}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Form */}
          <div className="lg:col-span-3">
            <div className="glass rounded-2xl border border-white/10 p-6">
              <h2 className="font-semibold text-white mb-5 flex items-center gap-2">
                <Activity className="w-5 h-5 text-sky-400" />
                Patient Screening Form
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Row 1: Age & Sex */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-slate-400 mb-1.5 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5" /> Age (months)
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 24"
                      value={form.age}
                      onChange={e => setForm({ ...form, age: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl glass border border-white/10 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-sky-500/50"
                      min="0" max="600"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 mb-1.5 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5" /> Sex
                    </label>
                    <select
                      value={form.sex}
                      onChange={e => setForm({ ...form, sex: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl glass border border-white/10 text-white text-sm focus:outline-none focus:border-sky-500/50 bg-transparent"
                    >
                      <option className="bg-slate-900">Male</option>
                      <option className="bg-slate-900">Female</option>
                    </select>
                  </div>
                </div>

                {/* District */}
                <div>
                  <label className="text-xs text-slate-400 mb-1.5 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5" /> District
                  </label>
                  <div className="relative">
                    <select
                      value={form.district}
                      onChange={e => setForm({ ...form, district: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl glass border border-white/10 text-white text-sm focus:outline-none focus:border-sky-500/50 bg-transparent appearance-none"
                    >
                      <option value="" className="bg-slate-900">Select district…</option>
                      {districts.map(d => <option key={d} value={d} className="bg-slate-900">{d}</option>)}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                  </div>
                </div>

                {/* MUAC */}
                <div>
                  <label className="text-xs text-slate-400 mb-1.5 flex items-center gap-1.5">
                    <Ruler className="w-3.5 h-3.5" /> MUAC (mm) — Mid-Upper Arm Circumference *
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 120 (in millimetres)"
                    value={form.muac}
                    onChange={e => setForm({ ...form, muac: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl glass border border-white/10 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-sky-500/50"
                    step="0.1" min="50" max="300"
                    required
                  />
                </div>

                {/* Weight & Height */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-slate-400 mb-1.5 flex items-center gap-1.5">
                      <Weight className="w-3.5 h-3.5" /> Weight (kg)
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 12.5"
                      value={form.weight}
                      onChange={e => setForm({ ...form, weight: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl glass border border-white/10 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-sky-500/50"
                      step="0.1"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 mb-1.5 flex items-center gap-1.5">
                      <Ruler className="w-3.5 h-3.5" /> Height (cm)
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 85"
                      value={form.height}
                      onChange={e => setForm({ ...form, height: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl glass border border-white/10 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-sky-500/50"
                      step="0.1"
                    />
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="text-xs text-slate-400 mb-1.5 block">Clinical Notes (optional)</label>
                  <textarea
                    placeholder="Any clinical observations…"
                    value={form.notes}
                    onChange={e => setForm({ ...form, notes: e.target.value })}
                    rows={2}
                    className="w-full px-4 py-2.5 rounded-xl glass border border-white/10 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-sky-500/50 resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || !form.muac}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-sky-500 to-purple-600 text-white font-bold text-sm hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                >
                  {loading ? '🔬 Screening…' : '🔍 Run Screening'}
                </button>
              </form>
            </div>
          </div>

          {/* Result panel */}
          <div className="lg:col-span-2 space-y-4">
            {result && cfg ? (
              <div className={`glass rounded-2xl border p-6 space-y-4 animate-bounce-in ${cfg.bg}`}>
                <div className="text-center">
                  <div className="text-5xl mb-3">{cfg.icon}</div>
                  <h3 className={`text-lg font-bold ${cfg.color}`}>{cfg.label}</h3>
                  <p className="text-sm text-slate-400 mt-1">
                    Confidence: <span className="font-semibold text-white">{(result.confidence * 100).toFixed(0)}%</span>
                  </p>
                </div>

                {/* MUAC visual */}
                {result.muac && (
                  <div>
                    <div className="flex justify-between text-xs text-slate-500 mb-1">
                      <span>50mm</span>
                      <span className="font-semibold text-white">{result.muac}mm</span>
                      <span>300mm</span>
                    </div>
                    <div className="h-4 rounded-full overflow-hidden bg-gradient-to-r from-red-500 via-orange-500 via-yellow-500 to-green-500">
                      <div className="relative h-full">
                        <div
                          className="absolute top-0 w-1 h-full bg-white shadow-lg"
                          style={{ left: `${((result.muac - 50) / 250) * 100}%` }}
                        />
                      </div>
                    </div>
                    <div className="flex justify-between text-xs mt-1 text-slate-600">
                      <span>SAM</span><span>MAM</span><span>Mild</span><span>Normal</span>
                    </div>
                  </div>
                )}

                {/* Recommendations */}
                <div>
                  <h4 className="text-sm font-semibold text-white mb-2">📋 Recommendations</h4>
                  <ul className="space-y-2">
                    {result.recommendations.map((rec, i) => (
                      <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
                        <span className="text-sky-400 flex-shrink-0">→</span>
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  onClick={() => setResult(null)}
                  className="w-full py-2 rounded-xl border border-white/10 text-slate-400 text-sm hover:bg-white/5 transition-all"
                >
                  Screen Another Patient
                </button>
              </div>
            ) : (
              <div className="glass rounded-2xl border border-white/10 p-6 text-center">
                <Activity className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-500 text-sm">Enter patient data and run screening to see results here</p>
              </div>
            )}

            {/* History */}
            {history.length > 0 && (
              <div className="glass rounded-2xl border border-white/10 p-4">
                <h3 className="text-sm font-semibold text-white mb-3">Recent Screenings</h3>
                <div className="space-y-2">
                  {history.map((h, i) => {
                    const hcfg = RESULT_CONFIG[h.result];
                    return (
                      <div key={i} className={`flex items-center justify-between p-2.5 rounded-xl border ${hcfg.bg} text-xs`}>
                        <span className="text-slate-300">MUAC: {h.muac ?? '—'}mm</span>
                        <span className={`px-2 py-0.5 rounded-full ${hcfg.badge}`}>{hcfg.label.split(' ')[0]}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
