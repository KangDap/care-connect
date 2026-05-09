'use client';

import { Toast } from '@/components/toast';
import Link from 'next/link';
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
        <h1 className="text-[32px] font-black text-[#193C1F]">
          All Consultations
        </h1>
        <p className="text-[#8EA087] font-medium">
          Manage and monitor all platform consultations.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
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
      <div className="flex gap-3">
        <Link
          href="/dashboard/admin/consultations?tab=all"
          className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all border ${
            tab === 'all'
              ? 'bg-[#193C1F] text-white border-[#193C1F]'
              : 'bg-white text-[#193C1F] border-[#D0D5CB] hover:border-[#193C1F]'
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
              ? 'bg-[#193C1F] text-white border-[#193C1F]'
              : 'bg-white text-[#193C1F] border-[#D0D5CB] hover:border-[#193C1F]'
          }`}
        >
          Active{' '}
          <span className="ml-1.5 text-[10px] font-black">{activeCount}</span>
        </Link>
        <Link
          href="/dashboard/admin/consultations?tab=history"
          className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all border ${
            tab === 'history'
              ? 'bg-[#193C1F] text-white border-[#193C1F]'
              : 'bg-white text-[#193C1F] border-[#D0D5CB] hover:border-[#193C1F]'
          }`}
        >
          History{' '}
          <span className="ml-1.5 text-[10px] font-black">{historyCount}</span>
        </Link>
      </div>

      {/* Table */}
      <div className="bg-white border border-[#D0D5CB] rounded-2xl overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-[#F7F3ED] text-[11px] text-[#8EA087] font-black uppercase tracking-widest">
            <tr>
              <th className="px-6 py-4">Consultation</th>
              <th className="px-6 py-4">User</th>
              <th className="px-6 py-4">Psychologist</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F7F3ED] text-sm">
            {consultations.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-6 py-12 text-center text-[#8EA087] font-medium"
                >
                  No consultations found.
                </td>
              </tr>
            ) : (
              consultations.map((c) => (
                <tr
                  key={c.id}
                  className="hover:bg-[#F7F3ED]/50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <p className="font-bold text-[#193C1F] line-clamp-1">
                      {c.title}
                    </p>
                    <p className="text-[11px] text-[#8EA087] mt-0.5">
                      {c.category}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    {c.isAnonymous ? (
                      <span className="text-[#8EA087] italic text-xs">
                        Anonymous
                      </span>
                    ) : (
                      <>
                        <p className="font-medium text-[#193C1F]">
                          {c.user.name}
                        </p>
                        <p className="text-[11px] text-[#8EA087]">
                          {c.user.email}
                        </p>
                      </>
                    )}
                  </td>
                  <td className="px-6 py-4 text-[#193C1F]">
                    {c.psychologist?.name ?? (
                      <span className="text-[#8EA087] italic text-xs">
                        Unassigned
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-full border ${STATUS_BADGE[c.status] || 'bg-gray-100 text-gray-600'}`}
                    >
                      {c.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-[#8EA087] text-xs">
                    {fmtDate(c.date)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <ConsultationActions
                      id={c.id}
                      status={c.status}
                      title={c.title}
                      onSuccess={(msg) => showToast(msg, 'success')}
                      onError={(msg) => showToast(msg, 'error')}
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        {totalPages > 1 && (
          <div className="px-6 py-4 bg-[#F7F3ED]/50 border-t border-[#D0D5CB] flex justify-between items-center">
            <span className="text-[#8EA087] text-xs font-semibold">
              {(page - 1) * perPage + 1}–{Math.min(page * perPage, totalCount)}{' '}
              of {totalCount}
            </span>
            <div className="flex gap-2">
              {page > 1 && (
                <Link
                  href={`/dashboard/admin/consultations?tab=${tab}&page=${page - 1}`}
                  className="px-3 py-1.5 text-xs font-bold text-[#193C1F] bg-white border border-[#D0D5CB] rounded-lg hover:border-[#193C1F]"
                >
                  ← Prev
                </Link>
              )}
              {page < totalPages && (
                <Link
                  href={`/dashboard/admin/consultations?tab=${tab}&page=${page + 1}`}
                  className="px-3 py-1.5 text-xs font-bold text-[#193C1F] bg-white border border-[#D0D5CB] rounded-lg hover:border-[#193C1F]"
                >
                  Next →
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
