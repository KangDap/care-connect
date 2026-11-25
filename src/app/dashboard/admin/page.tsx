import { Card, StatCard } from '@/components/card';
import { PageHeader } from '@/components/page-header';
import type { ApiFailure, ApiSuccess } from '@/lib/api-response';
import type { AdminDashboardData } from '@/modules/dashboard/dashboard.types';
import { Activity, CreditCard, FileText, MessageSquare } from 'lucide-react';
import { headers } from 'next/headers';
import NextLink from 'next/link';

import {
  ConsultationLineChart,
  DonationLineChart,
  ReportsBarChart,
} from './AdminCharts';
import { RecentDonationsTable } from './RecentDonationsTable';

const paymentEnabled = process.env.NEXT_PUBLIC_PAYMENT_ENABLED === 'true';

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
  const response = await fetch(`${protocol}://${host}/api/dashboard/admin`, {
    cache: 'no-store',
    headers: { cookie },
  });

  if (!response.ok) {
    throw new Error('Failed to load admin dashboard data');
  }

  const payload = (await response.json()) as
    | ApiSuccess<AdminDashboardData>
    | ApiFailure;

  if (!payload.success) {
    throw new Error(payload.error.message);
  }

  return payload.data;
}

export default async function AdminDashboardPage() {
  const data = await getAdminDashboardData();

  const baseStats = [
    {
      label: 'Total Reports',
      value: data.totalReports,
      detail: `${data.pendingReports} pending`,
      icon: FileText,
    },
    {
      label: 'Total Consultations',
      value: data.totalConsultations,
      detail: `${data.activeConsultations} active`,
      icon: Activity,
    },
    {
      label: 'Forum Messages',
      value: data.totalChats,
      detail: 'Community activity',
      icon: MessageSquare,
    },
  ];

  if (paymentEnabled) {
    baseStats.push({
      label: 'Total Donations',
      value: data.totalDonationsCount,
      detail: 'All transactions',
      icon: CreditCard,
    });
  }

  return (
    <div className="space-y-6 md:space-y-8">
      <PageHeader
        title="Admin Dashboard"
        description={`Platform overview ${paymentEnabled ? '&' : 'and'} moderation center.`}
      />

      {/* Stats Cards */}
      <div
        className={`grid gap-3 md:gap-5 ${paymentEnabled ? 'grid-cols-2 lg:grid-cols-4' : 'grid-cols-1 sm:grid-cols-3'}`}
      >
        {baseStats.map(({ label, value, detail, icon: Icon }) => (
          <StatCard
            key={label}
            icon={<Icon size={20} strokeWidth={2.5} />}
            label={label}
            value={value}
            hint={detail}
          />
        ))}
      </div>

      {/* Donation Summary Row — only when payment enabled */}
      {paymentEnabled && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 md:gap-5">
          {[
            {
              label: 'Today',
              value: fmt(data.donationTotals?.today ?? 0),
            },
            {
              label: 'This Month',
              value: fmt(data.donationTotals?.month ?? 0),
            },
            {
              label: 'All-time',
              value: fmt(data.donationTotals?.allTime ?? 0),
            },
          ].map((item) => (
            <div
              key={item.label}
              className="min-w-0 overflow-hidden rounded-2xl bg-[#193C1F] p-4 text-white shadow-sm md:rounded-3xl md:p-5"
            >
              <p className="mb-1 truncate text-[10px] font-black uppercase tracking-widest text-[#8EA087] md:text-xs">
                {item.label}
              </p>
              <p className="text-lg font-black leading-tight md:text-xl">
                {item.value}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Charts Row */}
      <div
        className={`grid grid-cols-1 gap-5 md:gap-8 ${paymentEnabled ? 'lg:grid-cols-3' : 'lg:grid-cols-2'}`}
      >
        {/* Donations Line Chart — only when payment enabled */}
        {paymentEnabled && (
          <Card className="lg:col-span-1 p-4 sm:p-5 md:p-6 min-w-0">
            <h3 className="text-lg font-black tracking-tight text-[#193C1F] sm:text-xl">
              Donations (7 Days)
            </h3>
            <p className="mb-4 mt-0.5 text-xs font-medium text-[#8EA087]">
              Total amount per day
            </p>
            <div className="h-[250px] md:h-[300px] w-full min-w-0">
              <DonationLineChart data={data.donationChartData ?? []} />
            </div>
          </Card>
        )}

        {/* Reports Bar Chart */}
        <Card className="p-4 sm:p-5 md:p-6 min-w-0">
          <h3 className="text-lg font-black tracking-tight text-[#193C1F] sm:text-xl">
            Reports by Status
          </h3>
          <p className="mb-4 mt-0.5 text-xs font-medium text-[#8EA087]">
            Distribution of all reports
          </p>
          <div className="h-[250px] md:h-[300px] w-full min-w-0">
            <ReportsBarChart data={data.reportsChartData} />
          </div>
        </Card>

        {/* Consultations Bar Chart */}
        <Card className="p-4 sm:p-5 md:p-6 min-w-0">
          <h3 className="text-lg font-black tracking-tight text-[#193C1F] sm:text-xl">
            Consultations by Status
          </h3>
          <p className="mb-4 mt-0.5 text-xs font-medium text-[#8EA087]">
            Distribution of all consultations
          </p>
          <div className="h-[250px] md:h-[300px] w-full min-w-0">
            <ConsultationLineChart data={data.consultChartData} />
          </div>
        </Card>
      </div>

      {/* Recent Donations Table — only when payment enabled */}
      {paymentEnabled && (
        <Card className="p-0">
          <div className="flex items-center justify-between gap-3 border-b border-[#D0D5CB]/50 bg-[#FDFCFB] p-4 sm:p-5 md:p-6">
            <div>
              <h3 className="text-lg font-black tracking-tight text-[#193C1F] sm:text-xl">
                Recent Donations
              </h3>
              <p className="mt-0.5 text-xs font-medium text-[#8EA087]">
                Latest successful transactions
              </p>
            </div>
            <NextLink
              href="/dashboard/admin/donations"
              className="text-[11px] md:text-sm font-black text-[#193C1F] hover:opacity-70 transition-opacity bg-[#F7F3ED] px-3 py-1.5 rounded-xl border border-[#D0D5CB] whitespace-nowrap"
            >
              View All →
            </NextLink>
          </div>
          <RecentDonationsTable recentDonations={data.recentDonations ?? []} />
        </Card>
      )}
    </div>
  );
}
