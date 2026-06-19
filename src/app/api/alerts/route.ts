import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const alerts = await prisma.alert.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return NextResponse.json({ alerts });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ alerts: [], error: message });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const alert = await prisma.alert.create({
      data: {
        districtName: body.district,
        riskLevel: body.riskLevel,
        probability: body.probability,
        activeCases: body.activeCases || 0,
        growthRate: body.growthRate || 0,
        message: body.message,
      },
    });
    return NextResponse.json({ alert });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { id } = await req.json();
    const alert = await prisma.alert.update({
      where: { id },
      data: { acknowledged: true, acknowledgedAt: new Date() },
    });
    return NextResponse.json({ alert });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
