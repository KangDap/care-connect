import { fail, ok } from '@/lib/api-response';
import { ApiError } from '@/lib/error';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');

    const where: Record<string, unknown> = {
      status: 'RESOLVED',
    };

    if (category) {
      where.category = category;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const reports = await prisma.report.findMany({
      where,
      select: {
        id: true,
        title: true,
        category: true,
        province: true,
        city: true,
        status: true,
        incidentDate: true,
        description: true,
        createdAt: true,
        isPublic: true,
        isAnonymous: true,
        user: {
          select: {
            name: true,
          },
        },
        evidences: {
          select: {
            fileUrl: true,
            mimeType: true,
            uploadedAt: true,
          },
          orderBy: { uploadedAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    const reportsWithCover = reports.map(({ evidences, ...report }) => ({
      ...report,
      coverImageUrl:
        evidences.find((e) => e.mimeType?.startsWith('image/'))?.fileUrl ??
        null,
    }));

    return ok(reportsWithCover);
  } catch (error) {
    if (error instanceof ApiError) {
      return fail(error.code, error.message, error.status, error.details);
    }

    console.error('PUBLIC REPORTS GET ROUTE ERROR:', error);
    return fail('INTERNAL_SERVER_ERROR', 'Internal server error', 500);
  }
}
