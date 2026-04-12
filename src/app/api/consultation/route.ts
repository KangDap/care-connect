import { auth } from '@/lib/auth/auth';
import { ApiError, Errors } from '@/lib/error';
import { ConsultationService } from '@/modules/consultation/consultation.service';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const validatedQuery = ConsultationService.validateScheduleQuery({
      date: url.searchParams.get('date') || undefined,
    });

    const slots = await ConsultationService.getScheduleAvailability(
      validatedQuery.date,
    );

    return NextResponse.json({ success: true, data: slots });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }
    console.error('CONSULTATION GET ROUTE ERROR:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user) {
      throw Errors.unauthorized('Authentication required');
    }

    if (!session.user.id) {
      throw Errors.unauthorized('Invalid user session');
    }

    const formData = await req.formData();
    const validatedData =
      ConsultationService.validateCreateConsultation(formData);

    const consultation = await ConsultationService.createConsultation(
      session.user.id,
      validatedData,
    );

    return NextResponse.json({ success: true, data: consultation });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }
    console.error('CONSULTATION POST ROUTE ERROR:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
