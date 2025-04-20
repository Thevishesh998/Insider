import React, { useContext } from 'react'
import { Route, Routes } from 'react-router-dom'
import Home from './pages/Home'
import ApplyJob from './pages/ApplyJob'
import Applications from './pages/Applications'
import AccountPage from './pages/AccountPage'
import { AppContext, AppContextProvider, JobContext } from './context/AppContext'
import RecruiterLogin from './components/RecruiterLogin'
import Dashboard from './pages/Dashboard'
import ManageJobs from './pages/ManageJobs'
import ViewApplications from './pages/ViewApplications'
import AddJob from './pages/AddJob'
import 'quill/dist/quill.snow.css'


const App = () => {
  const {showRecruiterLogin} = useContext(AppContext)
  return (
    <div>
     {showRecruiterLogin && <RecruiterLogin />}
      <Routes>
        <Route path='/' element={<Home />} />
        <Route path='/apply-job/:id' element={<ApplyJob />} />
        <Route path='/applications' element={<Applications />} />
        <Route path='/account' element={<AccountPage />} />
        <Route path='/dashboard' element={<Dashboard/>}>
           <Route path='add-job' element={<AddJob/>}/>
        
           <Route path='manage-jobs' element={<ManageJobs/>}/>
           <Route path='view-applications' element={<ViewApplications/>}/>
        </Route>
        
      </Routes>
    </div>
  )
}

export default App