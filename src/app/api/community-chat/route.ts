import { auth } from '@/lib/auth/auth';
import { ApiError } from '@/lib/error';
import { createChannelSchema } from '@/modules/community-chat/community-chat.schema';
import { CommunityChatService } from '@/modules/community-chat/community-chat.service';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    const userId = session?.user?.id;

    const { searchParams } = new URL(req.url);
    const all = searchParams.get('all') === 'true';

    const channels = await CommunityChatService.listChannels(userId, all);
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

    let validatedData;
    const contentType = req.headers.get('content-type') || '';

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      validatedData = createChannelSchema.parse({
        name: formData.get('name'),
        description: formData.get('description'),
        type: formData.get('type'),
        coverImage: formData.get('coverImage'),
      });
    } else {
      const body = await req.json();
      validatedData = createChannelSchema.parse(body);
    }

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
