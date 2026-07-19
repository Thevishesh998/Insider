import React from 'react'
import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Jobs from './pages/Jobs'
import ApplyJob from './pages/ApplyJob'
import Applications from './pages/Applications'
import AccountPage from './pages/AccountPage'
import Dashboard from './pages/Dashboard'
import RecruiterDashboard from './pages/RecruiterDashboard'
import CandidateDashboard from './pages/CandidateDashboard'
import CompanyProfile from './pages/CompanyProfile'
import ManageJobs from './pages/ManageJobs'
import ViewApplications from './pages/ViewApplications'
import AddJob from './pages/AddJob'
import RecruiterLogin from './components/RecruiterLogin'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { useContext } from 'react'
import { AppContext } from './context/AppContext'
import { About, Careers, Contact, Help, Privacy, Resources, Terms } from './pages/PublicPages'
import ScrollToTop from './components/ScrollToTop'

const App = () => {
  const { showRecruiterLogin, companyToken } = useContext(AppContext)
  

  return (
    <>
      {showRecruiterLogin && <RecruiterLogin />}
      <ToastContainer />
      <ScrollToTop />
      <Routes>
        <Route path='/' element={<Home />} />
        <Route path='/jobs' element={<Jobs />} />
        <Route path='/about' element={<About />} />
        <Route path='/careers' element={<Careers />} />
        <Route path='/contact' element={<Contact />} />
        <Route path='/resources' element={<Resources />} />
        <Route path='/help' element={<Help />} />
        <Route path='/privacy' element={<Privacy />} />
        <Route path='/terms' element={<Terms />} />
        <Route path='/apply-job/:id' element={<ApplyJob />} />
        <Route path='/applications' element={<Applications />} />
        <Route path='/account' element={<AccountPage />} />
        <Route path='/candidate-dashboard' element={<CandidateDashboard />} />
        <Route path='/dashboard' element={<Dashboard />}>
          {companyToken && (
            <>
              <Route index element={<RecruiterDashboard />} />
              <Route path='company-profile' element={<CompanyProfile />} />
              <Route path='add-job' element={<AddJob />} />
              <Route path='manage-jobs' element={<ManageJobs />} />
              <Route path='view-applications' element={<ViewApplications />} />
            </>
          )}
        </Route>
      </Routes>
    </>
  )
}

export default App
