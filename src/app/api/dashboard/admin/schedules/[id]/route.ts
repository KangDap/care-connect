import { fail, ok } from '@/lib/api-response';
import { ConsultationService } from '@/modules/consultation/consultation.service';

import { requireAdminSession } from '../../_shared';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { response } = await requireAdminSession();
  if (response) return response;

  try {
    const { id } = await params;
    const schedules = await ConsultationService.getSchedules(id);
    return ok(schedules);
  } catch (error) {
    console.error('Fetch schedules error:', error);
    return fail('INTERNAL_SERVER_ERROR', 'Failed to fetch schedules', 500);
  }
}
