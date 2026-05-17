'use client';

import { Button } from '@/components/button';
import { Input } from '@/components/input';
import { Logo } from '@/components/logo';
import { useTranslation } from '@/components/providers/i18n-provider';
import { authClient } from '@/lib/auth/auth-client';
import { ChevronLeft, LogOut, Menu, Moon, Search, User } from 'lucide-react';
import Image from 'next/image';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import React, { useEffect, useRef, useState } from 'react';

const SILHOUETTE_AVATAR = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'%3E%3Crect width='200' height='200' fill='%23e5e7eb'/%3E%3Ccircle cx='100' cy='70' r='35' fill='%239ca3af'/%3E%3Cpath d='M40 140c0-30 27-50 60-50s60 20 60 50v50H40z' fill='%239ca3af'/%3E%3C/svg%3E`;

// 1. Tambahkan Interface Props
interface HeaderProps {
  withSearch?: boolean;
  withLogo?: boolean;
  onProfileClick?: () => void;
  onLogoutClick?: () => void;
  onMenuClick?: () => void;
  showBackButton?: boolean;
}

export const Header = ({
  withSearch = true,
  withLogo = false,
  onProfileClick,
  onLogoutClick,
  onMenuClick,
  showBackButton = false,
}: HeaderProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { data: session } = authClient.useSession();
  const { t, language, setLanguage } = useTranslation();

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState(
    searchParams.get('search') || '',
  );
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Synchronize internal state when URL changes externally
  useEffect(() => {
    // eslint-disable-next-line
    setSearchQuery(searchParams.get('search') || '');
  }, [searchParams]);

  useEffect(() => {
    const handler = setTimeout(() => {
      const currentSearch = searchParams.get('search') || '';
      if (currentSearch !== searchQuery) {
        const params = new URLSearchParams(searchParams.toString());
        if (searchQuery) {
          params.set('search', searchQuery);
        } else {
          params.delete('search');
        }
        router.push(`${pathname}?${params.toString()}`);
      }
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery, pathname, router, searchParams]);

  const profileUsername = session?.user?.username || 'User';
  const profileId = session?.user?.id
    ? `#${session.user.id.slice(-5).toUpperCase()}`
    : '-';
  const profileAvatar = session?.user?.image || SILHOUETTE_AVATAR;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleProfileClick = () => {
    setIsProfileOpen(false);
    if (onProfileClick) {
      onProfileClick();
    } else {
      localStorage.setItem('prevPath', pathname);
      router.push('/profile');
    }
  };

  return (
    <>
      <header className="h-[70px] md:h-[90px] w-full sticky top-0 border-b border-[#D0D5CB] flex items-center justify-between px-4 md:px-12 bg-[#F7F3ED]/80 backdrop-blur-md shrink-0 z-[100]">
        <div className="flex items-center gap-2 md:gap-8 flex-grow">
          {onMenuClick && (
            <Button
              onClick={onMenuClick}
              variant="outline"
              className="shrink-0 p-1.5 md:p-2.5 lg:hidden bg-transparent border-transparent text-[#193C1F] hover:bg-black/5"
            >
              <Menu className="h-5 w-5 md:h-6 md:w-6" />
            </Button>
          )}

          {showBackButton && (
            <Button
              onClick={() => router.back()}
              variant="outline"
              className="group shrink-0 p-1.5 md:p-2.5 bg-transparent border-transparent hover:bg-black/5"
            >
              <ChevronLeft size={20} strokeWidth={2.5} />
            </Button>
          )}

          {withLogo && (
            <div className="shrink-0 hidden sm:block">
              <Logo />
            </div>
          )}

          {withSearch && (
            <div
              className={`hidden md:block transition-all duration-300 w-[250px]`}
            >
              <div className="relative w-full flex items-center">
                <Input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={`${t('common.search')}...`}
                  icon={
                    <Search
                      size={18}
                      className="text-[#8EA087]"
                      strokeWidth={2.5}
                    />
                  }
                  className="h-[40px] md:h-[52px] w-full bg-[#EBE6DE] pr-4 text-[14px] md:text-[15px] text-[#193c1f] placeholder:text-[#8ea087] shadow-sm rounded-xl"
                />
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1.5 sm:gap-3 md:gap-6 ml-auto">
          {withSearch && (
            <div className="flex items-center md:hidden">
              {!isSearchExpanded ? (
                <Button
                  variant="ghost"
                  className="p-1.5 sm:p-2 text-[#193C1F] hover:bg-black/5 shrink-0"
                  onClick={() => setIsSearchExpanded(true)}
                >
                  <Search size={18} strokeWidth={2.5} />
                </Button>
              ) : (
                <div className="relative flex items-center w-[140px] sm:w-[200px] transition-all duration-300 animate-in fade-in slide-in-from-right-2">
                  <Input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onBlur={() =>
                      setTimeout(() => setIsSearchExpanded(false), 200)
                    }
                    placeholder={`${t('common.search')}...`}
                    icon={
                      <Search
                        size={18}
                        className="text-[#8EA087]"
                        strokeWidth={2.5}
                      />
                    }
                    className="h-[36px] sm:h-[40px] w-full bg-[#EBE6DE] pr-2 text-[13px] sm:text-[14px] text-[#193c1f] placeholder:text-[#8ea087] shadow-sm rounded-lg"
                    autoFocus
                  />
                </div>
              )}
            </div>
          )}

          <div className="flex items-center gap-1 sm:gap-2 md:gap-3 shrink-0">
            <Button
              onClick={() => setLanguage(language === 'en' ? 'id' : 'en')}
              variant="outline"
              className="rounded-md border-[#193c1f] px-1.5 sm:px-2 py-0.5 sm:py-1 text-[9px] sm:text-[10px] md:text-xs text-[#193c1f] hover:bg-[#193c1f] hover:text-[#f7f3ed] h-5 sm:h-6 md:h-9 min-w-0 shrink-0 font-bold"
            >
              {language === 'en' ? 'ID' : 'EN'}
            </Button>

            <Button
              type="button"
              variant="outline"
              className="h-5 w-5 sm:h-6 sm:w-6 md:h-9 md:w-9 rounded-full border-[#d0d5cb] p-0 flex items-center justify-center text-[#193c1f] hover:bg-[#d0d5cb]/50 min-w-0 shrink-0"
              title="Dark Mode (Coming Soon)"
            >
              <Moon size={16} strokeWidth={2.5} className="text-[#193c1f]" />
            </Button>
          </div>

          <div className="relative shrink-0" ref={dropdownRef}>
            <div
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center gap-1 sm:gap-2 md:gap-4 pl-1.5 sm:pl-2 md:pl-6 border-l border-[#d0d5cb] cursor-pointer group select-none"
            >
              <div className="text-right hidden sm:block">
                <p className="text-[12px] md:text-[15px] font-bold text-[#193c1f] leading-tight max-w-[80px] md:max-w-none truncate">
                  {profileUsername}
                </p>
                <p className="text-[9px] md:text-[11px] text-[#8ea087] font-bold uppercase mt-0.5">
                  ID: {profileId}
                </p>
              </div>
              <div
                className={`w-6 h-6 sm:w-8 sm:h-8 md:w-12 md:h-12 shrink-0 rounded-full md:rounded-2xl overflow-hidden border border-white md:border-2 shadow-sm md:shadow-md transition-all ${isProfileOpen ? 'border-[#8ea087] ring-2 ring-[#8ea087]/10 md:ring-4' : 'group-hover:border-[#8ea087]'}`}
              >
                <Image
                  src={profileAvatar}
                  alt="avatar"
                  width={48}
                  height={48}
                  unoptimized
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {isProfileOpen && (
              <div className="absolute right-0 mt-2 md:mt-3 w-44 md:w-52 bg-white border border-[#e2ddd6] rounded-xl shadow-xl z-[1001] animate-in fade-in zoom-in-95 duration-150 overflow-hidden">
                <div className="px-3 py-2.5 border-b border-[#f0ece5]">
                  <p className="text-[11px] font-black text-[#193c1f] truncate">
                    {profileUsername}
                  </p>
                  <p className="text-[9px] text-[#8ea087] font-bold mt-0.5">
                    ID: {profileId}
                  </p>
                </div>
                <button
                  onClick={handleProfileClick}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 text-[12px] md:text-[13px] text-[#193c1f] hover:bg-[#f7f3ed] transition-colors text-left"
                >
                  <User size={18} strokeWidth={2} /> {t('header.profile')}
                </button>
                <div className="h-px bg-[#f0ece5] mx-0" />
                <button
                  onClick={() => {
                    setIsProfileOpen(false);
                    if (onLogoutClick) onLogoutClick();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 text-[12px] md:text-[13px] text-red-500 hover:bg-red-50 transition-colors text-left"
                >
                  <LogOut size={18} strokeWidth={2} /> {t('header.logout')}
                </button>
              </div>
            )}
          </div>
        </div>
      </header>
    </>
  );
};
