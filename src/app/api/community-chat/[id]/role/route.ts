import { auth } from '@/lib/auth/auth';
import { ApiError } from '@/lib/error';
import { CommunityChatService } from '@/modules/community-chat/community-chat.service';
import { headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId: targetUserId, role: newRole } = await req.json();
    if (!targetUserId || !newRole) {
      return NextResponse.json(
        { error: 'Missing userId or role' },
        { status: 400 },
      );
    }

    const { id } = await params;
    const channelId = Number(id);
    if (isNaN(channelId)) {
      return NextResponse.json(
        { error: 'Invalid channel ID' },
        { status: 400 },
      );
    }
    await CommunityChatService.changeUserRole(
      session.user.id,
      session.user.role,
      targetUserId,
      channelId,
      newRole,
    );

    return NextResponse.json({ success: true, message: 'Role updated' });
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
