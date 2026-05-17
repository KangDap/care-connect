'use client';

import { Alert } from '@/components/alert';
import { Header } from '@/components/header';
import { authClient } from '@/lib/auth/auth-client';
import type { ChatMessage } from '@/modules/community-chat/community-chat.types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Loader2,
  MoreVertical,
  Paperclip,
  ShieldCheck,
  UserMinus,
  Users,
  X,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import React, { useEffect, useRef, useState } from 'react';

interface ChannelDetails {
  id: number;
  name: string;
  title?: string;
  description?: string;
  coverUrl?: string;
  type?: string;
  myRole: string | null;
  lastViewedAt?: string | null;
  createdAt?: string | Date;
  _count: { members: number };
  messages: (ChatMessage & {
    roleInChannel?: string;
    replyTo?: { isAnonymous?: boolean } | null;
  })[];
}

export default function CommunityChatContent() {
  const router = useRouter();
  const params = useParams();
  const idParam = params?.id ? Number(params.id) : null;
  const queryClient = useQueryClient();

  // Authentication
  const { data: session, isPending } = authClient.useSession();

  // State Management
  const selectedChannelId = idParam;
  const [messageInput, setMessageInput] = useState('');
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isLogoutAlertOpen, setIsLogoutAlertOpen] = useState(false);
  const [isLeaveAlertOpen, setIsLeaveAlertOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState<number | null>(null);
  const [replyingTo, setReplyingTo] = useState<
    null | ChannelDetails['messages'][number]
  >(null);
  const [inlineToast, setInlineToast] = useState<{
    message: string;
    type: 'info' | 'error';
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const showToast = (message: string, type: 'info' | 'error' = 'info') => {
    setInlineToast({ message, type });
    setTimeout(() => setInlineToast(null), 4000);
  };

  // Sync session
  useEffect(() => {
    if (!isPending && !session?.user) {
      router.push('/login');
    }
  }, [isPending, session, router]);

  // Query: Joined Channels
  const { data: channels = [], isLoading: isLoadingChannels } = useQuery({
    queryKey: ['community-channels'],
    queryFn: async () => {
      const res = await fetch('/api/community-chat');
      if (!res.ok) throw new Error('Failed to fetch channels');
      return res.json();
    },
    refetchInterval: 10000,
  });

  // Query: Channel Details & Messages
  const {
    data: chatData = {
      id: 0,
      messages: [],
      name: '',
      _count: { members: 0 },
      myRole: null,
      lastViewedAt: null,
    } as ChannelDetails,
    isLoading: isLoadingMessages,
  } = useQuery<ChannelDetails>({
    queryKey: ['community-messages', selectedChannelId],
    queryFn: async () => {
      const res = await fetch(`/api/community-chat/${selectedChannelId}`);
      if (!res.ok) throw new Error('Failed to fetch messages');
      return res.json();
    },
    enabled: !!selectedChannelId,
    refetchInterval: 3000,
  });

  // Debug API Response
  useEffect(() => {
    if (chatData) {
      console.log('[DEBUG] chatData:', chatData);
      const sampleMsg = chatData.messages?.[0];
      if (sampleMsg) {
        console.log('[DEBUG] Message sample:', {
          id: sampleMsg.id,
          userId: sampleMsg.user?.id,
          globalRole: sampleMsg.user?.role,
          roleInChannel: (sampleMsg as { roleInChannel?: string })
            .roleInChannel,
        });
      }
    }
  }, [chatData]);

  // Role Logic per Channel
  const ChannelRole = chatData.myRole || 'MEMBER';
  const isOwner = ChannelRole === 'OWNER';
  const isModerator = ChannelRole === 'MODERATOR';

  // --- FIX KICK MUTATION (Sesuai Backend DELETE req.json) ---
  const kickMutation = useMutation({
    mutationFn: async (userId: string) => {
      const res = await fetch(`/api/community-chat/${selectedChannelId}/kick`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to kick user');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['community-messages', selectedChannelId],
      });
      setActiveMenuId(null);
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 200);
    },
    onError: (error: Error) => {
      const msg = error.message.toLowerCase();
      if (
        msg.includes('not a member') ||
        msg.includes('already') ||
        msg.includes('not found') ||
        msg.includes('tidak') ||
        msg.includes('diblokir')
      ) {
        showToast(
          'This member has already been removed from the forum.',
          'info',
        );
      } else {
        showToast(`Could not remove member: ${error.message}`, 'error');
      }
      setActiveMenuId(null);
    },
  });

  // --- FIX ROLE MUTATION (Sesuai Backend PATCH req.json) ---
  const changeRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      const res = await fetch(`/api/community-chat/${selectedChannelId}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to update role');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['community-messages', selectedChannelId],
      });
      setActiveMenuId(null);
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 200);
    },
    onError: (error: Error) => {
      const msg = error.message.toLowerCase();
      if (
        msg.includes('not a member') ||
        msg.includes('banned') ||
        msg.includes('not found') ||
        msg.includes('diblokir') ||
        msg.includes('tidak dapat')
      ) {
        showToast(
          'This member has been removed from the forum and cannot be assigned a role.',
          'info',
        );
      } else {
        showToast(`Could not update role: ${error.message}`, 'error');
      }
      setActiveMenuId(null);
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await fetch(
        `/api/community-chat/${selectedChannelId}/messages`,
        {
          method: 'POST',
          body: formData,
        },
      );
      if (!res.ok) throw new Error('Failed to send message');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['community-messages', selectedChannelId],
      });
      setMessageInput('');
      setMediaFile(null);
      setReplyingTo(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 200);
    },
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 200);
    return () => clearTimeout(timer);
  }, [chatData.messages]);

  const handleSendMessage = () => {
    if (!selectedChannelId || isPending) return;
    if (!messageInput.trim() && !mediaFile) return;
    const formData = new FormData();
    formData.append('content', messageInput);
    formData.append('isAnonymous', String(isAnonymous));
    if (mediaFile) formData.append('media', mediaFile);
    if (replyingTo) formData.append('replyToId', replyingTo.id.toString());
    sendMessageMutation.mutate(formData);
  };

  const executeLeaveRoom = async () => {
    if (!selectedChannelId) return;
    try {
      const res = await fetch(
        `/api/community-chat/${selectedChannelId}/leave`,
        { method: 'POST' },
      );
      if (res.ok) {
        setIsLeaveAlertOpen(false);
        await queryClient.invalidateQueries({
          queryKey: ['community-channels'],
        });
        router.push('/forums');
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await authClient.signOut();
    router.replace('/login');
  };

  if (isPending)
    return (
      <div className="h-screen flex items-center justify-center bg-[#f7f3ed]">
        Loading...
      </div>
    );

  return (
    <div className="h-screen flex flex-col bg-[#f7f3ed] text-[#193c1f] font-sans">
      <style
        dangerouslySetInnerHTML={{
          __html: `
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #D0D5CB; border-radius: 10px; }
      `,
        }}
      />

      <Header
        withSearch={false}
        withLogo={true}
        onLogoutClick={() => setIsLogoutAlertOpen(true)}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-80 flex flex-col border-r border-[#d0d5cb] bg-[#f7f3ed] shrink-0">
          <div className="p-4 shrink-0">
            <h2 className="text-lg font-bold text-[#193c1f]">
              Your Communities
            </h2>
            <p className="text-xs text-[#193c1f] opacity-60">
              {channels.length} communities joined
            </p>
          </div>
          <div className="flex-1 overflow-y-auto px-2 space-y-1">
            {isLoadingChannels ? (
              <p className="text-center text-[#193c1f] text-xs opacity-50 py-4 italic">
                Fetching...
              </p>
            ) : (
              channels
                .filter(
                  (c: {
                    id: number;
                    title?: string;
                    name?: string;
                    isMember?: boolean;
                    unreadCount?: number;
                    _count?: { members: number };
                  }) => c.isMember || c._count?.members !== undefined,
                )
                .map(
                  (channel: {
                    id: number;
                    title?: string;
                    name?: string;
                    isMember?: boolean;
                    unreadCount?: number;
                    _count?: { members: number };
                    coverUrl?: string;
                  }) => (
                    <div
                      key={channel.id}
                      onClick={() =>
                        router.push(`/community-chat/${channel.id}`)
                      }
                      className={`rounded-xl p-3 flex items-start space-x-3 cursor-pointer transition ${selectedChannelId === channel.id ? 'bg-[#d0d5cb]' : 'hover:bg-[#ede4d8]'}`}
                    >
                      <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shrink-0 border border-[#D0D5CB] text-[#8EA087] overflow-hidden relative">
                        {channel.coverUrl ? (
                          <Image
                            src={channel.coverUrl}
                            alt={channel.title || channel.name || 'Forum'}
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        ) : (
                          <Users size={20} />
                        )}
                      </div>
                      <div className="flex-1 min-w-0 flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-semibold text-[#193c1f] truncate">
                            {channel.title || channel.name}
                          </h3>
                          <p className="text-[10px] text-[#8ea087] font-bold uppercase tracking-wider mt-1">
                            {channel._count?.members || 0} Members
                          </p>
                        </div>
                        {!!channel.unreadCount && channel.unreadCount > 0 && (
                          <div className="bg-red-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full shrink-0 ml-2">
                            {channel.unreadCount > 99
                              ? '99+'
                              : channel.unreadCount}
                          </div>
                        )}
                      </div>
                    </div>
                  ),
                )
            )}
          </div>
          <div className="p-4 border-t border-[#d0d5cb] shrink-0">
            <Link
              href="/forums"
              className="w-full py-2.5 bg-[#8ea087] text-white font-semibold rounded-xl flex items-center justify-center space-x-2 transition hover:brightness-110 shadow-sm"
            >
              <span>Discover New Forums</span>
            </Link>
          </div>
        </aside>

        {/* Main Chat Area */}
        {selectedChannelId ? (
          <main className="flex-1 flex flex-col bg-white min-w-0">
            <header className="px-6 py-3 border-b border-[#d0d5cb] flex items-center justify-between bg-white shrink-0">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg overflow-hidden bg-[#F7F3ED] flex items-center justify-center border border-[#D0D5CB] shrink-0 relative">
                  {chatData.coverUrl ? (
                    <Image
                      src={chatData.coverUrl}
                      alt={chatData.name || chatData.title || 'Forum'}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  ) : (
                    <Users size={16} className="text-[#8EA087]" />
                  )}
                </div>
                <h3 className="font-bold text-[#193C1F]">
                  {chatData.name || chatData.title || 'Forum'}
                </h3>
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                <span className="text-[10px] font-bold text-[#8ea087] uppercase tracking-widest">
                  {chatData._count?.members} active
                </span>

                {/* Real-time Role Label */}
                <span
                  className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                    ChannelRole === 'OWNER'
                      ? 'bg-[#193c1f] text-white'
                      : ChannelRole === 'MODERATOR'
                        ? 'bg-[#8ea087] text-white'
                        : 'bg-[#d0d5cb] text-[#193c1f]'
                  }`}
                >
                  {ChannelRole === 'OWNER'
                    ? 'Owner'
                    : ChannelRole === 'MODERATOR'
                      ? 'Moderator'
                      : 'Member'}
                </span>
              </div>
              <button
                onClick={() => setIsLeaveAlertOpen(true)}
                className="text-[10px] font-black text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg border border-red-100 transition-colors uppercase tracking-[0.15em]"
              >
                Leave Forum
              </button>
            </header>

            <section className="flex-1 overflow-y-auto p-6 space-y-8 bg-[#f7f3ed]">
              {isLoadingMessages ? (
                <p className="text-center text-[#193c1f] text-xs opacity-50 py-4 animate-pulse">
                  Loading discussion...
                </p>
              ) : chatData.messages.length === 0 ? (
                (() => {
                  const roomDateRaw = chatData.createdAt;
                  const roomDate = roomDateRaw
                    ? new Date(roomDateRaw).toLocaleDateString([], {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })
                    : 'Unknown Date';
                  return (
                    <div className="space-y-4">
                      <div className="flex justify-center my-6">
                        <span className="bg-[#d0d5cb] bg-opacity-30 text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full text-[#193c1f] opacity-60">
                          {roomDate}
                        </span>
                      </div>
                      <p className="text-center text-[#193c1f] text-xs opacity-50 py-4">
                        No messages yet. Start the conversation!
                      </p>
                    </div>
                  );
                })()
              ) : (
                chatData.messages.map((chat, index) => {
                  const isMe = session?.user?.id === chat.user.id;
                  const time = new Date(
                    chat.timestamp ?? new Date(),
                  ).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  const currentChatDate = new Date(
                    chat.timestamp,
                  ).toLocaleDateString([], {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  });

                  let showDatePill = false;
                  if (index === 0) {
                    showDatePill = true;
                  } else {
                    const prevChatDate = new Date(
                      chatData.messages[index - 1].timestamp,
                    ).toLocaleDateString([], {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    });
                    if (currentChatDate !== prevChatDate) {
                      showDatePill = true;
                    }
                  }
                  const targetRoleInChannel = chat.roleInChannel || 'MEMBER';
                  const targetIsBanned = targetRoleInChannel === 'BANNED';

                  // Can kick: not me, caller is owner or moderator kicking a plain member
                  const canKick =
                    !isMe &&
                    (isOwner ||
                      (isModerator && targetRoleInChannel === 'MEMBER'));

                  // Can manage role: owner only, not me
                  const canManageRole = isOwner && !isMe;

                  // Determine if we need an unread divider
                  let showUnreadDivider = false;
                  const lastViewedAtStr = chatData.lastViewedAt || null;
                  if (lastViewedAtStr && !isMe) {
                    const chatTime = new Date(chat.timestamp).getTime();
                    const lastViewedTime = new Date(lastViewedAtStr).getTime();

                    if (chatTime > lastViewedTime) {
                      // Check if this is the FIRST unread message
                      const index = chatData.messages.findIndex(
                        (m) =>
                          new Date(m.timestamp).getTime() > lastViewedTime &&
                          m.user.id !== session?.user?.id,
                      );
                      if (chatData.messages[index]?.id === chat.id) {
                        showUnreadDivider = true;
                      }
                    }
                  }

                  if (chat.isSystem) {
                    return (
                      <React.Fragment key={chat.id}>
                        {showDatePill && (
                          <div className="flex justify-center my-6">
                            <span className="bg-[#d0d5cb] bg-opacity-30 text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full text-[#193c1f] opacity-60">
                              {currentChatDate}
                            </span>
                          </div>
                        )}
                        {showUnreadDivider && (
                          <div className="flex items-center justify-center my-6">
                            <div className="h-px bg-red-300 flex-1"></div>
                            <span className="bg-red-50 text-red-600 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest mx-3 border border-red-200">
                              Unread Messages
                            </span>
                            <div className="h-px bg-red-300 flex-1"></div>
                          </div>
                        )}
                        <div className="flex justify-center my-4">
                          <span className="bg-[#EBE6DE] text-[#193C1F] opacity-70 text-[10px] font-bold px-4 py-1.5 rounded-full uppercase tracking-widest text-center">
                            {chat.content}
                          </span>
                        </div>
                      </React.Fragment>
                    );
                  }

                  return (
                    <React.Fragment key={chat.id}>
                      {showDatePill && (
                        <div className="flex justify-center my-6">
                          <span className="bg-[#d0d5cb] bg-opacity-30 text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full text-[#193c1f] opacity-60">
                            {currentChatDate}
                          </span>
                        </div>
                      )}
                      {showUnreadDivider && (
                        <div className="flex items-center justify-center my-6">
                          <div className="h-px bg-red-300 flex-1"></div>
                          <span className="bg-red-50 text-red-600 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest mx-3 border border-red-200">
                            Unread Messages
                          </span>
                          <div className="h-px bg-red-300 flex-1"></div>
                        </div>
                      )}
                      <div
                        className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} group relative`}
                      >
                        <div
                          className={`flex items-center space-x-2 ${isMe ? 'mr-10' : 'ml-10'} mb-1`}
                        >
                          <span className="text-xs font-bold text-[#193C1F] opacity-70">
                            {chat.isAnonymous
                              ? 'Anonymous'
                              : chat.user.name || 'User'}
                            {targetRoleInChannel === 'OWNER' && (
                              <span className="ml-2 text-[9px] bg-[#193C1F] text-white px-1.5 py-0.5 rounded font-bold uppercase tracking-widest">
                                Owner
                              </span>
                            )}
                            {targetRoleInChannel === 'MODERATOR' && (
                              <span className="ml-2 text-[9px] bg-[#8EA087] text-white px-1.5 py-0.5 rounded font-bold uppercase tracking-widest">
                                Moderator
                              </span>
                            )}
                          </span>
                        </div>

                        <div
                          className={`flex items-start ${isMe ? 'flex-row-reverse' : 'space-x-3'}`}
                        >
                          <div className="w-8 h-8 rounded-full mt-1 flex items-center justify-center border border-[#D0D5CB] shrink-0 overflow-hidden">
                            {chat.isAnonymous ? (
                              <div className="bg-[#D0D5CB] w-full h-full flex items-center justify-center text-white text-[10px]">
                                ?
                              </div>
                            ) : (
                              <Image
                                alt="Avatar"
                                width={32}
                                height={32}
                                className="object-cover w-full h-full"
                                unoptimized
                                src={
                                  chat.user.image ||
                                  'https://static.vecteezy.com/system/resources/previews/009/292/244/original/default-avatar-icon-of-social-media-user-vector.jpg'
                                }
                              />
                            )}
                          </div>

                          <div className="flex flex-col max-w-xl relative">
                            {chat.replyTo && (
                              <div
                                className={`${isMe ? 'bg-[#8EA087] bg-opacity-20 border-r-4 text-right rounded-tl-xl' : 'bg-[#EDE4D8] bg-opacity-50 border-l-4 rounded-tr-xl'} border-[#8EA087] p-2 mb-1 text-[11px] text-[#193C1F] opacity-80 line-clamp-2`}
                              >
                                <span className="font-bold block">
                                  {chat.replyTo.isAnonymous
                                    ? 'Anonymous'
                                    : chat.replyTo.user?.name || 'User'}
                                </span>
                                {chat.replyTo.content}
                              </div>
                            )}
                            <div
                              className={`rounded-2xl p-4 text-sm shadow-sm border flex flex-col gap-2 ${isMe ? 'bg-[#8EA087] text-white rounded-tr-none border-transparent' : 'bg-[#EDE4D8] text-[#193C1F] rounded-tl-none border-transparent'}`}
                            >
                              {chat.mediaUrl && (
                                <div className="overflow-hidden rounded-xl bg-black/5">
                                  {chat.mediaUrl.match(
                                    /\.(jpeg|jpg|gif|png|webp)(\?.*)?$/i,
                                  ) ? (
                                    <Image
                                      width={300}
                                      height={300}
                                      unoptimized
                                      src={chat.mediaUrl}
                                      alt="Attached media"
                                      className="max-w-full h-auto max-h-64 object-contain"
                                    />
                                  ) : (
                                    <a
                                      href={chat.mediaUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-center space-x-2 p-3 hover:bg-black/10 transition"
                                    >
                                      <Paperclip size={18} />
                                      <span className="text-xs font-bold underline truncate">
                                        View Attachment
                                      </span>
                                    </a>
                                  )}
                                </div>
                              )}
                              {chat.content && <span>{chat.content}</span>}
                            </div>

                            {/* Message Actions (Reply & Moderation) */}
                            <div
                              className={`absolute top-0 ${isMe ? 'right-full mr-2' : 'left-full ml-2'} opacity-0 group-hover:opacity-100 transition-opacity z-50 flex items-center h-full space-x-1`}
                            >
                              <button
                                onClick={() => setReplyingTo(chat)}
                                className="w-8 h-8 flex items-center justify-center text-[#193C1F] opacity-40 hover:opacity-100 hover:bg-gray-200 rounded-full transition-all shrink-0"
                                title="Reply"
                              >
                                <svg
                                  className="w-5 h-5"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
                                  />
                                </svg>
                              </button>

                              {/* Only show moderation menu if caller has permissions */}
                              {(canKick || canManageRole) && (
                                <div className="relative">
                                  <button
                                    onClick={() =>
                                      setActiveMenuId(
                                        activeMenuId === chat.id
                                          ? null
                                          : chat.id,
                                      )
                                    }
                                    className="w-8 h-8 flex items-center justify-center hover:bg-gray-200 rounded-full transition-colors shrink-0"
                                  >
                                    <MoreVertical size={16} />
                                  </button>
                                  {activeMenuId === chat.id && (
                                    <div
                                      className={`absolute z-[100] mt-1 w-40 bg-white border border-[#D0D5CB] shadow-2xl rounded-xl overflow-hidden py-1 ${isMe ? 'left-0' : 'right-0'}`}
                                    >
                                      {targetIsBanned ? (
                                        <div className="px-4 py-3 text-[10px] font-black text-gray-400 flex items-center gap-2 uppercase tracking-tight italic">
                                          <ShieldCheck size={14} /> Member
                                          Removed
                                        </div>
                                      ) : (
                                        <>
                                          {canKick && (
                                            <button
                                              onClick={() =>
                                                kickMutation.mutate(
                                                  chat.user.id,
                                                )
                                              }
                                              className="w-full text-left px-4 py-2.5 text-[11px] font-bold text-red-600 hover:bg-red-50 flex items-center gap-2 uppercase tracking-tight border-b border-gray-50"
                                            >
                                              <UserMinus size={14} /> Kick User
                                            </button>
                                          )}
                                          {canManageRole && (
                                            <button
                                              onClick={() =>
                                                changeRoleMutation.mutate({
                                                  userId: chat.user.id,
                                                  role:
                                                    targetRoleInChannel ===
                                                    'MODERATOR'
                                                      ? 'MEMBER'
                                                      : 'MODERATOR',
                                                })
                                              }
                                              className="w-full text-left px-4 py-2.5 text-[11px] font-bold text-[#193C1F] hover:bg-gray-50 flex items-center gap-2 uppercase tracking-tight"
                                            >
                                              <ShieldCheck size={14} />{' '}
                                              {targetRoleInChannel ===
                                              'MODERATOR'
                                                ? 'Demote to Member'
                                                : 'Make Moderator'}
                                            </button>
                                          )}
                                        </>
                                      )}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        <span
                          className={`text-[10px] text-[#193C1F] opacity-40 ${isMe ? 'mr-11' : 'ml-11'} mt-1`}
                        >
                          {time}
                        </span>
                      </div>
                    </React.Fragment>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </section>

            {/* Inline Toast Notification */}
            {inlineToast && (
              <div
                className={`mx-6 mt-2 mb-0 px-4 py-3 rounded-xl text-sm font-semibold flex items-center gap-3 border shadow-sm animate-in slide-in-from-bottom-2 duration-200 ${
                  inlineToast.type === 'info'
                    ? 'bg-blue-50 border-blue-200 text-blue-700'
                    : 'bg-red-50 border-red-200 text-red-700'
                }`}
              >
                <span className="text-base">
                  {inlineToast.type === 'info' ? 'ℹ️' : '⚠️'}
                </span>
                <span className="flex-1">{inlineToast.message}</span>
                <button
                  onClick={() => setInlineToast(null)}
                  className="opacity-50 hover:opacity-100"
                >
                  <X size={14} />
                </button>
              </div>
            )}

            {ChannelRole === 'BANNED' ? (
              <footer className="px-6 py-4 bg-white border-t border-[#d0d5cb] shrink-0">
                <div className="bg-[#f7f3ed] border border-red-200 rounded-2xl px-6 py-3 flex flex-col items-center justify-center text-center space-y-1 shadow-sm">
                  <div className="flex items-center space-x-2 text-red-600">
                    <ShieldCheck size={20} />
                    <span className="font-bold text-sm uppercase tracking-wider">
                      Access Denied
                    </span>
                  </div>
                  <p className="text-xs text-[#193c1f] opacity-60">
                    You have been removed from this community and can no longer
                    participate in this discussion.
                  </p>
                </div>
              </footer>
            ) : (
              <footer className="p-6 bg-white border-t border-[#d0d5cb] shrink-0 flex flex-col space-y-3">
                {replyingTo && (
                  <div className="flex items-center justify-between bg-[#f7f3ed] border-l-4 border-[#8ea087] px-4 py-2 rounded-xl">
                    <div className="overflow-hidden">
                      <span className="text-[10px] font-bold text-[#8ea087] block uppercase">
                        Replying to{' '}
                        {replyingTo.isAnonymous
                          ? 'Anonymous'
                          : replyingTo.user?.name || 'User'}
                      </span>
                      <p className="text-xs text-[#193c1f] truncate opacity-70">
                        {replyingTo.content}
                      </p>
                    </div>
                    <button
                      onClick={() => setReplyingTo(null)}
                      className="opacity-40 hover:opacity-100"
                    >
                      <X size={16} />
                    </button>
                  </div>
                )}

                {mediaFile && (
                  <div className="flex items-center justify-between bg-[#f7f3ed] border border-[#8ea087] rounded-xl px-4 py-2 w-max shadow-sm">
                    <span className="text-xs text-[#193c1f] font-semibold">
                      {mediaFile.name} ({(mediaFile.size / 1024).toFixed(1)}KB)
                    </span>
                    <button
                      onClick={() => setMediaFile(null)}
                      className="ml-4 text-red-500 bg-red-100 p-1 rounded-full"
                    >
                      <X size={12} />
                    </button>
                  </div>
                )}

                <div className="flex items-center space-x-4">
                  <div className="flex-1 relative flex flex-col bg-[#f7f3ed] border border-[#d0d5cb] rounded-2xl p-1 focus-within:border-[#8ea087]">
                    <div className="flex items-center px-3 py-1 border-b border-[#d0d5cb] mb-1 justify-between">
                      <button
                        onClick={() => setIsAnonymous(!isAnonymous)}
                        className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded ${isAnonymous ? 'bg-[#193c1f] text-white' : 'text-[#8ea087]'}`}
                      >
                        {isAnonymous ? 'Anonymous ON' : 'Public Mode'}
                      </button>
                      <span className="text-[8px] font-bold opacity-40 uppercase tracking-tighter">
                        Posting as:{' '}
                        {ChannelRole === 'OWNER'
                          ? 'Owner'
                          : ChannelRole === 'MODERATOR'
                            ? 'Moderator'
                            : 'Member'}
                      </span>
                    </div>
                    <div className="flex items-center px-3 py-2">
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={(e) =>
                          setMediaFile(e.target.files?.[0] || null)
                        }
                        className="hidden"
                      />
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="text-[#193c1f] opacity-40 hover:opacity-70 mr-3"
                      >
                        <Paperclip size={20} />
                      </button>
                      <input
                        className="bg-transparent border-none focus:ring-0 text-sm text-[#193c1f] w-full outline-none"
                        placeholder="Share your thoughts..."
                        type="text"
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        onKeyDown={(e) =>
                          e.key === 'Enter' && handleSendMessage()
                        }
                      />
                    </div>
                  </div>
                  <button
                    onClick={handleSendMessage}
                    disabled={
                      sendMessageMutation.isPending ||
                      (!messageInput.trim() && !mediaFile)
                    }
                    className="w-12 h-12 bg-[#8ea087] text-white rounded-2xl flex items-center justify-center shadow-sm hover:brightness-110 disabled:opacity-50"
                  >
                    {sendMessageMutation.isPending ? (
                      <Loader2 className="animate-spin" />
                    ) : (
                      <svg
                        className="w-6 h-6 transform rotate-90"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                      </svg>
                    )}
                  </button>
                </div>
              </footer>
            )}
          </main>
        ) : (
          <main className="flex-1 flex flex-col bg-white items-center justify-center">
            <Users size={64} className="opacity-20 mb-4" />
            <p className="text-sm font-bold opacity-40 italic text-center">
              Select a community forum
            </p>
          </main>
        )}
      </div>

      <Alert
        isOpen={isLogoutAlertOpen}
        onClose={() => setIsLogoutAlertOpen(false)}
        onConfirm={handleLogout}
        type="danger"
        title="Logout Session"
        description="Are you sure you want to end ва session?"
        confirmText={isLoggingOut ? 'Ending...' : 'Log Out'}
      />
      <Alert
        isOpen={isLeaveAlertOpen}
        onClose={() => setIsLeaveAlertOpen(false)}
        onConfirm={executeLeaveRoom}
        type="danger"
        title="Leave Community"
        description="By leaving, you will no longer receive updates."
        confirmText="Leave Now"
      />
    </div>
  );
}
