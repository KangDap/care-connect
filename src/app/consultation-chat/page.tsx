'use client';

import { Alert } from '@/components/alert';
import { Header } from '@/components/header';
import { authClient } from '@/lib/auth/auth-client';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';

export default function ConsultationChatContent() {
  const router = useRouter();
  const [isLogoutAlertOpen, setIsLogoutAlertOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await authClient.signOut();
    router.replace('/login');
    router.refresh();
  };

  const { data: session, isPending } = authClient.useSession();

  useEffect(() => {
    if (!isPending && !session?.user) {
      router.push('/login');
    }
  }, [isPending, session, router]);

  if (isPending || !session?.user) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#F7F3ED]">
        <p className="text-[#193C1F] font-semibold text-lg animate-pulse">
          Loading chat...
        </p>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-[#F7F3ED] text-[#193C1F] font-sans">
      <style
        dangerouslySetInnerHTML={{
          __html: `
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #D0D5CB; border-radius: 10px; }
      `,
        }}
      />

      <div className="sticky top-0 z-[100] w-full bg-[#F7F3ED]/80 backdrop-blur-md border-b border-[#D0D5CB]/30">
        <Header
          withSearch={false}
          withLogo={true}
          onLogoutClick={() => setIsLogoutAlertOpen(true)}
        />
      </div>

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-80 flex flex-col border-r border-[#D0D5CB] bg-[#F7F3ED] shrink-0">
          <div className="p-4 shrink-0">
            <h2 className="text-lg font-bold text-[#193C1F]">
              Active Consultations
            </h2>
            <p className="text-xs text-[#193C1F] opacity-60">
              4 ongoing sessions today
            </p>
          </div>
          <div className="flex-1 overflow-y-auto px-2 space-y-1">
            <div className="bg-[#D0D5CB] rounded-xl p-3 flex items-start space-x-3 cursor-pointer transition">
              <div className="relative">
                <Image
                  alt="Sarah Miller"
                  width={40}
                  height={40}
                  className="w-10 h-10 rounded-full object-cover"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuDugteAPQrThF-mQjNXE0jfBgPK9JnRy73Q1Ta5IrlcWbLQcT1gZVfcJJ0oD4z_xziTpprD83qQ8IkckRXVGjVUcCRpb_noP_oN3ZThCdMoZI6KwzXp2FFBSYfndqvk-ExSDhEAGK7QfyZdl-zh9tfeGo3aRfJ6yq2paJBzAWov3hCcD7BlF_o1pYWQmn3x_fadtg32eduNcPlEQSBeDlRhjti5XyWDnW5X73mq_ywubewKoh-l9OmcCNXBz9mxdh9dOnk6LETwkg"
                  unoptimized
                />
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-[#D0D5CB] rounded-full"></span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline">
                  <h3 className="text-sm font-semibold text-[#193C1F] truncate">
                    Dr. Sarah Miller
                  </h3>
                  <span className="text-[10px] text-[#193C1F] opacity-60">
                    2m
                  </span>
                </div>
                <p className="text-xs text-[#193C1F] opacity-70 truncate">
                  I&apos;ve been trying the breathing...
                </p>
              </div>
            </div>

            <div className="hover:bg-[#EDE4D8] rounded-xl p-3 flex items-start space-x-3 cursor-pointer transition">
              <Image
                alt="James Wilson"
                width={40}
                height={40}
                className="w-10 h-10 rounded-full object-cover"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuA9v7BuFN6ZV9r0xamxwnpT8OvWevWt_8MRSDqaohy0T4H4GZWkiEb7JfthoJwBRohvMWhiN7xQ0OZenMwo4IozUh2J-cK2YlCygNLAirhfkwvdsNntezi5LPgqw2PKtQzLmr03dux1AZ3uijRhYGxpYYOm6Oaexgqh0ekZ-3_7EwG-Q5gr6hcIpbiPXXRLsgzozNnUBr72V_Vegm2w1qaJeJpuIg7L-op33xHzzu8jOayyd9zRWVJDBudcNsST3y6n1KvUlJNwAw"
                unoptimized
              />
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline">
                  <h3 className="text-sm font-semibold text-[#193C1F] truncate">
                    Dr. James Wilson
                  </h3>
                  <span className="text-[10px] text-[#193C1F] opacity-60">
                    1h
                  </span>
                </div>
                <p className="text-xs text-[#193C1F] opacity-70 truncate">
                  See you at our next scheduled...
                </p>
              </div>
            </div>

            <div className="hover:bg-[#EDE4D8] rounded-xl p-3 flex items-start space-x-3 cursor-pointer transition">
              <Image
                alt="Emma Thompson"
                width={40}
                height={40}
                className="w-10 h-10 rounded-full object-cover"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCzQ4GH4Qn4sG7nBslOzjXXCi9YqZlAlLlH7_R6OstG5Gs7xzvQ7_3Gh1meU05PoHmTszVLk1NADBA7zafLgJ1qg1jWgh2_L1QhXq40NhOg_P0vd0qjoSlLHYU5dsARVAq3BEpnVEZNQxFrIkcIE5mwjxc4VdZVvb-GNeW3i6KLD00b6QaTJpRlUCZ3XetRHkJ4tE3_OtwlwfpOYvKT-W9vNKGztdmuyCjw9662lZAkOByjaPPiDmhDouEQnFT_7IDJRHWL5Cbb3A"
                unoptimized
              />
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline">
                  <h3 className="text-sm font-semibold text-[#193C1F] truncate">
                    Emma Thompson
                  </h3>
                  <span className="text-[10px] text-[#193C1F] opacity-60">
                    3h
                  </span>
                </div>
                <p className="text-xs text-[#193C1F] opacity-70 truncate">
                  The template was very helpful.
                </p>
              </div>
            </div>

            <div className="hover:bg-[#EDE4D8] rounded-xl p-3 flex items-start space-x-3 cursor-pointer transition">
              <Image
                alt="Support Group"
                width={40}
                height={40}
                className="w-10 h-10 rounded-full object-cover"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDftVig_q7FDp7Y2NV48YbLxMI-ROv8hlK2Y6P5gIbLpYoq1sBpZFLknsMO4Yxzm05753OG0Ss1izOmc9k5zATHOUFr7x6XQTCquVV1oEeHexYuLlGH97LK11SW8xrVogw1XZvz0mgV9CojrTJhjQpwv8-G8YEHVlayNP7phWv50NL38-pe-QcduFsXijVdedD2sBVHgns98dJdPWu1xCXCBSwdaUsCYVXgwrmYj3M0WP4U0gNJ3Vy8nku-zbT8k-HUJiKvGunlvA"
                unoptimized
              />
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline">
                  <h3 className="text-sm font-semibold text-[#193C1F] truncate">
                    Support Group: Anxiety
                  </h3>
                  <span className="text-[10px] text-[#193C1F] opacity-60">
                    Yesterday
                  </span>
                </div>
                <p className="text-xs text-[#193C1F] opacity-70 truncate">
                  New resource shared by moderator.
                </p>
              </div>
            </div>
          </div>

          <div className="p-4 border-t border-[#D0D5CB] shrink-0">
            <Link
              href="/consultation"
              className="w-full py-2.5 bg-[#8EA087] text-white font-semibold rounded-xl flex items-center justify-center space-x-2 transition hover:brightness-110 shadow-sm"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  d="M12 4v16m8-8H4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                ></path>
              </svg>
              <span>New Consultation</span>
            </Link>
          </div>
        </aside>

        <main className="flex-1 flex flex-col bg-white min-w-0">
          <section className="flex-1 overflow-y-auto p-6 space-y-8 bg-[#F7F3ED]">
            <div className="flex justify-center">
              <span className="bg-[#D0D5CB] bg-opacity-30 text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full text-[#193C1F] opacity-60">
                Today
              </span>
            </div>

            {/* Received Message */}
            <div className="flex flex-col space-y-1">
              <div className="flex items-center space-x-2 ml-10 mb-1">
                <span className="text-xs font-bold text-[#193C1F] opacity-70">
                  Dr. Sarah Miller
                </span>
              </div>
              <div className="flex items-start space-x-3">
                <Image
                  alt="Sarah Miller Small"
                  width={32}
                  height={32}
                  className="w-8 h-8 rounded-full mt-1 object-cover"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuBTdDZR_tzupTdWP19uhCg8tosRgzmjp3bZlijtWJuem9HpqbpgiL1DH62CVLDNSqnH4si-R3dcAvhj_sTKVT8HFvlm4qEqFydcQG0QNII7oVDbDI8JnEe-AXx9ZmXtwxyUaKWwy6h82H1mFE-Wsmh2JQUhOLm_YxvX5f9nbGXJei-AylWKcQPMlszE18hJsVaoll4yNX44C1k1fJUhot8wR17VSZzgyKM-WZHnvjg2vi1om59n-o1SNJB5BHhRMMmyK86xpP4sQw"
                  unoptimized
                />
                <div className="bg-[#EDE4D8] text-[#193C1F] max-w-xl rounded-2xl rounded-tl-none p-4 text-sm shadow-sm leading-relaxed">
                  Hello Sarah, how have you been feeling since our last session?
                  I noticed you mentioned having a bit of a rough morning in
                  your mood tracker.
                </div>
              </div>
              <span className="text-[10px] text-[#193C1F] opacity-40 ml-11">
                09:12 AM
              </span>
            </div>

            {/* Sent Message */}
            <div className="flex flex-col items-end space-y-1">
              <div className="flex items-center space-x-2 mr-10 mb-1">
                <span className="text-xs font-bold text-[#193C1F] opacity-70">
                  {session?.user?.name || 'Client'}
                </span>
              </div>
              <div className="flex items-start flex-row-reverse">
                <Image
                  alt="User Small"
                  width={32}
                  height={32}
                  className="w-8 h-8 rounded-full mt-1 ml-3 object-cover border border-[#D0D5CB]"
                  src={
                    session?.user?.image ||
                    'https://lh3.googleusercontent.com/aida-public/AB6AXuBEco0p3MDuxX90l9mF4SA0D5WmC84PJazeYS6jFlgGu6Z-L_HxYF4go8gTd7ImSPN8Yg9IYm5nWoKdCW7Azu9bfAq8XhByCCA0h4C3l_yC4OkTfQRzppjGbvuLkHC6-rZVaScgJcjaRYm350CGpQyEHirHU0mOph6TPnQxShR39Kv0qls4iqEaza6VOZncpHcdH6aQXKwLy1R587WGI_FxQ5evlw3n9GBfy59SZ_CAlBuxXdF87MFefAimDan5A6GOVUKeBPYHqA'
                  }
                  unoptimized
                />
                <div className="bg-[#8EA087] text-white max-w-xl rounded-2xl rounded-tr-none p-4 text-sm shadow-sm leading-relaxed">
                  I&apos;ve been trying the breathing exercises we discussed,
                  they help a bit but I still feel quite anxious in the
                  mornings, especially before work.
                </div>
              </div>
              <span className="text-[10px] text-[#193C1F] opacity-40 mr-11">
                09:15 AM
              </span>
            </div>

            {/* Received Message with Attachment */}
            <div className="flex flex-col space-y-1">
              <div className="flex items-center space-x-2 ml-10 mb-1">
                <span className="text-xs font-bold text-[#193C1F] opacity-70">
                  Dr. Sarah Miller
                </span>
              </div>
              <div className="flex items-start space-x-3">
                <Image
                  alt="Sarah Miller Small"
                  width={32}
                  height={32}
                  className="w-8 h-8 rounded-full mt-1 object-cover"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuAftkS-nINGPSfbE9HFt2T_Wdkkqk_5xA_KpEkv1wW2TTgOuZ6r-PtoK0C4wFb16taVwAGzktbCDA97tbbjJ6-dBAiKamOCs04DyBHgGtcy4m9BYNjOL6L_8T5kQFp0IEog211G_8H5BxAaPMhIyUxcHxjhkEw8UkJgasLI2DD-Wdi1ntl-44k6ftuEf5GKSV-TjreOrSf2vBlKufxL8evkAybgjFUbx0IEfvSSf5E0we5gwd-_PN3dSeTk3Syc1sCz_xnjBe6oZw"
                  unoptimized
                />
                <div className="space-y-2 max-w-xl">
                  <div className="bg-[#EDE4D8] text-[#193C1F] rounded-2xl rounded-tl-none p-4 text-sm shadow-sm leading-relaxed">
                    That&apos;s completely normal. Progress takes time.
                    Let&apos;s look at this revised mood tracker template
                    together. It has a specific section for morning grounding.
                  </div>
                  <div className="bg-white border border-[#D0D5CB] rounded-xl p-3 flex items-center justify-between cursor-pointer hover:border-[#8EA087] transition-colors">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-[#8EA087] bg-opacity-20 rounded-lg flex items-center justify-center text-[#8EA087]">
                        <svg
                          className="w-6 h-6"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            clipRule="evenodd"
                            d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
                          ></path>
                        </svg>
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-[#193C1F]">
                          Morning_Grounding_Guide.pdf
                        </h4>
                        <p className="text-[10px] text-[#193C1F] opacity-60">
                          1.2 MB • PDF Document
                        </p>
                      </div>
                    </div>
                    <button className="text-[#193C1F] opacity-60 hover:opacity-100">
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                        ></path>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
              <span className="text-[10px] text-[#193C1F] opacity-40 ml-11">
                09:18 AM
              </span>
            </div>
          </section>

          <footer className="p-6 bg-white border-t border-[#D0D5CB] shrink-0">
            <div className="flex items-center space-x-4">
              <div className="flex-1 relative flex items-center bg-[#F7F3ED] border border-[#D0D5CB] rounded-2xl px-4 py-3 focus-within:border-[#8EA087] focus-within:ring-1 focus-within:ring-[#8EA087] transition-all">
                <button className="text-[#193C1F] opacity-40 hover:opacity-70 mr-3">
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                    ></path>
                  </svg>
                </button>
                <input
                  className="bg-transparent border-none focus:ring-0 text-sm text-[#193C1F] w-full p-0 outline-none"
                  placeholder="Type your message here..."
                  type="text"
                />
                <div className="flex items-center space-x-2 ml-3">
                  <button className="text-[#193C1F] opacity-40 hover:opacity-70 transition-opacity">
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                      ></path>
                    </svg>
                  </button>
                  <button className="text-[#193C1F] opacity-40 hover:opacity-70 transition-opacity">
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                      ></path>
                    </svg>
                  </button>
                </div>
              </div>
              <button className="w-12 h-12 bg-[#8EA087] hover:brightness-110 text-white rounded-2xl flex items-center justify-center transition-transform active:scale-95 shadow-sm shrink-0">
                <svg
                  className="w-6 h-6 transform rotate-90"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"></path>
                </svg>
              </button>
            </div>

            <div className="mt-4 flex justify-center space-x-8">
              <button className="flex items-center space-x-1.5 text-[10px] font-bold uppercase tracking-wider text-[#193C1F] opacity-60 hover:opacity-100 transition-opacity">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                  ></path>
                </svg>
                <span>Schedule Next</span>
              </button>
              <button className="flex items-center space-x-1.5 text-[10px] font-bold uppercase tracking-wider text-[#193C1F] opacity-60 hover:opacity-100 transition-opacity">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                  ></path>
                </svg>
                <span>End Session</span>
              </button>
            </div>
          </footer>
        </main>
      </div>

      <Alert
        isOpen={isLogoutAlertOpen}
        onClose={() => setIsLogoutAlertOpen(false)}
        onConfirm={handleLogout}
        type="danger"
        title="End Session?"
        description="Are you sure you want to log out?"
        confirmText={isLoggingOut ? 'Logging out...' : 'Log Out'}
      />
    </div>
  );
}
