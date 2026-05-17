'use client';

import { Table } from '@/components/table';
import { User } from 'lucide-react';
import { useSearchParams } from 'next/navigation';

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

const fmt = (v: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(v);

export function RecentDonationsTable({
  recentDonations,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  recentDonations: any[];
}) {
  const searchParams = useSearchParams();
  const searchBarQuery = searchParams.get('search')?.toLowerCase() || '';

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const filteredData = recentDonations.filter((d: any) => {
    if (!searchBarQuery) return true;
    const name = d.user?.name || '';
    const email = d.user?.email || '';
    const reportTitle = d.report?.title || '';
    const method = d.paymentMethod || '';
    return (
      name.toLowerCase().includes(searchBarQuery) ||
      email.toLowerCase().includes(searchBarQuery) ||
      reportTitle.toLowerCase().includes(searchBarQuery) ||
      method.toLowerCase().includes(searchBarQuery)
    );
  });

  return (
    <Table
      className="rounded-t-none border-t-0 shadow-none"
      data={filteredData}
      keyExtractor={(d) => d.id}
      emptyMessage="No donations yet."
      columns={[
        {
          header: 'Donor',
          cell: (d) => (
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
          ),
        },
        {
          header: 'For',
          cell: (d) =>
            d.donationType === 'PLATFORM' ? (
              <span className="text-[10px] font-black text-[#193C1F] bg-[#193C1F]/5 px-2 py-1 rounded-lg border border-[#193C1F]/10">
                PLATFORM
              </span>
            ) : (
              <span className="text-[#193C1F] line-clamp-1 max-w-[150px] font-medium">
                {d.report?.title || '—'}
              </span>
            ),
        },
        {
          header: 'Method',
          className: 'text-[#8EA087] font-medium italic text-[11px]',
          cell: (d) => fmtMethod(d.paymentMethod),
        },
        {
          header: 'Date',
          className: 'text-[#8EA087] text-[11px]',
          cell: (d) => fmtDate(d.timestamp),
        },
        {
          header: 'Amount',
          headerClassName: 'text-right',
          className: 'text-right font-black text-[#193C1F]',
          cell: (d) => fmt(Number(d.amount)),
        },
      ]}
    />
  );
}
