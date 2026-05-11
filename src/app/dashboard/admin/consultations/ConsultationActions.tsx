'use client';

import { Alert } from '@/components/alert';
import { Button } from '@/components/button';
import { Modal } from '@/components/modal';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

type ConsultationActionsProps = {
  id: number;
  status: string;
  title: string;
  onSuccess: (msg: string) => void;
  onError: (msg: string) => void;
};

export function ConsultationActions({
  id,
  status,
  title,
  onSuccess,
  onError,
}: ConsultationActionsProps) {
  const router = useRouter();
  const [isUpdating, setIsUpdating] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [newStatus, setNewStatus] = useState(status);

  const handleStatusSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    try {
      const res = await fetch('/api/dashboard/admin/consultations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus }),
      });

      if (!res.ok) throw new Error('Failed to update status');
      setIsEditModalOpen(false);
      onSuccess('Status berhasil diperbarui!');
      router.refresh();
    } catch {
      onError('Gagal memperbarui status');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    setIsUpdating(true);
    try {
      const res = await fetch(`/api/dashboard/admin/consultations?id=${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to delete consultation');
      setIsDeleteAlertOpen(false);
      onSuccess('Konsultasi berhasil dihapus!');
      router.refresh();
    } catch {
      onError('Gagal menghapus data konsultasi');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="flex items-center justify-end gap-2">
      <Button
        variant="outline"
        onClick={() => {
          setNewStatus(status);
          setIsEditModalOpen(true);
        }}
        className="text-xs px-4 py-1.5 min-h-0 h-auto"
      >
        Edit
      </Button>
      <button
        onClick={() => setIsDeleteAlertOpen(true)}
        className="text-xs font-bold text-red-600 hover:text-red-700 transition uppercase tracking-wider"
      >
        Delete
      </button>

      {/* Edit Status Modal */}
      <Modal
        title="Update Status"
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
      >
        <form onSubmit={handleStatusSubmit} className="space-y-4 text-left">
          <p className="text-sm text-gray-500">
            Ubah status untuk konsultasi <strong>{title}</strong>.
          </p>
          <div>
            <label className="text-sm font-bold text-[#193c1f] mb-1.5 block uppercase tracking-widest">
              Status
            </label>
            <select
              className="w-full bg-[#ede4d8] border border-[#d0d5cb] rounded-xl px-4 py-3 text-sm text-[#193c1f] focus:outline-none focus:border-[#8ea087] focus:ring-1 focus:ring-[#8ea087] font-bold"
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
            >
              <option value="SCHEDULED">SCHEDULED</option>
              <option value="ONGOING">ONGOING</option>
              <option value="COMPLETED">COMPLETED</option>
              <option value="CANCELLED">CANCELLED</option>
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="ghost"
              type="button"
              onClick={() => setIsEditModalOpen(false)}
            >
              Cancel
            </Button>
            <Button loading={isUpdating} type="submit">
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Alert */}
      <Alert
        isOpen={isDeleteAlertOpen}
        onClose={() => setIsDeleteAlertOpen(false)}
        onConfirm={handleDelete}
        type="danger"
        title="Hapus Konsultasi?"
        description={`Apakah Anda yakin ingin menghapus konsultasi "${title}"? Tindakan ini tidak dapat dibatalkan.`}
        confirmText={isUpdating ? 'Menghapus...' : 'Ya, Hapus'}
        cancelText="Batal"
      />
    </div>
  );
}
