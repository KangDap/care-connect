'use client';

import React from 'react';

import { Button } from './button';

interface AlertProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'primary';
}

export const Alert = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'primary',
}: AlertProps) => {
  if (!isOpen) return null;

  // Logika warna berdasarkan type
  const typeStyles = {
    danger: 'bg-red-50 text-red-500',
    warning: 'bg-amber-50 text-amber-500',
    primary: 'bg-[#F7F3ED] text-[#8EA087]',
  };

  const buttonStyles = {
    danger: 'bg-red-500 hover:bg-red-600 shadow-red-100',
    warning: 'bg-amber-500 hover:bg-amber-600 shadow-amber-100',
    primary: '', // Pake style default Button
  };

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-6">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-[#193C1F]/60 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={onClose}
      />

      {/* Alert Box */}
      <div className="relative bg-white w-full max-w-[400px] rounded-[40px] p-10 shadow-2xl animate-in zoom-in duration-300 text-center">
        {/* Icon Header */}
        <div
          className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 text-2xl ${typeStyles[type]}`}
        >
          {type === 'danger' ? '⚠️' : type === 'warning' ? '🔔' : '✨'}
        </div>

        <h3 className="text-2xl font-black text-[#193C1F] mb-3 italic tracking-tight">
          {title}
        </h3>

        <p className="text-sm text-[#193C1F]/50 font-medium leading-relaxed mb-10">
          {description}
        </p>

        <div className="flex flex-col gap-3">
          <Button
            onClick={onConfirm}
            className={`w-full py-5 rounded-2xl text-xs font-black uppercase tracking-widest ${buttonStyles[type]}`}
          >
            {confirmText}
          </Button>

          <button
            onClick={onClose}
            className="text-[11px] font-black text-[#193C1F]/30 uppercase tracking-[0.2em] hover:text-[#193C1F] py-2 transition-colors"
          >
            {cancelText}
          </button>
        </div>
      </div>
    </div>
  );
};
