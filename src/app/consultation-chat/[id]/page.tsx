'use client';

import { Alert } from '@/components/alert';
import { Button } from '@/components/button';
import { Header } from '@/components/header';
import { Input } from '@/components/input';
import { authClient } from '@/lib/auth/auth-client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Paperclip, Send, X } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import React, { useEffect, useRef, useState } from 'react';

export default function ConsultationChatContent() {
  const router = useRouter();
  const params = useParams();
  const idParam = params?.id ? Number(params.id) : null;

  const [isLogoutAlertOpen, setIsLogoutAlertOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  type AuthUser = {
    id: string;
    name: string;
    image?: string | null;
    role: string;
  };
  const { data: session, isPending } = authClient.useSession();
  const queryClient = useQueryClient();

  // Use idParam directly throughout the component
  const selectedConsultationId = idParam;
  const [messageInput, setMessageInput] = useState('');
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  type ChatUser = {
    id: string;
    name: string;
    role: string;
    image?: string | null;
  };
  type ChatMessage = {
    id: number;
    user: ChatUser;
    isAnonymous: boolean;
    content: string;
    timestamp: string;
    replyTo?: {
      content: string;
      user: ChatUser;
      isAnonymous: boolean;
    } | null;
    mediaUrl?: string | null;
  };
  type Consultation = {
    id: number;
    userId: string;
    isAnonymous: boolean;
    date?: string;
    createdAt: string;
    psychologist: { name: string; image: string | null };
    user: { name: string; image: string | null };
    latestChat: { timestamp: string; content: string } | null;
  };

  const [replyingTo, setReplyingTo] = useState<null | ChatMessage>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await authClient.signOut();
    router.replace('/login');
    router.refresh();
  };

  useEffect(() => {
    if (!isPending && !session?.user) {
      router.push('/login');
    }
  }, [isPending, session, router]);

  // Query: Active Consultations
  const { data: activeConsultations = [], isLoading: isLoadingConsultations } =
    useQuery({
      queryKey: ['active-consultations'],
      queryFn: async () => {
        const res = await fetch('/api/consultation-chat');
        if (!res.ok) throw new Error('Failed to fetch consultations');
        return res.json();
      },
      refetchInterval: 10000,
    });

  // Query: Chat Messages
  const {
    data: chatData = { messages: [], isExpired: false },
    isLoading: isLoadingMessages,
  } = useQuery({
    queryKey: ['chat-messages', selectedConsultationId],
    queryFn: async () => {
      const res = await fetch(
        `/api/consultation-chat?consultationId=${selectedConsultationId}`,
      );
      if (!res.ok) throw new Error('Failed to fetch messages');
      return res.json();
    },
    enabled: !!selectedConsultationId,
    refetchInterval: 3000,
  });

  const chatMessages = chatData.messages;
  const isExpired = chatData.isExpired;

  // Mutation: Send Message
  const sendMessageMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await fetch('/api/consultation-chat', {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) throw new Error('Failed to send message');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['chat-messages', selectedConsultationId],
      });
      setMessageInput('');
      setMediaFile(null);
      setReplyingTo(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    },
  });

  const handleSendMessage = () => {
    if (!selectedConsultationId) return;
    if (!messageInput.trim() && !mediaFile) return;

    const currentConsultation = activeConsultations.find(
      (c: Consultation) => c.id === selectedConsultationId,
    );

    const formData = new FormData();
    formData.append('consultationId', selectedConsultationId.toString());
    formData.append('content', messageInput);
    if (currentConsultation?.isAnonymous) {
      formData.append('isAnonymous', 'true');
    }
    if (mediaFile) {
      formData.append('media', mediaFile);
    }
    if (replyingTo) {
      formData.append('replyToId', replyingTo.id.toString());
    }

    sendMessageMutation.mutate(formData);
  };

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  if (isPending || !session?.user) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#f7f3ed]">
        <p className="text-[#193c1f] font-semibold text-lg animate-pulse">
          Loading chat...
        </p>
      </div>
    );
  }

  const handleRoomClick = (consultationId: number) => {
    router.push(`/consultation-chat/${consultationId}`);
  };

  const currentConsultation = activeConsultations.find(
    (c: Consultation) => c.id === selectedConsultationId,
  );

  const getReplyDisplayName = (
    reply: ChatMessage | NonNullable<ChatMessage['replyTo']>,
  ) => {
    if (!reply) return 'Unknown';
    const isReplyMe = reply.user.id === session?.user?.id;
    const isReplySenderPatient =
      reply.user.id === currentConsultation?.userId ||
      reply.user.role === 'USER';
    const isConsultationAnonymous = currentConsultation?.isAnonymous;

    const shouldMaskReply =
      reply.isAnonymous ||
      (!isReplyMe && isReplySenderPatient && isConsultationAnonymous);

    return shouldMaskReply
      ? 'Anonymous'
      : isReplyMe
        ? 'Me'
        : reply.user.name || 'Unknown';
  };

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
              Active Consultations
            </h2>
            <p className="text-xs text-[#193c1f] opacity-60">
              {activeConsultations.length} ongoing sessions
            </p>
          </div>
          <div className="flex-1 overflow-y-auto px-2 space-y-1">
            {isLoadingConsultations ? (
              <p className="text-center text-[#193c1f] text-xs opacity-50 py-4">
                Loading...
              </p>
            ) : activeConsultations.length === 0 ? (
              <p className="text-center text-[#193c1f] text-xs opacity-50 py-4">
                No active consultations.
              </p>
            ) : (
              activeConsultations.map((consultation: Consultation) => {
                // Determine the other user
                const isUserClient = consultation.userId === session.user.id;
                const isAnonymous = consultation.isAnonymous;
                const otherPerson = isUserClient
                  ? consultation.psychologist
                  : consultation.user;

                // Mask user name if anonymous and viewer is not the user itself
                const displayName =
                  !isUserClient && isAnonymous
                    ? 'Anonymous'
                    : otherPerson?.name || 'Unknown User';

                const displayImage =
                  !isUserClient && isAnonymous
                    ? 'https://static.vecteezy.com/system/resources/previews/009/292/244/original/default-avatar-icon-of-social-media-user-vector.jpg'
                    : otherPerson?.image ||
                      'https://lh3.googleusercontent.com/aida-public/AB6AXuBEco0p3MDuxX90l9mF4SA0D5WmC84PJazeYS6jFlgGu6Z-L_HxYF4go8gTd7ImSPN8Yg9IYm5nWoKdCW7Azu9bfAq8XhByCCA0h4C3l_yC4OkTfQRzppjGbvuLkHC6-rZVaScgJcjaRYm350CGpQyEHirHU0mOph6TPnQxShR39Kv0qls4iqEaza6VOZncpHcdH6aQXKwLy1R587WGI_FxQ5evlw3n9GBfy59SZ_CAlBuxXdF87MFefAimDan5A6GOVUKeBPYHqA';

                const previewDateRaw =
                  consultation.latestChat?.timestamp ??
                  consultation.date ??
                  consultation.createdAt;
                const previewDate = previewDateRaw
                  ? new Date(previewDateRaw).toLocaleDateString([], {
                      month: 'short',
                      day: 'numeric',
                    })
                  : '';

                const previewText =
                  consultation.latestChat?.content || 'Start a conversation...';

                return (
                  <div
                    key={consultation.id}
                    onClick={() => handleRoomClick(consultation.id)}
                    className={`rounded-xl p-3 flex items-start space-x-3 cursor-pointer transition ${
                      selectedConsultationId === consultation.id
                        ? 'bg-[#d0d5cb]'
                        : 'hover:bg-[#ede4d8]'
                    }`}
                  >
                    <Image
                      alt={displayName}
                      width={40}
                      height={40}
                      className="w-10 h-10 rounded-full object-cover bg-white shrink-0"
                      src={displayImage}
                      unoptimized
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline">
                        <h3 className="text-sm font-semibold text-[#193c1f] truncate pr-2">
                          {displayName}
                        </h3>
                        <span className="text-[10px] text-[#193c1f] opacity-50 shrink-0">
                          {previewDate}
                        </span>
                      </div>
                      <p className="text-xs text-[#193c1f] opacity-70 truncate mt-1">
                        {previewText}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="p-4 border-t border-[#d0d5cb] shrink-0">
            <Link
              href="/dashboard/consultations"
              className="w-full py-2.5 bg-[#8ea087] text-white font-semibold rounded-xl flex items-center justify-center space-x-2 transition hover:brightness-110 shadow-sm"
            >
              <span>View All Schedules</span>
            </Link>
          </div>
        </aside>

        {/* Main Chat Area */}
        {selectedConsultationId ? (
          <main className="flex-1 flex flex-col bg-white min-w-0">
            <section className="flex-1 overflow-y-auto p-6 space-y-8 bg-[#f7f3ed]">
              {isLoadingMessages ? (
                <p className="text-center text-[#193c1f] text-xs opacity-50 py-4 animate-pulse">
                  Loading messages...
                </p>
              ) : chatMessages.length === 0 ? (
                (() => {
                  const currentConsultation = activeConsultations.find(
                    (c: Consultation) => c.id === selectedConsultationId,
                  );
                  const roomDateRaw =
                    currentConsultation?.date ?? currentConsultation?.createdAt;
                  const roomDate = roomDateRaw
                    ? new Date(roomDateRaw).toLocaleDateString([], {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })
                    : 'Unknown Date';
                  return (
                    <>
                      <div className="flex justify-center my-4">
                        <span className="bg-[#d0d5cb] bg-opacity-30 text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full text-[#193c1f] opacity-60">
                          {roomDate}
                        </span>
                      </div>
                      <p className="text-center text-[#193c1f] text-xs opacity-50 py-4">
                        No messages yet. Say hello!
                      </p>
                    </>
                  );
                })()
              ) : (
                chatMessages.map((chat: ChatMessage, index: number) => {
                  const isMe = chat.user.id === session.user.id;
                  const isPsychologist =
                    (session.user as unknown as AuthUser).role ===
                    'PSYCHOLOGIST';
                  const isSenderPatient =
                    chat.user.id === currentConsultation?.userId ||
                    chat.user.role === 'USER';
                  const isConsultationAnonymous =
                    currentConsultation?.isAnonymous;

                  // Mask name if:
                  // 1. Message is explicitly marked anonymous
                  // 2. OR I am a psychologist and the sender is the patient in an anonymous consultation
                  const shouldMask =
                    chat.isAnonymous ||
                    (isPsychologist &&
                      isSenderPatient &&
                      isConsultationAnonymous);

                  const displayName = shouldMask
                    ? 'Anonymous'
                    : isMe
                      ? 'Me'
                      : chat.user.name || 'Unknown';

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
                      chatMessages[index - 1].timestamp,
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

                  // Format time
                  const time = new Date(chat.timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  return (
                    <React.Fragment key={chat.id}>
                      {showDatePill && (
                        <div className="flex justify-center my-4">
                          <span className="bg-[#d0d5cb] bg-opacity-30 text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full text-[#193c1f] opacity-60">
                            {currentChatDate}
                          </span>
                        </div>
                      )}
                      {(() => {
                        if (!isMe) {
                          return (
                            <div
                              key={chat.id}
                              className="flex flex-col space-y-1 group relative"
                            >
                              <div className="flex items-center space-x-2 ml-10 mb-1">
                                <span className="text-xs font-bold text-[#193c1f] opacity-70">
                                  {displayName}
                                  {chat.user.role === 'PSYCHOLOGIST' && (
                                    <span className="ml-2 text-[9px] bg-[#8ea087] text-white px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider">
                                      Psychologist
                                    </span>
                                  )}
                                </span>
                              </div>
                              <div className="flex items-start space-x-3">
                                <Image
                                  alt="Avatar"
                                  width={32}
                                  height={32}
                                  className="w-8 h-8 rounded-full mt-1 object-cover"
                                  src={
                                    shouldMask
                                      ? 'https://static.vecteezy.com/system/resources/previews/009/292/244/original/default-avatar-icon-of-social-media-user-vector.jpg'
                                      : chat.user.image ||
                                        'https://lh3.googleusercontent.com/aida-public/AB6AXuBEco0p3MDuxX90l9mF4SA0D5WmC84PJazeYS6jFlgGu6Z-L_HxYF4go8gTd7ImSPN8Yg9IYm5nWoKdCW7Azu9bfAq8XhByCCA0h4C3l_yC4OkTfQRzppjGbvuLkHC6-rZVaScgJcjaRYm350CGpQyEHirHU0mOph6TPnQxShR39Kv0qls4iqEaza6VOZncpHcdH6aQXKwLy1R587WGI_FxQ5evlw3n9GBfy59SZ_CAlBuxXdF87MFefAimDan5A6GOVUKeBPYHqA'
                                  }
                                  unoptimized
                                />
                                <div className="flex flex-col max-w-xl">
                                  {chat.replyTo && (
                                    <div className="bg-[#ede4d8] bg-opacity-50 border-l-4 border-[#8ea087] p-2 mb-1 rounded-tr-xl text-[11px] text-[#193c1f] opacity-80 line-clamp-2">
                                      <span className="font-bold block">
                                        {getReplyDisplayName(chat.replyTo)}
                                      </span>
                                      {chat.replyTo.content}
                                    </div>
                                  )}
                                  <div className="bg-[#ede4d8] text-[#193c1f] rounded-2xl p-4 text-sm shadow-sm leading-relaxed whitespace-pre-wrap relative overflow-hidden">
                                    {chat.content}
                                    {chat.mediaUrl && (
                                      <div className="mt-2">
                                        {chat.mediaUrl.match(
                                          /\.(png|jpe?g)$/i,
                                        ) ? (
                                          <a
                                            href={chat.mediaUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="block relative max-w-full h-auto"
                                          >
                                            <Image
                                              src={chat.mediaUrl}
                                              alt="Attached Media"
                                              width={400}
                                              height={300}
                                              className="rounded-lg object-contain bg-white"
                                              unoptimized
                                            />
                                          </a>
                                        ) : (
                                          <a
                                            href={chat.mediaUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center space-x-2 text-[#8ea087] hover:underline bg-white p-2 border border-[#d0d5cb] rounded-xl"
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
                                                d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                                              ></path>
                                            </svg>
                                            <span className="text-xs">
                                              View File Attachment
                                            </span>
                                          </a>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </div>

                                <Button
                                  onClick={() => setReplyingTo(chat)}
                                  variant="ghost"
                                  className="hidden self-center p-2 text-[#193c1f] opacity-40 hover:opacity-100 group-hover:flex"
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
                                    ></path>
                                  </svg>
                                </Button>
                              </div>
                              <span className="text-[10px] text-[#193c1f] opacity-40 ml-11">
                                {time}
                              </span>
                            </div>
                          );
                        }

                        return (
                          <div
                            key={chat.id}
                            className="flex flex-col items-end space-y-1 group relative"
                          >
                            <div className="flex items-center space-x-2 mr-10 mb-1">
                              <span className="text-xs font-bold text-[#193c1f] opacity-70">
                                {isMe
                                  ? shouldMask
                                    ? 'Anonymous (Me)'
                                    : 'Me'
                                  : displayName}
                                {chat.user.role === 'PSYCHOLOGIST' && (
                                  <span className="ml-2 text-[9px] bg-[#8ea087] text-white px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider">
                                    Psychologist
                                  </span>
                                )}
                              </span>
                            </div>
                            <div className="flex items-start flex-row-reverse">
                              <Image
                                alt="Avatar"
                                width={32}
                                height={32}
                                className="w-8 h-8 rounded-full mt-1 ml-3 object-cover border border-[#d0d5cb]"
                                src={
                                  shouldMask
                                    ? 'https://static.vecteezy.com/system/resources/previews/009/292/244/original/default-avatar-icon-of-social-media-user-vector.jpg'
                                    : chat.user.image ||
                                      'https://lh3.googleusercontent.com/aida-public/AB6AXuBEco0p3MDuxX90l9mF4SA0D5WmC84PJazeYS6jFlgGu6Z-L_HxYF4go8gTd7ImSPN8Yg9IYm5nWoKdCW7Azu9bfAq8XhByCCA0h4C3l_yC4OkTfQRzppjGbvuLkHC6-rZVaScgJcjaRYm350CGpQyEHirHU0mOph6TPnQxShR39Kv0qls4iqEaza6VOZncpHcdH6aQXKwLy1R587WGI_FxQ5evlw3n9GBfy59SZ_CAlBuxXdF87MFefAimDan5A6GOVUKeBPYHqA'
                                }
                                unoptimized
                              />
                              <div className="flex flex-col items-end max-w-xl">
                                {chat.replyTo && (
                                  <div className="bg-[#8ea087] bg-opacity-20 border-r-4 border-[#8ea087] p-2 mb-1 rounded-tl-xl text-[11px] text-[#193c1f] opacity-80 line-clamp-2 text-right">
                                    <span className="font-bold block">
                                      {getReplyDisplayName(chat.replyTo)}
                                    </span>
                                    {chat.replyTo.content}
                                  </div>
                                )}
                                <div className="bg-[#8ea087] text-white rounded-2xl p-4 text-sm shadow-sm leading-relaxed whitespace-pre-wrap">
                                  {chat.content}
                                  {chat.mediaUrl && (
                                    <div className="mt-2">
                                      {chat.mediaUrl.match(
                                        /\.(png|jpe?g)$/i,
                                      ) ? (
                                        <a
                                          href={chat.mediaUrl}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="block relative max-w-full h-auto"
                                        >
                                          <Image
                                            src={chat.mediaUrl}
                                            alt="Attached Media"
                                            width={400}
                                            height={300}
                                            className="rounded-lg object-contain bg-white"
                                            unoptimized
                                          />
                                        </a>
                                      ) : (
                                        <a
                                          href={chat.mediaUrl}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="flex items-center space-x-2 text-white hover:underline bg-[#72826c] p-2 rounded-xl"
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
                                              d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                                            ></path>
                                          </svg>
                                          <span className="text-xs">
                                            View File Attachment
                                          </span>
                                        </a>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>

                              <Button
                                onClick={() => setReplyingTo(chat)}
                                variant="ghost"
                                className="hidden self-center p-2 text-[#193c1f] opacity-40 hover:opacity-100 group-hover:flex"
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
                                  ></path>
                                </svg>
                              </Button>
                            </div>
                            <span className="text-[10px] text-[#193c1f] opacity-40 mr-11">
                              {time}
                            </span>
                          </div>
                        );
                      })()}
                    </React.Fragment>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </section>

            <footer className="p-6 bg-white border-t border-[#d0d5cb] shrink-0 flex flex-col space-y-3 relative">
              {replyingTo && (
                <div className="flex items-center justify-between bg-[#f7f3ed] border-l-4 border-[#8ea087] px-4 py-2 rounded-xl mb-1 shadow-sm animate-in slide-in-from-bottom-2">
                  <div className="overflow-hidden">
                    <span className="text-[10px] font-bold text-[#8ea087] block uppercase tracking-wider">
                      Replying to {getReplyDisplayName(replyingTo)}
                    </span>
                    <p className="text-xs text-[#193c1f] truncate opacity-70">
                      {replyingTo.content}
                    </p>
                  </div>
                  <Button
                    onClick={() => setReplyingTo(null)}
                    variant="ghost"
                    className="ml-4 p-0 text-[#193c1f] opacity-40 hover:opacity-100"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
              {mediaFile && (
                <div className="flex items-center justify-between bg-[#f7f3ed] border border-[#8ea087] rounded-xl px-4 py-2 w-max shadow-sm">
                  <span className="text-xs text-[#193c1f] font-semibold">
                    {mediaFile.name} ({(mediaFile.size / 1024).toFixed(1)}KB)
                  </span>
                  <Button
                    onClick={() => setMediaFile(null)}
                    variant="ghost"
                    className="ml-4 rounded-full bg-red-100 p-1 text-red-500 hover:text-red-700"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
              {isExpired ? (
                <div className="flex-1 bg-[#f7f3ed] border border-[#d0d5cb] rounded-2xl px-6 py-4 flex flex-col items-center justify-center text-center space-y-1">
                  <div className="flex items-center space-x-2 text-[#8ea087]">
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
                        d="M12 15v2m0 0v2m0-2h2m-2 0H8m13 0a9 9 0 11-18 0 9 9 0 0118 0z"
                      ></path>
                    </svg>
                    <span className="font-bold text-sm uppercase tracking-wider">
                      Room Closed
                    </span>
                  </div>
                  <p className="text-xs text-[#193c1f] opacity-60">
                    Sesi konsultasi telah berakhir. Ruangan chat ini telah
                    ditutup secara otomatis.
                  </p>
                </div>
              ) : (
                <div className="flex items-center space-x-4">
                  <div className="flex-1 relative flex items-center bg-[#f7f3ed] border border-[#d0d5cb] rounded-2xl px-4 py-3 focus-within:border-[#8ea087] focus-within:ring-1 focus-within:ring-[#8ea087] transition-all">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={(e) =>
                        setMediaFile(e.target.files?.[0] || null)
                      }
                      className="hidden"
                      accept=".jpg,.jpeg,.png,.pdf"
                    />
                    <Button
                      onClick={() => fileInputRef.current?.click()}
                      variant="ghost"
                      className="icon-button mr-3 p-0 text-[#193c1f] opacity-40 hover:opacity-70"
                    >
                      <Paperclip className="h-6 w-6" />
                    </Button>
                    <Input
                      className="bg-transparent border-none focus:ring-0 text-sm text-[#193c1f] w-full p-0 outline-none"
                      placeholder="Type your message here..."
                      type="text"
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSendMessage();
                      }}
                    />
                  </div>
                  <Button
                    onClick={handleSendMessage}
                    disabled={
                      sendMessageMutation.isPending ||
                      (!messageInput.trim() && !mediaFile)
                    }
                    variant="secondary"
                    loading={sendMessageMutation.isPending}
                    className="icon-button send-icon-button h-12 w-12 shrink-0 rounded-2xl p-0 shadow-sm hover:brightness-110 disabled:hover:brightness-100"
                    aria-label="Send message"
                  >
                    {sendMessageMutation.isPending ? (
                      ''
                    ) : (
                      <Send className="h-6 w-6 rotate-45" />
                    )}
                  </Button>
                </div>
              )}
            </footer>
          </main>
        ) : (
          <main className="flex-1 flex flex-col bg-white min-w-0 items-center justify-center">
            <div className="text-center opacity-60">
              <svg
                className="w-16 h-16 mx-auto text-[#8ea087] mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                ></path>
              </svg>
              <p className="text-lg font-bold text-[#193c1f]">
                Select a consultation
              </p>
              <p className="text-sm text-[#193c1f]">
                Choose a conversation from the left to start messaging.
              </p>
            </div>
          </main>
        )}
      </div>

      <Alert
        isOpen={isLogoutAlertOpen}
        onClose={() => setIsLogoutAlertOpen(false)}
        onConfirm={handleLogout}
        type="danger"
        title="End Session?"
        description="Are you sure you want to log out?"
        confirmText={isLoggingOut ? 'Logging out...' : 'Log Out'}
      />
    </div>
  );
}
