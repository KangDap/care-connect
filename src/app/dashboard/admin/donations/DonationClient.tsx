'use client';

import { Badge } from '@/components/badge';
import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { Input } from '@/components/input';
import { Table } from '@/components/table';
import { Toast } from '@/components/toast';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { DonationActions } from './DonationActions';

const STATUS_BADGE: Record<string, 'PENDING' | 'SUCCESS' | 'DEFAULT'> = {
  PAID: 'SUCCESS',
  PENDING: 'PENDING',
  FAILED: 'DEFAULT',
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
  page: number;
  totalPages: number;
  perPage: number;
  totalCount: number;
  counts: {
    all: number;
    paid: number;
    pending: number;
    failed: number;
  };
};

export function DonationClient({
  donations,
  summary,
  psychologistBreakdown,
  currentMonth,
  currentYear,
  currentStatus,
  page,
  totalPages,
  perPage,
  totalCount,
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
    <div className="space-y-6 md:space-y-10">
      <Toast
        show={toast.show}
        msg={toast.msg}
        type={toast.type}
        onClose={() => setToast((prev) => ({ ...prev, show: false }))}
      />

      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl md:text-[40px] font-black text-[#193c1f] tracking-tight leading-tight">
          Donation &amp; Payouts
        </h1>
        <p className="text-[#8ea087] font-medium mt-2">
          Monitor platform revenue and calculate psychologist shares.
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 lg:gap-8 items-stretch">
        {/* Card 1: Revenue */}
        <Card className="p-3 sm:p-4 md:p-6 shadow-md relative group flex flex-col h-full rounded-2xl md:rounded-3xl border border-[#D0D5CB]/50">
          <div className="relative z-10 flex flex-col h-full">
            <div className="flex items-center gap-2 mb-3 md:mb-6">
              <div className="p-1.5 md:p-2 bg-[#193c1f] rounded-lg text-white shrink-0">
                <svg
                  className="w-4 h-4 md:w-5 md:h-5"
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
              <p className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.2em] text-[#8ea087]">
                Revenue {months[currentMonth - 1]}
              </p>
            </div>

            <div className="flex items-baseline gap-1.5 mb-4 md:mb-6">
              <h3 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tighter text-[#193c1f]">
                {fmt(summary.platformTotal)}
              </h3>
              <span className="text-[10px] md:text-xs font-bold text-[#8ea087] uppercase">
                IDR
              </span>
            </div>

            {/* Monthly Breakdown */}
            <div className="grid grid-cols-2 gap-3 mb-4 md:mb-8 py-3 md:py-5 border-y border-[#D0D5CB]/50">
              <div>
                <p className="text-[7px] md:text-[8px] font-black uppercase tracking-widest text-[#8ea087] mb-0.5 md:mb-1">
                  Monthly Platform (10%)
                </p>
                <p className="font-bold text-xs md:text-sm text-[#193c1f]">
                  {fmt(summary.platformTotal * 0.1)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[7px] md:text-[8px] font-black uppercase tracking-widest text-[#d6a36c] mb-0.5 md:mb-1">
                  Monthly Psych (90%)
                </p>
                <p className="font-black text-xs md:text-sm text-[#d6a36c]">
                  {fmt(summary.psychologistPool)}
                </p>
              </div>
            </div>

            <div className="mt-auto flex justify-between items-end pt-2">
              <div className="flex flex-col">
                <span className="text-[8px] font-bold uppercase tracking-widest text-[#8ea087] mb-1">
                  All Time Platform
                </span>
                <span className="font-bold text-xs text-[#193c1f]">
                  {fmt(summary.allTimeTotal * 0.1)}
                </span>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-[8px] font-bold uppercase tracking-widest text-[#d6a36c] mb-1">
                  All Time Psych
                </span>
                <span className="font-black text-sm text-[#d6a36c] leading-none">
                  {fmt(summary.allTimeTotal * 0.9)}
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* Card 2: Sessions */}
        <Card className="p-3 sm:p-4 md:p-6 border border-[#f7f3ed] shadow-md relative group flex flex-col h-full rounded-2xl md:rounded-3xl">
          <div className="relative z-10 flex flex-col h-full">
            <div className="flex items-center gap-2 mb-3 md:mb-6">
              <div className="p-1.5 md:p-2 bg-[#f7f3ed] rounded-lg text-[#193c1f]">
                <svg
                  className="w-4 h-4 md:w-5 md:h-5"
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
              <p className="text-[8px] md:text-[10px] font-black text-[#8ea087] uppercase tracking-[0.2em]">
                Monthly Sessions
              </p>
            </div>

            <div className="flex items-baseline gap-1.5 mb-4 md:mb-6">
              <h3 className="text-2xl sm:text-3xl md:text-4xl font-black text-[#193c1f] tracking-tighter">
                {summary.totalSessions}
              </h3>
              <span className="text-[10px] md:text-xs font-bold text-[#8ea087] uppercase">
                Completed
              </span>
            </div>

            {/* Session Stats */}
            <div className="grid grid-cols-2 gap-3 mb-4 md:mb-8 py-3 md:py-5 border-y border-[#f7f3ed]">
              <div>
                <p className="text-[7px] md:text-[8px] font-black text-[#8ea087] uppercase tracking-widest mb-0.5 md:mb-1">
                  Avg. Sessions
                </p>
                <p className="font-bold text-xs md:text-sm text-[#193c1f]">
                  {psychologistBreakdown.length > 0
                    ? (
                        summary.totalSessions / psychologistBreakdown.length
                      ).toFixed(1)
                    : 0}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[7px] md:text-[8px] font-black text-[#8ea087] uppercase tracking-widest mb-0.5 md:mb-1">
                  Active Psych
                </p>
                <p className="font-black text-xs md:text-sm text-[#193c1f]">
                  {psychologistBreakdown.length}
                </p>
              </div>
            </div>

            <div className="mt-auto flex justify-between items-end pt-2">
              <div className="flex flex-col">
                <span className="text-[8px] font-bold text-[#8ea087] uppercase tracking-widest mb-1">
                  Total (All Time)
                </span>
                <span className="font-bold text-xs text-[#193c1f]">
                  {summary.allTimeSessions} sesi
                </span>
              </div>
              <div className="text-[10px] font-black text-[#193c1f] bg-[#f7f3ed] px-3 py-2 rounded-xl">
                {months[currentMonth - 1].slice(0, 3)}
              </div>
            </div>
          </div>
        </Card>

        {/* Card 3: Top Payout */}
        <Card className="p-3 sm:p-4 md:p-6 shadow-md relative group flex flex-col h-full rounded-2xl md:rounded-3xl border border-[#D0D5CB]/50">
          <div className="relative z-10 flex flex-col h-full">
            <div className="flex items-center gap-2 mb-3 md:mb-6">
              <div className="p-1.5 md:p-2 bg-[#193c1f] rounded-lg text-[#d6a36c] shrink-0">
                <svg
                  className="w-4 h-4 md:w-5 md:h-5"
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
              <p className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.2em] text-[#8ea087]">
                Top Share Est.
              </p>
            </div>

            <div className="flex items-baseline gap-1.5 mb-4 md:mb-6">
              <h3 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tighter text-[#193c1f]">
                {fmt(
                  Math.max(...psychologistBreakdown.map((p) => p.earnings), 0),
                )}
              </h3>
            </div>

            {/* Payout Stats */}
            <div className="grid grid-cols-2 gap-3 mb-4 md:mb-8 py-3 md:py-5 border-y border-[#D0D5CB]/50">
              <div>
                <p className="text-[7px] md:text-[8px] font-black uppercase tracking-widest text-[#8ea087] mb-0.5 md:mb-1">
                  Average Share
                </p>
                <p className="font-bold text-xs md:text-sm text-[#193c1f]">
                  {fmt(
                    psychologistBreakdown.length > 0
                      ? summary.psychologistPool / psychologistBreakdown.length
                      : 0,
                  )}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[7px] md:text-[8px] font-black uppercase tracking-widest text-[#8ea087] mb-0.5 md:mb-1">
                  Total Pool
                </p>
                <p className="font-black text-xs md:text-sm text-[#193c1f]">
                  {fmt(summary.psychologistPool)}
                </p>
              </div>
            </div>

            <div className="mt-auto pt-2">
              <p className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-[#8ea087] leading-relaxed">
                Estimasi tertinggi berdasarkan <br /> proporsi sesi bulan ini.
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Psychologist Breakdown Section */}
      <Card className="rounded-[24px] md:rounded-[40px] p-0 md:p-0">
        <div className="p-5 sm:p-6 md:p-8 flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-[#D0D5CB]/50 bg-[#FDFCFB]">
          <div>
            <h2 className="text-xl md:text-2xl font-black text-[#193c1f] tracking-tight">
              Psychologist Payout Breakdown
            </h2>
            <p className="text-xs md:text-sm text-[#8ea087] font-medium mt-1">
              Data sesi dan bagi hasil untuk periode{' '}
              <strong>
                {months[currentMonth - 1]} {currentYear}
              </strong>
            </p>
          </div>

          <div className="flex gap-2 bg-[#f7f3ed] p-2 rounded-[24px]">
            <Input
              type="select"
              value={currentMonth}
              onChange={(e) =>
                handleTimeChange(Number(e.target.value), currentYear)
              }
              className="rounded-2xl bg-white px-3 py-2 text-xs font-black text-[#193c1f] hover:bg-[#F1B166]"
            >
              {months.map((m, i) => (
                <option key={m} value={i + 1}>
                  {m}
                </option>
              ))}
            </Input>
            <Input
              type="select"
              value={currentYear}
              onChange={(e) =>
                handleTimeChange(currentMonth, Number(e.target.value))
              }
              className="rounded-2xl bg-white px-3 py-2 text-xs font-black text-[#193c1f] hover:bg-[#F1B166]"
            >
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </Input>
          </div>
        </div>

        <Table
          className="rounded-t-none border-t-0 shadow-none"
          data={psychologistBreakdown}
          keyExtractor={(p) => p.id}
          emptyMessage="No payout data for this period."
          columns={[
            {
              header: 'Psychologist Name',
              cell: (p) => (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-[#f7f3ed] border border-[#D0D5CB] flex items-center justify-center text-[#193c1f] font-black text-xs shrink-0">
                    {p.name.charAt(0)}
                  </div>
                  <span className="font-bold text-[#193c1f] text-sm md:text-base">
                    {p.name}
                  </span>
                </div>
              ),
            },
            {
              header: 'Consultation Sessions',
              cell: (p) => (
                <div className="text-[#193c1f]">
                  <span className="font-black text-lg md:text-xl">
                    {p.sessions}
                  </span>
                  <span className="text-[10px] md:text-xs font-bold text-[#8ea087] ml-2 uppercase tracking-widest">
                    Sesi
                  </span>
                </div>
              ),
            },
            {
              header: 'Estimated Share',
              headerClassName: 'text-right',
              className: 'text-right',
              cell: (p) => (
                <span className="font-black text-lg md:text-xl text-[#193c1f]">
                  {fmt(p.earnings)}
                </span>
              ),
            },
          ]}
        />
      </Card>

      {/* Donation History Section */}
      <div className="space-y-5">
        {/* Section Header*/}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-[#193c1f] tracking-tight">
              Donation History
            </h2>
            <p className="text-xs sm:text-sm text-[#8ea087] font-medium mt-1">
              Manage and track all incoming donations.
            </p>
          </div>
        </div>

        {/* Status Filter Buttons */}
        <div className="flex flex-wrap gap-2">
          {[
            { label: 'ALL', count: counts.all },
            { label: 'PAID', count: counts.paid },
            { label: 'PENDING', count: counts.pending },
            { label: 'FAILED', count: counts.failed },
          ].map((s) => (
            <Button
              key={s.label}
              onClick={() => handleStatusChange(s.label)}
              variant={currentStatus === s.label ? 'primary' : 'outline'}
              className={`rounded-[14px] px-3 md:px-4 py-1.5 md:py-2 text-[10px] md:text-xs ${
                currentStatus === s.label
                  ? 'border-[#193c1f] shadow-md'
                  : 'border-[#f7f3ed] hover:border-[#193c1f]'
              }`}
            >
              <span>{s.label}</span>
              <span
                className={`text-[9px] md:text-[10px] font-black px-1.5 py-0.5 rounded-md ml-1.5 ${
                  currentStatus === s.label
                    ? 'bg-white/20 text-white'
                    : 'bg-[#f7f3ed] text-[#8ea087]'
                }`}
              >
                {s.count}
              </span>
            </Button>
          ))}
        </div>

        {/* Donations Table */}
        <Table
          data={donations}
          keyExtractor={(d) => d.id}
          emptyMessage="No donations found."
          currentPage={page}
          totalPages={totalPages}
          onPageChange={(p) => {
            router.push(
              `/dashboard/admin/donations?month=${currentMonth}&year=${currentYear}&status=${currentStatus}&page=${p}`,
              { scroll: false },
            );
          }}
          paginationInfo={`Showing ${(page - 1) * perPage + 1}–${Math.min(page * perPage, totalCount)} of ${totalCount}`}
          renderExpandedRow={(d) => (
            <div className="p-4 sm:p-5 bg-white border border-[#d0d5cb]/40 rounded-[18px] shadow-sm cursor-default">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-6">
                  <div>
                    <h4 className="text-[11px] font-black uppercase tracking-wider text-[#8ea087] mb-4">
                      Transaction Details
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="space-y-1">
                        <p className="text-[10px] text-[#8ea087] font-bold uppercase tracking-tight">
                          Donor Name
                        </p>
                        <p className="text-[14px] font-bold text-[#193c1f]">
                          {d.userName}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] text-[#8ea087] font-bold uppercase tracking-tight">
                          Transaction Date
                        </p>
                        <p className="text-[14px] font-bold text-[#193c1f]">
                          {fmtDate(d.createdAt)}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] text-[#8ea087] font-bold uppercase tracking-tight">
                          Destination
                        </p>
                        <p className="text-[14px] font-bold text-[#193c1f]">
                          {d.report.title === 'Platform Donation'
                            ? 'Platform Operations'
                            : 'Report Funds'}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] text-[#8ea087] font-bold uppercase tracking-tight">
                          Status
                        </p>
                        <p className="text-[14px] font-bold text-[#193c1f]">
                          {d.paymentStatus}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col md:border-l border-[#f7f3ed] md:pl-10">
                  <div className="space-y-1">
                    <p className="text-[10px] text-[#8ea087] font-bold uppercase tracking-tight">
                      Target Summary
                    </p>
                    <p className="text-[13px] text-[#193c1f] line-clamp-2">
                      {d.report.description || 'General platform support.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
          columns={[
            {
              header: 'Donor & Amount',
              cell: (d) => (
                <>
                  <p className="font-black text-[#193c1f] text-base md:text-lg leading-tight">
                    {fmt(d.amount)}
                  </p>
                  <p className="text-[10px] md:text-xs font-bold text-[#8ea087] mt-1 uppercase tracking-wider">
                    {d.userName}
                  </p>
                </>
              ),
            },
            {
              header: 'For Report / Platform',
              cell: (d) => (
                <>
                  <p className="font-bold text-[#193c1f] line-clamp-1 max-w-[150px] md:max-w-[250px] text-xs md:text-sm">
                    {d.report.title}
                  </p>
                  <p className="text-[9px] md:text-[10px] font-black text-[#8ea087] uppercase tracking-widest mt-1">
                    {d.report.title === 'Platform Donation'
                      ? 'PLATFORM'
                      : 'REPORT'}
                  </p>
                </>
              ),
            },
            {
              header: 'Status',
              cell: (d) => (
                <Badge status={STATUS_BADGE[d.paymentStatus] || 'DEFAULT'}>
                  {d.paymentStatus}
                </Badge>
              ),
            },
            {
              header: 'Date',
              className: 'text-[#8ea087] text-[10px] md:text-xs font-bold',
              cell: (d) => fmtDate(d.createdAt),
            },
            {
              header: 'Actions',
              headerClassName: 'text-right',
              className: 'text-right',
              cell: (d) => (
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
              ),
            },
          ]}
        />
      </div>
    </div>
  );
}
