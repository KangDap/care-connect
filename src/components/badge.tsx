import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  status?: 'UPCOMING' | 'PENDING' | 'SUCCESS' | 'DEFAULT';
}

export const Badge = ({ children, status = 'DEFAULT' }: BadgeProps) => {
  const colors = {
    UPCOMING: 'bg-[#D1B698]/20 text-[#D1B698]',
    PENDING: 'bg-[#D1B698]/30 text-[#D1B698]',
    SUCCESS: 'bg-[#193C1F]/10 text-[#193C1F]',
    DEFAULT: 'bg-[#EBE6DE] text-[#8EA087]',
  };

  return (
    <span
      className={`px-4 py-1.5 rounded-full text-[10px] font-black ${colors[status as keyof typeof colors] || colors.DEFAULT}`}
    >
      {children}
    </span>
  );
};
