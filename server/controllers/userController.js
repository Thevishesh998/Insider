import JobApplication from "../models/JobApplication.js"
import Job from "../models/Job.js"
import {v2 as cloudinary} from "cloudinary"
import { ensureUser } from '../utils/ensureUser.js'




//Get user data
export const getUserData = async(req, res)=> {

    const userId = req.auth.userId
    try {
        const user = await ensureUser(userId)

        res.json({success: true, user})

    } catch (error) {
        res.status(500).json({success: false, message: 'Unable to get user data'})
    }


}


//Apply for a job
export const applyForJob = async(req, res)=> {

    const { jobId } = req.body

    const userId = req.auth.userId

    try {
        await ensureUser(userId)

        if (!jobId) {
            return res.status(400).json({success: false, message: 'Job ID is required'})
        }

        const isAlreadyApplied = await JobApplication.find({jobId, userId})

        if (isAlreadyApplied.length > 0) {
            return res.status(409).json({success: false, message: 'Already Applied'})
        }

        const jobData = await Job.findOne({_id: jobId, visible: true})

        if (!jobData) {
           return res.status(404).json({success: false, message: 'Job Not Found'})
        }

        await JobApplication.create({
            companyId: jobData.companyId,
            userId,
            jobId,
            date: Date.now()
        })

        res.status(201).json({success: true, message: 'Applied Successfully'})

    } catch (error) {
        res.status(500).json({success: false, message: 'Unable to apply for this job'})
    }

}


//Get user applied applications
export const getUserJobApplications = async(req, res)=> {

    try {
        
        const userId = req.auth.userId

        await ensureUser(userId)

        const applications = await JobApplication.find({userId})
        .populate('companyId', 'name email image')
        .populate('jobId', 'title description location category level salary')
        .exec()

        if (!applications) {
            return res.json({success: false, message: 'No job applications found for this user.'})
        }

        return res.json({success: true, applications})
    } catch (error) {
        res.status(500).json({success: false, message: 'Unable to get job applications'})
    }
}


//Update user profile(resume)
export const updateUserResume = async(req,res)=> {
    
    try {
        const userId = req.auth.userId

        const resumeFile = req.file

        const userData = await ensureUser(userId)

        if (!resumeFile) {
            return res.status(400).json({success: false, message: 'Resume file is required'})
        }

        const resumeUpload = await cloudinary.uploader.upload(resumeFile.path) 
        userData.resume = resumeUpload.secure_url

        await userData.save()

        return res.json({success: true, message: 'Resume Updated', resume: userData.resume})
    } catch (error) {
        res.status(500).json({success: false, message: 'Unable to update resume'})
    }
}
