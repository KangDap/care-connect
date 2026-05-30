import { created, fail } from '@/lib/api-response';
import { auth } from '@/lib/auth/auth';
import { ApiError } from '@/lib/error';
import { DonationService } from '@/modules/donation/donation.service';
import type { DonationType } from '@/modules/donation/donation.types';
import { headers } from 'next/headers';

type DonationRequestOptions = {
  donationType: DonationType;
  reportId?: number;
};

export const handleDonationRequest = async (
  requestOrFormData: Request | FormData,
  options: DonationRequestOptions,
) => {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user?.id) {
      return fail('UNAUTHORIZED', 'Authentication required', 401);
    }

    const formData =
      requestOrFormData instanceof FormData
        ? requestOrFormData
        : await requestOrFormData.formData();

    if (typeof options.reportId === 'number') {
      formData.set('reportId', String(options.reportId));
    } else {
      formData.delete('reportId');
    }

    formData.set('donationType', options.donationType);

    const validatedData = DonationService.validateCreateDonation(
      formData,
      options.donationType,
    );

    const headerList = await headers();
    const forwardedProto = headerList.get('x-forwarded-proto');
    const forwardedHost =
      headerList.get('x-forwarded-host') || headerList.get('host');
    const protocol = forwardedProto || 'http';
    const origin = forwardedHost ? `${protocol}://${forwardedHost}` : undefined;
    const finishUrl = origin ? `${origin}/dashboard/donations` : undefined;

    const donation = await DonationService.createDonation(
      {
        id: session.user.id,
        name: session.user.name || undefined,
        email: session.user.email || undefined,
        phoneNumber: session.user.phoneNumber || undefined,
      },
      validatedData,
      { finishUrl },
    );

    return created({
      donation: donation.donation,
      payment: donation.payment,
    });
  } catch (error) {
    if (error instanceof ApiError) {
      return fail(error.code, error.message, error.status, error.details);
    }

    console.error('DONATION CREATE ROUTE ERROR:', error);
    return fail('INTERNAL_SERVER_ERROR', 'Internal server error', 500);
  }
};
