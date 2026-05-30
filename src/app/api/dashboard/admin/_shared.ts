import { UserRole as UserRoleEnum } from '@/generated/prisma/enums';
import type { UserRole } from '@/generated/prisma/enums';
import { fail } from '@/lib/api-response';
import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/prisma';
import { headers } from 'next/headers';

type Session = Awaited<ReturnType<typeof auth.api.getSession>>;

type AdminSessionResult = {
  session: Session | null;
  response: ReturnType<typeof fail> | null;
};

const isUserRole = (value: unknown): value is UserRole =>
  typeof value === 'string' &&
  Object.values(UserRoleEnum).includes(value as UserRole);

export async function requireAdminSession(): Promise<AdminSessionResult> {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user?.id) {
    return {
      session: null,
      response: fail('UNAUTHORIZED', 'Authentication required', 401),
    };
  }

  let role: UserRole | undefined;

  if (isUserRole(session.user.role)) {
    role = session.user.role;
  }

  if (!role) {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (isUserRole(user?.role)) {
      role = user?.role;
    }
  }

  if (role !== 'ADMIN') {
    return {
      session: null,
      response: fail('FORBIDDEN', 'Access denied. Admin role required.', 403),
    };
  }

  return { session, response: null };
}
