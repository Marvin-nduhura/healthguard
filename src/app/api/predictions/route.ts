import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Production Flask backend URL — falls back to localhost for local dev
const FLASK_URL = process.env.FLASK_API_URL || 'https://healthguard-api-vtrp.onrender.com';

// Warm up the Flask service (Render free tier sleeps after 15 min inactivity).
// Fire-and-forget — never blocks the main request.
async function warmUpFlask(): Promise<void> {
  try {
    await fetch(`${FLASK_URL}/ping`, {
      signal: AbortSignal.timeout(5000),
    });
  } catch {
    // ignore — it might already be awake, or the ping itself wakes it
  }
}

export async function GET(req: NextRequest) {
  const model = req.nextUrl.searchParams.get('model') || 'ensemble';

  // Fire warm-up in the background so it doesn't add latency
  warmUpFlask().catch(() => {});

  try {
    const res = await fetch(`${FLASK_URL}/api/predictions?model=${model}`, {
      headers: { 'Content-Type': 'application/json' },
      // Give the backend up to 60 s — Render free tier can take ~30 s to wake
      signal: AbortSignal.timeout(60000),
    });

    if (!res.ok) throw new Error(`Flask API returned ${res.status}`);

    const data = await res.json();

    // Persist prediction snapshot to Prisma Postgres (non-blocking)
    persistSnapshot(data, model).catch(() => {});

    return NextResponse.json(data);

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('Predictions API error:', message);

    // Fall back to the most recent cached snapshot from Prisma Postgres
    try {
      const cached = await prisma.predictionSnapshot.findFirst({
        orderBy: { createdAt: 'desc' },
        where: { modelChoice: model },
      });

      if (cached) {
        return NextResponse.json({
          ...JSON.parse(cached.data),
          _cached: true,
          _cachedAt: cached.createdAt,
          _error: 'Flask API unavailable — showing last cached Prisma Postgres data',
        });
      }
    } catch { /* DB also unavailable */ }

    return NextResponse.json(
      {
        error: 'Flask API unavailable. It may be waking up — please wait 30 s and retry.',
        details: message,
        flaskUrl: FLASK_URL,
        hint: 'Render free tier services sleep after 15 min of inactivity. First request takes ~30 s.',
      },
      { status: 503 },
    );
  }
}

async function persistSnapshot(data: Record<string, unknown>, model: string): Promise<void> {
  const stats = data.stats as Record<string, unknown>;
  await prisma.predictionSnapshot.create({
    data: {
      modelChoice:    model,
      data:           JSON.stringify(data),
      stats:          JSON.stringify(stats),
      nationalActive: Number(stats?.nationalActiveCases) || 0,
      avgProbability: Number(stats?.avgProbability)      || 0,
      highRiskCount:  Number(stats?.highRiskCount)       || 0,
    },
  });
}
