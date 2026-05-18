'use client';

import { Alert } from '@/components/alert';
import { Button } from '@/components/button';
import { Input } from '@/components/input';
import { Modal } from '@/components/modal';
import { Pencil, Trash2 } from 'lucide-react';
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
    <div className="flex flex-wrap items-center justify-end gap-2">
      <Button
        variant="outline"
        onClick={() => {
          setNewStatus(status);
          setIsEditModalOpen(true);
        }}
        className="text-[10px] sm:text-xs px-2 py-0.5 min-h-0 h-7"
      >
        <Pencil size={14} />
        Edit
      </Button>
      <Button
        type="button"
        variant="outline"
        onClick={() => setIsDeleteAlertOpen(true)}
        className="px-2 py-0.5 text-[10px] sm:text-xs h-7 min-h-0 text-red-600 hover:text-red-700 bg-red-50/50 hover:bg-red-50"
      >
        <Trash2 size={14} />
        Delete
      </Button>

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
          <Input
            label="Status"
            type="select"
            value={newStatus}
            onChange={(e) => setNewStatus(e.target.value)}
          >
            <option value="SCHEDULED">SCHEDULED</option>
            <option value="ONGOING">ONGOING</option>
            <option value="COMPLETED">COMPLETED</option>
            <option value="CANCELLED">CANCELLED</option>
          </Input>
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
