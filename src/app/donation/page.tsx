'use client';

import { Alert } from '@/components/alert';
import { Header } from '@/components/header';
import { authClient } from '@/lib/auth/auth-client';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';

const formatCurrency = (val: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(val);

const HARDCODED_REPORT_ID = 2;

type DonationTargetReport = {
  id: number;
  title: string;
  category: string;
  province: string;
  city: string;
  status: string;
  incidentDate: string;
  summary: string;
};

const formatReportDate = (value: string) =>
  new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date(value));

const formatReportDisplayId = (id: number) =>
  `#REP-${String(id).padStart(4, '0')}`;

const DonationContent = () => {
  const router = useRouter();
  const [isLogoutAlertOpen, setIsLogoutAlertOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await authClient.signOut();
    router.replace('/login');
    router.refresh();
  };

  const [amount, setAmount] = useState<number>(50000);
  const [paymentMethod, setPaymentMethod] = useState<string>('CREDIT_CARD');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingReport, setIsLoadingReport] = useState(true);
  const [targetReport, setTargetReport] = useState<DonationTargetReport | null>(
    null,
  );
  const [message, setMessage] = useState<{ type: string; text: string }>({
    type: '',
    text: '',
  });

  useEffect(() => {
    const controller = new AbortController();

    const fetchTargetReport = async () => {
      try {
        setIsLoadingReport(true);

        const res = await fetch(`/api/report?id=${HARDCODED_REPORT_ID}`, {
          signal: controller.signal,
        });
        const result = await res.json().catch(() => ({}));

        if (!res.ok || !result?.success || !result?.data) {
          throw new Error(
            result?.error?.message || 'Failed to load report details',
          );
        }

        const report = result.data;
        setTargetReport({
          id: report.id,
          title: report.title,
          category: report.category,
          province: report.province,
          city: report.city,
          status: report.status,
          incidentDate: new Date(report.incidentDate).toISOString(),
          summary: report.description,
        });
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }

        console.error('Failed to fetch target report:', error);
        setMessage({
          type: 'error',
          text: 'Failed to load donation target report. Please refresh the page.',
        });
      } finally {
        if (!controller.signal.aborted) {
          setIsLoadingReport(false);
        }
      }
    };

    fetchTargetReport();

    return () => {
      controller.abort();
    };
  }, []);

  useEffect(() => {
    const handlePageShow = () => {
      setMessage({ type: '', text: '' });
      setIsSubmitting(false);
    };

    window.addEventListener('pageshow', handlePageShow);

    return () => {
      window.removeEventListener('pageshow', handlePageShow);
    };
  }, []);

  const handleDonate = async () => {
    if (!amount || amount <= 0) {
      setMessage({ type: 'error', text: 'Please enter a valid amount.' });
      return;
    }

    if (!targetReport) {
      setMessage({
        type: 'error',
        text: 'Donation target report is not available yet.',
      });
      return;
    }

    setIsSubmitting(true);
    setMessage({ type: '', text: '' });

    try {
      const formData = new FormData();
      formData.append('amount', amount.toString());
      formData.append('paymentMethod', paymentMethod);
      formData.append('reportId', targetReport.id.toString());

      const res = await fetch('/api/donation', {
        method: 'POST',
        body: formData,
      });

      const result = await res.json().catch(() => ({}));

      if (!res.ok || !result.success) {
        setMessage({
          type: 'error',
          text: result?.error?.message || 'Failed to process donation.',
        });
        setIsSubmitting(false);
        return;
      }

      const redirectUrl = result?.data?.payment?.redirectUrl as
        | string
        | undefined;

      if (!redirectUrl) {
        setMessage({
          type: 'error',
          text: 'Payment redirect URL is missing. Please try again.',
        });
        setIsSubmitting(false);
        return;
      }

      window.location.assign(redirectUrl);
    } catch (error) {
      console.error('Donation failed:', error);
      setMessage({
        type: 'error',
        text: 'Failed to complete donation. Please try again.',
      });
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col font-sans bg-[#F7F3ED] text-[#193C1F] relative">
      {/* Loading & Success Overlay */}
      {(isSubmitting || message.type === 'success') && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 backdrop-blur-sm transition-all duration-300">
          {message.type === 'success' ? (
            <div className="bg-white p-10 rounded-2xl shadow-xl flex flex-col items-center gap-4 text-center max-w-sm w-full mx-4">
              <div className="w-20 h-20 bg-[#8EA087]/10 rounded-full flex items-center justify-center mb-2">
                <svg
                  className="h-10 w-10 text-[#8EA087]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M5 13l4 4L19 7"
                  ></path>
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-[#193C1F]">Thank You!</h3>
              <p className="text-[#193C1F]/70">{message.text}</p>
            </div>
          ) : (
            <div className="bg-white p-10 rounded-2xl shadow-xl flex flex-col items-center gap-6 text-center max-w-sm w-full mx-4">
              <svg
                className="animate-spin h-12 w-12 text-[#8EA087]"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              <div>
                <h3 className="text-xl font-bold text-[#193C1F] mb-1">
                  Processing Payment...
                </h3>
                <p className="text-sm text-[#193C1F]/60">
                  Securely completing your transaction.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* HEADER */}
      <Header
        withSearch={false}
        withLogo={true}
        onLogoutClick={() => setIsLogoutAlertOpen(true)}
      />

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

          {/* Donation Target */}
          <section className="bg-white border border-[#D0D5CB] rounded-xl p-8 shadow-sm">
            <div className="flex items-center gap-2 mb-6 text-[#D1B698]">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  d="M8 10h.01M12 10h.01M16 10h.01M9 16h6M7 4h10a2 2 0 012 2v12a2 2 0 01-2 2H7a2 2 0 01-2-2V6a2 2 0 012-2z"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                />
              </svg>
              <h2 className="text-[#193C1F] font-bold text-lg">
                Report Target ({formatReportDisplayId(HARDCODED_REPORT_ID)})
              </h2>
            </div>

            <div className="rounded-xl border border-[#D0D5CB] bg-[#F7F3ED] p-6 space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <span className="rounded-full bg-[#193C1F] px-3 py-1 text-xs font-bold text-[#F7F3ED]">
                  {formatReportDisplayId(
                    targetReport?.id ?? HARDCODED_REPORT_ID,
                  )}
                </span>
                <span className="rounded-full border border-[#D1B698] px-3 py-1 text-xs font-bold text-[#193C1F]">
                  {targetReport?.category || 'Loading...'}
                </span>
                <span className="rounded-full border border-[#8EA087] px-3 py-1 text-xs font-bold text-[#193C1F]">
                  {targetReport?.status || 'Loading...'}
                </span>
              </div>

              <div>
                <h3 className="text-xl font-extrabold text-[#193C1F] mb-2">
                  {targetReport?.title || 'Loading report details...'}
                </h3>
                <p className="text-sm text-[#193C1F]/70 leading-relaxed">
                  {targetReport?.summary ||
                    'Please wait while we fetch report details.'}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                <div className="rounded-lg bg-white border border-[#D0D5CB] p-3">
                  <p className="text-[#8EA087] text-xs mb-1">Location</p>
                  <p className="font-bold text-[#193C1F]">
                    {targetReport
                      ? `${targetReport.city}, ${targetReport.province}`
                      : '-'}
                  </p>
                </div>
                <div className="rounded-lg bg-white border border-[#D0D5CB] p-3">
                  <p className="text-[#8EA087] text-xs mb-1">Incident Date</p>
                  <p className="font-bold text-[#193C1F]">
                    {targetReport
                      ? formatReportDate(targetReport.incidentDate)
                      : '-'}
                  </p>
                </div>
                <div className="rounded-lg bg-white border border-[#D0D5CB] p-3">
                  <p className="text-[#8EA087] text-xs mb-1">Target Donasi</p>
                  <p className="font-bold text-[#193C1F]">Korban</p>
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-lg border border-[#D1B698] bg-[#FFF9F2] p-4 text-xs text-[#6E5A44]">
              {isLoadingReport
                ? 'Mengambil data report dari database...'
                : 'Testing only, waiting for PublicReports page.'}
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
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              <h2 className="text-[#193C1F] font-bold text-lg">
                Choose Amount
              </h2>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              {[50000, 100000, 250000, 500000].map((val) => (
                <button
                  key={val}
                  onClick={() => setAmount(val)}
                  className={`py-4 rounded-lg font-bold transition-colors ${amount === val ? 'bg-[#D0D5CB] border-2 border-[#193C1F] text-[#193C1F]' : 'bg-[#EDE4D8] border border-[#D0D5CB] text-[#193C1F]'}`}
                >
                  {formatCurrency(val)}
                </button>
              ))}
            </div>

            <div className="relative mt-2">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8EA087]">
                Rp
              </span>
              <input
                className="w-full pl-12 py-3 rounded-lg border border-[#D0D5CB] bg-white focus:ring-[#8EA087] focus:border-[#8EA087] outline-none"
                placeholder="Enter custom amount"
                type="number"
                value={amount || ''}
                onChange={(e) => setAmount(Number(e.target.value))}
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
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                />
              </svg>
              <h2 className="text-[#193C1F] font-bold text-lg">
                Payment Method
              </h2>
            </div>

            <div className="space-y-4">
              {[
                { id: 'CREDIT_CARD', label: 'Credit or Debit Card' },
                { id: 'BANK_TRANSFER', label: 'Bank Transfer' },
                { id: 'EWALLET', label: 'GoPay' },
                { id: 'QRIS', label: 'Other QRIS' },
              ].map((method) => (
                <div
                  key={method.id}
                  onClick={() => setPaymentMethod(method.id)}
                  className={`flex items-center justify-between p-4 border rounded-lg cursor-pointer transition-colors ${paymentMethod === method.id ? 'border-[#193C1F] bg-[#F7F3ED]' : 'border-[#D0D5CB] bg-white'}`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-5 h-5 rounded-full border-4 ${paymentMethod === method.id ? 'border-[#193C1F] bg-white' : 'border-[#D0D5CB] bg-transparent'}`}
                    ></div>
                    <span className="text-[#193C1F] font-medium">
                      {method.label}
                    </span>
                  </div>
                  <svg
                    className={`w-6 h-6 ${paymentMethod === method.id ? 'text-[#193C1F]' : 'text-[#8EA087]'}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                    />
                  </svg>
                </div>
              ))}
            </div>

            {message.type === 'error' && (
              <div className="mt-4 p-4 text-red-600 bg-red-100 border border-red-300 rounded">
                {message.text}
              </div>
            )}
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
                <span className="text-[#8EA087]">Report Target</span>
                <span className="text-[#193C1F] font-bold">
                  {formatReportDisplayId(
                    targetReport?.id ?? HARDCODED_REPORT_ID,
                  )}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#8EA087]">Case</span>
                <span className="text-[#193C1F] font-bold text-right max-w-[65%]">
                  {targetReport?.title || 'Loading report details...'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#8EA087]">Donation Amount</span>
                <span className="text-[#193C1F] font-bold">
                  {formatCurrency(amount || 0)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#8EA087]">Processing Fee</span>
                <span className="text-[#193C1F] font-bold">Rp 0</span>
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
                <span className="text-xl md:text-2xl font-extrabold text-[#D1B698]">
                  {formatCurrency(amount || 0)}
                </span>
              </div>
            </div>

            <button
              onClick={handleDonate}
              disabled={isSubmitting || isLoadingReport || !targetReport}
              className="w-full bg-[#8EA087] text-[#F7F3ED] py-4 rounded-xl font-bold flex items-center justify-center gap-2 mb-4 hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
              {isLoadingReport ? 'Loading Report...' : 'Donate Now'}
            </button>
            <p className="text-center text-xs text-[#8EA087] flex items-center justify-center gap-1">
              <svg
                className="w-3 h-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
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
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
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

      <Alert
        isOpen={isLogoutAlertOpen}
        onClose={() => setIsLogoutAlertOpen(false)}
        onConfirm={handleLogout}
        type="danger"
        title="End Session?"
        description="Are you sure you want to log out?"
        confirmText={isLoggingOut ? 'Logging out...' : 'Log Out'}
      />
    </div>
  );
};

export default DonationContent;
