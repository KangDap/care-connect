import React from 'react';
import Link from 'next/link';

const LandingPage = () => {
  return (
    <div className="font-sans antialiased bg-off-white text-deep-green min-h-screen">
      {/* Navigation */}
      <header className="w-full bg-off-white py-6 px-12 flex justify-between items-center border-b border-pale-green-grey">
        <div className="flex items-center gap-2">
          {/* CareConnect Logo */}
          <div className="w-10 h-10 bg-deep-green rounded-lg flex items-center justify-center text-off-white">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.744c0 5.578 4.5 10.13 10.125 10.13 5.625 0 10.125-4.552 10.125-10.13 0-1.494-.273-2.925-.77-4.244a11.959 11.959 0 0 1-8.355-3.212Z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <span className="text-2xl font-bold text-deep-green">CareConnect</span>
        </div>
        
        <nav className="flex items-center gap-12 text-deep-green font-medium">
          <Link className="hover:text-muted-green transition-colors" href="/landingPage">Home</Link>
          <Link className="hover:text-muted-green transition-colors" href="#">Consultation</Link>
          <Link className="hover:text-muted-green transition-colors" href="#">Reports</Link>
          <Link className="hover:text-muted-green transition-colors" href="#">Forum</Link>
          <Link className="hover:text-muted-green transition-colors" href="/donation">Donation</Link>
        </nav>
        
        <button className="bg-muted-green text-off-white px-8 py-2.5 rounded-lg font-bold hover:bg-deep-green transition-colors">
          <Link href="/login">Login/Profile</Link>
        </button>
      </header>

      {/* Hero Section */}
      <section className="max-w-[1440px] mx-auto py-24 px-12 flex items-center justify-between">
        <div className="w-1/2">
          <h1 className="text-[88px] leading-[1.1] font-black text-deep-green mb-8">
            You are <span className="text-tan">not alone</span>
          </h1>
          <p className="text-xl text-deep-green mb-12">
            Connecting individuals with professional help, reporting resources, and a supportive community to ensure safety and well-being. Your healing starts with a single step.
          </p>
          <div className="flex gap-4">
            <button className="bg-muted-green text-off-white px-10 py-4 rounded-lg font-bold text-lg shadow-sm hover:bg-deep-green transition-colors">
              Consult Now
            </button>
            <button className="bg-pale-green-grey text-deep-green px-10 py-4 rounded-lg font-bold text-lg border border-muted-green hover:bg-light-beige transition-colors">
              Report Incident
            </button>
            <Link href="/donation">
              <button className="bg-off-white text-deep-green px-10 py-4 rounded-lg font-bold text-lg border border-tan hover:bg-light-beige transition-colors h-full">
                Donate
              </button>
            </Link>
          </div>
        </div>
        
        {/* Right side Hero Graphic */}
        <div className="w-[600px] h-[400px] bg-pale-green-grey rounded-3xl flex items-center justify-center text-muted-green">
          <div className="w-32 h-32">
            <svg fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M10.5 19.5h3m-6.75-4.5h10.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-light-beige py-20 px-12">
        <div className="max-w-[1440px] mx-auto grid grid-cols-3 gap-8">
          <div className="bg-off-white p-12 rounded-2xl text-center shadow-sm">
            <p className="text-deep-green font-semibold mb-2 opacity-80">Total Reports Handled</p>
            <h2 className="text-6xl font-black text-deep-green mb-4">1,240</h2>
            <div className="w-16 h-1 bg-muted-green mx-auto rounded-full"></div>
          </div>
          <div className="bg-off-white p-12 rounded-2xl text-center shadow-sm">
            <p className="text-deep-green font-semibold mb-2 opacity-80">Professional Consultations</p>
            <h2 className="text-6xl font-black text-deep-green mb-4">3,500+</h2>
            <div className="w-16 h-1 bg-tan mx-auto rounded-full"></div>
          </div>
          <div className="bg-off-white p-12 rounded-2xl text-center shadow-sm">
            <p className="text-deep-green font-semibold mb-2 opacity-80">Community Donations</p>
            <h2 className="text-6xl font-black text-deep-green mb-4">$50,000</h2>
            <div className="w-16 h-1 bg-muted-green mx-auto rounded-full"></div>
          </div>
        </div>
      </section>

      {/* Support Methods Section */}
      <section className="max-w-[1440px] mx-auto py-32 px-12 text-center">
        <h2 className="text-5xl font-black text-deep-green mb-6">How we support you</h2>
        <p className="text-deep-green max-w-2xl mx-auto mb-20 opacity-80">
          Comprehensive tools designed to provide safety, healing, and community support in a confidential environment.
        </p>
        <div className="grid grid-cols-4 gap-8">
          <div className="bg-off-white p-8 rounded-2xl border border-pale-green-grey text-left shadow-sm flex flex-col items-start gap-4">
            <div className="w-12 h-12 bg-light-beige rounded-lg flex items-center justify-center text-muted-green">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M15.182 15.182a4.5 4.5 0 0 1-6.364 0M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75Zm-.375 0h.008v.015h-.008V9.75Zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75Zm-.375 0h.008v.015h-.008V9.75Z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-deep-green">Consultation</h3>
            <p className="text-deep-green opacity-80">One-on-one sessions with certified mental health professionals.</p>
          </div>
          
          <div className="bg-off-white p-8 rounded-2xl border border-pale-green-grey text-left shadow-sm flex flex-col items-start gap-4">
            <div className="w-12 h-12 bg-light-beige rounded-lg flex items-center justify-center text-muted-green">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 9v3.75m0-10.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.75c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.75h-.152c-3.196 0-6.1-1.249-8.25-3.286Zm0 13.036h.008v.008H12v-.008Z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-deep-green">Reporting</h3>
            <p className="text-deep-green opacity-80">Secure and anonymous incident reporting for community safety.</p>
          </div>
          
          <div className="bg-off-white p-8 rounded-2xl border border-pale-green-grey text-left shadow-sm flex flex-col items-start gap-4">
            <div className="w-12 h-12 bg-light-beige rounded-lg flex items-center justify-center text-muted-green">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-deep-green">Forum</h3>
            <p className="text-deep-green opacity-80">Peer-led discussions and shared experiences in a moderated space.</p>
          </div>
          
          <div className="bg-off-white p-8 rounded-2xl border border-pale-green-grey text-left shadow-sm flex flex-col items-start gap-4">
            <div className="w-12 h-12 bg-light-beige rounded-lg flex items-center justify-center text-muted-green">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M21 11.25v8.25a1.5 1.5 0 0 1-1.5 1.5H4.5a1.5 1.5 0 0 1-1.5-1.5v-8.25m18 0-9-6.75-9 6.75m18 0V4.5a1.5 1.5 0 0 0-1.5-1.5H4.5A1.5 1.5 0 0 0 3 4.5v6.75m18 0-9 6.75-9-6.75" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-deep-green">Donation</h3>
            <p className="text-deep-green opacity-80">Fund mental health initiatives and support those in need.</p>
          </div>
        </div>
      </section>

      {/* Recent Reports Section */}
      <section className="max-w-[1440px] mx-auto py-32 px-12">
        <div className="flex justify-between items-end mb-12">
          <h2 className="text-4xl font-black text-deep-green">Recent Anonymized Reports</h2>
          <a className="text-muted-green font-bold flex items-center gap-2 hover:text-deep-green transition-colors" href="#">
            View Archive
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </a>
        </div>
        
        <div className="grid grid-cols-3 gap-10">
          <div data-purpose="report-card">
            <div className="w-full aspect-video bg-pale-green-grey rounded-2xl mb-6 flex items-center justify-center text-muted-green">
              <svg className="w-12 h-12" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.744c0 5.578 4.5 10.13 10.125 10.13 5.625 0 10.125-4.552 10.125-10.13 0-1.494-.273-2.925-.77-4.244a11.959 11.959 0 0 1-8.355-3.212Z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-deep-green mb-2">Report #882</h3>
            <p className="text-deep-green opacity-80 mb-6">Safety concern regarding workplace harassment addressed and resolved via legal mediation.</p>
            <div className="flex gap-2">
              <span className="bg-light-beige text-muted-green px-3 py-1 rounded text-xs font-bold uppercase tracking-wider">Resolved</span>
              <span className="bg-pale-green-grey text-deep-green px-3 py-1 rounded text-xs font-bold uppercase tracking-wider">Workplace</span>
            </div>
          </div>
          
          <div data-purpose="report-card">
            <div className="w-full aspect-video bg-pale-green-grey rounded-2xl mb-6 flex items-center justify-center text-muted-green">
              <svg className="w-12 h-12" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M15.042 21.672 13.684 16.6m0 0-2.51 2.225.569-9.47 5.227 7.917-3.286-.672ZM12 2.25V4.5m5.834.166-1.591 1.591M21.75 12h-2.25m-.166 5.834-1.591-1.591M12 21.75V19.5m-5.834-.166 1.591-1.591M2.25 12h2.25m.166-5.834 1.591 1.591" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-deep-green mb-2">Report #881</h3>
            <p className="text-deep-green opacity-80 mb-6">Community-led intervention provided temporary housing and support for individual in crisis.</p>
            <div className="flex gap-2">
              <span className="bg-pale-green-grey text-muted-green px-3 py-1 rounded text-xs font-bold uppercase tracking-wider">Active</span>
              <span className="bg-light-beige text-deep-green px-3 py-1 rounded text-xs font-bold uppercase tracking-wider">Housing</span>
            </div>
          </div>
          
          <div data-purpose="report-card">
            <div className="w-full aspect-video bg-pale-green-grey rounded-2xl mb-6 flex items-center justify-center text-muted-green">
              <svg className="w-12 h-12" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-deep-green mb-2">Report #880</h3>
            <p className="text-deep-green opacity-80 mb-6">Emergency mental health consultation provided within 30 minutes of initial report submission.</p>
            <div className="flex gap-2">
              <span className="bg-light-beige text-muted-green px-3 py-1 rounded text-xs font-bold uppercase tracking-wider">Emergency</span>
              <span className="bg-pale-green-grey text-deep-green px-3 py-1 rounded text-xs font-bold uppercase tracking-wider">Crisis</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-off-white pt-24 pb-12 px-12 border-t border-pale-green-grey">
        <div className="max-w-[1440px] mx-auto grid grid-cols-12 gap-12 mb-20">
          <div className="col-span-4">
            <div className="flex items-center gap-2 mb-8">
              <div className="w-8 h-8 bg-pale-green-grey rounded flex items-center justify-center text-deep-green">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.744c0 5.578 4.5 10.13 10.125 10.13 5.625 0 10.125-4.552 10.125-10.13 0-1.494-.273-2.925-.77-4.244a11.959 11.959 0 0 1-8.355-3.212Z" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <span className="text-xl font-bold text-deep-green">CareConnect</span>
            </div>
            <p className="text-deep-green opacity-80 mb-8 max-w-sm">
              HealHub's CareConnect is dedicated to fostering a safe digital ecosystem for mental health and incident reporting.
            </p>
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full border border-pale-green-grey flex items-center justify-center text-deep-green hover:bg-light-beige transition-colors cursor-pointer">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0 0a2.25 2.25 0 1 0 3.935 2.186 2.25 2.25 0 0 0-3.935-2.186Zm0-12.814a2.25 2.25 0 1 0 3.933-2.185 2.25 2.25 0 0 0-3.933 2.185Z" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div className="w-10 h-10 rounded-full border border-pale-green-grey flex items-center justify-center text-deep-green hover:bg-light-beige transition-colors cursor-pointer">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-1.605.42-3.113 1.157-4.418" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>
          </div>
          
          <div className="col-span-4">
            <h4 className="text-xl font-bold text-deep-green mb-8">Resources</h4>
            <ul className="space-y-4 text-deep-green opacity-80">
              <li><a className="hover:text-muted-green transition-colors" href="#">Emergency Help</a></li>
              <li><a className="hover:text-muted-green transition-colors" href="#">FAQ</a></li>
              <li><a className="hover:text-muted-green transition-colors" href="#">Privacy Policy</a></li>
              <li><a className="hover:text-muted-green transition-colors" href="#">Terms of Service</a></li>
            </ul>
          </div>
          
          <div className="col-span-4">
            <h4 className="text-xl font-bold text-deep-green mb-8">Contact</h4>
            <ul className="space-y-4 text-deep-green opacity-80">
              <li className="flex items-center gap-3">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                support@careconnect.org
              </li>
              <li className="flex items-center gap-3">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                1-800-CARE-SOS
              </li>
              <li className="flex items-center gap-3">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Global Operations
              </li>
            </ul>
          </div>
        </div>
        
        <div className="text-center text-deep-green opacity-50 border-t border-pale-green-grey pt-12">
          © 2024 CareConnect. All rights reserved. A HealHub Initiative.
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;