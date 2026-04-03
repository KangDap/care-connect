// src/app/loginRegister.tsx
"use client";

import React, { useState } from "react";
import image from "./image.svg";
import vector2 from "./vector-2.svg";
import vector3 from "./vector-3.svg";
import vector4 from "./vector-4.svg";
import vector5 from "./vector-5.svg";
import vector6 from "./vector-6.svg";
import vector7 from "./vector-7.svg";
import vector8 from "./vector-8.svg";

const Logo = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path 
      d="M7.5 9.99979L9.16667 11.6665L12.5 8.33312M17.1817 4.98646C14.5468 5.12639 11.9639 4.2153 10 2.45312C8.03606 4.2153 5.45325 5.12639 2.81834 4.98646C2.60628 5.80739 2.49931 6.65192 2.5 7.49979C2.5 12.159 5.68667 16.0748 10 17.1848C14.3133 16.0748 17.5 12.1598 17.5 7.49979C17.5 6.63146 17.3892 5.78979 17.1817 4.98646L7.5 9.99979" 
      stroke="#F7F3ED" 
      strokeWidth="1.66667" // Diganti ke camelCase
      strokeLinecap="round" // Diganti ke camelCase
      strokeLinejoin="round" // Diganti ke camelCase
    />
  </svg>
);

// --- Salin isi dari CareConnectHeaderSection.tsx ke sini ---
const CareConnectHeaderSection = () => {
  return (
    <header className="h-20 items-center justify-between pl-12 pr-[47.99px] py-0 bg-[#f7f3ed] border-b [border-bottom-style:solid] border-[#d0d5cb] flex relative self-stretch w-full">
      <div className="inline-flex items-center gap-2 relative flex-[0_0_auto]">
        <div className="inline-flex items-center gap-2 relative">
            <div className="flex w-8 h-8 items-center justify-center relative bg-[#193c1f] rounded-md">
                <Logo /> 
            </div>
        </div>

        <div className="inline-flex flex-col items-start relative flex-[0_0_auto]">
          <div className="relative flex items-center w-[149.5px] h-8 mt-[-1.00px] [font-family:'Nimbus_Sans-Bold',Helvetica] font-bold text-[#193c1f] text-2xl tracking-[0] leading-8 whitespace-nowrap">
            CareConnect
          </div>
        </div>
      </div>

      <button className="all-[unset] box-border inline-flex flex-col items-center justify-center px-6 py-2 relative flex-[0_0_auto] rounded-lg border-2 border-solid border-[#8ea087] cursor-pointer">
        <div className="flex items-center justify-center w-[89.88px] h-6 [font-family:'Nimbus_Sans-Bold',Helvetica] font-bold text-[#193c1f] text-base text-center leading-6 whitespace-nowrap relative tracking-[0]">
          Help Center
        </div>
      </button>
    </header>
  );
};

// --- Salin isi dari SecureRegistrationSection.tsx ke sini ---
const SecureRegistrationSection = () => {    
    const links = [
        { label: "Privacy Guide", width: "w-[74.42px]" },
        { label: "Community Standards", width: "w-[118.75px]" },
        { label: "Contact", width: "w-[41.41px]" },
    ];
    return (
        <footer className="flex items-center justify-between px-12 py-6 relative self-stretch w-full flex-[0_0_auto] bg-[#f7f3ed] border-t [border-top-style:solid] [border-right-style:none] [border-bottom-style:none] [border-left-style:none] border-[#d0d5cb] opacity-60">
            <div className="inline-flex flex-col items-start relative flex-[0_0_auto]">
                <p className="flex items-center w-[292.47px] h-4 mt-[-1.00px] [font-family:'Nimbus_Sans-Regular',Helvetica] font-normal text-[#193c1f] text-xs leading-4 whitespace-nowrap relative tracking-[0]">
                    © 2024 CareConnect. Supporting resilience and safety.
                </p>
            </div>

            <nav className="inline-flex items-start gap-8 relative flex-[0_0_auto]">
                {links.map((link) => (
                <div
                    key={link.label}
                    className="inline-flex flex-col items-start relative self-stretch flex-[0_0_auto]"
                >
                    <a
                        href="#"
                        className={`flex items-center ${link.width} h-4 mt-[-1.00px] [font-family:'Nimbus_Sans-Regular',Helvetica] font-normal text-[#193c1f] text-xs leading-4 whitespace-nowrap relative tracking-[0] no-underline`}
                    >
                        {link.label}
                    </a>
                </div>
            ))}
            </nav>
        </footer>
    );
};

// --- Salin isi dari LegalFooterSection.tsx ke sini ---
const LegalFooterSection = () => {
  const [activeTab, setActiveTab] = useState<"login" | "register">("register");
  const [showPassword, setShowPassword] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
  };

  return (
    <div className="items-start flex-[0_0_auto] flex relative self-stretch w-full">
      <div className="flex flex-col w-[576px] items-center justify-center p-16 relative self-stretch bg-[#ede4d8] overflow-hidden">
        <div className="absolute w-[66.67%] h-[43.69%] top-[-10.00%] left-[43.33%] bg-[#f7f3ed] rounded-full opacity-60" />

        <div className="absolute w-[86.81%] h-[56.88%] top-[58.12%] left-[-15.00%] bg-[#f7f3ed] rounded-full opacity-40" />

        <div className="inline-flex flex-col items-center relative flex-[0_0_auto]">
          <div className="flex flex-col w-24 h-[136px] items-start pt-0 pb-10 px-0 relative">
            <div className="flex w-24 h-24 items-center justify-center relative bg-[#f7f3ed] rounded-full shadow-[0px_1px_2px_#0000000d]">
              <div className="relative w-12 h-12">
                <img
                  className="absolute w-[87.50%] h-[91.67%] top-[8.33%] left-[12.50%]"
                  alt="Vector"
                  src={image}
                />
              </div>
            </div>
          </div>

          <div className="items-start pt-0 pb-6 px-0 inline-flex flex-col relative flex-[0_0_auto]">
            <div className="items-center pl-[62.91px] pr-[62.92px] py-0 inline-flex flex-col relative flex-[0_0_auto]">
              <div className="w-[322.17px] h-20 mt-[-1.00px] [font-family:'Nimbus_Sans-Bold',Helvetica] font-bold text-[#193c1f] text-4xl text-center leading-10 relative tracking-[0]">
                Your privacy is our
                <br />
                priority
              </div>
            </div>
          </div>

          <div className="relative max-w-md w-[448px] h-[135.75px]">
            <div className="inline-flex flex-col max-w-md items-center px-[1.44px] py-0 relative -top-px opacity-80">
              <p className="w-[445.12px] h-[88px] mt-[-1.00px] [font-family:'Nimbus_Sans-Regular',Helvetica] font-normal text-[#193c1f] text-lg text-center leading-[29.2px] relative tracking-[0]">
                We provide a safe, encrypted environment for everyone.
                <br />
                Choose to remain anonymous while receiving the
                <br />
                support you need.
              </p>
            </div>
          </div>

          <div className="flex max-w-md items-start justify-center gap-6 relative w-full flex-[0_0_auto]">
            <div className="flex flex-col items-center justify-center p-5 relative flex-1 self-stretch grow bg-[#f7f3edcc] rounded-xl border border-solid border-[#d0d5cb]">
              <div className="flex flex-col w-6 h-8 items-start pt-0 pb-2 px-0 relative">
                <div className="flex flex-col w-6 h-6 items-center justify-center relative">
                  <div className="relative w-6 h-6">
                    <img
                      className="absolute w-[91.67%] h-[91.90%] top-[8.10%] left-[8.33%]"
                      alt="Vector"
                      src={vector2}
                    />
                  </div>
                </div>
              </div>

              <div className="inline-flex flex-col items-center relative flex-[0_0_auto]">
                <div className="flex items-center justify-center w-[147.92px] h-5 mt-[-1.00px] [font-family:'Nimbus_Sans-Bold',Helvetica] font-bold text-[#193c1f] text-sm text-center leading-5 whitespace-nowrap relative tracking-[0]">
                  End-to-End Encrypted
                </div>
              </div>
            </div>

            <div className="flex flex-col items-center justify-center p-5 relative flex-1 self-stretch grow bg-[#f7f3edcc] rounded-xl border border-solid border-[#d0d5cb]">
              <div className="flex flex-col w-6 h-8 items-start pt-0 pb-2 px-0 relative">
                <div className="flex flex-col w-6 h-6 items-center justify-center relative">
                  <div className="relative w-6 h-6">
                    <img
                      className="absolute w-[93.93%] h-[91.67%] top-[8.33%] left-[6.07%]"
                      alt="Vector"
                      src={vector3}
                    />
                  </div>
                </div>
              </div>

              <div className="inline-flex flex-col items-center relative flex-[0_0_auto]">
                <div className="flex items-center justify-center w-[137.28px] h-5 mt-[-1.00px] [font-family:'Nimbus_Sans-Bold',Helvetica] font-bold text-[#193c1f] text-sm text-center leading-5 whitespace-nowrap relative tracking-[0]">
                  Anonymous Options
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col w-[704px] items-center justify-center p-16 relative self-stretch">
        <div className="relative max-w-md w-[448px] h-[745px]">
          <div className="flex w-full items-start justify-center absolute top-0 left-0 border-b [border-bottom-style:solid] border-[#d0d5cb]">
            <button
              className={`all-[unset] box-border flex flex-col items-center justify-center px-0 py-4 relative flex-1 grow cursor-pointer ${activeTab === "login" ? "" : "opacity-60"}`}
              onClick={() => setActiveTab("login")}
              type="button"
              aria-selected={activeTab === "login"}
            >
              <div className="flex items-center justify-center w-[43.39px] h-6 mt-[-1.00px] [font-family:'Nimbus_Sans-Bold',Helvetica] font-bold text-[#193c1f] text-base text-center leading-6 whitespace-nowrap relative tracking-[0]">
                Login
              </div>
              {activeTab === "login" && (
                <div className="absolute w-full left-0 bottom-0 h-1 bg-[#8ea087]" />
              )}
            </button>

            <button
              className={`all-[unset] box-border flex flex-col items-center justify-center px-0 py-4 relative flex-1 grow cursor-pointer ${activeTab === "register" ? "" : "opacity-60"}`}
              onClick={() => setActiveTab("register")}
              type="button"
              aria-selected={activeTab === "register"}
            >
              <div className="flex items-center justify-center w-[63.95px] h-6 mt-[-1.00px] [font-family:'Nimbus_Sans-Bold',Helvetica] font-bold text-[#193c1f] text-base text-center leading-6 whitespace-nowrap relative tracking-[0]">
                Register
              </div>
              {activeTab === "register" && (
                <div className="absolute w-full left-0 bottom-0 h-1 bg-[#8ea087]" />
              )}
            </button>
          </div>

          <form
            onSubmit={handleSubmit}
            className="flex flex-col w-full items-start gap-3 absolute top-[97px] left-0"
          >
            <div className="flex flex-col w-[448px] items-start gap-6 pt-9 pb-0 px-0 relative flex-[0_0_auto]">
              <div className="flex flex-col items-start gap-2 relative self-stretch w-full flex-[0_0_auto]">
                <div className="flex flex-col items-start relative self-stretch w-full flex-[0_0_auto]">
                  <label
                    className="relative flex items-center self-stretch mt-[-1.00px] [font-family:'Nimbus_Sans-Bold',Helvetica] font-bold text-[#193c1f] text-sm tracking-[0] leading-5"
                    htmlFor="username"
                  >
                    Username
                  </label>
                </div>

                <div className="flex flex-col items-start relative self-stretch w-full flex-[0_0_auto]">
                  <div className="flex items-start justify-center pl-12 pr-4 pt-[15px] pb-3.5 relative self-stretch w-full flex-[0_0_auto] bg-white rounded-xl overflow-hidden border border-solid border-[#d0d5cb]">
                    <input
                      className="pt-px pb-0.5 px-0 relative grow border-[none] [background:none] self-stretch mt-[-1.00px] [font-family:'Nimbus_Sans-Regular',Helvetica] font-normal text-gray-500 text-base tracking-[0] leading-[normal] outline-none"
                      id="username"
                      placeholder="Choose a username"
                      type="text"
                      value={formData.username}
                      onChange={handleInputChange}
                      autoComplete="username"
                    />
                  </div>

                  <div className="inline-flex flex-col h-[40.00%] items-start absolute top-[30.00%] left-4">
                    <div className="relative w-5 h-5">
                      <img
                        className="absolute w-[83.33%] h-[91.67%] top-[8.33%] left-[16.67%]"
                        alt="Vector"
                        src={vector4}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-start gap-2 relative self-stretch w-full flex-[0_0_auto]">
                <div className="flex self-stretch w-full flex-col items-start relative flex-[0_0_auto]">
                  <label
                    className="relative flex items-center self-stretch mt-[-1.00px] [font-family:'Nimbus_Sans-Bold',Helvetica] font-bold text-[#193c1f] text-sm tracking-[0] leading-5"
                    htmlFor="email"
                  >
                    Email Address
                  </label>
                </div>

                <div className="flex flex-col items-start relative self-stretch w-full flex-[0_0_auto]">
                  <div className="flex items-start justify-center pl-12 pr-4 pt-[15px] pb-3.5 relative self-stretch w-full flex-[0_0_auto] bg-white rounded-xl overflow-hidden border border-solid border-[#d0d5cb]">
                    <input
                      className="pt-px pb-0.5 px-0 relative grow border-[none] [background:none] self-stretch mt-[-1.00px] [font-family:'Nimbus_Sans-Regular',Helvetica] font-normal text-gray-500 text-base tracking-[0] leading-[normal] outline-none"
                      id="email"
                      placeholder="name@example.com"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      autoComplete="email"
                    />
                  </div>

                  <div className="inline-flex flex-col h-[40.00%] items-start absolute top-[30.00%] left-4">
                    <div className="relative w-5 h-5">
                      <img
                        className="absolute w-[91.67%] h-[83.33%] top-[16.67%] left-[8.33%]"
                        alt="Vector"
                        src={vector5}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-start gap-2 relative self-stretch w-full flex-[0_0_auto]">
                <div className="flex self-stretch w-full flex-col items-start relative flex-[0_0_auto]">
                  <label
                    className="relative flex items-center self-stretch mt-[-1.00px] [font-family:'Nimbus_Sans-Bold',Helvetica] font-bold text-[#193c1f] text-sm tracking-[0] leading-5"
                    htmlFor="password"
                  >
                    Password
                  </label>
                </div>

                <div className="flex flex-col items-start relative self-stretch w-full flex-[0_0_auto]">
                  <div className="flex items-start justify-center pt-[15px] pb-3.5 px-12 self-stretch w-full flex-[0_0_auto] rounded-xl overflow-hidden relative bg-white border border-solid border-[#d0d5cb]">
                    <input
                      className="pt-px pb-0.5 px-0 relative grow border-[none] [background:none] self-stretch mt-[-1.00px] [font-family:'Nimbus_Sans-Regular',Helvetica] font-normal text-gray-500 text-base tracking-[0] leading-[normal] outline-none"
                      id="password"
                      placeholder="••••••••"
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={handleInputChange}
                      autoComplete="new-password"
                    />
                  </div>

                  <div className="inline-flex flex-col h-[40.00%] items-start absolute top-[30.00%] left-4">
                    <div className="relative w-5 h-5">
                      <img
                        className="absolute w-[87.50%] h-[91.67%] top-[8.33%] left-[12.50%]"
                        alt="Vector"
                        src={vector6}
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="inline-flex flex-col h-[40.00%] items-start absolute top-[30.00%] right-4 cursor-pointer bg-transparent border-none p-0"
                  >
                    <div className="relative w-5 h-5">
                      <img
                        className="absolute w-[66.67%] h-[66.67%] top-[33.33%] left-[33.33%]"
                        alt="Vector"
                        src={vector7}
                      />

                      <img
                        className="absolute w-[93.93%] h-[83.33%] top-[16.67%] left-[6.07%]"
                        alt="Vector"
                        src={vector8}
                      />
                    </div>
                  </button>
                </div>
              </div>

              <div
                className="flex items-start gap-4 p-6 relative self-stretch w-full flex-[0_0_auto] bg-[#f7f3ed80] rounded-xl border border-solid border-[#d0d5cb] cursor-pointer"
                onClick={() => setIsAnonymous((prev) => !prev)}
                role="checkbox"
                aria-checked={isAnonymous}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === " " || e.key === "Enter") {
                    e.preventDefault();
                    setIsAnonymous((prev) => !prev);
                  }
                }}
              >
                <div className="flex flex-col w-5 h-6 items-start pt-1 pb-0 px-0 relative">
                  <div
                    className={`w-5 h-5 rounded relative border border-solid border-[#d0d5cb] flex items-center justify-center ${isAnonymous ? "bg-[#8ea087]" : "bg-white"}`}
                  >
                    {isAnonymous && (
                      <svg
                        width="12"
                        height="9"
                        viewBox="0 0 12 9"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M1 4L4.5 7.5L11 1"
                          stroke="white"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </div>
                </div>

                <div className="inline-flex gap-1 flex-col items-start relative flex-[0_0_auto]">
                  <div className="flex flex-col items-start relative self-stretch w-full flex-[0_0_auto]">
                    <div className="flex items-center w-[173.8px] h-6 mt-[-1.00px] [font-family:'Nimbus_Sans-Bold',Helvetica] font-bold text-[#193c1f] text-base leading-6 whitespace-nowrap relative tracking-[0]">
                      Register Anonymously
                    </div>
                  </div>

                  <div className="flex flex-col items-start relative self-stretch w-full flex-[0_0_auto] opacity-60">
                    <p className="flex items-center w-[235.56px] h-4 mt-[-1.00px] [font-family:'Nimbus_Sans-Regular',Helvetica] font-normal text-[#193c1f] text-xs leading-4 whitespace-nowrap relative tracking-[0]">
                      Your identity will be hidden from other users.
                    </p>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="flex items-center justify-center px-0 py-4 relative self-stretch flex-[0_0_auto] bg-[#8ea087] w-full rounded-xl cursor-pointer border-none"
              >
                <div className="absolute h-full top-0 left-0 bg-[#ffffff01] shadow-[0px_4px_6px_-4px_#8ea08733,0px_10px_15px_-3px_#8ea08733] w-full rounded-xl" />

                <div className="flex items-center justify-center w-[118.06px] h-6 mt-[-1.00px] [font-family:'Nimbus_Sans-Bold',Helvetica] font-bold text-white text-base text-center leading-6 whitespace-nowrap relative tracking-[0]">
                  Create Account
                </div>
              </button>

              <div className="flex flex-col items-center relative self-stretch w-full flex-[0_0_auto] opacity-60">
                <p className="flex items-center justify-center w-[362.58px] h-4 mt-[-1.00px] [font-family:'Nimbus_Sans-Regular',Helvetica] font-normal text-transparent text-xs text-center leading-3 relative tracking-[0]">
                  <span className="text-[#193c1f] leading-4">
                    By registering, you agree to our{" "}
                  </span>

                  <a href="#" className="text-[#d1b698] underline">
                    Terms of Service
                  </a>

                  <span className="text-[#193c1f] leading-4"> and </span>

                  <a href="#" className="text-[#d1b698] underline">
                    Privacy Policy
                  </a>

                  <span className="text-[#193c1f] leading-4">.</span>
                </p>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default function LoginRegister() {
  return (
    <div className="flex flex-col min-h-screen bg-[#f7f3ed]">
      <CareConnectHeaderSection />
      <main className="flex-1 flex flex-col items-center justify-center">
        {/* Form & Privacy Section */}
        <LegalFooterSection /> 
      </main>
      {/* Footer link (Privacy Guide, etc) */}
      <SecureRegistrationSection /> 
    </div>
  );
}