'use client';

import { Button } from '@/components/button';
import { useTranslation } from '@/components/providers/i18n-provider';
import { Languages } from 'lucide-react';

type LanguageToggleProps = {
  compact?: boolean;
};

export function LanguageToggle({ compact = false }: LanguageToggleProps) {
  const { language, setLanguage, t } = useTranslation();
  const nextLanguage = language === 'en' ? 'id' : 'en';
  const label = nextLanguage.toUpperCase();
  const title =
    nextLanguage === 'id' ? t('common.useIndonesian') : t('common.useEnglish');

  return (
    <Button
      type="button"
      onClick={() => setLanguage(nextLanguage)}
      variant="outline"
      className={`language-toggle-button rounded-full border-[#193c1f] text-[#193c1f] hover:bg-[#193c1f] hover:text-[#f7f3ed] whitespace-nowrap ${
        compact
          ? 'h-9 w-9 !p-0 text-[10px]'
          : 'h-9 !px-3 !py-1 text-xs sm:!px-4'
      }`}
      title={title}
      aria-label={title}
    >
      {!compact && <Languages className="h-4 w-4" />}
      <span className="font-black tracking-wide">{label}</span>
    </Button>
  );
}
