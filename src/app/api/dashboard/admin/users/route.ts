import { fail, ok } from '@/lib/api-response';
import { prisma } from '@/lib/prisma';

import { requireAdminSession } from '../_shared';

export async function PATCH(req: Request) {
  const { response } = await requireAdminSession();
  if (response) return response;

  try {
    const body = await req.json();
    const { id, action, payload } = body;

    if (!id || typeof id !== 'string') {
      return fail('BAD_REQUEST', 'User ID is required', 400);
    }

    if (action === 'role') {
      const { role } = payload;
      if (!['user', 'ADMIN', 'PSYCHOLOGIST'].includes(role)) {
        return fail('BAD_REQUEST', 'Invalid role', 400);
      }

      const updatedUser = await prisma.user.update({
        where: { id },
        data: { role },
      });
      return ok({ id: updatedUser.id, role: updatedUser.role });
    }

    if (action === 'ban') {
      const { banned, reason } = payload;
      const updatedUser = await prisma.user.update({
        where: { id },
        data: {
          banned: Boolean(banned),
          banReason: banned ? reason || null : null,
        },
      });
      return ok({ id: updatedUser.id, banned: updatedUser.banned });
    }

    return fail('BAD_REQUEST', 'Invalid action', 400);
  } catch (error) {
    console.error('Update user error:', error);
    return fail('INTERNAL_SERVER_ERROR', 'Failed to update user', 500);
  }
}
