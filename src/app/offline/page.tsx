'use client';

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-center px-6">
      <div>
        <div className="text-6xl mb-6">📡</div>
        <h1 className="text-2xl font-bold text-white mb-3">You&apos;re Offline</h1>
        <p className="text-slate-400 mb-6 max-w-sm">
          HealthGuard needs an internet connection to fetch live COVID-19 and weather data.
          Please reconnect and refresh.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-3 rounded-xl bg-gradient-to-r from-sky-500 to-purple-600 text-white font-semibold hover:opacity-90 transition-all"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
