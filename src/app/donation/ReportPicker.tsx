'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';

type ReportOption = {
  id: number;
  title: string;
  category: string;
  city: string;
  province: string;
  description: string;
  coverImageUrl?: string | null;
};

type Props = {
  onSelect: (report: ReportOption) => void;
  onBack: () => void;
};

export function ReportPicker({ onSelect, onBack }: Props) {
  const [reports, setReports] = useState<ReportOption[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  useEffect(() => {
    fetch('/api/publicreports')
      .then((r) => r.json())
      .then((d) => setReports(d.data || []))
      .catch(() => setReports([]))
      .finally(() => setLoading(false));
  }, []);

  // Page is reset inside the search onChange handler

  const filtered = reports.filter(
    (r) =>
      r.title.toLowerCase().includes(search.toLowerCase()) ||
      r.category.toLowerCase().includes(search.toLowerCase()) ||
      r.city.toLowerCase().includes(search.toLowerCase()),
  );

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginatedReports = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  return (
    <div className="space-y-8 pb-10">
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="flex items-center justify-center w-10 h-10 rounded-full bg-white border border-[#d0d5cb] text-[#8ea087] hover:border-[#193c1f] hover:text-[#193c1f] transition-all shrink-0"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>
        <div>
          <h2 className="text-3xl font-black text-[#193c1f] tracking-tight">
            Choose a Report to Support
          </h2>
          <p className="text-[#8ea087] mt-1 font-medium">
            Select the case you want to donate to and make an impact.
          </p>
        </div>
      </div>

      <div className="relative max-w-2xl">
        <svg
          className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#8ea087]"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <circle cx="11" cy="11" r="8" strokeWidth="2" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" strokeWidth="2" />
        </svg>
        <input
          type="text"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setCurrentPage(1);
          }}
          placeholder="Search by title, category, or city..."
          className="w-full pl-12 pr-4 py-4 rounded-2xl border border-[#d0d5cb] bg-white focus:ring-[#8ea087] focus:border-[#8ea087] outline-none text-[#193c1f] shadow-sm transition-all"
        />
      </div>

      {loading && (
        <div className="text-center py-20">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-[#193c1f]" />
          <p className="text-[#8ea087] mt-4 font-bold tracking-widest uppercase text-xs">
            Loading reports...
          </p>
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="text-center py-20 bg-white rounded-3xl border border-[#d0d5cb] border-dashed">
          <div className="w-16 h-16 bg-[#f7f3ed] rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-[#8ea087]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.5"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <h3 className="text-[#193c1f] font-bold text-lg">No reports found</h3>
          <p className="text-[#8ea087] mt-1 text-sm">
            Try adjusting your search keywords.
          </p>
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedReports.map((report) => (
              <div
                key={report.id}
                className="bg-white border border-[#d0d5cb] rounded-3xl overflow-hidden hover:border-[#193c1f] hover:shadow-xl transition-all duration-300 cursor-pointer group flex flex-col h-full"
                onClick={() => onSelect(report)}
              >
                {/* Image Section */}
                <div className="relative h-48 w-full bg-[#f7f3ed] overflow-hidden shrink-0">
                  {report.coverImageUrl ? (
                    <Image
                      src={report.coverImageUrl}
                      alt={report.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      unoptimized
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[#8ea087]/50 group-hover:scale-105 transition-transform duration-500">
                      <svg
                        className="w-16 h-16"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="1.5"
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                  )}
                  <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-sm">
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#193c1f]">
                      {report.category}
                    </span>
                  </div>
                </div>

                {/* Content Section */}
                <div className="p-6 flex flex-col flex-grow">
                  <div className="flex items-center gap-2 mb-3 text-[10px] font-bold text-[#8ea087] tracking-widest uppercase">
                    <span>#{String(report.id).padStart(4, '0')}</span>
                    <span>•</span>
                    <span className="truncate">
                      {report.city}, {report.province}
                    </span>
                  </div>

                  <h3 className="font-black text-[#193c1f] text-xl mb-3 line-clamp-2 group-hover:text-[#8ea087] transition-colors leading-tight">
                    {report.title}
                  </h3>

                  <p className="text-sm text-[#193c1f]/60 line-clamp-3 mb-6 flex-grow leading-relaxed font-medium">
                    {report.description}
                  </p>

                  <button className="w-full py-3.5 mt-auto bg-[#f7f3ed] text-[#193c1f] text-sm font-bold rounded-xl group-hover:bg-[#193c1f] group-hover:text-white transition-all flex items-center justify-center gap-2 border border-transparent group-hover:border-[#193c1f]">
                    Donate Now
                    <svg
                      className="w-4 h-4 transform group-hover:translate-x-1 transition-transform"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M14 5l7 7m0 0l-7 7m7-7H3"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-4 pt-10">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="w-12 h-12 rounded-full bg-white border border-[#d0d5cb] flex items-center justify-center text-[#193c1f] hover:border-[#193c1f] hover:bg-[#f7f3ed] disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-[#d0d5cb] transition-all"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>

              <div className="flex items-center gap-2">
                {Array.from({ length: totalPages }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`w-10 h-10 rounded-full text-sm font-black transition-all ${
                      currentPage === i + 1
                        ? 'bg-[#193c1f] text-white shadow-md'
                        : 'bg-white text-[#193c1f] border border-[#d0d5cb] hover:border-[#193c1f] hover:bg-[#f7f3ed]'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>

              <button
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage === totalPages}
                className="w-12 h-12 rounded-full bg-white border border-[#d0d5cb] flex items-center justify-center text-[#193c1f] hover:border-[#193c1f] hover:bg-[#f7f3ed] disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-[#d0d5cb] transition-all"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
