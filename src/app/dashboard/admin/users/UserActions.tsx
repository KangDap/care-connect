'use client';

import { Button } from '@/components/button';
import { Modal } from '@/components/modal';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

type UserProps = {
  id: string;
  role: string;
  banned: boolean | null;
  name: string;
};

export function UserActions({ id, role, banned, name }: UserProps) {
  const router = useRouter();
  const [isUpdating, setIsUpdating] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newRole, setNewRole] = useState(role);

  const handleRoleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    try {
      const res = await fetch('/api/dashboard/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          action: 'role',
          payload: { role: newRole },
        }),
      });

      if (!res.ok) throw new Error('Failed to update role');
      setIsModalOpen(false);
      router.refresh();
    } catch {
      alert('Error updating role');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleBanToggle = async () => {
    let reason = null;
    if (!banned) {
      reason = window.prompt('Enter reason for banning this user:');
      if (reason === null) return; // cancelled
    }

    setIsUpdating(true);
    try {
      const res = await fetch('/api/dashboard/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          action: 'ban',
          payload: { banned: !banned, reason },
        }),
      });

      if (!res.ok) throw new Error('Failed to update ban status');
      router.refresh();
    } catch (error) {
      alert('Error updating ban status');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="flex items-center justify-end gap-4">
      <button
        suppressHydrationWarning
        onClick={() => {
          setNewRole(role);
          setIsModalOpen(true);
        }}
        className="text-sm font-bold text-blue-600 hover:text-blue-700 transition"
      >
        Edit
      </button>

      <button
        suppressHydrationWarning
        onClick={handleBanToggle}
        disabled={isUpdating}
        className={`text-sm font-bold transition disabled:opacity-50 ${
          banned
            ? 'text-green-600 hover:text-green-700'
            : 'text-red-600 hover:text-red-700'
        }`}
      >
        {banned ? 'Unban' : 'Ban'}
      </button>

      <Modal
        title="Edit User Role"
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      >
        <form onSubmit={handleRoleSubmit} className="space-y-4 text-left">
          <div>
            <p className="text-sm text-gray-500 mb-4">
              Update the role for user <strong>{name}</strong>.
            </p>
            <label className="text-sm font-bold text-[#193C1F] mb-1.5 block">
              Role
            </label>
            <select
              className="w-full bg-[#f9faf7] border border-[#d0d5cb] rounded-xl px-4 py-3 text-sm text-[#193c1f] focus:outline-none focus:border-[#8ea087] focus:ring-1 focus:ring-[#8ea087]"
              value={newRole}
              onChange={(e) => setNewRole(e.target.value)}
            >
              <option value="user">USER</option>
              <option value="ADMIN">ADMIN</option>
              <option value="PSYCHOLOGIST">PSYCHOLOGIST</option>
            </select>
          </div>
          <div className="pt-2 flex justify-end gap-2">
            <Button
              variant="ghost"
              type="button"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button loading={isUpdating} type="submit">
              Save Role
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
