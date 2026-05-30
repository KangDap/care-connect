import { fail, ok } from '@/lib/api-response';
import { ApiError } from '@/lib/error';
import { prisma } from '@/lib/prisma';

type RouteParams = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_req: Request, { params }: RouteParams) {
  try {
    const { id: rawId } = await params;
    const id = Number(rawId);

    if (!Number.isInteger(id) || id <= 0) {
      return fail('BAD_REQUEST', 'id must be a positive integer', 400);
    }

    const report = await prisma.report.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        category: true,
        province: true,
        city: true,
        status: true,
        incidentDate: true,
        description: true,
        evidences: {
          select: {
            id: true,
            fileName: true,
            fileUrl: true,
            mimeType: true,
            fileSize: true,
            uploadedAt: true,
          },
          orderBy: { uploadedAt: 'desc' },
        },
      },
    });

    if (!report) {
      return fail('NOT_FOUND', 'Report not found', 404);
    }

    return ok(report);
  } catch (error) {
    if (error instanceof ApiError) {
      return fail(error.code, error.message, error.status, error.details);
    }

    console.error('REPORT GET ROUTE ERROR:', error);
    return fail('INTERNAL_SERVER_ERROR', 'Internal server error', 500);
  }
}
