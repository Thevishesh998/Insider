import React, { useContext, useEffect, useMemo, useState } from "react";
import { AppContext } from "../context/AppContext";
import { assets } from "../assets/assets";
import JobCard from "./JobCard";
import axios from "axios";
import { useAuth } from "@clerk/clerk-react";
import { toast } from "react-toastify";
import { useSearchParams } from "react-router-dom";

const JobListing = ({ isHome = false }) => {
  const { backendUrl } = useContext(AppContext);
  const { getToken } = useAuth();
  const [appliedJobs, setAppliedJobs] = useState([]);
  const [savedJobs, setSavedJobs] = useState([]);
  const [recommendedJobs, setRecommendedJobs] = useState([]);
  const [hasResumeRecommendations, setHasResumeRecommendations] = useState(false);
  const [matchingSource, setMatchingSource] = useState(null);
  const [showFilter, setShowFilter] = useState(false);
  const { jobs, JobCategories, JobLocations } =
    useContext(AppContext);
  const [searchParams, setSearchParams] = useSearchParams();
  const keyword = searchParams.get("keyword") || "";
  const selectedCategories = searchParams.getAll("category");
  const selectedLocations = searchParams.getAll("location");
  const filterKey = searchParams.toString();

  const [loadingMembership, setLoadingMembership] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  const updateMultiValue = (name, value) => {
    const next = new URLSearchParams(searchParams);
    const values = next.getAll(name);
    next.delete(name);
    (values.includes(value) ? values.filter((item) => item !== value) : [...values, value]).forEach((item) => next.append(name, item));
    setSearchParams(next, { replace: true, preventScrollReset: true });
  };

  const fetchAppliedJobs = async () => {
    try {
      const token = await getToken();

      if (!token) {
        return;
      }

      const { data } = await axios.get(backendUrl + "/api/users/applications", { headers: { Authorization: `Bearer ${token}` }, params: { limit: 50 } });

      if (data.success) {
        setAppliedJobs(data.applications.filter((item) => item.job).map((item) => item.job._id));
      }
    } catch (error) { if (error.response?.status !== 401) toast.error(error.response?.data?.message || "Unable to load applied jobs"); }
  };
  const fetchSavedJobs = async () => {
    try {
      const token = await getToken();
      if (!token) return;
      const { data } = await axios.get(backendUrl + "/api/users/saved-jobs", { headers: { Authorization: `Bearer ${token}` }, params: { limit: 50 } });
      if (data.success) setSavedJobs(data.jobs.map((job) => job._id));
    } catch {
      // Saved-job membership is optional for unauthenticated visitors.
    } finally { setLoadingMembership(false); }
  };
  const fetchRecommendedJobs = async () => {
    try {
      const token = await getToken();
      if (!token) return;
      const { data } = await axios.get(`${backendUrl}/api/users/recommended-jobs`, { headers: { Authorization: `Bearer ${token}` } });
      if (data.success) {
        setHasResumeRecommendations(Boolean(data.hasRecommendations && !data.isFallback));
        setRecommendedJobs(data.jobs || []);
        setMatchingSource(data.matchingSource || null);
      }
    } catch {
      // Recommendations are optional for unauthenticated visitors.
    }
  };
  const saveJob = async (jobId) => {
    try {
      const token = await getToken();
      const { data } = await axios.post(`${backendUrl}/api/users/saved-jobs/${jobId}`, {}, { headers: { Authorization: `Bearer ${token}` } });
      if (data.success) { setSavedJobs((items) => [...items, jobId]); toast.success("Job saved"); } else toast.error(data.message);
    } catch (error) { toast.error(error.response?.data?.message || "Unable to save job"); }
  };

  const clearFilters = () => setSearchParams({}, { replace: true, preventScrollReset: true });

  const filteredJobs = useMemo(() => {
    const matchesCategory = (job) =>
      selectedCategories.length === 0 ||
      selectedCategories.includes(job.category);
    const matchesLocation = (job) =>
      selectedLocations.length === 0 ||
      selectedLocations.some((location) => job.location.toLowerCase().includes(location.toLowerCase()));
    const normalizedKeyword = keyword.trim().toLowerCase();
    const matchesKeyword = (job) => {
      if (!normalizedKeyword) return true;
      const skills = Array.isArray(job.skills) ? job.skills.join(" ") : job.skills || "";
      return [job.title, job.category, job.companyId?.name, job.description, skills]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(normalizedKeyword));
    };
    const hasActiveFilters = Boolean(normalizedKeyword || selectedCategories.length || selectedLocations.length);
    const jobsForCandidate = hasResumeRecommendations && !hasActiveFilters ? recommendedJobs : jobs.slice().reverse();
    const newFilteredJobs = jobsForCandidate
      .slice()
      .filter(
        (job) =>
          matchesCategory(job) &&
          matchesLocation(job) &&
          matchesKeyword(job),
      );

    return newFilteredJobs;
  }, [jobs, recommendedJobs, hasResumeRecommendations, filterKey]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filterKey]);

  useEffect(() => {
    fetchAppliedJobs();
    fetchSavedJobs();
    fetchRecommendedJobs();
  }, []);

  return (
    <>
      {/* Current Search display */}
      {Boolean(keyword || selectedCategories.length || selectedLocations.length) && (
        <div className="mx-auto mb-5 max-w-7xl px-4 sm:px-6 lg:px-8">
          <h4 className="mb-2 text-sm font-semibold text-slate-700">Current search</h4>
          <div className="flex flex-wrap gap-2">
            {keyword && (
              <span className="rounded-full bg-blue-50 px-3 py-1 text-sm text-blue-700">
                {keyword}{" "}
                <button
                  className="ml-1 text-red-500"
                  onClick={() => { const next = new URLSearchParams(searchParams); next.delete("keyword"); setSearchParams(next, { replace: true, preventScrollReset: true }); }}
                >
                  ✕
                </button>
              </span>
            )}
            {selectedCategories.map((category) => (
              <span key={`category-${category}`} className="rounded-full bg-blue-50 px-3 py-1 text-sm text-blue-700">
                {category}{" "}
                <button className="ml-1 text-red-500" onClick={() => updateMultiValue("category", category)}>✕</button>
              </span>
            ))}
            {selectedLocations.map((location) => (
              <span key={`location-${location}`} className="rounded-full bg-blue-50 px-3 py-1 text-sm text-blue-700">
                {location}{" "}
                <button
                  className="ml-1 text-red-500"
                  onClick={() => updateMultiValue("location", location)}
                >
                  ✕
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={() => setShowFilter((prev) => !prev)}
        className="mx-4 mb-4 rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 lg:hidden"
      >
        {showFilter ? "Close" : "Filters"}
      </button>

      <div className={`mx-auto flex max-w-7xl flex-col gap-6 px-4 pb-14 sm:px-6 lg:flex-row lg:px-8 ${isHome ? "pt-8 sm:pt-10" : ""}`}>
        {/* Filters */}
        <div
        className={`h-fit w-full min-w-0 rounded-xl border border-slate-200 bg-white p-5 shadow-sm lg:sticky lg:top-24 lg:w-1/4 ${showFilter ? "" : "max-lg:hidden"}`}
        >
          <div className="flex items-center justify-between pb-3"><h4 className="text-sm font-bold uppercase tracking-wide text-slate-500">Categories</h4><button onClick={clearFilters} className="text-xs font-semibold text-blue-700">Clear all</button></div>
          <ul className="list-none space-y-3 p-0 text-sm text-slate-600">
            {JobCategories.map((category, index) => (
              <li className="flex min-w-0 items-center gap-3" key={index}>
                <input
                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  type="checkbox"
                  onChange={() => updateMultiValue("category", category)}
                  checked={selectedCategories.includes(category)}
                />
                <span className="min-w-0 break-words">{category}</span>
              </li>
            ))}
          </ul>

          <h4 className="pb-3 pt-6 text-sm font-bold uppercase tracking-wide text-slate-500">Locations</h4>
          <ul className="list-none space-y-3 p-0 text-sm text-slate-600">
            {JobLocations.map((location, index) => (
              <li className="flex min-w-0 items-center gap-3" key={index}>
                <input
                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  type="checkbox"
                  onChange={() => updateMultiValue("location", location)}
                  checked={selectedLocations.includes(location)}
                />
                <span className="min-w-0 break-words">{location}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Job Cards */}
        <section className="min-w-0 w-full text-slate-800 lg:w-3/4" id="job-list">
          {hasResumeRecommendations && !keyword && selectedCategories.length === 0 && selectedLocations.length === 0 && recommendedJobs.length > 0 && <div className="mb-10"><div className="mb-4"><h3 className="text-2xl font-bold tracking-tight">Recommended For You</h3><p className="mt-1 text-sm text-slate-500">{matchingSource === "manual-skills" ? "Based on the skills you selected." : matchingSource === "resume-skills" ? "Based on skills detected from your resume." : "Based on your resume category."}</p></div><div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">{recommendedJobs.slice(0, 3).map((job) => <JobCard key={job._id} job={job} isApplied={appliedJobs.includes(job._id)} isSaved={savedJobs.includes(job._id)} onSave={saveJob} />)}</div></div>}
          <div className="mb-8 flex items-end justify-between gap-4"><div><h3 className="text-3xl font-bold tracking-tight">Latest Jobs</h3><p className="mt-2 text-slate-500">{filteredJobs.length} role{filteredJobs.length === 1 ? "" : "s"} matched to your search.</p></div></div>

          {loadingMembership && jobs.length > 0 ? <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">{[1,2,3].map((item) => <div key={item} className="h-64 animate-pulse rounded-2xl bg-slate-100" />)}</div> : filteredJobs.length === 0 ? <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center"><h4 className="font-semibold text-slate-800">No roles match these filters</h4><p className="mt-2 text-sm text-slate-500">Try clearing a filter or searching a broader term.</p><button onClick={clearFilters} className="mt-5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white">Clear filters</button></div> : <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredJobs
              .slice((currentPage - 1) * 6, currentPage * 6)
              .map((job, index) => (
                <JobCard
                  key={index}
                  job={job}
                  isApplied={appliedJobs.includes(job._id)}
                  isSaved={savedJobs.includes(job._id)}
                  onSave={saveJob}
                />
              ))}
          </div>}

          {filteredJobs.length > 0 && (
            <nav className="mt-10 flex items-center justify-center space-x-2" aria-label="Pagination">
              <button
                type="button"
                onClick={() => setCurrentPage((page) => Math.max(page - 1, 1))}
                disabled={currentPage === 1}
                className="rounded-md p-1 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Previous page"
              >
                <img src={assets.left_arrow_icon} alt="" />
              </button>

              {Array.from({ length: Math.ceil(filteredJobs.length / 6) }).map(
                (_, index) => (
                  <button
                    type="button"
                    key={index}
                    onClick={() => setCurrentPage(index + 1)}
                    className={`flex h-10 w-10 items-center justify-center rounded-lg border ${
                      currentPage === index + 1 ? "bg-blue-500 text-white" : ""
                    }`}
                    aria-current={currentPage === index + 1 ? "page" : undefined}
                  >
                    {index + 1}
                  </button>
                ),
              )}

              <button
                type="button"
                onClick={() => setCurrentPage((page) => Math.min(page + 1, Math.ceil(filteredJobs.length / 6)))}
                disabled={currentPage === Math.ceil(filteredJobs.length / 6)}
                className="rounded-md p-1 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Next page"
              >
                <img src={assets.right_arrow_icon} alt="" />
              </button>
            </nav>
          )}
        </section>
      </div>
    </>
  );
};

export default JobListing;
