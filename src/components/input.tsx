import React from 'react';

interface InputProps extends React.InputHTMLAttributes<
  HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
> {
  label?: string;
  type?: string;
  icon?: React.ReactNode;
  children?: React.ReactNode;
  rows?: number;
}

export const Input = ({
  label,
  type = 'text',
  className = '',
  icon,
  children,
  rows,
  ...props
}: InputProps) => {
  const [showPassword, setShowPassword] = React.useState(false);

  const isPassword = type === 'password';
  const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

  const baseStyles =
    'w-full bg-[#EBE6DE]/30 border border-transparent focus:border-[#8EA087] focus:bg-white p-4 rounded-2xl text-sm font-medium outline-none transition-all';

  const inputStyles = `${baseStyles} ${className} ${icon ? 'pl-14' : ''} ${isPassword ? 'pr-14' : ''}`;

  return (
    <div className="flex flex-col gap-2 w-full text-left">
      {label && (
        <label className="text-[11px] font-black uppercase tracking-widest text-[#8EA087]">
          {label}
        </label>
      )}

      <div className="relative w-full flex items-center">
        {icon && (
          <div className="absolute left-5 text-[#8EA087] z-10 pointer-events-none">
            {icon}
          </div>
        )}

        {type === 'textarea' ? (
          <textarea
            className={`${inputStyles} resize-none`}
            // 3. Gunakan prop rows yang dikirim, atau default ke 3
            rows={rows || 3}
            {...(props as React.TextareaHTMLAttributes<HTMLTextAreaElement>)}
          />
        ) : type === 'select' ? (
          <div className="relative w-full">
            <select
              className={`${inputStyles} appearance-none cursor-pointer`}
              {...(props as React.SelectHTMLAttributes<HTMLSelectElement>)}
            >
              {children}
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-50">
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m6 9 6 6 6-6" />
              </svg>
            </div>
          </div>
        ) : (
          <input
            type={inputType}
            className={inputStyles}
            {...(props as React.InputHTMLAttributes<HTMLInputElement>)}
          />
        )}

        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 text-[#8EA087] hover:text-[#193C1F] transition-colors focus:outline-none"
          >
            {showPassword ? (
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
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                <line x1="1" y1="1" x2="23" y2="23" />
              </svg>
            ) : (
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
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            )}
          </button>
        )}
      </div>
    </div>
  );
};
