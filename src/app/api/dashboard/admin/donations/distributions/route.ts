import { fail, ok } from '@/lib/api-response';
import { ApiError } from '@/lib/error';
import { DonationDistributionService } from '@/modules/donation-distribution/donation-distribution.service';

import { requireAdminSession } from '../../_shared';

export async function POST(req: Request) {
  const { session, response } = await requireAdminSession();
  if (response) return response;
  if (!session?.user?.id) {
    return fail('UNAUTHORIZED', 'Authentication required', 401);
  }

  try {
    const body = await req.json();
    const input = DonationDistributionService.validateCreateDistribution(body);
    const created = await DonationDistributionService.createDistribution(
      session.user.id,
      input,
    );

    return ok(created);
  } catch (error) {
    if (error instanceof ApiError) {
      return fail(error.code, error.message, error.status, error.details);
    }
    console.error('CREATE DISTRIBUTION ROUTE ERROR:', error);
    return fail('INTERNAL_SERVER_ERROR', 'Internal server error', 500);
  }
}
