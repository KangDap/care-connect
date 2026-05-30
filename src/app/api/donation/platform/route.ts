import { handleDonationRequest } from '../_shared';

export async function POST(req: Request) {
  return handleDonationRequest(req, {
    donationType: 'PLATFORM',
  });
}
