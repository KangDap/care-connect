'use client';

import { Pagination } from '@/components/pagination';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

type ReportItem = {
  id: number;
  title: string;
  category: string;
  description: string;
  province: string;
  city: string;
  district: string;
  incidentDate: string;
  status: string;
  isAnonymous: boolean;
  createdAt: string;
  evidences: {
    id: number;
    fileName: string;
    fileUrl: string;
  }[];
};

type ReportsContentProps = {
  reports: ReportItem[];
};

const formatDateLabel = (value: string) =>
  new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));

const getStatusLabel = (value: string) =>
  value
    .toLowerCase()
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

const getStatusBadgeClass = (status: string) => {
  switch (status) {
    case 'PENDING':
      return 'bg-[#d1b698]/30 text-[#d1b698]';
    case 'REVIEWED':
      return 'bg-blue-100 text-blue-700';
    case 'RESOLVED':
      return 'bg-green-100 text-green-700';
    case 'REJECTED':
      return 'bg-red-100 text-red-600';
    default:
      return 'bg-[#EBE6DE] text-[#193c1f]';
  }
};

const FileIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M13 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V9L13 2Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M13 2V9H20"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export default function ReportsContent({ reports }: ReportsContentProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const query = searchParams.get('search')?.toLowerCase() || '';
  const [hoveredRowId, setHoveredRowId] = useState<number | null>(null);

  // --- LOGIKA PAGINATION ---
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Filter data berdasarkan query search
  const filteredData = useMemo(() => {
    return reports.filter(
      (item) =>
        String(item.id).toLowerCase().includes(query) ||
        item.title.toLowerCase().includes(query) ||
        item.status.toLowerCase().includes(query),
    );
  }, [reports, query]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCurrentPage(1);
  }, [query]);

  // Hitung data yang tampil di halaman saat ini
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const currentItems = useMemo(() => {
    const lastIndex = currentPage * itemsPerPage;
    const firstIndex = lastIndex - itemsPerPage;
    return filteredData.slice(firstIndex, lastIndex);
  }, [filteredData, currentPage]);

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-[32px] font-black text-[#193c1f]">My Reports</h2>
          <p className="text-[#8ea087] font-medium">
            {query
              ? `Showing results for "${query}"`
              : 'Track the status of your submitted reports.'}
          </p>
        </div>
        <button
          onClick={() => router.push('/report?from=dashboard')}
          className="px-7 py-3.5 bg-[#8ea087] hover:bg-[#193c1f] text-white rounded-2xl font-bold text-[14px] transition-all shadow-lg whitespace-nowrap"
        >
          + New Report
        </button>
      </div>

      <div className="bg-white border border-[#d0d5cb] rounded-[32px] overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead className="bg-[#f7f3ed] text-[11px] text-[#8ea087] font-black uppercase tracking-widest">
            <tr>
              <th className="px-8 py-5">Report ID</th>
              <th className="px-8 py-5">Type</th>
              <th className="px-8 py-5">Date</th>
              <th className="px-8 py-5">Status</th>
            </tr>
          </thead>
          {currentItems.length > 0 ? (
            currentItems.map((row) => (
              <tbody
                key={row.id}
                onMouseEnter={() => setHoveredRowId(row.id)}
                onMouseLeave={() => setHoveredRowId(null)}
                className="group border-b border-[#f7f3ed] last:border-0"
              >
                <tr
                  className={`transition-colors cursor-default ${
                    hoveredRowId === row.id ? 'bg-[#FDFCFB]' : ''
                  }`}
                >
                  <td className="px-8 py-6 font-bold text-[#193c1f]">
                    #REP-{String(row.id).padStart(4, '0')}
                  </td>
                  <td className="px-8 py-6 font-medium text-[#193c1f]/80">
                    {row.title}
                  </td>
                  <td className="px-8 py-6 text-[#193c1f]/60">
                    {formatDateLabel(row.createdAt)}
                  </td>
                  <td className="px-8 py-6">
                    <span
                      className={`px-4 py-1.5 rounded-full text-[10px] font-black ${getStatusBadgeClass(row.status)}`}
                    >
                      {getStatusLabel(row.status)}
                    </span>
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
                        <div className="p-7 bg-white border border-[#d0d5cb]/40 rounded-[24px] shadow-sm">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                            {/* Left Side: Summary Fields */}
                            <div className="space-y-6">
                              <div>
                                <h4 className="text-[11px] font-black uppercase tracking-wider text-[#8ea087] mb-4">
                                  Report Details (Form Summary)
                                </h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
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
                                      Incident Date
                                    </p>
                                    <p className="text-[14px] font-bold text-[#193c1f]">
                                      {formatDateLabel(row.incidentDate)}
                                    </p>
                                  </div>
                                  <div className="space-y-1">
                                    <p className="text-[10px] text-[#8ea087] font-bold uppercase tracking-tight">
                                      Location
                                    </p>
                                    <p className="text-[14px] font-bold text-[#193c1f]">
                                      {row.district}, {row.city}, {row.province}
                                    </p>
                                  </div>
                                  <div className="space-y-1">
                                    <p className="text-[10px] text-[#8ea087] font-bold uppercase tracking-tight">
                                      Anonymity
                                    </p>
                                    <p className="text-[14px] font-bold text-[#193c1f]">
                                      {row.isAnonymous ? 'Anonymous' : 'Public'}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>
                            {/* Right Side: Description & Evidences */}
                            <div className="flex flex-col border-l border-[#f7f3ed] pl-10">
                              <h4 className="text-[11px] font-black uppercase tracking-wider text-[#8ea087] mb-4">
                                Description & Evidences
                              </h4>
                              <div className="bg-[#f7f3ed]/30 p-5 rounded-2xl border border-[#f7f3ed] max-h-[200px] overflow-y-auto custom-scrollbar">
                                <p className="text-[14px] leading-relaxed text-[#193c1f]/80 whitespace-pre-wrap">
                                  {row.description ||
                                    'No description provided.'}
                                </p>
                              </div>
                              {row.evidences.length > 0 && (
                                <div className="mt-6 space-y-3">
                                  <p className="text-[10px] text-[#8ea087] font-bold uppercase tracking-tight">
                                    Attached Evidences ({row.evidences.length})
                                  </p>
                                  <div className="grid grid-cols-1 gap-2">
                                    {row.evidences.map((file) => (
                                      <Link
                                        key={file.id}
                                        href={file.fileUrl}
                                        target="_blank"
                                        className="flex items-center justify-between p-3 bg-[#f7f3ed] rounded-xl border border-[#d0d5cb]/30 hover:bg-[#EBE6DE] transition-colors group/file"
                                      >
                                        <div className="flex items-center gap-3">
                                          <div className="text-[#8ea087] group-hover/file:text-[#193c1f]">
                                            <FileIcon />
                                          </div>
                                          <span className="text-[12px] font-bold text-[#193c1f] truncate max-w-[150px]">
                                            {file.fileName}
                                          </span>
                                        </div>
                                        <span className="text-[10px] font-black text-[#8ea087] uppercase tracking-widest">
                                          View
                                        </span>
                                      </Link>
                                    ))}
                                  </div>
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
                  No reports found.
                </td>
              </tr>
            </tbody>
          )}
        </table>
      </div>

      {/* RENDER KOMPONEN PAGINATION DI SINI */}
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
