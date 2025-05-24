import { createContext, useEffect ,useState } from "react";
import { JobCategories, JobLocations, jobsData } from "../assets/assets";

 export const AppContext = createContext()
 export const JobContext = createContext();
 
 export const AppContextProvider = (props) => {

    const backendUrl = import.meta.env.VITE_BACKEND_URL

    const[searchFilter, setSearchFilter] = useState({
        title:'',
        location:''
    })
    
    const[isSearched,setIsSearched] = useState(false);

    const [jobs, setJobs] = useState([]);

    const [showRecruiterLogin, setShowRecruiterLogin] = useState(false)

    const [companyToken, setCompanyToken] = useState(null)
    const [companyData, setCompanyData] = useState(null)


    //Function to fetch jobs
    const fetchJobs = async () => {
          setJobs(jobsData)
    }
    //Functiobn to fetch company data
    

    useEffect(()=>{
        fetchJobs()

        const storedCompanyToken = localStorage.getItem('companyToken')
        if(storedCompanyToken){
          setCompanyToken(storedCompanyToken)
        }

    },[])


    const value = {
        setSearchFilter,searchFilter,
        isSearched,setIsSearched,jobsData,
        jobs, setJobs, JobCategories, JobLocations,
        showRecruiterLogin, setShowRecruiterLogin,
        companyToken, setCompanyToken,
        companyData, setCompanyData,
        backendUrl

    };
    return (
        <AppContext.Provider value={value}>
          <JobContext.Provider value={value}>
            {props.children}
          </JobContext.Provider>
        </AppContext.Provider>
      );
      
 }