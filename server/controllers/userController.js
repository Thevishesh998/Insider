import JobApplication from "../models/JobApplication.js"
import Job from "../models/Job.js"
import {v2 as cloudinary} from "cloudinary"
import { ensureUser } from '../utils/ensureUser.js'
import mongoose from 'mongoose'
import fs from 'fs/promises'
import pdf from 'pdf-parse/lib/pdf-parse.js'
import { analyzeResumeText, scoreJobForCandidate } from '../utils/resumeMatching.js'

const MAX_PAGE_SIZE = 50
const parsePage = (value, fallback, maximum) => {
    const parsed = Number.parseInt(value, 10)
    return Number.isInteger(parsed) && parsed > 0 ? Math.min(parsed, maximum) : fallback
}
const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')




//Get user data
export const getUserData = async(req, res)=> {

    const userId = req.auth.userId
    try {
        const user = await ensureUser(userId)

        res.status(200).json({success: true, user: { _id: user._id, name: user.name, email: user.email, image: user.image, resume: user.resume, resumeUpdatedAt: user.resumeUpdatedAt, resumeOriginalName: user.resumeOriginalName || user.resumeFileName, resumeFileName: user.resumeOriginalName || user.resumeFileName, resumeSize: user.resumeSize, candidateSkills: user.candidateSkills, manualSkills: user.manualSkills || [], manualSkillsConfigured: user.manualSkillsConfigured || false, primaryRole: user.primaryRole || user.candidateRole || "", primaryCategory: user.primaryCategory || user.candidateCategory || "", preferredLocation: user.preferredLocation || "", experienceLevel: user.experienceLevel || "", phone: user.phone || "", education: user.education || "" }})

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

        if (!jobId || !mongoose.Types.ObjectId.isValid(jobId)) {
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
        if (error?.code === 11000) return res.status(409).json({success: false, message: 'Already Applied'})
        res.status(500).json({success: false, message: 'Unable to apply for this job'})
    }

}


//Get user applied applications
export const getUserJobApplications = async(req, res)=> {
    try {
        const userId = req.auth.userId
        await ensureUser(userId)
        const { status, search = '' } = req.query
        const page = parsePage(req.query.page, 1, Number.MAX_SAFE_INTEGER)
        const limit = parsePage(req.query.limit, 10, MAX_PAGE_SIZE)
        if (status && !['Pending', 'Accepted', 'Rejected'].includes(status)) return res.status(400).json({success: false, message: 'Invalid application status'})
        if (typeof search !== 'string' || search.length > 100) return res.status(400).json({success: false, message: 'Search text must be 100 characters or fewer'})

        const match = { userId }
        if (status) match.status = status
        const searchStage = search.trim() ? { $match: { $or: [
            { 'job.title': { $regex: escapeRegExp(search.trim()), $options: 'i' } },
            { 'company.name': { $regex: escapeRegExp(search.trim()), $options: 'i' } },
        ] } } : null
        const [result] = await JobApplication.aggregate([
            { $match: match },
            { $lookup: { from: 'jobs', localField: 'jobId', foreignField: '_id', pipeline: [{ $project: { title: 1, location: 1, category: 1, level: 1, salary: 1 } }], as: 'job' } },
            { $lookup: { from: 'companies', localField: 'companyId', foreignField: '_id', pipeline: [{ $project: { name: 1, image: 1 } }], as: 'company' } },
            { $set: { job: { $arrayElemAt: ['$job', 0] }, company: { $arrayElemAt: ['$company', 0] } } },
            ...(searchStage ? [searchStage] : []),
            { $sort: { date: -1, _id: -1 } },
            { $facet: { applications: [{ $skip: (page - 1) * limit }, { $limit: limit }, { $project: { _id: 1, status: 1, date: 1, job: 1, company: 1 } }], metadata: [{ $count: 'total' }] } },
        ])
        const total = result?.metadata[0]?.total || 0
        return res.status(200).json({success: true, applications: result?.applications || [], pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }})
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

        if (resumeFile.mimetype !== 'application/pdf' || resumeFile.size > 5 * 1024 * 1024) {
            return res.status(400).json({success: false, message: 'Resume must be a PDF smaller than 5 MB'})
        }
        const resumeBuffer = await fs.readFile(resumeFile.path)
        if (resumeBuffer.subarray(0, 5).toString() !== '%PDF-') {
            return res.status(400).json({ success: false, message: 'Resume must be a valid PDF file' })
        }
        // Resume extraction is an optional convenience. A valid PDF must remain
        // usable even when it is image-based or its text cannot be parsed.
        let analysis = { skills: [], primaryCategory: '', primaryRole: '' }
        try {
            const parsedResume = await pdf(resumeBuffer)
            analysis = analyzeResumeText(parsedResume.text)
        } catch {}
        const resumeUpload = await cloudinary.uploader.upload(resumeFile.path, { resource_type: 'raw', folder: 'resumes' })
        userData.resume = resumeUpload.secure_url
        userData.resumeUpdatedAt = new Date()
        const originalName = resumeFile.originalname.replace(/[\\/\x00-\x1f]/g, "_").slice(0, 180) || "resume.pdf"
        userData.resumeOriginalName = originalName
        userData.resumeFileName = originalName
        userData.resumeSize = resumeFile.size
        userData.candidateSkills = analysis.skills
        userData.primaryCategory = analysis.primaryCategory
        userData.primaryRole = analysis.primaryRole

        await userData.save()

        return res.status(200).json({success: true, message: 'Resume Updated', resume: userData.resume, resumeUpdatedAt: userData.resumeUpdatedAt, resumeOriginalName: userData.resumeOriginalName, resumeFileName: userData.resumeFileName, resumeSize: userData.resumeSize, candidateSkills: userData.candidateSkills, manualSkills: userData.manualSkills || [], manualSkillsConfigured: userData.manualSkillsConfigured || false, primaryCategory: userData.primaryCategory, primaryRole: userData.primaryRole})
    } catch (error) {
        res.status(500).json({success: false, message: 'Unable to update resume'})
    } finally {
        if (req.file?.path) await fs.unlink(req.file.path).catch(() => {})
    }
}

export const updateCandidateProfile = async (req, res) => {
    const fields = ['primaryRole', 'preferredLocation', 'experienceLevel', 'phone', 'education']
    const updates = {}

    for (const field of fields) {
        const value = req.body?.[field]
        if (typeof value !== 'string') return res.status(400).json({ success: false, message: `${field} must be text.` })
        const cleaned = value.trim().replace(/\s+/g, ' ')
        if (cleaned.length > 120) return res.status(400).json({ success: false, message: `${field} must be 120 characters or fewer.` })
        updates[field] = cleaned
    }

    try {
        const user = await ensureUser(req.auth.userId)
        Object.assign(user, updates)
        await user.save()
        return res.status(200).json({ success: true, profile: updates })
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Unable to update profile details' })
    }
}

export const getRecommendedJobs = async (req, res) => {
    try {
        const user = await ensureUser(req.auth.userId)
        const jobs = await Job.find({ visible: true }).populate({ path: 'companyId', select: '-password' }).lean()
        const matchingSource = user.manualSkills?.length ? 'manual-skills' : user.candidateSkills?.length ? 'resume-skills' : 'resume-category'
        const hasMatchingProfile = Boolean(user.manualSkills?.length || user.candidateSkills?.length || user.primaryRole || user.primaryCategory)
        if (!hasMatchingProfile) {
            return res.status(200).json({ success: true, hasResume: false, hasRecommendations: false, isFallback: true, matchingSource: null, jobs })
        }

        const matchedJobs = jobs
            .map((job) => ({ job, score: scoreJobForCandidate(job, user) }))
            .filter(({ score }) => score > 0)
            .sort((a, b) => b.score - a.score || b.job.date - a.job.date)
            .map(({ job }) => job)

        return res.status(200).json({ success: true, hasResume: Boolean(user.resume), hasRecommendations: true, isFallback: matchedJobs.length === 0, matchingSource, jobs: matchedJobs.length ? matchedJobs : jobs })
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Unable to load recommended jobs' })
    }
}

export const getUserSkills = async (req, res) => {
    try {
        const user = await ensureUser(req.auth.userId)
        return res.status(200).json({
            success: true,
            skills: user.manualSkillsConfigured ? user.manualSkills || [] : user.candidateSkills || [],
            manualSkills: user.manualSkills || [],
            candidateSkills: user.candidateSkills || [],
            manualSkillsConfigured: user.manualSkillsConfigured || false,
        })
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Unable to load skills' })
    }
}

export const updateUserSkills = async (req, res) => {
    const { skills } = req.body
    if (!Array.isArray(skills) || skills.length > 50) return res.status(400).json({ success: false, message: 'Provide up to 50 skills.' })

    const uniqueSkills = []
    const seen = new Set()
    for (const value of skills) {
        if (typeof value !== 'string') return res.status(400).json({ success: false, message: 'Each skill must be text.' })
        const skill = value.trim().replace(/\s+/g, ' ')
        if (!skill || skill.length > 50) return res.status(400).json({ success: false, message: 'Skills must be between 1 and 50 characters.' })
        const key = skill.toLocaleLowerCase()
        if (!seen.has(key)) { seen.add(key); uniqueSkills.push(skill) }
    }

    try {
        const user = await ensureUser(req.auth.userId)
        user.manualSkills = uniqueSkills
        user.manualSkillsConfigured = true
        await user.save()
        return res.status(200).json({ success: true, skills: user.manualSkills, manualSkillsConfigured: true })
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Unable to update skills' })
    }
}

export const withdrawApplication = async (req, res) => {
    const { id } = req.params
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ success: false, message: 'Invalid application ID' })
    try {
        const application = await JobApplication.findOne({ _id: id, userId: req.auth.userId }).select('status')
        if (!application) return res.status(404).json({ success: false, message: 'Application not found' })
        if (application.status !== 'Pending') return res.status(400).json({ success: false, message: 'Only pending applications can be withdrawn' })
        await application.deleteOne()
        return res.status(200).json({ success: true, message: 'Application withdrawn' })
    } catch (error) { return res.status(500).json({ success: false, message: 'Unable to withdraw application' }) }
}

export const getSavedJobs = async (req, res) => {
    try {
        const user = await ensureUser(req.auth.userId)
        const { search = '', location = '', category = '' } = req.query
        const page = parsePage(req.query.page, 1, Number.MAX_SAFE_INTEGER)
        const limit = parsePage(req.query.limit, 10, MAX_PAGE_SIZE)
        if (typeof search !== 'string' || search.length > 100) return res.status(400).json({ success: false, message: 'Search text must be 100 characters or fewer' })
        const query = { _id: { $in: user.savedJobs || [] }, visible: true }
        if (location) query.location = location
        if (category) query.category = category
        if (search.trim()) query.title = { $regex: escapeRegExp(search.trim()), $options: 'i' }
        const [jobs, total] = await Promise.all([
            Job.find(query).select('title location category level salary date companyId').populate('companyId', 'name image').sort({ date: -1 }).skip((page - 1) * limit).limit(limit).lean(),
            Job.countDocuments(query),
        ])
        return res.status(200).json({ success: true, jobs, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } })
    } catch (error) { return res.status(500).json({ success: false, message: 'Unable to load saved jobs' }) }
}

export const saveJob = async (req, res) => {
    const { jobId } = req.params
    if (!mongoose.Types.ObjectId.isValid(jobId)) return res.status(400).json({ success: false, message: 'Invalid job ID' })
    try {
        const [user, job] = await Promise.all([ensureUser(req.auth.userId), Job.findOne({ _id: jobId, visible: true }).select('_id')])
        if (!job) return res.status(404).json({ success: false, message: 'Job not found' })
        if (user.savedJobs.some((savedId) => savedId.toString() === jobId)) return res.status(409).json({ success: false, message: 'Job already saved' })
        user.savedJobs.push(job._id); await user.save()
        return res.status(201).json({ success: true, message: 'Job saved' })
    } catch (error) { return res.status(500).json({ success: false, message: 'Unable to save job' }) }
}

export const removeSavedJob = async (req, res) => {
    const { jobId } = req.params
    if (!mongoose.Types.ObjectId.isValid(jobId)) return res.status(400).json({ success: false, message: 'Invalid job ID' })
    try {
        const user = await ensureUser(req.auth.userId)
        const wasSaved = user.savedJobs.some((savedId) => savedId.toString() === jobId)
        if (!wasSaved) return res.status(404).json({ success: false, message: 'Saved job not found' })
        user.savedJobs = user.savedJobs.filter((savedId) => savedId.toString() !== jobId); await user.save()
        return res.status(200).json({ success: true, message: 'Saved job removed' })
    } catch (error) { return res.status(500).json({ success: false, message: 'Unable to remove saved job' }) }
}
