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

/** Compact KPI tile shared by the dashboard overview pages. */
export const StatCard = ({
  icon,
  label,
  value,
  hint,
  className = '',
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  hint?: string;
  className?: string;
}) => (
  <Card className={`flex items-center gap-3 p-3 sm:p-4 md:p-5 ${className}`}>
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#f7f3ed] text-[#193c1f] md:h-11 md:w-11 md:rounded-2xl">
      {icon}
    </div>
    <div className="min-w-0">
      <p className="truncate text-[9px] font-black uppercase tracking-widest text-[#8ea087] sm:text-[10px]">
        {label}
      </p>
      <p className="text-lg font-black leading-tight text-[#193c1f] sm:text-xl md:text-2xl">
        {value}
      </p>
      {hint && (
        <p className="mt-0.5 truncate text-[9px] font-black uppercase tracking-widest text-[#d1b698]">
          {hint}
        </p>
      )}
    </div>
  </Card>
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
