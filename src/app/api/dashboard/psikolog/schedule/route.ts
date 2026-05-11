import { fail, ok } from '@/lib/api-response';
import { auth } from '@/lib/auth/auth';
import { ConsultationService } from '@/modules/consultation/consultation.service';
import { headers } from 'next/headers';

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user?.id) {
    return fail('UNAUTHORIZED', 'Authentication required', 401);
  }

  // Ensure user is a psychologist
  if (session.user.role !== 'PSYCHOLOGIST' && session.user.role !== 'ADMIN') {
    return fail('FORBIDDEN', 'Access denied. Psychologist role required.', 403);
  }

  try {
    const schedules = await ConsultationService.getSchedules(session.user.id);
    return ok(schedules);
  } catch (error) {
    console.error('API GET MY SCHEDULE ERROR:', error);
    return fail('INTERNAL_SERVER_ERROR', 'Failed to fetch schedule');
  }
}
