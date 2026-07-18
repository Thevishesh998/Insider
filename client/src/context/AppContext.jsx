import { createContext, useEffect, useState } from "react";
import { JobCategories, JobLocations } from "../assets/assets";
import { toast } from "react-toastify";
import axios from "axios";
import AddJob from "../pages/AddJob";

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
      const { data } = await axios.get(backendUrl + "/api/jobs");

      if (data.success) {
        setJobs(data.jobs)
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to load jobs");
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
        console.log("Company Data:", data.company);
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
    console.log("Backend URL:", backendUrl);
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
