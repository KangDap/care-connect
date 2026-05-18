'use client';

import { Badge } from '@/components/badge';
import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { Table } from '@/components/table';
import { Activity, CreditCard, FileText } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

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
  donations: Array<{ amount: number }>;
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

  const totalDonationAmount = donations.reduce(
    (accumulator, current) => accumulator + current.amount,
    0,
  );

  return (
    <div className="space-y-6 md:space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl md:text-[36px] font-black text-[#193c1f] tracking-tight leading-tight">
            Welcome back, {displayName}
          </h2>
          <p className="text-[#8ea087] text-sm md:text-[16px] font-medium mt-1">
            {searchBarQuery
              ? `Showing results for "${searchBarQuery}"`
              : pendingReportsCount > 0
                ? `You have ${pendingReportsCount} pending reports.`
                : 'No pending reports right now.'}
          </p>
        </div>
        <div className="grid grid-cols-3 gap-1 sm:flex sm:flex-wrap sm:gap-2">
          <Button
            suppressHydrationWarning
            onClick={() => router.push('/consultation?from=dashboard')}
            variant="secondary"
            className="text-[10px] sm:text-xs md:text-sm px-1.5 py-1 sm:px-3 shadow-md truncate"
          >
            + New Consultation
          </Button>
          <Button
            suppressHydrationWarning
            onClick={() => router.push('/report?from=dashboard')}
            variant="outline"
            className="text-[10px] sm:text-xs md:text-sm px-1.5 py-1 sm:px-3 shadow-md truncate"
          >
            + New Report
          </Button>
          <Button
            suppressHydrationWarning
            onClick={() => router.push('/donation?from=dashboard')}
            variant="outline"
            className="text-[10px] sm:text-xs md:text-sm px-1.5 py-1 sm:px-3 shadow-md truncate"
          >
            + New Donation
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-2 md:gap-4">
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
          {
            label: 'Donations Given',
            val: formatRupiah(totalDonationAmount),
            icon: <DonationsIcon />,
          },
        ].map((item, index) => (
          <Card
            key={index}
            className="flex items-center gap-2 rounded-[16px] md:rounded-[24px] bg-[#f7f3ed] p-2 sm:p-4 md:p-5 border-0"
          >
            <div className="w-6 h-6 sm:w-9 sm:h-9 md:w-11 md:h-11 bg-[#EBE6DE] rounded-lg md:rounded-2xl flex items-center justify-center shrink-0 text-[#193c1f]">
              {item.icon}
            </div>
            <div className="min-w-0">
              <p className="text-[9px] sm:text-[10px] uppercase font-black text-[#8ea087] tracking-widest truncate">
                {item.label}
              </p>
              <p
                className={`${
                  item.label === 'Donations Given'
                    ? 'text-sm sm:text-base md:text-lg'
                    : 'text-xl sm:text-2xl md:text-[28px]'
                } font-bold text-[#193c1f] leading-tight truncate`}
              >
                {item.val}
              </p>
            </div>
          </Card>
        ))}
      </div>

      {/* Tables Row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 md:gap-8">
        {/* Recent Consultations */}
        <Card className="p-0 space-y-0">
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
        <Card className="p-0 space-y-0">
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
