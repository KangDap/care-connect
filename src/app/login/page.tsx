"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth/auth-client";

// ==========================================
// 1. KOMPONEN SVG ICONS (PIXEL PERFECT)
// ==========================================

const LogoIcon = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="32" height="32" rx="6" fill="#193C1F"/>
    <path d="M13.5 15.9998L15.1667 17.6665L18.5 14.3331M23.1817 10.9865C20.5468 11.1264 17.9639 10.2153 16 8.45312C14.0361 10.2153 11.4533 11.1264 8.81834 10.9865C8.60628 11.8074 8.49931 12.6519 8.5 13.4998C8.5 18.159 11.6867 22.0748 16 23.1848C20.3133 22.0748 23.5 18.1598 23.5 13.4998C23.5 12.6315 23.3892 11.7898 23.1817 10.9865L13.5 15.9998" stroke="#F7F3ED" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const HelpIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M7.5 6.66667C7.5 5.28613 8.61929 4.16667 10 4.16667C11.3807 4.16667 12.5 5.28613 12.5 6.66667C12.5 8.04721 11.3807 9.16667 10 9.16667V10.8333M10 14.1667H10.0083M18.3333 10C18.3333 14.6024 14.6024 18.3333 10 18.3333C5.39763 18.3333 1.66667 14.6024 1.66667 10C1.66667 5.39763 5.39763 1.66667 10 1.66667C14.6024 1.66667 18.3333 5.39763 18.3333 10Z" stroke="#193C1F" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const UserIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M16.6667 17.5V15.8333C16.6667 14.9493 16.3155 14.1014 15.6904 13.4763C15.0652 12.8512 14.2174 12.5 13.3333 12.5H6.66667C5.78261 12.5 4.93477 12.8512 4.30964 13.4763C3.68452 14.1014 3.33333 14.9493 3.33333 15.8333V17.5M13.3333 5.83333C13.3333 7.67428 11.841 9.16667 10 9.16667C8.15905 9.16667 6.66667 7.67428 6.66667 5.83333C6.66667 3.99238 8.15905 2.5 10 2.5C11.841 2.5 13.3333 3.99238 13.3333 5.83333Z" stroke="#8EA087" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const MailIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M2.5 5.83333L8.83167 10.2658C9.5312 10.7556 10.4688 10.7556 11.1683 10.2658L17.5 5.83333M4.16667 16.6667H15.8333C16.7538 16.6667 17.5 15.9205 17.5 15V5C17.5 4.0795 16.7538 3.33333 15.8333 3.33333H4.16667C3.24619 3.33333 2.5 4.0795 2.5 5V15C2.5 15.9205 3.24619 16.6667 4.16667 16.6667Z" stroke="#8EA087" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const LockIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M15 8.33333V5.83333C15 3.07191 12.7614 0.833333 10 0.833333C7.23858 0.833333 5 3.07191 5 5.83333V8.33333M5 8.33333C3.61929 8.33333 2.5 9.45262 2.5 10.8333V15.8333C2.5 17.214 3.61929 18.3333 5 18.3333H15C16.3807 18.3333 17.5 17.214 17.5 15.8333V10.8333C17.5 9.45262 16.3807 8.33333 15 8.33333H5ZM10 12.5V14.1667M10 14.1667V12.5Z" stroke="#8EA087" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const EyeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M1 10C1 10 4.18182 3.63636 10 3.63636C15.8182 3.63636 19 10 19 10C19 10 15.8182 16.3636 10 16.3636C4.18182 16.3636 1 10 1 10Z" stroke="#8EA087" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M10 12.7273C11.5062 12.7273 12.7273 11.5062 12.7273 10C12.7273 8.49383 11.5062 7.27273 10 7.27273C8.49383 7.27273 7.27273 8.49383 7.27273 10C7.27273 11.5062 8.49383 12.7273 10 12.7273Z" stroke="#8EA087" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const CheckIcon = () => (
    <svg width="12" height="9" viewBox="0 0 12 9" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M1.33334 4L4.83334 7.5L10.6667 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);

const LargeLockIcon = () => (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M24 30V34M12 42H36C38.2077 42 40 40.2077 40 38V26C40 23.7923 38.2077 22 36 22H12C9.79234 22 8 23.7923 8 26V38C8 40.2077 9.79234 42 12 42L24 30M44 10V14C44 9.58468 40.4153 6 36 6C31.5847 6 28 9.58468 28 14V22H44V10" stroke="#8EA087" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);

const FeatureShieldIcon = () => (
    <svg width="24" height="32" viewBox="0 0 24 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <g clipPath="url(#clip0_273_1276)">
            <path d="M9 12.0003L11 14.0003L15 10.0003M20.618 5.98434C17.4561 6.15225 14.3567 5.05895 12 2.94434C9.64327 5.05895 6.5439 6.15225 3.382 5.98434C3.12754 6.96945 2.99918 7.98289 3 9.00034C3 14.5913 6.824 19.2903 12 20.6223C17.176 19.2903 21 14.5923 21 9.00034C21 7.95834 20.867 6.94834 20.618 5.98434L9 12.0003" stroke="#8EA087" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </g>
        <defs>
            <clipPath id="clip0_273_1276">
                <rect width="24" height="24" fill="white"/>
            </clipPath>
        </defs>
    </svg>  
);

const FeatureAnonIcon = () => (
    <svg width="25" height="16" viewBox="0 0 25 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M3.87086 0.365234L19.3709 14.8652M0.870865 7.86523C10.3709 0.865176 15.3709 0.865294 23.8709 7.86523C15.727 14.4258 10.7271 14.4317 0.870865 7.86523Z" stroke="#D1B698" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);

// ==========================================
// 2. SUB-KOMPONEN LAYOUT (HEADER, FOOTER, FORM)
// ==========================================

const Header = () => (
  <header className="h-[80px] bg-[#F7F3ED] border-b border-[#D0D5CB] flex items-center justify-between px-[48px] sticky top-0 z-50">
    <div className="flex items-center gap-3">
      <div className="w-[40px] h-[40px] bg-[#193C1F] rounded-[8px] flex items-center justify-center">
        <LogoIcon />
      </div>
      <span className="text-[24px] font-bold text-[#193C1F]">CareConnect</span>
    </div>
    <button className="flex items-center gap-2.5 px-[24px] py-[10px] rounded-[10px] border-2 border-[#D0D5CB] bg-white hover:bg-gray-50 transition-colors">
      <HelpIcon />
      <span className="text-[16px] font-bold text-[#193C1F]">Help Center</span>
    </button>
  </header>
);

const Footer = () => {
    const links = ["Privacy Guide", "Community Standards", "Contact"];
    return (
        <footer className="h-[64px] bg-[#F7F3ED] border-t border-[#D0D5CB] flex items-center justify-between px-[48px] opacity-60 text-[#193C1F] text-[12px]">
            <p>© 2026 CareConnect. Supporting resilience and safety.</p>
            <nav className="flex gap-[32px]">
                {links.map(link => (
                    <a key={link} href="#" className="hover:underline no-underline text-[#193C1F]">{link}</a>
                ))}
            </nav>
        </footer>
    );
};

const FeatureCard = ({ Icon, text }: { Icon: React.ElementType, text: string }) => (
    <div className="flex-1 h-[90px] bg-[#F7F3ED] border border-[#D0D5CB] rounded-[12px] flex flex-col items-center justify-center gap-2 p-4 text-center">
        <Icon />
        <span className="text-[14px] font-bold text-[#193C1F] leading-[20px]">{text}</span>
    </div>
);

const InputField = ({ Icon, ...props }: any) => (
  <div className="relative w-full">
    <span className="absolute left-[16px] top-1/2 -translate-y-1/2">
      <Icon />
    </span>
    <input
      {...props}
      className="w-full h-[48px] pl-[48px] pr-[16px] bg-white border border-[#D0D5CB] rounded-[12px] text-[16px] text-[#193C1F] placeholder:text-[#8EA087] outline-none focus:border-[#8EA087] focus:ring-1 focus:ring-[#8EA087] transition-all"
    />
  </div>
);

// ==========================================
// 3. MAIN COMPONENT (LOGIN PAGE)
// ==========================================

export default function LoginPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"login" | "register">("register");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.SubmitEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (activeTab === "register") {
      const { data, error } = await authClient.signUp.email({
        name,
        email,
        password,
      });

    console.log("Register data:", data);
    console.log("Register error:", error);

      if (error) {
        setError(error.message ?? "Registration Failed.");
      } else {
        router.push("/dashboard");
      }
    } else {
      const { error } = await authClient.signIn.email({
        email,
        password,
      });

      if (error) {
        setError(error.message ?? "Login failed.");
      } else {
        router.push("/dashboard");
      }
    }

    setLoading(false);
  };

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Header />

      <main className="flex-1 flex fade-in">
        {/* SISI KIRI (INFO PANEL) */}
        <div className="w-[50%] bg-[#EDE4D8] flex flex-col items-center justify-center p-[64px] relative overflow-hidden">
            {/* Dekorasi Bulat Palsu (Anima style) */}
            <div className="absolute w-[600px] h-[600px] rounded-full bg-[#F7F3ED] opacity-60 top-[-150px] right-[-100px]" />
            <div className="absolute w-[500px] h-[500px] rounded-full bg-[#F7F3ED] opacity-40 bottom-[-200px] left-[-150px]" />

            <div className="relative z-10 flex flex-col items-center max-w-[450px]">
                <div className="w-[96px] h-[96px] bg-[#F7F3ED] rounded-full flex items-center justify-center shadow-sm mb-[40px]">
                    <LargeLockIcon />
                </div>
                
                <h1 className="text-[40px] font-bold text-[#193C1F] text-center leading-[48px] mb-[24px]">
                    Your privacy is our priority
                </h1>
                
                <p className="text-[18px] text-[#193C1F] text-center leading-[28px] opacity-80 mb-[40px]">
                    We provide a safe, encrypted environment for everyone. Choose to remain anonymous while receiving the support you need.
                </p>
                
                <div className="flex gap-[24px] w-full">
                    <FeatureCard Icon={FeatureShieldIcon} text="End-to-End Encrypted" />
                    <FeatureCard Icon={FeatureAnonIcon} text="Anonymous Options" />
                </div>
            </div>
        </div>

        {/* SISI KANAN (FORM PANEL) */}
        <div className="w-[50%] flex flex-col items-center justify-center p-[64px] bg-white animate-fade-up">
          <div className="w-full max-w-[400px]">
            {/* TAB SWITCHER */}
            <div className="flex border-b border-[#D0D5CB] mb-[48px] relative h-[56px]">
              <button
                onClick={() => {setActiveTab("login"); setError("");}}
                className={`flex-1 flex justify-center items-center font-bold text-[18px] transition-all duration-300 ${activeTab === "login" ? "text-[#193C1F]" : "text-[#8EA087] opacity-60"}`}
              >
                Login
              </button>
              <button
                onClick={() => {setActiveTab("register"); setError("");}}
                className={`flex-1 flex justify-center items-center font-bold text-[18px] transition-all duration-300 ${activeTab === "register" ? "text-[#193C1F]" : "text-[#8EA087] opacity-60"}`}
              >
                Register
              </button>
              {/* Garis Bawah Aktif Dinamis */}
              <div 
                className={`absolute bottom-0 h-[4px] bg-[#8EA087] transition-all duration-300 rounded-t-full`}
                style={{ 
                    width: '50%', 
                    left: activeTab === 'login' ? '0%' : '50%' 
                }}
              />
            </div>

            {/* FORM FIELDS */}
            <form className="space-y-[24px]" onSubmit={handleSubmit}>
              
              {/* Email untuk login, username untuk register */}
              <div className="space-y-[8px] animate-fade-in" key={`auth-field-${activeTab}`}>
                <label className="text-[14px] font-bold text-[#193C1F]">
                  {activeTab === "login" ? "Email Address" : "Username"}
                </label>
                <InputField
                  Icon={activeTab === "login" ? MailIcon : UserIcon}
                  type={activeTab === "login" ? "email" : "text"}
                  placeholder={activeTab === "login" ? "name@example.com" : "Choose a username"}
                  value={activeTab === "login" ? email : name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    activeTab === "login" ? setEmail(e.target.value) : setName(e.target.value)
                  }
                />
              </div>

              {/* Email tambahan hanya di register */}
              {activeTab === "register" && (
                <div className="space-y-[8px] animate-fade-in">
                  <label className="text-[14px] font-bold text-[#193C1F]">Email Address</label>
                  <InputField
                    Icon={MailIcon}
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                  />
                </div>
              )}

              {/* Password (Selalu Ada) */}
              <div className="space-y-[8px] relative">
                <label className="text-[14px] font-bold text-[#193C1F]">Password</label>
                <InputField 
                Icon={LockIcon} 
                type={showPassword ? "text" : "password"} 
                placeholder="••••••••" 
                value={password}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-[16px] top-[40px] opacity-70 hover:opacity-100"
                >
                  <EyeIcon />
                </button>
              </div>

              {/* Error message */}
              {error && (
                <p className="text-red-500 text-[14px] text-center">{error}</p>
              )}

              {/* Submit Button */}
              <button 
                type="submit" 
                disabled={loading}
                className="w-full h-[56px] bg-[#9BB095] hover:bg-[#8EA087] disabled:opacity-60 text-white rounded-[12px] text-[18px] font-bold shadow-sm active:scale-[0.99] transition-all mt-[16px]"              >
                {loading
                  ? "Loading..."
                  : activeTab === "register"
                  ? "Create Account"
                  : "Login"}
              </button>

              {/* Footer Text */}
              <p className="text-center text-[12px] text-[#193C1F] opacity-60 leading-[20px]">
                By {activeTab === "register" ? "registering" : "logging in"}, you agree to our{" "}
                <a href="#" className="text-[#D1B698] underline hover:text-[#c4a685]">Terms of Service</a> and <a href="#" className="text-[#D1B698] underline hover:text-[#c4a685]">Privacy Policy</a>.
              </p>
            </form>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}