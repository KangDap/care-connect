'use client';

import { Badge } from '@/components/badge';
import { Button } from '@/components/button';
import { Card, StatCard } from '@/components/card';
import { PageHeader } from '@/components/page-header';
import { Table } from '@/components/table';
import { Activity, CreditCard, FileText } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

const paymentEnabled = process.env.NEXT_PUBLIC_PAYMENT_ENABLED === 'true';

const ConsultationIcon = () => <Activity size={20} strokeWidth={2} />;
const ReportsIcon = () => <FileText size={20} strokeWidth={2} />;
const DonationsIcon = () => <CreditCard size={20} strokeWidth={2} />;

type RecentConsultation = {
  id: number;
  doctor: string;
  dateLabel: string;
  status: string;
};

type ReportItem = {
  id: string;
  type: string;
  status: string;
};

type DashboardContentProps = {
  consultations: Array<{
    id: number;
    title: string;
    category: string;
    date: Date;
    status: string;
    psychologist: { name: string | null } | null;
  }>;
  reports: Array<{
    id: number;
    title: string;
    status: string;
    createdAt: Date;
  }>;
  donations?: Array<{ amount: number }>;
  displayName: string;
  pendingReportsCount: number;
  totalConsultationsCount: number;
  totalReportsCount: number;
};

const formatRupiah = (value: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(value);

const formatDateLabel = (value: Date) =>
  new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(value);

const normalizeSearchValue = (value: unknown): string => {
  if (typeof value === 'string') return value.toLowerCase();
  return '';
};

const STATUS_MAP: Record<
  string,
  'UPCOMING' | 'PENDING' | 'SUCCESS' | 'DEFAULT'
> = {
  SCHEDULED: 'UPCOMING',
  PENDING: 'PENDING',
  COMPLETED: 'SUCCESS',
  CANCELLED: 'DEFAULT',
};

export default function DashboardContent({
  consultations,
  reports,
  donations,
  displayName,
  pendingReportsCount,
  totalConsultationsCount,
  totalReportsCount,
}: DashboardContentProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchBarQuery = searchParams.get('search')?.toLowerCase() || '';

  const recentConsultations: RecentConsultation[] = consultations
    .filter((item) => {
      if (!searchBarQuery) return true;
      return [item.psychologist?.name, item.title, item.category, item.status]
        .map(normalizeSearchValue)
        .some((value) => value.includes(searchBarQuery));
    })
    .map((item) => ({
      id: item.id,
      doctor: item.psychologist?.name ?? 'Waiting for psychologist...',
      dateLabel: formatDateLabel(item.date),
      status: item.status,
    }));

  const filteredReports: ReportItem[] = reports
    .filter((item) => {
      if (!searchBarQuery) return true;
      return [String(item.id), item.title, item.status]
        .map(normalizeSearchValue)
        .some((value) => value.includes(searchBarQuery));
    })
    .map((item) => ({
      id: `#REP-${String(item.id).padStart(4, '0')}`,
      type: item.title,
      status: item.status,
    }));

  const totalDonationAmount = (donations || []).reduce(
    (accumulator, current) => accumulator + current.amount,
    0,
  );

  return (
    <div className="space-y-6 md:space-y-8 animate-fade-in">
      <PageHeader
        title={`Welcome back, ${displayName}`}
        description={
          searchBarQuery
            ? `Showing results for "${searchBarQuery}"`
            : pendingReportsCount > 0
              ? `You have ${pendingReportsCount} pending reports.`
              : 'No pending reports right now.'
        }
        actions={
          <div className="flex flex-wrap gap-2">
            <Button
              suppressHydrationWarning
              onClick={() => router.push('/consultation?from=dashboard')}
              variant="secondary"
              className="px-4 py-2.5 text-xs sm:px-5 sm:py-3 sm:text-sm"
            >
              + New Consultation
            </Button>
            <Button
              suppressHydrationWarning
              onClick={() => router.push('/report?from=dashboard')}
              variant="outline"
              className="px-4 py-2.5 text-xs sm:px-5 sm:py-3 sm:text-sm"
            >
              + New Report
            </Button>
            {paymentEnabled && (
              <Button
                suppressHydrationWarning
                onClick={() => router.push('/donation?from=dashboard')}
                variant="outline"
                className="px-4 py-2.5 text-xs sm:px-5 sm:py-3 sm:text-sm"
              >
                + New Donation
              </Button>
            )}
          </div>
        }
      />

      {/* Stats Cards */}
      <div
        className={`grid gap-3 md:gap-5 ${
          paymentEnabled ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-2'
        }`}
      >
        {[
          {
            label: 'Total Consultations',
            val: totalConsultationsCount.toString(),
            icon: <ConsultationIcon />,
          },
          {
            label: 'Reports Filed',
            val: totalReportsCount.toString(),
            icon: <ReportsIcon />,
          },
          ...(paymentEnabled
            ? [
                {
                  label: 'Donations Received',
                  val: formatRupiah(totalDonationAmount),
                  icon: <DonationsIcon />,
                },
              ]
            : []),
        ].map((item) => (
          <StatCard
            key={item.label}
            icon={item.icon}
            label={item.label}
            value={item.val}
          />
        ))}
      </div>

      {/* Tables Row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 md:gap-8 items-start w-full">
        {/* Upcoming Consultations */}
        <Card className="p-0 space-y-0 overflow-hidden flex flex-col min-w-0 w-full">
          <div className="flex items-center justify-between p-4 sm:p-5 md:p-6 border-b border-[#D0D5CB]/50 bg-[#FDFCFB]">
            <div>
              <h3 className="text-lg sm:text-xl font-black text-[#193c1f] tracking-tight">
                Recent Consultations
              </h3>
              <p className="text-xs text-[#8ea087] font-medium mt-0.5">
                Your latest session history
              </p>
            </div>
            <Link
              href="/dashboard/consultations"
              className="text-[11px] md:text-sm font-black text-[#193c1f] hover:opacity-70 transition-opacity bg-[#F7F3ED] px-3 py-1.5 rounded-xl border border-[#D0D5CB] whitespace-nowrap"
            >
              View All →
            </Link>
          </div>
          <Table
            className="rounded-t-none border-t-0 shadow-none"
            minWidth="min-w-[450px]"
            data={recentConsultations.slice(0, 5)}
            keyExtractor={(row) => row.id}
            emptyMessage="No consultations found."
            columns={[
              {
                header: 'Doctor',
                cell: (row) => (
                  <p className="font-bold text-[#193c1f] text-xs md:text-sm">
                    {row.doctor}
                  </p>
                ),
              },
              {
                header: 'Date',
                cell: (row) => (
                  <p className="text-[#8ea087] text-xs">{row.dateLabel}</p>
                ),
              },
              {
                header: 'Status',
                cell: (row) => (
                  <Badge status={STATUS_MAP[row.status] || 'DEFAULT'}>
                    {row.status}
                  </Badge>
                ),
              },
            ]}
          />
        </Card>

        {/* Report Status */}
        <Card className="p-0 space-y-0 overflow-hidden flex flex-col min-w-0 w-full">
          <div className="flex items-center justify-between p-4 sm:p-5 md:p-6 border-b border-[#D0D5CB]/50 bg-[#FDFCFB]">
            <div>
              <h3 className="text-lg sm:text-xl font-black text-[#193c1f] tracking-tight">
                Report Status
              </h3>
              <p className="text-xs text-[#8ea087] font-medium mt-0.5">
                Track your submitted reports
              </p>
            </div>
            <Link
              href="/dashboard/reports"
              className="text-[11px] md:text-sm font-black text-[#193c1f] hover:opacity-70 transition-opacity bg-[#F7F3ED] px-3 py-1.5 rounded-xl border border-[#D0D5CB] whitespace-nowrap"
            >
              View All →
            </Link>
          </div>
          <Table
            className="rounded-t-none border-t-0 shadow-none"
            minWidth="min-w-[450px]"
            data={filteredReports.slice(0, 5)}
            keyExtractor={(row) => row.id}
            emptyMessage="No reports found."
            columns={[
              {
                header: 'Report ID',
                cell: (row) => (
                  <p className="font-black text-[#193c1f] text-xs md:text-sm">
                    {row.id}
                  </p>
                ),
              },
              {
                header: 'Type',
                cell: (row) => (
                  <p className="text-[#8ea087] text-xs line-clamp-1 max-w-[160px]">
                    {row.type}
                  </p>
                ),
              },
              {
                header: 'Status',
                cell: (row) => (
                  <Badge
                    status={row.status === 'PENDING' ? 'PENDING' : 'DEFAULT'}
                  >
                    {row.status}
                  </Badge>
                ),
              },
            ]}
          />
        </Card>
      </div>
    </div>
  );
}
