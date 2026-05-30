import { auth } from '@/lib/auth/auth';
import { ApiError } from '@/lib/error';
import { sendMessageSchema } from '@/modules/community-chat/community-chat.schema';
import { CommunityChatService } from '@/modules/community-chat/community-chat.service';
import { headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const content = formData.get('content') as string;
    const isAnonymous = formData.get('isAnonymous') === 'true';
    const media = formData.get('media');
    const replyToId = formData.get('replyToId');

    const { id } = await params;
    const channelId = Number(id);
    if (isNaN(channelId)) {
      return NextResponse.json(
        { error: 'Invalid channel ID' },
        { status: 400 },
      );
    }
    const validatedData = sendMessageSchema.parse({
      channelId,
      content,
      isAnonymous,
      replyToId: replyToId ? Number(replyToId) : null,
    });

    const message = await CommunityChatService.postMessage(session.user.id, {
      ...validatedData,
      media: media instanceof File && media.size > 0 ? media : null,
    });

    return NextResponse.json(message, { status: 201 });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 },
    );
  }
}
