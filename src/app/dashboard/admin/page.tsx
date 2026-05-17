import { Card } from '@/components/card';
import type { ApiFailure, ApiSuccess } from '@/lib/api-response';
import type { AdminDashboardData } from '@/modules/dashboard/dashboard.types';
import { User } from 'lucide-react';
import { headers } from 'next/headers';
import Link from 'next/link';

import {
  ConsultationLineChart,
  DonationLineChart,
  ReportsBarChart,
} from './AdminCharts';

const fmt = (v: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(v);

async function getAdminDashboardData(): Promise<AdminDashboardData> {
  const headerList = await headers();
  const host = headerList.get('host');

  if (!host) {
    throw new Error('Missing request host');
  }

  const protocol = headerList.get('x-forwarded-proto') ?? 'http';
  const cookie = headerList.get('cookie') ?? '';
  const res = await fetch(`${protocol}://${host}/api/dashboard/admin`, {
    cache: 'no-store',
    headers: {
      cookie,
    },
  });

  if (!res.ok) {
    throw new Error('Failed to load admin dashboard data');
  }

  const payload = (await res.json()) as
    | ApiSuccess<AdminDashboardData>
    | ApiFailure;

  if (!payload.success) {
    throw new Error(payload.error.message);
  }

  return payload.data;
}

export default async function AdminDashboardPage() {
  const data = await getAdminDashboardData();
  const {
    totalReports,
    pendingReports,
    reportsChartData,
    totalConsultations,
    activeConsultations,
    consultChartData,
    totalDonationsCount,
    recentDonations,
    totalChats,
    donationTotals,
    donationChartData,
  } = data;

  const fmtDate = (d: Date | string) => {
    const date = typeof d === 'string' ? new Date(d) : d;
    return new Intl.DateTimeFormat('id-ID', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const fmtMethod = (m: string) =>
    m
      .split('_')
      .map((w) => w[0] + w.slice(1).toLowerCase())
      .join(' ');

  return (
    <div className="space-y-6 md:space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-[32px] font-black text-[#193C1F] leading-tight">
          Admin Dashboard
        </h1>
        <p className="text-sm md:text-base text-[#8EA087] font-medium mt-1">
          Platform overview & moderation center.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {/* Reports */}
        <Card className="p-5 md:p-6 shadow-sm">
          <div className="flex items-center justify-between mb-3 md:mb-4">
            <div className="w-8 h-8 md:w-10 md:h-10 bg-[#F7F3ED] rounded-xl flex items-center justify-center">
              <svg
                className="w-4 h-4 md:w-5 md:h-5 text-[#193C1F]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
            </div>
            <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-amber-600 bg-amber-50 px-2 py-0.5 md:py-1 rounded-full border border-amber-200">
              {pendingReports} pending
            </span>
          </div>
          <p className="text-[#8EA087] text-xs md:text-sm font-medium">
            Total Reports
          </p>
          <h3 className="text-2xl md:text-4xl font-black text-[#193C1F] mt-1 truncate">
            {totalReports}
          </h3>
        </Card>

        {/* Consultations */}
        <Card className="p-5 md:p-6 shadow-sm">
          <div className="flex items-center justify-between mb-3 md:mb-4">
            <div className="w-8 h-8 md:w-10 md:h-10 bg-[#F7F3ED] rounded-xl flex items-center justify-center">
              <svg
                className="w-4 h-4 md:w-5 md:h-5 text-[#193C1F]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </div>
            <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-green-700 bg-green-50 px-2 py-0.5 md:py-1 rounded-full border border-green-200">
              {activeConsultations} active
            </span>
          </div>
          <p className="text-[#8EA087] text-xs md:text-sm font-medium">
            Total Consultations
          </p>
          <h3 className="text-2xl md:text-4xl font-black text-[#193C1F] mt-1 truncate">
            {totalConsultations}
          </h3>
        </Card>

        {/* Donations */}
        <Card className="p-5 md:p-6 shadow-sm">
          <div className="flex items-center justify-between mb-3 md:mb-4">
            <div className="w-8 h-8 md:w-10 md:h-10 bg-[#F7F3ED] rounded-xl flex items-center justify-center">
              <svg
                className="w-4 h-4 md:w-5 md:h-5 text-[#193C1F]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-[#8EA087] bg-[#F7F3ED] px-2 py-0.5 md:py-1 rounded-full border border-[#D0D5CB]">
              {totalDonationsCount} tx
            </span>
          </div>
          <p className="text-[#8EA087] text-xs md:text-sm font-medium">
            All-time Donations
          </p>
          <h3 className="text-xl md:text-2xl font-black text-[#193C1F] mt-1 truncate">
            {fmt(donationTotals.allTime)}
          </h3>
        </Card>

        {/* Forum */}
        <Card className="p-5 md:p-6 shadow-sm">
          <div className="flex items-center justify-between mb-3 md:mb-4">
            <div className="w-8 h-8 md:w-10 md:h-10 bg-[#F7F3ED] rounded-xl flex items-center justify-center">
              <svg
                className="w-4 h-4 md:w-5 md:h-5 text-[#193C1F]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z"
                />
              </svg>
            </div>
            <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-[#8EA087] bg-[#F7F3ED] px-2 py-0.5 md:py-1 rounded-full border border-[#D0D5CB]">
              Community
            </span>
          </div>
          <p className="text-[#8EA087] text-xs md:text-sm font-medium">
            Forum Messages
          </p>
          <h3 className="text-2xl md:text-4xl font-black text-[#193C1F] mt-1 truncate">
            {totalChats}
          </h3>
        </Card>
      </div>

      {/* Donation Summary Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
        {[
          {
            label: "Today's Donations",
            value: fmt(donationTotals.today),
          },
          {
            label: "This Month's Donations",
            value: fmt(donationTotals.month),
          },
          {
            label: 'All-time Collected',
            value: fmt(donationTotals.allTime),
          },
        ].map((item) => (
          <div
            key={item.label}
            className="bg-[#193C1F] text-white rounded-2xl p-5 md:p-6 shadow-md"
          >
            <p className="text-[#8EA087] text-xs md:text-sm font-medium mb-1 md:mb-2 opacity-80">
              {item.label}
            </p>
            <p className="text-lg md:text-2xl font-black truncate">
              {item.value}
            </p>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Donations Line Chart */}
        <Card className="lg:col-span-1 p-5 md:p-6">
          <h4 className="font-black text-[#193C1F] mb-1 text-sm md:text-base">
            Donations (7 Days)
          </h4>
          <p className="text-[#8EA087] text-[10px] md:text-xs mb-4">
            Total amount per day
          </p>
          <div className="h-[250px] md:h-[300px]">
            <DonationLineChart data={donationChartData} />
          </div>
        </Card>

        {/* Reports Bar Chart */}
        <Card className="p-5 md:p-6">
          <h4 className="font-black text-[#193C1F] mb-1 text-sm md:text-base">
            Reports by Status
          </h4>
          <p className="text-[#8EA087] text-[10px] md:text-xs mb-4">
            Distribution of all reports
          </p>
          <div className="h-[250px] md:h-[300px]">
            <ReportsBarChart data={reportsChartData} />
          </div>
        </Card>

        {/* Consultations Bar Chart */}
        <Card className="p-5 md:p-6">
          <h4 className="font-black text-[#193C1F] mb-1 text-sm md:text-base">
            Consultations by Status
          </h4>
          <p className="text-[#8EA087] text-[10px] md:text-xs mb-4">
            Distribution of all consultations
          </p>
          <div className="h-[250px] md:h-[300px]">
            <ConsultationLineChart data={consultChartData} />
          </div>
        </Card>
      </div>

      {/* Recent Donations Table */}
      <Card>
        <div className="p-5 md:p-6 border-b border-[#D0D5CB]/50 flex justify-between items-center bg-[#FDFCFB]">
          <div>
            <h4 className="font-black text-[#193C1F] text-sm md:text-base">
              Recent Donations
            </h4>
            <p className="text-[#8EA087] text-[10px] md:text-xs mt-0.5">
              Latest successful transactions
            </p>
          </div>
          <Link
            href="/dashboard/admin/donations"
            className="text-[11px] md:text-sm font-black text-[#8EA087] hover:text-[#193C1F] dark:hover:text-white transition-colors"
          >
            View all
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[700px]">
            <thead className="bg-[#F7F3ED]/50 text-[10px] md:text-[11px] text-[#8EA087] font-black uppercase tracking-widest">
              <tr>
                <th className="px-6 py-4">Donor</th>
                <th className="px-6 py-4">For</th>
                <th className="px-6 py-4">Method</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F7F3ED] text-xs md:text-sm">
              {recentDonations.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-12 text-center text-[#8EA087] font-medium italic"
                  >
                    No donations yet.
                  </td>
                </tr>
              ) : (
                recentDonations.map((d) => (
                  <tr
                    key={d.id}
                    className="hover:bg-[#F7F3ED]/30 transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[#F7F3ED] border border-[#D0D5CB] flex items-center justify-center shrink-0 overflow-hidden relative">
                          <User size={14} className="text-[#8EA087]" />
                        </div>
                        <div>
                          <p className="font-bold text-[#193C1F] group-hover:text-black transition-colors">
                            {d.user.name}
                          </p>
                          <p className="text-[10px] text-[#8EA087] opacity-80">
                            {d.user.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {d.donationType === 'PLATFORM' ? (
                        <span className="text-[10px] font-black text-[#193C1F] bg-[#193C1F]/5 px-2 py-1 rounded-lg border border-[#193C1F]/10">
                          PLATFORM
                        </span>
                      ) : (
                        <span className="text-[#193C1F] line-clamp-1 max-w-[150px] font-medium">
                          {d.report?.title || '—'}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-[#8EA087] font-medium italic text-[11px]">
                      {fmtMethod(d.paymentMethod)}
                    </td>
                    <td className="px-6 py-4 text-[#8EA087] text-[11px]">
                      {fmtDate(d.timestamp)}
                    </td>
                    <td className="px-6 py-4 text-right font-black text-[#193C1F]">
                      {fmt(Number(d.amount))}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
