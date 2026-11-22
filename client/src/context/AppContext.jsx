import { createContext, useEffect, useState } from "react";
import { JobCategories, JobLocations } from "../assets/assets";
import { toast } from "react-toastify";
import axios from "axios";

export const AppContext = createContext();
export const JobContext = createContext();

export const AppContextProvider = (props) => {
  const backendUrl = import.meta.env.VITE_BACKEND_URL;

  const [searchFilter, setSearchFilter] = useState({
    title: "",
    location: "",
  });

  const [isSearched, setIsSearched] = useState(false);
  const [jobs, setJobs] = useState([]);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [showRecruiterLogin, setShowRecruiterLogin] = useState(false);

  const [companyToken, setCompanyToken] = useState(null);
  const [companyData, setCompanyData] = useState(null);

  const logoutCompany = () => {
    localStorage.removeItem("companyToken");
    setCompanyToken(null);
    setCompanyData(null);
  };

  // ✅ Function to fetch jobs
  const fetchJobs = async () => {
    try {
      for (let attempt = 0; attempt < 3; attempt += 1) {
        try {
          const { data } = await axios.get(backendUrl + "/api/jobs", { timeout: 15000 });

          if (data.success) setJobs(data.jobs);
          return;
        } catch (error) {
          const shouldRetry = !error.response || error.response.status >= 500;
          if (!shouldRetry || attempt === 2) throw error;
          await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)));
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to load jobs");
    } finally {
      setJobsLoading(false);
    }
  };

  // ✅ Function to fetch company data
  const fetchCompanyData = async () => {
    try {
      const { data } = await axios.get(backendUrl + "/api/company/company", {
        headers: {
          Authorization: `Bearer ${companyToken}`,
        },
      });

      if (data.success) {
        setCompanyData(data.company);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      if (error.response?.status === 401) {
        logoutCompany();
      }
      toast.error(error.response?.data?.message || "Unable to load company data");
    }
  };

  useEffect(() => {
    fetchJobs();

    const storedToken = localStorage.getItem("companyToken");
    if (storedToken) {
      setCompanyToken(storedToken);
    }
  }, []);

  useEffect(() => {
    if (companyToken) {
      fetchCompanyData();
    }
  }, [companyToken]);

  const value = {
    setSearchFilter,
    searchFilter,
    isSearched,
    setIsSearched,
    jobs,
    jobsLoading,
    setJobs,
    JobCategories,
    JobLocations,
    showRecruiterLogin,
    setShowRecruiterLogin,
    companyToken,
    setCompanyToken,
    companyData,
    setCompanyData,
    logoutCompany,
    backendUrl,
  };

  return (
    <AppContext.Provider value={value}>
      <JobContext.Provider value={value}>{props.children}</JobContext.Provider>
    </AppContext.Provider>
  );
};
