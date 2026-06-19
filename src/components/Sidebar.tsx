'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Shield, Map, BarChart3, Bell, List, Activity,
  Utensils, ChevronRight, Menu, X, Sun, Moon, Monitor,
  Download, Wifi, WifiOff, RefreshCw
} from 'lucide-react';
import { useTheme } from '@/lib/theme';
import type { ModelChoice } from '@/types';

export type Tab = 'map' | 'analytics' | 'districts' | 'alerts';

interface SidebarProps {
  activeTab: Tab;
  onTabChange: (t: Tab) => void;
  modelChoice: ModelChoice;
  onModelChange: (m: ModelChoice) => void;
  onRefresh: () => void;
  loading: boolean;
  alertCount: number;
  lastUpdated: string;
  pytorchAvailable: boolean;
  online: boolean;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

const NAV_ITEMS: { id: Tab; label: string; icon: React.ReactNode; description: string }[] = [
  { id: 'map',       label: 'Hotspot Map',  icon: <Map className="w-5 h-5" />,      description: 'Interactive Uganda map' },
  { id: 'analytics', label: 'Analytics',    icon: <BarChart3 className="w-5 h-5" />, description: 'Charts & trends' },
  { id: 'districts', label: 'Districts',    icon: <List className="w-5 h-5" />,      description: 'All 136 districts' },
  { id: 'alerts',    label: 'Alerts',       icon: <Bell className="w-5 h-5" />,      description: 'Active risk alerts' },
];

const MODEL_OPTIONS: { value: ModelChoice; label: string; shortLabel: string; color: string }[] = [
  { value: 'ensemble', label: 'Ensemble (RF + Neural)', shortLabel: 'Ensemble', color: 'text-sky-400' },
  { value: 'rf',       label: 'Random Forest',          shortLabel: 'RF',       color: 'text-emerald-400' },
  { value: 'pytorch',  label: 'PyTorch Neural Net',     shortLabel: 'PyTorch',  color: 'text-purple-400' },
];

const THEME_OPTIONS: { value: import('@/lib/theme').Theme; label: string; icon: React.ReactNode }[] = [
  { value: 'dark',   label: 'Dark',   icon: <Moon className="w-4 h-4" /> },
  { value: 'light',  label: 'Light',  icon: <Sun className="w-4 h-4" /> },
  { value: 'system', label: 'System', icon: <Monitor className="w-4 h-4" /> },
];

function SidebarContent({
  activeTab, onTabChange, modelChoice, onModelChange, onRefresh,
  loading, alertCount, lastUpdated, pytorchAvailable, online, collapsed,
}: SidebarProps & { collapsed: boolean }) {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex flex-col h-full select-none">
      {/* Logo */}
      <div className={`flex items-center gap-3 px-4 py-5 border-b border-[var(--border)] ${collapsed ? 'justify-center px-2' : ''}`}>
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-500 to-purple-600 flex items-center justify-center shadow-lg flex-shrink-0 neon-blue">
          <Shield className="w-5 h-5 text-white" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <p className="text-sm font-bold gradient-text leading-tight">HealthGuard</p>
            <p className="text-[10px] text-[var(--text-faint)] leading-tight">AI Disease Surveillance</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 space-y-1 px-2">
        {NAV_ITEMS.map(item => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              title={collapsed ? item.label : undefined}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group relative
                ${isActive
                  ? 'tab-active'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-white/5 dark:hover:bg-white/5 light:hover:bg-black/5'
                }
              `}
            >
              <span className="flex-shrink-0">{item.icon}</span>
              {!collapsed && (
                <span className="flex-1 text-left truncate">{item.label}</span>
              )}
              {!collapsed && item.id === 'alerts' && alertCount > 0 && (
                <span className="w-5 h-5 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center font-bold flex-shrink-0">
                  {alertCount > 9 ? '9+' : alertCount}
                </span>
              )}
              {collapsed && item.id === 'alerts' && alertCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full" />
              )}
            </button>
          );
        })}

        {/* Nutrition link */}
        <Link
          href="/nutrition"
          title={collapsed ? 'Nutrition Screening' : undefined}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-white/5 transition-all"
        >
          <Utensils className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span className="truncate">Nutrition</span>}
        </Link>
      </nav>

      {/* Bottom section */}
      <div className="border-t border-[var(--border)] px-2 py-3 space-y-3">

        {/* Model selector */}
        {!collapsed && (
          <div>
            <p className="text-[10px] text-[var(--text-faint)] uppercase tracking-wider px-2 mb-1.5 font-semibold">AI Model</p>
            <div className="space-y-1">
              {MODEL_OPTIONS.filter(m => m.value !== 'pytorch' || pytorchAvailable).map(m => (
                <button
                  key={m.value}
                  onClick={() => onModelChange(m.value)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs transition-all
                    ${modelChoice === m.value
                      ? 'bg-sky-500/15 border border-sky-500/30'
                      : 'hover:bg-white/5 border border-transparent'
                    }`}
                >
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    m.value === 'ensemble' ? 'bg-sky-400' :
                    m.value === 'rf'       ? 'bg-emerald-400' : 'bg-purple-400'
                  } ${modelChoice === m.value ? '' : 'opacity-40'}`} />
                  <span className={modelChoice === m.value ? m.color : 'text-[var(--text-muted)]'}>{m.label}</span>
                  {modelChoice === m.value && <ChevronRight className="w-3 h-3 ml-auto text-sky-400" />}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Theme selector */}
        {!collapsed && (
          <div>
            <p className="text-[10px] text-[var(--text-faint)] uppercase tracking-wider px-2 mb-1.5 font-semibold">Theme</p>
            <div className="grid grid-cols-3 gap-1">
              {THEME_OPTIONS.map(t => (
                <button
                  key={t.value}
                  onClick={() => setTheme(t.value)}
                  className={`flex flex-col items-center gap-1 py-2 rounded-lg text-[10px] transition-all
                    ${theme === t.value
                      ? 'bg-sky-500/15 border border-sky-500/30 text-sky-400'
                      : 'border border-transparent text-[var(--text-muted)] hover:bg-white/5'
                    }`}
                >
                  {t.icon}
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Collapsed: icon-only model + theme */}
        {collapsed && (
          <div className="flex flex-col items-center gap-2">
            <button
              onClick={onRefresh}
              disabled={loading}
              className="p-2 rounded-lg hover:bg-white/5 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-all disabled:opacity-40"
              title="Refresh data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <div className={`w-2 h-2 rounded-full ${online ? 'bg-green-400' : 'bg-red-400'}`} title={online ? 'Online' : 'Offline'} />
          </div>
        )}

        {/* Status & refresh (expanded) */}
        {!collapsed && (
          <div className="flex items-center justify-between px-2">
            <div className={`flex items-center gap-1.5 text-xs ${online ? 'text-green-400' : 'text-red-400'}`}>
              {online ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
              {online ? 'Online' : 'Offline'}
            </div>
            <button
              onClick={onRefresh}
              disabled={loading}
              className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors disabled:opacity-40"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              {lastUpdated ? lastUpdated : 'Refresh'}
            </button>
          </div>
        )}

        {/* Developer tag */}
        {!collapsed && (
          <div className="px-2 pb-1">
            <p className="text-[9px] text-[var(--text-faint)] leading-tight">NDUHURA MARVIN</p>
            <p className="text-[9px] text-[var(--text-faint)]">ANGEL TECHNOLOGIES LTD</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Sidebar(props: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={`hidden lg:flex flex-col h-full bg-[var(--bg-surface)] border-r border-[var(--border)] relative flex-shrink-0 transition-all duration-300 ${collapsed ? 'w-16' : 'w-[220px]'}`}
      >
        <SidebarContent {...props} collapsed={collapsed} />

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(c => !c)}
          className="absolute -right-3 top-[72px] z-10 w-6 h-6 rounded-full bg-[var(--bg-surface2)] border border-[var(--border-md)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-all shadow-sm"
        >
          <ChevronRight className={`w-3 h-3 transition-transform ${collapsed ? '' : 'rotate-180'}`} />
        </button>
      </aside>

      {/* Mobile drawer overlay */}
      {props.mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={props.onMobileClose}
          />
          <aside className="relative z-10 w-64 h-full bg-[var(--bg-surface)] border-r border-[var(--border)] animate-slide-in-left flex flex-col">
            <button
              onClick={props.onMobileClose}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-white/5"
            >
              <X className="w-4 h-4" />
            </button>
            <SidebarContent {...props} collapsed={false} />
          </aside>
        </div>
      )}
    </>
  );
}
