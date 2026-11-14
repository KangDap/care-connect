import { fail, ok } from '@/lib/api-response';
import { ApiError } from '@/lib/error';
import { DonationDistributionService } from '@/modules/donation-distribution/donation-distribution.service';

import { requireAdminSession } from '../../../_shared';

export async function GET(req: Request) {
  const { response } = await requireAdminSession();
  if (response) return response;

  try {
    const url = new URL(req.url);
    const query = DonationDistributionService.validateQuery(url.searchParams);
    const history = await DonationDistributionService.getHistory(query);

    return ok(history);
  } catch (error) {
    if (error instanceof ApiError) {
      return fail(error.code, error.message, error.status, error.details);
    }
    console.error('DISTRIBUTIONS HISTORY ROUTE ERROR:', error);
    return fail('INTERNAL_SERVER_ERROR', 'Internal server error', 500);
  }
}
