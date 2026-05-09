'use client';

import { Alert } from '@/components/alert';
import { Button } from '@/components/button';
import { Input } from '@/components/input';
import { Modal } from '@/components/modal';
import { Toast } from '@/components/toast';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

type Channel = {
  id: number;
  name: string;
  description: string | null;
  type: 'PUBLIC' | 'PRIVATE';
  coverUrl: string | null;
  createdAt: Date;
  chats?: { id: number; timestamp: Date }[];
};

export function CommunityClient({ channels }: { channels: Channel[] }) {
  const router = useRouter();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toastState, setToastState] = useState<{
    show: boolean;
    msg: string;
    type: 'success' | 'error';
  }>({ show: false, msg: '', type: 'success' });

  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    type: string;
    coverImage: File | null;
  }>({
    name: '',
    description: '',
    type: 'PUBLIC',
    coverImage: null,
  });

  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [updateId, setUpdateId] = useState<number | null>(null);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [channelToDelete, setChannelToDelete] = useState<number | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = new FormData();
      data.append('name', formData.name);
      data.append('description', formData.description);
      data.append('type', formData.type);
      if (formData.coverImage) {
        data.append('coverImage', formData.coverImage);
      }

      const res = await fetch('/api/community-chat', {
        method: 'POST',
        body: data,
      });

      if (!res.ok) throw new Error('Failed to create channel');
      setToastState({
        show: true,
        msg: 'Channel created successfully!',
        type: 'success',
      });
      setIsCreateModalOpen(false);
      setFormData({
        name: '',
        description: '',
        type: 'PUBLIC',
        coverImage: null,
      });
      router.refresh();
    } catch (err) {
      setToastState({
        show: true,
        msg: err instanceof Error ? err.message : 'Failed to create channel',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const openUpdateModal = (ch: Channel) => {
    setUpdateId(ch.id);
    setFormData({
      name: ch.name,
      description: ch.description || '',
      type: ch.type,
      coverImage: null,
    });
    setIsUpdateModalOpen(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!updateId) return;
    setLoading(true);
    try {
      const res = await fetch('/api/dashboard/admin/community-chat', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: updateId,
          name: formData.name,
          description: formData.description,
          type: formData.type,
        }),
      });

      if (!res.ok) throw new Error('Failed to update channel');
      setToastState({
        show: true,
        msg: 'Channel updated successfully!',
        type: 'success',
      });
      setIsUpdateModalOpen(false);
      setFormData({
        name: '',
        description: '',
        type: 'PUBLIC',
        coverImage: null,
      });
      setUpdateId(null);
      router.refresh();
    } catch (err) {
      setToastState({
        show: true,
        msg: err instanceof Error ? err.message : 'Failed to update channel',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!channelToDelete) return;
    try {
      const res = await fetch(
        `/api/dashboard/admin/community-chat?id=${channelToDelete}`,
        {
          method: 'DELETE',
        },
      );
      if (!res.ok) throw new Error('Failed to delete channel');
      setToastState({
        show: true,
        msg: 'Channel deleted successfully!',
        type: 'success',
      });
      setIsDeleteAlertOpen(false);
      setChannelToDelete(null);
      router.refresh();
    } catch (err) {
      setToastState({
        show: true,
        msg: err instanceof Error ? err.message : 'Failed to delete channel',
        type: 'error',
      });
    }
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
        show={toastState.show}
        msg={toastState.msg}
        type={toastState.type}
        onClose={() => setToastState({ ...toastState, show: false })}
      />
      <Alert
        isOpen={isDeleteAlertOpen}
        onClose={() => setIsDeleteAlertOpen(false)}
        onConfirm={handleDelete}
        title="Delete Channel?"
        description="Are you sure you want to delete this channel? ALL messages will be deleted forever. This action cannot be undone."
        type="danger"
        confirmText="Delete Channel"
      />
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-[32px] font-black text-[#193C1F]">
            Community Channels
          </h1>
          <p className="text-[#8EA087] font-medium">
            Manage community channel topics.
          </p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          Create Channel
        </Button>
      </div>

      <div className="bg-white border border-[#D0D5CB] rounded-2xl overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-[#F7F3ED] text-[11px] text-[#8EA087] font-black uppercase tracking-widest">
            <tr>
              <th className="px-6 py-4">Channel Name</th>
              <th className="px-6 py-4">Type</th>
              <th className="px-6 py-4">Created At</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F7F3ED] text-sm">
            {channels.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  className="px-6 py-12 text-center text-[#8EA087] font-medium"
                >
                  No channels found.
                </td>
              </tr>
            ) : (
              channels.map((ch) => (
                <tr
                  key={ch.id}
                  className="hover:bg-[#F7F3ED]/50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl overflow-hidden bg-[#F7F3ED] flex items-center justify-center border border-[#D0D5CB] shrink-0 relative">
                        {ch.coverUrl ? (
                          <Image
                            src={ch.coverUrl}
                            alt={ch.name}
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        ) : (
                          <span className="text-[#8EA087] font-black text-xs">
                            #{ch.name.charAt(0)}
                          </span>
                        )}
                      </div>
                      <div>
                        <div className="font-bold text-[#193C1F]">
                          #{ch.name}
                        </div>
                        <div className="text-xs text-gray-500 line-clamp-1 max-w-[200px]">
                          {ch.description}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-medium text-gray-600">
                    {ch.type}
                  </td>
                  <td className="px-6 py-4 text-gray-500">
                    {fmtDate(ch.createdAt)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => openUpdateModal(ch)}
                      className="text-sm font-bold text-blue-600 hover:text-blue-700 transition"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => {
                        setChannelToDelete(ch.id);
                        setIsDeleteAlertOpen(true);
                      }}
                      className="text-sm font-bold text-red-600 hover:text-red-700 ml-4 transition"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal
        title="Create Channel"
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            label="Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            placeholder="e.g. stress-relief"
          />
          <div>
            <label className="text-sm font-bold text-[#193C1F] mb-1.5 block">
              Profile Picture
            </label>
            <input
              type="file"
              accept="image/*"
              className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-[#F7F3ED] file:text-[#193C1F] hover:file:bg-[#EDE4D8] transition"
              onChange={(e) =>
                setFormData({
                  ...formData,
                  coverImage: e.target.files?.[0] || null,
                })
              }
            />
          </div>
          <div>
            <label className="text-sm font-bold text-[#193C1F] mb-1.5 block">
              Description
            </label>
            <textarea
              className="w-full bg-[#f9faf7] border border-[#d0d5cb] rounded-xl px-4 py-3 text-sm text-[#193c1f] focus:outline-none focus:border-[#8ea087] focus:ring-1 focus:ring-[#8ea087] transition-shadow resize-none"
              rows={3}
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
            />
          </div>
          <div>
            <label className="text-sm font-bold text-[#193C1F] mb-1.5 block">
              Type
            </label>
            <select
              className="w-full bg-[#f9faf7] border border-[#d0d5cb] rounded-xl px-4 py-3 text-sm text-[#193c1f] focus:outline-none focus:border-[#8ea087] focus:ring-1 focus:ring-[#8ea087]"
              value={formData.type}
              onChange={(e) =>
                setFormData({ ...formData, type: e.target.value })
              }
            >
              <option value="PUBLIC">Public</option>
              <option value="PRIVATE">Private</option>
            </select>
          </div>
          <div className="pt-2 flex justify-end gap-2">
            <Button
              variant="ghost"
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
            >
              Cancel
            </Button>
            <Button loading={loading} type="submit">
              Create
            </Button>
          </div>
        </form>
      </Modal>
      <Modal
        title="Edit Channel"
        isOpen={isUpdateModalOpen}
        onClose={() => setIsUpdateModalOpen(false)}
      >
        <form onSubmit={handleUpdate} className="space-y-4">
          <Input
            label="Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            placeholder="e.g. stress-relief"
          />
          <div>
            <label className="text-sm font-bold text-[#193C1F] mb-1.5 block">
              Description
            </label>
            <textarea
              className="w-full bg-[#f9faf7] border border-[#d0d5cb] rounded-xl px-4 py-3 text-sm text-[#193c1f] focus:outline-none focus:border-[#8ea087] focus:ring-1 focus:ring-[#8ea087] transition-shadow resize-none"
              rows={3}
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
            />
          </div>
          <div>
            <label className="text-sm font-bold text-[#193C1F] mb-1.5 block">
              Type
            </label>
            <select
              className="w-full bg-[#f9faf7] border border-[#d0d5cb] rounded-xl px-4 py-3 text-sm text-[#193c1f] focus:outline-none focus:border-[#8ea087] focus:ring-1 focus:ring-[#8ea087]"
              value={formData.type}
              onChange={(e) =>
                setFormData({ ...formData, type: e.target.value })
              }
            >
              <option value="PUBLIC">Public</option>
              <option value="PRIVATE">Private</option>
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
              Save
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
