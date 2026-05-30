import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/prisma';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function PsikologLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let session = null;
  try {
    session = await auth.api.getSession({ headers: await headers() });
  } catch (e) {
    const err = e as { message?: string; digest?: string };
    if (
      err?.message?.includes('Dynamic server usage') ||
      err?.digest === 'DYNAMIC_SERVER_USAGE'
    ) {
      throw e;
    }
    console.error('Failed to get session (psikolog layout):', e);
  }

  if (!session?.user) {
    redirect('/login');
  }

  let user = null;
  try {
    user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });
  } catch (e) {
    console.error('Failed to fetch user role (psikolog layout):', e);
  }

  if (user?.role !== 'PSYCHOLOGIST') {
    redirect('/dashboard');
  }

  return <>{children}</>;
}
