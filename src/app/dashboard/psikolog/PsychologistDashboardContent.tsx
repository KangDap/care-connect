'use client';

import { Badge } from '@/components/badge';
import { Card } from '@/components/card';
import { Table } from '@/components/table';
import { Activity, CheckCircle, Clock, CreditCard } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

const TotalIcon = () => <Activity size={20} strokeWidth={2} />;
const PendingIcon = () => <Clock size={20} strokeWidth={2} />;
const CompletedIcon = () => <CheckCircle size={20} strokeWidth={2} />;
const EarningsIcon = () => <CreditCard size={20} strokeWidth={2} />;

const formatDateLabel = (value: Date | string) => {
  if (!value) return '-';
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
};

interface DashboardConsultation {
  id: number;
  title: string;
  category: string;
  date: Date;
  status: string | unknown;
  isAnonymous?: boolean;
  user: { name: string | null } | null;
}

type PsychologistDashboardProps = {
  upcomingConsultations: DashboardConsultation[];
  completedConsultations: DashboardConsultation[];
  displayName: string;
  totalConsultationsCount: number;
  pendingConsultationsCount: number;
  completedConsultationsCount: number;
  monthlyEarnings: number;
};

export default function PsychologistDashboardContent({
  upcomingConsultations = [],
  completedConsultations = [],
  displayName = 'Psychologist',
  totalConsultationsCount,
  pendingConsultationsCount,
  completedConsultationsCount,
  monthlyEarnings = 0,
}: PsychologistDashboardProps) {
  const searchParams = useSearchParams();
  const searchBarQuery = searchParams.get('search')?.toLowerCase() || '';

  const pendingData = upcomingConsultations.filter((item) => {
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

  const completedData = completedConsultations.filter((item) => {
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

  const formattedEarnings = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(monthlyEarnings);

  const stats = [
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
    {
      label: 'Monthly Earnings (Est.)',
      val: formattedEarnings,
      icon: <EarningsIcon />,
      highlight: true,
    },
  ];

  return (
    <div className="space-y-6 md:space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h2 className="text-2xl sm:text-3xl md:text-[36px] font-black text-[#193c1f] tracking-tight leading-tight">
          Welcome, {displayName}
        </h2>
        <p className="text-[#8ea087] text-sm md:text-[16px] font-medium mt-1">
          {searchBarQuery
            ? `Showing results for "${searchBarQuery}"`
            : `You have ${pendingConsultationsCount} upcoming consultations to handle.`}
        </p>
      </div>

      {/* Stats Cards — 2 cols on mobile/sm, 4 on lg */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-5">
        {stats.map((item, index) => (
          <Card
            key={index}
            className="flex items-center gap-3 md:gap-4 p-3 sm:p-4 md:p-5 rounded-[20px] md:rounded-[28px] bg-[#f7f3ed] border-0"
          >
            <div className="w-9 h-9 md:w-11 md:h-11 bg-[#EBE6DE] rounded-xl md:rounded-2xl flex items-center justify-center shrink-0 text-[#193c1f]">
              {item.icon}
            </div>
            <div className="min-w-0">
              <p className="text-[8px] sm:text-[9px] md:text-[10px] uppercase font-black text-[#8ea087] tracking-widest truncate leading-tight mb-0.5">
                {item.label}
              </p>
              <p
                className={`font-bold text-[#193c1f] leading-tight ${
                  item.highlight
                    ? 'text-xs sm:text-sm md:text-base'
                    : 'text-lg sm:text-xl md:text-2xl'
                }`}
              >
                {item.val}
              </p>
              {item.highlight && (
                <p className="text-[8px] md:text-[9px] text-[#d6a36c] font-black uppercase tracking-widest mt-0.5">
                  This month
                </p>
              )}
            </div>
          </Card>
        ))}
      </div>

      {/* Tables Row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 md:gap-8 items-start">
        {/* Upcoming Consultations */}
        <Card className="p-0 space-y-0">
          <div className="flex items-center justify-between p-4 sm:p-5 md:p-6 border-b border-[#D0D5CB]/50 bg-[#FDFCFB]">
            <div>
              <h3 className="text-lg sm:text-xl font-black text-[#193c1f] tracking-tight">
                Upcoming Consultations
              </h3>
              <p className="text-xs text-[#8ea087] font-medium mt-0.5">
                Scheduled sessions awaiting action
              </p>
            </div>
            <Link
              href="/dashboard/psikolog/consultations"
              className="text-[11px] md:text-sm font-black text-[#193c1f] hover:opacity-70 transition-opacity bg-[#F7F3ED] px-3 py-1.5 rounded-xl border border-[#D0D5CB] whitespace-nowrap"
            >
              View All →
            </Link>
          </div>
          <Table
            className="rounded-t-none border-t-0 shadow-none"
            minWidth="min-w-[450px]"
            data={pendingData.slice(0, 5)}
            keyExtractor={(row) => row.id}
            emptyMessage="No upcoming consultations found."
            columns={[
              {
                header: 'Patient',
                cell: (row) => (
                  <p className="font-bold text-[#193c1f] text-xs md:text-sm">
                    {row.isAnonymous
                      ? 'Anonymous Patient'
                      : row.user?.name || 'Anonymous'}
                  </p>
                ),
              },
              {
                header: 'Date',
                cell: (row) => (
                  <p className="text-[#8ea087] text-xs">
                    {formatDateLabel(row.date)}
                  </p>
                ),
              },
              {
                header: 'Status',
                cell: (row) => (
                  <Badge status="UPCOMING">{String(row.status)}</Badge>
                ),
              },
            ]}
          />
        </Card>

        {/* Completed Sessions */}
        <Card className="p-0 space-y-0">
          <div className="flex items-center justify-between p-4 sm:p-5 md:p-6 border-b border-[#D0D5CB]/50 bg-[#FDFCFB]">
            <div>
              <h3 className="text-lg sm:text-xl font-black text-[#193c1f] tracking-tight">
                Completed Sessions
              </h3>
              <p className="text-xs text-[#8ea087] font-medium mt-0.5">
                Your finished consultation history
              </p>
            </div>
            <Link
              href="/dashboard/psikolog/consultations?filter=completed"
              className="text-[11px] md:text-sm font-black text-[#193c1f] hover:opacity-70 transition-opacity bg-[#F7F3ED] px-3 py-1.5 rounded-xl border border-[#D0D5CB] whitespace-nowrap"
            >
              View All →
            </Link>
          </div>
          <Table
            className="rounded-t-none border-t-0 shadow-none"
            minWidth="min-w-[450px]"
            data={completedData.slice(0, 5)}
            keyExtractor={(row) => row.id}
            emptyMessage="No completed sessions yet."
            columns={[
              {
                header: 'Patient',
                cell: (row) => (
                  <p className="font-bold text-[#193c1f] text-xs md:text-sm">
                    {row.isAnonymous
                      ? 'Anonymous Patient'
                      : row.user?.name || 'Anonymous'}
                  </p>
                ),
              },
              {
                header: 'Date',
                cell: (row) => (
                  <p className="text-[#8ea087] text-xs">
                    {formatDateLabel(row.date)}
                  </p>
                ),
              },
              {
                header: 'Status',
                cell: (row) => (
                  <Badge status="SUCCESS">{String(row.status)}</Badge>
                ),
              },
            ]}
          />
        </Card>
      </div>
    </div>
  );
}
