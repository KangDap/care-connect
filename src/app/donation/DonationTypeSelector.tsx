'use client';

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
        <button
          onClick={onSelectPlatform}
          className="group text-left bg-white border-2 border-[#d0d5cb] rounded-2xl p-8 hover:border-[#8ea087] hover:shadow-xl transition-all duration-300"
        >
          <div className="w-14 h-14 bg-[#8ea087]/10 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-[#8ea087]/20 transition-colors">
            <svg
              className="w-7 h-7 text-[#8ea087]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-black text-[#193c1f] mb-2 group-hover:text-[#8ea087] transition-colors">
            Support the Platform
          </h2>
          <p className="text-sm text-[#193c1f]/60 leading-relaxed">
            Help keep CareConnect running. Your donation covers operational
            costs so we can keep transaction fees at 0% for those in need.
          </p>
          <div className="mt-6 flex items-center gap-2 text-[#8ea087] font-bold text-sm">
            <span>Donate to CareConnect</span>
            <svg
              className="w-4 h-4 group-hover:translate-x-1 transition-transform"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 5l7 7-7 7"
              />
            </svg>
          </div>
        </button>

        {/* Report Card */}
        <button
          onClick={onSelectReport}
          className="group text-left bg-white border-2 border-[#d0d5cb] rounded-2xl p-8 hover:border-[#193c1f] hover:shadow-xl transition-all duration-300"
        >
          <div className="w-14 h-14 bg-[#193c1f]/10 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-[#193c1f]/20 transition-colors">
            <svg
              className="w-7 h-7 text-[#193c1f]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-black text-[#193c1f] mb-2 group-hover:text-[#8ea087] transition-colors">
            Donate to a Report Case
          </h2>
          <p className="text-sm text-[#193c1f]/60 leading-relaxed">
            Directly support victims of a reported incident. Browse active cases
            and choose the one that matters most to you.
          </p>
          <div className="mt-6 flex items-center gap-2 text-[#193c1f] font-bold text-sm">
            <span>Browse Reports</span>
            <svg
              className="w-4 h-4 group-hover:translate-x-1 transition-transform"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 5l7 7-7 7"
              />
            </svg>
          </div>
        </button>
      </div>
    </div>
  );
}
