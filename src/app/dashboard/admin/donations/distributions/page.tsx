import { redirect } from 'next/navigation';

import { AdminDonationDistribution } from '../AdminDonationDistribution';

const paymentEnabled = process.env.NEXT_PUBLIC_PAYMENT_ENABLED === 'true';

export const metadata = {
  title: 'Distribution Management | CareConnect Admin',
  description: 'Review platform and report donation distribution groups.',
};

export default function DonationDistributionsPage() {
  if (!paymentEnabled) {
    redirect('/dashboard/admin');
  }

  return <AdminDonationDistribution />;
}
