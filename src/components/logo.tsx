import Link from 'next/link';
import React from 'react';

interface LogoProps {
  className?: string;
  size?: number; // Untuk atur skala SVG (default 32)
  dark?: boolean; // Untuk ganti warna teks CareConnect
}

export const Logo = ({ className = '', size = 32, dark = true }: LogoProps) => {
  return (
    <Link
      href="/"
      className={`flex items-center gap-3 transition-opacity hover:opacity-90 ${className}`}
    >
      {/* SVG DARI FIGMA */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect width="32" height="32" rx="6" fill="#193C1F" />
        <path
          d="M13.5 15.9998L15.1667 17.6665L18.5 14.3331M23.1817 10.9865C20.5468 11.1264 17.9639 10.2153 16 8.45312C14.0361 10.2153 11.4533 11.1264 8.81834 10.9865C8.60628 11.8074 8.49931 12.6519 8.5 13.4998C8.5 18.159 11.6867 22.0748 16 23.1848C20.3133 22.0748 23.5 18.1598 23.5 13.4998C23.5 12.6315 23.3892 11.7898 23.1817 10.9865L13.5 15.9998"
          stroke="#F7F3ED"
          strokeWidth="1.66667"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      {/* TULISAN CareConnect */}
      <h1
        className={`text-[20px] font-black tracking-tight ${dark ? 'text-[#193C1F]' : 'text-[#F7F3ED]'}`}
      >
        CareConnect
      </h1>
    </Link>
  );
};
