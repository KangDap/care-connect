'use client';

import { Logo } from '@/components/logo';
import { useTranslation } from '@/components/providers/i18n-provider';
import { authClient } from '@/lib/auth/auth-client';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import React, { useEffect, useRef, useState } from 'react';

// --- Icons ---
const SearchIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#8EA087"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="11" cy="11" r="8"></circle>
    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
  </svg>
);

{
  /*const BellIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#193C1F"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
    <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
  </svg>
);*/
}

const UserIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
    <circle cx="12" cy="7" r="4"></circle>
  </svg>
);

const LogoutIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
    <polyline points="16 17 21 12 16 7"></polyline>
    <line x1="21" y1="12" x2="9" y2="12"></line>
  </svg>
);

{
  /*const ChevronLeftIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 18l-6-6 6-6" />
  </svg>
);*/
}

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
  const { data: session } = authClient.useSession();
  const { t, language, setLanguage } = useTranslation();

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

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
      <header className="h-[90px] w-full sticky top-0 border-b border-[#D0D5CB] flex items-center justify-between px-6 md:px-12 bg-[#F7F3ED]/80 backdrop-blur-md shrink-0 z-[100]">
        <div className="flex items-center gap-4 md:gap-8 flex-grow">
          {onMenuClick && (
            <button
              onClick={onMenuClick}
              className="p-2.5 bg-white border border-[#D0D5CB] hover:bg-[#EBE6DE] rounded-2xl transition-all shadow-sm flex items-center justify-center shrink-0 lg:hidden"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#193C1F"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
            </button>
          )}

          {showBackButton && (
            <button
              onClick={() => router.back()}
              className="p-2.5 bg-white border border-[#d0d5cb] hover:bg-[#EBE6DE] rounded-2xl transition-all shadow-sm flex items-center justify-center group shrink-0"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#193C1F"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="group-hover:-translate-x-1 transition-transform"
              >
                <path d="M19 12H5"></path>
                <path d="M12 19l-7-7 7-7"></path>
              </svg>
            </button>
          )}

          {withLogo && (
            <div className="shrink-0">
              <Logo />
            </div>
          )}

          {withSearch ? (
            <div className="relative w-full max-w-[600px]">
              <span className="absolute left-5 top-1/2 -translate-y-1/2 opacity-70">
                <SearchIcon />
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`${t('common.search')}...`}
                className="w-[250px] h-[52px] bg-[#EBE6DE] border border-transparent focus:border-[#8ea087] focus:bg-white rounded-2xl pl-14 pr-6 outline-none text-[15px] text-[#193c1f] shadow-sm transition-all"
              />
            </div>
          ) : (
            <div />
          )}
        </div>

        <div className="flex items-center gap-6 ml-10">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setLanguage(language === 'en' ? 'id' : 'en')}
              className="text-xs font-bold text-[#193c1f] border border-[#193c1f] rounded-md px-2 py-1 hover:bg-[#193c1f] hover:text-[#f7f3ed] transition-colors"
            >
              {language === 'en' ? 'ID' : 'EN'}
            </button>

            <button
              type="button"
              className="w-9 h-9 rounded-full flex items-center justify-center border border-[#d0d5cb] text-[#193c1f] hover:bg-[#d0d5cb]/50 transition-colors"
              title="Dark Mode (Coming Soon)"
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
                  d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                />
              </svg>
            </button>
          </div>

          <div className="relative" ref={dropdownRef}>
            <div
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center gap-4 pl-6 border-l border-[#d0d5cb] cursor-pointer group select-none"
            >
              <div className="text-right hidden md:block">
                <p className="text-[15px] font-bold text-[#193c1f] leading-tight">
                  {profileUsername}
                </p>
                <p className="text-[11px] text-[#8ea087] font-bold uppercase mt-0.5">
                  ID: {profileId}
                </p>
              </div>
              <div
                className={`w-12 h-12 rounded-2xl overflow-hidden border-2 shadow-md transition-all ${isProfileOpen ? 'border-[#8ea087] ring-4 ring-[#8ea087]/10' : 'border-white group-hover:border-[#8ea087]'}`}
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
              <div className="absolute right-0 mt-4 w-64 bg-white border border-[#d0d5cb] rounded-[24px] shadow-2xl py-3 z-[1001] animate-in fade-in zoom-in duration-200">
                <button
                  onClick={handleProfileClick}
                  className="w-full flex items-center gap-3 px-6 py-3 text-[14px] text-[#193c1f] hover:bg-[#f7f3ed] transition-colors"
                >
                  <UserIcon /> {t('header.profile')}
                </button>
                <div className="h-px bg-[#f7f3ed] my-2 mx-4" />
                <button
                  onClick={() => {
                    setIsProfileOpen(false);
                    if (onLogoutClick) {
                      onLogoutClick();
                    }
                  }}
                  className="w-full flex items-center gap-3 px-6 py-4 text-[14px] text-red-500 font-bold hover:bg-red-50 transition-colors"
                >
                  <LogoutIcon /> {t('header.logout')}
                </button>
              </div>
            )}
          </div>
        </div>
      </header>
    </>
  );
};
