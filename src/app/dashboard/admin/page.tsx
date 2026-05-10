import type { ApiFailure, ApiSuccess } from '@/lib/api-response';
import type { AdminDashboardData } from '@/modules/dashboard/dashboard.types';
import { headers } from 'next/headers';

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
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-[32px] font-black text-[#193c1f]">
          Admin Dashboard
        </h1>
        <p className="text-[#8ea087] font-medium">
          Platform overview & moderation center.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Reports */}
        <div className="bg-white border border-[#d0d5cb] rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 bg-[#f7f3ed] rounded-xl flex items-center justify-center">
              <svg
                className="w-5 h-5 text-[#193c1f]"
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
            <span className="text-[10px] font-black uppercase tracking-widest text-amber-600 bg-amber-50 px-2 py-1 rounded-full border border-amber-200">
              {pendingReports} pending
            </span>
          </div>
          <p className="text-[#8ea087] text-sm font-medium">Total Reports</p>
          <h3 className="text-4xl font-black text-[#193c1f] mt-1">
            {totalReports}
          </h3>
        </div>

        {/* Consultations */}
        <div className="bg-white border border-[#d0d5cb] rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 bg-[#f7f3ed] rounded-xl flex items-center justify-center">
              <svg
                className="w-5 h-5 text-[#193c1f]"
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
            <span className="text-[10px] font-black uppercase tracking-widest text-green-700 bg-green-50 px-2 py-1 rounded-full border border-green-200">
              {activeConsultations} active
            </span>
          </div>
          <p className="text-[#8ea087] text-sm font-medium">
            Total Consultations
          </p>
          <h3 className="text-4xl font-black text-[#193c1f] mt-1">
            {totalConsultations}
          </h3>
        </div>

        {/* Donations */}
        <div className="bg-white border border-[#d0d5cb] rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 bg-[#f7f3ed] rounded-xl flex items-center justify-center">
              <svg
                className="w-5 h-5 text-[#193c1f]"
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
            <span className="text-[10px] font-black uppercase tracking-widest text-[#8ea087] bg-[#f7f3ed] px-2 py-1 rounded-full border border-[#d0d5cb]">
              {totalDonationsCount} tx
            </span>
          </div>
          <p className="text-[#8ea087] text-sm font-medium">
            All-time Donations
          </p>
          <h3 className="text-2xl font-black text-[#193c1f] mt-1">
            {fmt(donationTotals.allTime)}
          </h3>
        </div>

        {/* Forum */}
        <div className="bg-white border border-[#d0d5cb] rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 bg-[#f7f3ed] rounded-xl flex items-center justify-center">
              <svg
                className="w-5 h-5 text-[#193c1f]"
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
            <span className="text-[10px] font-black uppercase tracking-widest text-[#8ea087] bg-[#f7f3ed] px-2 py-1 rounded-full border border-[#d0d5cb]">
              Community
            </span>
          </div>
          <p className="text-[#8ea087] text-sm font-medium">Forum Messages</p>
          <h3 className="text-4xl font-black text-[#193c1f] mt-1">
            {totalChats}
          </h3>
        </div>
      </div>

      {/* Donation Summary Row */}
      <div className="grid grid-cols-3 gap-6">
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
            className="bg-[#193c1f] text-white rounded-2xl p-6"
          >
            <p className="text-[#8ea087] text-sm font-medium mb-2">
              {item.label}
            </p>
            <p className="text-2xl font-black">{item.value}</p>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Donations Line Chart */}
        <div className="lg:col-span-1 bg-white border border-[#d0d5cb] rounded-2xl p-6 shadow-sm">
          <h4 className="font-black text-[#193c1f] mb-1">Donations (7 Days)</h4>
          <p className="text-[#8ea087] text-xs mb-4">Total amount per day</p>
          <DonationLineChart data={donationChartData} />
        </div>

        {/* Reports Bar Chart */}
        <div className="bg-white border border-[#d0d5cb] rounded-2xl p-6 shadow-sm">
          <h4 className="font-black text-[#193c1f] mb-1">Reports by Status</h4>
          <p className="text-[#8ea087] text-xs mb-4">
            Distribution of all reports
          </p>
          <ReportsBarChart data={reportsChartData} />
        </div>

        {/* Consultations Bar Chart */}
        <div className="bg-white border border-[#d0d5cb] rounded-2xl p-6 shadow-sm">
          <h4 className="font-black text-[#193c1f] mb-1">
            Consultations by Status
          </h4>
          <p className="text-[#8ea087] text-xs mb-4">
            Distribution of all consultations
          </p>
          <ConsultationLineChart data={consultChartData} />
        </div>
      </div>

      {/* Recent Donations Table */}
      <div className="bg-white border border-[#d0d5cb] rounded-2xl overflow-hidden shadow-sm">
        <div className="p-6 border-b border-[#d0d5cb] flex justify-between items-center">
          <div>
            <h4 className="font-black text-[#193c1f]">Recent Donations</h4>
            <p className="text-[#8ea087] text-xs mt-0.5">
              Latest successful transactions
            </p>
          </div>
          <a
            href="/dashboard/admin/donations"
            className="text-sm font-bold text-[#8ea087] hover:text-[#193c1f] transition-colors"
          >
            View All →
          </a>
        </div>
        <table className="w-full text-left">
          <thead className="bg-[#f7f3ed] text-[11px] text-[#8ea087] font-black uppercase tracking-widest">
            <tr>
              <th className="px-6 py-4">Donor</th>
              <th className="px-6 py-4">For</th>
              <th className="px-6 py-4">Method</th>
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4 text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f7f3ed] text-sm">
            {recentDonations.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-6 py-10 text-center text-[#8ea087]"
                >
                  No donations yet.
                </td>
              </tr>
            ) : (
              recentDonations.map((d) => (
                <tr
                  key={d.id}
                  className="hover:bg-[#f7f3ed]/50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <p className="font-bold text-[#193c1f]">{d.user.name}</p>
                    <p className="text-[11px] text-[#8ea087]">{d.user.email}</p>
                  </td>
                  <td className="px-6 py-4 text-[#193c1f]">
                    {d.donationType === 'PLATFORM' ? (
                      <span className="text-xs font-bold text-[#8ea087] bg-[#f7f3ed] px-2 py-1 rounded-full">
                        Platform
                      </span>
                    ) : (
                      <span className="text-xs line-clamp-1">
                        {d.report?.title || '—'}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-[#8ea087] italic">
                    {fmtMethod(d.paymentMethod)}
                  </td>
                  <td className="px-6 py-4 text-[#8ea087] text-xs">
                    {fmtDate(d.timestamp)}
                  </td>
                  <td className="px-6 py-4 text-right font-black text-[#193c1f]">
                    {fmt(Number(d.amount))}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
