import { fail, ok } from '@/lib/api-response';
import { ApiError } from '@/lib/error';
import { DonationDistributionService } from '@/modules/donation-distribution/donation-distribution.service';

import { requireAdminSession } from '../../../_shared';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { response } = await requireAdminSession();
  if (response) return response;

  try {
    const { id } = await params;
    const distributionId = Number(id);
    const distribution =
      await DonationDistributionService.getDistributionById(distributionId);

    return ok(distribution);
  } catch (error) {
    if (error instanceof ApiError) {
      return fail(error.code, error.message, error.status, error.details);
    }
    console.error('DISTRIBUTION DETAIL ROUTE ERROR:', error);
    return fail('INTERNAL_SERVER_ERROR', 'Internal server error', 500);
  }
}
