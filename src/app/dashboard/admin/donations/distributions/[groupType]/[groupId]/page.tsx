import { notFound, redirect } from 'next/navigation';

import { AdminDonationDistributionDetail } from '../../../AdminDonationDistribution';

const paymentEnabled = process.env.NEXT_PUBLIC_PAYMENT_ENABLED === 'true';

export const metadata = {
  title: 'Donation Distribution Detail | CareConnect Admin',
};

export default async function DonationDistributionDetailPage({
  params,
}: {
  params: Promise<{ groupType: string; groupId: string }>;
}) {
  if (!paymentEnabled) {
    redirect('/dashboard/admin');
  }

  const { groupType, groupId } = await params;
  if (groupType !== 'platform' && groupType !== 'report') notFound();
  if (groupType === 'platform' && groupId !== 'platform') notFound();
  if (groupType === 'report' && !/^\d+$/.test(groupId)) notFound();

  return (
    <AdminDonationDistributionDetail groupType={groupType} groupId={groupId} />
  );
}
