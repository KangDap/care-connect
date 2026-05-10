import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline';
  loading?: boolean;
  children: React.ReactNode;
}

export const Button = ({
  variant = 'primary',
  loading,
  children,
  className = '',
  disabled,
  ...props
}: ButtonProps) => {
  const baseStyles =
    'px-7 py-3.5 rounded-2xl font-bold transition-all active:scale-95 shadow-sm flex items-center justify-center gap-2';
  const variants = {
    primary:
      'bg-[#193c1f] text-[#f7f3ed] hover:bg-[#2d5a35] shadow-[#193c1f]/20',
    secondary: 'bg-[#8ea087] text-white hover:bg-[#193c1f]',
    outline:
      'bg-white border-2 border-[#d0d5cb] text-[#193c1f] hover:bg-[#f7f3ed]',
    ghost:
      'text-[#8ea087] font-black uppercase tracking-widest text-[11px] hover:text-[#193c1f]',
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${loading || disabled ? 'opacity-70 cursor-not-allowed' : ''} ${className}`}
      disabled={loading || disabled}
      {...props}
    >
      {loading ? (
        <svg
          className="animate-spin -ml-1 mr-2 h-4 w-4"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
      ) : null}
      {children}
    </button>
  );
};
