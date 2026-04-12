'use client';

import { authClient } from '@/lib/auth/auth-client';
import Image from 'next/image';
import Link from 'next/link';
import React, { useEffect, useRef, useState } from 'react';

type ProfileGender = 'male' | 'female' | 'other' | 'PREFER_NOT_TO_SAY';

type ProfileFormState = {
  email: string;
  displayName: string;
  bio: string;
  birthDate: string;
  gender: ProfileGender;
  phoneNumber: string;
  avatarUrl: string;
};

type SessionUserProfile = {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  bio?: string | null;
  dateOfBirth?: string | Date | null;
  gender?: string | null;
  phoneNumber?: string | null;
};

const normalizeGender = (value?: string | null): ProfileGender => {
  if (
    value === 'male' ||
    value === 'female' ||
    value === 'other' ||
    value === 'PREFER_NOT_TO_SAY'
  ) {
    return value;
  }

  return 'PREFER_NOT_TO_SAY';
};

const getBirthDateValue = (value?: string | Date | null) => {
  if (!value) {
    return '';
  }

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return date.toISOString().slice(0, 10);
};

const buildProfileState = (
  user?: Partial<SessionUserProfile>,
): ProfileFormState => ({
  email: user?.email ?? '',
  displayName: user?.name ?? '',
  bio: user?.bio ?? '',
  birthDate: getBirthDateValue(user?.dateOfBirth),
  gender: normalizeGender(user?.gender),
  phoneNumber: user?.phoneNumber ?? '',
  avatarUrl: user?.image ?? '',
});

// --- CUSTOM SVG ICONS ---
const BackIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="19" y1="12" x2="5" y2="12"></line>
    <polyline points="12 19 5 12 12 5"></polyline>
  </svg>
);

const CameraIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="white"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
    <circle cx="12" cy="13" r="4"></circle>
  </svg>
);

const ShieldIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
  </svg>
);

// Generic Silhouette Avatar SVG
const SILHOUETTE_AVATAR = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'%3E%3Crect width='200' height='200' fill='%23e5e7eb'/%3E%3Ccircle cx='100' cy='70' r='35' fill='%239ca3af'/%3E%3Cpath d='M40 140c0-30 27-50 60-50s60 20 60 50v50H40z' fill='%239ca3af'/%3E%3C/svg%3E`;

export default function ProfileManagement() {
  const { data: session } = authClient.useSession();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const sessionUser = session?.user as Partial<SessionUserProfile> | undefined;
  const isSessionReady = Boolean(sessionUser);

  // --- STATES ---
  const [formData, setFormData] = useState<ProfileFormState>(() =>
    buildProfileState(sessionUser),
  );

  // State Modal Password
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [actionMessage, setActionMessage] = useState('');
  const [actionError, setActionError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordData, setPasswordData] = useState({
    current: '',
    new: '',
    confirm: '',
  });

  const resetPasswordForm = () => {
    setPasswordData({ current: '', new: '', confirm: '' });
    setPasswordError('');
  };

  useEffect(() => {
    if (sessionUser) {
      setFormData(buildProfileState(sessionUser));
    }
  }, [sessionUser]);

  // --- HANDLERS PROFILE ---
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;

    if (name === 'phoneNumber') {
      const onlyNums = value.replace(/[^0-9]/g, '');
      setFormData((prev) => ({ ...prev, [name]: onlyNums }));
      return;
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageClick = () => fileInputRef.current?.click();

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({
          ...prev,
          avatarUrl: reader.result as string,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async () => {
    if (!sessionUser) {
      setActionError('Profile data is still loading. Please wait a moment.');
      return;
    }

    setActionMessage('');
    setActionError('');
    setIsSavingProfile(true);

    try {
      const currentProfile = buildProfileState(sessionUser);
      const updatePayload: Record<string, unknown> = {};

      const nextDisplayName = formData.displayName.trim();
      const nextBio = formData.bio.trim();
      const nextPhoneNumber = formData.phoneNumber.trim();
      const nextAvatar = formData.avatarUrl.trim();
      const nextBirthDate = formData.birthDate.trim();
      const nextGender = formData.gender;

      if (nextDisplayName && nextDisplayName !== currentProfile.displayName) {
        updatePayload.name = nextDisplayName;
      }

      if (nextBio !== currentProfile.bio) {
        updatePayload.bio = nextBio;
      }

      if (nextPhoneNumber !== currentProfile.phoneNumber) {
        updatePayload.phoneNumber = nextPhoneNumber;
      }

      if (nextAvatar !== currentProfile.avatarUrl) {
        updatePayload.image = nextAvatar;
      }

      if (nextGender !== currentProfile.gender) {
        updatePayload.gender = nextGender;
      }

      if (nextBirthDate && nextBirthDate !== currentProfile.birthDate) {
        updatePayload.dateOfBirth = new Date(nextBirthDate);
      }

      if (Object.keys(updatePayload).length > 0) {
        const { error } = await authClient.updateUser(
          updatePayload as Parameters<typeof authClient.updateUser>[0],
        );

        if (error) {
          throw new Error(error.message ?? 'Failed to update profile.');
        }
      }

      setActionMessage('Profile updated successfully.');
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'An unexpected error occurred while saving your profile.';
      setActionError(message);
    } finally {
      setIsSavingProfile(false);
    }
  };

  // --- HANDLER PASSWORD ---
  const handleUpdatePassword = async () => {
    setPasswordError('');
    setActionMessage('');

    const currentPassword = passwordData.current.trim();
    const newPassword = passwordData.new.trim();
    const confirmPassword = passwordData.confirm.trim();

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError('All fields are required.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters.');
      return;
    }

    if (currentPassword === newPassword) {
      setPasswordError('New password must be different from current password.');
      return;
    }

    setIsUpdatingPassword(true);

    try {
      const { error } = await authClient.changePassword({
        currentPassword,
        newPassword,
        revokeOtherSessions: true,
      });

      if (error) {
        throw new Error(error.message ?? 'Failed to update password.');
      }

      setIsPasswordModalOpen(false);
      resetPasswordForm();
      setActionMessage('Password updated successfully.');
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'An unexpected error occurred while updating password.';

      if (
        /oauth|social|credential|password account|set password/i.test(message)
      ) {
        setPasswordError(
          'This account does not have a password yet. Use Forgot Password to create one first.',
        );
      } else {
        setPasswordError(message);
      }
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const accountId = sessionUser?.id ?? 'Loading...';
  const displayAvatar = formData.avatarUrl || SILHOUETTE_AVATAR;

  return (
    <div className="min-h-screen bg-[#F7F3ED] text-[#193C1F] font-sans p-6 md:p-12">
      <div className="max-w-5xl mx-auto">
        {/* TOP NAVIGATION */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div className="flex items-center gap-5">
            <Link
              href="/dashboard"
              className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white border border-[#D0D5CB] hover:bg-[#EBE6DE] transition-all text-[#193C1F] shadow-sm"
            >
              <BackIcon />
            </Link>
            <div>
              <h1 className="text-2xl font-black tracking-tight">
                Profile Settings
              </h1>
              {/* <p className="text-[#8EA087] text-sm font-bold uppercase tracking-wider">
                Manage Account ID: {accountId}
              </p> */}
            </div>
          </div>
          <button
            onClick={handleSaveProfile}
            disabled={isSavingProfile || !isSessionReady}
            className="px-10 py-4 bg-[#193C1F] text-[#F7F3ED] rounded-2xl font-bold hover:bg-[#2d5a35] transition-all active:scale-95 shadow-xl shadow-[#193C1F]/20 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSavingProfile
              ? 'Saving...'
              : isSessionReady
                ? 'Save All Changes'
                : 'Loading profile...'}
          </button>
        </div>

        {(actionMessage || actionError) && (
          <div
            className={`mb-10 rounded-2xl px-5 py-4 text-sm font-medium ${actionError ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-[#EBE6DE] text-[#193C1F] border border-[#D0D5CB]'}`}
          >
            {actionError || actionMessage}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* LEFT PANEL */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white p-10 rounded-[40px] border border-[#D0D5CB]/50 shadow-sm flex flex-col items-center text-center">
              <div
                className="relative group cursor-pointer"
                onClick={handleImageClick}
              >
                <div className="w-44 h-44 rounded-[48px] overflow-hidden border-8 border-[#F7F3ED] shadow-inner bg-slate-100">
                  <Image
                    src={displayAvatar}
                    alt="Avatar"
                    width={176}
                    height={176}
                    unoptimized
                    className="w-full h-full object-cover transition-transform group-hover:scale-110"
                  />
                </div>
                <div className="absolute inset-0 bg-black/20 rounded-[48px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <p className="text-white text-xs font-bold">Change Photo</p>
                </div>
                <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-[#193C1F] rounded-2xl flex items-center justify-center border-4 border-white shadow-lg">
                  <CameraIcon />
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageChange}
                  accept="image/*"
                  className="hidden"
                />
              </div>

              <div className="mt-8">
                <h2 className="text-xl font-black">{formData.displayName}</h2>
                <p className="text-[#8EA087] text-sm mt-1">{formData.email}</p>
              </div>

              <div className="w-full h-px bg-[#F7F3ED] my-6" />

              <div className="w-full text-left bg-[#F7F3ED]/50 p-5 rounded-2xl">
                <label className="text-[10px] font-black uppercase text-[#8EA087] tracking-widest">
                  System User ID
                </label>
                <p className="font-mono text-[10px] font-bold mt-1 text-[#193C1F]">
                  {accountId}
                </p>
              </div>
            </div>
          </div>

          {/* RIGHT PANEL */}
          <div className="lg:col-span-8 space-y-6">
            {/* PUBLIC PROFILE */}
            <section className="bg-white p-8 md:p-10 rounded-[40px] border border-[#D0D5CB]/50 shadow-sm">
              <h3 className="text-lg font-black mb-8">Public Profile</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="flex flex-col gap-2 md:col-span-2">
                  <label className="text-[11px] font-black uppercase tracking-widest text-[#8EA087]">
                    Display Name
                  </label>
                  <input
                    name="displayName"
                    type="text"
                    value={formData.displayName}
                    onChange={handleChange}
                    className="bg-[#EBE6DE]/30 border border-transparent focus:border-[#8EA087] focus:bg-white p-4 rounded-2xl text-sm font-medium outline-none transition-all"
                  />
                </div>
                <div className="flex flex-col gap-2 md:col-span-2">
                  <label className="text-[11px] font-black uppercase tracking-widest text-[#8EA087]">
                    Short Bio
                  </label>
                  <textarea
                    name="bio"
                    rows={3}
                    value={formData.bio}
                    onChange={handleChange}
                    className="bg-[#EBE6DE]/30 border border-transparent focus:border-[#8EA087] focus:bg-white p-4 rounded-2xl text-sm font-medium outline-none transition-all resize-none"
                  />
                </div>
              </div>
            </section>

            {/* PERSONAL DETAILS */}
            <section className="bg-white p-8 md:p-10 rounded-[40px] border border-[#D0D5CB]/50 shadow-sm">
              <h3 className="text-lg font-black mb-8">Personal Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="flex flex-col gap-2">
                  <label className="text-[11px] font-black uppercase tracking-widest text-[#8EA087]">
                    Email Address
                  </label>
                  <input
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    readOnly
                    className="bg-[#EBE6DE]/30 border border-transparent focus:border-[#8EA087] focus:bg-white p-4 rounded-2xl text-sm font-medium outline-none transition-all cursor-not-allowed"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[11px] font-black uppercase tracking-widest text-[#8EA087]">
                    Phone Number
                  </label>
                  <input
                    name="phoneNumber"
                    type="text"
                    inputMode="numeric"
                    value={formData.phoneNumber}
                    onChange={handleChange}
                    className="bg-[#EBE6DE]/30 border border-transparent focus:border-[#8EA087] focus:bg-white p-4 rounded-2xl text-sm font-medium outline-none transition-all"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[11px] font-black uppercase tracking-widest text-[#8EA087]">
                    Birth Date
                  </label>
                  <input
                    name="birthDate"
                    type="date"
                    value={formData.birthDate}
                    onChange={handleChange}
                    className="bg-[#EBE6DE]/30 border border-transparent focus:border-[#8EA087] focus:bg-white p-4 rounded-2xl text-sm font-medium outline-none transition-all"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[11px] font-black uppercase tracking-widest text-[#8EA087]">
                    Gender
                  </label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    className="bg-[#EBE6DE]/30 border border-transparent focus:border-[#8EA087] focus:bg-white p-4 rounded-2xl text-sm font-medium outline-none transition-all appearance-none cursor-pointer"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                    <option value="PREFER_NOT_TO_SAY">Prefer not to say</option>
                  </select>
                </div>
              </div>
            </section>

            {/* SECURITY SECTION */}
            <section className="bg-white p-8 md:p-10 rounded-[40px] border border-[#D0D5CB]/50 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 bg-[#193C1F]/10 rounded-2xl flex items-center justify-center text-[#193C1F]">
                  <ShieldIcon />
                </div>
                <div>
                  <h3 className="font-black">Account Security</h3>
                  <p className="text-xs text-[#8EA087] mt-1 font-medium">
                    Update your password to keep your account safe.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsPasswordModalOpen(true)}
                className="px-8 py-4 border-2 border-[#193C1F] text-[#193C1F] rounded-2xl text-sm font-black hover:bg-[#193C1F] hover:text-[#F7F3ED] transition-all"
              >
                Change Password
              </button>
            </section>
          </div>
        </div>
      </div>

      {/* MODAL CHANGE PASSWORD */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div
            className="absolute inset-0 bg-[#193C1F]/40 backdrop-blur-sm animate-in fade-in duration-300"
            onClick={() => {
              setIsPasswordModalOpen(false);
              resetPasswordForm();
            }}
          />
          <div className="relative bg-white w-full max-w-md rounded-[32px] p-10 shadow-2xl animate-in zoom-in duration-300">
            <h3 className="text-[22px] font-black text-[#193C1F] mb-6 tracking-tight">
              Change Password
            </h3>

            <div className="space-y-5">
              {passwordError && (
                <div className="bg-red-50 text-red-600 text-[11px] font-black uppercase tracking-wider p-4 rounded-2xl border border-red-100 animate-in slide-in-from-top-2">
                  ⚠️ {passwordError}
                </div>
              )}

              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black uppercase text-[#8EA087] tracking-widest">
                  Current Password
                </label>
                <input
                  type="password"
                  value={passwordData.current}
                  onChange={(e) => {
                    setPasswordData({
                      ...passwordData,
                      current: e.target.value,
                    });
                    setPasswordError('');
                  }}
                  placeholder="••••••••"
                  className="w-full bg-[#F7F3ED] p-4 rounded-2xl outline-none border border-transparent focus:border-[#8EA087] transition-all"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black uppercase text-[#8EA087] tracking-widest">
                  New Password
                </label>
                <input
                  type="password"
                  value={passwordData.new}
                  onChange={(e) => {
                    setPasswordData({ ...passwordData, new: e.target.value });
                    setPasswordError('');
                  }}
                  placeholder="••••••••"
                  className="w-full bg-[#F7F3ED] p-4 rounded-2xl outline-none border border-transparent focus:border-[#8EA087] transition-all"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black uppercase text-[#8EA087] tracking-widest">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={passwordData.confirm}
                  onChange={(e) => {
                    setPasswordData({
                      ...passwordData,
                      confirm: e.target.value,
                    });
                    setPasswordError('');
                  }}
                  placeholder="••••••••"
                  className="w-full bg-[#F7F3ED] p-4 rounded-2xl outline-none border border-transparent focus:border-[#8EA087] transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-10">
              <button
                onClick={() => {
                  setIsPasswordModalOpen(false);
                  resetPasswordForm();
                }}
                disabled={isUpdatingPassword}
                className="py-4 bg-[#F7F3ED] text-[#193C1F] font-bold rounded-2xl hover:bg-[#EBE6DE] transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdatePassword}
                disabled={isUpdatingPassword}
                className="py-4 bg-[#193C1F] text-white font-bold rounded-2xl hover:bg-[#2d5a35] shadow-lg shadow-[#193C1F]/20 transition-all active:scale-95"
              >
                {isUpdatingPassword ? 'Updating...' : 'Update'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
