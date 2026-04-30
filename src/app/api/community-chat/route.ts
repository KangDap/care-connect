import { auth } from '@/lib/auth/auth';
import { ApiError } from '@/lib/error';
import { createChannelSchema } from '@/modules/community-chat/community-chat.schema';
import { CommunityChatService } from '@/modules/community-chat/community-chat.service';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    const userId = session?.user?.id;

    const channels = await CommunityChatService.listChannels(userId);
    return NextResponse.json(channels);
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

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const validatedData = createChannelSchema.parse(body);

    const channel = await CommunityChatService.createNewChannel(
      session.user.id,
      session.user.role,
      validatedData,
    );

    return NextResponse.json(channel, { status: 201 });
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
