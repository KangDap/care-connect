'use client';

import { ForumModal } from '@/components/ForumModal';
import { Alert } from '@/components/alert';
import { Badge } from '@/components/badge';
import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { Toast } from '@/components/toast';
import { MessageSquarePlus, Pencil, Trash2 } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';

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

  const handleCreate = async (data: FormData) => {
    setLoading(true);
    try {
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

  const handleUpdate = async (data: FormData) => {
    if (!updateId) return;
    setLoading(true);
    try {
      data.append('id', updateId.toString());
      const res = await fetch('/api/dashboard/admin/community-chat', {
        method: 'PATCH',
        body: data,
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
          <h1 className="text-[32px] font-black text-[#193c1f]">
            Community Channels
          </h1>
          <p className="text-[#8ea087] font-medium">
            Manage community channel topics.
          </p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <MessageSquarePlus size={16} />
          Create Channel
        </Button>
      </div>

      <Card className="overflow-hidden rounded-2xl p-0">
        <table className="w-full text-left">
          <thead className="bg-[#f7f3ed] text-[11px] text-[#8ea087] font-black uppercase tracking-widest">
            <tr>
              <th className="px-6 py-4">Channel Name</th>
              <th className="px-6 py-4">Type</th>
              <th className="px-6 py-4">Created At</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f7f3ed] text-sm">
            {channels.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  className="px-6 py-12 text-center text-[#8ea087] font-medium"
                >
                  No channels found.
                </td>
              </tr>
            ) : (
              channels.map((ch) => (
                <tr
                  key={ch.id}
                  className="hover:bg-[#f7f3ed]/50 transition-colors"
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
                    <Badge>{ch.type}</Badge>
                  </td>
                  <td className="px-6 py-4 text-gray-500">
                    {fmtDate(ch.createdAt)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-end gap-2">
                      <Button
                        onClick={() => openUpdateModal(ch)}
                        variant="outline"
                        className="rounded-xl px-3 py-2 text-xs normal-case tracking-normal text-blue-700 shadow-none"
                      >
                        <Pencil size={14} />
                        Edit
                      </Button>
                      <Button
                        onClick={() => {
                          setChannelToDelete(ch.id);
                          setIsDeleteAlertOpen(true);
                        }}
                        variant="outline"
                        className="rounded-xl border-red-200 px-3 py-2 text-xs normal-case tracking-normal text-red-600 shadow-none hover:bg-red-50"
                      >
                        <Trash2 size={14} />
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Card>

      <ForumModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreate}
        loading={loading}
      />

      <ForumModal
        title="Edit Channel"
        isOpen={isUpdateModalOpen}
        onClose={() => {
          setIsUpdateModalOpen(false);
          setUpdateId(null);
        }}
        onSubmit={handleUpdate}
        loading={loading}
        initialData={
          updateId
            ? {
                name: formData.name,
                description: formData.description,
                category: '', // Channels don't have category yet
                type: formData.type,
                coverUrl: channels.find((c) => c.id === updateId)?.coverUrl,
              }
            : undefined
        }
      />
    </div>
  );
}
