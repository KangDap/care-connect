'use client';

import { Button } from '@/components/button';
import { Modal } from '@/components/modal';
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

  const handleMarkAsPaid = async () => {
    setIsUpdating(true);
    try {
      const res = await fetch('/api/dashboard/admin/donations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, paymentStatus: 'PAID' }),
      });

      if (!res.ok) throw new Error('Failed to update status');
      setIsEditModalOpen(false);
      onSuccess('Donasi berhasil ditandai sebagai LUNAS!');
      router.refresh();
    } catch {
      onError('Gagal memperbarui status donasi');
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
    <div className="flex items-center justify-end gap-2">
      <button
        onClick={() => setIsEditModalOpen(true)}
        className="text-xs font-bold text-blue-600 hover:text-blue-700 transition uppercase tracking-wider"
      >
        Edit
      </button>

      {/* Edit/Manage Modal */}
      <Modal
        title="Manage Donation"
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
      >
        <div className="space-y-6 text-left">
          <div>
            <p className="text-xs font-black text-[#8EA087] uppercase tracking-widest mb-1">
              Donor & Amount
            </p>
            <p className="text-sm font-bold text-[#193C1F]">
              {donor} — {fmt(amount)}
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <Button
              loading={isUpdating}
              disabled={status === 'PAID'}
              onClick={handleMarkAsPaid}
              className="w-full"
            >
              Mark as PAID
            </Button>
            <Button
              variant="outline"
              loading={isUpdating}
              onClick={() => {
                setIsEditModalOpen(false);
                setIsDeleteModalOpen(true);
              }}
              className="w-full text-red-600 border-red-200 hover:bg-red-50"
            >
              Delete Record
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
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
