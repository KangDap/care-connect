'use client';

import { ForumModal } from '@/components/ForumModal';
import { Badge } from '@/components/badge';
import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { Input } from '@/components/input';
import { PublicHeader } from '@/components/public-header';
import { authClient } from '@/lib/auth/auth-client';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowRight,
  Loader2,
  MessageSquare,
  Plus,
  Search,
  Users,
} from 'lucide-react';
import Image from 'next/image';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import React, { startTransition, useEffect, useMemo, useState } from 'react';

// --- TYPES ---
interface ForumRoom {
  id: number;
  title: string;
  description: string;
  category?: string;
  myRole?: string | null;
  isMember?: boolean;
  _count?: {
    members: number;
  };
  coverUrl?: string | null;
}

const SupportForumsContent = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchParamValue = searchParams.get('search') || '';
  const searchParamsString = searchParams.toString();

  const [searchQuery, setSearchQuery] = useState(searchParamValue);
  const [rooms, setRooms] = useState<ForumRoom[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [joiningId, setJoiningId] = useState<number | null>(null);
  const [bannedNotice, setBannedNotice] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // 1. Ambil session untuk cek Role Admin
  const { data: session } = authClient.useSession();
  const currentUserRole = (session?.user as { role?: string })?.role || 'USER';
  const isAdmin = currentUserRole === 'ADMIN';

  // 2. Query untuk mengambil daftar grup yang SUDAH di-join (untuk filter tombol)
  const { data: joinedChannels = [] } = useQuery({
    queryKey: ['community-channels'],
    queryFn: async () => {
      const res = await fetch('/api/community-chat');
      if (!res.ok) return [];
      return res.json();
    },
  });

  // 3. Fetch SEMUA room yang tersedia (Discovery) — includes myRole for banned check
  useEffect(() => {
    const fetchRooms = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/community-chat?all=true');
        if (response.ok) {
          const data = await response.json();
          const finalData = Array.isArray(data) ? data : data.data || [];
          setRooms(finalData);
        }
      } catch (error) {
        console.error('Failed to fetch rooms:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchRooms();
  }, []);

  useEffect(() => {
    startTransition(() => {
      setSearchQuery(searchParamValue);
    });
  }, [searchParamValue]);

  useEffect(() => {
    const handler = setTimeout(() => {
      const normalizedSearch = searchQuery.trim();
      if (searchParamValue === normalizedSearch) return;

      const params = new URLSearchParams(searchParamsString);
      if (normalizedSearch) {
        params.set('search', normalizedSearch);
      } else {
        params.delete('search');
      }
      params.delete('page');

      const queryString = params.toString();
      router.replace(queryString ? `${pathname}?${queryString}` : pathname, {
        scroll: false,
      });
    }, 300);

    return () => clearTimeout(handler);
  }, [pathname, router, searchParamValue, searchParamsString, searchQuery]);

  // Fungsi cek apakah sudah join (non-banned)
  const isAlreadyJoined = (roomId: number) => {
    return joinedChannels.some(
      (channel: { id: number }) => channel.id === roomId,
    );
  };

  const triggerBannedNotice = () => {
    setBannedNotice(
      'You cannot join this forum because you have been removed from it.',
    );
    setTimeout(() => setBannedNotice(null), 5000);
  };

  const handleJoinRoom = async (roomId: number) => {
    // Guard: cek banned dari data lokal sebelum request
    const room = rooms.find((r) => r.id === roomId);
    if (room?.myRole === 'BANNED') {
      triggerBannedNotice();
      return;
    }

    try {
      setJoiningId(roomId);
      const response = await fetch(`/api/community-chat/${roomId}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      if (response.ok || response.status === 400) {
        router.push(`/community-chat/${roomId}`);
      } else if (response.status === 403) {
        triggerBannedNotice();
      }
    } catch (error) {
      console.error('Error joining room:', error);
    } finally {
      setJoiningId(null);
    }
  };

  const handleCreateForum = async (data: FormData) => {
    try {
      setIsCreating(true);

      const response = await fetch('/api/community-chat', {
        method: 'POST',
        body: data,
      });

      if (response.ok) {
        setIsCreateModalOpen(false);
        router.refresh();
        // Reload rooms manually since we use local state
        const updatedRooms = await fetch('/api/community-chat?all=true').then(
          (res) => res.json(),
        );
        setRooms(
          Array.isArray(updatedRooms) ? updatedRooms : updatedRooms.data,
        );
      }
    } catch (error) {
      console.error('Error creating forum:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const filteredRooms = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLowerCase();
    if (!normalizedSearch) return rooms;

    return rooms.filter((room) =>
      [
        room.title,
        (room as { name?: string }).name,
        room.description,
        room.category,
        String(room.id),
      ].some((value) => (value ?? '').toLowerCase().includes(normalizedSearch)),
    );
  }, [rooms, searchQuery]);

  return (
    <div className="min-h-screen bg-[#f7f3ed]">
      <PublicHeader />

      {/* Floating Banned Notice */}
      {bannedNotice && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-red-600 text-white text-sm font-bold px-6 py-4 rounded-2xl shadow-2xl max-w-md w-[90%]">
          <span className="text-xl">🚫</span>
          <span className="flex-1">{bannedNotice}</span>
          <Button
            type="button"
            variant="ghost"
            onClick={() => setBannedNotice(null)}
            className="ml-2 px-0 py-0 text-white hover:text-white"
            aria-label="Close notice"
          >
            ×
          </Button>
        </div>
      )}

      <main className="max-w-7xl mx-auto p-6 md:p-12 text-left">
        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-black uppercase text-[#193c1f] leading-none mb-4 tracking-tight">
            Support Forums
          </h1>
          <p className="text-[#8ea087] text-lg font-medium">
            Connect with community members and certified professionals.
          </p>
        </div>

        <div className="mx-auto mb-12 w-full max-w-3xl">
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search forums..."
            icon={<Search size={18} />}
            className="h-[56px] bg-[#EBE6DE]"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {isLoading ? (
            <div className="col-span-full py-20 text-center">
              <Loader2 className="inline-block animate-spin h-8 w-8 text-[#193c1f] mb-4" />
              <p className="text-[#8ea087] font-bold">Fetching Forums...</p>
            </div>
          ) : (
            filteredRooms.map((room) => {
              const banned = room.myRole === 'BANNED';
              return (
                <div key={room.id} className="group">
                  <Card
                    className={`flex h-full flex-col rounded-[40px] transition-all duration-500 ${
                      banned ? 'border-red-200 opacity-80' : 'hover:shadow-2xl'
                    }`}
                  >
                    <div className="h-44 bg-[#f7f3ed] flex items-center justify-center relative overflow-hidden transition-colors group-hover:bg-[#EBE6DE]">
                      <div className="absolute inset-0 bg-gradient-to-br from-[#f7f3ed] via-[#E6DED3] to-[#d0d5cb]" />
                      {room.coverUrl ? (
                        <Image
                          src={room.coverUrl}
                          alt={
                            room.title ||
                            (room as { name?: string }).name ||
                            'Forum'
                          }
                          fill
                          className="object-cover relative z-10 transition-transform duration-500 group-hover:scale-105"
                          unoptimized
                        />
                      ) : (
                        <MessageSquare
                          size={48}
                          className="relative z-10 text-[#8ea087] opacity-40 group-hover:scale-110 transition-transform duration-500"
                        />
                      )}
                      <Badge className="absolute bottom-6 left-8 z-20 rounded-xl bg-white/80 tracking-[0.2em] backdrop-blur-sm">
                        ROOM #{room.id}
                      </Badge>
                      {banned && (
                        <Badge className="absolute right-4 top-4 z-10 rounded-xl bg-red-500 text-white shadow">
                          Removed
                        </Badge>
                      )}
                    </div>

                    <div className="p-8 flex flex-col flex-1">
                      <h3 className="font-black text-xl text-[#193c1f] mb-3 group-hover:text-[#8ea087] transition-colors italic tracking-tight line-clamp-2 leading-tight">
                        {room.title ||
                          (room as { name?: string }).name ||
                          'Untitled Room'}
                      </h3>
                      <p className="text-sm text-[#193c1f]/60 font-medium leading-relaxed mb-8 flex-1 line-clamp-3">
                        {room.description ||
                          'No description available for this room.'}
                      </p>

                      <div className="flex justify-between items-center pt-6 border-t border-[#f7f3ed]">
                        <span className="text-[10px] font-black text-[#8ea087] uppercase flex items-center gap-2 tracking-widest">
                          <Users size={14} strokeWidth={3} />{' '}
                          {room._count?.members || 0} Members
                        </span>

                        {banned ? (
                          <Button
                            type="button"
                            variant="outline"
                            onClick={triggerBannedNotice}
                            className="text-[10px] font-black uppercase flex items-center gap-1.5 text-red-500 border border-red-200 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-xl transition-all tracking-[0.1em]"
                          >
                            🚫 Removed
                          </Button>
                        ) : isAlreadyJoined(room.id) ? (
                          <Button
                            type="button"
                            variant="secondary"
                            onClick={() =>
                              router.push(`/community-chat/${room.id}`)
                            }
                            className="text-[11px] font-black uppercase flex items-center gap-2 text-white bg-[#8ea087] hover:bg-[#193c1f] hover:scale-105 px-4 py-2 rounded-xl transition-all tracking-[0.1em] shadow-sm"
                          >
                            Joined{' '}
                            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                          </Button>
                        ) : (
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={() => handleJoinRoom(room.id)}
                            disabled={joiningId === room.id}
                            className="text-[11px] font-black uppercase flex items-center gap-1 text-[#193c1f] group-hover:gap-3 transition-all tracking-[0.1em] disabled:opacity-50"
                          >
                            {joiningId === room.id ? 'Joining...' : 'Join Room'}{' '}
                            <ArrowRight size={16} strokeWidth={3} />
                          </Button>
                        )}
                      </div>

                      {/* Inline banned notice below the card footer */}
                      {banned && (
                        <p className="text-[10px] text-red-400 font-semibold mt-3 text-center leading-snug">
                          You cannot join this forum because you have been
                          removed from it.
                        </p>
                      )}
                    </div>
                  </Card>
                </div>
              );
            })
          )}

          {isAdmin && (
            <Card
              onClick={() => setIsCreateModalOpen(true)}
              className="border-2 border-dashed border-[#D0D5CB] rounded-[40px] flex flex-col items-center justify-center p-12 text-center space-y-6 group cursor-pointer hover:bg-white/50 transition-all duration-500 h-full min-h-[400px]"
            >
              <div className="w-16 h-16 bg-[#EBE6DE] rounded-full flex items-center justify-center text-[#8EA087] group-hover:bg-[#193C1F] group-hover:text-white transition-all duration-500 shadow-sm">
                <Plus size={32} strokeWidth={3} />
              </div>
              <div>
                <h3 className="font-black text-xl text-[#193c1f] italic tracking-tight">
                  Create a Room
                </h3>
                <p className="text-sm text-[#8ea087] font-medium mt-2">
                  Admin only: Add a new topic.
                </p>
              </div>
            </Card>
          )}
        </div>
      </main>

      <ForumModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateForum}
        loading={isCreating}
      />
    </div>
  );
};

export default function SupportForumsPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen bg-[#f7f3ed]">
          <PublicHeader />
          <main className="max-w-7xl mx-auto p-6 md:p-12 text-center">
            <Loader2 className="inline-block animate-spin h-8 w-8 text-[#193c1f] mb-4" />
            <p className="text-[#8ea087] font-bold">Fetching Forums...</p>
          </main>
        </div>
      }
    >
      <SupportForumsContent />
    </React.Suspense>
  );
}
