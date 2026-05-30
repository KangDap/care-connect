'use client';

import { Card } from '@/components/card';
import { Table } from '@/components/table';
import { Activity, CreditCard, Users } from 'lucide-react';

interface DonationStats {
  totalPool: number;
  yourSessions: number;
  totalPlatformSessions: number;
  allocationPercentage: number;
}

interface DonationHistoryItem {
  id: number;
  period: string;
  sessions: number;
  platformPool: number;
  incentive: number;
}

interface PsychologistDonationsProps {
  stats: DonationStats;
  history: DonationHistoryItem[];
}

const PoolIcon = () => <Users size={20} strokeWidth={2} />;
const ActivityIcon = () => <Activity size={20} strokeWidth={2} />;
const WalletIcon = () => <CreditCard size={20} strokeWidth={2} />;

const formatRupiah = (value: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(value);

export default function PsychologistDonationsContent({
  stats,
  history,
}: PsychologistDonationsProps) {
  const estimatedIncentive =
    stats.totalPlatformSessions > 0
      ? stats.totalPool *
        stats.allocationPercentage *
        (stats.yourSessions / stats.totalPlatformSessions)
      : 0;

  const statCards = [
    {
      label: 'Total Platform Pool',
      val: formatRupiah(stats.totalPool),
      icon: <PoolIcon />,
    },
    {
      label: 'Your Sessions',
      val: `${stats.yourSessions} Sessions`,
      icon: <ActivityIcon />,
    },
    {
      label: 'Est. Your Incentive',
      val: formatRupiah(estimatedIncentive),
      icon: <WalletIcon />,
    },
  ];

  return (
    <div className="space-y-6 md:space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h2 className="text-2xl sm:text-3xl md:text-[32px] font-black text-[#193c1f] tracking-tight">
          Donation Transparency
        </h2>
        <p className="text-[#8ea087] font-medium text-sm md:text-base mt-1">
          Track how community donations are distributed based on your clinical
          contributions.
        </p>
      </div>

      {/* Summary Cards — 1 col mobile, 3 on sm+ */}
      <div className="grid grid-cols-3 gap-2 md:gap-4">
        {statCards.map((item, index) => (
          <Card
            key={index}
            className="flex items-center gap-2 bg-[#f7f3ed] border-0 p-2 sm:p-4 md:p-5 rounded-[16px] md:rounded-[28px]"
          >
            <div className="w-6 h-6 sm:w-9 sm:h-9 md:w-11 md:h-11 bg-[#EBE6DE] rounded-lg md:rounded-2xl flex items-center justify-center shrink-0 text-[#193c1f]">
              {item.icon}
            </div>
            <div className="min-w-0">
              <p className="text-[9px] sm:text-[10px] uppercase font-black text-[#8ea087] tracking-widest truncate">
                {item.label}
              </p>
              <p className="text-base sm:text-lg md:text-[22px] font-bold text-[#193c1f] leading-tight truncate">
                {item.val}
              </p>
            </div>
          </Card>
        ))}
      </div>

      {/* Formula Info */}
      <Card className="flex gap-4 md:gap-6 items-center p-4 md:p-6 rounded-[20px] md:rounded-[28px]">
        <div className="w-10 h-10 md:w-12 md:h-12 bg-[#f7f3ed] rounded-full flex items-center justify-center shrink-0 font-black text-[#193c1f] text-sm md:text-base">
          i
        </div>
        <p className="text-xs md:text-[13px] text-[#193c1f]/70 leading-relaxed font-medium">
          Incentives are calculated from{' '}
          <span className="font-bold text-[#193c1f]">
            {stats.allocationPercentage * 100}%
          </span>{' '}
          of the total monthly pool, pro-rated by your{' '}
          <span className="font-bold text-[#193c1f]">contribution ratio</span> (
          {stats.yourSessions}/{stats.totalPlatformSessions} sessions).
        </p>
      </Card>

      {/* Distribution History Table */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-lg sm:text-xl font-black text-[#193c1f] tracking-tight">
              Distribution History
            </h3>
            <p className="text-xs text-[#8ea087] font-medium mt-0.5">
              Monthly incentive records
            </p>
          </div>
          <span className="text-[10px] md:text-[11px] font-black text-[#8ea087] uppercase tracking-widest bg-[#f7f3ed] px-3 py-1 rounded-full border border-[#D0D5CB]">
            Archive 2026
          </span>
        </div>
        <Table
          data={history}
          keyExtractor={(item) => item.id}
          emptyMessage="No distribution history available yet."
          columns={[
            {
              header: 'Period',
              cell: (item) => (
                <p className="font-bold text-[#193c1f] text-xs md:text-sm">
                  {item.period}
                </p>
              ),
            },
            {
              header: 'Activity',
              cell: (item) => (
                <p className="text-[#193c1f] text-xs md:text-sm">
                  {item.sessions} Sessions
                </p>
              ),
            },
            {
              header: 'Platform Pool',
              cell: (item) => (
                <p className="text-[#8ea087] text-xs md:text-sm">
                  {formatRupiah(item.platformPool)}
                </p>
              ),
            },
            {
              header: 'Incentive Received',
              cell: (item) => (
                <p className="font-bold text-[#193c1f] text-xs md:text-sm">
                  {formatRupiah(item.incentive)}
                </p>
              ),
            },
          ]}
        />
      </div>
    </div>
  );
}
