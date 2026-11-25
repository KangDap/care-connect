import React from 'react';

interface PageHeaderProps {
  title: React.ReactNode;
  description?: React.ReactNode;
  /** Small element rendered above the title (badge, back link, eyebrow). */
  eyebrow?: React.ReactNode;
  /** Right-aligned actions on larger screens, stacked below on mobile. */
  actions?: React.ReactNode;
}

/** Standard title block used at the top of every dashboard page. */
export const PageHeader = ({
  title,
  description,
  eyebrow,
  actions,
}: PageHeaderProps) => (
  <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
    <div className="min-w-0">
      {eyebrow && <div className="mb-3">{eyebrow}</div>}
      <h1 className="text-2xl font-black leading-tight tracking-tight text-[#193c1f] sm:text-3xl md:text-[32px]">
        {title}
      </h1>
      {description && (
        <p className="mt-1 max-w-3xl text-sm font-medium text-[#8ea087] md:text-base">
          {description}
        </p>
      )}
    </div>
    {actions}
  </div>
);
