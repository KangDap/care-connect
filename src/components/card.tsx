import React from 'react';

export const Card = ({
  children,
  className = '',
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  children: React.ReactNode;
}) => (
  <div
    className={`min-w-0 bg-white border border-[#D0D5CB]/50 rounded-2xl md:rounded-3xl shadow-sm overflow-hidden ${className}`}
    {...props}
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
  <div className="p-4 sm:p-6 md:p-8 border-b border-[#f7f3ed] flex flex-wrap gap-4 justify-between items-center bg-[#FDFCFB]">
    <h3 className="font-bold text-[16px] md:text-[18px] text-[#193c1f]">
      {title}
    </h3>
    {action}
  </div>
);
