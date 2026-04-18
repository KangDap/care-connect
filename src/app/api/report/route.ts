import { created, fail } from '@/lib/api-response';
import { auth } from '@/lib/auth/auth';
import { ApiError } from '@/lib/error';
import { ReportService } from '@/modules/report/report.service';
import { headers } from 'next/headers';

export async function POST(req: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user) {
      return fail('UNAUTHORIZED', 'Authentication required', 401);
    }

    if (!session.user.id) {
      return fail('UNAUTHORIZED', 'Invalid user session', 401);
    }

    const formData = await req.formData();
    const validatedData = ReportService.validateCreateReport(formData);

    const report = await ReportService.createReport(
      session.user.id,
      validatedData,
    );

    return created({
      id: report.id,
      title: report.title,
      category: report.category,
      status: report.status,
      incidentDate: report.incidentDate,
      createdAt: report.createdAt,
    });
  } catch (error) {
    if (error instanceof ApiError) {
      return fail(error.code, error.message, error.status, error.details);
    }
    console.error('REPORT POST ROUTE ERROR:', error);
    return fail('INTERNAL_SERVER_ERROR', 'Internal server error', 500);
  }
}
