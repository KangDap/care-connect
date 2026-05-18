'use client';

import { Button } from '@/components/button';
import { Modal } from '@/components/modal';
import { Check, Settings, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

type DonationActionsProps = {
  id: number;
  status: string;
  amount: number;
  donor: string;
  onSuccess: (msg: string) => void;
  onError: (msg: string) => void;
};

export function DonationActions({
  id,
  status,
  amount,
  donor,
  onSuccess,
  onError,
}: DonationActionsProps) {
  const router = useRouter();
  const [isUpdating, setIsUpdating] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const fmt = (v: number) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(v);

  const handlePatchStatus = async (
    paymentStatus: string,
    successMsg: string,
    errorMsg: string,
  ) => {
    setIsUpdating(true);
    try {
      const res = await fetch('/api/dashboard/admin/donations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, paymentStatus }),
      });
      if (!res.ok) throw new Error('Failed to update status');
      setIsEditModalOpen(false);
      onSuccess(successMsg);
      router.refresh();
    } catch {
      onError(errorMsg);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    setIsUpdating(true);
    try {
      const res = await fetch(`/api/dashboard/admin/donations?id=${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete donation');
      setIsDeleteModalOpen(false);
      onSuccess('Data donasi berhasil dihapus!');
      router.refresh();
    } catch {
      onError('Gagal menghapus data donasi');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      {/* Single compact "Manage" trigger */}
      <Button
        variant="outline"
        onClick={() => setIsEditModalOpen(true)}
        className="h-auto min-h-0 rounded-xl px-3 py-2 text-xs normal-case tracking-normal shadow-none"
      >
        <Settings size={14} />
        Manage
      </Button>

      {/* ── Action Menu Modal ── */}
      <Modal
        title="Manage Donation"
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
      >
        <div className="space-y-6 text-left">
          {/* Donor info */}
          <div>
            <p className="text-xs font-black text-[#8ea087] uppercase tracking-widest mb-1">
              Donor &amp; Amount
            </p>
            <p className="text-sm font-bold text-[#193c1f]">
              {donor} - {fmt(amount)}
            </p>
            <span
              className={`inline-block mt-2 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                status === 'PAID'
                  ? 'bg-green-100 text-green-700'
                  : status === 'PENDING'
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-gray-100 text-gray-500'
              }`}
            >
              {status}
            </span>
          </div>

          {/* Action buttons (act as a dropdown-style menu) */}
          <div className="flex flex-col gap-2">
            {/* Mark as PAID */}
            <button
              disabled={status === 'PAID' || isUpdating}
              onClick={() =>
                handlePatchStatus(
                  'PAID',
                  'Donasi berhasil ditandai sebagai LUNAS!',
                  'Gagal memperbarui status donasi.',
                )
              }
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-[#D0D5CB] bg-white hover:bg-[#f7f3ed] disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-left"
            >
              <span className="w-7 h-7 rounded-lg bg-green-100 flex items-center justify-center shrink-0">
                <Check className="w-4 h-4 text-green-700" strokeWidth={2.5} />
              </span>
              <div>
                <p className="text-sm font-bold text-[#193c1f]">Mark as PAID</p>
                <p className="text-[11px] text-[#8ea087]">
                  Manually confirm payment receipt
                </p>
              </div>
            </button>

            {/* Divider */}
            <hr className="border-[#f7f3ed] my-1" />

            {/* Delete Record */}
            <button
              disabled={isUpdating}
              onClick={() => {
                setIsEditModalOpen(false);
                setIsDeleteModalOpen(true);
              }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-red-100 bg-white hover:bg-red-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-left"
            >
              <span className="w-7 h-7 rounded-lg bg-red-100 flex items-center justify-center shrink-0">
                <Trash2 className="w-4 h-4 text-red-600" strokeWidth={2.5} />
              </span>
              <div>
                <p className="text-sm font-bold text-red-600">Delete Record</p>
                <p className="text-[11px] text-[#8ea087]">
                  Permanently remove this donation
                </p>
              </div>
            </button>
          </div>
        </div>
      </Modal>

      {/* ── Delete Confirmation Modal ── */}
      <Modal
        title="Delete Donation"
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-500">
            Apakah Anda yakin ingin menghapus catatan donasi dari{' '}
            <strong>{donor}</strong> sebesar <strong>{fmt(amount)}</strong>?
            Tindakan ini tidak dapat dibatalkan.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="ghost"
              type="button"
              onClick={() => setIsDeleteModalOpen(false)}
            >
              Batal
            </Button>
            <Button
              loading={isUpdating}
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 text-white border-none"
            >
              Hapus
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
