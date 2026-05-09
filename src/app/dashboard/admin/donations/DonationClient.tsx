'use client';

import { Badge } from '@/components/badge';
import { Toast } from '@/components/toast';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { DonationActions } from './DonationActions';

const STATUS_BADGE: Record<string, 'PENDING' | 'SUCCESS' | 'DEFAULT'> = {
  PAID: 'SUCCESS',
  PENDING: 'PENDING',
  FAILED: 'DEFAULT',
  EXPIRED: 'DEFAULT',
  REFUNDED: 'PENDING',
  CANCELLED: 'DEFAULT',
};

type DonationType = {
  id: number;
  reportId: number;
  userName: string;
  amount: number;
  message: string;
  paymentStatus: string;
  createdAt: string;
  report: {
    title: string;
    description: string;
  };
};

type PsychologistBreakdown = {
  id: string;
  name: string;
  sessions: number;
  earnings: number;
};

type DonationClientProps = {
  donations: DonationType[];
  summary: {
    platformTotal: number;
    psychologistPool: number;
    totalSessions: number;
    allTimeTotal: number;
    allTimeSessions: number;
  };
  psychologistBreakdown: PsychologistBreakdown[];
  currentMonth: number;
  currentYear: number;
  currentStatus: string;
  counts: {
    all: number;
    paid: number;
    pending: number;
    failed: number;
    expired: number;
    refunded: number;
    cancelled: number;
  };
};

export function DonationClient({
  donations,
  summary,
  psychologistBreakdown,
  currentMonth,
  currentYear,
  currentStatus,
  counts,
}: DonationClientProps) {
  const router = useRouter();
  const [toast, setToast] = useState<{
    show: boolean;
    msg: string;
    type: 'success' | 'error';
  }>({ show: false, msg: '', type: 'success' });

  const handleTimeChange = (month: number, year: number) => {
    router.push(
      `/dashboard/admin/donations?month=${month}&year=${year}&status=${currentStatus}`,
      { scroll: false },
    );
  };

  const handleStatusChange = (status: string) => {
    router.push(
      `/dashboard/admin/donations?month=${currentMonth}&year=${currentYear}&status=${status}`,
      { scroll: false },
    );
  };

  const months = [
    'Januari',
    'Februari',
    'Maret',
    'April',
    'Mei',
    'Juni',
    'Juli',
    'Agustus',
    'September',
    'Oktober',
    'November',
    'Desember',
  ];

  const years = [2024, 2025, 2026];

  const fmt = (v: number) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(v);

  const fmtDate = (d: string) =>
    new Intl.DateTimeFormat('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(new Date(d));

  return (
    <div className="space-y-10">
      <Toast
        show={toast.show}
        msg={toast.msg}
        type={toast.type}
        onClose={() => setToast((prev) => ({ ...prev, show: false }))}
      />

      {/* Header */}
      <div>
        <h1 className="text-[40px] font-black text-[#193C1F] tracking-tight leading-none">
          Donation & Payouts
        </h1>
        <p className="text-[#8EA087] font-medium mt-2">
          Monitor platform revenue and calculate psychologist shares.
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
        {/* Card 1: Revenue */}
        <div className="bg-[#193C1F] p-8 rounded-[40px] text-white shadow-2xl relative overflow-hidden group border-4 border-[#193C1F] flex flex-col h-full">
          <div className="relative z-10 flex flex-col h-full">
            <div className="flex items-center gap-2 mb-6">
              <div className="p-2 bg-white/10 rounded-lg">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">
                Revenue {months[currentMonth - 1]}
              </p>
            </div>

            <div className="flex items-baseline gap-2 mb-6">
              <h3 className="text-4xl font-black tracking-tighter">
                {fmt(summary.platformTotal)}
              </h3>
              <span className="text-xs font-bold opacity-40 uppercase">
                IDR
              </span>
            </div>

            {/* Monthly Breakdown */}
            <div className="grid grid-cols-2 gap-4 mb-8 py-5 border-y border-white/10">
              <div>
                <p className="text-[8px] font-black uppercase tracking-widest opacity-40 mb-1">
                  Monthly Platform (10%)
                </p>
                <p className="font-bold text-sm">
                  {fmt(summary.platformTotal * 0.1)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[8px] font-black uppercase tracking-widest text-[#F1B166] mb-1">
                  Monthly Psych (90%)
                </p>
                <p className="font-black text-sm text-[#F1B166]">
                  {fmt(summary.psychologistPool)}
                </p>
              </div>
            </div>

            <div className="mt-auto flex justify-between items-end">
              <div className="flex flex-col">
                <span className="text-[8px] font-bold uppercase tracking-widest opacity-40 mb-1">
                  All Time Platform
                </span>
                <span className="font-bold text-xs opacity-80">
                  {fmt(summary.allTimeTotal * 0.1)}
                </span>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-[8px] font-bold uppercase tracking-widest text-[#F1B166] mb-1">
                  All Time Psych
                </span>
                <span className="font-black text-sm text-[#F1B166] leading-none">
                  {fmt(summary.allTimeTotal * 0.9)}
                </span>
              </div>
            </div>
          </div>
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -mr-20 -mt-20 group-hover:scale-110 transition-transform duration-700" />
        </div>

        {/* Card 2: Sessions */}
        <div className="bg-white p-8 rounded-[40px] border-4 border-[#F7F3ED] shadow-xl relative overflow-hidden group flex flex-col h-full">
          <div className="relative z-10 flex flex-col h-full">
            <div className="flex items-center gap-2 mb-6">
              <div className="p-2 bg-[#F7F3ED] rounded-lg text-[#193C1F]">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              <p className="text-[10px] font-black text-[#8EA087] uppercase tracking-[0.2em]">
                Monthly Sessions
              </p>
            </div>

            <div className="flex items-baseline gap-2 mb-6">
              <h3 className="text-4xl font-black text-[#193C1F] tracking-tighter">
                {summary.totalSessions}
              </h3>
              <span className="text-xs font-bold text-[#8EA087] uppercase">
                Completed
              </span>
            </div>

            {/* Session Stats */}
            <div className="grid grid-cols-2 gap-4 mb-8 py-5 border-y border-[#F7F3ED]">
              <div>
                <p className="text-[8px] font-black text-[#8EA087] uppercase tracking-widest mb-1">
                  Avg. Sessions
                </p>
                <p className="font-bold text-sm text-[#193C1F]">
                  {psychologistBreakdown.length > 0
                    ? (
                        summary.totalSessions / psychologistBreakdown.length
                      ).toFixed(1)
                    : 0}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[8px] font-black text-[#8EA087] uppercase tracking-widest mb-1">
                  Active Psych
                </p>
                <p className="font-black text-sm text-[#193C1F]">
                  {psychologistBreakdown.length}
                </p>
              </div>
            </div>

            <div className="mt-auto flex justify-between items-end">
              <div className="flex flex-col">
                <span className="text-[8px] font-bold text-[#8EA087] uppercase tracking-widest mb-1">
                  Total (All Time)
                </span>
                <span className="font-bold text-xs text-[#193C1F]">
                  {summary.allTimeSessions} sesi
                </span>
              </div>
              <div className="text-[10px] font-black text-[#193C1F] bg-[#F7F3ED] px-3 py-2 rounded-xl">
                {months[currentMonth - 1].slice(0, 3)}
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: Top Payout */}
        <div className="bg-[#F1B166] p-8 rounded-[40px] text-[#193C1F] shadow-2xl relative overflow-hidden group border-4 border-[#F1B166] flex flex-col h-full">
          <div className="relative z-10 flex flex-col h-full">
            <div className="flex items-center gap-2 mb-6">
              <div className="p-2 bg-[#193C1F] rounded-lg text-[#F1B166]">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m12 15 2 2 4-4" />
                  <rect width="18" height="18" x="3" y="3" rx="2" />
                  <path d="M3 9h18" />
                </svg>
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">
                Top Share Est.
              </p>
            </div>

            <div className="flex items-baseline gap-2 mb-6">
              <h3 className="text-4xl font-black tracking-tighter">
                {fmt(
                  Math.max(...psychologistBreakdown.map((p) => p.earnings), 0),
                )}
              </h3>
            </div>

            {/* Payout Stats */}
            <div className="grid grid-cols-2 gap-4 mb-8 py-5 border-y border-black/10">
              <div>
                <p className="text-[8px] font-black uppercase tracking-widest opacity-60 mb-1">
                  Average Share
                </p>
                <p className="font-bold text-sm">
                  {fmt(
                    psychologistBreakdown.length > 0
                      ? summary.psychologistPool / psychologistBreakdown.length
                      : 0,
                  )}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[8px] font-black uppercase tracking-widest opacity-60 mb-1">
                  Total Pool
                </p>
                <p className="font-black text-sm">
                  {fmt(summary.psychologistPool)}
                </p>
              </div>
            </div>

            <div className="mt-auto">
              <p className="text-[10px] font-black uppercase tracking-widest opacity-60 leading-relaxed">
                Estimasi tertinggi berdasarkan <br /> proporsi sesi bulan ini.
              </p>
            </div>
          </div>
          <div className="absolute bottom-0 right-0 w-48 h-48 bg-black/5 rounded-full -mr-16 -mb-16 group-hover:scale-110 transition-transform duration-700" />
        </div>
      </div>

      {/* Psychologist Breakdown Section */}
      <div className="bg-white border-4 border-[#F7F3ED] rounded-[48px] p-10 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 pb-8 border-b-2 border-[#F7F3ED]">
          <div>
            <h2 className="text-2xl font-black text-[#193C1F] tracking-tight">
              Psychologist Payout Breakdown
            </h2>
            <p className="text-sm text-[#8EA087] font-medium mt-1">
              Data sesi dan bagi hasil untuk periode{' '}
              <strong>
                {months[currentMonth - 1]} {currentYear}
              </strong>
            </p>
          </div>

          <div className="flex gap-2 bg-[#F7F3ED] p-2 rounded-[24px]">
            <select
              value={currentMonth}
              onChange={(e) =>
                handleTimeChange(Number(e.target.value), currentYear)
              }
              className="bg-white text-[#193C1F] font-black text-xs px-5 py-3 rounded-2xl focus:outline-none cursor-pointer hover:bg-[#F1B166] transition-colors appearance-none"
            >
              {months.map((m, i) => (
                <option key={m} value={i + 1}>
                  {m}
                </option>
              ))}
            </select>
            <select
              value={currentYear}
              onChange={(e) =>
                handleTimeChange(currentMonth, Number(e.target.value))
              }
              className="bg-white text-[#193C1F] font-black text-xs px-5 py-3 rounded-2xl focus:outline-none cursor-pointer hover:bg-[#F1B166] transition-colors appearance-none"
            >
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[600px]">
            <thead className="text-[11px] font-black text-[#8EA087] uppercase tracking-widest">
              <tr>
                <th className="pb-6 px-4">Psychologist Name</th>
                <th className="pb-6 px-4">Consultation Sessions</th>
                <th className="pb-6 px-4 text-right">Estimated Share</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F7F3ED]">
              {psychologistBreakdown.map((p) => (
                <tr
                  key={p.id}
                  className="group hover:bg-[#F7F3ED]/30 transition-all duration-300"
                >
                  <td className="py-6 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#F7F3ED] flex items-center justify-center text-[#193C1F] font-black text-xs">
                        {p.name.charAt(0)}
                      </div>
                      <span className="font-bold text-[#193C1F] text-lg">
                        {p.name}
                      </span>
                    </div>
                  </td>
                  <td className="py-6 px-4 text-[#193C1F]">
                    <span className="font-black text-xl">{p.sessions}</span>
                    <span className="text-xs font-bold text-[#8EA087] ml-2 uppercase tracking-widest">
                      Sesi
                    </span>
                  </td>
                  <td className="py-6 px-4 text-right">
                    <span className="font-black text-xl text-[#193C1F]">
                      {fmt(p.earnings)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Donation History Section */}
      <div className="space-y-8">
        <div className="flex flex-col gap-6">
          <div>
            <h2 className="text-3xl font-black text-[#193C1F] tracking-tight">
              Donation History
            </h2>
            <p className="text-sm text-[#8EA087] font-medium mt-1">
              Manage and track all incoming donations.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            {[
              { label: 'ALL', count: counts.all },
              { label: 'PAID', count: counts.paid },
              { label: 'PENDING', count: counts.pending },
              { label: 'FAILED', count: counts.failed },
              { label: 'EXPIRED', count: counts.expired },
              { label: 'REFUNDED', count: counts.refunded },
              { label: 'CANCELLED', count: counts.cancelled },
            ].map((s) => (
              <button
                key={s.label}
                onClick={() => handleStatusChange(s.label)}
                className={`px-6 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 border-2 ${
                  currentStatus === s.label
                    ? 'bg-[#193C1F] text-white border-[#193C1F] shadow-lg'
                    : 'bg-white text-[#193C1F] border-[#F7F3ED] hover:border-[#193C1F]'
                }`}
              >
                <span>{s.label}</span>
                <span
                  className={`text-[10px] font-black px-2 py-0.5 rounded-lg ${
                    currentStatus === s.label
                      ? 'bg-white/20 text-white'
                      : 'bg-[#F7F3ED] text-[#8EA087]'
                  }`}
                >
                  {s.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white border-4 border-[#F7F3ED] rounded-[48px] overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[800px]">
              <thead className="bg-[#F7F3ED]/30 text-[11px] font-black text-[#8EA087] uppercase tracking-widest">
                <tr>
                  <th className="px-8 py-5">Donor & Amount</th>
                  <th className="px-8 py-5">For Report / Platform</th>
                  <th className="px-8 py-5">Status</th>
                  <th className="px-8 py-5">Date</th>
                  <th className="px-8 py-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F7F3ED] text-sm">
                {donations.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-8 py-12 text-center text-[#8EA087] font-medium italic"
                    >
                      No donations found.
                    </td>
                  </tr>
                ) : (
                  donations.map((d) => (
                    <tr
                      key={d.id}
                      className="hover:bg-[#F7F3ED]/20 transition-colors"
                    >
                      <td className="px-8 py-6">
                        <p className="font-black text-[#193C1F] text-lg leading-tight">
                          {fmt(d.amount)}
                        </p>
                        <p className="text-xs font-bold text-[#8EA087] mt-1 uppercase tracking-wider">
                          {d.userName}
                        </p>
                      </td>
                      <td className="px-8 py-6">
                        <p className="font-bold text-[#193C1F] line-clamp-1 max-w-[250px]">
                          {d.report.title}
                        </p>
                        <p className="text-[10px] font-black text-[#8EA087] uppercase tracking-widest mt-1">
                          {d.report.title === 'Platform Donation'
                            ? 'PLATFORM'
                            : 'REPORT'}
                        </p>
                      </td>
                      <td className="px-8 py-6">
                        <Badge
                          status={STATUS_BADGE[d.paymentStatus] || 'DEFAULT'}
                        >
                          {d.paymentStatus}
                        </Badge>
                      </td>
                      <td className="px-8 py-6 text-[#8EA087] text-xs font-bold">
                        {fmtDate(d.createdAt)}
                      </td>
                      <td className="px-8 py-6 text-right">
                        <DonationActions
                          id={d.id}
                          status={d.paymentStatus}
                          amount={d.amount}
                          donor={d.userName}
                          onSuccess={(msg) =>
                            setToast({ show: true, msg, type: 'success' })
                          }
                          onError={(msg) =>
                            setToast({ show: true, msg, type: 'error' })
                          }
                        />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
