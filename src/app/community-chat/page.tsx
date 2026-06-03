'use client';

import { Alert } from '@/components/alert';
import { Header } from '@/components/header';
import { useTranslation } from '@/components/providers/i18n-provider';
import { authClient } from '@/lib/auth/auth-client';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Users } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function CommunityChatList() {
  const router = useRouter();
  const { t } = useTranslation();
  const [isLogoutAlertOpen, setIsLogoutAlertOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const { data: session, isPending } = authClient.useSession();

  useEffect(() => {
    if (!isPending && !session?.user) {
      router.push('/login');
    }
  }, [isPending, session, router]);

  const { data: channels = [], isLoading: isLoadingChannels } = useQuery({
    queryKey: ['community-channels'],
    queryFn: async () => {
      const res = await fetch('/api/community-chat');
      if (!res.ok) throw new Error('Failed to fetch channels');
      return res.json();
    },
    refetchInterval: 10000,
    enabled: !!session?.user,
  });

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await authClient.signOut();
    router.replace('/login');
  };

  if (isPending) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#f7f3ed]">
        Loading...
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
        {/* Chat List — full-screen on mobile, left panel on desktop */}
        <aside className="flex w-full flex-col overflow-hidden border-r border-[#d0d5cb] bg-[#f7f3ed] lg:w-80 lg:shrink-0">
          <div className="p-4 shrink-0">
            <h2 className="text-lg font-bold text-[#193c1f]">
              Your Communities
            </h2>
            <p className="text-xs text-[#193c1f] opacity-60">
              {channels.length} communities joined
            </p>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-2 space-y-1 relative z-0">
            {isLoadingChannels ? (
              <p className="text-center text-[#193c1f] text-xs opacity-50 py-4 italic">
                Fetching...
              </p>
            ) : channels.length === 0 ? (
              <p className="text-center text-[#193c1f] text-xs opacity-50 py-4 italic">
                You haven&apos;t joined any communities yet.
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
                      className="rounded-xl p-3 flex items-start space-x-3 cursor-pointer transition hover:bg-[#ede4d8] active:bg-[#d0d5cb]"
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

          <div className="p-4 border-t border-[#d0d5cb] shrink-0 bg-[#f7f3ed] relative z-20">
            <Link
              href="/forums"
              className="w-full py-2.5 bg-white text-[#193c1f] border border-[#d0d5cb] font-semibold rounded-xl flex items-center justify-center space-x-2 transition hover:bg-[#f7f3ed] shadow-sm"
            >
              <ArrowLeft size={16} />
              <span>{t('Back to All Forums')}</span>
            </Link>
          </div>
        </aside>

        {/* Desktop empty state — hidden on mobile */}
        <main className="hidden lg:flex flex-1 flex-col bg-white items-center justify-center">
          <Users size={64} className="opacity-20 mb-4" />
          <p className="text-sm font-bold opacity-40 italic text-center">
            Select a community forum
          </p>
        </main>
      </div>

      <Alert
        isOpen={isLogoutAlertOpen}
        onClose={() => setIsLogoutAlertOpen(false)}
        onConfirm={handleLogout}
        type="danger"
        title="Logout Session"
        description="Are you sure you want to end your session?"
        confirmText={isLoggingOut ? 'Ending...' : 'Log Out'}
      />
    </div>
  );
}
