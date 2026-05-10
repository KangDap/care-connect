import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  status?: 'UPCOMING' | 'PENDING' | 'SUCCESS' | 'DEFAULT';
}

export const Badge = ({ children, status = 'DEFAULT' }: BadgeProps) => {
  const colors = {
    UPCOMING: 'bg-[#d1b698]/20 text-[#d1b698]',
    PENDING: 'bg-[#d1b698]/30 text-[#d1b698]',
    SUCCESS: 'bg-[#193c1f]/10 text-[#193c1f]',
    DEFAULT: 'bg-[#EBE6DE] text-[#8ea087]',
  };

  return (
    <span
      className={`px-4 py-1.5 rounded-full text-[10px] font-black ${colors[status as keyof typeof colors] || colors.DEFAULT}`}
    >
      {children}
    </span>
  );
};
