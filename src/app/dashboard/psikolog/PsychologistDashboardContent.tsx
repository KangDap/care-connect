'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import React from 'react';

const TotalIcon = () => (
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

const PendingIcon = () => (
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
    <circle cx="12" cy="12" r="10"></circle>
    <polyline points="12 6 12 12 16 14"></polyline>
  </svg>
);

const CompletedIcon = () => (
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
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
    <polyline points="22 4 12 14.01 9 11.01"></polyline>
  </svg>
);

const EarningsIcon = () => (
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
    <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
  </svg>
);

const formatDateLabel = (value: Date | string) => {
  if (!value) return '-';
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
};

// Interface yang lebih longgar agar tidak bentrok dengan enum Prisma tapi tetap aman dari 'any'
interface DashboardConsultation {
  id: number;
  title: string;
  category: string;
  date: Date;
  status: string | unknown; // Menggunakan unknown alih-alih any
  isAnonymous?: boolean;
  user: { name: string | null } | null;
}

type PsychologistDashboardProps = {
  upcomingConsultations: DashboardConsultation[];
  completedConsultations: DashboardConsultation[];
  displayName: string;
  totalConsultationsCount: number;
  pendingConsultationsCount: number;
  completedConsultationsCount: number;
  monthlyEarnings: number;
};

export default function PsychologistDashboardContent({
  upcomingConsultations = [],
  completedConsultations = [],
  displayName = 'Psychologist',
  totalConsultationsCount,
  pendingConsultationsCount,
  completedConsultationsCount,
  monthlyEarnings = 0,
}: PsychologistDashboardProps) {
  const searchParams = useSearchParams();
  const searchBarQuery = searchParams.get('search')?.toLowerCase() || '';

  const pendingData = upcomingConsultations.filter((item) => {
    if (!searchBarQuery) return true;
    const patientName = item.user?.name || '';
    const title = item.title || '';
    const status = String(item.status || '');
    return (
      patientName.toLowerCase().includes(searchBarQuery) ||
      title.toLowerCase().includes(searchBarQuery) ||
      status.toLowerCase().includes(searchBarQuery)
    );
  });

  const completedData = completedConsultations.filter((item) => {
    if (!searchBarQuery) return true;
    const patientName = item.user?.name || '';
    const title = item.title || '';
    const status = String(item.status || '');
    return (
      patientName.toLowerCase().includes(searchBarQuery) ||
      title.toLowerCase().includes(searchBarQuery) ||
      status.toLowerCase().includes(searchBarQuery)
    );
  });

  const formattedEarnings = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(monthlyEarnings);

  return (
    <div className="space-y-10 animate-fade-in">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-[36px] font-black text-[#193c1f] tracking-tight leading-tight">
            Welcome, {displayName}
          </h2>
          <p className="text-[#8ea087] text-[16px] font-medium mt-1">
            {searchBarQuery
              ? `Showing results for "${searchBarQuery}"`
              : `You have ${pendingConsultationsCount} upcoming consultations to handle.`}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          {
            label: 'Total Consultations',
            val: String(totalConsultationsCount),
            icon: <TotalIcon />,
          },
          {
            label: 'Pending / Scheduled',
            val: String(pendingConsultationsCount),
            icon: <PendingIcon />,
          },
          {
            label: 'Completed Sessions',
            val: String(completedConsultationsCount),
            icon: <CompletedIcon />,
          },
          {
            label: 'Monthly Earnings (Est.)',
            val: formattedEarnings,
            icon: <EarningsIcon />,
            highlight: true,
          },
        ].map((item, index) => (
          <div
            key={index}
            className={`p-8 rounded-[28px] border flex items-center gap-6 shadow-sm transition-all hover:shadow-md ${
              item.highlight
                ? 'bg-[#193c1f] border-[#193c1f] text-white'
                : 'bg-[#f7f3ed] border-[#d0d5cb] text-[#193c1f]'
            }`}
          >
            <div
              className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${
                item.highlight ? 'bg-white/10' : 'bg-[#EBE6DE]'
              }`}
            >
              {React.cloneElement(
                item.icon as React.ReactElement<{ stroke?: string }>,
                {
                  stroke: item.highlight ? '#FFFFFF' : '#193C1F',
                },
              )}
            </div>
            <div>
              <p
                className={`text-[10px] uppercase font-black tracking-widest mb-1 ${
                  item.highlight ? 'text-white/60' : 'text-[#8ea087]'
                }`}
              >
                {item.label}
              </p>
              <p
                className={`text-[24px] font-bold leading-none ${
                  item.highlight ? 'text-white' : 'text-[#193c1f]'
                }`}
              >
                {item.val}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
        <div className="bg-white border border-[#d0d5cb] rounded-[32px] overflow-hidden shadow-sm">
          <div className="p-8 border-b border-[#f7f3ed] flex justify-between items-center bg-[#FDFCFB]">
            <h3 className="font-bold text-[18px] text-[#193c1f]">
              Upcoming Consultations
            </h3>
            <Link
              href="/dashboard/psikolog/consultations"
              className="text-[11px] font-black text-[#8ea087] tracking-[0.2em] uppercase hover:text-[#193c1f] transition-colors"
            >
              View All
            </Link>
          </div>
          <table className="w-full text-left">
            <thead className="bg-[#f7f3ed] text-[11px] text-[#8ea087] font-black uppercase tracking-widest">
              <tr>
                <th className="px-8 py-4">Patient</th>
                <th className="px-8 py-4">Date</th>
                <th className="px-8 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="text-[14px] text-[#193c1f]">
              {pendingData.slice(0, 3).map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-[#f7f3ed] hover:bg-[#FDFCFB]"
                >
                  <td className="px-8 py-5 font-bold">
                    {row.isAnonymous
                      ? 'Anonymous Patient'
                      : row.user?.name || 'Anonymous'}
                  </td>
                  <td className="px-8 py-5 opacity-70">
                    {formatDateLabel(row.date)}
                  </td>
                  <td className="px-8 py-5">
                    <span className="px-4 py-1.5 rounded-full text-[10px] font-black bg-[#d1b698]/20 text-[#d1b698]">
                      {String(row.status)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {pendingData.length === 0 && (
            <p className="p-10 text-center text-[#8ea087]">
              No upcoming consultations found.
            </p>
          )}
        </div>

        <div className="bg-white border border-[#d0d5cb] rounded-[32px] overflow-hidden shadow-sm">
          <div className="p-8 border-b border-[#f7f3ed] flex justify-between items-center bg-[#FDFCFB]">
            <h3 className="font-bold text-[18px] text-[#193c1f]">
              Completed Sessions
            </h3>
            <Link
              href="/dashboard/psikolog/consultations?filter=completed"
              className="text-[11px] font-black text-[#8ea087] tracking-[0.2em] uppercase hover:text-[#193c1f] transition-colors"
            >
              View All
            </Link>
          </div>
          <table className="w-full text-left">
            <thead className="bg-[#f7f3ed] text-[11px] text-[#8ea087] font-black uppercase tracking-widest">
              <tr>
                <th className="px-8 py-4">Patient</th>
                <th className="px-8 py-4">Date</th>
                <th className="px-8 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="text-[14px] text-[#193c1f]">
              {completedData.slice(0, 3).map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-[#f7f3ed] hover:bg-[#FDFCFB]"
                >
                  <td className="px-8 py-5 font-bold">
                    {row.isAnonymous
                      ? 'Anonymous Patient'
                      : row.user?.name || 'Anonymous'}
                  </td>
                  <td className="px-8 py-5 opacity-70">
                    {formatDateLabel(row.date)}
                  </td>
                  <td className="px-8 py-5">
                    <span className="px-4 py-1.5 rounded-full text-[10px] font-black bg-[#EBE6DE] text-[#193c1f]">
                      {String(row.status)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {completedData.length === 0 && (
            <p className="p-10 text-center text-[#8ea087]">
              No completed sessions yet.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
