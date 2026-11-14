'use client';

import { Button } from '@/components/button';
import { useTranslation } from '@/components/providers/i18n-provider';
import { PublicHeader } from '@/components/public-header';
import { Mail } from 'lucide-react';
import Image from 'next/image';

const campaignEmail = 'nikitaputri2709@gmail.com';

const DEFAULT_SUBJECT =
  'Support for Together We Share, Together We Care Campaign';
const DEFAULT_BODY =
  'Hello CareConnect team,\n\nI would like to support the "Together We Share, Together We Care" campaign. Please provide details on how to contribute.\n\nThank you.';

export default function CampaignPage() {
  const { translateText } = useTranslation();

  const emailSubject = translateText(DEFAULT_SUBJECT);
  const emailBody = translateText(DEFAULT_BODY);

  const mailtoHref = `mailto:${campaignEmail}?subject=${encodeURIComponent(
    emailSubject,
  )}&body=${encodeURIComponent(emailBody)}`;

  return (
    <div className="min-h-screen bg-[#f7f3ed] text-[#193c1f]">
      <PublicHeader />

      <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6 md:py-20">
        <article className="overflow-hidden rounded-3xl border border-[#d0d5cb] bg-white shadow-xl shadow-[#193c1f]/10">
          <div className="relative h-64 overflow-hidden sm:h-80 md:h-[420px]">
            {/* Flat cartoon illustration matching landing page carousel aesthetic */}
            <Image
              src="/campaign-hero.jpg"
              alt="Community sharing illustration"
              fill
              priority
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#193c1f]/40 via-transparent to-transparent" />
            <span className="absolute bottom-5 left-5 rounded-full bg-[#f7f3ed] px-4 py-2 text-sm font-black text-[#193c1f] sm:bottom-7 sm:left-7 shadow-sm">
              Humanitarian Campaign
            </span>
          </div>

          <div className="p-6 sm:p-10 md:p-14">
            <p className="mb-3 text-sm font-bold uppercase tracking-[0.18em] text-[#8ea087]">
              CareConnect · Social Fundraising
            </p>
            <h1 className="max-w-3xl text-3xl font-black leading-tight sm:text-4xl md:text-5xl">
              Together We Share, Together We Care
            </h1>
            <p className="mt-6 max-w-3xl text-base leading-8 text-[#193c1f]/80 sm:text-lg">
              Every contribution provides new hope for those in need. Let us
              work together to supply essential necessities and support the
              welfare of our community.
            </p>

            <section className="mt-10 border-y border-[#d0d5cb] py-8">
              <h2 className="text-xl font-black">Why participate?</h2>
              <ul className="mt-5 space-y-3 text-[#193c1f]/80">
                <li className="flex gap-3">
                  <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-[#8ea087]" />
                  Helping fulfill the basic needs of the community.
                </li>
                <li className="flex gap-3">
                  <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-[#8ea087]" />
                  Supporting meaningful social initiatives.
                </li>
                <li className="flex gap-3">
                  <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-[#8ea087]" />
                  Fostering empathy and a spirit of giving.
                </li>
              </ul>
            </section>

            <a href={mailtoHref} className="mt-8 block">
              <Button className="flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-base sm:text-lg">
                <Mail size={20} />
                Contact Us to Donate
              </Button>
            </a>
            <p className="mt-4 text-center text-sm text-[#193c1f]/60">
              An email draft will open with a pre-filled message.
            </p>
          </div>
        </article>
      </main>
    </div>
  );
}
