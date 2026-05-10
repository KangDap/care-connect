'use client';

import { Alert } from '@/components/alert';
import { Button } from '@/components/button';
import { Modal } from '@/components/modal';
import { Toast } from '@/components/toast';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

const STATUS_BADGE: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-700 border-amber-200',
  REVIEWED: 'bg-blue-100 text-blue-700 border-blue-200',
  RESOLVED: 'bg-green-100 text-green-700 border-green-200',
  REJECTED: 'bg-red-100 text-red-600 border-red-200',
};

const CATEGORY_LABEL: Record<string, string> = {
  PHYSICAL: 'Physical',
  SEXUAL: 'Sexual',
  PSYCHOLOGICAL: 'Psychological',
  OTHER: 'Other',
};

type ReportType = {
  id: number;
  title: string;
  category: string;
  status: string;
  isAnonymous: boolean;
  province: string;
  city: string;
  incidentDate: string;
  createdAt: string;
  description: string;
  user: { name: string; email: string };
  hasEvidence: boolean;
  donationTotal: number;
};

type TabType = { label: string; value: string; count: number };

export function ReportClient({
  reports,
  activeTab,
  tabs,
  page,
  totalPages,
  totalCount,
  perPage,
}: {
  reports: ReportType[];
  activeTab: string;
  tabs: TabType[];
  page: number;
  totalPages: number;
  totalCount: number;
  perPage: number;
}) {
  const router = useRouter();
  const [toastState, setToastState] = useState<{
    show: boolean;
    msg: string;
    type: 'success' | 'error';
  }>({ show: false, msg: '', type: 'success' });
  const [loading, setLoading] = useState(false);
  const [selectedReport, setSelectedReport] = useState<ReportType | null>(null);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<string>('PENDING');
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [isDeleteAllAlertOpen, setIsDeleteAllAlertOpen] = useState(false);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const fmtDate = (d: string) =>
    new Intl.DateTimeFormat('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(new Date(d));

  const fmt = (v: number) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(v);

  const openUpdateModal = (r: ReportType) => {
    setSelectedReport(r);
    setNewStatus(r.status);
    setIsUpdateModalOpen(true);
  };

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReport) return;
    setLoading(true);
    try {
      const res = await fetch('/api/dashboard/admin/reports', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selectedReport.id, status: newStatus }),
      });
      if (!res.ok) throw new Error('Failed to update status');
      setToastState({
        show: true,
        msg: 'Report status updated successfully!',
        type: 'success',
      });
      setIsUpdateModalOpen(false);
      router.refresh();
    } catch (err) {
      setToastState({
        show: true,
        msg: err instanceof Error ? err.message : 'Error',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = (id: number) => {
    setDeleteId(id);
    setIsDeleteAlertOpen(true);
  };

  const executeDelete = async () => {
    if (!deleteId) return;
    try {
      const res = await fetch(`/api/dashboard/admin/reports?id=${deleteId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete report');
      setToastState({
        show: true,
        msg: 'Report deleted successfully!',
        type: 'success',
      });
      setIsDeleteAlertOpen(false);
      setDeleteId(null);
      router.refresh();
    } catch (err) {
      setToastState({
        show: true,
        msg: err instanceof Error ? err.message : 'Error',
        type: 'error',
      });
    }
  };

  const executeDeleteAll = async () => {
    try {
      const res = await fetch(`/api/dashboard/admin/reports?id=all`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete all reports');
      setToastState({
        show: true,
        msg: 'All reports deleted successfully!',
        type: 'success',
      });
      setIsDeleteAllAlertOpen(false);
      router.refresh();
    } catch (err) {
      setToastState({
        show: true,
        msg: err instanceof Error ? err.message : 'Error',
        type: 'error',
      });
    }
  };

  return (
    <div className="space-y-6">
      <Toast
        show={toastState.show}
        msg={toastState.msg}
        type={toastState.type}
        onClose={() => setToastState({ ...toastState, show: false })}
      />

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-[32px] font-black text-[#193c1f]">
            Reports Moderation
          </h1>
          <p className="text-[#8ea087] font-medium">
            Review and manage all incident reports.
          </p>
        </div>
        <Button
          onClick={() => setIsDeleteAllAlertOpen(true)}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-colors text-sm shadow-sm border-0"
        >
          Delete All Reports
        </Button>
      </div>

      <div className="flex gap-2 flex-wrap">
        {tabs.map((tab) => (
          <Link
            key={tab.value}
            href={`/dashboard/admin/reports?status=${tab.value}`}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all border ${
              activeTab === tab.value
                ? 'bg-[#193c1f] text-white border-[#193c1f]'
                : 'bg-white text-[#193c1f] border-[#d0d5cb] hover:border-[#193c1f]'
            }`}
          >
            {tab.label}
            <span
              className={`ml-2 px-2 py-0.5 rounded-full text-[10px] font-black ${activeTab === tab.value ? 'bg-white/20' : 'bg-[#f7f3ed]'}`}
            >
              {tab.count}
            </span>
          </Link>
        ))}
      </div>

      <div className="bg-white border border-[#d0d5cb] rounded-2xl overflow-hidden shadow-sm">
        <table className="w-full text-left table-fixed">
          <thead className="bg-[#f7f3ed] text-[11px] text-[#8ea087] font-black uppercase tracking-widest">
            <tr>
              <th className="px-6 py-4 w-[280px]">Report</th>
              <th className="px-6 py-4 w-[200px]">Reporter</th>
              <th className="px-6 py-4 w-[130px]">Category</th>
              <th className="px-6 py-4 w-[120px]">Status</th>
              <th className="px-6 py-4 w-[130px]">Donations</th>
              <th className="px-6 py-4 w-[220px] text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f7f3ed] text-sm">
            {reports.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-6 py-12 text-center text-[#8ea087] font-medium"
                >
                  No reports found.
                </td>
              </tr>
            ) : (
              reports.map((r) => (
                <tr
                  key={r.id}
                  className="hover:bg-[#f7f3ed]/50 transition-colors"
                >
                  <td className="px-6 py-4 align-top">
                    <Link
                      href={`/publicreports/${r.id}`}
                      className="hover:underline"
                    >
                      <p className="font-bold text-[#193c1f] line-clamp-2 max-w-[300px]">
                        {r.title}
                      </p>
                    </Link>
                    <p className="text-[11px] text-[#8ea087] mt-0.5 truncate max-w-[300px]">
                      {r.city}, {r.province} •{' '}
                      {r.hasEvidence ? '📎 Has evidence' : 'No evidence'}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    {r.isAnonymous ? (
                      <span className="text-[#8ea087] italic text-xs">
                        Anonymous
                      </span>
                    ) : (
                      <>
                        <p className="font-medium text-[#193c1f]">
                          {r.user.name}
                        </p>
                        <p className="text-[11px] text-[#8ea087]">
                          {r.user.email}
                        </p>
                      </>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs font-bold text-[#193c1f] bg-[#f7f3ed] border border-[#d0d5cb] px-2 py-1 rounded-full">
                      {CATEGORY_LABEL[r.category] || r.category}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-full border ${STATUS_BADGE[r.status] || 'bg-gray-100 text-gray-600'}`}
                    >
                      {r.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {r.donationTotal > 0 ? (
                      <span className="text-green-700 font-bold text-xs">
                        {fmt(r.donationTotal)}
                      </span>
                    ) : (
                      <span className="text-[#8ea087] text-xs">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        onClick={() => openUpdateModal(r)}
                        className="text-xs px-4 py-1.5 min-h-0 h-auto"
                      >
                        Update
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => confirmDelete(r.id)}
                        className="text-xs px-4 py-1.5 min-h-0 h-auto text-red-600 border-red-600 hover:bg-red-50"
                      >
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {totalPages > 1 && (
          <div className="px-6 py-4 bg-[#f7f3ed]/50 border-t border-[#d0d5cb] flex justify-between items-center">
            <span className="text-[#8ea087] text-xs font-semibold">
              Showing {(page - 1) * perPage + 1}–
              {Math.min(page * perPage, totalCount)} of {totalCount}
            </span>
            <div className="flex gap-2">
              {page > 1 && (
                <Link
                  href={`/dashboard/admin/reports?status=${activeTab}&page=${page - 1}`}
                  className="px-3 py-1.5 text-xs font-bold text-[#193c1f] bg-white border border-[#d0d5cb] rounded-lg hover:border-[#193c1f] transition-colors"
                >
                  Prev
                </Link>
              )}
              {page < totalPages && (
                <Link
                  href={`/dashboard/admin/reports?status=${activeTab}&page=${page + 1}`}
                  className="px-3 py-1.5 text-xs font-bold text-[#193c1f] bg-white border border-[#d0d5cb] rounded-lg hover:border-[#193c1f] transition-colors"
                >
                  Next
                </Link>
              )}
            </div>
          </div>
        )}
      </div>

      <Modal
        title="Update Report Status"
        isOpen={isUpdateModalOpen}
        onClose={() => setIsUpdateModalOpen(false)}
      >
        <form onSubmit={handleUpdateStatus} className="space-y-4">
          <div>
            <p className="text-sm text-gray-500 mb-4">
              Update the status for report{' '}
              <strong>{selectedReport?.title}</strong>.
            </p>
            <label className="text-sm font-bold text-[#193c1f] mb-1.5 block">
              Status
            </label>
            <select
              className="w-full bg-[#ede4d8] border border-[#d0d5cb] rounded-xl px-4 py-3 text-sm text-[#193c1f] focus:outline-none focus:border-[#8ea087] focus:ring-1 focus:ring-[#8ea087]"
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
            >
              <option value="PENDING">PENDING</option>
              <option value="REVIEWED">REVIEWED</option>
              <option value="RESOLVED">RESOLVED</option>
              <option value="REJECTED">REJECTED</option>
            </select>
          </div>
          <div className="pt-2 flex justify-end gap-2">
            <Button
              variant="ghost"
              type="button"
              onClick={() => setIsUpdateModalOpen(false)}
            >
              Cancel
            </Button>
            <Button loading={loading} type="submit">
              Save Status
            </Button>
          </div>
        </form>
      </Modal>

      <Alert
        isOpen={isDeleteAlertOpen}
        onClose={() => setIsDeleteAlertOpen(false)}
        onConfirm={executeDelete}
        title="Delete Report"
        description="Are you sure you want to delete this report? This cannot be undone."
        confirmText="Delete"
        type="danger"
      />

      <Alert
        isOpen={isDeleteAllAlertOpen}
        onClose={() => setIsDeleteAllAlertOpen(false)}
        onConfirm={executeDeleteAll}
        title="Delete All Reports"
        description="Are you absolutely sure you want to delete ALL reports? This action is permanent and cannot be undone."
        confirmText="Delete All"
        type="danger"
      />
    </div>
  );
}
