'use client';

import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { ArrowRight, FileText, Heart } from 'lucide-react';

type Props = {
  onSelectPlatform: () => void;
  onSelectReport: () => void;
};

export function DonationTypeSelector({
  onSelectPlatform,
  onSelectReport,
}: Props) {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-extrabold text-[#193c1f] mb-2">
          New Donation
        </h1>
        <p className="text-[#8ea087] text-lg">
          Choose how you&apos;d like to contribute today.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Platform Card */}
        <Card
          role="button"
          tabIndex={0}
          onClick={onSelectPlatform}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              onSelectPlatform();
            }
          }}
          className="group cursor-pointer rounded-2xl border-2 border-[#d0d5cb] p-8 text-left transition-all duration-300 hover:border-[#8ea087] hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#8ea087]/40"
        >
          <div className="w-14 h-14 bg-[#8ea087]/10 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-[#8ea087]/20 transition-colors">
            <Heart className="h-7 w-7 text-[#8ea087]" />
          </div>
          <h2 className="text-xl font-black text-[#193c1f] mb-2 group-hover:text-[#8ea087] transition-colors">
            Support the Platform
          </h2>
          <p className="text-sm text-[#193c1f]/60 leading-relaxed">
            Help keep CareConnect running. Your donation covers operational
            costs so we can keep transaction fees at 0% for those in need.
          </p>
          <Button
            type="button"
            variant="ghost"
            className="mt-6 px-0 py-0 text-[#8ea087]"
            onClick={(event) => {
              event.stopPropagation();
              onSelectPlatform();
            }}
          >
            <span>Donate to CareConnect</span>
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Button>
        </Card>

        {/* Report Card */}
        <Card
          role="button"
          tabIndex={0}
          onClick={onSelectReport}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              onSelectReport();
            }
          }}
          className="group cursor-pointer rounded-2xl border-2 border-[#d0d5cb] p-8 text-left transition-all duration-300 hover:border-[#193c1f] hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#193c1f]/30"
        >
          <div className="w-14 h-14 bg-[#193c1f]/10 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-[#193c1f]/20 transition-colors">
            <FileText className="h-7 w-7 text-[#193c1f]" />
          </div>
          <h2 className="text-xl font-black text-[#193c1f] mb-2 group-hover:text-[#8ea087] transition-colors">
            Donate to a Report Case
          </h2>
          <p className="text-sm text-[#193c1f]/60 leading-relaxed">
            Directly support victims of a reported incident. Browse active cases
            and choose the one that matters most to you.
          </p>
          <Button
            type="button"
            variant="ghost"
            className="mt-6 px-0 py-0 text-[#193c1f]"
            onClick={(event) => {
              event.stopPropagation();
              onSelectReport();
            }}
          >
            <span>Browse Reports</span>
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Button>
        </Card>
      </div>
    </div>
  );
}
