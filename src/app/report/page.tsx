'use client';

import { Alert } from '@/components/alert';
import { Button } from '@/components/button';
import { Header } from '@/components/header';
import { Input } from '@/components/input';
import { Toast } from '@/components/toast';
import { usePathname, useRouter } from 'next/navigation';
import React, { useEffect, useRef, useState } from 'react';

export default function AnonymousReportPage() {
  const router = useRouter();
  const pathname = usePathname();

  const [currentStep, setCurrentStep] = useState(1);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);

  const [showExitAlert, setShowExitAlert] = useState(false);
  const [showLogoutAlert, setShowLogoutAlert] = useState(false);
  const [pendingPath, setPendingPath] = useState('');
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const [toast, setToast] = useState({
    show: false,
    msg: '',
    type: 'error' as 'success' | 'error',
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const [formData, setFormData] = useState({
    title: '',
    type: '',
    date: '',
    location: '',
    description: '',
    agreement: false,
  });

  useEffect(() => {
    localStorage.setItem('prevPath', pathname);
  }, [pathname]);

  const steps = [
    { id: 1, title: 'General Info' },
    { id: 2, title: 'Details' },
    { id: 3, title: 'Evidence' },
    { id: 4, title: 'Review' },
  ];

  const calculateProgress = () => {
    if (currentStep === 1) return 0;
    if (currentStep === 2) return 33;
    if (currentStep === 3) return 66;
    return 100;
  };

  const isStepValid = () => {
    if (currentStep === 1)
      return (
        formData.title.trim() !== '' &&
        formData.type !== '' &&
        formData.date !== ''
      );
    if (currentStep === 2)
      return (
        formData.location.trim() !== '' && formData.description.trim() !== ''
      );
    if (currentStep === 4) return formData.agreement === true;
    return true;
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, type, value } = e.target;
    const finalValue =
      type === 'checkbox' && e.target instanceof HTMLInputElement
        ? e.target.checked
        : value;
    setFormData((prev) => ({ ...prev, [name]: finalValue }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setSelectedFiles((prev) => [...prev, ...filesArray]);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAction = () => {
    if (isStepValid()) {
      if (currentStep === 4) {
        setIsRedirecting(true);
        setToast({
          show: true,
          msg: 'Report submitted successfully! Redirecting...',
          type: 'success',
        });

        setTimeout(() => {
          router.push('/dashboard');
        }, 2000);
      } else {
        setCurrentStep((prev) => Math.min(prev + 1, 4));
      }
    } else {
      setToast({
        show: true,
        msg:
          currentStep === 4
            ? 'You must agree to the terms before submitting'
            : 'Please fill in all required fields marked with *',
        type: 'error',
      });
    }
  };

  const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 1));

  return (
    <div className="min-h-screen bg-[#F7F3ED] flex flex-col font-sans">
      {isRedirecting && (
        <div className="fixed inset-0 z-[999] bg-white/10 pointer-events-auto cursor-wait" />
      )}

      <Toast
        show={toast.show}
        msg={toast.msg}
        type={toast.type}
        onClose={() => setToast({ ...toast, show: false })}
      />

      <div className="sticky top-0 z-[100] w-full bg-[#F7F3ED]/80 backdrop-blur-md">
        <Header
          withSearch={false}
          withLogo={true}
          onProfileClick={() => {
            setPendingPath('/profile');
            setShowExitAlert(true);
          }}
          onLogoutClick={() => setShowLogoutAlert(true)}
        />
      </div>

      <main className="max-w-[1400px] mx-auto w-full py-12 px-10 flex-1">
        <div className="mb-12 text-center">
          <h1 className="text-[40px] font-black text-[#193C1F] leading-tight tracking-tighter mb-3">
            Violence Report Form
          </h1>
          <p className="text-[#8EA087] font-bold text-base max-w-xl mx-auto">
            Your voice matters. Help us create a safer community.
          </p>
        </div>

        <div className="grid grid-cols-12 gap-10 items-start">
          {/* Progress Sidebar */}
          <aside className="col-span-3 sticky top-32">
            <div className="bg-white border border-[#D0D5CB] rounded-[32px] p-8 shadow-sm">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8EA087] mb-8 text-center opacity-60">
                Progress
              </h3>
              <div className="space-y-8 pl-2">
                {steps.map((step) => (
                  <div key={step.id} className="flex gap-5 relative">
                    {step.id < 4 && (
                      <div
                        className={`absolute left-[15px] top-9 w-[2px] h-8 transition-colors ${currentStep > step.id ? 'bg-[#193C1F]' : 'bg-[#EBE6DE]'}`}
                      />
                    )}
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 z-10 transition-all ${currentStep >= step.id ? 'bg-[#193C1F] text-white shadow-lg' : 'bg-[#EBE6DE] text-[#193C1F]/20'}`}
                    >
                      {step.id}
                    </div>
                    <p
                      className={`font-black text-[12px] uppercase tracking-wider ${currentStep >= step.id ? 'text-[#193C1F]' : 'text-[#193C1F]/20'}`}
                    >
                      {step.title}
                    </p>
                  </div>
                ))}
              </div>
              <div className="mt-10 pt-6 border-t border-[#D0D5CB]">
                <div className="flex justify-between items-end mb-3">
                  <span className="text-[10px] font-black text-[#193C1F] opacity-60 uppercase tracking-widest">
                    Done
                  </span>
                  <span className="text-[14px] font-black text-[#193C1F]">
                    {calculateProgress()}%
                  </span>
                </div>
                <div className="h-2 w-full bg-[#EBE6DE] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#193C1F] transition-all duration-700"
                    style={{ width: `${calculateProgress()}%` }}
                  />
                </div>
              </div>
            </div>
          </aside>

          {/* Form Content */}
          <div className="col-span-6">
            <div className="bg-white border border-[#D0D5CB] rounded-[40px] shadow-sm p-12 min-h-[580px] flex flex-col">
              <div className="flex-1">
                {currentStep === 1 && (
                  <div className="space-y-8 animate-in fade-in duration-300">
                    <div className="flex justify-between items-center bg-[#F7F3ED] p-6 rounded-[24px] border border-[#D0D5CB]">
                      <p className="text-[13px] font-black text-[#193C1F] uppercase tracking-wide">
                        Anonymous Report
                      </p>
                      <button
                        type="button"
                        onClick={() => setIsAnonymous(!isAnonymous)}
                        className={`w-12 h-6 rounded-full relative transition-all ${isAnonymous ? 'bg-[#193C1F]' : 'bg-[#D0D5CB]'}`}
                      >
                        <div
                          className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${isAnonymous ? 'right-1' : 'left-1'}`}
                        />
                      </button>
                    </div>
                    <Input
                      label="Report Title *"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      placeholder="Brief title"
                    />
                    <div className="grid grid-cols-2 gap-6">
                      <Input
                        label="Category *"
                        name="type"
                        type="select"
                        value={formData.type}
                        onChange={handleInputChange}
                      >
                        <option value="">Select Category</option>
                        <option value="Physical">Physical Violence</option>
                        <option value="Sexual">Sexual Harassment</option>
                        <option value="Psychological">
                          Psychological/Verbal
                        </option>
                        <option value="other">Other</option>
                      </Input>
                      <Input
                        label="Date *"
                        name="date"
                        type="date"
                        value={formData.date}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                )}

                {currentStep === 2 && (
                  <div className="space-y-8 animate-in fade-in duration-300">
                    <Input
                      label="Location *"
                      name="location"
                      value={formData.location}
                      onChange={handleInputChange}
                      placeholder="Where did it happen?"
                    />
                    <div className="space-y-2 text-left">
                      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                      <Input
                        label="Description *"
                        name="description"
                        type="textarea"
                        value={formData.description}
                        onChange={handleInputChange}
                        placeholder="Tell us more..."
                        {...({
                          rows: 10,
                          className:
                            'w-full min-h-[200px] p-5 text-left align-top break-words overflow-y-auto',
                        } as any)}
                      />
                    </div>
                  </div>
                )}

                {currentStep === 3 && (
                  <div className="space-y-6 animate-in fade-in duration-300">
                    <div className="w-full border-2 border-dashed border-[#D0D5CB] rounded-[32px] p-10 bg-[#F7F3ED]/50 text-center">
                      <span className="text-4xl mb-4 block">📁</span>
                      <p className="font-bold text-[#193C1F]">
                        Upload Evidence (Optional)
                      </p>
                      <p className="text-[11px] text-[#8EA087] mb-6">
                        PDF, Images, or Documents
                      </p>

                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        multiple
                        className="hidden"
                        accept=".pdf,image/*,.doc,.docx"
                      />

                      {/* Container untuk menengahkan tombol */}
                      <div className="flex justify-center">
                        <Button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="bg-white !text-[#193C1F] border border-[#193C1F] hover:bg-[#EBE6DE] hover:text-white transition-all duration-300 px-8"
                        >
                          Select Files
                        </Button>
                      </div>
                    </div>

                    {/* List file yang terpilih tetap di bawahnya */}
                    {selectedFiles.length > 0 && (
                      <div className="space-y-3">
                        {selectedFiles.map((file, idx) => (
                          <div
                            key={idx}
                            className="flex justify-between items-center bg-[#F7F3ED] p-4 rounded-2xl border border-[#D0D5CB]"
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-xl">
                                {file.type.includes('pdf') ? '📕' : '🖼️'}
                              </span>
                              <p className="text-[12px] font-bold text-[#193C1F] truncate max-w-[250px]">
                                {file.name}
                              </p>
                            </div>
                            <button
                              onClick={() => removeFile(idx)}
                              className="text-[#193C1F] hover:text-red-500 font-black text-[10px] uppercase tracking-widest px-2"
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {currentStep === 4 && (
                  <div className="space-y-6 animate-in fade-in duration-300">
                    <h3 className="font-black text-[#193C1F] uppercase tracking-widest text-sm border-b pb-4 text-left">
                      Full Report Review
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-[#F7F3ED] rounded-2xl border border-[#D0D5CB]/30 text-left">
                        <p className="text-[9px] text-[#8EA087] font-black uppercase mb-1 tracking-widest">
                          Title
                        </p>
                        <p className="text-sm font-bold text-[#193C1F]">
                          {formData.title || '-'}
                        </p>
                      </div>
                      <div className="p-4 bg-[#F7F3ED] rounded-2xl border border-[#D0D5CB]/30 text-left">
                        <p className="text-[9px] text-[#8EA087] font-black uppercase mb-1 tracking-widest">
                          Category
                        </p>
                        <p className="text-sm font-bold text-[#193C1F]">
                          {formData.type || '-'}
                        </p>
                      </div>
                      <div className="p-4 bg-[#F7F3ED] rounded-2xl border border-[#D0D5CB]/30 text-left">
                        <p className="text-[9px] text-[#8EA087] font-black uppercase mb-1 tracking-widest">
                          Date
                        </p>
                        <p className="text-sm font-bold text-[#193C1F]">
                          {formData.date || '-'}
                        </p>
                      </div>
                      <div className="p-4 bg-[#F7F3ED] rounded-2xl border border-[#D0D5CB]/30 text-left">
                        <p className="text-[9px] text-[#8EA087] font-black uppercase mb-1 tracking-widest">
                          Location
                        </p>
                        <p className="text-sm font-bold text-[#193C1F]">
                          {formData.location || '-'}
                        </p>
                      </div>
                    </div>
                    <div className="p-4 bg-[#F7F3ED] rounded-2xl border border-[#D0D5CB]/30 text-left">
                      <p className="text-[9px] text-[#8EA087] font-black uppercase mb-1 tracking-widest">
                        Description
                      </p>
                      <p className="text-sm font-bold text-[#193C1F] break-words whitespace-pre-wrap">
                        {formData.description || '-'}
                      </p>
                    </div>

                    <label
                      className={`flex items-center gap-4 p-5 border rounded-[24px] cursor-pointer mt-8 transition-all group ${formData.agreement ? 'bg-[#193C1F]/5 border-[#D0D5CB]' : 'border-[#D0D5CB] hover:bg-[#F7F3ED]'}`}
                    >
                      <div className="relative flex items-center justify-center">
                        <input
                          type="checkbox"
                          name="agreement"
                          checked={formData.agreement}
                          onChange={handleInputChange}
                          className="peer appearance-none w-6 h-6 border-2 border-[#D0D5CB] rounded-lg checked:bg-[#193C1F] checked:border-[#193C1F] transition-all cursor-pointer"
                        />
                        <svg
                          className="absolute w-4 h-4 text-white opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none"
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="4"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                      </div>
                      <span
                        className={`text-[12px] font-bold text-left leading-tight ${formData.agreement ? 'text-[#193C1F]' : 'text-[#8EA087]'}`}
                      >
                        I confirm that the information provided is accurate.
                      </span>
                    </label>
                  </div>
                )}
              </div>

              <div className="mt-12 pt-8 border-t border-[#D0D5CB] flex justify-between items-center">
                <button
                  type="button"
                  onClick={prevStep}
                  className={`text-[12px] font-black uppercase tracking-[0.2em] ${currentStep === 1 ? 'invisible' : 'text-[#8EA087] hover:text-[#193C1F]'}`}
                >
                  ← Back
                </button>
                <div className="flex gap-4 items-center">
                  <button
                    type="button"
                    onClick={() =>
                      setToast({
                        show: true,
                        msg: 'Draft Saved!',
                        type: 'success',
                      })
                    }
                    className="text-[11px] font-black text-[#8EA087] hover:text-[#193C1F] uppercase tracking-widest px-4 transition-colors"
                  >
                    Save Draft
                  </button>
                  <Button
                    onClick={handleAction}
                    className={`px-12 py-5 rounded-[20px] text-[13px] font-bold shadow-xl transition-all duration-300 ${!isStepValid() ? 'opacity-50 grayscale cursor-not-allowed' : 'active:scale-95 shadow-[#193C1F]/20'}`}
                  >
                    {currentStep === 4 ? 'Submit Report' : 'Next Step'}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Sidebar - EMERGENCY CARDS BALIK LAGI */}
          <aside className="col-span-3 space-y-6 sticky top-32">
            <div className="bg-[#193C1F] text-[#F7F3ED] p-8 rounded-[32px] shadow-lg text-left">
              <h4 className="font-black text-[14px] uppercase tracking-wider mb-3">
                🛡️ Safe Submission
              </h4>
              <p className="text-[11px] opacity-70 leading-relaxed font-medium">
                Your data is encrypted. We prioritize your privacy and security
                above all.
              </p>
            </div>

            {/* EMERGENCY CONTACTS CARD */}
            <div className="bg-white border border-[#D0D5CB] p-8 rounded-[32px] text-left">
              <h4 className="font-black text-[12px] text-[#193C1F] uppercase tracking-widest mb-6">
                Emergency Contacts
              </h4>
              <div className="space-y-4">
                <div className="bg-[#F7F3ED] p-4 rounded-2xl border border-[#D0D5CB]/50">
                  <p className="text-[9px] font-black text-[#8EA087] uppercase mb-1">
                    National Hotline
                  </p>
                  <p className="text-[13px] font-black text-[#193C1F]">
                    1-800-SAFE-NOW
                  </p>
                </div>
                <div className="bg-[#F7F3ED] p-4 rounded-2xl border border-[#D0D5CB]/50">
                  <p className="text-[9px] font-black text-[#8EA087] uppercase mb-1">
                    Crisis SMS
                  </p>
                  <p className="text-[13px] font-black text-[#193C1F]">
                    Text &quot;HELP&quot; to 741741
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-[#E3F2FD] border border-[#B3E5FC] p-8 rounded-[32px] text-left">
              <h4 className="font-black text-[12px] text-[#193C1F] uppercase tracking-widest mb-4">
                ❓ Need Help?
              </h4>
              <ul className="text-[11px] text-[#193C1F] space-y-3 font-medium opacity-80 leading-relaxed">
                <li>• Be specific with dates.</li>
                <li>• Photos help validation.</li>
              </ul>
            </div>
          </aside>
        </div>
      </main>

      {/* Alerts */}
      <Alert
        isOpen={showExitAlert}
        onClose={() => setShowExitAlert(false)}
        onConfirm={() => router.push(pendingPath)}
        type="warning"
        title="Discard Progress?"
        description="Data will be lost if you leave."
        confirmText="Discard & Exit"
      />
      <Alert
        isOpen={showLogoutAlert}
        onClose={() => setShowLogoutAlert(false)}
        onConfirm={() => {
          setIsLoggingOut(true);
          window.location.href = '/api/auth/signout';
        }}
        type="danger"
        title="End Session?"
        description="Are you sure you want to log out?"
        confirmText={isLoggingOut ? 'Logging out...' : 'Log Out'}
      />
    </div>
  );
}
