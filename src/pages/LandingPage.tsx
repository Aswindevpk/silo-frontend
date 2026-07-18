import React, { useRef, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare, CheckCircle2, Video, ChevronRight, Activity, Users, Shield, Zap, Play } from 'lucide-react';

const use3DTilt = (strength: number = 20) => {
  const ref = useRef<HTMLDivElement>(null);
  const [style, setStyle] = useState({
    transform: 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)',
    transition: 'transform 0.5s cubic-bezier(0.23, 1, 0.32, 1)'
  });

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const { left, top, width, height } = ref.current.getBoundingClientRect();
    const x = (e.clientX - left - width / 2) / strength;
    const y = -(e.clientY - top - height / 2) / strength;

    setStyle({
      transform: `perspective(1000px) rotateX(${y}deg) rotateY(${x}deg) scale3d(1.02, 1.02, 1.02)`,
      transition: 'transform 0.1s ease-out'
    });
  }, [strength]);

  const handleMouseLeave = useCallback(() => {
    setStyle({
      transform: 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)',
      transition: 'transform 0.5s cubic-bezier(0.23, 1, 0.32, 1)'
    });
  }, []);

  return { ref, style, handleMouseMove, handleMouseLeave };
};

const Ticker = () => {
  const quotes = [
    { text: "In under 30 days we doubled our ship speed", author: "@techbuilder" },
    { text: "Best collaboration tool for remote teams", author: "@marcusgrowth" },
    { text: "Silo turned our chaotic threads into focused channels", author: "@alexdesigns" },
    { text: "Hit 10k MRR in 3 months with Silo", author: "@samfounder" },
    { text: "Nothing else comes close", author: "@sarahcodes" }
  ];

  return (
    <div className="w-full overflow-hidden bg-white/50 backdrop-blur-sm border-y border-gray-100 py-4 flex mt-20 relative">
      <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-white to-transparent z-10" />
      <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-white to-transparent z-10" />

      <div className="flex animate-[ticker_30s_linear_infinite] whitespace-nowrap">
        {[...quotes, ...quotes, ...quotes].map((q, i) => (
          <div key={i} className="inline-flex items-center gap-2 mx-8 text-sm text-gray-500">
            "{q.text}" <span className="font-semibold text-[#18181B]">{q.author}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

import { PublicLayout } from '@/components/PublicLayout';

export const LandingPage = () => {
  const { ref: ref1, style: style1, handleMouseMove: move1, handleMouseLeave: leave1 } = use3DTilt(40);
  const { ref: ref2, style: style2, handleMouseMove: move2, handleMouseLeave: leave2 } = use3DTilt(40);
  const { ref: ref3, style: style3, handleMouseMove: move3, handleMouseLeave: leave3 } = use3DTilt(40);

  return (
    <PublicLayout>
      <style>{`
        @keyframes ticker {
          0% { transform: translateX(0); }
          100% { transform: translateX(-33.33%); }
        }
        @keyframes float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
          100% { transform: translateY(0px); }
        }
        @keyframes float-delayed {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-15px); }
          100% { transform: translateY(0px); }
        }
      `}</style>
      {/* Hero Section */}
      <section className="relative px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto flex flex-col items-center text-center mt-12">
        <h1 className="text-5xl sm:text-7xl md:text-8xl font-bold font-['Outfit',sans-serif] tracking-tighter leading-[1.05] mb-6 max-w-4xl text-[#18181B]">
          Turn Chaos into <span className="bg-[#18181B] text-white px-4 rounded-2xl rotate-[-2deg] inline-block">Clarity</span> in Seconds, Not Hours
        </h1>

        <p className="text-xl sm:text-2xl text-gray-500 max-w-2xl mb-10 font-light leading-relaxed">
          Silo is a workspace collaboration platform that organizes discussions into channels, tracks topics to resolution, and provides instant video calls.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4 z-10 w-full sm:w-auto">
          <Link
            to="/register"
            className="w-full sm:w-auto px-8 py-4 bg-[#18181B] hover:bg-black text-white rounded-2xl font-medium text-lg transition-all flex items-center justify-center gap-2 shadow-xl shadow-black/10 hover:scale-105"
          >
            Get Started for Free <ChevronRight className="w-5 h-5" />
          </Link>
          <Link
            to="/contact"
            className="w-full sm:w-auto px-8 py-4 bg-white hover:bg-gray-50 border border-gray-200 text-[#18181B] rounded-2xl font-medium text-lg transition-all flex items-center justify-center gap-2 hover:scale-105 shadow-sm"
          >
            <Play className="w-5 h-5 fill-current" /> Book a Demo
          </Link>
        </div>

        {/* Abstract Hero Image Cards */}
        <div className="mt-20 w-full max-w-5xl mx-auto relative h-[400px] flex justify-center items-end perspective-[2000px]">
          {/* Left Card */}
          <div
            ref={ref1}
            style={{ ...style1, animation: 'float 6s ease-in-out infinite' }}
            onMouseMove={move1}
            onMouseLeave={leave1}
            className="absolute left-10 md:left-20 bottom-0 w-64 h-80 bg-white rounded-t-[2rem] border-x border-t border-gray-200 shadow-[0_0_40px_rgba(0,0,0,0.1)] p-6 overflow-hidden hidden md:block z-10"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center"><Activity className="w-4 h-4" /></div>
              <div className="font-bold">Channels</div>
            </div>
            <div className="space-y-4">
              <div className="w-full h-12 bg-gray-50 rounded-xl" />
              <div className="w-3/4 h-12 bg-gray-50 rounded-xl" />
              <div className="w-5/6 h-12 bg-[#18181B] rounded-xl flex items-center px-4">
                <div className="w-2 h-2 rounded-full bg-green-400" />
              </div>
            </div>
            {/* Fade out bottom */}
            <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white to-transparent" />
          </div>

          {/* Center Card (Main) */}
          <div
            ref={ref2}
            style={{ ...style2, animation: 'float-delayed 7s ease-in-out infinite' }}
            onMouseMove={move2}
            onMouseLeave={leave2}
            className="relative w-80 sm:w-96 h-96 bg-white rounded-t-[2.5rem] border-x border-t border-gray-200 shadow-[0_0_60px_rgba(0,0,0,0.15)] p-8 overflow-hidden z-20"
          >
            <div className="text-center mb-8">
              <h3 className="font-bold text-2xl font-['Outfit',sans-serif]">What topic do you want to resolve today?</h3>
              <p className="text-xs text-gray-400 mt-2">Last Update: Just now</p>
            </div>
            <div className="w-16 h-16 rounded-full bg-[#18181B] mx-auto flex items-center justify-center mb-8 shadow-xl">
              <MessageSquare className="w-6 h-6 text-white" />
            </div>
            <div className="space-y-3">
              <div className="w-full h-10 bg-gray-50 rounded-xl flex items-center px-4 text-sm text-gray-400">Generate ideas for...</div>
              <div className="w-full h-10 bg-gray-50 rounded-xl flex items-center px-4 text-sm text-gray-400">Draft a plan for...</div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#F8F9FA] to-transparent pointer-events-none" />
          </div>

          {/* Right Card */}
          <div
            ref={ref3}
            style={{ ...style3, animation: 'float 5s ease-in-out infinite' }}
            onMouseMove={move3}
            onMouseLeave={leave3}
            className="absolute right-10 md:right-20 bottom-0 w-64 h-80 bg-white rounded-t-[2rem] border-x border-t border-gray-200 shadow-[0_0_40px_rgba(0,0,0,0.1)] p-6 overflow-hidden hidden md:block z-10"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center"><Users className="w-4 h-4" /></div>
              <div className="font-bold">Team Sync</div>
            </div>
            <div className="space-y-4">
              <div className="w-full h-32 bg-gray-100 rounded-2xl border border-gray-200 flex items-center justify-center">
                <Video className="w-8 h-8 text-gray-300" />
              </div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white to-transparent" />
          </div>
        </div>
      </section>

      <Ticker />

      {/* Reviews Section */}
      <section className="py-20 text-center">
        <p className="text-gray-500 font-medium mb-4">Loved by 50,000+ teams worldwide</p>
        <div className="flex items-center justify-center gap-2 text-xl font-bold">
          <div className="flex text-black">
            {[...Array(5)].map((_, i) => <span key={i}>★</span>)}
          </div>
          <span>4.9/5</span>
          <span className="text-gray-400 font-normal text-base ml-2">from 3,000+ reviews</span>
        </div>
      </section>

      {/* Stats Boxes */}
      <section className="max-w-6xl mx-auto px-4 mb-32">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-[2rem] p-8 text-center border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="text-4xl md:text-5xl font-bold font-['Outfit'] mb-2">50K+</div>
            <div className="text-sm text-gray-500 uppercase tracking-wider font-medium">Active Teams</div>
          </div>
          <div className="bg-white rounded-[2rem] p-8 text-center border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="text-4xl md:text-5xl font-bold font-['Outfit'] mb-2">10M+</div>
            <div className="text-sm text-gray-500 uppercase tracking-wider font-medium">Topics Resolved</div>
          </div>
          <div className="bg-white rounded-[2rem] p-8 text-center border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="text-4xl md:text-5xl font-bold font-['Outfit'] mb-2">8.3x</div>
            <div className="text-sm text-gray-500 uppercase tracking-wider font-medium">Faster Decisions</div>
          </div>
          <div className="bg-white rounded-[2rem] p-8 text-center border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="text-4xl md:text-5xl font-bold font-['Outfit'] mb-2">4 min</div>
            <div className="text-sm text-gray-500 uppercase tracking-wider font-medium">Avg. Time to Sync</div>
          </div>
        </div>
      </section>

      {/* Features Bento Box */}
      <section className="max-w-6xl mx-auto px-4 py-20 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-gray-200 text-xs font-bold uppercase tracking-wider mb-6">
          <span className="w-2 h-2 rounded-full bg-black"></span> FEATURES
        </div>
        <h2 className="text-4xl md:text-5xl font-bold font-['Outfit',sans-serif] mb-6 tracking-tight max-w-2xl mx-auto">
          Everything You Need to Dominate Your Workflow
        </h2>
        <p className="text-xl text-gray-500 mb-16 font-light max-w-2xl mx-auto">
          One app. Every tool serious teams need to communicate fast and resolve topics daily without burnout.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          {/* Big Feature: Channels */}
          <div className="md:col-span-2 bg-white rounded-[2rem] p-10 border border-gray-100 shadow-sm relative overflow-hidden group">
            <h3 className="text-2xl font-bold font-['Outfit'] mb-2">Topic Threads</h3>
            <p className="text-gray-500 mb-8 max-w-sm">Keep discussions strictly grouped by topic. Never lose context in an endless chat window again.</p>

            <div className="w-full h-64 bg-gray-50 rounded-2xl border border-gray-200 p-6 flex flex-col justify-end gap-3 transition-transform group-hover:scale-[1.02]">
              {/* Fake Chart / UI */}
              <div className="w-3/4 h-8 bg-gray-200 rounded-lg self-start"></div>
              <div className="w-1/2 h-8 bg-gray-200 rounded-lg self-start"></div>
              <div className="w-2/3 h-8 bg-[#18181B] rounded-lg self-end flex items-center px-4">
                <span className="text-xs text-white">Status: Resolved</span>
              </div>
            </div>
          </div>

          {/* Tall Feature: Calls */}
          <div className="bg-white rounded-[2rem] p-10 border border-gray-100 shadow-sm relative overflow-hidden group">
            <h3 className="text-2xl font-bold font-['Outfit'] mb-2">Instant 1-on-1s</h3>
            <p className="text-gray-500 mb-8">Escalate to a call in one click when typing isn't enough.</p>

            <div className="w-full h-64 bg-[#18181B] rounded-2xl p-6 flex flex-col items-center justify-center gap-6 transition-transform group-hover:scale-[1.02]">
              <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center ring-4 ring-gray-700/50">
                <Video className="w-8 h-8 text-white" />
              </div>
              <div className="px-4 py-2 bg-white text-black rounded-full text-sm font-bold animate-pulse">
                Live Call...
              </div>
            </div>
          </div>

          {/* Small Feature: Workspaces */}
          <div className="bg-white rounded-[2rem] p-10 border border-gray-100 shadow-sm">
            <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mb-6">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold font-['Outfit'] mb-2">Dedicated Workspaces</h3>
            <p className="text-gray-500 text-sm">Secure silos for every team, client, or project.</p>
          </div>

          {/* Small Feature: Security */}
          <div className="md:col-span-2 bg-white rounded-[2rem] p-10 border border-gray-100 shadow-sm flex items-center justify-between">
            <div>
              <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mb-6">
                <Shield className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold font-['Outfit'] mb-2">Granular Roles</h3>
              <p className="text-gray-500 text-sm max-w-sm">Manage access with Owner, Admin, Member, and Guest roles.</p>
            </div>
            <div className="hidden sm:grid grid-cols-3 gap-2 opacity-60">
              {[...Array(9)].map((_, i) => {
                const bgClass = i % 3 === 0 ? 'bg-black' : 'bg-gray-200';
                return <div key={i} className={"w-10 h-10 rounded-md " + bgClass}></div>;
              })}
            </div>
          </div>
        </div>
      </section>

      {/* 3 Steps Section */}
      <section className="max-w-5xl mx-auto px-4 py-32 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-gray-200 text-xs font-bold uppercase tracking-wider mb-6">
          <span className="w-2 h-2 rounded-full bg-black"></span> HOW IT WORKS
        </div>
        <h2 className="text-4xl md:text-5xl font-bold font-['Outfit',sans-serif] mb-6 tracking-tight">
          From Rough Idea to Resolution<br />in 3 Simple Steps
        </h2>
        <p className="text-xl text-gray-500 mb-20 font-light max-w-2xl mx-auto">
          No learning curve. No complicated setup. Just open the app and start resolving.
        </p>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-white p-8 rounded-[2rem] text-left border border-gray-100 shadow-sm relative overflow-hidden">
            <div className="text-[10rem] font-bold text-gray-50 absolute -top-10 -right-4 pointer-events-none">1</div>
            <div className="relative z-10">
              <div className="w-10 h-10 bg-black text-white rounded-full flex items-center justify-center font-bold mb-6">01</div>
              <h3 className="text-xl font-bold mb-3">Create a Channel</h3>
              <p className="text-gray-500 text-sm leading-relaxed mb-6">Type a name, add your team, and set the focus area. Silo keeps it contained.</p>
              <div className="w-full h-32 bg-gray-50 rounded-xl border border-gray-100 p-4">
                <div className="w-1/2 h-4 bg-gray-200 rounded mb-2"></div>
                <div className="w-3/4 h-4 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>

          <div className="bg-white p-8 rounded-[2rem] text-left border border-gray-100 shadow-sm relative overflow-hidden">
            <div className="text-[10rem] font-bold text-gray-50 absolute -top-10 -right-4 pointer-events-none">2</div>
            <div className="relative z-10">
              <div className="w-10 h-10 bg-black text-white rounded-full flex items-center justify-center font-bold mb-6">02</div>
              <h3 className="text-xl font-bold mb-3">Start a Topic</h3>
              <p className="text-gray-500 text-sm leading-relaxed mb-6">Post your thought. Silo threads all replies together automatically.</p>
              <div className="w-full h-32 bg-gray-50 rounded-xl border border-gray-100 p-4">
                <div className="w-full h-12 bg-white shadow-sm rounded-lg mb-2 p-2"><div className="w-1/3 h-2 bg-gray-300 rounded mb-1"></div></div>
                <div className="w-3/4 h-10 bg-gray-100 rounded-lg p-2 ml-4"></div>
              </div>
            </div>
          </div>

          <div className="bg-white p-8 rounded-[2rem] text-left border border-gray-100 shadow-sm relative overflow-hidden">
            <div className="text-[10rem] font-bold text-gray-50 absolute -top-10 -right-4 pointer-events-none">3</div>
            <div className="relative z-10">
              <div className="w-10 h-10 bg-black text-white rounded-full flex items-center justify-center font-bold mb-6">03</div>
              <h3 className="text-xl font-bold mb-3">Mark Resolved</h3>
              <p className="text-gray-500 text-sm leading-relaxed mb-6">Once decisions are made, click resolve to clear the mental clutter.</p>
              <div className="w-full h-32 bg-gray-50 rounded-xl border border-gray-100 p-4 flex items-center justify-center">
                <button className="px-6 py-2 bg-black text-white rounded-full text-sm font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" /> Resolve Topic
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
};
