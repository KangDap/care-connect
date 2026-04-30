import { auth } from '@/lib/auth/auth';
import { ApiError } from '@/lib/error';
import { CommunityChatService } from '@/modules/community-chat/community-chat.service';
import { headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const channelId = Number(id);
    if (isNaN(channelId)) {
      return NextResponse.json(
        { error: 'Invalid channel ID' },
        { status: 400 },
      );
    }
    const result = await CommunityChatService.getChannelDetails(
      channelId,
      session.user.id,
    );

    return NextResponse.json(result);
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
