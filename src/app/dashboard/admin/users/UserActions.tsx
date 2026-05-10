'use client';

import { Alert } from '@/components/alert';
import { Button } from '@/components/button';
import { Modal } from '@/components/modal';
import { Toast } from '@/components/toast';
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

  const [isBanModalOpen, setIsBanModalOpen] = useState(false);
  const [banReason, setBanReason] = useState('');
  const [isUnbanAlertOpen, setIsUnbanAlertOpen] = useState(false);

  const [toastState, setToastState] = useState<{
    show: boolean;
    msg: string;
    type: 'success' | 'error';
  }>({ show: false, msg: '', type: 'success' });

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
      setToastState({
        show: true,
        msg: 'Role updated successfully',
        type: 'success',
      });
      setIsModalOpen(false);
      router.refresh();
    } catch {
      setToastState({ show: true, msg: 'Error updating role', type: 'error' });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleBanToggle = () => {
    if (banned) {
      setIsUnbanAlertOpen(true);
    } else {
      setIsBanModalOpen(true);
    }
  };

  const executeBanToggle = async (reason: string | null = null) => {
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
      setToastState({
        show: true,
        msg: `User ${banned ? 'unbanned' : 'banned'} successfully`,
        type: 'success',
      });
      setIsBanModalOpen(false);
      setIsUnbanAlertOpen(false);
      setBanReason('');
      router.refresh();
    } catch (_error) {
      setToastState({
        show: true,
        msg: 'Error updating ban status',
        type: 'error',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="flex items-center justify-end gap-4">
      <Toast
        show={toastState.show}
        msg={toastState.msg}
        type={toastState.type}
        onClose={() => setToastState({ ...toastState, show: false })}
      />
      <Button
        variant="outline"
        className="text-xs px-4 py-1.5 min-h-0 h-auto"
        onClick={() => {
          setNewRole(role);
          setIsModalOpen(true);
        }}
      >
        Edit
      </Button>

      <Button
        variant="outline"
        onClick={handleBanToggle}
        disabled={isUpdating}
        className={`text-xs px-4 py-1.5 min-h-0 h-auto ${
          banned
            ? 'text-green-600 border-green-600 hover:bg-green-50'
            : 'text-red-600 border-red-600 hover:bg-red-50'
        }`}
      >
        {banned ? 'Unban' : 'Ban'}
      </Button>

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
            <label className="text-sm font-bold text-[#193c1f] mb-1.5 block">
              Role
            </label>
            <select
              className="w-full bg-[#ede4d8] border border-[#d0d5cb] rounded-xl px-4 py-3 text-sm text-[#193c1f] focus:outline-none focus:border-[#8ea087] focus:ring-1 focus:ring-[#8ea087]"
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

      <Modal
        title="Ban User"
        isOpen={isBanModalOpen}
        onClose={() => setIsBanModalOpen(false)}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            executeBanToggle(banReason);
          }}
          className="space-y-4 text-left"
        >
          <div>
            <p className="text-sm text-gray-500 mb-4">
              Please provide a reason for banning <strong>{name}</strong>.
            </p>
            <label className="text-sm font-bold text-[#193c1f] mb-1.5 block">
              Reason
            </label>
            <input
              type="text"
              required
              className="w-full bg-[#ede4d8] border border-[#d0d5cb] rounded-xl px-4 py-3 text-sm text-[#193c1f] focus:outline-none focus:border-[#8ea087] focus:ring-1 focus:ring-[#8ea087]"
              value={banReason}
              onChange={(e) => setBanReason(e.target.value)}
              placeholder="e.g., Violation of terms"
            />
          </div>
          <div className="pt-2 flex justify-end gap-2">
            <Button
              variant="ghost"
              type="button"
              onClick={() => setIsBanModalOpen(false)}
            >
              Cancel
            </Button>
            <Button loading={isUpdating} type="submit">
              Ban User
            </Button>
          </div>
        </form>
      </Modal>

      <Alert
        isOpen={isUnbanAlertOpen}
        onClose={() => setIsUnbanAlertOpen(false)}
        onConfirm={() => executeBanToggle(null)}
        title="Unban User"
        description={`Are you sure you want to unban ${name}? They will regain access to their account.`}
        confirmText="Unban"
        type="primary"
      />
    </div>
  );
}
