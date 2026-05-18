'use client';

import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { Input } from '@/components/input';
import { PublicHeader } from '@/components/public-header';
import { syncDonationPayment } from '@/lib/donation-client';
import {
  ArrowLeft,
  Check,
  CreditCard,
  Heart,
  Lock,
  Shield,
  Wallet,
} from 'lucide-react';
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
            <Card className="mx-4 flex w-full max-w-sm flex-col items-center gap-4 rounded-2xl p-10 text-center shadow-xl">
              <div className="w-20 h-20 bg-[#8ea087]/10 rounded-full flex items-center justify-center">
                <Check className="h-10 w-10 text-[#8ea087]" />
              </div>
              <h3 className="text-2xl font-bold text-[#193c1f]">Thank You!</h3>
              <p className="text-[#193c1f]/70">{message.text}</p>
            </Card>
          ) : (
            <Card className="mx-4 flex w-full max-w-sm flex-col items-center gap-6 rounded-2xl p-10 text-center shadow-xl">
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
            </Card>
          )}
        </div>
      )}

      <PublicHeader />

      <main className="flex-grow max-w-6xl mx-auto px-6 py-12 w-full grid grid-cols-1 md:grid-cols-12 gap-8">
        {/* Left Column */}
        <div className="md:col-span-8 flex flex-col gap-8">
          {/* Back button */}
          <button
            type="button"
            onClick={() => router.push(backHref)}
            className="w-10 h-10 bg-white border border-[#D0D5CB] hover:bg-[#F7F3ED] rounded-xl transition-all shadow-sm flex items-center justify-center shrink-0"
          >
            <ArrowLeft size={18} className="text-[#193c1f]" />
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
            <Card className="rounded-xl p-8">
              <div className="flex items-center gap-2 mb-6 text-[#d1b698]">
                <Shield className="w-5 h-5" />
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
                  <Card className="rounded-lg p-3">
                    <p className="text-[#8ea087] text-xs mb-1">Location</p>
                    <p className="font-bold text-[#193c1f]">
                      {report.city}, {report.province}
                    </p>
                  </Card>
                </div>
              </div>
            </Card>
          )}

          {/* Platform info card */}
          {donationType === 'PLATFORM' && (
            <Card className="rounded-xl p-8">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[#8ea087]/10 rounded-xl flex items-center justify-center shrink-0">
                  <Heart className="w-6 h-6 text-[#8ea087]" />
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
            </Card>
          )}

          {/* Amount */}
          <Card className="rounded-xl p-8">
            <div className="flex items-center gap-2 mb-6 text-[#d1b698]">
              <Wallet className="w-5 h-5" />
              <h2 className="text-[#193c1f] font-bold text-lg">
                Choose Amount
              </h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              {PRESET_AMOUNTS.map((val) => (
                <Button
                  type="button"
                  variant={amount === val ? 'primary' : 'outline'}
                  key={val}
                  onClick={() => setAmount(val)}
                  className={`rounded-lg py-4 whitespace-nowrap text-sm ${amount === val ? '' : 'text-[#193c1f]'}`}
                >
                  {fmt(val)}
                </Button>
              ))}
            </div>
            <Input
              label="Custom Amount"
              placeholder="Enter custom amount"
              type="number"
              value={amount || ''}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="bg-white"
            />
          </Card>

          {/* Payment Method */}
          <Card className="rounded-xl p-8">
            <div className="flex items-center gap-2 mb-6 text-[#d1b698]">
              <CreditCard className="w-5 h-5" />
              <h2 className="text-[#193c1f] font-bold text-lg">
                Payment Method
              </h2>
            </div>
            <div className="space-y-4">
              {PAYMENT_METHODS.map((m) => (
                <Button
                  type="button"
                  variant="outline"
                  key={m.id}
                  onClick={() => setPaymentMethod(m.id)}
                  className={`w-full justify-start rounded-lg border p-4 text-left shadow-none ${paymentMethod === m.id ? 'border-[#193c1f] bg-[#f7f3ed]' : 'border-[#d0d5cb] bg-white'}`}
                >
                  <div
                    className={`w-5 h-5 rounded-full border-4 ${paymentMethod === m.id ? 'border-[#193c1f] bg-white' : 'border-[#d0d5cb]'}`}
                  />
                  <span className="text-[#193c1f] font-medium">{m.label}</span>
                </Button>
              ))}
            </div>
            {message.type === 'error' && (
              <div className="mt-4 p-4 text-red-600 bg-red-100 border border-red-300 rounded">
                {message.text}
              </div>
            )}
          </Card>
        </div>

        {/* Right Column: Summary */}
        <aside className="md:col-span-4 flex flex-col gap-6">
          <Card className="sticky top-8 rounded-xl bg-[#f7f3ed] p-8 shadow-md">
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
            <Button
              onClick={handleDonate}
              disabled={isSubmitting}
              variant="secondary"
              className="mb-4 w-full rounded-xl py-4"
            >
              <Lock className="w-5 h-5" />
              Donate Now
            </Button>
            <p className="text-center text-xs text-[#8ea087] flex items-center justify-center gap-1">
              <Shield className="w-3 h-3" />
              256-bit Secure SSL Connection
            </p>
          </Card>
        </aside>
      </main>
    </div>
  );
}
