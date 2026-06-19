'use client';

import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import Sidebar, { type Tab } from '@/components/Sidebar';
import Header from '@/components/Header';
import StatsCards from '@/components/StatsCards';
import RiskRanking from '@/components/RiskRanking';
import AlertsPanel from '@/components/AlertsPanel';
import AnalyticsCharts from '@/components/AnalyticsCharts';
import DistrictDetails from '@/components/DistrictDetails';
import ApiStatusBar from '@/components/ApiStatusBar';
import Footer from '@/components/Footer';
import PWAInstallBanner from '@/components/PWAInstallBanner';
import type { PredictionResponse, DistrictPrediction, ModelChoice } from '@/types';
import { WifiOff, Map } from 'lucide-react';

const UgandaMap = dynamic(() => import('@/components/UgandaMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[420px] rounded-2xl skeleton flex items-center justify-center">
      <div className="flex flex-col items-center gap-3 text-[var(--text-muted)]">
        <Map className="w-10 h-10 opacity-30 animate-float" />
        <span className="text-sm">Loading interactive map…</span>
      </div>
    </div>
  ),
});

export default function HomePage() {
  const [data, setData]               = useState<PredictionResponse | null>(null);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState<string | null>(null);
  const [modelChoice, setModelChoice] = useState<ModelChoice>('ensemble');
  const [activeTab, setActiveTab]     = useState<Tab>('map');
  const [selected, setSelected]       = useState<DistrictPrediction | null>(null);
  const [lastUpdated, setLastUpdated] = useState('');
  const [online, setOnline]           = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Online status
  useEffect(() => {
    setOnline(navigator.onLine);
    const on  = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);

  // Service worker
  useEffect(() => {
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => {});
  }, []);

  // Wake up the Flask backend as soon as the page loads (Render free tier sleeps)
  useEffect(() => {
    const flaskUrl = process.env.NEXT_PUBLIC_FLASK_API_URL || 'https://healthguard-api-vtrp.onrender.com';
    fetch(`${flaskUrl}/ping`).catch(() => {});
  }, []);

  const fetchData = useCallback(async (model: ModelChoice = modelChoice) => {
    setLoading(true);
    setError(null);
    try {
      const res  = await fetch(`/api/predictions?model=${model}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
      setData(json);
      setLastUpdated(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [modelChoice]);

  useEffect(() => { fetchData(modelChoice); }, [modelChoice, fetchData]);

  const handleModelChange = (m: ModelChoice) => setModelChoice(m);

  const cached     = !!(data as unknown as { _cached?: boolean })?._cached;
  const alertCount = data?.stats
    ? data.stats.highRiskCount + (data.stats.mediumRiskCount > 8 ? 1 : 0)
    : 0;

  const sidebarProps = {
    activeTab,
    onTabChange: (t: Tab) => { setActiveTab(t); setMobileMenuOpen(false); },
    modelChoice,
    onModelChange: handleModelChange,
    onRefresh: () => fetchData(modelChoice),
    loading,
    alertCount,
    lastUpdated,
    pytorchAvailable: data?.modelInfo?.pytorchAvailable ?? false,
    online,
    mobileOpen: mobileMenuOpen,
    onMobileClose: () => setMobileMenuOpen(false),
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[var(--bg-base)]">
      <PWAInstallBanner />

      {/* Shell: sidebar + main area */}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar {...sidebarProps} />

        {/* Right column */}
        <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
          <Header
            onMenuClick={() => setMobileMenuOpen(true)}
            alertCount={alertCount}
            loading={loading}
            modelChoice={modelChoice}
            pytorchAvailable={data?.modelInfo?.pytorchAvailable ?? false}
            cached={cached}
            onRefresh={() => fetchData(modelChoice)}
          />

          {/* API status bar */}
          {data?.apiStatus && (
            <ApiStatusBar apiStatus={data.apiStatus} cached={cached} />
          )}

          {/* Scrollable content */}
          <main className="flex-1 overflow-y-auto px-4 md:px-6 py-5 space-y-5">

            {/* Error banner */}
            {error && (
              <div className="surface-card p-4 flex items-start gap-4 border-red-500/30 bg-red-500/5 animate-slide-up">
                <div className="p-2 bg-red-500/15 rounded-xl flex-shrink-0">
                  <WifiOff className="w-5 h-5 text-red-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-red-300 text-sm">Flask API not connected</p>
                  <p className="text-xs text-[var(--text-muted)] mt-0.5">{error}</p>
                  <code className="mt-2 inline-block text-[11px] text-[var(--text-muted)] bg-black/20 rounded-lg px-3 py-1.5">
                    cd &quot;D:\Covid project API&quot; &amp;&amp; python flask_api.py
                  </code>
                </div>
                <button
                  onClick={() => fetchData(modelChoice)}
                  className="px-3 py-1.5 rounded-xl bg-red-500/15 text-red-300 text-xs hover:bg-red-500/25 transition-colors flex-shrink-0"
                >
                  Retry
                </button>
              </div>
            )}

            {/* Stats row */}
            <StatsCards stats={data?.stats!} loading={loading} />

            {/* Tab content */}
            <div className="animate-fade-in">

              {/* ── MAP ───────────────────────────────────────────── */}
              {activeTab === 'map' && (
                <div className="grid grid-cols-1 xl:grid-cols-4 gap-5">
                  {/* Map panel */}
                  <div className="xl:col-span-3 surface-card overflow-hidden flex flex-col" style={{ height: '560px' }}>
                    <div className="px-5 py-3 border-b border-[var(--border)] flex items-center justify-between flex-shrink-0">
                      <h2 className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2">
                        <Map className="w-4 h-4 text-sky-400" />
                        Uganda Disease Hotspot Map
                      </h2>
                      <span className="text-xs text-[var(--text-faint)]">
                        {data?.predictions.length ?? 0} districts monitored
                      </span>
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <UgandaMap
                        predictions={data?.predictions ?? []}
                        selectedDistrict={selected?.district}
                        onDistrictClick={d => setSelected(d)}
                      />
                    </div>
                  </div>

                  {/* Risk ranking sidebar */}
                  <div className="surface-card p-4 overflow-hidden flex flex-col" style={{ height: '560px' }}>
                    {loading ? (
                      <div className="space-y-2">
                        {Array.from({ length: 14 }).map((_, i) => (
                          <div key={i} className="skeleton h-12 rounded-xl" />
                        ))}
                      </div>
                    ) : (
                      <RiskRanking
                        predictions={data?.predictions ?? []}
                        onDistrictClick={d => {
                          setSelected(d);
                          setActiveTab('districts');
                        }}
                        selectedDistrict={selected?.district}
                      />
                    )}
                  </div>
                </div>
              )}

              {/* ── ANALYTICS ─────────────────────────────────────── */}
              {activeTab === 'analytics' && (
                <AnalyticsCharts
                  predictions={data?.predictions ?? []}
                  modelInfo={data?.modelInfo}
                  loading={loading}
                />
              )}

              {/* ── DISTRICTS ─────────────────────────────────────── */}
              {activeTab === 'districts' && (
                <DistrictDetails
                  predictions={data?.predictions ?? []}
                  initialSelected={selected}
                  loading={loading}
                />
              )}

              {/* ── ALERTS ────────────────────────────────────────── */}
              {activeTab === 'alerts' && (
                <AlertsPanel
                  predictions={data?.predictions ?? []}
                  stats={data?.stats}
                  loading={loading}
                />
              )}
            </div>
          </main>

          <Footer modelInfo={data?.modelInfo} />
        </div>
      </div>
    </div>
  );
}
