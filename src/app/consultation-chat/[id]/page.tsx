'use client';

import { Alert } from '@/components/alert';
import { Header } from '@/components/header';
import { authClient } from '@/lib/auth/auth-client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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
  const { data: session, isPending } = authClient.useSession();
  const queryClient = useQueryClient();

  // Use idParam directly throughout the component
  const selectedConsultationId = idParam;
  const [messageInput, setMessageInput] = useState('');
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [replyingTo, setReplyingTo] = useState<null | {
    id: number;
    content: string;
    user: { name: string };
  }>(null);
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

    const formData = new FormData();
    formData.append('consultationId', selectedConsultationId.toString());
    formData.append('content', messageInput);
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
      <div className="h-screen flex items-center justify-center bg-[#F7F3ED]">
        <p className="text-[#193C1F] font-semibold text-lg animate-pulse">
          Loading chat...
        </p>
      </div>
    );
  }

  const handleRoomClick = (consultationId: number) => {
    router.push(`/consultation-chat/${consultationId}`);
  };

  return (
    <div className="h-screen flex flex-col bg-[#F7F3ED] text-[#193C1F] font-sans">
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
        <aside className="w-80 flex flex-col border-r border-[#D0D5CB] bg-[#F7F3ED] shrink-0">
          <div className="p-4 shrink-0">
            <h2 className="text-lg font-bold text-[#193C1F]">
              Active Consultations
            </h2>
            <p className="text-xs text-[#193C1F] opacity-60">
              {activeConsultations.length} ongoing sessions
            </p>
          </div>
          <div className="flex-1 overflow-y-auto px-2 space-y-1">
            {isLoadingConsultations ? (
              <p className="text-center text-[#193C1F] text-xs opacity-50 py-4">
                Loading...
              </p>
            ) : activeConsultations.length === 0 ? (
              <p className="text-center text-[#193C1F] text-xs opacity-50 py-4">
                No active consultations.
              </p>
            ) : (
              activeConsultations.map(
                (consultation: {
                  id: number;
                  userId: string;
                  date: string;
                  createdAt: string;
                  psychologist: { name: string; image: string | null };
                  user: { name: string; image: string | null };
                  latestChat: { timestamp: string; content: string } | null;
                }) => {
                  // Determine the other user
                  const isUserClient = consultation.userId === session.user.id;
                  const otherPerson = isUserClient
                    ? consultation.psychologist
                    : consultation.user;

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
                    consultation.latestChat?.content ||
                    'Start a conversation...';

                  return (
                    <div
                      key={consultation.id}
                      onClick={() => handleRoomClick(consultation.id)}
                      className={`rounded-xl p-3 flex items-start space-x-3 cursor-pointer transition ${
                        selectedConsultationId === consultation.id
                          ? 'bg-[#D0D5CB]'
                          : 'hover:bg-[#EDE4D8]'
                      }`}
                    >
                      <Image
                        alt={otherPerson?.name || 'Participant'}
                        width={40}
                        height={40}
                        className="w-10 h-10 rounded-full object-cover bg-white shrink-0"
                        src={
                          otherPerson?.image ||
                          'https://lh3.googleusercontent.com/aida-public/AB6AXuBEco0p3MDuxX90l9mF4SA0D5WmC84PJazeYS6jFlgGu6Z-L_HxYF4go8gTd7ImSPN8Yg9IYm5nWoKdCW7Azu9bfAq8XhByCCA0h4C3l_yC4OkTfQRzppjGbvuLkHC6-rZVaScgJcjaRYm350CGpQyEHirHU0mOph6TPnQxShR39Kv0qls4iqEaza6VOZncpHcdH6aQXKwLy1R587WGI_FxQ5evlw3n9GBfy59SZ_CAlBuxXdF87MFefAimDan5A6GOVUKeBPYHqA'
                        }
                        unoptimized
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-baseline">
                          <h3 className="text-sm font-semibold text-[#193C1F] truncate pr-2">
                            {otherPerson?.name || 'Unknown User'}
                          </h3>
                          <span className="text-[10px] text-[#193C1F] opacity-50 shrink-0">
                            {previewDate}
                          </span>
                        </div>
                        <p className="text-xs text-[#193C1F] opacity-70 truncate mt-1">
                          {previewText}
                        </p>
                      </div>
                    </div>
                  );
                },
              )
            )}
          </div>

          <div className="p-4 border-t border-[#D0D5CB] shrink-0">
            <Link
              href="/dashboard/consultations"
              className="w-full py-2.5 bg-[#8EA087] text-white font-semibold rounded-xl flex items-center justify-center space-x-2 transition hover:brightness-110 shadow-sm"
            >
              <span>View All Schedules</span>
            </Link>
          </div>
        </aside>

        {/* Main Chat Area */}
        {selectedConsultationId ? (
          <main className="flex-1 flex flex-col bg-white min-w-0">
            <section className="flex-1 overflow-y-auto p-6 space-y-8 bg-[#F7F3ED]">
              {isLoadingMessages ? (
                <p className="text-center text-[#193C1F] text-xs opacity-50 py-4 animate-pulse">
                  Loading messages...
                </p>
              ) : chatMessages.length === 0 ? (
                (() => {
                  const currentConsultation = activeConsultations.find(
                    (c: {
                      id: number;
                      userId: string;
                      date: string;
                      createdAt: string;
                      psychologist: { name: string; image: string | null };
                      user: { name: string; image: string | null };
                      latestChat: { timestamp: string; content: string } | null;
                    }) => c.id === selectedConsultationId,
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
                        <span className="bg-[#D0D5CB] bg-opacity-30 text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full text-[#193C1F] opacity-60">
                          {roomDate}
                        </span>
                      </div>
                      <p className="text-center text-[#193C1F] text-xs opacity-50 py-4">
                        No messages yet. Say hello!
                      </p>
                    </>
                  );
                })()
              ) : (
                chatMessages.map(
                  (
                    chat: {
                      id: number;
                      user: {
                        id: string;
                        name: string;
                        role: string;
                        image?: string;
                      };
                      timestamp: string;
                      replyTo?: {
                        content: string;
                        user: { name: string };
                      } | null;
                      content: string;
                      mediaUrl?: string | null;
                    },
                    index: number,
                  ) => {
                    const isMe = chat.user.id === session.user.id;

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
                    const time = new Date(chat.timestamp).toLocaleTimeString(
                      [],
                      { hour: '2-digit', minute: '2-digit' },
                    );

                    return (
                      <React.Fragment key={chat.id}>
                        {showDatePill && (
                          <div className="flex justify-center my-4">
                            <span className="bg-[#D0D5CB] bg-opacity-30 text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full text-[#193C1F] opacity-60">
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
                                  <span className="text-xs font-bold text-[#193C1F] opacity-70">
                                    {chat.user.name || 'Unknown'}
                                    {chat.user.role === 'PSYCHOLOGIST' && (
                                      <span className="ml-2 text-[9px] bg-[#8EA087] text-white px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider">
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
                                      chat.user.image ||
                                      'https://lh3.googleusercontent.com/aida-public/AB6AXuBEco0p3MDuxX90l9mF4SA0D5WmC84PJazeYS6jFlgGu6Z-L_HxYF4go8gTd7ImSPN8Yg9IYm5nWoKdCW7Azu9bfAq8XhByCCA0h4C3l_yC4OkTfQRzppjGbvuLkHC6-rZVaScgJcjaRYm350CGpQyEHirHU0mOph6TPnQxShR39Kv0qls4iqEaza6VOZncpHcdH6aQXKwLy1R587WGI_FxQ5evlw3n9GBfy59SZ_CAlBuxXdF87MFefAimDan5A6GOVUKeBPYHqA'
                                    }
                                    unoptimized
                                  />
                                  <div className="flex flex-col max-w-xl">
                                    {chat.replyTo && (
                                      <div className="bg-[#EDE4D8] bg-opacity-50 border-l-4 border-[#8EA087] p-2 mb-1 rounded-tr-xl text-[11px] text-[#193C1F] opacity-80 line-clamp-2">
                                        <span className="font-bold block">
                                          {chat.replyTo.user.name}
                                        </span>
                                        {chat.replyTo.content}
                                      </div>
                                    )}
                                    <div className="bg-[#EDE4D8] text-[#193C1F] rounded-2xl p-4 text-sm shadow-sm leading-relaxed whitespace-pre-wrap relative overflow-hidden">
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
                                              className="flex items-center space-x-2 text-[#8EA087] hover:underline bg-white p-2 border border-[#D0D5CB] rounded-xl"
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

                                  <button
                                    onClick={() => setReplyingTo(chat)}
                                    className="hidden group-hover:flex items-center justify-center p-2 text-[#193C1F] opacity-40 hover:opacity-100 transition-opacity self-center"
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
                                  </button>
                                </div>
                                <span className="text-[10px] text-[#193C1F] opacity-40 ml-11">
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
                                <span className="text-xs font-bold text-[#193C1F] opacity-70">
                                  {chat.user.name || 'Me'}
                                  {chat.user.role === 'PSYCHOLOGIST' && (
                                    <span className="ml-2 text-[9px] bg-[#8EA087] text-white px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider">
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
                                  className="w-8 h-8 rounded-full mt-1 ml-3 object-cover border border-[#D0D5CB]"
                                  src={
                                    chat.user.image ||
                                    'https://lh3.googleusercontent.com/aida-public/AB6AXuBEco0p3MDuxX90l9mF4SA0D5WmC84PJazeYS6jFlgGu6Z-L_HxYF4go8gTd7ImSPN8Yg9IYm5nWoKdCW7Azu9bfAq8XhByCCA0h4C3l_yC4OkTfQRzppjGbvuLkHC6-rZVaScgJcjaRYm350CGpQyEHirHU0mOph6TPnQxShR39Kv0qls4iqEaza6VOZncpHcdH6aQXKwLy1R587WGI_FxQ5evlw3n9GBfy59SZ_CAlBuxXdF87MFefAimDan5A6GOVUKeBPYHqA'
                                  }
                                  unoptimized
                                />
                                <div className="flex flex-col items-end max-w-xl">
                                  {chat.replyTo && (
                                    <div className="bg-[#8EA087] bg-opacity-20 border-r-4 border-[#8EA087] p-2 mb-1 rounded-tl-xl text-[11px] text-[#193C1F] opacity-80 line-clamp-2 text-right">
                                      <span className="font-bold block">
                                        {chat.replyTo.user.name}
                                      </span>
                                      {chat.replyTo.content}
                                    </div>
                                  )}
                                  <div className="bg-[#8EA087] text-white rounded-2xl p-4 text-sm shadow-sm leading-relaxed whitespace-pre-wrap">
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

                                <button
                                  onClick={() => setReplyingTo(chat)}
                                  className="hidden group-hover:flex items-center justify-center p-2 text-[#193C1F] opacity-40 hover:opacity-100 transition-opacity self-center"
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
                                </button>
                              </div>
                              <span className="text-[10px] text-[#193C1F] opacity-40 mr-11">
                                {time}
                              </span>
                            </div>
                          );
                        })()}
                      </React.Fragment>
                    );
                  },
                )
              )}
              <div ref={messagesEndRef} />
            </section>

            <footer className="p-6 bg-white border-t border-[#D0D5CB] shrink-0 flex flex-col space-y-3 relative">
              {replyingTo && (
                <div className="flex items-center justify-between bg-[#F7F3ED] border-l-4 border-[#8EA087] px-4 py-2 rounded-xl mb-1 shadow-sm animate-in slide-in-from-bottom-2">
                  <div className="overflow-hidden">
                    <span className="text-[10px] font-bold text-[#8EA087] block uppercase tracking-wider">
                      Replying to {replyingTo.user.name}
                    </span>
                    <p className="text-xs text-[#193C1F] truncate opacity-70">
                      {replyingTo.content}
                    </p>
                  </div>
                  <button
                    onClick={() => setReplyingTo(null)}
                    className="ml-4 text-[#193C1F] opacity-40 hover:opacity-100"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M6 18L18 6M6 6l12 12"
                      ></path>
                    </svg>
                  </button>
                </div>
              )}
              {mediaFile && (
                <div className="flex items-center justify-between bg-[#F7F3ED] border border-[#8EA087] rounded-xl px-4 py-2 w-max shadow-sm">
                  <span className="text-xs text-[#193C1F] font-semibold">
                    {mediaFile.name} ({(mediaFile.size / 1024).toFixed(1)}KB)
                  </span>
                  <button
                    onClick={() => setMediaFile(null)}
                    className="ml-4 text-red-500 hover:text-red-700 bg-red-100 p-1 rounded-full"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M6 18L18 6M6 6l12 12"
                      ></path>
                    </svg>
                  </button>
                </div>
              )}
              {isExpired ? (
                <div className="flex-1 bg-[#F7F3ED] border border-[#D0D5CB] rounded-2xl px-6 py-4 flex flex-col items-center justify-center text-center space-y-1">
                  <div className="flex items-center space-x-2 text-[#8EA087]">
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
                  <p className="text-xs text-[#193C1F] opacity-60">
                    Sesi konsultasi telah berakhir. Ruangan chat ini telah
                    ditutup secara otomatis.
                  </p>
                </div>
              ) : (
                <div className="flex items-center space-x-4">
                  <div className="flex-1 relative flex items-center bg-[#F7F3ED] border border-[#D0D5CB] rounded-2xl px-4 py-3 focus-within:border-[#8EA087] focus-within:ring-1 focus-within:ring-[#8EA087] transition-all">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={(e) =>
                        setMediaFile(e.target.files?.[0] || null)
                      }
                      className="hidden"
                      accept=".jpg,.jpeg,.png,.pdf"
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="text-[#193C1F] opacity-40 hover:opacity-70 mr-3"
                    >
                      <svg
                        className="w-6 h-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                        ></path>
                      </svg>
                    </button>
                    <input
                      className="bg-transparent border-none focus:ring-0 text-sm text-[#193C1F] w-full p-0 outline-none"
                      placeholder="Type your message here..."
                      type="text"
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSendMessage();
                      }}
                    />
                  </div>
                  <button
                    onClick={handleSendMessage}
                    disabled={
                      sendMessageMutation.isPending ||
                      (!messageInput.trim() && !mediaFile)
                    }
                    className="w-12 h-12 bg-[#8EA087] hover:brightness-110 disabled:opacity-50 disabled:hover:brightness-100 text-white rounded-2xl flex items-center justify-center transition-transform active:scale-95 shadow-sm shrink-0"
                  >
                    {sendMessageMutation.isPending ? (
                      <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    ) : (
                      <svg
                        className="w-6 h-6 transform rotate-90"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"></path>
                      </svg>
                    )}
                  </button>
                </div>
              )}
            </footer>
          </main>
        ) : (
          <main className="flex-1 flex flex-col bg-white min-w-0 items-center justify-center">
            <div className="text-center opacity-60">
              <svg
                className="w-16 h-16 mx-auto text-[#8EA087] mb-4"
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
              <p className="text-lg font-bold text-[#193C1F]">
                Select a consultation
              </p>
              <p className="text-sm text-[#193C1F]">
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
