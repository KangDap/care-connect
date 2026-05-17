'use client';

import { Alert } from '@/components/alert';
import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { Input } from '@/components/input';
import { Modal } from '@/components/modal';
import { Pagination } from '@/components/pagination';
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
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [reportToDelete, setReportToDelete] = useState<number | null>(null);
  const [newStatus, setNewStatus] = useState<string>('PENDING');

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

  const handleDelete = async () => {
    if (!reportToDelete) return;
    setLoading(true);
    try {
      const res = await fetch(
        `/api/dashboard/admin/reports?id=${reportToDelete}`,
        {
          method: 'DELETE',
        },
      );
      if (!res.ok) throw new Error('Failed to delete report');
      setToastState({
        show: true,
        msg: 'Report deleted successfully!',
        type: 'success',
      });
      setIsDeleteAlertOpen(false);
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

  return (
    <div className="space-y-6">
      <Toast
        show={toastState.show}
        msg={toastState.msg}
        type={toastState.type}
        onClose={() => setToastState({ ...toastState, show: false })}
      />

      <div>
        <h1 className="text-[32px] font-black text-[#193c1f]">
          Reports Moderation
        </h1>
        <p className="text-[#8ea087] font-medium">
          Review and manage all incident reports.
        </p>
      </div>

      <div className="flex gap-2 flex-wrap items-center">
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

      <Card className="rounded-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left table-fixed min-w-[1000px]">
            <thead className="bg-[#F7F3ED] text-[11px] text-[#8EA087] font-black uppercase tracking-widest">
              <tr>
                <th className="px-6 py-4 w-[320px]">Report</th>
                <th className="px-6 py-4 w-[220px]">Reporter</th>
                <th className="px-6 py-4 w-[140px]">Category</th>
                <th className="px-6 py-4 w-[120px]">Status</th>
                <th className="px-6 py-4 w-[140px]">Donations</th>
                <th className="px-6 py-4 w-[140px] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F7F3ED] text-sm">
              {reports.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-12 text-center text-[#8EA087] font-medium"
                  >
                    No reports found.
                  </td>
                </tr>
              ) : (
                reports.map((r) => (
                  <tr
                    key={r.id}
                    className="hover:bg-[#F7F3ED]/50 transition-colors"
                  >
                    <td className="px-6 py-4 align-top">
                      <Link
                        href={`/publicreports/${r.id}`}
                        className="hover:underline"
                      >
                        <p className="font-bold text-[#193C1F] line-clamp-2 max-w-[300px]">
                          {r.title}
                        </p>
                      </Link>
                      <p className="text-[11px] text-[#8EA087] mt-0.5 truncate max-w-[300px]">
                        {r.city}, {r.province} •{' '}
                        {r.hasEvidence ? '📎 Has evidence' : 'No evidence'}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      {r.isAnonymous ? (
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-[#F7F3ED] border border-[#D0D5CB] flex items-center justify-center shrink-0">
                            <span className="text-[10px] text-[#8EA087]">
                              ?
                            </span>
                          </div>
                          <span className="text-[#8EA087] italic text-xs">
                            Anonymous
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-[#F7F3ED] border border-[#D0D5CB] flex items-center justify-center shrink-0 overflow-hidden relative">
                            <div className="text-[10px] font-bold text-[#193C1F]">
                              {r.user.name.charAt(0)}
                            </div>
                          </div>
                          <div>
                            <p className="font-medium text-[#193C1F]">
                              {r.user.name}
                            </p>
                            <p className="text-[11px] text-[#8EA087]">
                              {r.user.email}
                            </p>
                          </div>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-bold text-[#193C1F] bg-[#F7F3ED] border border-[#D0D5CB] px-2 py-1 rounded-full">
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
                        <span className="text-[#8EA087] text-xs">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => openUpdateModal(r)}
                        className="px-2 text-sm text-blue-600 hover:text-blue-700"
                      >
                        Update
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => {
                          setReportToDelete(r.id);
                          setIsDeleteAlertOpen(true);
                        }}
                        className="ml-2 px-2 text-sm text-red-600 hover:text-red-700"
                      >
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="px-6 py-4 bg-[#f7f3ed]/50 border-t border-[#d0d5cb] flex justify-between items-center">
            <span className="text-[#8ea087] text-xs font-semibold">
              Showing {(page - 1) * perPage + 1}–
              {Math.min(page * perPage, totalCount)} of {totalCount}
            </span>
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={(p) =>
                router.push(
                  `/dashboard/admin/reports?status=${activeTab}&page=${p}`,
                )
              }
            />
          </div>
        )}
      </Card>

      <Modal
        title="Update Report Status"
        isOpen={isUpdateModalOpen}
        onClose={() => setIsUpdateModalOpen(false)}
      >
        <form onSubmit={handleUpdateStatus} className="space-y-4">
          <p className="text-sm text-gray-500 mb-4">
            Update the status for report{' '}
            <strong>{selectedReport?.title}</strong>.
          </p>
          <Input
            label="Status"
            type="select"
            value={newStatus}
            onChange={(e) => setNewStatus(e.target.value)}
          >
            <option value="PENDING">PENDING</option>
            <option value="REVIEWED">REVIEWED</option>
            <option value="RESOLVED">RESOLVED</option>
            <option value="REJECTED">REJECTED</option>
          </Input>
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
        onConfirm={handleDelete}
        type="danger"
        title="Delete Report?"
        description="Are you sure you want to delete this report? This action cannot be undone."
        confirmText={loading ? 'Deleting...' : 'Yes, Delete'}
        cancelText="Cancel"
      />
    </div>
  );
}
