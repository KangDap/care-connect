import { fail, ok } from '@/lib/api-response';
import { auth } from '@/lib/auth/auth';
import { ApiError, Errors } from '@/lib/error';
import { prisma } from '@/lib/prisma';
import { headers } from 'next/headers';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user?.id) {
      return fail('UNAUTHORIZED', 'Authentication required', 401);
    }

    const { id } = await params;
    const donationId = Number(id);

    if (!donationId || isNaN(donationId)) {
      return fail('BAD_REQUEST', 'Invalid donation ID', 400);
    }

    const donation = await prisma.donation.findUnique({
      where: { id: donationId },
      include: {
        user: { select: { id: true, name: true, email: true } },
        report: { select: { id: true, title: true, category: true } },
      },
    });

    if (!donation) {
      throw Errors.notFound('Donation not found');
    }

    const isAdmin = session.user.role === 'ADMIN';
    if (donation.userId !== session.user.id && !isAdmin) {
      return fail('FORBIDDEN', 'You do not have access to this donation', 403);
    }

    return ok({
      id: donation.id,
      amount: Number(donation.amount),
      paymentMethod: donation.paymentMethod,
      paymentStatus: donation.paymentStatus,
      donationType: donation.donationType,
      timestamp: donation.timestamp.toISOString(),
      midtransOrderId: donation.midtransOrderId,
      snapToken: donation.snapToken,
      user: donation.user,
      report: donation.report,
    });
  } catch (error) {
    if (error instanceof ApiError) {
      return fail(error.code, error.message, error.status, error.details);
    }
    console.error('DONATION GET ROUTE ERROR:', error);
    return fail('INTERNAL_SERVER_ERROR', 'Internal server error', 500);
  }
}

export async function PATCH(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user?.id) {
      return fail('UNAUTHORIZED', 'Authentication required', 401);
    }

    const { id } = await params;
    const donationId = Number(id);

    if (!donationId || isNaN(donationId)) {
      return fail('BAD_REQUEST', 'Invalid donation ID', 400);
    }

    const donation = await prisma.donation.findUnique({
      where: { id: donationId },
      select: { id: true, userId: true, paymentStatus: true },
    });

    if (!donation) {
      throw Errors.notFound('Donation not found');
    }

    if (donation.userId !== session.user.id) {
      return fail('FORBIDDEN', 'You do not have access to this donation', 403);
    }

    if (donation.paymentStatus !== 'PENDING') {
      return fail(
        'BAD_REQUEST',
        'Only PENDING donations can be cancelled',
        400,
      );
    }

    const updated = await prisma.donation.update({
      where: { id: donationId },
      data: { paymentStatus: 'CANCELLED' },
      select: { id: true, paymentStatus: true },
    });

    return ok(updated);
  } catch (error) {
    if (error instanceof ApiError) {
      return fail(error.code, error.message, error.status, error.details);
    }
    console.error('DONATION PATCH ROUTE ERROR:', error);
    return fail('INTERNAL_SERVER_ERROR', 'Internal server error', 500);
  }
}
