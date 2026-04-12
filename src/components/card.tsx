import React from 'react';

export const Card = ({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <div
    className={`bg-white border border-[#D0D5CB]/50 rounded-[40px] shadow-sm overflow-hidden ${className}`}
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
  <div className="p-8 border-b border-[#F7F3ED] flex justify-between items-center bg-[#FDFCFB]">
    <h3 className="font-bold text-[18px] text-[#193C1F]">{title}</h3>
    {action}
  </div>
);
