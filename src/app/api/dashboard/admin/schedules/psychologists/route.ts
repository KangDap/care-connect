import { fail, ok } from '@/lib/api-response';
import { ConsultationService } from '@/modules/consultation/consultation.service';

import { requireAdminSession } from '../../_shared';

export async function GET() {
  const { response } = await requireAdminSession();
  if (response) return response;

  try {
    const psychologists = await ConsultationService.getPsychologists();
    return ok(psychologists);
  } catch (error) {
    console.error('Fetch psychologists error:', error);
    return fail('INTERNAL_SERVER_ERROR', 'Failed to fetch psychologists', 500);
  }
}
