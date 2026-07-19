import express from 'express'
import { applyForJob, getRecommendedJobs, getSavedJobs, getUserData, getUserJobApplications, getUserSkills, removeSavedJob, saveJob, updateCandidateProfile, updateUserResume, updateUserSkills, withdrawApplication } from '../controllers/userController.js'
import upload from '../config/multer.js'
import { requireAuth } from '@clerk/express';

const router = express.Router()

//Get user data
router.get('/user', requireAuth(), getUserData)
router.get('/recommended-jobs', requireAuth(), getRecommendedJobs)
router.get('/skills', requireAuth(), getUserSkills)
router.put('/skills', requireAuth(), updateUserSkills)
router.put('/profile', requireAuth(), updateCandidateProfile)


//Apply for a job
router.post('/apply', requireAuth(), applyForJob)


//Get applied jobs data
router.get('/applications', requireAuth(), getUserJobApplications)
router.delete('/applications/:id', requireAuth(), withdrawApplication)

router.get('/saved-jobs', requireAuth(), getSavedJobs)
router.post('/saved-jobs/:jobId', requireAuth(), saveJob)
router.delete('/saved-jobs/:jobId', requireAuth(), removeSavedJob)

//Update user profile (resume)
router.post('/update-resume', requireAuth(), upload.single('resume'), updateUserResume)

router.use((error, req, res, next) => {
    if (error?.name === 'MulterError' || error?.message === 'Only PDF files are allowed') {
        return res.status(400).json({ success: false, message: 'Resume must be a PDF smaller than 5 MB' })
    }
    next(error)
})

export default router;
