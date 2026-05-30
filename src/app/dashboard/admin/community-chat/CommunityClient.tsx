'use client';

import { ForumModal } from '@/components/ForumModal';
import { Alert } from '@/components/alert';
import { Button } from '@/components/button';
import { Toast } from '@/components/toast';
import { MessageSquarePlus } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import React, { useMemo, useState } from 'react';

import { CommunityTable } from './CommunityTable';

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
  const searchParams = useSearchParams();
  const searchQuery = (searchParams.get('search') || '').trim().toLowerCase();
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

  const filteredChannels = useMemo(() => {
    if (!searchQuery) return channels;

    return channels.filter((channel) =>
      [
        channel.name,
        channel.description,
        channel.type,
        String(channel.id),
      ].some((value) => (value ?? '').toLowerCase().includes(searchQuery)),
    );
  }, [channels, searchQuery]);

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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black text-[#193c1f] sm:text-[32px]">
            Community Channels
          </h1>
          <p className="text-[#8ea087] font-medium">
            Manage community channel topics.
          </p>
        </div>
        <Button
          onClick={() => setIsCreateModalOpen(true)}
          className="h-11 w-full shrink-0 whitespace-nowrap rounded-xl px-4 py-0 text-xs font-black uppercase tracking-[0.08em] shadow-sm sm:w-auto"
        >
          <MessageSquarePlus size={16} className="shrink-0" />
          Create Channel
        </Button>
      </div>

      <CommunityTable
        channels={filteredChannels}
        onEdit={openUpdateModal}
        onDelete={(id) => {
          setChannelToDelete(id);
          setIsDeleteAlertOpen(true);
        }}
      />

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
                type: formData.type,
                coverUrl: channels.find((c) => c.id === updateId)?.coverUrl,
              }
            : undefined
        }
      />
    </div>
  );
}
