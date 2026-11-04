import { Card } from '@/components/card';
import type { ApiFailure, ApiSuccess } from '@/lib/api-response';
import type { AdminDashboardData } from '@/modules/dashboard/dashboard.types';
import { Activity, FileText, MessageSquare } from 'lucide-react';
import { headers } from 'next/headers';

import { ConsultationLineChart, ReportsBarChart } from './AdminCharts';

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
  const stats = [
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

  return (
    <div className="space-y-6 md:space-y-8">
      <div>
        <h1 className="text-2xl font-black leading-tight text-[#193C1F] md:text-[32px]">
          Admin Dashboard
        </h1>
        <p className="mt-1 text-sm font-medium text-[#8EA087] md:text-base">
          Platform overview and moderation center.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 md:gap-5">
        {stats.map(({ label, value, detail, icon: Icon }) => (
          <Card key={label} className="p-4 shadow-sm md:p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F7F3ED]">
                <Icon className="h-5 w-5 text-[#193C1F]" strokeWidth={2.5} />
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs font-bold uppercase tracking-wider text-[#8EA087]">
                  {label}
                </p>
                <h2 className="text-3xl font-black leading-tight text-[#193C1F]">
                  {value}
                </h2>
                <p className="text-xs font-medium text-[#8EA087]">{detail}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="min-w-0 p-4 sm:p-5 md:p-6">
          <h2 className="mb-1 text-sm font-black text-[#193C1F] md:text-base">
            Reports by Status
          </h2>
          <p className="mb-4 text-xs text-[#8EA087]">
            Distribution of all reports
          </p>
          <div className="h-[260px] w-full">
            <ReportsBarChart data={data.reportsChartData} />
          </div>
        </Card>

        <Card className="min-w-0 p-4 sm:p-5 md:p-6">
          <h2 className="mb-1 text-sm font-black text-[#193C1F] md:text-base">
            Consultations by Status
          </h2>
          <p className="mb-4 text-xs text-[#8EA087]">
            Distribution of all consultations
          </p>
          <div className="h-[260px] w-full">
            <ConsultationLineChart data={data.consultChartData} />
          </div>
        </Card>
      </div>
    </div>
  );
}
