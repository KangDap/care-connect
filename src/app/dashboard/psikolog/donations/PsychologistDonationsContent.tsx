'use client';

import React from 'react';

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

const PoolIcon = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#193C1F"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
    <circle cx="9" cy="7" r="4"></circle>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
  </svg>
);

const ActivityIcon = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#193C1F"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
  </svg>
);

const WalletIcon = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#193C1F"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="2" y="5" width="20" height="14" rx="2" ry="2"></rect>
    <line x1="2" y1="10" x2="22" y2="10"></line>
  </svg>
);

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
    stats.totalPool *
    stats.allocationPercentage *
    (stats.yourSessions / stats.totalPlatformSessions);

  return (
    <div className="space-y-10 animate-fade-in">
      <div>
        <h2 className="text-[32px] font-black text-[#193C1F] tracking-tight">
          Donation Transparency
        </h2>
        <p className="text-[#8EA087] font-medium">
          Track how community donations are distributed based on your clinical
          contributions.
        </p>
      </div>

      {/* SUMMARY CARDS */}
      <div className="flex gap-8">
        {[
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
        ].map((item, index) => (
          <div
            key={index}
            className="bg-[#F7F3ED] p-8 rounded-[28px] border border-[#D0D5CB] flex items-center gap-6 flex-1 shadow-sm transition-all hover:shadow-md"
          >
            <div className="w-14 h-14 bg-[#EBE6DE] rounded-2xl flex items-center justify-center shrink-0">
              {item.icon}
            </div>
            <div>
              <p className="text-[10px] uppercase font-black text-[#8EA087] tracking-widest mb-1">
                {item.label}
              </p>
              <p className="text-[24px] font-bold text-[#193C1F] leading-none">
                {item.val}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* FORMULA INFO */}
      <div className="bg-white p-7 rounded-[24px] border border-[#D0D5CB]/50 flex gap-6 items-center shadow-sm">
        <div className="w-12 h-12 bg-[#F7F3ED] rounded-full flex items-center justify-center shrink-0 font-black text-[#193C1F]">
          i
        </div>
        <p className="text-[13px] text-[#193C1F]/70 leading-relaxed font-medium">
          Incentives are calculated from{' '}
          <span className="font-bold text-[#193C1F]">
            {stats.allocationPercentage * 100}%
          </span>{' '}
          of the total monthly pool, pro-rated by your{' '}
          <span className="font-bold text-[#193C1F]">contribution ratio</span> (
          {stats.yourSessions}/{stats.totalPlatformSessions} sessions).
        </p>
      </div>

      {/* TABLE */}
      <div className="bg-white border border-[#D0D5CB] rounded-[32px] overflow-hidden shadow-sm">
        <div className="p-8 border-b border-[#F7F3ED] bg-[#FDFCFB] flex justify-between items-center">
          <h3 className="font-bold text-[18px] text-[#193C1F]">
            Distribution History
          </h3>
          <span className="text-[11px] font-black text-[#8EA087] uppercase tracking-widest bg-[#F7F3ED] px-4 py-1 rounded-full">
            Archive 2026
          </span>
        </div>
        <table className="w-full text-left border-collapse">
          <thead className="bg-[#F7F3ED] text-[11px] text-[#8EA087] font-black uppercase tracking-widest">
            <tr>
              <th className="px-8 py-5">Period</th>
              <th className="px-8 py-5">Activity</th>
              <th className="px-8 py-5">Platform Pool</th>
              <th className="px-8 py-5">Incentive Received</th>
            </tr>
          </thead>
          <tbody className="text-[14px] text-[#193C1F]">
            {history.map((item) => (
              <tr
                key={item.id}
                className="border-b border-[#F7F3ED] last:border-0 hover:bg-[#FDFCFB] transition-colors"
              >
                <td className="px-8 py-6 font-bold">{item.period}</td>
                <td className="px-8 py-6">{item.sessions} Sessions</td>
                <td className="px-8 py-6 opacity-60">
                  {formatRupiah(item.platformPool)}
                </td>
                <td className="px-8 py-6 font-bold text-[#193C1F]">
                  {formatRupiah(item.incentive)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
