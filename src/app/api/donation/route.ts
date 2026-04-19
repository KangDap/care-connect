import { created, fail, ok } from '@/lib/api-response';
import { auth } from '@/lib/auth/auth';
import { ApiError } from '@/lib/error';
import { DonationService } from '@/modules/donation/donation.service';
import { headers } from 'next/headers';

export async function GET() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user?.id) {
      return fail('UNAUTHORIZED', 'Authentication required', 401);
    }

    const donations = await DonationService.getDonationHistory(session.user.id);

    return ok(donations);
  } catch (error) {
    if (error instanceof ApiError) {
      return fail(error.code, error.message, error.status, error.details);
    }
    console.error('DONATION GET ROUTE ERROR:', error);
    return fail('INTERNAL_SERVER_ERROR', 'Internal server error', 500);
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user?.id) {
      return fail('UNAUTHORIZED', 'Authentication required', 401);
    }

    const formData = await req.formData();
    const validatedData = DonationService.validateCreateDonation(formData);
    const donation = await DonationService.createDonation(
      {
        id: session.user.id,
        name: session.user.name || undefined,
        email: session.user.email || undefined,
      },
      validatedData,
    );

    return created({
      donation: donation.donation,
      payment: donation.payment,
    });
  } catch (error) {
    if (error instanceof ApiError) {
      return fail(error.code, error.message, error.status, error.details);
    }
    console.error('DONATION POST ROUTE ERROR:', error);
    return fail('INTERNAL_SERVER_ERROR', 'Internal server error', 500);
  }
}
