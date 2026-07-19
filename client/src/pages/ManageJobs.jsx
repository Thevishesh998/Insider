import React, { useCallback, useContext, useEffect, useState } from "react";
import moment from "moment";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { AppContext } from "../context/AppContext";

const ManageJobs = () => {
  const navigate = useNavigate();
  const { backendUrl, companyToken, logoutCompany } = useContext(AppContext);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionId, setActionId] = useState("");

  const fetchJobs = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const { data } = await axios.get(`${backendUrl}/api/company/list-jobs`, { headers: { Authorization: `Bearer ${companyToken}` } });
      if (data.success) setJobs(data.jobsData || []);
      else setError(data.message || "Unable to load jobs.");
    } catch (requestError) {
      if (requestError.response?.status === 401) logoutCompany();
      setError(requestError.response?.data?.message || "Unable to load jobs.");
    } finally { setLoading(false); }
  }, [backendUrl, companyToken, logoutCompany]);

  useEffect(() => { fetchJobs(); }, [fetchJobs]);

  const handleAction = async (jobId, action) => {
    if (action === "delete" && !window.confirm("Delete this job and all of its applications? This cannot be undone.")) return;
    const requests = {
      delete: { method: "delete", url: `${backendUrl}/api/company/jobs/${jobId}` },
      duplicate: { method: "post", url: `${backendUrl}/api/company/jobs/${jobId}/duplicate` },
      visibility: { method: "post", url: `${backendUrl}/api/company/change-visibility`, data: { id: jobId } },
    };
    setActionId(jobId);
    try {
      const { data } = await axios({ ...requests[action], headers: { Authorization: `Bearer ${companyToken}` } });
      if (data.success) { toast.success(action === "delete" ? "Job deleted" : action === "duplicate" ? "Job duplicated" : "Hiring status updated"); fetchJobs(); }
      else toast.error(data.message || "Unable to update job.");
    } catch (requestError) {
      if (requestError.response?.status === 401) logoutCompany();
      toast.error(requestError.response?.data?.message || "Unable to update job");
    } finally { setActionId(""); }
  };

  return (
    <main className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
      <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-sm font-semibold text-blue-600">Recruiting workspace</p><h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">Manage jobs</h1><p className="mt-2 text-sm text-slate-500">Review postings, visibility, and applicant volume in one place.</p></div><button onClick={() => navigate("/dashboard/add-job")} className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">Add new job</button></div>
      {error ? <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-700"><p>{error}</p><button type="button" onClick={fetchJobs} className="mt-2 font-semibold underline">Try again</button></div> : <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-4"><h2 className="font-semibold text-slate-900">All postings</h2><p className="mt-1 text-sm text-slate-500">{loading ? "Loading your postings..." : `${jobs.length} job${jobs.length === 1 ? "" : "s"} posted`}</p></div>
        <div className="overflow-x-auto"><table className="min-w-full text-left text-sm"><thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-3">Job</th><th className="hidden px-5 py-3 lg:table-cell">Created</th><th className="hidden px-5 py-3 md:table-cell">Location</th><th className="px-5 py-3 text-center">Applicants</th><th className="px-5 py-3">Status</th><th className="px-5 py-3 text-right">Actions</th></tr></thead><tbody className="divide-y divide-slate-100">{loading ? <tr><td colSpan="6" className="px-5 py-12 text-center text-slate-500">Loading jobs...</td></tr> : jobs.length === 0 ? <tr><td colSpan="6" className="px-5 py-12 text-center"><p className="font-medium text-slate-700">No job postings yet</p><p className="mt-1 text-sm text-slate-500">Create your first role to start receiving applications.</p><button onClick={() => navigate("/dashboard/add-job")} className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">Create job</button></td></tr> : jobs.map((job) => { const updating = actionId === job._id; return <tr key={job._id} className="text-slate-700"><td className="px-5 py-4"><p className="font-semibold text-slate-900">{job.title}</p><p className="mt-1 text-xs text-slate-500 md:hidden">{job.location}</p></td><td className="hidden whitespace-nowrap px-5 py-4 text-slate-500 lg:table-cell">{moment(job.date).format("ll")}</td><td className="hidden px-5 py-4 text-slate-600 md:table-cell">{job.location}</td><td className="px-5 py-4 text-center font-semibold text-slate-700">{job.applicantCount}</td><td className="px-5 py-4"><button disabled={updating} onClick={() => handleAction(job._id, "visibility")} className={`rounded-full px-2.5 py-1 text-xs font-semibold ${job.visible ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>{job.visible ? "Visible" : "Hidden"}</button></td><td className="px-5 py-4"><div className="flex justify-end gap-3"><button disabled={updating} onClick={() => navigate(`/dashboard/add-job?edit=${job._id}`)} className="text-sm font-semibold text-blue-700 hover:text-blue-900 disabled:opacity-50">Edit</button><button disabled={updating} onClick={() => handleAction(job._id, "duplicate")} className="text-sm font-semibold text-slate-600 hover:text-slate-900 disabled:opacity-50">Duplicate</button><button disabled={updating} onClick={() => handleAction(job._id, "delete")} className="text-sm font-semibold text-red-600 hover:text-red-800 disabled:opacity-50">{updating ? "Updating..." : "Delete"}</button></div></td></tr>; })}</tbody></table></div>
      </div>}
    </main>
  );
};

export default ManageJobs;
