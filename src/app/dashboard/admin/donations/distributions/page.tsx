import { AdminDonationDistribution } from '../AdminDonationDistribution';

export const metadata = {
  title: 'Distribution Management | CareConnect Admin',
  description: 'Review platform and report donation distribution groups.',
};

export default function DonationDistributionsPage() {
  return <AdminDonationDistribution />;
}
