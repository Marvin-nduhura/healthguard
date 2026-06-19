'use client';

import { useEffect, useRef, useState } from 'react';
import { Layers, Map as MapIcon, Flame, CheckCircle, AlertTriangle } from 'lucide-react';
import type { DistrictPrediction } from '@/types';
import { useTheme } from '@/lib/theme';

interface UgandaMapProps {
  predictions: DistrictPrediction[];
  selectedDistrict?: string | null;
  onDistrictClick?: (district: DistrictPrediction) => void;
}

type MapStyle = 'dark' | 'light' | 'satellite' | 'terrain' | 'topo';
type MapLayer = 'all' | 'hotspots' | 'safe' | 'heat';

const MAP_TILES: Record<MapStyle, { url: string; attribution: string; label: string }> = {
  dark: {
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '© OpenStreetMap © CARTO',
    label: 'Dark',
  },
  light: {
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    attribution: '© OpenStreetMap © CARTO',
    label: 'Light',
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '© Esri, DigitalGlobe, GeoEye',
    label: 'Satellite',
  },
  terrain: {
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution: '© OpenTopoMap',
    label: 'Terrain',
  },
  topo: {
    url: 'https://tiles.stadiamaps.com/tiles/stamen_toner_lite/{z}/{x}/{y}{r}.png',
    attribution: '© Stadia Maps, © Stamen Design, © ODbL',
    label: 'Minimal',
  },
};

const LAYER_OPTIONS: { id: MapLayer; label: string; icon: React.ReactNode }[] = [
  { id: 'all',       label: 'All Districts', icon: <MapIcon className="w-3.5 h-3.5" /> },
  { id: 'hotspots',  label: 'Hotspots Only',  icon: <AlertTriangle className="w-3.5 h-3.5" /> },
  { id: 'safe',      label: 'Safe Areas',     icon: <CheckCircle className="w-3.5 h-3.5" /> },
  { id: 'heat',      label: 'Heat Regions',   icon: <Flame className="w-3.5 h-3.5" /> },
];

function getRiskColor(probability: number): { r: number; g: number; b: number } {
  if (probability > 0.7) return { r: 239, g: 68, b: 68 };   // red
  if (probability > 0.4) return { r: 249, g: 115, b: 22 };  // orange
  if (probability > 0.2) return { r: 245, g: 158, b: 11 };  // amber
  return { r: 16, g: 185, b: 129 };                          // green
}

function riskLevelColor(level: string): string {
  return { 'Most Likely': '#ef4444', 'Likely': '#f97316', 'Moderate': '#f59e0b', 'Not Likely': '#10b981' }[level] ?? '#94a3b8';
}

function filterPredictions(predictions: DistrictPrediction[], layer: MapLayer): DistrictPrediction[] {
  switch (layer) {
    case 'hotspots': return predictions.filter(p => p.probability > 0.4);
    case 'safe':     return predictions.filter(p => p.probability <= 0.2);
    case 'heat':     return predictions.filter(p => p.probability > 0.2);
    default:         return predictions;
  }
}

export default function UgandaMap({ predictions, selectedDistrict, onDistrictClick }: UgandaMapProps) {
  const mapRef      = useRef<HTMLDivElement>(null);
  const leafletMap  = useRef<L.Map | null>(null);
  const markersRef  = useRef<L.LayerGroup | null>(null);
  const tileRef     = useRef<L.TileLayer | null>(null);
  const heatRef     = useRef<L.LayerGroup | null>(null);

  const [L, setL]               = useState<typeof import('leaflet') | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [mapStyle, setMapStyle] = useState<MapStyle>('dark');
  const [layer, setLayer]       = useState<MapLayer>('all');
  const [showStyleMenu, setShowStyleMenu]  = useState(false);
  const [showLayerMenu, setShowLayerMenu]  = useState(false);

  const { resolved } = useTheme();

  // Sync map style to app theme
  useEffect(() => {
    setMapStyle(resolved === 'light' ? 'light' : 'dark');
  }, [resolved]);

  // Load Leaflet
  useEffect(() => {
    import('leaflet').then(leaf => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (leaf.Icon.Default.prototype as any)._getIconUrl;
      leaf.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });
      setL(leaf);
    });
  }, []);

  // Init map
  useEffect(() => {
    if (!L || !mapRef.current || leafletMap.current) return;

    if (!document.getElementById('leaflet-css')) {
      const link     = document.createElement('link');
      link.id        = 'leaflet-css';
      link.rel       = 'stylesheet';
      link.href      = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    const map = L.map(mapRef.current, {
      center: [1.3, 32.3],
      zoom: 6.5,
      zoomControl: false,
      attributionControl: false,
      scrollWheelZoom: true,
    });

    L.control.zoom({ position: 'bottomright' }).addTo(map);
    L.control.attribution({ position: 'bottomleft', prefix: '' }).addTo(map);

    const tile = L.tileLayer(MAP_TILES['dark'].url, {
      attribution: MAP_TILES['dark'].attribution,
      subdomains: 'abcd',
      maxZoom: 19,
    }).addTo(map);

    tileRef.current   = tile;
    markersRef.current = L.layerGroup().addTo(map);
    heatRef.current    = L.layerGroup().addTo(map);
    leafletMap.current = map;
    setMapReady(true);

    return () => {
      map.remove();
      leafletMap.current = null;
      markersRef.current = null;
      tileRef.current    = null;
      heatRef.current    = null;
    };
  }, [L]);

  // Change tile layer when style changes
  useEffect(() => {
    if (!L || !leafletMap.current || !tileRef.current) return;
    const t = MAP_TILES[mapStyle];
    leafletMap.current.removeLayer(tileRef.current);
    tileRef.current = L.tileLayer(t.url, {
      attribution: t.attribution,
      subdomains: 'abcd',
      maxZoom: 19,
    });
    tileRef.current.addTo(leafletMap.current);
    // Move tile behind markers
    tileRef.current.setZIndex(0);
  }, [mapStyle, L]);

  // Draw markers + heat circles
  useEffect(() => {
    if (!mapReady || !L || !markersRef.current || !heatRef.current) return;

    markersRef.current.clearLayers();
    heatRef.current.clearLayers();

    const visible = filterPredictions(predictions, layer);
    const isHeatMode = layer === 'heat';

    visible.forEach((pred) => {
      const { r, g, b } = getRiskColor(pred.probability);
      const isSelected  = pred.district === selectedDistrict;

      if (isHeatMode) {
        // Heat circles
        const circle = L!.circle([pred.latitude, pred.longitude], {
          radius: pred.probability * 35000,
          color: `rgba(${r},${g},${b},0.6)`,
          fillColor: `rgba(${r},${g},${b},0.25)`,
          fillOpacity: 0.5,
          weight: 1,
        }).addTo(heatRef.current!);
        circle.bindTooltip(buildTooltip(pred), { sticky: true, direction: 'top', className: 'leaflet-tooltip-custom' });
        circle.on('click', () => onDistrictClick?.(pred));
      } else {
        // Dot markers
        const size = isSelected ? 18 : Math.max(8, Math.round(pred.probability * 18));
        const icon = L!.divIcon({
          className: '',
          html: `<div style="
            width:${size}px;height:${size}px;
            background:rgba(${r},${g},${b},0.92);
            border:${isSelected ? '3px' : '2px'} solid rgba(255,255,255,0.85);
            border-radius:50%;
            box-shadow:0 0 ${isSelected ? 16 : 7}px rgba(${r},${g},${b},0.75);
            cursor:pointer;
            transition:transform 0.2s;
          "></div>
          ${isSelected ? `<div style="
            position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);
            width:${size * 3}px;height:${size * 3}px;
            border-radius:50%;border:2px solid rgba(${r},${g},${b},0.35);
            animation:pulse-ring 2s infinite;pointer-events:none;
          "></div>` : ''}`,
          iconSize: [size, size],
          iconAnchor: [size / 2, size / 2],
        });

        const marker = L!.marker([pred.latitude, pred.longitude], { icon }).addTo(markersRef.current!);
        marker.bindTooltip(buildTooltip(pred), { sticky: true, direction: 'top', className: 'leaflet-tooltip-custom' });
        marker.on('click', () => onDistrictClick?.(pred));
      }
    });
  }, [predictions, selectedDistrict, mapReady, L, layer, onDistrictClick]);

  function buildTooltip(pred: DistrictPrediction) {
    return `<div style="background:#1e293b;border:1px solid #334155;border-radius:10px;padding:10px 14px;color:#f1f5f9;font-size:13px;min-width:170px;box-shadow:0 4px 20px rgba(0,0,0,0.5);">
      <div style="font-weight:700;font-size:14px;margin-bottom:5px;">${pred.district}</div>
      <div style="color:${riskLevelColor(pred.riskLevel)};font-size:12px;font-weight:600;margin-bottom:6px;">${pred.riskLevel}</div>
      <div style="color:#94a3b8;font-size:11px;line-height:1.6;">
        Probability: <b style="color:#f1f5f9">${(pred.probability * 100).toFixed(1)}%</b><br/>
        Active Cases: <b style="color:#f1f5f9">${pred.activeCases.toLocaleString()}</b><br/>
        Region: <b style="color:#f1f5f9">${pred.region}</b><br/>
        Growth: <b style="color:${pred.growthRatePct > 0 ? '#ef4444' : '#10b981'}">${pred.growthRatePct > 0 ? '+' : ''}${pred.growthRatePct.toFixed(1)}%</b>
      </div>
    </div>`;
  }

  return (
    <div className="relative w-full h-full min-h-[380px]">
      <div ref={mapRef} className="w-full h-full" />

      {/* Map controls — top-left */}
      <div className="absolute top-3 left-3 z-[999] flex flex-col gap-2">
        {/* Layer selector */}
        <div className="relative">
          <button
            onClick={() => { setShowLayerMenu(v => !v); setShowStyleMenu(false); }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl glass border border-white/20 text-xs text-white font-medium shadow-lg backdrop-blur-md hover:bg-white/10 transition-all"
          >
            <Layers className="w-3.5 h-3.5 text-sky-400" />
            {LAYER_OPTIONS.find(l => l.id === layer)?.label}
          </button>
          {showLayerMenu && (
            <div className="absolute top-full mt-1.5 left-0 bg-slate-900/95 border border-white/10 rounded-xl shadow-2xl py-1.5 min-w-[160px] animate-slide-up backdrop-blur-md">
              {LAYER_OPTIONS.map(opt => (
                <button
                  key={opt.id}
                  onClick={() => { setLayer(opt.id); setShowLayerMenu(false); }}
                  className={`w-full flex items-center gap-2.5 px-4 py-2 text-xs transition-colors
                    ${layer === opt.id ? 'text-sky-400 bg-sky-500/10' : 'text-slate-300 hover:bg-white/5'}`}
                >
                  {opt.icon}
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Map style */}
        <div className="relative">
          <button
            onClick={() => { setShowStyleMenu(v => !v); setShowLayerMenu(false); }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl glass border border-white/20 text-xs text-white font-medium shadow-lg backdrop-blur-md hover:bg-white/10 transition-all"
          >
            <MapIcon className="w-3.5 h-3.5 text-purple-400" />
            {MAP_TILES[mapStyle].label}
          </button>
          {showStyleMenu && (
            <div className="absolute top-full mt-1.5 left-0 bg-slate-900/95 border border-white/10 rounded-xl shadow-2xl py-1.5 min-w-[140px] animate-slide-up backdrop-blur-md">
              {(Object.entries(MAP_TILES) as [MapStyle, typeof MAP_TILES[MapStyle]][]).map(([key, val]) => (
                <button
                  key={key}
                  onClick={() => { setMapStyle(key); setShowStyleMenu(false); }}
                  className={`w-full text-left px-4 py-2 text-xs transition-colors
                    ${mapStyle === key ? 'text-purple-400 bg-purple-500/10' : 'text-slate-300 hover:bg-white/5'}`}
                >
                  {val.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="absolute bottom-10 left-3 z-[999] bg-slate-900/90 backdrop-blur-md rounded-xl p-3 border border-white/10 text-xs space-y-1.5 shadow-xl">
        <p className="text-slate-300 font-semibold text-[11px] mb-2">Risk Levels</p>
        {[
          { label: 'Most Likely  >70%', color: '#ef4444' },
          { label: 'Likely       40–70%', color: '#f97316' },
          { label: 'Moderate     20–40%', color: '#f59e0b' },
          { label: 'Not Likely   <20%',  color: '#10b981' },
        ].map(({ label, color }) => (
          <div key={label} className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: color, boxShadow: `0 0 5px ${color}` }} />
            <span className="text-slate-400 font-mono">{label}</span>
          </div>
        ))}
        <p className="text-slate-600 text-[10px] pt-1 border-t border-white/5">{predictions.length} districts</p>
      </div>

      {/* Close dropdowns on outside click */}
      {(showLayerMenu || showStyleMenu) && (
        <div className="absolute inset-0 z-[998]" onClick={() => { setShowLayerMenu(false); setShowStyleMenu(false); }} />
      )}
    </div>
  );
}
