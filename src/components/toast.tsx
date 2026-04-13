import React, { useEffect } from 'react';

interface ToastProps {
  show: boolean;
  msg: string;
  type: 'success' | 'error';
  onClose: () => void; // Tambahin ini supaya toast bisa lapor kalau dia udah selesai
}

export const Toast = ({ show, msg, type, onClose }: ToastProps) => {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => {
        onClose(); // Otomatis panggil fungsi tutup setelah 3 detik
      }, 3000);

      return () => clearTimeout(timer); // Bersihin timer kalau komponen ilang
    }
  }, [show, onClose]);

  if (!show) return null;

  return (
    <div
      className={`fixed top-10 left-1/2 -translate-x-1/2 z-[300] px-6 py-4 rounded-2xl shadow-2xl border flex items-center gap-3 animate-in slide-in-from-top-full duration-300 ${
        type === 'success'
          ? 'bg-[#193C1F] text-white border-[#193C1F]'
          : 'bg-red-500 text-white border-red-600'
      }`}
    >
      <span className="text-lg">{type === 'success' ? '✅' : '❌'}</span>
      <span className="text-sm font-bold tracking-tight">{msg}</span>
    </div>
  );
};
