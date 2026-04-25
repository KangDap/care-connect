'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';

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

// Ikon Chat Kustom
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

const formatDateTimeLabel = (dateValue: Date, timeValue: Date) => {
  const dateLabel = new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(dateValue);

  const timeLabel = new Intl.DateTimeFormat('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(timeValue);

  return `${dateLabel} • ${timeLabel}`;
};

const getStatusBadgeClass = (status: string) => {
  switch (status) {
    case 'SCHEDULED':
      return 'bg-[#D1B698]/20 text-[#D1B698]';
    case 'ONGOING':
      return 'bg-blue-100 text-blue-700';
    case 'COMPLETED':
      return 'bg-green-100 text-green-700';
    case 'CANCELLED':
      return 'bg-red-100 text-red-600';
    default:
      return 'bg-[#EBE6DE] text-[#193C1F]';
  }
};

export default function ConsultationsContent({
  consultations,
}: ConsultationsContentProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const query = searchParams.get('search')?.toLowerCase() || '';
  const [hoveredRowId, setHoveredRowId] = useState<number | null>(null);

  const filteredData = consultations.filter(
    (item) =>
      (item.psychologist?.name ?? '').toLowerCase().includes(query) ||
      item.title.toLowerCase().includes(query) ||
      item.category.toLowerCase().includes(query) ||
      item.status.toLowerCase().includes(query),
  );

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-[32px] font-black text-[#193C1F]">
            My Consultations
          </h2>
          <p className="text-[#8EA087] font-medium">
            {query
              ? `Showing results for "${query}"`
              : 'View and manage your consultation history.'}
          </p>
        </div>
        <button
          onClick={() => router.push('/consultation')}
          className="px-7 py-3.5 bg-[#8EA087] hover:bg-[#193C1F] text-white rounded-2xl font-bold text-[14px] transition-all shadow-lg whitespace-nowrap"
        >
          + New Consultation
        </button>
      </div>

      <div className="bg-white border border-[#D0D5CB] rounded-[32px] overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-[#F7F3ED] text-[11px] text-[#8EA087] font-black uppercase tracking-widest">
            <tr>
              <th className="px-8 py-5">Doctor & Specialist</th>
              <th className="px-8 py-5">Date & Time</th>
              <th className="px-8 py-5">Status</th>
              <th className="px-8 py-5 text-right">Action</th>
            </tr>
          </thead>
          {filteredData.length > 0 ? (
            filteredData.map((row) => (
              <tbody
                key={row.id}
                onMouseEnter={() => setHoveredRowId(row.id)}
                onMouseLeave={() => setHoveredRowId(null)}
                className="group border-b border-[#F7F3ED] last:border-0"
              >
                <tr
                  className={`transition-colors cursor-default ${
                    hoveredRowId === row.id ? 'bg-[#FDFCFB]' : ''
                  }`}
                >
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2">
                      <p className="font-bold">
                        {row.psychologist?.name ??
                          'Waiting for psychologist...'}
                      </p>
                      {row.isAnonymous && (
                        <span className="px-2 py-0.5 bg-[#EBE6DE] text-[#193C1F]/60 text-[10px] font-bold rounded-md uppercase">
                          Anonymous
                        </span>
                      )}
                    </div>
                    <p className="text-[12px] opacity-60 font-medium">
                      {row.title} • {row.category}
                    </p>
                  </td>
                  <td className="px-8 py-6 font-bold">
                    {formatDateTimeLabel(row.date, row.time)}
                  </td>
                  <td className="px-8 py-6">
                    <span
                      className={`px-4 py-1.5 rounded-full text-[10px] font-black ${getStatusBadgeClass(row.status)}`}
                    >
                      {row.status}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex justify-end items-center gap-3">
                      <Link
                        href={`/consultation-chat`}
                        title={
                          row.status === 'ONGOING'
                            ? 'Join Chat'
                            : 'Chat History'
                        }
                        className={`flex items-center justify-center w-10 h-10 rounded-xl transition-all shadow-sm border ${
                          row.status === 'ONGOING'
                            ? 'bg-[#193C1F] text-white border-[#193C1F] hover:bg-[#122d17]'
                            : 'bg-white text-[#8EA087] border-[#D0D5CB] hover:bg-[#F7F3ED] hover:text-[#193C1F]'
                        }`}
                      >
                        <ChatIcon />
                      </Link>
                    </div>
                  </td>
                </tr>
                {/* Detail Dropdown Row */}
                <tr>
                  <td colSpan={4} className="p-0">
                    <div
                      className={`overflow-hidden transition-all duration-500 ease-in-out bg-[#FDFCFB] ${
                        hoveredRowId === row.id ? 'max-h-[800px]' : 'max-h-0'
                      }`}
                    >
                      <div className="px-8 pb-8 pt-2">
                        <div className="p-7 bg-white border border-[#D0D5CB]/40 rounded-[24px] shadow-sm">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                            {/* Left Side: Summary / Form Fields */}
                            <div className="space-y-6">
                              <div>
                                <h4 className="text-[11px] font-black uppercase tracking-wider text-[#8EA087] mb-4">
                                  Consultation Details (Form Summary)
                                </h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                  <div className="space-y-1">
                                    <p className="text-[10px] text-[#8EA087] font-bold uppercase tracking-tight">
                                      Inquiry Title
                                    </p>
                                    <p className="text-[14px] font-bold text-[#193C1F]">
                                      {row.title}
                                    </p>
                                  </div>
                                  <div className="space-y-1">
                                    <p className="text-[10px] text-[#8EA087] font-bold uppercase tracking-tight">
                                      Category
                                    </p>
                                    <p className="text-[14px] font-bold text-[#193C1F]">
                                      {row.category}
                                    </p>
                                  </div>
                                  <div className="space-y-1">
                                    <p className="text-[10px] text-[#8EA087] font-bold uppercase tracking-tight">
                                      Date
                                    </p>
                                    <p className="text-[14px] font-bold text-[#193C1F]">
                                      {new Intl.DateTimeFormat('id-ID', {
                                        day: '2-digit',
                                        month: 'long',
                                        year: 'numeric',
                                      }).format(new Date(row.date))}
                                    </p>
                                  </div>
                                  <div className="space-y-1">
                                    <p className="text-[10px] text-[#8EA087] font-bold uppercase tracking-tight">
                                      Time Slot
                                    </p>
                                    <p className="text-[14px] font-bold text-[#193C1F]">
                                      {new Intl.DateTimeFormat('id-ID', {
                                        hour: '2-digit',
                                        minute: '2-digit',
                                      }).format(new Date(row.time))}{' '}
                                      WIB
                                    </p>
                                  </div>
                                  <div className="space-y-1">
                                    <p className="text-[10px] text-[#8EA087] font-bold uppercase tracking-tight">
                                      Assigned Psychologist
                                    </p>
                                    <p className="text-[14px] font-bold text-[#193C1F]">
                                      {row.psychologist?.name ??
                                        'Not assigned yet'}
                                    </p>
                                  </div>
                                  <div className="space-y-1">
                                    <p className="text-[10px] text-[#8EA087] font-bold uppercase tracking-tight">
                                      Submission Type
                                    </p>
                                    <p className="text-[14px] font-bold text-[#193C1F]">
                                      {row.isAnonymous
                                        ? 'Anonymous'
                                        : 'Public/Named'}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Right Side: Description & Files */}
                            <div className="flex flex-col border-l border-[#F7F3ED] pl-10">
                              <h4 className="text-[11px] font-black uppercase tracking-wider text-[#8EA087] mb-4">
                                Description & Documents
                              </h4>
                              <div className="bg-[#F7F3ED]/30 p-5 rounded-2xl border border-[#F7F3ED]">
                                <p className="text-[14px] leading-relaxed text-[#193C1F]/80 whitespace-pre-wrap">
                                  {row.description ||
                                    'No description provided.'}
                                </p>
                              </div>

                              {row.attachmentUrl && (
                                <div className="mt-6 flex items-center justify-between p-4 bg-[#F7F3ED] rounded-xl border border-[#D0D5CB]/30">
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-[#8EA087]">
                                      <svg
                                        width="14"
                                        height="14"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2.5"
                                      >
                                        <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
                                        <polyline points="13 2 13 9 20 9" />
                                      </svg>
                                    </div>
                                    <p className="text-[12px] font-bold text-[#193C1F]">
                                      Attached Document
                                    </p>
                                  </div>
                                  <a
                                    href={row.attachmentUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-4 py-1.5 bg-[#193C1F] text-white text-[11px] font-black rounded-lg uppercase tracking-wider hover:bg-[#122d17] transition-colors"
                                  >
                                    View
                                  </a>
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
            <tbody className="text-[14px] text-[#193C1F]">
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
    </div>
  );
}
