import { auth } from '@/lib/auth/auth';
import { ApiError, Errors } from '@/lib/error';
import { AIService } from '@/modules/ai/ai.service';
import { headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user) {
      throw Errors.unauthorized('Authentication required');
    }

    if (session.user.role !== 'ADMIN') {
      throw Errors.forbidden('Admin role required');
    }

    const { searchParams } = new URL(req.url);
    const period = searchParams.get('period') || '1m';
    const sampleSize = searchParams.get('sampleSize') || '10';

    const result = await AIService.getStatisticalAnalysis({
      period: period as '1w' | '1m' | '3m' | '6m' | '1y' | 'all',
      sampleSize: parseInt(sampleSize, 10),
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }

    const errorMessage =
      error instanceof Error ? error.message : 'Internal server error';

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
