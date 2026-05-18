'use client';

import { Table } from '@/components/table';
import { Toast } from '@/components/toast';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { ConsultationActions } from './ConsultationActions';

const STATUS_BADGE: Record<string, string> = {
  SCHEDULED: 'bg-blue-100 text-blue-700 border-blue-200',
  ONGOING: 'bg-amber-100 text-amber-700 border-amber-200',
  COMPLETED: 'bg-green-100 text-green-700 border-green-200',
  CANCELLED: 'bg-red-100 text-red-600 border-red-200',
};

type Consultation = {
  id: number;
  title: string;
  category: string;
  status: string;
  date: Date;
  isAnonymous: boolean;
  user: { name: string; email: string };
  psychologist: { name: string } | null;
  description?: string;
  attachmentUrl?: string | null;
};

type ConsultationsClientProps = {
  consultations: Consultation[];
  totalCount: number;
  absoluteTotalCount: number;
  activeCount: number;
  historyCount: number;
  statusCounts: Record<string, number>;
  tab: string;
  page: number;
  totalPages: number;
  perPage: number;
};

export function ConsultationsClient({
  consultations,
  totalCount,
  absoluteTotalCount,
  activeCount,
  historyCount,
  statusCounts,
  tab,
  page,
  totalPages,
  perPage,
}: ConsultationsClientProps) {
  const router = useRouter();
  const [toast, setToast] = useState<{
    show: boolean;
    msg: string;
    type: 'success' | 'error';
  }>({ show: false, msg: '', type: 'success' });

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ show: true, msg, type });
  };

  const fmtDate = (d: Date) =>
    new Intl.DateTimeFormat('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(new Date(d));

  return (
    <div className="space-y-6">
      <Toast
        show={toast.show}
        msg={toast.msg}
        type={toast.type}
        onClose={() => setToast((prev) => ({ ...prev, show: false }))}
      />

      <div>
        <h1 className="text-[32px] font-black text-[#193c1f]">
          All Consultations
        </h1>
        <p className="text-[#8ea087] font-medium">
          Manage and monitor all platform consultations.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: 'Scheduled',
            count: statusCounts['SCHEDULED'] || 0,
            cls: 'text-blue-700 bg-blue-50 border-blue-200',
          },
          {
            label: 'Ongoing',
            count: statusCounts['ONGOING'] || 0,
            cls: 'text-amber-700 bg-amber-50 border-amber-200',
          },
          {
            label: 'Completed',
            count: statusCounts['COMPLETED'] || 0,
            cls: 'text-green-700 bg-green-50 border-green-200',
          },
          {
            label: 'Cancelled',
            count: statusCounts['CANCELLED'] || 0,
            cls: 'text-red-700 bg-red-50 border-red-200',
          },
        ].map((item) => (
          <div key={item.label} className={`p-4 rounded-xl border ${item.cls}`}>
            <p className="text-xs font-bold uppercase tracking-wider opacity-70">
              {item.label}
            </p>
            <p className="text-3xl font-black mt-1">{item.count}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-3 flex-wrap">
        <Link
          href="/dashboard/admin/consultations?tab=all"
          className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all border ${
            tab === 'all'
              ? 'bg-[#193c1f] text-white border-[#193c1f]'
              : 'bg-white text-[#193c1f] border-[#d0d5cb] hover:border-[#193c1f]'
          }`}
        >
          All{' '}
          <span className="ml-1.5 text-[10px] font-black opacity-60">
            {absoluteTotalCount}
          </span>
        </Link>
        <Link
          href="/dashboard/admin/consultations?tab=active"
          className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all border ${
            tab === 'active'
              ? 'bg-[#193c1f] text-white border-[#193c1f]'
              : 'bg-white text-[#193c1f] border-[#d0d5cb] hover:border-[#193c1f]'
          }`}
        >
          Active{' '}
          <span className="ml-1.5 text-[10px] font-black">{activeCount}</span>
        </Link>
        <Link
          href="/dashboard/admin/consultations?tab=history"
          className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all border ${
            tab === 'history'
              ? 'bg-[#193c1f] text-white border-[#193c1f]'
              : 'bg-white text-[#193c1f] border-[#d0d5cb] hover:border-[#193c1f]'
          }`}
        >
          History{' '}
          <span className="ml-1.5 text-[10px] font-black">{historyCount}</span>
        </Link>
      </div>

      {/* Table */}
      <Table
        data={consultations}
        keyExtractor={(c) => c.id}
        emptyMessage="No consultations found."
        currentPage={page}
        totalPages={totalPages}
        onPageChange={(p) =>
          router.push(`/dashboard/admin/consultations?tab=${tab}&page=${p}`)
        }
        paginationInfo={
          totalPages > 1
            ? `Showing ${(page - 1) * perPage + 1}–${Math.min(page * perPage, totalCount)} of ${totalCount}`
            : undefined
        }
        renderExpandedRow={(c) => (
          <div className="p-4 sm:p-5 bg-white border border-[#d0d5cb]/40 rounded-[18px] shadow-sm cursor-default">
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
                        {c.title}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] text-[#8ea087] font-bold uppercase tracking-tight">
                        Category
                      </p>
                      <p className="text-[14px] font-bold text-[#193c1f]">
                        {c.category}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] text-[#8ea087] font-bold uppercase tracking-tight">
                        Assigned Psychologist
                      </p>
                      <p className="text-[14px] font-bold text-[#193c1f]">
                        {c.psychologist?.name ?? 'Processing...'}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] text-[#8ea087] font-bold uppercase tracking-tight">
                        Identity
                      </p>
                      <p className="text-[14px] font-bold text-[#193c1f]">
                        {c.isAnonymous ? 'Anonymous' : 'Public'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex flex-col md:border-l border-[#f7f3ed] md:pl-10">
                <h4 className="text-[11px] font-black uppercase tracking-wider text-[#8ea087] mb-4">
                  Consultation Description
                </h4>
                <div className="bg-[#f7f3ed]/30 p-5 rounded-2xl border border-[#f7f3ed] max-h-[200px] overflow-y-auto custom-scrollbar font-medium">
                  <p className="text-[13px] leading-relaxed text-[#193c1f]/80 whitespace-pre-wrap italic">
                    &quot;
                    {c.description || 'No description provided.'}
                    &quot;
                  </p>
                </div>
                {c.attachmentUrl && (
                  <div className="mt-6 flex items-center justify-between p-3 bg-[#f7f3ed] rounded-xl border border-[#d0d5cb]/30">
                    <span className="text-[12px] font-bold text-[#193c1f] truncate max-w-[150px]">
                      Attached Document
                    </span>
                    <Link
                      href={c.attachmentUrl}
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
            header: 'Consultation',
            cell: (c) => (
              <>
                <p className="font-bold text-[#193C1F] line-clamp-1">
                  {c.title}
                </p>
                <p className="text-[11px] text-[#8EA087] mt-0.5">
                  {c.category}
                </p>
              </>
            ),
          },
          {
            header: 'User',
            cell: (c) =>
              c.isAnonymous ? (
                <span className="text-[#8EA087] italic text-xs">Anonymous</span>
              ) : (
                <div>
                  <p className="font-medium text-[#193C1F] text-xs md:text-sm">
                    {c.user.name}
                  </p>
                  <p className="text-[10px] md:text-[11px] text-[#8EA087]">
                    {c.user.email}
                  </p>
                </div>
              ),
          },
          {
            header: 'Psychologist',
            cell: (c) => (
              <span className="font-medium text-xs md:text-sm text-[#193C1F]">
                {c.psychologist?.name ?? (
                  <span className="text-[#8EA087] italic text-xs">
                    Unassigned
                  </span>
                )}
              </span>
            ),
          },
          {
            header: 'Status',
            cell: (c) => (
              <span
                className={`text-[9px] md:text-[10px] font-black uppercase tracking-wider px-2 md:px-3 py-1 md:py-1.5 rounded-full border whitespace-nowrap ${STATUS_BADGE[c.status] || 'bg-gray-100 text-gray-600'}`}
              >
                {c.status}
              </span>
            ),
          },
          {
            header: 'Date',
            cell: (c) => (
              <span className="text-[#8EA087] text-xs font-bold">
                {fmtDate(c.date)}
              </span>
            ),
          },
          {
            header: 'Actions',
            headerClassName: 'text-right',
            className: 'text-right',
            cell: (c) => (
              <ConsultationActions
                id={c.id}
                status={c.status}
                title={c.title}
                onSuccess={(msg) => showToast(msg, 'success')}
                onError={(msg) => showToast(msg, 'error')}
              />
            ),
          },
        ]}
      />
    </div>
  );
}
