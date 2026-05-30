import { fail } from '@/lib/api-response';

import { handleDonationRequest } from '../../_shared';

type ReportDonationRouteParams = {
  params: Promise<{
    reportId: string;
  }>;
};

export async function POST(
  req: Request,
  { params }: ReportDonationRouteParams,
) {
  const { reportId } = await params;
  const parsedReportId = Number(reportId);

  if (!Number.isInteger(parsedReportId) || parsedReportId <= 0) {
    return fail('BAD_REQUEST', 'Invalid reportId', 400);
  }

  return handleDonationRequest(req, {
    donationType: 'REPORT',
    reportId: parsedReportId,
  });
}
