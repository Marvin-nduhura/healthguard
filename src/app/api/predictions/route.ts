import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const FLASK_URL = process.env.FLASK_API_URL || 'http://localhost:5000';

export async function GET(req: NextRequest) {
  const model = req.nextUrl.searchParams.get('model') || 'ensemble';

  try {
    const res = await fetch(`${FLASK_URL}/api/predictions?model=${model}`, {
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(30000),
    });

    if (!res.ok) throw new Error(`Flask API returned ${res.status}`);

    const data = await res.json();

    // Persist snapshot to Prisma Postgres (background)
    persistSnapshot(data, model).catch(() => {});

    return NextResponse.json(data);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('Predictions API error:', message);

    // Fall back to most recent snapshot in Prisma Postgres
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
          _error: 'Flask API unavailable — showing cached Prisma Postgres data',
        });
      }
    } catch { /* DB also unavailable */ }

    return NextResponse.json(
      {
        error: 'Flask API unavailable. Start it with: python flask_api.py',
        details: message,
        hint: 'cd "D:\\Covid project API" && python flask_api.py',
      },
      { status: 503 }
    );
  }
}

async function persistSnapshot(data: Record<string, unknown>, model: string) {
  const stats = data.stats as Record<string, unknown>;
  await prisma.predictionSnapshot.create({
    data: {
      modelChoice: model,
      data: JSON.stringify(data),
      stats: JSON.stringify(stats),
      nationalActive: Number(stats?.nationalActiveCases) || 0,
      avgProbability: Number(stats?.avgProbability) || 0,
      highRiskCount: Number(stats?.highRiskCount) || 0,
    },
  });
}
