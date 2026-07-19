import React, { useEffect, useState, useContext } from "react";
import { assets } from "../assets/assets";
import axios from "axios";
import { AppContext } from "../context/AppContext";
import { toast } from "react-toastify";
const ViewApplications = () => {
  const { backendUrl, companyToken, logoutCompany } = useContext(AppContext);
  const [applications, setApplications] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 0, total: 0 });
  const [filters, setFilters] = useState({ search: "", status: "", jobId: "", sort: "newest" });
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(filters.search), 350);
    return () => clearTimeout(timer);
  }, [filters.search]);

  useEffect(() => {
    if (!companyToken) return undefined;

    let isCurrent = true;
    const loadApplications = async () => {
      setLoading(true);
      setError("");
      try {
        const { data } = await axios.get(backendUrl + "/api/company/applicants", {
          headers: { Authorization: `Bearer ${companyToken}` },
          params: {
            page,
            limit: 10,
            search: debouncedSearch || undefined,
            status: filters.status || undefined,
            jobId: filters.jobId || undefined,
            sort: filters.sort,
          },
        });

        if (!isCurrent) return;
        if (data.success) {
          setApplications(data.applications);
          setPagination(data.pagination);
        } else {
          setError(data.message || "Unable to load applicants");
        }
      } catch (requestError) {
        if (!isCurrent) return;
        if (requestError.response?.status === 401) logoutCompany();
        setError(requestError.response?.data?.message || "Unable to load applicants");
      } finally {
        if (isCurrent) setLoading(false);
      }
    };

    loadApplications();
    return () => {
      isCurrent = false;
    };
  }, [backendUrl, companyToken, debouncedSearch, filters.jobId, filters.sort, filters.status, logoutCompany, page]);

  useEffect(() => {
    if (!companyToken) return undefined;

    let isCurrent = true;
    const loadJobs = async () => {
      try {
        const { data } = await axios.get(backendUrl + "/api/company/list-jobs", {
          headers: { Authorization: `Bearer ${companyToken}` },
        });
        if (isCurrent && data.success) setJobs(data.jobsData || []);
      } catch (requestError) {
        if (requestError.response?.status === 401) logoutCompany();
      }
    };

    loadJobs();
    return () => {
      isCurrent = false;
    };
  }, [backendUrl, companyToken, logoutCompany]);

  const updateFilter = (name, value) => {
    setFilters((current) => ({ ...current, [name]: value }));
    setPage(1);
  };

  const updateStatus = async (id, status) => {
    setUpdatingId(id);
    try {
      const { data } = await axios.patch(
        backendUrl + `/api/company/applications/${id}/status`,
        { status },
        {
          headers: {
            Authorization: `Bearer ${companyToken}`,
          },
        },
      );

      if (data.success) {
        toast.success("Status Updated");
        setApplications((current) => current.map((application) => (
          application._id === id ? { ...application, status: data.application.status } : application
        )));
      } else {
        toast.error(data.message || "Unable to update application status");
      }
    } catch (requestError) {
      if (requestError.response?.status === 401) {
        logoutCompany();
      }
      toast.error(requestError.response?.data?.message || "Unable to update application status");
    } finally {
      setUpdatingId("");
    }
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

  const resumeFileName = (name, originalName) => {
    const safeOriginalName = typeof originalName === "string" ? originalName.replace(/[\\/\x00-\x1f]/g, "_").trim() : "";
    return safeOriginalName || `${(name || "Candidate").trim().replace(/[^a-z0-9]+/gi, "_").replace(/^_|_$/g, "") || "Candidate"}_Resume.pdf`;
  };
  const downloadResume = async (url, name, originalName) => {
    if (!url) return;
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error("Download failed");
      const blob = await response.blob();
      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = resumeFileName(name, originalName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(downloadUrl);
    } catch {
      toast.error("Unable to download this resume");
    }
  };

  const statusClass = {
    Pending: "bg-yellow-50 text-yellow-700",
    Accepted: "bg-green-50 text-green-700",
    Rejected: "bg-red-50 text-red-700",
  };
  return (
    <main className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
      <div className="mb-7">
        <p className="text-sm font-semibold text-blue-600">Recruiting workspace</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">Applications</h1>
        <p className="mt-2 text-sm text-slate-500">Review candidates and keep every application moving.</p>
      </div>
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-4">
          <div className="mb-3"><h2 className="font-semibold text-slate-900">Candidate pipeline</h2><p className="mt-1 text-sm text-slate-500">Search, filter, and update application decisions.</p></div>
        <div className="flex flex-wrap gap-2">
          <input
            value={filters.search}
            onChange={(event) => updateFilter("search", event.target.value)}
            placeholder="Search candidate or job"
            className="min-w-[220px] flex-1 rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500 sm:flex-none"
          />
          <select value={filters.status} onChange={(event) => updateFilter("status", event.target.value)} className="rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500">
            <option value="">All statuses</option>
            <option value="Pending">Pending</option>
            <option value="Accepted">Accepted</option>
            <option value="Rejected">Rejected</option>
          </select>
          <select value={filters.jobId} onChange={(event) => updateFilter("jobId", event.target.value)} className="rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500">
            <option value="">All jobs</option>
            {jobs.map((job) => <option key={job._id} value={job._id}>{job.title}</option>)}
          </select>
          <select value={filters.sort} onChange={(event) => updateFilter("sort", event.target.value)} className="rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500">
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
          </select>
        </div></div>
        {error && <div className="mx-5 mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
        <div className="overflow-x-auto"><table className="min-w-full text-sm">
          <thead>
            <tr className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <th className="px-5 py-3">#</th>
              <th className="px-5 py-3">Candidate</th>
              <th className="hidden px-5 py-3 md:table-cell">Job title</th>
              <th className="hidden px-5 py-3 lg:table-cell">Location</th>
              <th className="px-5 py-3">Resume</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="7" className="px-5 py-12 text-center text-slate-500">Loading applications...</td></tr>
            ) : applications.length === 0 ? (
              <tr><td colSpan="7" className="px-5 py-12 text-center"><p className="font-medium text-slate-700">No applications found</p><p className="mt-1 text-sm text-slate-500">Try changing the search or filters.</p></td></tr>
            ) : applications.map((applicant, index) => {
              const resumeUrl = safeResumeUrl(applicant.candidate?.resume);
              const candidateName = applicant.candidate?.name || "Deleted candidate";
              return (
              <tr key={applicant._id} className="border-t border-slate-100 text-slate-700">
                <td className="px-5 py-4 text-slate-400">{(pagination.page - 1) * pagination.limit + index + 1}</td>
                <td className="flex items-center px-5 py-4 font-semibold text-slate-900">
                  <div className="mr-3 flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-sm text-blue-700">
                    {candidateName.charAt(0).toUpperCase()}
                  </div>
                  <span>{candidateName}</span>
                </td>
                <td className="hidden px-5 py-4 md:table-cell">
                  {applicant.job?.title || "Deleted job"}
                </td>
                <td className="hidden px-5 py-4 text-slate-500 lg:table-cell">
                  {applicant.job?.location || "-"}
                </td>
                <td className="px-5 py-4">
                  <div className="min-w-[190px] space-y-2">
                    <div className="text-xs text-slate-500"><p className="font-semibold text-slate-700">{candidateName}</p><p>{resumeUrl ? applicant.candidate?.resumeFileName || "Resume available" : "Resume not uploaded"}</p>{applicant.candidate?.resumeSize > 0 && <p>{Math.ceil(applicant.candidate.resumeSize / 1024)} KB</p>}{applicant.candidate?.resumeUpdatedAt && <p>Uploaded {new Date(applicant.candidate.resumeUpdatedAt).toLocaleDateString()}</p>}</div>
                    <div className="flex gap-2"><a href={resumeUrl || undefined} target="_blank" rel="noopener noreferrer" aria-disabled={!resumeUrl} onClick={(event) => { if (!resumeUrl) event.preventDefault(); }} className={`rounded-lg border px-2.5 py-1.5 text-xs font-semibold ${resumeUrl ? "border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100" : "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400"}`}>View Resume</a><button type="button" disabled={!resumeUrl} onClick={() => downloadResume(resumeUrl, candidateName, applicant.candidate?.resumeFileName)} className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400">Download Resume</button></div>
                  </div>
                </td>
                <td className="px-5 py-4">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass[applicant.status] || "bg-slate-100 text-slate-700"}`}>{applicant.status}</span>
                </td>
                <td className="relative px-5 py-4 text-right">
                  <div className="group relative inline-block text-left">
                    <button className="rounded-md px-2 py-1 font-bold text-slate-500 hover:bg-slate-100">...</button>
                    <div
                      className="absolute right-0 z-10 mt-2 hidden w-32 rounded-lg border border-slate-200 bg-white py-1 shadow-lg group-hover:block"
                    >
                      <button
                        onClick={() => updateStatus(applicant._id, "Accepted")}
                        disabled={updatingId === applicant._id}
                        className="block w-full px-4 py-2 text-left text-sm font-medium text-blue-700 hover:bg-slate-50 disabled:opacity-50"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => updateStatus(applicant._id, "Rejected")}
                        disabled={updatingId === applicant._id}
                        className="block w-full px-4 py-2 text-left text-sm font-medium text-red-600 hover:bg-slate-50 disabled:opacity-50"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                </td>
              </tr>
              );
            })}
          </tbody>
        </table></div>
        {!loading && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-100 px-5 py-4 text-sm">
            <span className="text-slate-500">Page {pagination.page} of {pagination.totalPages}</span>
            <div className="flex gap-2"><button disabled={pagination.page === 1} onClick={() => setPage((current) => current - 1)} className="rounded-lg border border-slate-200 px-3 py-2 font-semibold text-slate-600 disabled:opacity-50">Previous</button>
            <button disabled={pagination.page === pagination.totalPages} onClick={() => setPage((current) => current + 1)} className="rounded-lg border border-slate-200 px-3 py-2 font-semibold text-slate-600 disabled:opacity-50">Next</button></div>
          </div>
        )}
      </div>
    </main>
  );
};
export default ViewApplications;
