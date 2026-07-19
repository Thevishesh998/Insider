import { useAuth, useUser } from "@clerk/clerk-react";
import axios from "axios";
import { useContext, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Briefcase, Check, Clock3, FileText, Heart, MapPin, Sparkles, Wrench, X } from "lucide-react";
import { AppContext } from "../context/AppContext";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const icons = { applications: Briefcase, clock: Clock3, check: Check, close: X, heart: Heart, spark: Sparkles, file: FileText, skills: Wrench, arrow: ArrowRight, pin: MapPin };
const Icon = ({ name, className = "" }) => {
  const LucideIcon = icons[name];
  return <LucideIcon aria-hidden="true" className={className} strokeWidth={1.9} />;
};

const statusTone = { Pending: "bg-amber-50 text-amber-700", Accepted: "bg-emerald-50 text-emerald-700", Rejected: "bg-rose-50 text-rose-700" };
const relativeDate = (value) => {
  if (!value) return "Recently";
  const days = Math.floor((Date.now() - new Date(value).getTime()) / 86400000);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  return `${days} days ago`;
};

const CandidateDashboard = () => {
  const { backendUrl } = useContext(AppContext);
  const { getToken } = useAuth();
  const { user } = useUser();
  const [data, setData] = useState({ profile: null, applications: [], savedJobs: [], recommendations: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let current = true;
    const fetchDashboard = async () => {
      setLoading(true); setError("");
      try {
        const token = await getToken();
        const headers = { Authorization: `Bearer ${token}` };
        const [profileResponse, applicationsResponse, savedResponse, recommendedResponse] = await Promise.all([
          axios.get(`${backendUrl}/api/users/user`, { headers }),
          axios.get(`${backendUrl}/api/users/applications`, { headers, params: { limit: 50 } }),
          axios.get(`${backendUrl}/api/users/saved-jobs`, { headers, params: { limit: 50 } }),
          axios.get(`${backendUrl}/api/users/recommended-jobs`, { headers }),
        ]);
        if (!current) return;
        setData({
          profile: profileResponse.data.success ? profileResponse.data.user : null,
          applications: applicationsResponse.data.applications || [],
          savedJobs: savedResponse.data.jobs || [],
          recommendations: recommendedResponse.data.hasRecommendations ? recommendedResponse.data.jobs || [] : [],
        });
      } catch (requestError) {
        if (current) setError(requestError.response?.data?.message || "Unable to load your dashboard.");
      } finally {
        if (current) setLoading(false);
      }
    };
    fetchDashboard();
    return () => { current = false; };
  }, [backendUrl, getToken, reload]);

  const stats = useMemo(() => ({
    applications: data.applications.length,
    pending: data.applications.filter((item) => item.status === "Pending").length,
    accepted: data.applications.filter((item) => item.status === "Accepted").length,
    rejected: data.applications.filter((item) => item.status === "Rejected").length,
    saved: data.savedJobs.length,
    recommended: data.recommendations.length,
  }), [data]);
  const skills = data.profile?.manualSkillsConfigured ? data.profile?.manualSkills || [] : data.profile?.candidateSkills || [];
  const strengthItems = [["Resume uploaded", Boolean(data.profile?.resume)], ["Skills added", skills.length > 0], ["Preferred role", Boolean(data.profile?.primaryRole)], ["Location", Boolean(data.profile?.preferredLocation)]];
  const strength = Math.round((strengthItems.filter(([, complete]) => complete).length / strengthItems.length) * 100);
  const activities = [
    ...data.applications.slice(0, 3).map((item) => ({ label: `Applied to ${item.job?.title || "a role"}`, detail: item.company?.name || "Application submitted", date: item.date, icon: "applications", tone: "bg-blue-50 text-blue-600" })),
    ...(data.profile?.resume ? [{ label: "Resume updated", detail: "Your resume is ready to share", date: data.profile.resumeUpdatedAt, icon: "file", tone: "bg-violet-50 text-violet-600" }] : []),
    ...(skills.length ? [{ label: "Skills added", detail: `${skills.length} developer skill${skills.length === 1 ? "" : "s"} on your profile`, date: null, icon: "skills", tone: "bg-emerald-50 text-emerald-600" }] : []),
  ].sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0)).slice(0, 5);
  const cards = [
    ["Applications", stats.applications, "Roles you have applied to", "applications", "text-blue-600 bg-blue-50"], ["Pending", stats.pending, "Awaiting a decision", "clock", "text-amber-600 bg-amber-50"],
    ["Accepted", stats.accepted, "Positive responses", "check", "text-emerald-600 bg-emerald-50"], ["Rejected", stats.rejected, "Closed applications", "close", "text-rose-600 bg-rose-50"],
    ["Saved jobs", stats.saved, "Roles saved for later", "heart", "text-pink-600 bg-pink-50"], ["Recommended", stats.recommended, "Roles matched to you", "spark", "text-violet-600 bg-violet-50"],
  ];

  return <><Navbar /><main className="min-h-[70vh] bg-slate-50/70 py-7 sm:py-10"><div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
    <section className="overflow-hidden rounded-[2rem] bg-slate-950 px-6 py-8 text-white shadow-xl shadow-slate-900/10 sm:px-10 sm:py-10"><div className="relative"><div className="absolute -right-16 -top-24 h-56 w-56 rounded-full bg-blue-500/20 blur-3xl" /><p className="relative text-xs font-bold uppercase tracking-[0.2em] text-blue-300">Candidate dashboard</p><div className="relative mt-3 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between"><div><h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Welcome back, {user?.firstName || user?.fullName?.split(" ")[0] || "there"}.</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">Stay on top of your opportunities, keep your profile strong, and discover roles that match your skills.</p></div><Link to="/" className="inline-flex w-fit items-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-bold text-slate-900 hover:bg-blue-50">Browse jobs <Icon name="arrow" className="h-4 w-4" /></Link></div></div></section>

    {error ? <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-700"><p>{error}</p><button onClick={() => setReload((value) => value + 1)} className="mt-2 font-bold underline">Try again</button></div> : loading ? <DashboardSkeleton /> : <><section className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{cards.map(([label, value, subtitle, icon, tone]) => <article key={label} className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-lg"><div className="flex items-start justify-between gap-3"><div className={`flex h-11 w-11 items-center justify-center rounded-xl ${tone}`}><Icon name={icon} className="h-5 w-5" /></div><Icon name="arrow" className="h-4 w-4 text-slate-300 transition group-hover:translate-x-1 group-hover:text-blue-600" /></div><p className="mt-5 text-3xl font-bold tracking-tight text-slate-900">{value}</p><p className="mt-1 text-sm font-semibold text-slate-700">{label}</p><p className="mt-1 text-xs text-slate-500">{subtitle}</p></article>)}</section>

      <section className="mt-8"><div><h2 className="text-xl font-bold text-slate-900">Quick actions</h2><p className="mt-1 text-sm text-slate-500">The essentials, right where you need them.</p></div><div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5"><Action to="/" label="Browse jobs" icon="applications" /><Action to="/account" label="Update resume" icon="file" /><Action to="/account" label="Manage skills" icon="skills" /><Action to="/applications" label="My applications" icon="clock" /><Action to="/applications?tab=saved" label="Saved jobs" icon="heart" /></div></section>

      <div className="mt-8 grid gap-7 xl:grid-cols-[minmax(0,1.45fr)_360px]"><div className="space-y-7"><section className="rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-5 sm:px-6"><div><h2 className="text-lg font-bold text-slate-900">Recommended jobs</h2><p className="mt-1 text-sm text-slate-500">Based on the role and skills in your profile.</p></div><Link to="/" className="text-sm font-bold text-blue-700 hover:text-blue-800">Browse all</Link></div>{data.recommendations.length ? <div className="grid gap-3 p-4 sm:grid-cols-2 sm:p-5">{data.recommendations.slice(0, 4).map((job) => <Link key={job._id} to={`/apply-job/${job._id}`} className="group rounded-xl border border-slate-200 p-4 transition hover:border-blue-200 hover:bg-blue-50/40"><div className="flex items-start gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-white text-sm font-bold text-slate-500">{job.companyId?.image ? <img src={job.companyId.image} alt="" className="h-full w-full object-contain" /> : job.companyId?.name?.slice(0, 1) || "C"}</div><div className="min-w-0"><p className="truncate font-bold text-slate-900 group-hover:text-blue-700">{job.title}</p><p className="mt-1 truncate text-sm text-slate-500">{job.companyId?.name || "Company"}</p><p className="mt-2 flex items-center gap-1 text-xs text-slate-500"><Icon name="pin" className="h-3.5 w-3.5" />{job.location || "Location flexible"}</p></div></div></Link>)}</div> : <EmptyState icon="spark" title="Recommendations will appear here" text="Add a resume, preferred role, and skills to unlock tailored job matches." action="Complete profile" to="/account" />}</section>

        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="border-b border-slate-100 px-5 py-5 sm:px-6"><h2 className="text-lg font-bold text-slate-900">Recent activity</h2><p className="mt-1 text-sm text-slate-500">Your latest profile and application updates.</p></div>{activities.length ? <div className="divide-y divide-slate-100">{activities.map((activity, index) => <div key={`${activity.label}-${index}`} className="flex gap-3 px-5 py-4 sm:px-6"><div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${activity.tone}`}><Icon name={activity.icon} className="h-4 w-4" /></div><div className="min-w-0 flex-1"><p className="font-semibold text-slate-800">{activity.label}</p><p className="mt-0.5 text-sm text-slate-500">{activity.detail}</p></div><p className="shrink-0 text-xs text-slate-400">{relativeDate(activity.date)}</p></div>)}</div> : <EmptyState icon="clock" title="No activity yet" text="Actions like applications and profile updates will show up here." />}</section></div>

        <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"><div className="flex items-center justify-between"><div><h2 className="text-lg font-bold text-slate-900">Profile strength</h2><p className="mt-1 text-sm text-slate-500">A stronger profile gets better matches.</p></div><p className="text-2xl font-bold text-blue-700">{strength}%</p></div><div className="mt-5 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-blue-600" style={{ width: `${strength}%` }} /></div><div className="mt-5 space-y-3">{strengthItems.map(([label, complete]) => <div key={label} className="flex items-center justify-between gap-3 text-sm"><span className="text-slate-600">{label}</span><span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-bold ${complete ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{complete ? <><Icon name="check" className="h-3 w-3" />Done</> : "To do"}</span></div>)}</div><div className="mt-6 rounded-xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase tracking-wide text-slate-400">Developer skills</p><p className="mt-2 text-sm font-semibold text-slate-800">{skills.length ? `${skills.length} skills added` : "No skills added yet"}</p><p className="mt-3 text-xs font-bold uppercase tracking-wide text-slate-400">Recommended role</p><p className="mt-2 text-sm font-semibold text-slate-800">{data.profile?.primaryRole || "Not selected"}</p><p className="mt-3 text-xs font-bold uppercase tracking-wide text-slate-400">Location</p><p className="mt-2 text-sm font-semibold text-slate-800">{data.profile?.preferredLocation || "Not selected"}</p></div><Link to="/account" className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-blue-700 hover:text-blue-800">Improve profile <Icon name="arrow" className="h-4 w-4" /></Link></aside></div></>}</div></main><Footer /></>;
};

const Action = ({ to, label, icon }) => <Link to={to} className="group flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"><div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600"><Icon name={icon} className="h-4 w-4" /></div><span className="text-sm font-bold text-slate-700 group-hover:text-blue-700">{label}</span></Link>;
const EmptyState = ({ icon, title, text, action, to }) => <div className="px-5 py-10 text-center sm:px-8"><div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-500"><Icon name={icon} className="h-5 w-5" /></div><h3 className="mt-4 font-bold text-slate-800">{title}</h3><p className="mx-auto mt-1 max-w-sm text-sm leading-6 text-slate-500">{text}</p>{action && <Link to={to} className="mt-4 inline-flex rounded-lg bg-blue-600 px-3.5 py-2 text-sm font-bold text-white hover:bg-blue-700">{action}</Link>}</div>;
const DashboardSkeleton = () => <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 6 }).map((_, index) => <div key={index} className="h-40 animate-pulse rounded-2xl bg-slate-200/70" />)}</div>;

export default CandidateDashboard;
