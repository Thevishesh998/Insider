import React from "react";
import { useNavigate } from "react-router-dom";
import moment from "moment";
import kconvert from "k-convert";
import { textPreview } from "../utils/jobContent";

const JobCard = ({ job, isApplied, isSaved, onSave }) => {
  const navigate = useNavigate();
  const details = () => { navigate(`/apply-job/${job._id}`); window.scrollTo(0, 0); };
  return <article className="flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:border-slate-300 hover:shadow-md">
    <div className="flex items-start justify-between gap-4"><div className="flex min-w-0 items-center gap-3">{job.companyId?.image ? <img className="h-12 w-12 shrink-0 rounded-xl border border-slate-200 object-contain p-1.5" src={job.companyId.image} alt={`${job.companyId?.name || "Company"} logo`} /> : <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 font-bold text-blue-700">{(job.companyId?.name || "C").slice(0, 1)}</div>}<div className="min-w-0"><p className="truncate text-sm font-bold text-slate-800">{job.companyId?.name || "Company"}</p><p className="mt-0.5 text-xs text-slate-500">Posted {job.date ? moment(job.date).fromNow() : "recently"}</p></div></div>{onSave && <button onClick={() => onSave(job._id)} disabled={isSaved} className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-bold text-slate-600 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 disabled:border-blue-100 disabled:bg-blue-50 disabled:text-blue-700">{isSaved ? "Saved" : "Save"}</button>}</div>
    <div className="mt-5 min-w-0"><h3 className="break-words text-lg font-bold leading-6 text-slate-900">{job.title}</h3><div className="mt-3 flex flex-wrap gap-2 text-xs font-medium"><span className="max-w-full break-words rounded-full bg-slate-100 px-2.5 py-1.5 text-slate-700">{job.location}</span><span className="max-w-full break-words rounded-full bg-blue-50 px-2.5 py-1.5 text-blue-700">{job.level}</span><span className="max-w-full break-words rounded-full bg-emerald-50 px-2.5 py-1.5 text-emerald-700">{job.category}</span></div><p className="mt-3 text-sm font-semibold text-slate-700">{job.salary ? `${kconvert.convertTo(job.salary)} / year` : "Salary not specified"}</p><p className="mt-3 line-clamp-2 break-words text-sm leading-6 text-slate-500">{textPreview(job.description)}</p></div>
    <div className="mt-auto flex gap-2 pt-5"><button onClick={details} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50">Details</button><button disabled={isApplied} onClick={details} className="flex-1 rounded-lg bg-blue-600 px-3 py-2 text-sm font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300">{isApplied ? "Applied" : "Apply now"}</button></div>
  </article>;
};
export default JobCard;
