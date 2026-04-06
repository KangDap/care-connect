'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';

export default function ConsultationPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [file, setFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    const maxSize = 10 * 1024 * 1024;

    if (selected.size > maxSize) {
      alert('File max 10MB');
      return;
    }

    setFile(selected);
  };

  // Available time slots based on the selected date
  const timeSlots = [
    '09:00',
    '10:00',
    '11:00',
    '13:00',
    '14:00',
    '15:00',
    '16:00',
  ];

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;

    if (!selectedDate || !selectedTime) {
      setMessage({
        type: 'error',
        text: 'Please select both a date and a time for your consultation.',
      });
      return;
    }

    setIsSubmitting(true);
    setMessage({ type: '', text: '' });

    const formData = new FormData(form);

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
        setMessage({
          type: 'error',
          text: result.error || 'Failed to request consultation.',
        });
        return;
      }

      setMessage({
        type: 'success',
        text: 'Consultation requested successfully. Redirecting to dashboard...',
      });

      form.reset();
      setSelectedDate('');
      setSelectedTime('');
      setFile(null);

      await new Promise((resolve) => setTimeout(resolve, 1200));
      router.replace('/dashboard');
      setTimeout(() => {
        if (window.location.pathname === '/consultation') {
          window.location.href = '/dashboard';
        }
      }, 300);
    } catch (error) {
      console.error('Consultation submit failed:', error);
      setMessage({
        type: 'error',
        text: 'Failed to submit request. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F7F3ED] text-[#193C1F] font-sans">
      {/* Header */}
      <header className="w-full h-20 px-12 flex items-center justify-between bg-white border-b border-[#D0D5CB]">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#193C1F] rounded flex items-center justify-center">
            <svg
              className="h-5 w-5 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
              ></path>
            </svg>
          </div>
          <span className="text-2xl font-bold text-[#193C1F]">CareConnect</span>
        </div>
        <nav className="flex items-center gap-8">
          <Link
            href="/landingPage"
            className="text-[#193C1F] font-medium hover:text-[#8EA087]"
          >
            Home
          </Link>
          <Link
            href="#"
            className="text-[#193C1F] font-medium hover:text-[#8EA087]"
          >
            Resources
          </Link>
          <Link
            href="#"
            className="text-[#193C1F] font-medium hover:text-[#8EA087]"
          >
            Support
          </Link>
          <button className="w-10 h-10 rounded-lg bg-[#F7F3ED] flex items-center justify-center text-[#193C1F] border border-[#D0D5CB]">
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
              ></path>
            </svg>
          </button>
        </nav>
      </header>

      {/* Main Content */}
      <main className="flex-grow flex items-center justify-center py-16 px-4">
        <div className="bg-white rounded-2xl border border-[#D0D5CB] p-12 max-w-[800px] w-full shadow-sm">
          {/* Form Header */}
          <div className="text-center mb-10">
            <div className="w-14 h-14 bg-[#F7F3ED] rounded-full flex items-center justify-center mx-auto mb-6 border border-[#D0D5CB]">
              <svg
                className="h-6 w-6 text-[#8EA087]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                ></path>
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-[#193C1F] mb-4">
              Consultation Form
            </h1>
            <p className="text-[#193C1F]/70 max-w-lg mx-auto leading-relaxed">
              Your safety and privacy are our top priorities. Share your details
              securely and privately with our certified counselors.
            </p>
          </div>

          {/* Status Message */}
          {message.text && (
            <div
              className={`mb-6 p-4 rounded-xl border flex items-center gap-3 ${message.type === 'success' ? 'bg-[#8EA087]/10 text-[#193C1F] border-[#8EA087]/30' : 'bg-red-50 text-red-700 border-red-200'}`}
            >
              {message.type === 'success' ? (
                <svg
                  className="h-5 w-5 text-[#8EA087]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  ></path>
                </svg>
              ) : (
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  ></path>
                </svg>
              )}
              <span className="font-medium">{message.text}</span>
            </div>
          )}

          {/* Consultation Form Fields */}
          <form className="space-y-8" onSubmit={handleSubmit}>
            <div>
              <label
                className="block text-sm font-semibold text-[#193C1F] mb-2"
                htmlFor="inquiry-title"
              >
                Inquiry Title
              </label>
              <input
                name="title"
                required
                className="w-full px-4 py-4 rounded-xl border border-[#D0D5CB] bg-white text-[#193C1F] focus:ring-[#8EA087] focus:border-[#8EA087] placeholder-[#193C1F]/30"
                id="inquiry-title"
                placeholder="Enter a brief title for your request"
                type="text"
              />
            </div>

            <div>
              <label
                className="block text-sm font-semibold text-[#193C1F] mb-2"
                htmlFor="consultation-nature"
              >
                Nature of Consultation
              </label>
              <div className="relative">
                <select
                  name="nature"
                  required
                  className="w-full px-4 py-4 rounded-xl border border-[#D0D5CB] bg-white text-[#193C1F]/90 focus:ring-[#8EA087] focus:border-[#8EA087] appearance-none"
                  id="consultation-nature"
                  defaultValue=""
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
                </select>
              </div>
            </div>

            {/* Date and Time Picker Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Date Column */}
              <div>
                <label
                  className="block text-sm font-semibold text-[#193C1F] mb-2"
                  htmlFor="consultation-date"
                >
                  Preferred Date
                </label>
                <input
                  type="date"
                  id="consultation-date"
                  className="w-full px-4 py-4 rounded-xl border border-[#D0D5CB] bg-white text-[#193C1F] focus:ring-[#8EA087] focus:border-[#8EA087] min-h-[58px]"
                  min={new Date().toISOString().split('T')[0]} // Prevents picking past dates
                  value={selectedDate}
                  onChange={(e) => {
                    setSelectedDate(e.target.value);
                    setSelectedTime(''); // Reset time when date changes
                  }}
                  required
                />
              </div>

              {/* Time Slots Column */}
              <div>
                <label className="block text-sm font-semibold text-[#193C1F] mb-2">
                  Available Time Slots
                </label>
                {!selectedDate ? (
                  <div className="w-full h-[58px] px-4 rounded-xl border border-[#D0D5CB] border-dashed bg-[#F7F3ED] text-[#193C1F]/40 flex items-center justify-center text-sm">
                    Select a date to view available times
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    {timeSlots.map((time) => (
                      <button
                        key={time}
                        type="button"
                        onClick={() => setSelectedTime(time)}
                        className={`py-2 px-1 rounded-lg border text-sm font-medium transition-colors ${
                          selectedTime === time
                            ? 'bg-[#8EA087] border-[#8EA087] text-[#F7F3ED] shadow-sm'
                            : 'bg-white border-[#D0D5CB] text-[#193C1F] hover:border-[#8EA087] hover:bg-[#F7F3ED]'
                        }`}
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div>
              <label
                className="block text-sm font-semibold text-[#193C1F] mb-2"
                htmlFor="detailed-description"
              >
                Detailed Description
              </label>
              <textarea
                name="description"
                required
                className="w-full px-4 py-4 rounded-xl border border-[#D0D5CB] bg-white text-[#193C1F] focus:ring-[#8EA087] focus:border-[#8EA087] placeholder-[#193C1F]/30"
                id="detailed-description"
                placeholder="Please describe your situation here..."
                rows={5}
              ></textarea>
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#193C1F] mb-2">
                Relevant Documents (Optional)
              </label>
              <div className="border-2 border-dashed border-[#D0D5CB] rounded-xl p-8 flex flex-col items-center justify-center bg-[#F7F3ED] hover:bg-white transition-colors cursor-pointer relative overflow-hidden group">
                <input
                  type="file"
                  name="document"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  accept=".png,.jpg,.jpeg,.pdf"
                  onChange={handleFileChange}
                />
                <svg
                  className="h-10 w-10 text-[#D0D5CB] mb-3 group-hover:text-[#8EA087] transition-colors"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                  ></path>
                </svg>
                <p className="text-[#193C1F] font-medium">
                  Click to upload or drag and drop
                </p>
              </div>
            </div>
            {file && (
              <div className="mt-4">
                <div className="flex items-center justify-between bg-[#F7F3ED] border border-[#D0D5CB] rounded-lg px-4 py-2">
                  <div className="flex items-center gap-2 text-[#193C1F]">
                    <span>{file.type.includes('pdf') ? '📄' : '🖼️'}</span>
                    <span className="text-sm truncate max-w-[300px]">
                      {file.name}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFile(null)}
                    className="text-[#8EA087] hover:text-red-500 text-sm transition"
                  >
                    ✕
                  </button>
                </div>
              </div>
            )}

            <div className="bg-[#F7F3ED] border border-[#D0D5CB] rounded-xl px-6 py-5 flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-[#193C1F]">
                  Submit Anonymously
                </h4>
                <p className="text-xs text-[#193C1F]/60">
                  Your identity will be hidden from the reviewer
                </p>
              </div>
              <div className="relative inline-block w-12 align-middle select-none transition duration-200 ease-in">
                <input
                  className="peer absolute block w-6 h-6 rounded-full bg-white border-4 border-[#D0D5CB] appearance-none cursor-pointer checked:right-0 checked:border-[#8EA087]"
                  id="toggle"
                  name="isAnonymous"
                  type="checkbox"
                />
                <label
                  className="block overflow-hidden h-6 rounded-full bg-[#D0D5CB] cursor-pointer peer-checked:bg-[#8EA087] transition-colors duration-200"
                  htmlFor="toggle"
                ></label>
              </div>
            </div>

            <button
              disabled={isSubmitting}
              className="w-full py-5 bg-[#8EA087] hover:bg-[#8EA087]/90 disabled:opacity-50 disabled:cursor-not-allowed text-[#193C1F] font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm"
              type="submit"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
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
                      d="M4 12a8 8 0 018-8v8H4z"
                    ></path>
                  </svg>
                  Submitting Request...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <svg
                    className="h-5 w-5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"></path>
                  </svg>
                  Request Consultation
                </span>
              )}
            </button>

            <div className="bg-white border border-[#D0D5CB]/30 rounded-xl p-4 flex items-start gap-3">
              <svg
                className="h-5 w-5 text-[#8EA087] mt-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                ></path>
              </svg>
              <p className="text-sm text-[#193C1F]/70">
                If you are in immediate danger, please contact your local
                emergency services or use the{' '}
                <Link
                  className="text-[#8EA087] font-semibold underline"
                  href="#"
                >
                  Emergency
                </Link>{' '}
                shortcut in the navigation.
              </p>
            </div>
          </form>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full py-12 px-12 bg-white border-t border-[#D0D5CB] mt-10">
        <div className="flex flex-col items-center gap-6">
          <div className="flex gap-8">
            <Link
              href="#"
              className="text-xs font-bold text-[#193C1F]/60 hover:text-[#193C1F] tracking-widest uppercase"
            >
              Privacy Policy
            </Link>
            <Link
              href="#"
              className="text-xs font-bold text-[#193C1F]/60 hover:text-[#193C1F] tracking-widest uppercase"
            >
              Terms of Service
            </Link>
            <Link
              href="#"
              className="text-xs font-bold text-[#193C1F]/60 hover:text-[#193C1F] tracking-widest uppercase"
            >
              Help Center
            </Link>
          </div>
          <p className="text-sm text-[#193C1F]/40">
            © 2024 CareConnect. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
