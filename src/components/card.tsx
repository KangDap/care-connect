import React from 'react';

export const Card = ({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <div
    className={`bg-white border border-[#d0d5cb]/50 rounded-[40px] shadow-sm overflow-hidden ${className}`}
  >
    {children}
  </div>
);

export const CardHeader = ({
  title,
  action,
}: {
  title: string;
  action?: React.ReactNode;
}) => (
  <div className="p-8 border-b border-[#f7f3ed] flex justify-between items-center bg-[#FDFCFB]">
    <h3 className="font-bold text-[18px] text-[#193c1f]">{title}</h3>
    {action}
  </div>
);
