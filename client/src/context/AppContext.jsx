import { createContext, useEffect ,useState } from "react";
import { JobCategories, JobLocations, jobsData } from "../assets/assets";

 export const AppContext = createContext()
 export const JobContext = createContext();
 
 export const AppContextProvider = (props) => {

    const[searchFilter, setSearchFilter] = useState({
        title:'',
        location:''
    })
    
    const[isSearched,setIsSearched] = useState(false);

    const [jobs, setJobs] = useState([]);

    const [showRecruiterLogin, setShowRecruiterLogin] = useState(false)

    //Function to fetch jobs
    const fetchJobs = async () => {
          setJobs(jobsData)
    }

    useEffect(()=>{
        fetchJobs()
    },[])


    const value = {
        setSearchFilter,searchFilter,
        isSearched,setIsSearched,jobsData,
        jobs, setJobs, JobCategories, JobLocations,
        showRecruiterLogin, setShowRecruiterLogin,

    };
    return (
        <AppContext.Provider value={value}>
          <JobContext.Provider value={value}>
            {props.children}
          </JobContext.Provider>
        </AppContext.Provider>
      );
      
 }