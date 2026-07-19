import React, { useState } from "react";
import { assets } from "../assets/assets";
import { useNavigate } from "react-router-dom";

const trustedCompanies = [
  ["Microsoft", assets.microsoft_logo, "https://www.microsoft.com"],
  ["Walmart", assets.walmart_logo, "https://www.walmart.com"],
  ["Accenture", assets.accenture_logo, "https://www.accenture.com"],
  ["Samsung", assets.samsung_logo, "https://www.samsung.com"],
  ["Amazon", assets.amazon_logo, "https://www.amazon.com"],
  ["Adobe", assets.adobe_logo, "https://www.adobe.com"],
];

const Hero = () => {
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState("");
  const [location, setLocation] = useState("");

  const onSearch = (event) => {
    event.preventDefault();
    const params = new URLSearchParams();
    if (keyword.trim()) params.set("keyword", keyword.trim());
    if (location.trim()) params.set("location", location.trim());
    navigate(
      { pathname: "/", search: params.toString() },
      { state: { scrollTo: "job-listing" } },
    );
  };

  return <section className="mx-auto max-w-7xl px-4 pt-7 sm:px-6 lg:px-8">
    <div className="relative isolate overflow-hidden rounded-[2rem] bg-slate-950 px-5 py-14 text-center text-white shadow-2xl shadow-slate-950/20 sm:px-10 sm:py-[4.5rem] lg:px-12 lg:py-20">
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_-10%,rgba(96,165,250,0.36),transparent_43%),radial-gradient(circle_at_100%_100%,rgba(30,64,175,0.22),transparent_38%)]" />
      <p className="animate-[fade-in_500ms_ease-out_both] text-xs font-bold uppercase tracking-[0.16em] text-blue-200 sm:tracking-[0.2em]">Software careers, made simpler</p>
      <h1 className="mx-auto mt-4 max-w-3xl animate-[fade-in_600ms_ease-out_80ms_both] text-[2rem] font-bold leading-[1.13] tracking-[-0.035em] sm:mt-5 sm:text-5xl lg:text-6xl">Build what&apos;s next. Find the team that gets you there.</h1>
      <p className="mx-auto mt-5 max-w-2xl animate-[fade-in_600ms_ease-out_160ms_both] text-[0.98rem] leading-7 text-slate-200 sm:mt-6 sm:text-base sm:leading-7">Explore software roles from ambitious teams and discover opportunities that fit your skills.</p>
      <form onSubmit={onSearch} className="mx-auto mt-8 grid max-w-4xl animate-[fade-in_600ms_ease-out_240ms_both] gap-2.5 rounded-2xl border border-white/70 bg-white/95 p-2.5 text-left shadow-2xl shadow-slate-950/30 backdrop-blur sm:mt-9 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] sm:gap-2">
        <label className="flex h-14 min-w-0 items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 text-slate-500 transition duration-200 focus-within:border-blue-400 focus-within:bg-white focus-within:text-blue-600 focus-within:ring-4 focus-within:ring-blue-100 sm:border-0 sm:bg-transparent sm:focus-within:ring-0"><img className="h-5 w-5 shrink-0" src={assets.search_icon} alt="" /><input value={keyword} onChange={(event) => setKeyword(event.target.value)} type="text" placeholder="Role, skill, company, or category" className="min-w-0 flex-1 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400" /></label>
        <label className="flex h-14 min-w-0 items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 text-slate-500 transition duration-200 focus-within:border-blue-400 focus-within:bg-white focus-within:text-blue-600 focus-within:ring-4 focus-within:ring-blue-100 sm:rounded-none sm:border-x-0 sm:border-y-0 sm:border-l sm:border-slate-200 sm:bg-transparent sm:focus-within:ring-0"><img className="h-5 w-5 shrink-0" src={assets.location_icon} alt="" /><input value={location} onChange={(event) => setLocation(event.target.value)} type="text" placeholder="City or remote" className="min-w-0 flex-1 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400" /></label>
        <button type="submit" className="flex h-14 items-center justify-center gap-2 rounded-xl bg-blue-600 px-7 text-sm font-bold text-white shadow-lg shadow-blue-600/25 transition duration-200 hover:-translate-y-0.5 hover:bg-blue-500 hover:shadow-blue-500/30 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-2 focus:ring-offset-white active:translate-y-0 active:scale-[0.98]">Search jobs</button>
      </form>
      <div className="mx-auto mt-7 flex max-w-3xl animate-[fade-in_600ms_ease-out_320ms_both] flex-wrap justify-center gap-2.5 text-sm text-slate-100 sm:mt-8 sm:gap-3" aria-label="Platform highlights">
        <span className="inline-flex min-h-10 items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3.5 py-2 text-left shadow-sm transition duration-200 hover:-translate-y-0.5 hover:bg-white/[0.14]"><span aria-hidden="true" className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-400/20 text-xs font-bold text-blue-100">&#10003;</span>Curated tech roles</span>
        <span className="inline-flex min-h-10 items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3.5 py-2 text-left shadow-sm transition duration-200 hover:-translate-y-0.5 hover:bg-white/[0.14]"><span aria-hidden="true" className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-400/20 text-xs font-bold text-blue-100">&#10003;</span>Resume-ready applications</span>
        <span className="inline-flex min-h-10 items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3.5 py-2 text-left shadow-sm transition duration-200 hover:-translate-y-0.5 hover:bg-white/[0.14]"><span aria-hidden="true" className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-400/20 text-xs font-bold text-blue-100">&#10003;</span>New opportunities every day</span>
      </div>
    </div>
    <section aria-label="Trusted companies" className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white py-4 shadow-sm sm:py-5">
      <div className="px-6 text-center text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Trusted by teams at</div>
      <div className="company-marquee mt-4 sm:mt-5" aria-label="Company logos">
        <div className="company-marquee-track">{[...trustedCompanies, ...trustedCompanies].map(([name, logo, url], index) => <a key={`${name}-${index}`} href={url} target="_blank" rel="noopener noreferrer" className="flex h-9 w-32 shrink-0 items-center justify-center"><img src={logo} alt={`${name} official website`} className="max-h-7 max-w-[105px] object-contain" /></a>)}</div>
      </div>
    </section>
  </section>;
};

export default Hero;
