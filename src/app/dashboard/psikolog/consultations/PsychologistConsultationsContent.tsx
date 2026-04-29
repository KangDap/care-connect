'use client';

import { Pagination } from '@/components/pagination';
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
  const [hoveredRowId, setHoveredRowId] = useState<number | null>(null);
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
      return (priority[statusA] ?? 99) - (priority[statusB] ?? 99);
    });
  }, [consultations, query]);

  const totalPages = Math.ceil(processedData.length / itemsPerPage);
  const currentItems = useMemo(() => {
    const firstIndex = (currentPage - 1) * itemsPerPage;
    return processedData.slice(firstIndex, firstIndex + itemsPerPage);
  }, [processedData, currentPage]);

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h2 className="text-[32px] font-black text-[#193C1F]">
          Patient Consultations
        </h2>
        <p className="text-[#8EA087] font-medium">
          {query
            ? `Showing results for "${query}"`
            : 'Manage your upcoming and history of patient sessions.'}
        </p>
      </div>

      <div className="bg-white border border-[#D0D5CB] rounded-[32px] overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead className="bg-[#F7F3ED] text-[11px] text-[#8EA087] font-black uppercase tracking-widest">
            <tr>
              <th className="px-8 py-5">Patient & Case</th>
              <th className="px-8 py-5">Date & Time</th>
              <th className="px-8 py-5">Status</th>
              <th className="px-8 py-5 text-right">Action</th>
            </tr>
          </thead>
          {currentItems.length > 0 ? (
            currentItems.map((row) => {
              const statusStr = String(row.status);
              const isCompleted = statusStr === 'COMPLETED';

              return (
                <tbody
                  key={row.id}
                  onMouseEnter={() => setHoveredRowId(row.id)}
                  onMouseLeave={() => setHoveredRowId(null)}
                  className="group border-b border-[#F7F3ED] last:border-0"
                >
                  <tr
                    className={`transition-colors cursor-default ${hoveredRowId === row.id ? 'bg-[#FDFCFB]' : ''}`}
                  >
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2">
                        <p className="font-bold">
                          {row.isAnonymous
                            ? 'Anonymous Patient'
                            : row.user?.name || 'User'}
                        </p>
                        {row.isAnonymous && (
                          <span className="px-2 py-0.5 bg-[#EBE6DE] text-[#193C1F]/60 text-[10px] font-bold rounded-md uppercase">
                            Anon
                          </span>
                        )}
                      </div>
                      <p className="text-[12px] opacity-60 font-medium">
                        {row.title}
                      </p>
                    </td>
                    <td className="px-8 py-6 font-bold text-[#193C1F]">
                      {formatDateTimeLabel(row.date, row.time)}
                    </td>
                    <td className="px-8 py-6">
                      <span
                        className={`px-4 py-1.5 rounded-full text-[10px] font-black ${
                          isCompleted
                            ? 'bg-[#EBE6DE] text-[#193C1F]/40'
                            : 'bg-[#D1B698]/20 text-[#D1B698]'
                        }`}
                      >
                        {statusStr}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex justify-end items-center gap-3">
                        {isCompleted ? (
                          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-[#EBE6DE] text-[#8EA087] border border-[#D0D5CB] cursor-not-allowed opacity-50">
                            <ChatIcon />
                          </div>
                        ) : (
                          <Link
                            href={`/consultation-chat/${row.id}`}
                            className={`flex items-center justify-center w-10 h-10 rounded-xl transition-all shadow-sm border ${
                              statusStr === 'ONGOING'
                                ? 'bg-[#193C1F] text-white border-[#193C1F] hover:bg-[#122d17]'
                                : 'bg-white text-[#8EA087] border-[#D0D5CB] hover:bg-[#F7F3ED] hover:text-[#193C1F]'
                            }`}
                          >
                            <ChatIcon />
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>

                  {/* ACCORDION DETAIL */}
                  <tr>
                    <td colSpan={4} className="p-0">
                      <div
                        className={`overflow-hidden transition-all duration-500 bg-[#FDFCFB] ${hoveredRowId === row.id ? 'max-h-[800px]' : 'max-h-0'}`}
                      >
                        <div className="px-8 pb-8 pt-2">
                          <div className="p-7 bg-white border border-[#D0D5CB]/40 rounded-[24px] shadow-sm">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                              <div className="space-y-6">
                                <h4 className="text-[11px] font-black uppercase tracking-wider text-[#8EA087] mb-4">
                                  Case Summary
                                </h4>
                                <div className="grid grid-cols-2 gap-6">
                                  <div className="space-y-1">
                                    <p className="text-[10px] text-[#8EA087] font-bold uppercase">
                                      Patient Name
                                    </p>
                                    <p className="text-[14px] font-bold text-[#193C1F]">
                                      {row.isAnonymous
                                        ? 'Anonymous Patient'
                                        : row.user?.name || 'Anonymous'}
                                    </p>
                                  </div>
                                  <div className="space-y-1">
                                    <p className="text-[10px] text-[#8EA087] font-bold uppercase">
                                      Category
                                    </p>
                                    <p className="text-[14px] font-bold text-[#193C1F]">
                                      {row.category}
                                    </p>
                                  </div>
                                  <div className="space-y-1">
                                    <p className="text-[10px] text-[#8EA087] font-bold uppercase">
                                      Identity
                                    </p>
                                    <p className="text-[14px] font-bold text-[#193C1F]">
                                      {row.isAnonymous ? 'Anonymous' : 'Public'}
                                    </p>
                                  </div>
                                </div>
                              </div>

                              <div className="flex flex-col border-l border-[#F7F3ED] pl-10">
                                <h4 className="text-[11px] font-black uppercase tracking-wider text-[#8EA087] mb-4">
                                  Description & Documents
                                </h4>
                                <div className="bg-[#F7F3ED]/30 p-5 rounded-2xl border border-[#F7F3ED] max-h-[200px] overflow-y-auto font-medium mb-4">
                                  <p className="text-[13px] leading-relaxed text-[#193C1F]/80 italic">
                                    &quot;
                                    {row.description ||
                                      'No description provided.'}
                                    &quot;
                                  </p>
                                </div>
                                {row.attachmentUrl && (
                                  <div className="flex items-center justify-between p-3 bg-[#F7F3ED] rounded-xl border border-[#D0D5CB]/30">
                                    <span className="text-[12px] font-bold text-[#193C1F]">
                                      Attached Document
                                    </span>
                                    <Link
                                      href={row.attachmentUrl}
                                      target="_blank"
                                      className="text-[10px] font-black text-[#8EA087] uppercase hover:text-[#193C1F]"
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
              );
            })
          ) : (
            <tbody>
              <tr>
                <td
                  colSpan={4}
                  className="p-20 text-center text-[#8EA087] font-bold"
                >
                  No consultations found.
                </td>
              </tr>
            </tbody>
          )}
        </table>
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={(page) => {
          setCurrentPage(page);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />
    </div>
  );
}
