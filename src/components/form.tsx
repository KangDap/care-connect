'use client';

import { Button } from '@/components/button';
import { Input } from '@/components/input';
import { Toast } from '@/components/toast';
import {
  AlignLeft,
  ArrowLeft,
  Calendar,
  Check,
  FileText,
  MapPin,
  Paperclip,
  Tag,
  User,
  X,
} from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';

// 1. Definisi Interface untuk data form
export interface ReportFormData {
  title: string;
  type: string;
  date: string;
  province: string;
  city: string;
  district: string;
  fullAddress: string;
  description: string;
  agreement: boolean;
}

// 2. Update Interface Props
interface ReportFormProps {
  formTitle: string;
  formSubtitle: string;
  isConsultation?: boolean;
  onSubmit: (
    data: ReportFormData & { isAnonymous: boolean; files: File[] },
  ) => void;
}

// Interface untuk API Wilayah
interface RegionData {
  id: string;
  name: string;
}

export type ReportSubmitData = ReportFormData & {
  isAnonymous: boolean;
  files: File[];
};

interface ReportFormProps {
  formTitle: string;
  formSubtitle: string;
  isConsultation?: boolean;
  onSubmit: (data: ReportSubmitData) => void; // Gunakan tipe ini
}

export default function ReportForm({
  formTitle,
  formSubtitle,
  isConsultation = false,
  onSubmit,
}: ReportFormProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  // 3. Tambahkan tipe data pada state regions
  const [provinces, setProvinces] = useState<RegionData[]>([]);
  const [cities, setCities] = useState<RegionData[]>([]);
  const [districts, setDistricts] = useState<RegionData[]>([]);

  const [toast, setToast] = useState({
    show: false,
    msg: '',
    type: 'error' as 'success' | 'error',
  });

  const [formData, setFormData] = useState<ReportFormData>({
    title: '',
    type: '',
    date: '',
    province: '',
    city: '',
    district: '',
    fullAddress: '',
    description: '',
    agreement: false,
  });

  useEffect(() => {
    if (isSubmitting) {
      document.body.style.cursor = 'wait';
      const style = document.createElement('style');
      style.id = 'cursor-wait-style';
      style.innerHTML = `* { cursor: wait !important; }`;
      document.head.appendChild(style);
    } else {
      document.body.style.cursor = 'default';
      document.getElementById('cursor-wait-style')?.remove();
    }
    return () => {
      document.body.style.cursor = 'default';
      document.getElementById('cursor-wait-style')?.remove();
    };
  }, [isSubmitting]);

  useEffect(() => {
    fetch('https://www.emsifa.com/api-wilayah-indonesia/api/provinces.json')
      .then((res) => res.json())
      .then((data: RegionData[]) => setProvinces(data));
  }, []);

  useEffect(() => {
    if (formData.province) {
      const provId = provinces.find((p) => p.name === formData.province)?.id;
      if (provId) {
        fetch(
          `https://www.emsifa.com/api-wilayah-indonesia/api/regencies/${provId}.json`,
        )
          .then((res) => res.json())
          .then((data: RegionData[]) => setCities(data));
      }
    }
  }, [formData.province, provinces]);

  useEffect(() => {
    if (formData.city) {
      const cityId = cities.find((c) => c.name === formData.city)?.id;
      if (cityId) {
        fetch(
          `https://www.emsifa.com/api-wilayah-indonesia/api/districts/${cityId}.json`,
        )
          .then((res) => res.json())
          .then((data: RegionData[]) => setDistricts(data));
      }
    }
  }, [formData.city, cities]);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const isStep1Valid = () => {
    return (
      formData.title.trim() !== '' &&
      formData.type !== '' &&
      formData.date !== '' &&
      formData.province !== '' &&
      formData.city !== '' &&
      formData.district !== '' &&
      formData.description.trim() !== ''
    );
  };

  const handleAction = async () => {
    if (currentStep === 1) {
      if (isStep1Valid()) {
        setIsSubmitting(true);
        await new Promise((r) => setTimeout(r, 800));
        setCurrentStep(2);
        setIsSubmitting(false);
      } else {
        setToast({
          show: true,
          msg: 'Please fill in all required fields (*)',
          type: 'error',
        });
      }
    } else {
      if (formData.agreement) {
        setIsSubmitting(true);
        try {
          await Promise.resolve(
            onSubmit({ ...formData, isAnonymous, files: selectedFiles }),
          );
        } finally {
          setIsSubmitting(false);
        }
      }
    }
  };

  const getButtonStyles = () => {
    if (currentStep === 1) {
      return isStep1Valid()
        ? '!bg-[#8ea087] !text-white hover:brightness-110'
        : 'opacity-60 cursor-not-allowed';
    } else {
      return formData.agreement
        ? '!bg-[#193c1f] !text-white hover:brightness-110'
        : '!bg-[#d0d5cb] !text-[#8ea087] cursor-not-allowed shadow-none';
    }
  };

  return (
    <div
      className={`w-full transition-all duration-300 ${isSubmitting ? 'opacity-70 pointer-events-none' : ''}`}
    >
      <Toast
        show={toast.show}
        msg={toast.msg}
        type={toast.type}
        onClose={() => setToast({ ...toast, show: false })}
      />

      <div className="flex flex-col rounded-3xl border border-[#d0d5cb] bg-white p-4 shadow-sm sm:p-8 lg:rounded-[40px] lg:p-12">
        <div className="mb-8 border-b border-[#d0d5cb] pb-6 text-center lg:mb-10 lg:pb-8">
          <h1 className="mb-2 text-2xl font-black leading-tight tracking-tighter text-[#193c1f] sm:text-[32px]">
            {currentStep === 1 ? formTitle : 'Review Your Report'}
          </h1>
          <p className="text-[#8ea087] font-bold text-sm mx-auto max-w-md">
            {currentStep === 1
              ? formSubtitle
              : 'Please double-check all information before final submission.'}
          </p>
        </div>

        <div className="flex-1">
          {currentStep === 1 ? (
            <div className="space-y-8">
              {!isConsultation && (
                <div className="flex items-center justify-between gap-4 rounded-[24px] border border-[#d0d5cb] bg-[#f7f3ed] p-4 sm:p-6">
                  <p className="text-[13px] font-black text-[#193c1f] uppercase tracking-wide">
                    Report Anonymously
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsAnonymous(!isAnonymous)}
                    className={`w-12 h-6 rounded-full relative transition-all ${isAnonymous ? 'bg-[#193c1f]' : 'bg-[#d0d5cb]'}`}
                  >
                    <div
                      className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${isAnonymous ? 'right-1' : 'left-1'}`}
                    />
                  </button>
                </div>
              )}

              <Input
                label="Report Title *"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="Summarize the incident"
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                  <option value="Psychological">Psychological / Verbal</option>
                  <option value="other">Other</option>
                </Input>
                <Input
                  label="Incident Date *"
                  name="date"
                  type="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  max={
                    !isConsultation
                      ? new Date().toISOString().split('T')[0]
                      : undefined
                  }
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                  label="Province *"
                  name="province"
                  type="select"
                  value={formData.province}
                  onChange={handleInputChange}
                >
                  <option value="">Select Province</option>
                  {provinces.map((p) => (
                    <option key={p.id} value={p.name}>
                      {p.name}
                    </option>
                  ))}
                </Input>
                <Input
                  label="City/Regency *"
                  name="city"
                  type="select"
                  value={formData.city}
                  onChange={handleInputChange}
                  disabled={!formData.province}
                >
                  <option value="">Select City</option>
                  {cities.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </Input>
                <Input
                  label="District *"
                  name="district"
                  type="select"
                  value={formData.district}
                  onChange={handleInputChange}
                  disabled={!formData.city}
                >
                  <option value="">Select District</option>
                  {districts.map((d) => (
                    <option key={d.id} value={d.name}>
                      {d.name}
                    </option>
                  ))}
                </Input>
              </div>

              <Input
                label="Full Address"
                name="fullAddress"
                value={formData.fullAddress}
                onChange={handleInputChange}
                placeholder="St. Name, Floor, or Landmark"
              />
              {/* Fix rows props tanpa any */}
              <Input
                label="Incident Description *"
                name="description"
                type="textarea"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Insert description (20 - 2000 characters)"
                rows={5}
              />

              <div className="pt-4">
                <p className="text-[11px] font-black text-[#193c1f] uppercase tracking-widest mb-4">
                  Evidence (Multiple Allowed)
                </p>
                <div className="w-full rounded-[24px] border-2 border-dashed border-[#d0d5cb] bg-[#f7f3ed]/50 p-4 text-center sm:p-8">
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    multiple
                    onChange={(e) =>
                      e.target.files &&
                      setSelectedFiles((prev) => [
                        ...prev,
                        ...Array.from(e.target.files!),
                      ])
                    }
                  />
                  <Button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-white !text-[#193c1f] border border-[#193c1f] px-8"
                  >
                    Upload Files
                  </Button>

                  {selectedFiles.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2 justify-center">
                      {selectedFiles.map((f, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-2 bg-white border border-[#d0d5cb] px-3 py-1 rounded-full text-[10px] font-bold"
                        >
                          {f.name}{' '}
                          <X
                            size={12}
                            className="cursor-pointer text-red-400"
                            onClick={() =>
                              setSelectedFiles((prev) =>
                                prev.filter((_, idx) => idx !== i),
                              )
                            }
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-5 bg-[#f7f3ed] rounded-[24px] border border-[#d0d5cb]/50">
                  <p className="text-[10px] text-[#8ea087] font-black uppercase tracking-widest mb-1 flex items-center gap-1">
                    <User size={10} /> Visibility
                  </p>
                  <p className="text-sm font-bold text-[#193c1f]">
                    {isAnonymous ? 'Anonymous Report' : 'Identified Report'}
                  </p>
                </div>
                <div className="p-5 bg-[#f7f3ed] rounded-[24px] border border-[#d0d5cb]/50 md:col-span-2">
                  <p className="text-[10px] text-[#8ea087] font-black uppercase tracking-widest mb-1">
                    Report Title
                  </p>
                  <p className="text-sm font-bold text-[#193c1f] leading-snug">
                    {formData.title}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-5 bg-[#f7f3ed] rounded-[24px] border border-[#d0d5cb]/50 flex items-center gap-4">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-[#8ea087] shadow-sm">
                    <Tag size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] text-[#8ea087] font-black uppercase tracking-widest mb-0.5">
                      Category
                    </p>
                    <p className="text-sm font-bold text-[#193c1f]">
                      {formData.type}
                    </p>
                  </div>
                </div>
                <div className="p-5 bg-[#f7f3ed] rounded-[24px] border border-[#d0d5cb]/50 flex items-center gap-4">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-[#8ea087] shadow-sm">
                    <Calendar size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] text-[#8ea087] font-black uppercase tracking-widest mb-0.5">
                      Incident Date
                    </p>
                    <p className="text-sm font-bold text-[#193c1f]">
                      {formData.date}
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-[#f7f3ed] rounded-[32px] border border-[#d0d5cb]/50">
                <p className="text-[10px] text-[#8ea087] font-black uppercase tracking-widest mb-3 flex items-center gap-1">
                  <MapPin size={12} /> Incident Location
                </p>
                <div className="space-y-1">
                  <p className="text-sm font-bold text-[#193c1f]">
                    {formData.district}, {formData.city}, {formData.province}
                  </p>
                  <p className="text-xs text-[#193c1f]/60 leading-relaxed italic">
                    {formData.fullAddress || 'No specific address provided.'}
                  </p>
                </div>
              </div>

              <div className="p-6 bg-[#f7f3ed] rounded-[32px] border border-[#d0d5cb]/50">
                <p className="text-[10px] text-[#8ea087] font-black uppercase tracking-widest mb-2 flex items-center gap-1">
                  <AlignLeft size={12} /> Chronology
                </p>
                <p className="text-sm font-bold text-[#193c1f] whitespace-pre-wrap break-words leading-relaxed">
                  {formData.description}
                </p>
              </div>

              <div className="p-6 bg-[#f7f3ed] rounded-[32px] border border-[#d0d5cb]/50">
                <p className="text-[10px] text-[#8ea087] font-black uppercase tracking-widest mb-3 flex items-center gap-2">
                  <Paperclip size={12} /> Evidence ({selectedFiles.length}{' '}
                  items)
                </p>
                {selectedFiles.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {selectedFiles.map((file, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 bg-white border border-[#d0d5cb] px-4 py-2 rounded-2xl shadow-sm"
                      >
                        <FileText size={14} className="text-[#8ea087]" />
                        <span className="text-[11px] font-bold text-[#193c1f]">
                          {file.name}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-[#193c1f]/40 italic">
                    No files attached.
                  </p>
                )}
              </div>

              <label className="group flex items-start gap-4 p-6 border border-[#d0d5cb] rounded-[32px] cursor-pointer hover:bg-[#f7f3ed] transition-all duration-300">
                <div className="relative flex items-center mt-1">
                  <input
                    type="checkbox"
                    checked={formData.agreement}
                    onChange={(e) =>
                      setFormData((p) => ({
                        ...p,
                        agreement: e.target.checked,
                      }))
                    }
                    className="peer appearance-none w-6 h-6 border-2 border-[#d0d5cb] rounded-lg checked:bg-[#193c1f] checked:border-[#193c1f] transition-all cursor-pointer"
                  />
                  <Check className="absolute w-4 h-4 text-white left-1 opacity-0 peer-checked:opacity-100 transition-opacity" />
                </div>
                <div className="flex-1">
                  <p className="text-[12px] font-black text-[#193c1f] leading-tight mb-1">
                    Confirmation of Truth
                  </p>
                  <p className="text-[11px] font-bold text-[#193c1f]/50 leading-relaxed">
                    I state that this report is made truthfully and I am
                    responsible for the information provided.
                  </p>
                </div>
              </label>
            </div>
          )}
        </div>

        <div className="mt-8 flex items-center justify-between gap-3 border-t border-[#d0d5cb] pt-6 sm:mt-12 sm:pt-8">
          <Button
            type="button"
            onClick={() => setCurrentStep(1)}
            variant="outline"
            className={`icon-button back-icon-button h-11 w-11 rounded-full p-0 ${currentStep === 1 ? 'invisible' : ''}`}
            aria-label="Back to Edit"
          >
            <ArrowLeft size={18} />
          </Button>
          <Button
            suppressHydrationWarning
            onClick={handleAction}
            className={`rounded-[20px] px-5 py-4 text-[12px] font-bold shadow-md transition-all active:scale-95 sm:px-12 sm:py-5 sm:text-[13px] ${getButtonStyles()}`}
          >
            {currentStep === 1 ? 'Next to Review' : 'Send Report'}
          </Button>
        </div>
      </div>
    </div>
  );
}
