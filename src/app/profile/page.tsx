'use client';

import { Button } from '@/components/button';
import { Input } from '@/components/input';
import { Modal } from '@/components/modal';
import { Toast } from '@/components/toast';
import { authClient } from '@/lib/auth/auth-client';
import Image from 'next/image';
import Link from 'next/link';
import React, { useEffect, useRef, useState } from 'react';

const SILHOUETTE_AVATAR = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'%3E%3Crect width='200' height='200' fill='%23e5e7eb'/%3E%3Ccircle cx='100' cy='70' r='35' fill='%239ca3af'/%3E%3Cpath d='M40 140c0-30 27-50 60-50s60 20 60 50v50H40z' fill='%239ca3af'/%3E%3C/svg%3E`;

// Definisi tipe user agar tidak perlu pakai 'as any' terus menerus
interface CustomUser {
  id: string;
  email: string;
  name: string;
  image?: string;
  bio?: string;
  dateOfBirth?: string | Date;
  gender?: 'male' | 'female' | 'other' | 'PREFER_NOT_TO_SAY';
  phoneNumber?: string;
}

export default function ProfileManagement() {
  const { data: session } = authClient.useSession();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{
    show: boolean;
    msg: string;
    type: 'success' | 'error';
  }>({
    show: false,
    msg: '',
    type: 'success',
  });
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [passwordData, setPasswordData] = useState({
    current: '',
    new: '',
    confirm: '',
  });

  const [formData, setFormData] = useState({
    email: '',
    displayName: '',
    bio: '',
    birthDate: '',
    gender: 'PREFER_NOT_TO_SAY',
    phoneNumber: '',
    avatarUrl: '',
  });

  useEffect(() => {
    if (session?.user) {
      // Cast ke CustomUser & tipe bawaan session
      const u = session.user as CustomUser;
      setFormData({
        email: u.email ?? '',
        displayName: u.name ?? '',
        bio: u.bio ?? '',
        birthDate: u.dateOfBirth
          ? new Date(u.dateOfBirth).toISOString().slice(0, 10)
          : '',
        gender: u.gender ?? 'PREFER_NOT_TO_SAY',
        phoneNumber: u.phoneNumber ?? '',
        avatarUrl: u.image ?? '',
      });
    }
  }, [session]);

  const handleSaveProfile = async () => {
    setLoading(true);
    try {
      const { error } = await authClient.updateUser({
        name: formData.displayName,
        image: formData.avatarUrl,
        // @ts-expect-error: bio and other fields are custom extensions
        bio: formData.bio,
        phoneNumber: formData.phoneNumber,
        dateOfBirth: new Date(formData.birthDate),
        gender: formData.gender,
      });
      if (error) throw error;

      window.scrollTo({ top: 0, behavior: 'smooth' });
      setToast({
        show: true,
        msg: 'Profile updated successfully!',
        type: 'success',
      });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Update failed';
      setToast({ show: true, msg: errorMsg, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (passwordData.new !== passwordData.confirm) {
      return setToast({
        show: true,
        msg: 'Passwords do not match',
        type: 'error',
      });
    }
    setLoading(true);
    try {
      const { error } = await authClient.changePassword({
        currentPassword: passwordData.current,
        newPassword: passwordData.new,
        revokeOtherSessions: true,
      });
      if (error) throw error;

      setToast({
        show: true,
        msg: 'Password updated successfully!',
        type: 'success',
      });
      setIsPasswordModalOpen(false);
      setPasswordData({ current: '', new: '', confirm: '' });
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : 'Failed to change password';
      setToast({ show: true, msg: errorMsg, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Helper untuk update form state tanpa 'any'
  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="min-h-screen bg-[#F7F3ED] text-[#193C1F] p-6 md:p-12">
      <Toast {...toast} onClose={() => setToast({ ...toast, show: false })} />

      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-5 mb-10">
          <Link
            href="/dashboard"
            className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white border border-[#D0D5CB] hover:bg-[#EBE6DE] transition-all shadow-sm"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
          </Link>
          <h1 className="text-2xl font-black tracking-tight">
            Profile Settings
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-4">
            <div className="bg-white p-10 rounded-[40px] border border-[#D0D5CB]/50 shadow-sm flex flex-col items-center text-center">
              <div
                className="relative group cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="w-44 h-44 rounded-[48px] overflow-hidden border-8 border-[#F7F3ED] shadow-inner bg-slate-100">
                  <Image
                    src={formData.avatarUrl || SILHOUETTE_AVATAR}
                    alt="Avatar"
                    width={176}
                    height={176}
                    unoptimized
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  />
                </div>
                <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-[#193C1F] rounded-2xl flex items-center justify-center border-4 border-white shadow-lg text-white">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                    <circle cx="12" cy="13" r="4"></circle>
                  </svg>
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () =>
                        setFormData({
                          ...formData,
                          avatarUrl: reader.result as string,
                        });
                      reader.readAsDataURL(file);
                    }
                  }}
                />
              </div>
              <div className="mt-8">
                <h2 className="text-xl font-black">
                  {formData.displayName || 'User'}
                </h2>
                <p className="text-[#8EA087] text-sm mt-1">{formData.email}</p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-8 space-y-6">
            <section className="bg-white p-8 md:p-10 rounded-[40px] border border-[#D0D5CB]/50 shadow-sm">
              <h3 className="text-lg font-black mb-8 text-[#193C1F]">
                Public Profile
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="md:col-span-2">
                  <Input
                    label="Display Name"
                    name="displayName"
                    value={formData.displayName}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="md:col-span-2">
                  <Input
                    type="textarea"
                    label="Short Bio"
                    name="bio"
                    value={formData.bio}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
            </section>

            <section className="bg-white p-8 md:p-10 rounded-[40px] border border-[#D0D5CB]/50 shadow-sm">
              <h3 className="text-lg font-black mb-8 text-[#193C1F]">
                Personal Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Input
                  label="Email Address"
                  value={formData.email}
                  readOnly
                  className="cursor-not-allowed opacity-70"
                />
                <Input
                  label="Phone Number"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                />
                <Input
                  type="date"
                  label="Birth Date"
                  name="birthDate"
                  value={formData.birthDate}
                  onChange={handleInputChange}
                />
                <Input
                  type="select"
                  label="Gender"
                  name="gender"
                  value={formData.gender}
                  onChange={handleInputChange}
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                  <option value="PREFER_NOT_TO_SAY">Prefer not to say</option>
                </Input>
              </div>
            </section>

            <section className="bg-white p-8 md:p-10 rounded-[40px] border border-[#D0D5CB]/50 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 bg-[#193C1F]/10 rounded-2xl flex items-center justify-center text-[#193C1F]">
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                  </svg>
                </div>
                <div>
                  <h3 className="font-black text-[#193C1F]">
                    Account Security
                  </h3>
                  <p className="text-xs text-[#8EA087] mt-1 font-medium">
                    Update password to keep account safe.
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={() => setIsPasswordModalOpen(true)}
              >
                Change Password
              </Button>
            </section>

            <div className="pt-4 flex justify-end">
              <Button
                variant="secondary"
                className="px-12 h-14 w-full md:w-auto shadow-lg shadow-[#193C1F]/10"
                onClick={handleSaveProfile}
                disabled={loading}
              >
                {loading ? 'Saving Changes...' : 'Save All Changes'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <Modal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        title="Change Password"
      >
        <div className="space-y-4">
          <Input
            type="password"
            label="Current Password"
            value={passwordData.current}
            autoComplete="new-password"
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setPasswordData({ ...passwordData, current: e.target.value })
            }
          />
          <Input
            type="password"
            label="New Password"
            value={passwordData.new}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setPasswordData({ ...passwordData, new: e.target.value })
            }
          />
          <Input
            type="password"
            label="Confirm New Password"
            value={passwordData.confirm}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setPasswordData({ ...passwordData, confirm: e.target.value })
            }
          />
          <div className="flex gap-4 mt-8">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setIsPasswordModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="secondary"
              className="flex-1"
              onClick={handleUpdatePassword}
              disabled={loading}
            >
              {loading ? 'Updating...' : 'Update'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
