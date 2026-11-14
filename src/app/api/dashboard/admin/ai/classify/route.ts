import { auth } from '@/lib/auth/auth';
import { ApiError, Errors } from '@/lib/error';
import { AIService } from '@/modules/ai/ai.service';
import { headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user) {
      throw Errors.unauthorized('Authentication required');
    }

    if (session.user.role !== 'ADMIN') {
      throw Errors.forbidden('Admin role required');
    }

    let body = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }

    const result = await AIService.classify(body);

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
