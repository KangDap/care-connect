'use client';

import { Badge } from '@/components/badge';
import { Button } from '@/components/button';
import { Card } from '@/components/card';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

const ConsultationIcon = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#193C1F"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
    <circle cx="9" cy="7" r="4"></circle>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
  </svg>
);

const ReportsIcon = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#193C1F"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
    <polyline points="14 2 14 8 20 8"></polyline>
    <line x1="16" y1="13" x2="8" y2="13"></line>
    <line x1="16" y1="17" x2="8" y2="17"></line>
  </svg>
);

const DonationsIcon = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#193C1F"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="12" y1="1" x2="12" y2="23"></line>
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
  </svg>
);

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
  if (typeof value === 'string') {
    return value.toLowerCase();
  }
  return '';
};

export default function DashboardContent({
  consultations,
  reports,
  donations,
  displayName,
  pendingReportsCount,
  // 1. AMBIL PROPS INI DARI PARENT (page.tsx)
  totalConsultationsCount,
  totalReportsCount,
}: DashboardContentProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchBarQuery = searchParams.get('search')?.toLowerCase() || '';

  // --- LOGIKA LAMA YANG SALAH SUDAH DIHAPUS (consultations.length) ---

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
    <div className="space-y-10 animate-fade-in">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-[36px] font-black text-[#193c1f] tracking-tight leading-tight">
            Welcome back, {displayName}
          </h2>
          <p className="text-[#8ea087] text-[16px] font-medium mt-1">
            {searchBarQuery
              ? `Showing results for \"${searchBarQuery}\"`
              : pendingReportsCount > 0
                ? `You have ${pendingReportsCount} pending reports.`
                : 'No pending reports right now.'}
          </p>
        </div>
        <div className="flex gap-4">
          <Button
            suppressHydrationWarning
            onClick={() => router.push('/consultation?from=dashboard')}
            variant="secondary"
            className="shadow-lg"
          >
            + New Consultation
          </Button>
          <Button
            suppressHydrationWarning
            onClick={() => router.push('/report?from=dashboard')}
            variant="outline"
            className="shadow-lg"
          >
            + New Report
          </Button>
          <Button
            suppressHydrationWarning
            onClick={() => router.push('/donation?from=dashboard')}
            variant="outline"
            className="shadow-lg"
          >
            + New Donation
          </Button>
        </div>
      </div>

      <div className="flex gap-8">
        {[
          {
            label: 'Total Consultations',
            // 2. PAKAI NILAI ASLI DARI SERVER
            val: totalConsultationsCount.toString(),
            icon: <ConsultationIcon />,
          },
          {
            label: 'Reports Filed',
            // 2. PAKAI NILAI ASLI DARI SERVER
            val: totalReportsCount.toString(),
            icon: <ReportsIcon />,
          },
          {
            label: 'Donations Received',
            val: formatRupiah(totalDonationAmount),
            icon: <DonationsIcon />,
          },
        ].map((item, index) => (
          <Card
            key={index}
            className="flex flex-1 items-center gap-6 rounded-[28px] bg-[#f7f3ed] p-8"
          >
            <div className="w-14 h-14 bg-[#EBE6DE] rounded-2xl flex items-center justify-center">
              {item.icon}
            </div>
            <div>
              <p className="text-[10px] uppercase font-black text-[#8ea087] tracking-widest">
                {item.label}
              </p>
              <p
                className={`${item.label === 'Donations Received' ? 'text-[24px]' : 'text-[32px]'} font-bold text-[#193c1f] leading-none`}
              >
                {item.val}
              </p>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
        <Card className="overflow-hidden rounded-[32px] p-0">
          <div className="p-8 border-b border-[#f7f3ed] flex justify-between items-center bg-[#FDFCFB]">
            <h3 className="font-bold text-[18px] text-[#193c1f]">
              Recent Consultations
            </h3>
            <Link href="/dashboard/consultations">
              <Button variant="ghost" className="px-0 py-0">
                View All
              </Button>
            </Link>
          </div>
          <table className="w-full text-left">
            <thead className="bg-[#f7f3ed] text-[11px] text-[#8ea087] font-black uppercase tracking-widest">
              <tr>
                <th className="px-8 py-4">Doctor</th>
                <th className="px-8 py-4">Date</th>
                <th className="px-8 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="text-[14px] text-[#193c1f]">
              {recentConsultations.slice(0, 3).map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-[#f7f3ed] hover:bg-[#FDFCFB]"
                >
                  <td className="px-8 py-5 font-bold">{row.doctor}</td>
                  <td className="px-8 py-5 opacity-70">{row.dateLabel}</td>
                  <td className="px-8 py-5">
                    <Badge
                      status={
                        row.status === 'SCHEDULED' ? 'UPCOMING' : 'DEFAULT'
                      }
                    >
                      {row.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {recentConsultations.length === 0 && (
            <p className="p-10 text-center text-[#8ea087]">
              No consultations found.
            </p>
          )}
        </Card>

        <Card className="overflow-hidden rounded-[32px] p-0">
          <div className="p-8 border-b border-[#f7f3ed] flex justify-between items-center bg-[#FDFCFB]">
            <h3 className="font-bold text-[18px] text-[#193c1f]">
              Report Status
            </h3>
            <Link href="/dashboard/reports">
              <Button variant="ghost" className="px-0 py-0">
                View All
              </Button>
            </Link>
          </div>
          <table className="w-full text-left">
            <thead className="bg-[#f7f3ed] text-[11px] text-[#8ea087] font-black uppercase tracking-widest">
              <tr>
                <th className="px-8 py-4">Report ID</th>
                <th className="px-1 py-4">Type</th>
                <th className="px-8 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="text-[14px] text-[#193c1f]">
              {filteredReports.slice(0, 3).map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-[#f7f3ed] hover:bg-[#FDFCFB]"
                >
                  <td className="px-8 py-5 font-bold">{row.id}</td>
                  <td className="px-1 py-5 opacity-70">{row.type}</td>
                  <td className="px-8 py-5">
                    <Badge
                      status={row.status === 'PENDING' ? 'PENDING' : 'DEFAULT'}
                    >
                      {row.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredReports.length === 0 && (
            <p className="p-10 text-center text-[#8ea087]">No reports found.</p>
          )}
        </Card>
      </div>
    </div>
  );
}
