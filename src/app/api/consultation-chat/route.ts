import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/prisma';
import {
  getConsultationMessages,
  sendConsultationMessage,
} from '@/modules/consultation-chat/consultation-chat.service';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET: Retrieve chat history OR active consultations
 * Query param: consultationId (optional)
 *   - If consultationId exists: returns chat messages
 *   - If NOT: returns active consultations for the user
 */
export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: req.headers,
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const consultationId = searchParams.get('consultationId');

    // Case A: Fetch specific chat messages
    if (consultationId) {
      const result = await getConsultationMessages(
        Number(consultationId),
        session.user.id,
      );
      return NextResponse.json(result);
    }

    // Case B: Fetch active consultations
    const userId = session.user.id;
    const consultations = await prisma.consultation.findMany({
      where: {
        OR: [{ userId: userId }, { psychologistId: userId }],
      },
      include: {
        user: { select: { id: true, name: true, image: true, role: true } },
        psychologist: {
          select: { id: true, name: true, image: true, role: true },
        },
      },
      orderBy: {
        date: 'desc',
      },
    });

    return NextResponse.json(consultations);
  } catch (error: unknown) {
    const err = error as { status?: number; message?: string };
    console.error('API Chat GET error:', err);
    const status = err.status || 500;
    return NextResponse.json(
      { error: err.message || 'Internal Server Error' },
      { status },
    );
  }
}

/**
 * POST: Send a message in a consultation chat
 * Body: FormData (consultationId, content, isAnonymous, media, replyToId)
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: req.headers,
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const consultationId = formData.get('consultationId');
    const content = formData.get('content') || '';
    const isAnonymous = formData.get('isAnonymous') === 'true';
    const media = formData.get('media');
    const replyToId = formData.get('replyToId');

    if (!consultationId) {
      return NextResponse.json(
        { error: 'Missing consultationId' },
        { status: 400 },
      );
    }

    const chat = await sendConsultationMessage(session.user.id, {
      consultationId: Number(consultationId),
      content: content as string,
      isAnonymous,
      media: media instanceof File && media.size > 0 ? media : null,
      replyToId: replyToId ? Number(replyToId) : null,
    });

    return NextResponse.json(chat);
  } catch (error: unknown) {
    const err = error as { status?: number; message?: string };
    console.error('API Chat POST error:', err);
    const status = err.status || 500;
    return NextResponse.json(
      { error: err.message || 'Internal Server Error' },
      { status },
    );
  }
}
