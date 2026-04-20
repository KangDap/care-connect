'use client';

import { Button } from '@/components/button';
import { Input } from '@/components/input';
import { Toast } from '@/components/toast';
import {
  AlignLeft,
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
        ? '!bg-[#8EA087] !text-white hover:brightness-110'
        : 'opacity-60 cursor-not-allowed';
    } else {
      return formData.agreement
        ? '!bg-[#193C1F] !text-white hover:brightness-110'
        : '!bg-[#D0D5CB] !text-[#8EA087] cursor-not-allowed shadow-none';
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

      <div className="bg-white border border-[#D0D5CB] rounded-[40px] shadow-sm p-12 flex flex-col">
        <div className="mb-10 text-center border-b border-[#D0D5CB] pb-8">
          <h1 className="text-[32px] font-black text-[#193C1F] leading-tight tracking-tighter mb-2">
            {currentStep === 1 ? formTitle : 'Review Your Report'}
          </h1>
          <p className="text-[#8EA087] font-bold text-sm mx-auto max-w-md">
            {currentStep === 1
              ? formSubtitle
              : 'Please double-check all information before final submission.'}
          </p>
        </div>

        <div className="flex-1">
          {currentStep === 1 ? (
            <div className="space-y-8">
              {!isConsultation && (
                <div className="flex justify-between items-center bg-[#F7F3ED] p-6 rounded-[24px] border border-[#D0D5CB]">
                  <p className="text-[13px] font-black text-[#193C1F] uppercase tracking-wide">
                    Report Anonymously
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
                rows={5}
              />

              <div className="pt-4">
                <p className="text-[11px] font-black text-[#193C1F] uppercase tracking-widest mb-4">
                  Evidence (Multiple Allowed)
                </p>
                <div className="w-full border-2 border-dashed border-[#D0D5CB] rounded-[24px] p-8 bg-[#F7F3ED]/50 text-center">
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
                    className="bg-white !text-[#193C1F] border border-[#193C1F] px-8"
                  >
                    Upload Files
                  </Button>

                  {selectedFiles.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2 justify-center">
                      {selectedFiles.map((f, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-2 bg-white border border-[#D0D5CB] px-3 py-1 rounded-full text-[10px] font-bold"
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
                <div className="p-5 bg-[#F7F3ED] rounded-[24px] border border-[#D0D5CB]/50">
                  <p className="text-[10px] text-[#8EA087] font-black uppercase tracking-widest mb-1 flex items-center gap-1">
                    <User size={10} /> Visibility
                  </p>
                  <p className="text-sm font-bold text-[#193C1F]">
                    {isAnonymous ? 'Anonymous Report' : 'Identified Report'}
                  </p>
                </div>
                <div className="p-5 bg-[#F7F3ED] rounded-[24px] border border-[#D0D5CB]/50 md:col-span-2">
                  <p className="text-[10px] text-[#8EA087] font-black uppercase tracking-widest mb-1">
                    Report Title
                  </p>
                  <p className="text-sm font-bold text-[#193C1F] leading-snug">
                    {formData.title}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-5 bg-[#F7F3ED] rounded-[24px] border border-[#D0D5CB]/50 flex items-center gap-4">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-[#8EA087] shadow-sm">
                    <Tag size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] text-[#8EA087] font-black uppercase tracking-widest mb-0.5">
                      Category
                    </p>
                    <p className="text-sm font-bold text-[#193C1F]">
                      {formData.type}
                    </p>
                  </div>
                </div>
                <div className="p-5 bg-[#F7F3ED] rounded-[24px] border border-[#D0D5CB]/50 flex items-center gap-4">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-[#8EA087] shadow-sm">
                    <Calendar size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] text-[#8EA087] font-black uppercase tracking-widest mb-0.5">
                      Incident Date
                    </p>
                    <p className="text-sm font-bold text-[#193C1F]">
                      {formData.date}
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-[#F7F3ED] rounded-[32px] border border-[#D0D5CB]/50">
                <p className="text-[10px] text-[#8EA087] font-black uppercase tracking-widest mb-3 flex items-center gap-1">
                  <MapPin size={12} /> Incident Location
                </p>
                <div className="space-y-1">
                  <p className="text-sm font-bold text-[#193C1F]">
                    {formData.district}, {formData.city}, {formData.province}
                  </p>
                  <p className="text-xs text-[#193C1F]/60 leading-relaxed italic">
                    {formData.fullAddress || 'No specific address provided.'}
                  </p>
                </div>
              </div>

              <div className="p-6 bg-[#F7F3ED] rounded-[32px] border border-[#D0D5CB]/50">
                <p className="text-[10px] text-[#8EA087] font-black uppercase tracking-widest mb-2 flex items-center gap-1">
                  <AlignLeft size={12} /> Chronology
                </p>
                <p className="text-sm font-bold text-[#193C1F] whitespace-pre-wrap break-words leading-relaxed">
                  {formData.description}
                </p>
              </div>

              <div className="p-6 bg-[#F7F3ED] rounded-[32px] border border-[#D0D5CB]/50">
                <p className="text-[10px] text-[#8EA087] font-black uppercase tracking-widest mb-3 flex items-center gap-2">
                  <Paperclip size={12} /> Evidence ({selectedFiles.length}{' '}
                  items)
                </p>
                {selectedFiles.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {selectedFiles.map((file, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 bg-white border border-[#D0D5CB] px-4 py-2 rounded-2xl shadow-sm"
                      >
                        <FileText size={14} className="text-[#8EA087]" />
                        <span className="text-[11px] font-bold text-[#193C1F]">
                          {file.name}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-[#193C1F]/40 italic">
                    No files attached.
                  </p>
                )}
              </div>

              <label className="group flex items-start gap-4 p-6 border border-[#D0D5CB] rounded-[32px] cursor-pointer hover:bg-[#F7F3ED] transition-all duration-300">
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
                    className="peer appearance-none w-6 h-6 border-2 border-[#D0D5CB] rounded-lg checked:bg-[#193C1F] checked:border-[#193C1F] transition-all cursor-pointer"
                  />
                  <Check className="absolute w-4 h-4 text-white left-1 opacity-0 peer-checked:opacity-100 transition-opacity" />
                </div>
                <div className="flex-1">
                  <p className="text-[12px] font-black text-[#193C1F] leading-tight mb-1">
                    Confirmation of Truth
                  </p>
                  <p className="text-[11px] font-bold text-[#193C1F]/50 leading-relaxed">
                    I state that this report is made truthfully and I am
                    responsible for the information provided.
                  </p>
                </div>
              </label>
            </div>
          )}
        </div>

        <div className="mt-12 pt-8 border-t border-[#D0D5CB] flex justify-between items-center">
          <button
            type="button"
            onClick={() => setCurrentStep(1)}
            className={`text-[12px] font-black uppercase tracking-[0.2em] transition-all hover:translate-x-[-4px] ${currentStep === 1 ? 'invisible' : 'text-[#8EA087] hover:text-[#193C1F]'}`}
          >
            ← Back to Edit
          </button>
          <Button
            onClick={handleAction}
            className={`px-12 py-5 rounded-[20px] text-[13px] font-bold shadow-md transition-all active:scale-95 ${getButtonStyles()}`}
          >
            {currentStep === 1 ? 'Next to Review' : 'Send Report'}
          </Button>
        </div>
      </div>
    </div>
  );
}
