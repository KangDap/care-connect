import { fail, ok } from '@/lib/api-response';
import { ApiError } from '@/lib/error';
import { DonationDistributionService } from '@/modules/donation-distribution/donation-distribution.service';

import { requireAdminSession } from '../../_shared';

export async function GET(req?: Request) {
  const { response } = await requireAdminSession();
  if (response) return response;

  try {
    let months = 6;
    if (req?.url) {
      const url = new URL(req.url);
      const monthsParam = url.searchParams.get('months');
      if (monthsParam) {
        months = Math.min(24, Math.max(1, Number(monthsParam) || 6));
      }
    }

    const payoutSummary =
      await DonationDistributionService.getPsychologistPayoutSummary(months);

    return ok(payoutSummary);
  } catch (error) {
    if (error instanceof ApiError) {
      return fail(error.code, error.message, error.status, error.details);
    }
    console.error('PAYOUT SUMMARY ROUTE ERROR:', error);
    return fail('INTERNAL_SERVER_ERROR', 'Internal server error', 500);
  }
}
