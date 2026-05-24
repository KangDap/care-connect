'use client';

import { Alert } from '@/components/alert';
import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { Input } from '@/components/input';
import { PublicHeader } from '@/components/public-header';
import { Toast } from '@/components/toast';
import { authClient } from '@/lib/auth/auth-client';
import type { ConsultationScheduleSlot } from '@/modules/consultation/consultation.types';
import { Check, Info, Lock, Send, Upload, X } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';

// Get today's date in WIB timezone (UTC+7)
const getTodayWIB = (): string => {
  const now = new Date();
  const wibOffset = 7 * 60; // WIB is UTC+7
  const wibDate = new Date(now.getTime() + wibOffset * 60 * 1000);

  const year = wibDate.getUTCFullYear();
  const month = String(wibDate.getUTCMonth() + 1).padStart(2, '0');
  const date = String(wibDate.getUTCDate()).padStart(2, '0');

  return `${year}-${month}-${date}`;
};

export default function ConsultationPage() {
  const router = useRouter();
  const [isLogoutAlertOpen, setIsLogoutAlertOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const { data: session, isPending } = authClient.useSession();

  useEffect(() => {
    const userRole = (session?.user as { role?: string })?.role;
    if (!isPending && userRole === 'PSYCHOLOGIST') {
      router.replace('/dashboard');
    }
  }, [session, isPending, router]);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await authClient.signOut();
    router.replace('/login');
    router.refresh();
  };

  const formRef = React.useRef<HTMLFormElement>(null);
  const [step, setStep] = useState<'form' | 'review'>('form');
  const [reviewData, setReviewData] = useState<{
    title: string | null;
    nature: string | null;
    details: string | null;
    urgency: string | null;
    date: string | null;
    time: string | null;
    fileName: string | null;
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [toast, setToast] = useState({
    show: false,
    msg: '',
    type: 'error' as 'success' | 'error',
  });
  const showError = (title: string, description: string) => {
    setToast({ show: true, msg: description, type: 'error' });
  };

  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [timeSlots, setTimeSlots] = useState<ConsultationScheduleSlot[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [todayWIB, setTodayWIB] = useState('');

  useEffect(() => {
    setTodayWIB(getTodayWIB());
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    const maxSize = 10 * 1024 * 1024;
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];

    if (selected.size > maxSize) {
      showError('Validation Error', 'File size must be less than 10MB');
      return;
    }

    if (!allowedTypes.includes(selected.type)) {
      showError('Validation Error', 'Only PDF, JPG, and PNG files are allowed');
      return;
    }

    setMessage({ type: '', text: '' });
    setFile(selected);
  };

  useEffect(() => {
    if (!selectedDate) {
      setTimeSlots([]);
      return;
    }

    const controller = new AbortController();
    const fetchSlots = async () => {
      setIsLoadingSlots(true);
      try {
        const response = await fetch(`/api/consultation?date=${selectedDate}`, {
          signal: controller.signal,
        });
        const result = await response.json();

        if (!response.ok || !result.success) {
          setTimeSlots([]);
          return;
        }

        setTimeSlots(result.data ?? []);
      } catch (error) {
        if ((error as Error)?.name !== 'AbortError') {
          console.error('Failed to load time slots:', error);
          setTimeSlots([]);
        }
      } finally {
        setIsLoadingSlots(false);
      }
    };

    fetchSlots();

    return () => controller.abort();
  }, [selectedDate]);

  function handleReviewTrigger(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);

    const title = (data.get('title') as string) || '';
    const description = (data.get('description') as string) || '';

    if (title.trim().length < 5) {
      showError(
        'Validation Error',
        'Title must be at least 5 characters long.',
      );
      return;
    }

    if (description.trim().length < 10) {
      showError(
        'Validation Error',
        'Description must be at least 10 characters long.',
      );
      return;
    }

    if (!selectedDate || !selectedTime) {
      showError(
        'Validation Error',
        'Please select both a date and a time for your consultation.',
      );
      return;
    }

    setReviewData({
      title: data.get('title') as string | null,
      nature: data.get('nature') as string | null,
      details: data.get('details') as string | null,
      urgency: data.get('urgency') as string | null,
      date: selectedDate,
      time: selectedTime,
      fileName: file ? file.name : 'No file chosen',
    });
    setStep('review');
  }

  async function submitAfterReview() {
    if (!formRef.current) return;

    setIsSubmitting(true);
    setMessage({ type: '', text: '' });

    const formData = new FormData(formRef.current);
    formData.append('date', selectedDate);
    formData.append('time', selectedTime);

    try {
      const res = await fetch('/api/consultation', {
        method: 'POST',
        body: formData,
      });

      const result = (await res.json().catch(() => ({}))) as {
        success?: boolean;
        data?: unknown;
        error?: string;
      };

      const isSuccess = res.ok && (result.success ?? true);

      if (!isSuccess) {
        setIsSubmitting(false);
        showError(
          'Submission Failed',
          result.error || 'Failed to request consultation.',
        );
        setStep('form');
        return;
      }

      setMessage({
        type: 'success',
        text: 'Consultation registered successfully. Redirecting to dashboard...',
      });
      setIsSubmitting(false);

      formRef.current?.reset();
      setSelectedDate('');
      setSelectedTime('');
      setFile(null);

      await new Promise((resolve) => setTimeout(resolve, 2000));
      router.replace('/dashboard');
      setTimeout(() => {
        if (window.location.pathname === '/consultation') {
          window.location.href = '/dashboard';
        }
      }, 300);
    } catch (error) {
      console.error('Consultation submit failed:', error);
      setIsSubmitting(false);
      showError(
        'Submission Failed',
        'Failed to submit request. Please try again.',
      );
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#f7f3ed] text-[#193c1f] font-sans relative">
      <Toast
        show={toast.show}
        msg={toast.msg}
        type={toast.type}
        onClose={() => setToast({ ...toast, show: false })}
      />

      {/* Loading & Success Overlay */}
      {(isSubmitting || message.type === 'success') && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 backdrop-blur-sm transition-all duration-300">
          {message.type === 'success' ? (
            <Card className="mx-4 flex w-full max-w-sm scale-100 transform flex-col items-center gap-4 rounded-2xl p-10 text-center shadow-xl transition-all">
              <div className="w-20 h-20 bg-[#8ea087]/10 rounded-full flex items-center justify-center mb-2">
                <Check className="h-10 w-10 text-[#8ea087]" />
              </div>
              <h3 className="text-2xl font-bold text-[#193c1f]">Success!</h3>
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
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              <div>
                <h3 className="text-xl font-bold text-[#193c1f] mb-1">
                  Processing request...
                </h3>
                <p className="text-sm text-[#193c1f]/60">
                  Please wait while we secure your slot.
                </p>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Header */}
      <PublicHeader />

      {/* Main Content */}
      <main className="flex-grow flex items-center justify-center py-16 px-4">
        <Card className="w-full max-w-[800px] rounded-2xl p-12">
          {/* Form Header */}
          <div className="text-center mb-10">
            <div className="w-14 h-14 bg-[#f7f3ed] rounded-full flex items-center justify-center mx-auto mb-6 border border-[#d0d5cb]">
              <Lock className="h-6 w-6 text-[#8ea087]" />
            </div>
            <h1 className="text-3xl font-bold text-[#193c1f] mb-4">
              Consultation Form
            </h1>
            <p className="text-[#193c1f]/70 max-w-lg mx-auto leading-relaxed">
              Your safety and privacy are our top priorities. Share your details
              securely and privately with our certified counselors.
            </p>
          </div>

          {/* Status Message */}

          {/* Consultation Form Fields */}
          <form
            ref={formRef}
            className={step === 'review' ? 'hidden' : 'space-y-8'}
            onSubmit={handleReviewTrigger}
          >
            <Input
              label="Inquiry Title"
              name="title"
              required
              id="inquiry-title"
              placeholder="Enter a brief title for your request"
              className="bg-white border-2 border-[#d0d5cb]"
            />

            <Input
              label="Nature of Consultation"
              type="select"
              name="nature"
              required
              id="consultation-nature"
              defaultValue=""
              className="bg-white border-2 border-[#d0d5cb]"
            >
              <option disabled value="">
                Select the type of assistance needed
              </option>
              <option value="Bullying">Bullying</option>
              <option value="Harassment">Harassment</option>
              <option value="Domestic Violence">Domestic Violence</option>
              <option value="Mental Health Support">
                Mental Health Support
              </option>
              <option value="Academic Stress">Academic Stress</option>
              <option value="Other">Other</option>
            </Input>

            {/* Date and Time Picker Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Date Column */}
              <div>
                <Input
                  label="Preferred Date"
                  type="date"
                  id="consultation-date"
                  min={todayWIB || undefined}
                  value={selectedDate}
                  onChange={(e) => {
                    setSelectedDate(e.target.value);
                    setSelectedTime(''); // Reset time when date changes
                  }}
                  required
                  className="min-h-[58px] bg-white border-2 border-[#d0d5cb]"
                />
              </div>

              {/* Time Slots Column */}
              <div>
                <label className="block text-sm font-semibold text-[#193c1f] mb-2">
                  Available Time Slots
                </label>
                {!selectedDate ? (
                  <div className="w-full h-[58px] px-4 rounded-xl border border-[#d0d5cb] border-dashed bg-[#f7f3ed] text-[#193c1f]/40 flex items-center justify-center text-sm">
                    Select a date to view available times
                  </div>
                ) : isLoadingSlots ? (
                  <div className="w-full h-[58px] px-4 rounded-xl border border-[#d0d5cb] bg-[#f7f3ed] text-[#193c1f]/70 flex items-center justify-center text-sm">
                    Loading available slots...
                  </div>
                ) : timeSlots.length === 0 ? (
                  <div className="w-full h-[58px] px-4 rounded-xl border border-[#d0d5cb] bg-[#f7f3ed] text-[#193c1f]/70 flex items-center justify-center text-sm">
                    No available slots for this date.
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    {timeSlots.map((slot) => (
                      <Button
                        key={slot.time}
                        type="button"
                        onClick={() => setSelectedTime(slot.time)}
                        disabled={!slot.available}
                        variant={
                          selectedTime === slot.time ? 'secondary' : 'outline'
                        }
                        className={`rounded-lg px-1 py-2 text-sm font-medium shadow-none ${
                          !slot.available
                            ? 'cursor-not-allowed border-[#E5E7EB] bg-[#F3F4F6] text-[#9CA3AF]'
                            : selectedTime === slot.time
                              ? 'border-[#8ea087] text-[#f7f3ed]'
                              : 'border-[#d0d5cb] bg-white text-[#193c1f] hover:border-[#8ea087] hover:bg-[#f7f3ed]'
                        }`}
                      >
                        {slot.time}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <Input
              label="Detailed Description"
              type="textarea"
              name="description"
              required
              id="detailed-description"
              placeholder="Please describe your situation here..."
              rows={5}
              className="bg-white border-2 border-[#d0d5cb]"
            />

            <div>
              <label className="block text-sm font-semibold text-[#193c1f] mb-2">
                Relevant Documents (Optional)
              </label>
              <div className="border-2 border-dashed border-[#d0d5cb] rounded-xl p-8 flex flex-col items-center justify-center bg-[#f7f3ed] hover:bg-white transition-colors cursor-pointer relative overflow-hidden group">
                <input
                  type="file"
                  name="document"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  accept=".png,.jpg,.jpeg,.pdf"
                  onChange={handleFileChange}
                />
                <Upload className="mb-3 h-10 w-10 text-[#d0d5cb] transition-colors group-hover:text-[#8ea087]" />
                <p className="text-[#193c1f] font-medium">
                  Click to upload or drag and drop
                </p>
                <p className="text-xs text-[#193c1f]/60 mt-1">
                  Supported formats: PDF, JPG, PNG (max 10MB)
                </p>
              </div>
            </div>
            {file && (
              <div className="mt-4">
                <div className="flex items-center justify-between bg-[#f7f3ed] border border-[#d0d5cb] rounded-lg px-4 py-2">
                  <div className="flex items-center gap-2 text-[#193c1f]">
                    <span>{file.type.includes('pdf') ? '📄' : '🖼️'}</span>
                    <span className="text-sm truncate max-w-[300px]">
                      {file.name}
                    </span>
                  </div>
                  <Button
                    type="button"
                    onClick={() => setFile(null)}
                    variant="ghost"
                    aria-label="Remove file"
                    className="px-2 py-1 text-[#8ea087] hover:text-red-500"
                  >
                    <X size={16} />
                  </Button>
                </div>
              </div>
            )}

            <div className="bg-[#f7f3ed] border border-[#d0d5cb] rounded-xl px-6 py-5 flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-[#193c1f]">
                  Submit Anonymously
                </h4>
                <p className="text-xs text-[#193c1f]/60">
                  Your identity will be hidden from the reviewer
                </p>
              </div>
              <div className="relative inline-block w-12 align-middle select-none transition duration-200 ease-in">
                <input
                  className="peer absolute block w-6 h-6 rounded-full bg-white border-4 border-[#d0d5cb] appearance-none cursor-pointer checked:right-0 checked:border-[#8ea087]"
                  id="toggle"
                  name="isAnonymous"
                  type="checkbox"
                />
                <label
                  className="block overflow-hidden h-6 rounded-full bg-[#d0d5cb] cursor-pointer peer-checked:bg-[#8ea087] transition-colors duration-200"
                  htmlFor="toggle"
                ></label>
              </div>
            </div>

            <Button
              disabled={isSubmitting}
              loading={isSubmitting}
              variant="secondary"
              className="w-full rounded-xl py-5 text-[#193c1f]"
              type="submit"
            >
              {isSubmitting ? (
                'Submitting Request...'
              ) : (
                <span className="flex items-center gap-2">
                  <Send className="h-5 w-5" />
                  Request Consultation
                </span>
              )}
            </Button>

            <Card className="flex items-start gap-3 rounded-xl border-[#d0d5cb]/30 p-4">
              <Info className="mt-0.5 h-5 w-5 text-[#8ea087]" />
              <p className="text-sm text-[#193c1f]/70">
                If you are in immediate danger, please contact your local
                emergency services or use the{' '}
                <Link
                  className="text-[#8ea087] font-semibold underline"
                  href="#"
                >
                  Emergency
                </Link>{' '}
                shortcut in the navigation.
              </p>
            </Card>
          </form>

          {/* Review Section */}
          {step === 'review' && reviewData && (
            <div className="space-y-8">
              <Card className="rounded-xl bg-[#f7f3ed] p-8">
                <h3 className="text-xl font-bold text-[#193c1f] mb-6">
                  Review Your Request
                </h3>

                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-semibold text-[#193c1f]/60">
                      Title
                    </p>
                    <p className="text-base text-[#193c1f]">
                      {reviewData.title}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#193c1f]/60">
                      Nature of Consultation
                    </p>
                    <p className="text-base text-[#193c1f]">
                      {reviewData.nature}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#193c1f]/60">
                      Details
                    </p>
                    <p className="text-base text-[#193c1f] whitespace-pre-wrap">
                      {reviewData.details}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-semibold text-[#193c1f]/60">
                        Date
                      </p>
                      <p className="text-base text-[#193c1f]">
                        {reviewData.date}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[#193c1f]/60">
                        Time
                      </p>
                      <p className="text-base text-[#193c1f]">
                        {reviewData.time}
                      </p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#193c1f]/60">
                      Urgency
                    </p>
                    <p className="text-base text-[#193c1f] capitalize">
                      {reviewData.urgency}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#193c1f]/60">
                      Attached File
                    </p>
                    <p className="text-base text-[#193c1f]">
                      {reviewData.fileName}
                    </p>
                  </div>
                </div>
              </Card>

              <div className="flex gap-4 pt-4">
                <Button
                  type="button"
                  onClick={() => setStep('form')}
                  variant="outline"
                  className="flex-1 rounded-xl px-8 py-4"
                >
                  Back to Edit
                </Button>
                <Button
                  type="button"
                  onClick={submitAfterReview}
                  disabled={isSubmitting}
                  className="flex-1 rounded-xl px-8 py-4 shadow-lg shadow-[#193c1f]/20"
                >
                  Confirm & Submit
                </Button>
              </div>
            </div>
          )}
        </Card>
      </main>

      {/* Footer */}
      <footer className="w-full py-12 px-12 bg-white border-t border-[#d0d5cb] mt-10">
        <div className="flex flex-col items-center gap-6">
          <div className="flex gap-8">
            <Link
              href="#"
              className="text-xs font-bold text-[#193c1f]/60 hover:text-[#193c1f] tracking-widest uppercase"
            >
              Privacy Policy
            </Link>
            <Link
              href="#"
              className="text-xs font-bold text-[#193c1f]/60 hover:text-[#193c1f] tracking-widest uppercase"
            >
              Terms of Service
            </Link>
            <Link
              href="#"
              className="text-xs font-bold text-[#193c1f]/60 hover:text-[#193c1f] tracking-widest uppercase"
            >
              Help Center
            </Link>
          </div>
          <p className="text-sm text-[#193c1f]/40"></p>
        </div>
      </footer>

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
}
