import { fail, ok } from '@/lib/api-response';
import { ApiError } from '@/lib/error';
import { DonationService } from '@/modules/donation/donation.service';

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    const validatedPayload = DonationService.validateMidtransWebhook(payload);

    const result =
      await DonationService.handleMidtransWebhook(validatedPayload);

    return ok({
      message: 'Webhook processed successfully',
      ...result,
    });
  } catch (error) {
    if (error instanceof ApiError) {
      return fail(error.code, error.message, error.status, error.details);
    }

    console.error('DONATION WEBHOOK ROUTE ERROR:', error);
    return fail('INTERNAL_SERVER_ERROR', 'Internal server error', 500);
  }
}
