'use client';

import { Badge } from '@/components/badge';
import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { Pagination } from '@/components/pagination';
import { MessageSquare } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import React, { useEffect, useMemo, useState } from 'react';

type ConsultationItem = {
  id: number;
  title: string;
  category: string;
  description: string;
  date: Date;
  time: Date;
  status: string;
  isAnonymous: boolean;
  attachmentUrl: string | null;
  psychologist: { name: string | null } | null;
};

type ConsultationsContentProps = {
  consultations: ConsultationItem[];
};

const ChatIcon = () => <MessageSquare size={18} strokeWidth={2.5} />;

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

const getStatusBadgeClass = (status: string) => {
  switch (status) {
    case 'SCHEDULED':
      return 'bg-[#d1b698]/20 text-[#d1b698]';
    case 'ONGOING':
      return 'bg-blue-100 text-blue-700';
    case 'COMPLETED':
      return 'bg-green-100 text-green-700';
    case 'CANCELLED':
      return 'bg-red-100 text-red-600';
    default:
      return 'bg-[#EBE6DE] text-[#193c1f]';
  }
};

export default function ConsultationsContent({
  consultations,
}: ConsultationsContentProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const query = searchParams.get('search')?.toLowerCase() || '';
  const [hoveredRowId, setHoveredRowId] = useState<number | null>(null);
  const [expandedRowId, setExpandedRowId] = useState<number | null>(null);

  // --- LOGIKA PAGINATION ---
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Memfilter data berdasarkan query pencarian
  const filteredData = useMemo(() => {
    const filtered = consultations.filter(
      (item) =>
        (item.psychologist?.name ?? '').toLowerCase().includes(query) ||
        item.title.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query) ||
        item.status.toLowerCase().includes(query),
    );

    return [...filtered].sort((a, b) => {
      const priority: Record<string, number> = {
        ONGOING: 0,
        SCHEDULED: 1,
        COMPLETED: 2,
        CANCELLED: 3,
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

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCurrentPage(1);
  }, [query]);

  // Menghitung total halaman dan memotong data untuk halaman aktif
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const currentItems = useMemo(() => {
    const lastIndex = currentPage * itemsPerPage;
    const firstIndex = lastIndex - itemsPerPage;
    return filteredData.slice(firstIndex, lastIndex);
  }, [filteredData, currentPage]);

  return (
    <div className="space-y-6 md:space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl md:text-[32px] font-black text-[#193c1f]">
            My Consultations
          </h2>
          <p className="text-[#8ea087] font-medium italic text-sm md:text-base">
            {query
              ? `Showing results for "${query}"`
              : 'View and manage your consultation history.'}
          </p>
        </div>
        <Button
          onClick={() => router.push('/consultation?from=dashboard')}
          variant="secondary"
          className="whitespace-nowrap shadow-lg shrink-0"
        >
          + New Consultation
        </Button>
      </div>

      <Card className="overflow-hidden rounded-2xl md:rounded-[32px] p-0">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse min-w-\[480px\]">
            <thead className="bg-[#f7f3ed] text-[11px] text-[#8ea087] font-black uppercase tracking-widest">
              <tr>
                <th className="px-2 sm:px-4 py-2">Doctor & Specialist</th>
                <th className="px-2 sm:px-4 py-2">Date & Time</th>
                <th className="px-2 sm:px-4 py-2">Status</th>
                <th className="px-2 sm:px-4 py-2 text-right">Action</th>
              </tr>
            </thead>
            {currentItems.length > 0 ? (
              currentItems.map((row) => (
                <tbody
                  key={row.id}
                  onMouseEnter={() => setHoveredRowId(row.id)}
                  onMouseLeave={() => setHoveredRowId(null)}
                  onClick={() =>
                    setExpandedRowId((p) => (p === row.id ? null : row.id))
                  }
                  className="group border-b border-[#f7f3ed] last:border-0 cursor-pointer"
                >
                  <tr
                    className={`transition-colors ${
                      hoveredRowId === row.id || expandedRowId === row.id
                        ? 'bg-[#FDFCFB]'
                        : 'hover:bg-[#FDFCFB]'
                    }`}
                  >
                    <td className="px-2 sm:px-4 py-2">
                      <div className="flex items-center gap-2">
                        <p className="font-bold">
                          {row.psychologist?.name ??
                            'Waiting for psychologist...'}
                        </p>
                        {row.isAnonymous && (
                          <Badge className="rounded-md px-2 py-0.5 text-[#193c1f]/60">
                            Anonymous
                          </Badge>
                        )}
                      </div>
                      <p className="text-[12px] opacity-60 font-medium">
                        {row.title} • {row.category}
                      </p>
                    </td>
                    <td className="px-2 sm:px-4 py-2 font-bold text-[#193c1f] text-sm">
                      {formatDateTimeLabel(row.date, row.time)}
                    </td>
                    <td className="px-2 sm:px-4 py-2">
                      <Badge className={getStatusBadgeClass(row.status)}>
                        {row.status}
                      </Badge>
                    </td>
                    <td className="px-2 sm:px-4 py-2 text-right">
                      <div className="flex justify-end items-center gap-3">
                        <Link
                          href={`/consultation-chat/${row.id}`}
                          title={
                            row.status === 'ONGOING'
                              ? 'Join Chat'
                              : 'Chat History'
                          }
                          className={`flex items-center justify-center w-10 h-10 rounded-xl transition-all shadow-sm border ${
                            row.status === 'ONGOING'
                              ? 'bg-[#193c1f] text-white border-[#193c1f] hover:bg-[#122d17]'
                              : 'bg-white text-[#8ea087] border-[#d0d5cb] hover:bg-[#f7f3ed] hover:text-[#193c1f]'
                          }`}
                        >
                          <ChatIcon />
                        </Link>
                      </div>
                    </td>
                  </tr>

                  {/* Detail Dropdown Row (Accordion) */}
                  <tr>
                    <td colSpan={4} className="p-0">
                      <div
                        className={`overflow-hidden transition-all duration-500 ease-in-out bg-[#FDFCFB] ${
                          hoveredRowId === row.id ? 'max-h-[800px]' : 'max-h-0'
                        }`}
                      >
                        <div className="px-4 sm:px-6 pb-5 pt-1">
                          <div className="p-4 sm:p-5 bg-white border border-[#d0d5cb]/40 rounded-[18px] shadow-sm">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                              <div className="space-y-6">
                                <div>
                                  <h4 className="text-[11px] font-black uppercase tracking-wider text-[#8ea087] mb-4">
                                    Consultation Summary
                                  </h4>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <div className="space-y-1">
                                      <p className="text-[10px] text-[#8ea087] font-bold uppercase tracking-tight">
                                        Title
                                      </p>
                                      <p className="text-[14px] font-bold text-[#193c1f]">
                                        {row.title}
                                      </p>
                                    </div>
                                    <div className="space-y-1">
                                      <p className="text-[10px] text-[#8ea087] font-bold uppercase tracking-tight">
                                        Category
                                      </p>
                                      <p className="text-[14px] font-bold text-[#193c1f]">
                                        {row.category}
                                      </p>
                                    </div>
                                    <div className="space-y-1">
                                      <p className="text-[10px] text-[#8ea087] font-bold uppercase tracking-tight">
                                        Assigned Psychologist
                                      </p>
                                      <p className="text-[14px] font-bold text-[#193c1f]">
                                        {row.psychologist?.name ??
                                          'Processing...'}
                                      </p>
                                    </div>
                                    <div className="space-y-1">
                                      <p className="text-[10px] text-[#8ea087] font-bold uppercase tracking-tight">
                                        Identity
                                      </p>
                                      <p className="text-[14px] font-bold text-[#193c1f]">
                                        {row.isAnonymous
                                          ? 'Anonymous'
                                          : 'Public'}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              <div className="flex flex-col border-l border-[#f7f3ed] pl-10">
                                <h4 className="text-[11px] font-black uppercase tracking-wider text-[#8ea087] mb-4">
                                  Description & Documents
                                </h4>
                                <div className="bg-[#f7f3ed]/30 p-5 rounded-2xl border border-[#f7f3ed] max-h-[200px] overflow-y-auto custom-scrollbar font-medium">
                                  <p className="text-[13px] leading-relaxed text-[#193c1f]/80 whitespace-pre-wrap italic">
                                    &quot;
                                    {row.description ||
                                      'No description provided.'}
                                    &quot;
                                  </p>
                                </div>
                                {row.attachmentUrl && (
                                  <div className="mt-6 flex items-center justify-between p-3 bg-[#f7f3ed] rounded-xl border border-[#d0d5cb]/30">
                                    <span className="text-[12px] font-bold text-[#193c1f] truncate max-w-[150px]">
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
                        </div>
                      </div>
                    </td>
                  </tr>
                </tbody>
              ))
            ) : (
              <tbody className="text-[14px] text-[#193c1f]">
                <tr>
                  <td
                    colSpan={4}
                    className="p-20 text-center text-[#8ea087] font-bold"
                  >
                    No consultations found.
                  </td>
                </tr>
              </tbody>
            )}
          </table>
        </div>
      </Card>

      {/* Komponen Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={(page: number) => {
          setCurrentPage(page);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />
    </div>
  );
}
