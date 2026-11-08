import { Card } from '@/components/card';
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
      <div>
        <h1 className="text-2xl font-black leading-tight text-[#193C1F] md:text-[32px]">
          Admin Dashboard
        </h1>
        <p className="mt-1 text-sm font-medium text-[#8EA087] md:text-base">
          Platform overview {paymentEnabled ? '&' : 'and'} moderation center.
        </p>
      </div>

      {/* Stats Cards */}
      <div
        className={`grid gap-3 md:gap-5 ${paymentEnabled ? 'grid-cols-2 lg:grid-cols-4' : 'grid-cols-1 sm:grid-cols-3'}`}
      >
        {baseStats.map(({ label, value, detail, icon: Icon }) => (
          <Card key={label} className="p-2 sm:p-4 md:p-5 shadow-sm">
            <div className="flex items-center gap-1.5 sm:gap-3">
              <div className="w-7 h-7 sm:w-9 sm:h-9 md:w-10 md:h-10 bg-[#F7F3ED] rounded-lg md:rounded-xl flex items-center justify-center shrink-0">
                <Icon
                  className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 text-[#193C1F]"
                  strokeWidth={2.5}
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[7.5px] sm:text-[10px] md:text-xs text-[#8EA087] font-bold uppercase tracking-wider truncate">
                  {label}
                </p>
                <h3 className="text-sm sm:text-xl md:text-3xl font-black text-[#193C1F] leading-tight truncate">
                  {value}
                </h3>
                <span className="text-[6.5px] sm:text-[8px] md:text-[9px] font-black uppercase tracking-widest text-amber-600 bg-amber-50 px-1 py-0.5 rounded-full border border-amber-200 inline-block mt-0.5 whitespace-nowrap">
                  {detail}
                </span>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Donation Summary Row — only when payment enabled */}
      {paymentEnabled && (
        <div className="grid grid-cols-3 gap-1.5 sm:gap-3 md:gap-5">
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
              className="bg-[#193C1F] text-white rounded-lg sm:rounded-2xl p-1.5 sm:p-4 md:p-5 shadow-sm min-w-0 overflow-hidden"
            >
              <p className="text-[#8EA087] text-[7px] sm:text-[10px] md:text-xs font-bold uppercase tracking-wider mb-0.5 sm:mb-2 opacity-80 truncate">
                {item.label}
              </p>
              <p
                className="text-[9px] sm:text-sm md:text-base font-black leading-tight hyphens-auto"
                style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}
              >
                {item.value}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Charts Row */}
      <div
        className={`grid grid-cols-1 gap-6 ${paymentEnabled ? 'lg:grid-cols-3' : 'lg:grid-cols-2'}`}
      >
        {/* Donations Line Chart — only when payment enabled */}
        {paymentEnabled && (
          <Card className="lg:col-span-1 p-4 sm:p-5 md:p-6 min-w-0">
            <h4 className="font-black text-[#193C1F] mb-1 text-sm md:text-base">
              Donations (7 Days)
            </h4>
            <p className="text-[#8EA087] text-[10px] md:text-xs mb-4">
              Total amount per day
            </p>
            <div className="h-[250px] md:h-[300px] w-full min-w-0">
              <DonationLineChart data={data.donationChartData ?? []} />
            </div>
          </Card>
        )}

        {/* Reports Bar Chart */}
        <Card className="p-4 sm:p-5 md:p-6 min-w-0">
          <h4 className="font-black text-[#193C1F] mb-1 text-sm md:text-base">
            Reports by Status
          </h4>
          <p className="text-[#8EA087] text-[10px] md:text-xs mb-4">
            Distribution of all reports
          </p>
          <div className="h-[250px] md:h-[300px] w-full min-w-0">
            <ReportsBarChart data={data.reportsChartData} />
          </div>
        </Card>

        {/* Consultations Bar Chart */}
        <Card className="p-4 sm:p-5 md:p-6 min-w-0">
          <h4 className="font-black text-[#193C1F] mb-1 text-sm md:text-base">
            Consultations by Status
          </h4>
          <p className="text-[#8EA087] text-[10px] md:text-xs mb-4">
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
          <div className="p-4 sm:p-5 md:p-6 border-b border-[#D0D5CB]/50 flex justify-between items-center bg-[#FDFCFB]">
            <div>
              <h4 className="font-black text-[#193C1F] text-sm md:text-base">
                Recent Donations
              </h4>
              <p className="text-[#8EA087] text-[10px] md:text-xs mt-0.5">
                Latest successful transactions
              </p>
            </div>
            <NextLink
              href="/dashboard/admin/donations"
              className="text-[11px] md:text-sm font-black text-[#193C1F] hover:opacity-70 transition-opacity bg-[#F7F3ED] px-3 py-1.5 md:px-4 md:py-2 rounded-xl border border-[#D0D5CB]"
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
