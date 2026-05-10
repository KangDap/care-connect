import { fail, ok } from '@/lib/api-response';
import { ApiError } from '@/lib/error';
import { prisma } from '@/lib/prisma';
import { createChannelSchema } from '@/modules/community-chat/community-chat.schema';
import { CommunityChatService } from '@/modules/community-chat/community-chat.service';
import { z } from 'zod';

import { requireAdminSession } from '../_shared';

const updateChannelSchema = createChannelSchema.partial().extend({
  description: z.string().max(500).optional().nullable(),
  coverUrl: z.string().url().optional().nullable().or(z.literal('')),
});

const parsePositiveInt = (value: unknown) => {
  const num = typeof value === 'string' ? Number(value) : Number(value);
  return Number.isInteger(num) && num > 0 ? num : null;
};

export async function GET(req: Request) {
  const { session, response } = await requireAdminSession();
  if (response) return response;

  const url = new URL(req.url);
  const all = url.searchParams.get('all') !== 'false';

  const channels = await CommunityChatService.listChannels(
    session?.user.id,
    all,
  );

  return ok(channels);
}

export async function POST(req: Request) {
  const { session, response } = await requireAdminSession();
  if (response) return response;

  let validatedData;
  const contentType = req.headers.get('content-type') || '';

  try {
    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      validatedData = createChannelSchema.parse({
        name: formData.get('name'),
        description: formData.get('description'),
        type: formData.get('type'),
        coverImage: formData.get('coverImage'),
        coverUrl: formData.get('coverUrl'),
      });
    } else {
      const body = await req.json();
      validatedData = createChannelSchema.parse(body);
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return fail('BAD_REQUEST', 'Invalid channel payload', 400, error.issues);
    }
    return fail('BAD_REQUEST', 'Invalid request body', 400);
  }

  try {
    const channel = await CommunityChatService.createNewChannel(
      session!.user.id,
      'ADMIN',
      validatedData,
    );
    return ok(channel);
  } catch (error) {
    if (error instanceof ApiError) {
      return fail(error.code, error.message, error.status, error.details);
    }
    console.error('ADMIN COMMUNITY CHAT POST ERROR:', error);
    return fail('INTERNAL_SERVER_ERROR', 'Failed to create channel', 500);
  }
}

export async function PATCH(req: Request) {
  const { session, response } = await requireAdminSession();
  if (response) return response;

  let id: number | null = null;
  let validatedData: z.infer<typeof updateChannelSchema>;
  const contentType = req.headers.get('content-type') || '';

  try {
    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      id = parsePositiveInt(formData.get('id'));
      validatedData = updateChannelSchema.parse({
        name: formData.get('name') || undefined,
        description:
          formData.get('description') === ''
            ? null
            : formData.get('description') || undefined,
        type: (formData.get('type') as 'PUBLIC' | 'PRIVATE') || undefined,
        coverImage: formData.get('coverImage') || undefined,
        coverUrl: (formData.get('coverUrl') as string) || undefined,
      });
    } else {
      const body = await req.json();
      id = parsePositiveInt(body.id);
      validatedData = updateChannelSchema.parse(body);
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return fail('BAD_REQUEST', 'Invalid update payload', 400, error.issues);
    }
    return fail('BAD_REQUEST', 'Invalid request body', 400);
  }

  if (!id) {
    return fail('BAD_REQUEST', 'id must be a positive integer', 400);
  }

  try {
    const updated = await CommunityChatService.updateChannel(
      session!.user.id,
      'ADMIN',
      id,
      validatedData,
    );
    return ok(updated);
  } catch (error) {
    if (error instanceof ApiError) {
      return fail(error.code, error.message, error.status, error.details);
    }
    console.error('ADMIN COMMUNITY CHAT PATCH ERROR:', error);
    return fail('INTERNAL_SERVER_ERROR', 'Failed to update channel', 500);
  }
}

export async function DELETE(req: Request) {
  const { response } = await requireAdminSession();
  if (response) return response;

  let body: { id?: number } | null = null;

  try {
    body = await req.json();
  } catch {
    body = null;
  }

  const url = new URL(req.url);
  const idParam = url.searchParams.get('id');
  const id = parsePositiveInt(body?.id ?? idParam);

  if (!id) {
    return fail('BAD_REQUEST', 'id must be a positive integer', 400);
  }

  const existing = await prisma.channel.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!existing) {
    return fail('NOT_FOUND', 'Channel not found', 404);
  }

  await prisma.$transaction([
    prisma.chat.deleteMany({ where: { channelId: id } }),
    prisma.channelMember.deleteMany({ where: { channelId: id } }),
    prisma.channel.delete({ where: { id } }),
  ]);

  return ok({ id });
}
