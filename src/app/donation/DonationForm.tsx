'use client';

import { PublicHeader } from '@/components/public-header';
import { syncDonationPayment } from '@/lib/donation-client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

const fmt = (val: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(val);

type ReportInfo = {
  id: number;
  title: string;
  category: string;
  province: string;
  city: string;
  status?: string;
  incidentDate?: string;
  description: string;
};

type Props = {
  donationType: 'PLATFORM' | 'REPORT';
  report?: ReportInfo;
  defaultAmount?: number;
  defaultMethod?: string;
  backHref: string;
};

type MidtransSnapWindow = Window & {
  snap?: { pay: (token: string, cb?: Record<string, () => void>) => void };
};

const PAYMENT_METHODS = [
  { id: 'CREDIT_CARD', label: 'Credit or Debit Card' },
  { id: 'BANK_TRANSFER', label: 'Bank Transfer' },
  { id: 'EWALLET', label: 'GoPay' },
  { id: 'QRIS', label: 'Other QRIS' },
];

const PRESET_AMOUNTS = [50000, 100000, 250000, 500000];

export function DonationForm({
  donationType,
  report,
  defaultAmount = 50000,
  defaultMethod = 'CREDIT_CARD',
  backHref,
}: Props) {
  const router = useRouter();
  const [amount, setAmount] = useState(defaultAmount);
  const [paymentMethod, setPaymentMethod] = useState(defaultMethod);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: string; text: string }>({
    type: '',
    text: '',
  });

  const loadSnapAndPay = (
    token: string,
    clientKey: string | undefined,
    callbacks: Record<string, () => void>,
  ) => {
    const isSandbox = !clientKey || clientKey.startsWith('SB-');
    const SNAP_URL = isSandbox
      ? 'https://app.sandbox.midtrans.com/snap/snap.js'
      : 'https://app.midtrans.com/snap/snap.js';
    const callPay = () => {
      const w = window as MidtransSnapWindow;
      if (w.snap) w.snap.pay(token, callbacks);
      else {
        setMessage({
          type: 'error',
          text: 'Snap is not available. Please refresh.',
        });
        setIsSubmitting(false);
      }
    };
    const existing = document.querySelector(
      `script[src="${SNAP_URL}"]`,
    ) as HTMLScriptElement | null;
    if (existing) {
      if (clientKey && existing.getAttribute('data-client-key') !== clientKey) {
        existing.remove();
        const s = document.createElement('script');
        s.src = SNAP_URL;
        if (clientKey) s.setAttribute('data-client-key', clientKey);
        s.onload = callPay;
        document.head.appendChild(s);
      } else {
        callPay();
      }
    } else {
      const s = document.createElement('script');
      s.src = SNAP_URL;
      if (clientKey) s.setAttribute('data-client-key', clientKey);
      s.onload = callPay;
      document.head.appendChild(s);
    }
  };

  const handleDonate = async () => {
    if (!amount || amount <= 0) {
      setMessage({ type: 'error', text: 'Please enter a valid amount.' });
      return;
    }
    setIsSubmitting(true);
    setMessage({ type: '', text: '' });

    try {
      const formData = new FormData();
      formData.append('amount', amount.toString());
      formData.append('paymentMethod', paymentMethod);
      formData.append('donationType', donationType);

      const endpoint =
        donationType === 'PLATFORM'
          ? '/api/donation/platform'
          : `/api/donation/report/${report!.id}`;

      const res = await fetch(endpoint, { method: 'POST', body: formData });
      const result = await res.json().catch(() => ({}));

      if (!res.ok || !result.success) {
        setMessage({
          type: 'error',
          text: result?.error?.message || 'Failed to process donation.',
        });
        setIsSubmitting(false);
        return;
      }

      const token = result?.data?.payment?.token as string | undefined;
      const orderId = result?.data?.payment?.orderId as string | undefined;
      const clientKey = result?.data?.payment?.clientKey as string | undefined;

      if (!token || !orderId) {
        setMessage({
          type: 'error',
          text: 'Payment token missing. Please try again.',
        });
        setIsSubmitting(false);
        return;
      }

      loadSnapAndPay(token, clientKey, {
        onSuccess: async () => {
          try {
            await syncDonationPayment(orderId);
          } catch {
            /* ignore */
          }
          setMessage({ type: 'success', text: 'Thank you for your donation!' });
          setTimeout(() => router.push('/dashboard/donations'), 2000);
        },
        onPending: () => {
          setMessage({
            type: 'error',
            text: 'Payment is pending. Please complete it.',
          });
          setIsSubmitting(false);
        },
        onError: () => {
          setMessage({
            type: 'error',
            text: 'Payment failed. Please try again.',
          });
          setIsSubmitting(false);
        },
        onClose: () => {
          setIsSubmitting(false);
        },
      });
    } catch {
      setMessage({
        type: 'error',
        text: 'Failed to complete donation. Please try again.',
      });
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col font-sans bg-[#f7f3ed] text-[#193c1f] relative">
      {/* Loading / Success Overlay */}
      {(isSubmitting || message.type === 'success') && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 backdrop-blur-sm">
          {message.type === 'success' ? (
            <div className="bg-white p-10 rounded-2xl shadow-xl flex flex-col items-center gap-4 text-center max-w-sm w-full mx-4">
              <div className="w-20 h-20 bg-[#8ea087]/10 rounded-full flex items-center justify-center">
                <svg
                  className="h-10 w-10 text-[#8ea087]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-[#193c1f]">Thank You!</h3>
              <p className="text-[#193c1f]/70">{message.text}</p>
            </div>
          ) : (
            <div className="bg-white p-10 rounded-2xl shadow-xl flex flex-col items-center gap-6 text-center max-w-sm w-full mx-4">
              <svg
                className="animate-spin h-12 w-12 text-[#8ea087]"
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
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              <div>
                <h3 className="text-xl font-bold text-[#193c1f] mb-1">
                  Processing Payment...
                </h3>
                <p className="text-sm text-[#193c1f]/60">
                  Securely completing your transaction.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      <PublicHeader />

      <main className="flex-grow max-w-6xl mx-auto px-6 py-12 w-full grid grid-cols-1 md:grid-cols-12 gap-8">
        {/* Left Column */}
        <div className="md:col-span-8 flex flex-col gap-8">
          {/* Back button */}
          <button
            onClick={() => router.push(backHref)}
            className="flex items-center gap-2 text-[#8ea087] hover:text-[#193c1f] font-bold text-sm transition-colors w-fit"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back
          </button>

          <section>
            <h1 className="text-4xl font-extrabold text-[#193c1f] mb-2">
              Make a Difference
            </h1>
            <p className="text-[#8ea087] text-lg">
              {donationType === 'PLATFORM'
                ? 'Your support keeps CareConnect running at 0% transaction fees.'
                : 'Your support directly impacts victims of the selected case.'}
            </p>
          </section>

          {/* Report info card */}
          {donationType === 'REPORT' && report && (
            <section className="bg-white border border-[#d0d5cb] rounded-xl p-8 shadow-sm">
              <div className="flex items-center gap-2 mb-6 text-[#d1b698]">
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
                <h2 className="text-[#193c1f] font-bold text-lg">
                  Report Target
                </h2>
              </div>
              <div className="rounded-xl border border-[#d0d5cb] bg-[#f7f3ed] p-6 space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="rounded-full bg-[#193c1f] px-3 py-1 text-xs font-bold text-[#f7f3ed]">
                    #{String(report.id).padStart(4, '0')}
                  </span>
                  <span className="rounded-full border border-[#d1b698] px-3 py-1 text-xs font-bold text-[#193c1f]">
                    {report.category}
                  </span>
                </div>
                <h3 className="text-xl font-extrabold text-[#193c1f]">
                  {report.title}
                </h3>
                <p className="text-sm text-[#193c1f]/70 leading-relaxed line-clamp-3">
                  {report.description}
                </p>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="rounded-lg bg-white border border-[#d0d5cb] p-3">
                    <p className="text-[#8ea087] text-xs mb-1">Location</p>
                    <p className="font-bold text-[#193c1f]">
                      {report.city}, {report.province}
                    </p>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Platform info card */}
          {donationType === 'PLATFORM' && (
            <section className="bg-white border border-[#d0d5cb] rounded-xl p-8 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[#8ea087]/10 rounded-xl flex items-center justify-center shrink-0">
                  <svg
                    className="w-6 h-6 text-[#8ea087]"
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
                <div>
                  <h3 className="font-bold text-[#193c1f] text-lg">
                    CareConnect Platform
                  </h3>
                  <p className="text-sm text-[#193c1f]/70">
                    100% of platform donations go to keeping our service free
                    for those in need.
                  </p>
                </div>
              </div>
            </section>
          )}

          {/* Amount */}
          <section className="bg-white border border-[#d0d5cb] rounded-xl p-8 shadow-sm">
            <div className="flex items-center gap-2 mb-6 text-[#d1b698]">
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
              <h2 className="text-[#193c1f] font-bold text-lg">
                Choose Amount
              </h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              {PRESET_AMOUNTS.map((val) => (
                <button
                  key={val}
                  onClick={() => setAmount(val)}
                  className={`py-4 rounded-lg font-bold transition-colors ${amount === val ? 'bg-[#d0d5cb] border-2 border-[#193c1f]' : 'bg-[#ede4d8] border border-[#d0d5cb]'} text-[#193c1f]`}
                >
                  {fmt(val)}
                </button>
              ))}
            </div>
            <div className="relative mt-2">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8ea087]">
                Rp
              </span>
              <input
                className="w-full pl-12 py-3 rounded-lg border border-[#d0d5cb] bg-white outline-none focus:border-[#8ea087]"
                placeholder="Enter custom amount"
                type="number"
                value={amount || ''}
                onChange={(e) => setAmount(Number(e.target.value))}
              />
            </div>
          </section>

          {/* Payment Method */}
          <section className="bg-white border border-[#d0d5cb] rounded-xl p-8 shadow-sm">
            <div className="flex items-center gap-2 mb-6 text-[#d1b698]">
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
              <h2 className="text-[#193c1f] font-bold text-lg">
                Payment Method
              </h2>
            </div>
            <div className="space-y-4">
              {PAYMENT_METHODS.map((m) => (
                <div
                  key={m.id}
                  onClick={() => setPaymentMethod(m.id)}
                  className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-colors ${paymentMethod === m.id ? 'border-[#193c1f] bg-[#f7f3ed]' : 'border-[#d0d5cb] bg-white'}`}
                >
                  <div
                    className={`w-5 h-5 rounded-full border-4 ${paymentMethod === m.id ? 'border-[#193c1f] bg-white' : 'border-[#d0d5cb]'}`}
                  />
                  <span className="text-[#193c1f] font-medium">{m.label}</span>
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

        {/* Right Column: Summary */}
        <aside className="md:col-span-4 flex flex-col gap-6">
          <section className="bg-[#f7f3ed] border border-[#d0d5cb] rounded-xl p-8 shadow-md sticky top-8">
            <h2 className="text-[#193c1f] font-bold text-xl mb-6">
              Donation Summary
            </h2>
            <div className="space-y-4 mb-8">
              <div className="flex justify-between items-center">
                <span className="text-[#8ea087]">Type</span>
                <span className="text-[#193c1f] font-bold">
                  {donationType === 'PLATFORM' ? 'Platform' : 'Report'}
                </span>
              </div>
              {donationType === 'REPORT' && report && (
                <div className="flex justify-between items-start gap-2">
                  <span className="text-[#8ea087] shrink-0">Case</span>
                  <span className="text-[#193c1f] font-bold text-right text-sm max-w-[65%]">
                    {report.title}
                  </span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="text-[#8ea087]">Amount</span>
                <span className="text-[#193c1f] font-bold">
                  {fmt(amount || 0)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#8ea087]">Processing Fee</span>
                <span className="text-[#193c1f] font-bold">Rp 0</span>
              </div>
              <hr className="border-[#d0d5cb]" />
              <div className="flex justify-between items-end">
                <span className="text-[#193c1f] font-bold text-lg">Total</span>
                <span className="text-2xl font-extrabold text-[#d1b698]">
                  {fmt(amount || 0)}
                </span>
              </div>
            </div>
            <button
              onClick={handleDonate}
              disabled={isSubmitting}
              className="w-full bg-[#8ea087] text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 mb-4 hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
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
              Donate Now
            </button>
            <p className="text-center text-xs text-[#8ea087] flex items-center justify-center gap-1">
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
        </aside>
      </main>
    </div>
  );
}
