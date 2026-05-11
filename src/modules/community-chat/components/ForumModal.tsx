'use client';

import { Button } from '@/components/button';
import { Modal } from '@/components/modal';
import Image from 'next/image';
import React, { useEffect, useState } from 'react';

interface ForumModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: FormData) => void;
  loading?: boolean;
  initialData?: {
    name: string;
    description: string;
    category: string;
    type: string;
    coverUrl?: string | null;
  };
  title?: string;
}

export const ForumModal = ({
  isOpen,
  onClose,
  onSubmit,
  loading = false,
  initialData,
  title = 'Create New Forum',
}: ForumModalProps) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    type: 'PUBLIC',
  });
  const [coverImage, setCoverImage] = useState<File | null>(null);

  useEffect(() => {
    if (initialData) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFormData({
        name: initialData.name || '',
        description: initialData.description || '',
        category: initialData.category || '',
        type: initialData.type || 'PUBLIC',
      });
    } else {
      setFormData({
        name: '',
        description: '',
        category: '',
        type: 'PUBLIC',
      });
    }

    setCoverImage(null);
  }, [initialData, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = new FormData();
    data.append('name', formData.name);
    data.append('description', formData.description);
    data.append('category', formData.category);
    data.append('type', formData.type);
    if (coverImage) {
      data.append('coverImage', coverImage);
    }
    onSubmit(data);
  };

  return (
    <Modal title={title} isOpen={isOpen} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4 text-left">
        <p className="text-sm text-[#8EA087] font-medium">
          Fill in the details to {initialData ? 'update' : 'create'} the
          community support forum.
        </p>

        <div className="space-y-4 mt-4">
          <div>
            <label className="text-xs font-black uppercase tracking-widest text-[#193C1F] mb-2 block">
              Forum Name
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="e.g., Mental Health Support"
              className="w-full h-[48px] bg-[#F7F3ED] border border-[#D0D5CB] rounded-xl px-4 text-sm focus:border-[#8EA087] outline-none transition-all focus:bg-white"
            />
          </div>

          <div>
            <label className="text-xs font-black uppercase tracking-widest text-[#193C1F] mb-2 block">
              Category
            </label>
            <input
              type="text"
              required
              value={formData.category}
              onChange={(e) =>
                setFormData({ ...formData, category: e.target.value })
              }
              placeholder="e.g., Depression, Anxiety, etc."
              className="w-full h-[48px] bg-[#F7F3ED] border border-[#D0D5CB] rounded-xl px-4 text-sm focus:border-[#8EA087] outline-none transition-all focus:bg-white"
            />
          </div>

          <div>
            <label className="text-xs font-black uppercase tracking-widest text-[#193C1F] mb-2 block">
              Privacy Type
            </label>
            <select
              value={formData.type}
              onChange={(e) =>
                setFormData({ ...formData, type: e.target.value })
              }
              className="w-full h-[48px] bg-[#F7F3ED] border border-[#D0D5CB] rounded-xl px-4 text-sm focus:border-[#8EA087] outline-none appearance-none cursor-pointer transition-all focus:bg-white"
            >
              <option value="PUBLIC">Public (Visible to everyone)</option>
              <option value="PRIVATE">Private (Invite only)</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-black uppercase tracking-widest text-[#193C1F] mb-2 block">
              Description
            </label>
            <textarea
              required
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Describe what this forum is about..."
              className="w-full h-[100px] bg-[#F7F3ED] border border-[#D0D5CB] rounded-xl p-4 text-sm focus:border-[#8EA087] outline-none resize-none transition-all focus:bg-white"
            />
          </div>

          <div>
            <label className="text-xs font-black uppercase tracking-widest text-[#193C1F] mb-2 block">
              Group Profile Picture
            </label>
            <div className="flex flex-col gap-3">
              {initialData?.coverUrl && !coverImage && (
                <div className="w-16 h-16 rounded-xl overflow-hidden border border-[#D0D5CB] bg-[#F7F3ED] relative">
                  <Image
                    src={initialData.coverUrl}
                    alt="Preview"
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
              )}
              <div className="flex items-center gap-4">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setCoverImage(e.target.files?.[0] || null)}
                  className="text-xs text-[#8EA087] file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-black file:bg-[#EBE6DE] file:text-[#193C1F] hover:file:bg-[#D0D5CB] transition-all cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-6 border-t border-[#F7F3ED] mt-6">
          <button
            type="button"
            onClick={onClose}
            className="text-[11px] font-black uppercase tracking-widest text-[#193C1F]/40 hover:text-[#193C1F] transition-colors px-4"
          >
            Cancel
          </button>
          <Button loading={loading} type="submit" className="px-8">
            {initialData ? 'Save Changes' : 'Create Forum'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
