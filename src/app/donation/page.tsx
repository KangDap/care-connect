import Link from 'next/link';
import React from 'react';

const DonationPage = () => {
  return (
    <div className="min-h-screen flex flex-col font-sans bg-[#F7F3ED] text-[#193C1F]">
      {/* HEADER */}
      <header className="w-full bg-[#F7F3ED] border-b border-[#D0D5CB] py-6">
        <div className="max-w-6xl mx-auto px-6 flex justify-between items-center">
          <Link href="/landingPage" className="flex items-center gap-2">
            <svg
              className="w-8 h-8 text-[#8EA087]"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
              <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
            </svg>
            <span className="text-xl font-bold text-[#193C1F]">
              CareConnect
            </span>
          </Link>

          <nav className="flex items-center gap-8">
            <Link
              href="/landingPage"
              className="text-[#193C1F] hover:text-[#8EA087] font-medium"
            >
              Home
            </Link>
            <a
              className="text-[#193C1F] hover:text-[#8EA087] font-medium"
              href="#"
            >
              Causes
            </a>
            <a
              className="text-[#193C1F] hover:text-[#8EA087] font-medium"
              href="#"
            >
              About
            </a>
            <div className="bg-[#D0D5CB] p-2 rounded-full cursor-pointer">
              <svg
                className="w-6 h-6 text-[#193C1F]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                />
              </svg>
            </div>
          </nav>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="flex-grow max-w-6xl mx-auto px-6 py-12 w-full grid grid-cols-1 md:grid-cols-12 gap-8">
        {/* Left Column: Form Sections */}
        <div className="md:col-span-8 flex flex-col gap-8">
          <section>
            <h1 className="text-4xl font-extrabold text-[#193C1F] mb-2">
              Make a Difference
            </h1>
            <p className="text-[#8EA087] text-lg">
              Your support directly impacts lives and keeps our platform running
              securely.
            </p>
          </section>

          {/* Select Donation Type */}
          <section className="bg-white border border-[#D0D5CB] rounded-xl p-8 shadow-sm">
            <div className="flex items-center gap-2 mb-6 text-[#D1B698]">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                />
              </svg>
              <h2 className="text-[#193C1F] font-bold text-lg">
                Select Donation Type
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="border-2 border-[#193C1F] bg-[#D0D5CB] rounded-xl p-6 cursor-pointer relative">
                <div className="flex justify-between items-start mb-4">
                  <div className="bg-white p-2 rounded-lg text-[#193C1F]">
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                      />
                    </svg>
                  </div>
                  <div className="w-4 h-4 rounded-full border-4 border-[#193C1F] bg-white"></div>
                </div>
                <h3 className="text-[#193C1F] font-bold mb-1">
                  Support a Victim
                </h3>
                <p className="text-[#8EA087] text-sm leading-tight">
                  Directly fund recovery efforts and medical bills.
                </p>
              </div>

              <div className="border border-[#D0D5CB] bg-[#EDE4D8] rounded-xl p-6 cursor-pointer">
                <div className="flex justify-between items-start mb-4">
                  <div className="bg-white p-2 rounded-lg text-[#8EA087]">
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                      />
                      <path
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                      />
                    </svg>
                  </div>
                  <div className="w-4 h-4 rounded-full border border-[#8EA087]"></div>
                </div>
                <h3 className="text-[#193C1F] font-bold mb-1">
                  Support Platform
                </h3>
                <p className="text-[#8EA087] text-sm leading-tight">
                  Help maintain secure infrastructure and operations.
                </p>
              </div>
            </div>
          </section>

          {/* Choose Amount */}
          <section className="bg-white border border-[#D0D5CB] rounded-xl p-8 shadow-sm">
            <div className="flex items-center gap-2 mb-6 text-[#D1B698]">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                />
              </svg>
              <h2 className="text-[#193C1F] font-bold text-lg">
                Choose Amount
              </h2>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <button className="py-4 rounded-lg bg-[#EDE4D8] border border-[#D0D5CB] text-[#193C1F] font-bold">
                $25
              </button>
              <button className="py-4 rounded-lg bg-[#D0D5CB] border-2 border-[#193C1F] text-[#193C1F] font-bold">
                $50
              </button>
              <button className="py-4 rounded-lg bg-[#EDE4D8] border border-[#D0D5CB] text-[#193C1F] font-bold">
                $100
              </button>
              <button className="py-4 rounded-lg bg-[#EDE4D8] border border-[#D0D5CB] text-[#193C1F] font-bold">
                $250
              </button>
            </div>

            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8EA087]">
                $
              </span>
              <input
                className="w-full pl-8 py-3 rounded-lg border border-[#D0D5CB] bg-white focus:ring-[#8EA087] focus:border-[#8EA087]"
                placeholder="Enter custom amount"
                type="text"
              />
            </div>
          </section>

          {/* Payment Method */}
          <section className="bg-white border border-[#D0D5CB] rounded-xl p-8 shadow-sm">
            <div className="flex items-center gap-2 mb-6 text-[#D1B698]">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                />
              </svg>
              <h2 className="text-[#193C1F] font-bold text-lg">
                Payment Method
              </h2>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border border-[#D0D5CB] rounded-lg bg-white cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full border-4 border-[#193C1F] bg-white"></div>
                  <span className="text-[#193C1F] font-medium">
                    Credit or Debit Card
                  </span>
                </div>
                <svg
                  className="w-6 h-6 text-[#8EA087]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                  />
                </svg>
              </div>

              <div className="flex items-center justify-between p-4 border border-[#D0D5CB] rounded-lg bg-white cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full border border-[#8EA087]"></div>
                  <span className="text-[#193C1F] font-medium">PayPal</span>
                </div>
                <svg
                  className="w-6 h-6 text-[#8EA087]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                  />
                </svg>
              </div>
            </div>
          </section>
        </div>

        {/* Right Column: Sidebar */}
        <aside className="md:col-span-4 flex flex-col gap-6">
          <section className="bg-[#F7F3ED] border border-[#D0D5CB] rounded-xl p-8 shadow-md">
            <h2 className="text-[#193C1F] font-bold text-xl mb-6">
              Donation Summary
            </h2>
            <div className="space-y-4 mb-8">
              <div className="flex justify-between items-center">
                <span className="text-[#8EA087]">Support Type</span>
                <span className="text-[#193C1F] font-bold">Victim Fund</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#8EA087]">Donation Amount</span>
                <span className="text-[#193C1F] font-bold">$50.00</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#8EA087]">Processing Fee</span>
                <span className="text-[#193C1F] font-bold">$0.00</span>
              </div>
              <hr className="border-[#D0D5CB] my-2" />
              <div className="flex justify-between items-end">
                <div className="flex flex-col">
                  <span className="text-[#193C1F] font-bold text-lg">
                    Total
                  </span>
                  <span className="text-[#193C1F] font-bold text-lg">
                    Contribution
                  </span>
                </div>
                <span className="text-3xl font-extrabold text-[#D1B698]">
                  $50.00
                </span>
              </div>
            </div>

            <button className="w-full bg-[#8EA087] text-[#F7F3ED] py-4 rounded-xl font-bold flex items-center justify-center gap-2 mb-4 hover:opacity-90 transition-opacity">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                />
              </svg>
              Donate Now
            </button>
            <p className="text-center text-xs text-[#8EA087] flex items-center justify-center gap-1">
              <svg
                className="w-3 h-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                />
              </svg>
              256-bit Secure SSL Connection
            </p>
          </section>

          <section className="bg-[#F7F3ED] border border-[#D0D5CB] rounded-xl p-6 border-l-4 border-l-[#D1B698]">
            <div className="flex gap-3">
              <svg
                className="w-5 h-5 text-[#D1B698] flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                />
              </svg>
              <div>
                <h4 className="text-[#193C1F] font-bold text-sm mb-2">
                  Why Support Us?
                </h4>
                <p className="text-[#8EA087] text-xs leading-relaxed">
                  CareConnect ensures that 100% of the funds designated for
                  victims go directly to the cause. Platform donations help us
                  keep our transaction fees at 0% for those in need.
                </p>
              </div>
            </div>
          </section>
        </aside>
      </main>
    </div>
  );
};

export default DonationPage;
