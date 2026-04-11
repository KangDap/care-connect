'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Input } from '@/components/input';
import { Button } from '@/components/button';
import { Alert } from '@/components/alert';
import { Header } from '@/components/header';

export default function AnonymousReportPage() {
  const router = useRouter();
  const pathname = usePathname();

  const [currentStep, setCurrentStep] = useState(1);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [showExitAlert, setShowExitAlert] = useState(false);
  const [pendingPath, setPendingPath] = useState('');
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  
  const [formData, setFormData] = useState({
    title: '', 
    type: '', 
    date: '', 
    location: '', 
    description: '',
    agreement: false
  });

  // Simpan path untuk fitur 'kembali' di halaman lain
  useEffect(() => {
    localStorage.setItem('prevPath', pathname);
  }, [pathname]);

  const steps = [
    { id: 1, title: 'General Info', desc: 'Basic data' },
    { id: 2, title: 'Details', desc: 'Where & how' },
    { id: 3, title: 'Evidence', desc: 'Attachments' },
    { id: 4, title: 'Review', desc: 'Final check' },
  ];

  // Logic Persentase
  const calculateProgress = () => {
    if (currentStep === 1) return 0;
    if (currentStep === 2) return 33;
    if (currentStep === 3) return 66;
    return 100;
  };

  // Validasi Field Wajib
  const isStepValid = () => {
    if (currentStep === 1) return formData.title !== '' && formData.type !== '' && formData.date !== '';
    if (currentStep === 2) return formData.location !== '' && formData.description !== '';
    if (currentStep === 4) return formData.agreement === true;
    return true;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type, checked }: any = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
  };

  // Intercept navigasi dari Header
  const handleNavIntercept = (path: string) => {
    setPendingPath(path);
    setShowExitAlert(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  if (e.target.files) {
    const filesArray = Array.from(e.target.files);
    setSelectedFiles(filesArray);
    // Kamu bisa simpan ke formData juga kalau mau
    console.log("Files selected:", filesArray);
  }
};

  const nextStep = () => {
    if (isStepValid()) setCurrentStep((prev) => Math.min(prev + 1, 4));
  };

  const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 1));

  return (
    <div className="min-h-screen bg-[#F7F3ED] flex flex-col font-sans">
      
      {/* HEADER: Sticky, No Search, With Logo */}
      <div className="sticky top-0 z-[100] w-full bg-[#F7F3ED]/80 backdrop-blur-md">
        <Header 
          withSearch={false} 
          withLogo={true} 
          onProfileClick={() => handleNavIntercept('/profile')}
          onLogoutClick={() => handleNavIntercept('/api/auth/signout')}
        />
      </div>

      <main className="max-w-[1400px] mx-auto w-full py-12 px-10 flex-1">
        
        {/* JUDUL & KETERANGAN */}
        <div className="mb-12 text-center">
          <h1 className="text-[40px] font-black text-[#193C1F] leading-tight tracking-tighter mb-3">
            Violence Report Form
          </h1>
          <p className="text-[#8EA087] font-bold text-base max-w-xl mx-auto">
            Your safety is our priority. Please fill out this form accurately. 
            Information is handled with strict confidentiality.
          </p>
        </div>

        <div className="grid grid-cols-12 gap-10 items-start">
          
          {/* LEFT SIDEBAR: PROGRESS & PERCENTAGE (Sticky) */}
          <aside className="col-span-3 sticky top-32">
            <div className="bg-white border border-[#D0D5CB] rounded-[32px] p-8 shadow-sm">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8EA087] mb-8 opacity-60 text-center">Form Progress</h3>
              <div className="space-y-8 pl-2">
                {steps.map((step) => (
                  <div key={step.id} className="flex gap-5 relative">
                    {step.id < 4 && (
                      <div className={`absolute left-[15px] top-9 w-[2px] h-8 transition-colors duration-500 ${currentStep > step.id ? 'bg-[#193C1F]' : 'bg-[#EBE6DE]'}`} />
                    )}
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 z-10 transition-all duration-500
                      ${currentStep >= step.id ? 'bg-[#193C1F] text-white shadow-lg' : 'bg-[#EBE6DE] text-[#193C1F]/20'}`}>
                      {step.id}
                    </div>
                    <div>
                      <p className={`font-black text-[12px] uppercase tracking-wider ${currentStep >= step.id ? 'text-[#193C1F]' : 'text-[#193C1F]/20'}`}>{step.title}</p>
                      <p className={`text-[10px] font-medium mt-0.5 ${currentStep >= step.id ? 'text-[#8EA087]' : 'text-[#193C1F]/10'}`}>{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* PERSENTASE CARD */}
              <div className="mt-10 pt-6 border-t border-[#F7F3ED]">
                <div className="flex justify-between items-end mb-3">
                  <span className="text-[10px] font-black text-[#193C1F] uppercase tracking-widest opacity-60">Completion</span>
                  <span className="text-[20px] font-black text-[#193C1F] leading-none">{calculateProgress()}%</span>
                </div>
                <div className="h-2 w-full bg-[#EBE6DE] rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-[#193C1F] transition-all duration-700 ease-in-out" 
                    style={{ width: `${calculateProgress()}%` }} 
                  />
                </div>
              </div>
            </div>
          </aside>

          {/* CENTER: MAIN FORM AREA */}
          <div className="col-span-6">
            <div className="bg-white border border-[#D0D5CB] rounded-[40px] shadow-sm p-12 min-h-[550px] flex flex-col transition-all">
              <div className="flex-1">
                
                {/* STEP 1: GENERAL INFO */}
                {currentStep === 1 && (
                  <div className="space-y-8 animate-in fade-in duration-500">
                    <div className="flex justify-between items-center bg-[#F7F3ED] p-6 rounded-[24px] border border-[#D0D5CB]">
                      <div>
                        <p className="text-[13px] font-black text-[#193C1F] uppercase tracking-wide">Anonymous Submission</p>
                        <p className="text-[11px] text-[#8EA087] font-medium italic">Identity will be hidden.</p>
                      </div>
                      <button onClick={() => setIsAnonymous(!isAnonymous)} className={`w-12 h-6 rounded-full relative transition-all ${isAnonymous ? 'bg-[#193C1F]' : 'bg-[#D0D5CB]'}`}>
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${isAnonymous ? 'right-1' : 'left-1'}`} />
                      </button>
                    </div>
                    <Input label="Report Title *" name="title" value={formData.title} onChange={handleInputChange} placeholder="e.g. Physical assault near park" />
                    <div className="grid grid-cols-2 gap-6">
                      <Input label="Category *" name="type" type="select" value={formData.type} onChange={handleInputChange}>
                        <option value="">Select Category</option>
                        <option value="Physical">Physical Violence</option>
                        <option value="Sexual">Sexual Harassment</option>
                        <option value="Psychological">Psychological/Verbal</option>
                        <option value="Other">Other</option>
                      </Input>
                      <Input label="Date of Incident *" name="date" type="date" value={formData.date} onChange={handleInputChange} />
                    </div>
                  </div>
                )}

                {/* STEP 2: DETAILS */}
                {currentStep === 2 && (
                  <div className="space-y-8 animate-in fade-in duration-500">
                    <Input label="Incident Location *" name="location" value={formData.location} onChange={handleInputChange} placeholder="Specific location or landmark" />
                    <div className="space-y-2">
                      <label className="text-[13px] font-black text-[#193C1F] uppercase tracking-wide">Description *</label>
                      <textarea 
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        className="w-full h-48 p-5 bg-[#F7F3ED] border border-[#D0D5CB] rounded-[24px] outline-none focus:border-[#193C1F] transition-all text-sm leading-relaxed"
                        placeholder="Detail incident..."
                      />
                    </div>
                  </div>
                )}

                {/* STEP 3: EVIDENCE */}
                {currentStep === 3 && (
  <div className="space-y-8 animate-in fade-in duration-500 text-center py-10">
    <div className="w-20 h-20 bg-[#F7F3ED] rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-dashed border-[#D0D5CB]">
      <span className="text-2xl">📁</span>
    </div>
    <h3 className="font-black text-[#193C1F] uppercase tracking-widest text-sm">Upload Evidence</h3>
    <p className="text-[#8EA087] text-xs px-10 mb-6 italic">
      {selectedFiles.length > 0 
        ? `${selectedFiles.length} file(s) selected` 
        : "Photos or documents (Optional)."}
    </p>

    {/* Input File yang disembunyikan */}
    <input 
      type="file" 
      ref={fileInputRef}
      onChange={handleFileChange}
      multiple 
      className="hidden" 
      accept="image/*,.pdf,.doc,.docx"
    />

    <Button 
      type="button"
      onClick={() => fileInputRef.current?.click()} // Memicu klik input file
      className="bg-[#EBE6DE] text-[#193C1F] hover:bg-[#D0D5CB] shadow-none"
    >
      {selectedFiles.length > 0 ? "Change Files" : "Select Files"}
    </Button>

    {/* List nama file yang terpilih (Optional) */}
    {selectedFiles.length > 0 && (
      <div className="mt-4 space-y-1">
        {selectedFiles.map((file, idx) => (
          <p key={idx} className="text-[10px] text-[#193C1F] font-bold">{file.name}</p>
        ))}
      </div>
    )}
  </div>
)}

                {/* STEP 4: REVIEW */}
                {currentStep === 4 && (
                  <div className="space-y-6 animate-in fade-in duration-500">
                    <h3 className="font-black text-[#193C1F] uppercase tracking-widest text-sm border-b pb-4">Review Your Report</h3>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-[#F7F3ED] rounded-2xl">
                          <p className="text-[10px] text-[#8EA087] font-black uppercase mb-1">Title</p>
                          <p className="text-sm font-bold text-[#193C1F]">{formData.title}</p>
                        </div>
                        <div className="p-4 bg-[#F7F3ED] rounded-2xl">
                          <p className="text-[10px] text-[#8EA087] font-black uppercase mb-1">Category</p>
                          <p className="text-sm font-bold text-[#193C1F]">{formData.type}</p>
                        </div>
                      </div>
                      <div className="p-4 bg-[#F7F3ED] rounded-2xl">
                        <p className="text-[10px] text-[#8EA087] font-black uppercase mb-1">Location</p>
                        <p className="text-sm font-bold text-[#193C1F]">{formData.location}</p>
                      </div>
                    </div>
                    <label className="flex items-center gap-3 p-4 border border-[#D0D5CB] rounded-2xl cursor-pointer hover:bg-[#F7F3ED] transition-all mt-8">
                      <input 
                        type="checkbox" 
                        name="agreement" 
                        checked={formData.agreement} 
                        onChange={handleInputChange} 
                        className="w-5 h-5 accent-[#193C1F]" 
                      />
                      <span className="text-[11px] font-bold text-[#193C1F]">I confirm that the information provided is accurate.</span>
                    </label>
                  </div>
                )}
              </div>

              {/* NAVIGATION */}
              <div className="mt-12 pt-8 border-t border-[#F7F3ED] flex justify-between items-center">
                <button 
                  onClick={prevStep} 
                  className={`text-[12px] font-black uppercase tracking-[0.2em] ${currentStep === 1 ? 'invisible' : 'text-[#8EA087] hover:text-[#193C1F]'}`}
                >
                  ← Back
                </button>
                <Button 
                  onClick={currentStep === 4 ? () => alert('Submitted!') : nextStep} 
                  disabled={!isStepValid()}
                  className={`px-12 py-5 rounded-[20px] text-[13px] font-bold shadow-xl transition-all ${!isStepValid() ? 'opacity-40 grayscale cursor-not-allowed' : 'active:scale-95'}`}
                >
                  {currentStep === 4 ? 'Submit Report' : 'Next Step'}
                </Button>
              </div>
            </div>
          </div>

          {/* RIGHT SIDEBAR: EMERGENCY (Sticky) */}
          <aside className="col-span-3 space-y-6 sticky top-32">
            <div className="bg-[#193C1F] text-[#F7F3ED] p-8 rounded-[32px] shadow-lg">
               <h4 className="font-black text-[14px] uppercase tracking-wider mb-2">🛡️ Safe Submission</h4>
               <p className="text-[11px] opacity-70 leading-relaxed font-medium">Your data is encrypted. We prioritize your privacy.</p>
            </div>

            <div className="bg-[#EBE6DE] border border-[#D0D5CB] p-8 rounded-[32px]">
               <h4 className="font-black text-[12px] text-[#193C1F] uppercase tracking-widest mb-4">Emergency 24/7</h4>
               <div className="space-y-3">
                  <div className="bg-white p-4 rounded-2xl border border-[#D0D5CB]/50 text-center">
                     <p className="text-[9px] font-black text-[#8EA087] uppercase">Police</p>
                     <p className="text-sm font-black text-[#193C1F]">110</p>
                  </div>
                  <div className="bg-white p-4 rounded-2xl border border-[#D0D5CB]/50 text-center">
                     <p className="text-[9px] font-black text-[#8EA087] uppercase">Ambulance</p>
                     <p className="text-sm font-black text-[#193C1F]">118</p>
                  </div>
               </div>
            </div>
          </aside>
        </div>
      </main>

      {/* ALERT KONFIRMASI KELUAR */}
      <Alert 
        isOpen={showExitAlert}
        onClose={() => setShowExitAlert(false)}
        onConfirm={() => {
          if (pendingPath.includes('signout')) {
            window.location.href = pendingPath;
          } else {
            router.push(pendingPath);
          }
        }}
        type="warning"
        title="Discard Progress?"
        description="Your current report data will be lost if you leave this page."
        confirmText="Discard & Exit"
        cancelText="Keep Editing"
      />
    </div>
  );
}