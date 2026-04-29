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
  consultations: DashboardConsultation[];
  displayName: string;
  totalConsultationsCount: number;
  pendingConsultationsCount: number;
  completedConsultationsCount: number;
};

export default function PsychologistDashboardContent({
  consultations = [],
  displayName = 'Psychologist',
  totalConsultationsCount,
  pendingConsultationsCount,
  completedConsultationsCount,
}: PsychologistDashboardProps) {
  const searchParams = useSearchParams();
  const searchBarQuery = searchParams.get('search')?.toLowerCase() || '';

  const filteredData = consultations.filter((item) => {
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

  const pendingConsultations = filteredData.filter(
    (c) => String(c.status) === 'SCHEDULED' || String(c.status) === 'PENDING',
  );
  const completedConsultations = filteredData.filter(
    (c) => String(c.status) === 'COMPLETED',
  );

  return (
    <div className="space-y-10 animate-fade-in">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-[36px] font-black text-[#193C1F] tracking-tight leading-tight">
            Welcome, {displayName}
          </h2>
          <p className="text-[#8EA087] text-[16px] font-medium mt-1">
            {searchBarQuery
              ? `Showing results for "${searchBarQuery}"`
              : `You have ${pendingConsultationsCount} upcoming consultations to handle.`}
          </p>
        </div>
      </div>

      <div className="flex gap-8">
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
              <p className="text-[32px] font-bold text-[#193C1F] leading-none">
                {item.val}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
        <div className="bg-white border border-[#D0D5CB] rounded-[32px] overflow-hidden shadow-sm">
          <div className="p-8 border-b border-[#F7F3ED] flex justify-between items-center bg-[#FDFCFB]">
            <h3 className="font-bold text-[18px] text-[#193C1F]">
              Upcoming Consultations
            </h3>
            <Link
              href="/dashboard/psikolog/consultations"
              className="text-[11px] font-black text-[#8EA087] tracking-[0.2em] uppercase hover:text-[#193C1F] transition-colors"
            >
              View All
            </Link>
          </div>
          <table className="w-full text-left">
            <thead className="bg-[#F7F3ED] text-[11px] text-[#8EA087] font-black uppercase tracking-widest">
              <tr>
                <th className="px-8 py-4">Patient</th>
                <th className="px-8 py-4">Date</th>
                <th className="px-8 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="text-[14px] text-[#193C1F]">
              {pendingConsultations.slice(0, 3).map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-[#F7F3ED] hover:bg-[#FDFCFB]"
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
                    <span className="px-4 py-1.5 rounded-full text-[10px] font-black bg-[#D1B698]/20 text-[#D1B698]">
                      {String(row.status)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {pendingConsultations.length === 0 && (
            <p className="p-10 text-center text-[#8EA087]">
              No upcoming consultations found.
            </p>
          )}
        </div>

        <div className="bg-white border border-[#D0D5CB] rounded-[32px] overflow-hidden shadow-sm">
          <div className="p-8 border-b border-[#F7F3ED] flex justify-between items-center bg-[#FDFCFB]">
            <h3 className="font-bold text-[18px] text-[#193C1F]">
              Completed Sessions
            </h3>
            <Link
              href="/dashboard/psikolog/consultations?filter=completed"
              className="text-[11px] font-black text-[#8EA087] tracking-[0.2em] uppercase hover:text-[#193C1F] transition-colors"
            >
              View All
            </Link>
          </div>
          <table className="w-full text-left">
            <thead className="bg-[#F7F3ED] text-[11px] text-[#8EA087] font-black uppercase tracking-widest">
              <tr>
                <th className="px-8 py-4">Patient</th>
                <th className="px-8 py-4">Date</th>
                <th className="px-8 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="text-[14px] text-[#193C1F]">
              {completedConsultations.slice(0, 3).map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-[#F7F3ED] hover:bg-[#FDFCFB]"
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
                    <span className="px-4 py-1.5 rounded-full text-[10px] font-black bg-[#EBE6DE] text-[#193C1F]">
                      {String(row.status)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {completedConsultations.length === 0 && (
            <p className="p-10 text-center text-[#8EA087]">
              No completed sessions yet.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
