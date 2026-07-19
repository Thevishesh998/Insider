import express from 'express'
import { ChangeJobApplicationsStatus, changeVisibility, deleteCompanyJob, duplicateCompanyJob, getCompanyDashboard, getCompanyData, getCompanyJob, getCompanyJobApplicants, getCompanyPostedJobs, getCompanyProfile, loginCompany, postJob, registerCompany, updateCompanyJob, updateCompanyProfile } from '../controllers/companyControllers.js';

import upload from '../config/multer.js'
import { protectCompany } from '../middleware/authMiddleware.js';
const router = express.Router()



// Register a company
router.post('/register',upload.single('image'), registerCompany)

// Company login
router.post('/login', loginCompany)

// Get company data
router.get('/company', protectCompany, getCompanyData)
router.get('/profile', protectCompany, getCompanyProfile)
router.put('/profile', protectCompany, upload.single('image'), updateCompanyProfile)

// Get recruiter dashboard data
router.get('/dashboard', protectCompany, getCompanyDashboard)

// Post a job
router.post('/post-job',protectCompany,  postJob)

// Get Applicants data of company
router.get('/applicants', protectCompany,  getCompanyJobApplicants)

// Get company job list
router.get('/list-jobs', protectCompany, getCompanyPostedJobs)

// Recruiter job management
router.get('/jobs/:id', protectCompany, getCompanyJob)
router.put('/jobs/:id', protectCompany, updateCompanyJob)
router.delete('/jobs/:id', protectCompany, deleteCompanyJob)
router.post('/jobs/:id/duplicate', protectCompany, duplicateCompanyJob)

// Change Applications Status
router.post('/change-status', protectCompany,  ChangeJobApplicationsStatus)
router.patch('/applications/:id/status', protectCompany, ChangeJobApplicationsStatus)

// Change Applications Visibility
router.post('/change-visibility', protectCompany,  changeVisibility)

export default router
