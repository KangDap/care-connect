import { fail, ok } from '@/lib/api-response';
import { ApiError } from '@/lib/error';
import { ConsultationService } from '@/modules/consultation/consultation.service';

import { requireAdminSession } from '../_shared';

export async function POST(req: Request) {
  const { response } = await requireAdminSession();
  if (response) return response;

  try {
    const body = await req.json();
    const { userId, slots } = body;

    if (!userId || !Array.isArray(slots)) {
      return fail('BAD_REQUEST', 'UserId and slots array are required', 400);
    }

    const saved = await ConsultationService.saveSchedules(userId, slots);
    return ok(saved);
  } catch (error) {
    if (error instanceof ApiError) {
      return fail(error.code, error.message, error.status);
    }
    console.error('API SAVE SCHEDULES ERROR:', error);
    return fail('INTERNAL_SERVER_ERROR', 'Failed to save schedules');
  }
}
