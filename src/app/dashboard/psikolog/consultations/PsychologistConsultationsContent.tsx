'use client';

import { Badge } from '@/components/badge';
import { Table } from '@/components/table';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import React, { useEffect, useMemo, useState } from 'react';

// --- TYPES ---
type ConsultationItem = {
  id: number;
  title: string;
  category: string;
  description: string;
  date: Date;
  time: Date;
  status: string | unknown;
  isAnonymous: boolean;
  attachmentUrl: string | null;
  user: { name: string | null } | null;
};

// --- ICONS ---
const ChatIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

// --- UTILS ---
const formatDateTimeLabel = (dateValue: Date, timeValue: Date) => {
  const dateLabel = new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(dateValue));
  const timeLabel = new Intl.DateTimeFormat('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(timeValue));
  return `${dateLabel} • ${timeLabel}`;
};

export default function PsychologistConsultationsContent({
  consultations = [],
}: {
  consultations: ConsultationItem[];
}) {
  const searchParams = useSearchParams();
  const query = searchParams.get('search')?.toLowerCase() || '';
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // FIX LINT: Reset page saat search query berubah
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCurrentPage(1);
  }, [query]);

  const processedData = useMemo(() => {
    const filtered = consultations.filter(
      (item) =>
        (item.user?.name ?? '').toLowerCase().includes(query) ||
        item.title.toLowerCase().includes(query),
    );

    return [...filtered].sort((a, b) => {
      const priority: Record<string, number> = {
        ONGOING: 0,
        SCHEDULED: 1,
        COMPLETED: 2,
      };
      const statusA = String(a.status);
      const statusB = String(b.status);
      const priorityDiff =
        (priority[statusA] ?? 99) - (priority[statusB] ?? 99);

      if (priorityDiff !== 0) return priorityDiff;

      // If priority is same, sort by date and time (newest first)
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      const timeA = new Date(a.time);
      const timeB = new Date(b.time);

      const combinedA = new Date(
        dateA.getUTCFullYear(),
        dateA.getUTCMonth(),
        dateA.getUTCDate(),
        timeA.getUTCHours(),
        timeA.getUTCMinutes(),
      ).getTime();

      const combinedB = new Date(
        dateB.getUTCFullYear(),
        dateB.getUTCMonth(),
        dateB.getUTCDate(),
        timeB.getUTCHours(),
        timeB.getUTCMinutes(),
      ).getTime();

      return combinedB - combinedA;
    });
  }, [consultations, query]);

  const totalPages = Math.ceil(processedData.length / itemsPerPage);
  const currentItems = useMemo(() => {
    const firstIndex = (currentPage - 1) * itemsPerPage;
    return processedData.slice(firstIndex, firstIndex + itemsPerPage);
  }, [processedData, currentPage]);

  return (
    <div className="space-y-6 md:space-y-8 animate-fade-in">
      <div>
        <h2 className="text-2xl sm:text-3xl md:text-[32px] font-black text-[#193c1f]">
          Patient Consultations
        </h2>
        <p className="text-[#8ea087] font-medium text-sm md:text-base">
          {query
            ? `Showing results for "${query}"`
            : 'Manage your upcoming and history of patient sessions.'}
        </p>
      </div>
      <Table
        data={currentItems}
        keyExtractor={(row) => row.id}
        emptyMessage="No consultations found."
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={(page: number) => {
          setCurrentPage(page);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        renderExpandedRow={(row) => (
          <div className="p-4 sm:p-5 bg-white border border-[#d0d5cb]/40 rounded-[18px] shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-6">
                <h4 className="text-[11px] font-black uppercase tracking-wider text-[#8ea087] mb-4">
                  Case Summary
                </h4>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <p className="text-[10px] text-[#8ea087] font-bold uppercase">
                      Patient Name
                    </p>
                    <p className="text-[14px] font-bold text-[#193c1f]">
                      {row.isAnonymous
                        ? 'Anonymous Patient'
                        : row.user?.name || 'Anonymous'}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] text-[#8ea087] font-bold uppercase">
                      Category
                    </p>
                    <p className="text-[14px] font-bold text-[#193c1f]">
                      {row.category}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] text-[#8ea087] font-bold uppercase">
                      Identity
                    </p>
                    <p className="text-[14px] font-bold text-[#193c1f]">
                      {row.isAnonymous ? 'Anonymous' : 'Public'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col border-l border-[#f7f3ed] pl-10">
                <h4 className="text-[11px] font-black uppercase tracking-wider text-[#8ea087] mb-4">
                  Description & Documents
                </h4>
                <div className="bg-[#f7f3ed]/30 p-5 rounded-2xl border border-[#f7f3ed] max-h-[200px] overflow-y-auto font-medium mb-4">
                  <p className="text-[13px] leading-relaxed text-[#193c1f]/80 italic">
                    &quot;{row.description || 'No description provided.'}&quot;
                  </p>
                </div>
                {row.attachmentUrl && (
                  <div className="flex items-center justify-between p-3 bg-[#f7f3ed] rounded-xl border border-[#d0d5cb]/30">
                    <span className="text-[12px] font-bold text-[#193c1f]">
                      Attached Document
                    </span>
                    <Link
                      href={row.attachmentUrl}
                      target="_blank"
                      className="text-[10px] font-black text-[#8ea087] uppercase hover:text-[#193c1f]"
                    >
                      View
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        columns={[
          {
            header: 'Patient & Case',
            cell: (row) => (
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-bold text-sm">
                    {row.isAnonymous
                      ? 'Anonymous Patient'
                      : row.user?.name || 'User'}
                  </p>
                  {row.isAnonymous && (
                    <Badge className="bg-[#EBE6DE] text-[#193c1f]/60 hover:bg-[#EBE6DE] border-0">
                      Anon
                    </Badge>
                  )}
                </div>
                <p className="text-[12px] opacity-60 font-medium">
                  {row.title}
                </p>
              </div>
            ),
          },
          {
            header: 'Date & Time',
            cell: (row) => (
              <p className="font-bold text-[#193c1f] text-sm">
                {formatDateTimeLabel(row.date, row.time)}
              </p>
            ),
          },
          {
            header: 'Status',
            cell: (row) => {
              const statusStr = String(row.status);
              const isCompleted = statusStr === 'COMPLETED';
              return (
                <Badge
                  className={
                    isCompleted
                      ? 'bg-[#EBE6DE] text-[#193c1f]/40 hover:bg-[#EBE6DE] border-0'
                      : 'bg-[#d1b698]/20 text-[#d1b698] hover:bg-[#d1b698]/20 border-0'
                  }
                >
                  {statusStr}
                </Badge>
              );
            },
          },
          {
            header: 'Action',
            headerClassName: 'text-right',
            className: 'text-right',
            cell: (row) => {
              const statusStr = String(row.status);
              const isCompleted = statusStr === 'COMPLETED';
              return (
                <div className="flex justify-end items-center gap-3">
                  {isCompleted ? (
                    <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-[#EBE6DE] text-[#8ea087] border border-[#d0d5cb] cursor-not-allowed opacity-50">
                      <ChatIcon />
                    </div>
                  ) : (
                    <Link
                      href={`/consultation-chat/${row.id}`}
                      onClick={(e) => e.stopPropagation()}
                      className={`flex items-center justify-center w-10 h-10 rounded-xl transition-all shadow-sm border ${
                        statusStr === 'ONGOING'
                          ? 'bg-[#193c1f] text-white border-[#193c1f] hover:bg-[#122d17]'
                          : 'bg-white text-[#8ea087] border-[#d0d5cb] hover:bg-[#f7f3ed] hover:text-[#193c1f]'
                      }`}
                    >
                      <ChatIcon />
                    </Link>
                  )}
                </div>
              );
            },
          },
        ]}
      />
    </div>
  );
}
