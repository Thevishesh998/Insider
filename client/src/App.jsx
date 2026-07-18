import React from 'react'
import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import ApplyJob from './pages/ApplyJob'
import Applications from './pages/Applications'
import AccountPage from './pages/AccountPage'
import Dashboard from './pages/Dashboard'
import ManageJobs from './pages/ManageJobs'
import ViewApplications from './pages/ViewApplications'
import AddJob from './pages/AddJob'
import RecruiterLogin from './components/RecruiterLogin'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { useContext } from 'react'
import { AppContext } from './context/AppContext'

const App = () => {
  const { showRecruiterLogin, companyToken } = useContext(AppContext)
  

  return (
    <>
      {showRecruiterLogin && <RecruiterLogin />}
      <ToastContainer />
      <Routes>
        <Route path='/' element={<Home />} />
        <Route path='/apply-job/:id' element={<ApplyJob />} />
        <Route path='/applications' element={<Applications />} />
        <Route path='/account' element={<AccountPage />} />
        <Route path='/dashboard' element={<Dashboard />}>
          {companyToken && (
            <>
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
