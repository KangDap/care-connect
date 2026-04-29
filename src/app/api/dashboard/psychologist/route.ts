import { auth } from '@/lib/auth/auth';
import { ApiError, Errors } from '@/lib/error';
import { DashboardService } from '@/modules/dashboard/dashboard.service';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user) {
      throw Errors.unauthorized('Authentication required');
    }

    if (session.user.role !== 'PSYCHOLOGIST') {
      throw Errors.forbidden('Access denied. Psychologist role required.');
    }

    const data = await DashboardService.getPsychologistDashboard(
      session.user.id,
    );

    return NextResponse.json({ success: true, data });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }
    console.error('DASHBOARD PSYCHOLOGIST GET ROUTE ERROR:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
