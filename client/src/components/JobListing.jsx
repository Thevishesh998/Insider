import React, { useContext, useEffect, useState } from "react";
import { JobContext } from "../context/AppContext";
import { AppContext } from "../context/AppContext";
import { assets } from "../assets/assets";
import JobCard from "./JobCard";
import axios from "axios";
import { useAuth } from "@clerk/clerk-react";
import { toast } from "react-toastify";

const JobListing = () => {
  const { backendUrl } = useContext(AppContext);
  const { getToken } = useAuth();
  const [appliedJobs, setAppliedJobs] = useState([]);
  const [showFilter, setShowFilter] = useState(false);
  const { jobs, JobCategories, JobLocations, searchFilter, setSearchFilter } =
    useContext(AppContext);

  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedLocations, setSelectedLocations] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState(jobs);
  const [currentPage, setCurrentPage] = useState(1);

  const handleCategoryChange = (category) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category],
    );
  };

  const fetchAppliedJobs = async () => {
    try {
      const token = await getToken();

      if (!token) {
        return;
      }

      const { data } = await axios.get(backendUrl + "/api/users/applications", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (data.success) {
        setAppliedJobs(data.applications.filter((item) => item.jobId).map((item) => item.jobId._id));
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to load applied jobs");
    }
  };

  const handleLocationChange = (location) => {
    setSelectedLocations((prev) =>
      prev.includes(location)
        ? prev.filter((c) => c !== location)
        : [...prev, location],
    );
  };

  useEffect(() => {
    const matchesCategory = (job) =>
      selectedCategories.length === 0 ||
      selectedCategories.includes(job.category);
    const matchesLocation = (job) =>
      selectedLocations.length === 0 ||
      selectedLocations.includes(job.location);
    const matchesTitle = (job) =>
      searchFilter.title === "" ||
      job.title.toLowerCase().includes(searchFilter.title.toLowerCase());
    const matchesSearchLocation = (job) =>
      searchFilter.location === "" ||
      job.location.toLowerCase().includes(searchFilter.location.toLowerCase());

    const newFilteredJobs = jobs
      .slice()
      .reverse()
      .filter(
        (job) =>
          matchesCategory(job) &&
          matchesLocation(job) &&
          matchesTitle(job) &&
          matchesSearchLocation(job),
      );

    setFilteredJobs(newFilteredJobs);
    setCurrentPage(1);
  }, [jobs, selectedCategories, selectedLocations, searchFilter]);

  useEffect(() => {
    fetchAppliedJobs();
  }, []);

  return (
    <>
      {/* Current Search display */}
      {(searchFilter.title || searchFilter.location) && (
        <div className="mb-4">
          <h4 className="font-medium mb-2">Current Search</h4>
          <div className="flex flex-wrap gap-2">
            {searchFilter.title && (
              <span className="bg-gray-200 px-3 py-1 rounded-full">
                {searchFilter.title}{" "}
                <button
                  className="ml-1 text-red-500"
                  onClick={() =>
                    setSearchFilter({ ...searchFilter, title: "" })
                  }
                >
                  ✕
                </button>
              </span>
            )}
            {searchFilter.location && (
              <span className="bg-gray-200 px-3 py-1 rounded-full">
                {searchFilter.location}{" "}
                <button
                  className="ml-1 text-red-500"
                  onClick={() =>
                    setSearchFilter({ ...searchFilter, location: "" })
                  }
                >
                  ✕
                </button>
              </span>
            )}
          </div>
        </div>
      )}

      <button
        onClick={() => setShowFilter((prev) => !prev)}
        className="px-6 py-1.5 rounded border border-gray-400 lg:hidden"
      >
        {showFilter ? "Close" : "Filters"}
      </button>

      <div className="flex">
        {/* Filters */}
        <div
          className={`w-full lg:w-1/4 bg-white px-4 ${showFilter ? "" : "max-lg:hidden"}`}
        >
          <h4 className="font-medium text-lg py-4">Search by Categories</h4>
          <ul className="space-y-4 text-gray-600">
            {JobCategories.map((category, index) => (
              <li className="flex gap-3 items-center" key={index}>
                <input
                  className="scale-125"
                  type="checkbox"
                  onChange={() => handleCategoryChange(category)}
                  checked={selectedCategories.includes(category)}
                />
                {category}
              </li>
            ))}
          </ul>

          <h4 className="font-medium text-lg py-4">Search by Location</h4>
          <ul className="space-y-4 text-gray-600">
            {JobLocations.map((location, index) => (
              <li className="flex gap-3 items-center" key={index}>
                <input
                  className="scale-125"
                  type="checkbox"
                  onChange={() => handleLocationChange(location)}
                  checked={selectedLocations.includes(location)}
                />
                {location}
              </li>
            ))}
          </ul>
        </div>

        {/* Job Cards */}
        <section className="w-full lg:w-3/4 text-gray-800 max-lg:px-4">
          <h3 className="font-medium text-3xl py-2" id="job-list">
            Latest jobs
          </h3>
          <p className="mb-8">Get your desired job from top companies</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredJobs
              .slice((currentPage - 1) * 6, currentPage * 6)
              .map((job, index) => (
                <JobCard
                  key={index}
                  job={job}
                  isApplied={appliedJobs.includes(job._id)}
                />
              ))}
          </div>

          {/* Pagination */}
          {filteredJobs.length > 0 && (
            <div className="flex items-center justify-center space-x-2 mt-10">
              {/* Left arrow (previous page) */}
              <a href="#job-list">
                <img
                  onClick={() => setCurrentPage(Math.max(currentPage - 1, 1))}
                  src={assets.left_arrow_icon}
                  alt="Previous"
                />
              </a>

              {/* Page numbers */}
              {Array.from({ length: Math.ceil(filteredJobs.length / 6) }).map(
                (_, index) => (
                  <a href="#job-list" key={index}>
                    <button
                      onClick={() => setCurrentPage(index + 1)}
                      className={`w-10 h-10 flex items-center justify-center border rounded ${
                        currentPage === index + 1
                          ? "bg-blue-500 text-white"
                          : ""
                      }`}
                    >
                      {index + 1}
                    </button>
                  </a>
                ),
              )}

              {/* Right arrow (next page) */}
              <a href="#job-list">
                <img
                  onClick={() =>
                    setCurrentPage(
                      Math.min(
                        currentPage + 1,
                        Math.ceil(filteredJobs.length / 6),
                      ),
                    )
                  }
                  src={assets.right_arrow_icon}
                  alt="Next"
                />
              </a>
            </div>
          )}
        </section>
      </div>
    </>
  );
};

export default JobListing;
