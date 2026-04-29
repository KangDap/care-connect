import PsychologistDonationsContent from './PsychologistDonationsContent';

export default function PsychologistDonationsPage() {
  // Data ini nantinya bisa diambil dari Supabase / API
  const currentMonthStats = {
    month: 'April 2026',
    totalPool: 25750000, // Total donasi seluruh platform
    yourSessions: 18, // Jumlah sesi yang diselesaikan psikolog ini
    totalPlatformSessions: 145, // Total sesi seluruh psikolog di platform
    allocationPercentage: 0.9, // Platform mengalokasikan 90% donasi untuk psikolog
  };

  const donationHistory = [
    {
      id: 1,
      period: 'March 2026',
      sessions: 15,
      platformPool: 22000000,
      incentive: 2275000,
      status: 'DISTRIBUTED',
    },
    {
      id: 2,
      period: 'February 2026',
      sessions: 20,
      platformPool: 18500000,
      incentive: 2550000,
      status: 'DISTRIBUTED',
    },
    {
      id: 3,
      period: 'January 2026',
      sessions: 12,
      platformPool: 15000000,
      incentive: 1240000,
      status: 'DISTRIBUTED',
    },
  ];

  return (
    <main>
      <PsychologistDonationsContent
        stats={currentMonthStats}
        history={donationHistory}
      />
    </main>
  );
}
