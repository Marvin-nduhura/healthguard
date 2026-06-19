import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const FLASK_URL = process.env.FLASK_API_URL || 'https://healthguard-api-vtrp.onrender.com';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Call Flask nutrition screening endpoint
    let result: { result: string; confidence: number; recommendations: string[]; timestamp?: string };
    try {
      const flaskRes = await fetch(`${FLASK_URL}/api/nutrition/screen`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(10000),
      });
      result = await flaskRes.json();
    } catch {
      // Fallback: compute locally based on MUAC
      const muac = body.muac;
      if (muac < 115) {
        result = { result: 'severe', confidence: 0.92, recommendations: ['Immediate therapeutic feeding required', 'Refer to nearest TFC', 'Medical evaluation for complications'] };
      } else if (muac < 125) {
        result = { result: 'moderate', confidence: 0.88, recommendations: ['Enroll in Supplementary Feeding Program', 'Provide RUSF', 'Weekly MUAC monitoring'] };
      } else if (muac < 135) {
        result = { result: 'mild', confidence: 0.80, recommendations: ['Bi-weekly monitoring', 'Dietary diversification', 'Vitamin A supplementation'] };
      } else {
        result = { result: 'normal', confidence: 0.90, recommendations: ['Continue balanced diet', 'Monthly growth monitoring', 'Maintain vaccination schedule'] };
      }
    }

    // Save to Prisma Postgres
    try {
      await prisma.nutritionScreening.create({
        data: {
          patientAge: body.age ? Number(body.age) : undefined,
          patientSex: body.sex,
          districtName: body.district || undefined,
          muac: body.muac ? Number(body.muac) : undefined,
          weight: body.weight ? Number(body.weight) : undefined,
          height: body.height ? Number(body.height) : undefined,
          result: result.result,
          confidence: result.confidence,
          notes: body.notes,
        },
      });
    } catch { /* non-critical */ }

    return NextResponse.json({ ...result, timestamp: new Date().toISOString() });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const screenings = await prisma.nutritionScreening.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    return NextResponse.json({ screenings });
  } catch {
    return NextResponse.json({ screenings: [] });
  }
}
