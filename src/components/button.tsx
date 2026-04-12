import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline';
  children: React.ReactNode;
}

export const Button = ({
  variant = 'primary',
  children,
  className = '',
  ...props
}: ButtonProps) => {
  const baseStyles =
    'px-7 py-3.5 rounded-2xl font-bold transition-all active:scale-95 shadow-sm flex items-center justify-center gap-2';
  const variants = {
    primary:
      'bg-[#193C1F] text-[#F7F3ED] hover:bg-[#2d5a35] shadow-[#193C1F]/20',
    secondary: 'bg-[#8EA087] text-white hover:bg-[#193C1F]',
    outline:
      'bg-white border-2 border-[#D0D5CB] text-[#193C1F] hover:bg-[#F7F3ED]',
    ghost:
      'text-[#8EA087] font-black uppercase tracking-widest text-[11px] hover:text-[#193C1F]',
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
