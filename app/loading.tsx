"use client";

import { Sparkles, Palette } from "lucide-react";

export default function Loading() {
  return (
    <div className="fixed -inset-10 z-[9999] bg-[#f8f2ee] flex flex-col items-center justify-center p-6 text-center select-none">
      {/* Animated Brand Emblem */}
      <div className="relative mb-6 animate-bounce">
        <div className="w-20 h-20 rounded-full bg-white shadow-xl border-2 border-[#5D3264] flex items-center justify-center relative">
          <img
            src="/icon-192.png"
            alt="Loading..."
            className="w-full h-full object-cover rounded-full"
          />
          <span className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-amber-400 text-stone-900 font-bold text-xs flex items-center justify-center shadow-md animate-ping">
            ✨
          </span>
        </div>
      </div>

      {/* Brand Title & Tagline */}
      <h1 className="font-heading text-2xl sm:text-4xl font-extrabold text-[#182b3f] tracking-tight mb-2">
        VISH-ÝI
      </h1>

      {/* Luxury Progress Bar */}
      <div className="w-48 sm:w-64 h-1.5 bg-slate-200 rounded-full overflow-hidden mt-6 relative border border-slate-300 shadow-inner">
        <div className="h-full bg-gradient-to-r from-[#182b3f] via-[#567c8d] to-amber-500 rounded-full animate-pulse w-full"></div>
      </div>

      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mt-4 flex items-center gap-1">
        <Sparkles className="w-3 h-3 text-amber-500 animate-spin" /> Loading Experience...
      </span>
    </div>
  );
}
