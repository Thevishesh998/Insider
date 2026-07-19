import React, { useContext, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import axios from "axios";
import kconvert from "k-convert";
import moment from "moment";
import { useAuth, useUser } from "@clerk/clerk-react";
import { toast } from "react-toastify";
import { AppContext } from "../context/AppContext";
import { safeJobHtml } from "../utils/jobContent";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import JobCard from "../components/JobCard";

const ApplyJob = () => {
  const { id } = useParams();
  const { jobs, backendUrl } = useContext(AppContext);
  const { getToken } = useAuth();
  const { isSignedIn } = useUser();
  const [job, setJob] = useState(() => jobs.find((item) => item._id === id) || null);
  const [loading, setLoading] = useState(!job);
  const [error, setError] = useState("");
  const [applied, setApplied] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true); setError("");
      try {
        const { data } = await axios.get(`${backendUrl}/api/jobs/${id}`);
        if (!data.success) throw new Error(data.message);
        if (active) setJob(data.job);
      } catch (requestError) { if (active) setError(requestError.response?.data?.message || "This role is unavailable right now."); }
      finally { if (active) setLoading(false); }
    };
    load();
    return () => { active = false; };
  }, [backendUrl, id]);

  useEffect(() => {
    if (!isSignedIn) return;
    let active = true;
    const checkApplication = async () => {
      try {
        const token = await getToken();
        const { data } = await axios.get(`${backendUrl}/api/users/applications`, { headers: { Authorization: `Bearer ${token}` }, params: { limit: 50 } });
        if (active && data.success) setApplied(data.applications.some((item) => item.job?._id === id));
      } catch { /* Status is non-essential to viewing a job. */ }
    };
    checkApplication();
    return () => { active = false; };
  }, [backendUrl, getToken, id, isSignedIn]);

  const apply = async () => {
    if (!isSignedIn) return toast.info("Please sign in before applying.");
    setSubmitting(true);
    try {
      const token = await getToken();
      const { data } = await axios.post(`${backendUrl}/api/users/apply`, { jobId: id }, { headers: { Authorization: `Bearer ${token}` } });
      if (!data.success) throw new Error(data.message);
      setApplied(true); toast.success("Application submitted successfully");
    } catch (requestError) { toast.error(requestError.response?.data?.message || requestError.message || "Unable to submit application"); }
    finally { setSubmitting(false); }
  };

  const related = useMemo(() => jobs.filter((item) => item._id !== id && item.category === job?.category).slice(0, 3), [id, job?.category, jobs]);
  if (loading) return <><Navbar /><main className="mx-auto min-h-[70vh] max-w-7xl px-4 py-10 sm:px-6"><div className="h-56 animate-pulse rounded-3xl bg-slate-100" /><div className="mt-6 h-80 animate-pulse rounded-2xl bg-slate-100" /></main></>;
  if (error || !job) return <><Navbar /><main className="mx-auto flex min-h-[65vh] max-w-xl flex-col items-center justify-center px-4 text-center"><h1 className="text-2xl font-bold text-slate-900">Job not found</h1><p className="mt-2 text-slate-500">{error || "The role may have closed or been removed."}</p><Link to="/" className="mt-6 rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white">Browse open jobs</Link></main><Footer /></>;
  const company = job.companyId && typeof job.companyId === "object" ? job.companyId : null;
  const companyDetails = company ? [["Industry", company.industry], ["Company size", company.companySize], ["Founded", company.foundedYear], ["Headquarters", company.headquarters]].filter(([, value]) => value !== undefined && value !== null && value !== "") : [];

  return <><Navbar /><main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
    <Link to="/" className="text-sm font-semibold text-blue-700 hover:text-blue-800">← Back to all jobs</Link>
    <section className="mt-5 rounded-3xl bg-gradient-to-br from-slate-950 to-slate-800 px-6 py-8 text-white shadow-xl sm:px-10 sm:py-10">
      <div className="flex flex-col justify-between gap-7 lg:flex-row lg:items-center"><div className="flex gap-4"><div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white p-2">{job.companyId?.image ? <img className="max-h-full max-w-full object-contain" src={job.companyId.image} alt={`${job.companyId?.name || "Company"} logo`} /> : <span className="text-xl font-bold text-blue-700">{(job.companyId?.name || "C").slice(0, 1)}</span>}</div><div><p className="text-sm font-semibold text-blue-300">{job.companyId?.name || "Company"}</p><h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">{job.title}</h1><div className="mt-4 flex flex-wrap gap-2 text-sm text-slate-200"><span className="rounded-full bg-white/10 px-3 py-1.5">{job.location}</span><span className="rounded-full bg-white/10 px-3 py-1.5">{job.level}</span><span className="rounded-full bg-white/10 px-3 py-1.5">{job.category}</span></div></div></div><div className="shrink-0 lg:text-right"><button onClick={apply} disabled={applied || submitting} className="w-full rounded-xl bg-blue-500 px-6 py-3 font-semibold text-white transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:bg-slate-500">{submitting ? "Submitting…" : applied ? "Application submitted" : "Apply for this role"}</button><p className="mt-3 text-sm text-slate-300">Posted {moment(job.date).fromNow()}</p></div></div>
    </section>
    <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]"><article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"><h2 className="text-xl font-bold text-slate-900">About this role</h2><div className="rich-text mt-5 text-slate-700" dangerouslySetInnerHTML={{ __html: safeJobHtml(job.description) }} />{company && <section className="mt-10 border-t border-slate-200 pt-8"><h2 className="text-xl font-bold text-slate-900">Company Information</h2><div className="mt-5 flex items-center gap-4">{company.image && <img className="h-14 w-14 rounded-xl border border-slate-200 object-contain p-1" src={company.image} alt={`${company.name || "Company"} logo`} />}{company.name && <h3 className="text-lg font-semibold text-slate-900">{company.name}</h3>}</div>{company.about && <div className="mt-6"><h3 className="text-sm font-semibold text-slate-900">About company</h3><p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-600">{company.about}</p></div>}{companyDetails.length > 0 && <dl className="mt-6 grid gap-4 text-sm sm:grid-cols-2">{companyDetails.map(([label, value]) => <div key={label}><dt className="text-slate-500">{label}</dt><dd className="mt-1 font-semibold text-slate-800">{value}</dd></div>)}</dl>}{company.website && <div className="mt-6"><a href={company.website} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-blue-700 hover:text-blue-800 hover:underline">Visit website</a></div>}</section>}<button onClick={apply} disabled={applied || submitting} className="mt-8 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-400">{submitting ? "Submitting…" : applied ? "Application submitted" : "Apply now"}</button></article><aside className="space-y-5"><section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="font-bold text-slate-900">Role overview</h2><dl className="mt-4 space-y-4 text-sm"><div><dt className="text-slate-500">Compensation</dt><dd className="mt-1 font-semibold text-slate-800">{job.salary ? kconvert.convertTo(job.salary) : "Not specified"}</dd></div><div><dt className="text-slate-500">Work location</dt><dd className="mt-1 font-semibold text-slate-800">{job.location}</dd></div><div><dt className="text-slate-500">Experience level</dt><dd className="mt-1 font-semibold text-slate-800">{job.level}</dd></div></dl></section><p className="px-1 text-xs leading-5 text-slate-500">Before applying, make sure your resume and profile details are up to date.</p></aside></div>
    {related.length > 0 && <section className="mt-12"><h2 className="text-xl font-bold text-slate-900">Similar opportunities</h2><div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{related.map((item) => <JobCard key={item._id} job={item} />)}</div></section>}
  </main><Footer /></>;
};
export default ApplyJob;
