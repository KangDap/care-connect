'use client';

import { Alert } from '@/components/alert';
import { Header } from '@/components/header';
import { authClient } from '@/lib/auth/auth-client';
import { useQuery } from '@tanstack/react-query';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

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

const DEFAULT_AVATAR =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuBEco0p3MDuxX90l9mF4SA0D5WmC84PJazeYS6jFlgGu6Z-L_HxYF4go8gTd7ImSPN8Yg9IYm5nWoKdCW7Azu9bfAq8XhByCCA0h4C3l_yC4OkTfQRzppjGbvuLkHC6-rZVaScgJcjaRYm350CGpQyEHirHU0mOph6TPnQxShR39Kv0qls4iqEaza6VOZncpHcdH6aQXKwLy1R587WGI_FxQ5evlw3n9GBfy59SZ_CAlBuxXdF87MFefAimDan5A6GOVUKeBPYHqA';
const ANON_AVATAR =
  'https://static.vecteezy.com/system/resources/previews/009/292/244/original/default-avatar-icon-of-social-media-user-vector.jpg';

export default function ConsultationChatList() {
  const router = useRouter();
  const [isLogoutAlertOpen, setIsLogoutAlertOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const { data: session, isPending } = authClient.useSession();

  useEffect(() => {
    if (!isPending && !session?.user) {
      router.push('/login');
    }
  }, [isPending, session, router]);

  const { data: activeConsultations = [], isLoading: isLoadingConsultations } =
    useQuery({
      queryKey: ['active-consultations'],
      queryFn: async () => {
        const res = await fetch('/api/consultation-chat');
        if (!res.ok) throw new Error('Failed to fetch consultations');
        return res.json();
      },
      refetchInterval: 10000,
      enabled: !!session?.user,
    });

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await authClient.signOut();
    router.replace('/login');
    router.refresh();
  };

  if (isPending || !session?.user) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#f7f3ed]">
        <p className="text-[#193c1f] font-semibold text-lg animate-pulse">
          Loading...
        </p>
      </div>
    );
  }

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

      <div className="flex min-h-0 flex-1 overflow-hidden">
        {/* Consultation List — full-screen on mobile, left panel on desktop */}
        <aside className="flex w-full flex-col overflow-hidden border-r border-[#d0d5cb] bg-[#f7f3ed] lg:w-80 lg:shrink-0">
          <div className="p-4 shrink-0">
            <h2 className="text-lg font-bold text-[#193c1f]">
              Active Consultations
            </h2>
            <p className="text-xs text-[#193c1f] opacity-60">
              {activeConsultations.length} ongoing sessions
            </p>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-2 space-y-1 relative z-0">
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
                const isUserClient = consultation.userId === session.user.id;
                const isAnonymous = consultation.isAnonymous;
                const otherPerson = isUserClient
                  ? consultation.psychologist
                  : consultation.user;

                const displayName =
                  !isUserClient && isAnonymous
                    ? 'Anonymous'
                    : otherPerson?.name || 'Unknown User';

                const displayImage =
                  !isUserClient && isAnonymous
                    ? ANON_AVATAR
                    : otherPerson?.image || DEFAULT_AVATAR;

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
                    onClick={() =>
                      router.push(`/consultation-chat/${consultation.id}`)
                    }
                    className="rounded-xl p-3 flex items-start space-x-3 cursor-pointer transition hover:bg-[#ede4d8] active:bg-[#d0d5cb]"
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

          <div className="p-4 border-t border-[#d0d5cb] shrink-0 bg-[#f7f3ed] relative z-20">
            <Link
              href="/dashboard/consultations"
              className="w-full py-2.5 bg-[#8ea087] text-white font-semibold rounded-xl flex items-center justify-center space-x-2 transition hover:brightness-110 shadow-sm"
            >
              <span>View All Schedules</span>
            </Link>
          </div>
        </aside>

        {/* Desktop empty state — hidden on mobile */}
        <main className="hidden lg:flex flex-1 flex-col bg-white items-center justify-center">
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
