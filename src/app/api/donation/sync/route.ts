import { fail, ok } from '@/lib/api-response';
import { auth } from '@/lib/auth/auth';
import { ApiError, Errors } from '@/lib/error';
import { DonationService } from '@/modules/donation/donation.service';
import { headers } from 'next/headers';

export async function POST(req: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user?.id) {
      return fail('UNAUTHORIZED', 'Authentication required', 401);
    }

    const payload = await req.json().catch(() => ({}));
    const orderId = payload?.orderId;

    if (typeof orderId !== 'string' || orderId.trim().length === 0) {
      throw Errors.badRequest('orderId is required');
    }

    const result = await DonationService.syncDonationStatusByOrderId(
      orderId,
      session.user.id,
    );

    return ok(result);
  } catch (error) {
    if (error instanceof ApiError) {
      return fail(error.code, error.message, error.status, error.details);
    }

    console.error('DONATION SYNC ROUTE ERROR:', error);
    return fail('INTERNAL_SERVER_ERROR', 'Internal server error', 500);
  }
}
