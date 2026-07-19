import { useContext, useEffect, useState } from "react";
import axios from "axios";
import moment from "moment";
import { Link } from "react-router-dom";
import { AppContext } from "../context/AppContext";

const statCards = [
  { key: "totalJobs", label: "Total jobs", tone: "border-blue-100 bg-blue-50 text-blue-700" },
  { key: "activeJobs", label: "Active jobs", tone: "border-emerald-100 bg-emerald-50 text-emerald-700" },
  { key: "hiddenJobs", label: "Hidden jobs", tone: "border-slate-200 bg-slate-50 text-slate-700" },
  { key: "totalApplications", label: "Total applications", tone: "border-violet-100 bg-violet-50 text-violet-700" },
  { key: "pending", label: "Pending", tone: "border-amber-100 bg-amber-50 text-amber-700" },
  { key: "accepted", label: "Accepted", tone: "border-green-100 bg-green-50 text-green-700" },
  { key: "rejected", label: "Rejected", tone: "border-red-100 bg-red-50 text-red-700" },
];

const statusClass = {
  Accepted: "bg-green-100 text-green-700",
  Pending: "bg-amber-100 text-amber-700",
  Rejected: "bg-red-100 text-red-700",
};

const safeResumeUrl = (resume) => {
  if (typeof resume !== "string") return null;
  try {
    const url = new URL(resume);
    return ["https:", "http:"].includes(url.protocol) ? url.href : null;
  } catch {
    return null;
  }
};

const RecruiterDashboard = () => {
  const { backendUrl, companyData, companyToken, logoutCompany } = useContext(AppContext);
  const [dashboard, setDashboard] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!companyToken) return undefined;

    let isCurrent = true;
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        setError("");
        const { data } = await axios.get(`${backendUrl}/api/company/dashboard`, {
          headers: { Authorization: `Bearer ${companyToken}` },
        });

        if (!isCurrent) return;
        if (data.success) setDashboard(data);
        else setError(data.message || "Unable to load dashboard data.");
      } catch (requestError) {
        if (!isCurrent) return;
        if (requestError.response?.status === 401) logoutCompany();
        setError(requestError.response?.data?.message || "Unable to load dashboard data.");
      } finally {
        if (isCurrent) setLoading(false);
      }
    };

    fetchDashboard();
    return () => {
      isCurrent = false;
    };
  }, [backendUrl, companyToken, logoutCompany, reloadKey]);

  if (!companyToken) return null;

  return (
    <main className="w-full max-w-7xl p-4 sm:p-6 lg:p-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-blue-600">Recruiter overview</p>
          <h1 className="mt-1 text-2xl font-semibold text-gray-900 sm:text-3xl">Welcome back{companyData?.name ? `, ${companyData.name}` : ""}</h1>
          <p className="mt-2 text-sm text-gray-500">Keep track of your job postings and candidate pipeline.</p>
        </div>
        <section className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm" aria-label="Company overview">
          {companyData?.image ? <img className="h-10 w-10 rounded-full border object-cover" src={companyData.image} alt={`${companyData.name || "Company"} logo`} /> : <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 font-semibold text-blue-700">{companyData?.name?.charAt(0)?.toUpperCase() || "C"}</div>}
          <div><p className="text-xs font-medium uppercase tracking-wide text-gray-500">Company</p><p className="font-medium text-gray-900">{companyData?.name || "Your company"}</p></div>
        </section>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"><p>{error}</p><button type="button" onClick={() => setReloadKey((current) => current + 1)} className="mt-2 font-medium underline">Try again</button></div>
      ) : loading || !dashboard ? (
        <div className="rounded-lg border border-gray-200 bg-white px-4 py-10 text-center text-sm text-gray-500">Loading dashboard...</div>
      ) : (
        <>
          <section className="mb-8 rounded-xl border border-gray-200 bg-white p-4 shadow-sm" aria-label="Quick actions">
            <h2 className="font-semibold text-gray-900">Quick actions</h2>
            <div className="mt-3 flex flex-wrap gap-3">
              <Link to="/dashboard/add-job" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">Add Job</Link>
              <Link to="/dashboard/manage-jobs" className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Manage Jobs</Link>
              <Link to="/dashboard/view-applications" className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">View Applications</Link>
            </div>
          </section>

          <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4" aria-label="Dashboard statistics">
            {statCards.map((card) => (
              <article key={card.key} className={`rounded-xl border p-4 ${card.tone}`}><p className="text-sm font-medium">{card.label}</p><p className="mt-2 text-2xl font-semibold text-gray-900">{dashboard.stats?.[card.key] || 0}</p></article>
            ))}
          </section>

          <section className="mt-8 grid gap-6 xl:grid-cols-2">
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
              <div className="border-b border-gray-100 px-5 py-4"><h2 className="font-semibold text-gray-900">Recent jobs</h2><p className="mt-1 text-sm text-gray-500">Your five most recently created job postings.</p></div>
              {dashboard.recentJobs?.length ? <div className="overflow-x-auto"><table className="min-w-full text-left text-sm"><thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500"><tr><th className="px-5 py-3 font-medium">Job</th><th className="px-5 py-3 font-medium">Applicants</th><th className="px-5 py-3 font-medium">Visibility</th><th className="px-5 py-3 font-medium">Created</th></tr></thead><tbody className="divide-y divide-gray-100 text-gray-700">{dashboard.recentJobs.map((job) => <tr key={job._id}><td className="px-5 py-4 font-medium text-gray-900">{job.title}</td><td className="px-5 py-4">{job.applicantCount}</td><td className="px-5 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-medium ${job.visible ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>{job.visible ? "Visible" : "Hidden"}</span></td><td className="whitespace-nowrap px-5 py-4 text-gray-500">{moment(job.date).format("ll")}</td></tr>)}</tbody></table></div> : <p className="px-5 py-10 text-center text-sm text-gray-500">No jobs posted yet.</p>}
            </div>

            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
              <div className="border-b border-gray-100 px-5 py-4"><h2 className="font-semibold text-gray-900">Recent applications</h2><p className="mt-1 text-sm text-gray-500">The latest candidates in your hiring pipeline.</p></div>
              {dashboard.recentApplications?.length ? <div className="divide-y divide-gray-100">{dashboard.recentApplications.map((application) => {
                const resumeUrl = safeResumeUrl(application.candidate?.resume);
                return <div key={application._id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><p className="truncate font-medium text-gray-900">{application.candidate?.name || "Deleted candidate"}</p><p className="mt-1 truncate text-sm text-gray-500">{application.job?.title || "Job no longer available"}</p></div><div className="flex items-center gap-3"><span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusClass[application.status] || "bg-gray-100 text-gray-600"}`}>{application.status}</span>{resumeUrl ? <a href={resumeUrl} target="_blank" rel="noopener noreferrer" className="rounded-lg border border-blue-200 px-3 py-1.5 text-sm font-medium text-blue-700 hover:bg-blue-50">Resume</a> : <span className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-400">No resume</span>}</div></div>;
              })}</div> : <p className="px-5 py-10 text-center text-sm text-gray-500">No applications received yet.</p>}
            </div>
          </section>
        </>
      )}
    </main>
  );
};

export default RecruiterDashboard;
