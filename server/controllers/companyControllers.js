import Company from "../models/Company.js";
import bcrypt from "bcrypt";
import { v2 as cloudinary } from "cloudinary";
import generateToken from "../utils/generateToken.js";
import Job from "../models/Job.js";
import JobApplication from "../models/JobApplication.js";
import mongoose from "mongoose";

const APPLICATION_STATUSES = ["Pending", "Accepted", "Rejected"];
const MAX_APPLICATION_PAGE_SIZE = 50;

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const parsePositiveInteger = (value, fallback, maximum) => {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed < 1) return fallback;
  return Math.min(parsed, maximum);
};

const COMPANY_PROFILE_FIELDS = "_id name email image about website industry companySize headquarters foundedYear";
const COMPANY_SIZES = ["", "1-10", "11-50", "51-200", "201-500", "501-1000", "1001+"];

const validateCompanyProfile = ({ name, about, website, industry, companySize, headquarters, foundedYear }) => {
  if (typeof name !== "string" || !name.trim() || name.trim().length > 120) return "Company name is required and must be 120 characters or fewer";
  if (typeof about !== "string" || about.trim().length > 3000) return "About company must be 3000 characters or fewer";
  if (typeof industry !== "string" || industry.trim().length > 100) return "Industry must be 100 characters or fewer";
  if (typeof headquarters !== "string" || headquarters.trim().length > 160) return "Headquarters must be 160 characters or fewer";
  if (!COMPANY_SIZES.includes(companySize)) return "Invalid company size";

  if (website) {
    try {
      const parsedWebsite = new URL(website);
      if (!["http:", "https:"].includes(parsedWebsite.protocol)) return "Website must be a valid HTTP or HTTPS URL";
    } catch {
      return "Website must be a valid URL";
    }
  }

  if (foundedYear !== "") {
    const year = Number(foundedYear);
    if (!Number.isInteger(year) || year < 1800 || year > new Date().getFullYear()) return "Founded year must be valid";
  }

  return null;
};

const validateJobData = ({ title, description, location, salary, level, category }) => {
  if (![title, description, location, level, category].every((field) => typeof field === "string" && field.trim())) {
    return "All job fields are required";
  }

  if (!description.replace(/<[^>]*>/g, "").trim()) {
    return "Job description is required";
  }

  if (!Number.isFinite(Number(salary)) || Number(salary) < 0) {
    return "Salary must be a valid non-negative number";
  }

  return null;
};

const findOwnedJob = async (jobId, companyId, res) => {
  if (!mongoose.Types.ObjectId.isValid(jobId)) {
    res.status(400).json({ success: false, message: "Invalid job ID" });
    return null;
  }

  const job = await Job.findById(jobId);
  if (!job) {
    res.status(404).json({ success: false, message: "Job not found" });
    return null;
  }

  if (job.companyId.toString() !== companyId.toString()) {
    res.status(403).json({ success: false, message: "You do not have permission to manage this job" });
    return null;
  }

  return job;
};

// Register a new company
export const registerCompany = async (req, res) => {
  const { name, email, password } = req.body;
  const imageFile = req.file;
  if (!name || !email || !password || !imageFile) {
    return res.json({ success: false, message: "Message Details" });
  }

  try {
    const companyExists = await Company.findOne({ email });

    if (companyExists) {
      return res.json({
        success: false,
        message: "Company already registered",
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashPassword = await bcrypt.hash(password, salt);

    const imageUpload = await cloudinary.uploader.upload(imageFile.path);

    const company = await Company.create({
      name,
      email,
      password: hashPassword,
      image: imageUpload.secure_url,
    });

    res.json({
      success: true,
      company: {
        _id: company._id,
        name: company.name,
        email: company.email,
        image: company.image,
      },
      token: generateToken(company._id),
    });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// Company login
export const loginCompany = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: "Email and password are required" });
  }

  try {
    const company = await Company.findOne({ email });
    if (company && await bcrypt.compare(password, company.password)) {
      res.json({
        success: true,
        company: {
          _id: company._id,
          name: company.name,
          email: company.email,
          image: company.image,
        },
        token: generateToken(company._id),
      });
    } else {
      res.status(401).json({ success: false, message: "Invalid email or password" });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: "Unable to log in" });
  }
};

// Get company data
export const getCompanyData = async (req, res) => {
  try {
    const company = req.company;
    res.json({ success: true, company });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// Post a new job
export const postJob = async (req, res) => {
  const { title, description, location, salary, level, category } = req.body;
  const companyId = req.company._id;

  const validationError = validateJobData({ title, description, location, salary, level, category });
  if (validationError) {
    return res.status(400).json({ success: false, message: validationError });
  }

  try {
    const newJob = new Job({
      title: title.trim(),
      description,
      location: location.trim(),
      salary: Number(salary),
      companyId,
      date: Date.now(),
      level: level.trim(),
      category: category.trim(),
    });

    await newJob.save();
    res.status(201).json({ success: true, newJob });
  } catch (error) {
    res.status(500).json({ success: false, message: "Unable to post job" });
  }
};

// Get authenticated company profile with an explicit safe projection.
export const getCompanyProfile = async (req, res) => {
  try {
    const company = await Company.findById(req.company._id).select(COMPANY_PROFILE_FIELDS).lean();
    if (!company) return res.status(404).json({ success: false, message: "Company not found" });
    return res.status(200).json({ success: true, company });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Unable to load company profile" });
  }
};

// Update the authenticated company's profile and optional logo.
export const updateCompanyProfile = async (req, res) => {
  const { name, about = "", website = "", industry = "", companySize = "", headquarters = "", foundedYear = "" } = req.body;
  const validationError = validateCompanyProfile({ name, about, website, industry, companySize, headquarters, foundedYear });
  if (validationError) return res.status(400).json({ success: false, message: validationError });

  if (req.file && (!req.file.mimetype?.startsWith("image/") || req.file.size > 5 * 1024 * 1024)) {
    return res.status(400).json({ success: false, message: "Logo must be an image file smaller than 5 MB" });
  }

  try {
    const updates = {
      name: name.trim(),
      about: about.trim(),
      website: website.trim(),
      industry: industry.trim(),
      companySize,
      headquarters: headquarters.trim(),
      foundedYear: foundedYear === "" ? null : Number(foundedYear),
    };

    if (req.file) {
      const imageUpload = await cloudinary.uploader.upload(req.file.path, { folder: "company_logos", resource_type: "image" });
      updates.image = imageUpload.secure_url;
    }

    const company = await Company.findByIdAndUpdate(
      req.company._id,
      { $set: updates },
      { new: true, runValidators: true, projection: COMPANY_PROFILE_FIELDS },
    ).lean();

    if (!company) return res.status(404).json({ success: false, message: "Company not found" });
    return res.status(200).json({ success: true, message: "Profile updated", company });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Unable to update company profile" });
  }
};

// Get Company Job Applicants
export const getCompanyJobApplicants = async (req, res) => {
  const { status, jobId, search = "", sort = "newest" } = req.query;
  const page = parsePositiveInteger(req.query.page, 1, Number.MAX_SAFE_INTEGER);
  const limit = parsePositiveInteger(req.query.limit, 10, MAX_APPLICATION_PAGE_SIZE);

  if (status && !APPLICATION_STATUSES.includes(status)) {
    return res.status(400).json({ success: false, message: "Invalid application status" });
  }

  if (jobId && !mongoose.Types.ObjectId.isValid(jobId)) {
    return res.status(400).json({ success: false, message: "Invalid job ID" });
  }

  if (!["newest", "oldest"].includes(sort)) {
    return res.status(400).json({ success: false, message: "Invalid sort order" });
  }

  if (typeof search !== "string" || search.length > 100) {
    return res.status(400).json({ success: false, message: "Search text must be 100 characters or fewer" });
  }

  try {
    const match = { companyId: req.company._id };
    if (status) match.status = status;
    if (jobId) match.jobId = new mongoose.Types.ObjectId(jobId);

    const trimmedSearch = search.trim();
    const searchMatch = trimmedSearch
      ? {
          $match: {
            $or: [
              { "candidate.name": { $regex: escapeRegExp(trimmedSearch), $options: "i" } },
              { "job.title": { $regex: escapeRegExp(trimmedSearch), $options: "i" } },
            ],
          },
        }
      : null;

    const [result] = await JobApplication.aggregate([
      { $match: match },
      {
        $lookup: {
          from: "jobs",
          localField: "jobId",
          foreignField: "_id",
          pipeline: [{ $project: { title: 1, location: 1 } }],
          as: "job",
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          pipeline: [{ $project: { name: 1, resume: 1, resumeUpdatedAt: 1, resumeFileName: 1, resumeSize: 1 } }],
          as: "candidate",
        },
      },
      {
        $set: {
          job: { $arrayElemAt: ["$job", 0] },
          candidate: { $arrayElemAt: ["$candidate", 0] },
        },
      },
      ...(searchMatch ? [searchMatch] : []),
      { $sort: { date: sort === "newest" ? -1 : 1, _id: sort === "newest" ? -1 : 1 } },
      {
        $facet: {
          applications: [
            { $skip: (page - 1) * limit },
            { $limit: limit },
            { $project: { _id: 1, status: 1, date: 1, job: 1, candidate: 1 } },
          ],
          metadata: [{ $count: "total" }],
        },
      },
    ]);

    const total = result?.metadata[0]?.total || 0;
    return res.status(200).json({
      success: true,
      applications: result?.applications || [],
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Unable to load applicants" });
  }
};
// Get company Posted Jobs
export const getCompanyPostedJobs = async (req, res) => {
  try {
    const companyId = req.company._id;
    const jobs = await Job.aggregate([
      { $match: { companyId } },
      { $sort: { date: -1 } },
      {
        $lookup: {
          from: "jobapplications",
          let: { jobId: "$_id" },
          pipeline: [
            { $match: { $expr: { $eq: ["$jobId", "$$jobId"] } } },
            { $count: "count" },
          ],
          as: "applications",
        },
      },
      {
        $addFields: {
          applicantCount: { $ifNull: [{ $arrayElemAt: ["$applications.count", 0] }, 0] },
        },
      },
      { $project: { applications: 0 } },
    ]);

    res.status(200).json({ success: true, jobsData: jobs });
  } catch (error) {
    res.status(500).json({ success: false, message: "Unable to load jobs" });
  }
};

// Get one company job for editing
export const getCompanyJob = async (req, res) => {
  try {
    const job = await findOwnedJob(req.params.id, req.company._id, res);
    if (!job) return;

    res.status(200).json({ success: true, job });
  } catch (error) {
    res.status(500).json({ success: false, message: "Unable to load job" });
  }
};

// Update a company job
export const updateCompanyJob = async (req, res) => {
  const { title, description, location, salary, level, category } = req.body;
  const validationError = validateJobData({ title, description, location, salary, level, category });
  if (validationError) {
    return res.status(400).json({ success: false, message: validationError });
  }

  try {
    const job = await findOwnedJob(req.params.id, req.company._id, res);
    if (!job) return;

    job.title = title.trim();
    job.description = description;
    job.location = location.trim();
    job.salary = Number(salary);
    job.level = level.trim();
    job.category = category.trim();
    await job.save();

    res.status(200).json({ success: true, job });
  } catch (error) {
    res.status(500).json({ success: false, message: "Unable to update job" });
  }
};

// Delete a company job and its related applications
export const deleteCompanyJob = async (req, res) => {
  try {
    const job = await findOwnedJob(req.params.id, req.company._id, res);
    if (!job) return;

    await Promise.all([
      JobApplication.deleteMany({ jobId: job._id, companyId: req.company._id }),
      Job.deleteOne({ _id: job._id }),
    ]);

    res.status(200).json({ success: true, message: "Job deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Unable to delete job" });
  }
};

// Duplicate a company job
export const duplicateCompanyJob = async (req, res) => {
  try {
    const job = await findOwnedJob(req.params.id, req.company._id, res);
    if (!job) return;

    const duplicatedJob = await Job.create({
      title: `${job.title} (Copy)`,
      description: job.description,
      location: job.location,
      category: job.category,
      level: job.level,
      salary: job.salary,
      date: Date.now(),
      visible: job.visible,
      companyId: req.company._id,
    });

    res.status(201).json({ success: true, job: duplicatedJob });
  } catch (error) {
    res.status(500).json({ success: false, message: "Unable to duplicate job" });
  }
};

// Get recruiter dashboard data
export const getCompanyDashboard = async (req, res) => {
  try {
    const companyId = req.company._id;

    const [jobSummary, applicationSummary, recentJobs, recentApplications] = await Promise.all([
      Job.aggregate([
        { $match: { companyId } },
        {
          $group: {
            _id: null,
            totalJobs: { $sum: 1 },
            activeJobs: { $sum: { $cond: ["$visible", 1, 0] } },
            hiddenJobs: { $sum: { $cond: ["$visible", 0, 1] } },
          },
        },
      ]),
      JobApplication.aggregate([
        { $match: { companyId } },
        {
          $group: {
            _id: null,
            totalApplications: { $sum: 1 },
            accepted: { $sum: { $cond: [{ $eq: ["$status", "Accepted"] }, 1, 0] } },
            pending: { $sum: { $cond: [{ $eq: ["$status", "Pending"] }, 1, 0] } },
            rejected: { $sum: { $cond: [{ $eq: ["$status", "Rejected"] }, 1, 0] } },
          },
        },
      ]),
      Job.aggregate([
        { $match: { companyId } },
        { $sort: { date: -1 } },
        { $limit: 5 },
        {
          $lookup: {
            from: "jobapplications",
            let: { jobId: "$_id" },
            pipeline: [
              { $match: { $expr: { $eq: ["$jobId", "$$jobId"] } } },
              { $count: "count" },
            ],
            as: "applicantCount",
          },
        },
        {
          $project: {
            title: 1,
            visible: 1,
            date: 1,
            applicantCount: { $ifNull: [{ $arrayElemAt: ["$applicantCount.count", 0] }, 0] },
          },
        },
      ]),
      JobApplication.aggregate([
        { $match: { companyId } },
        { $sort: { date: -1 } },
        { $limit: 5 },
        {
          $lookup: {
            from: "jobs",
            localField: "jobId",
            foreignField: "_id",
            pipeline: [{ $project: { title: 1 } }],
            as: "job",
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "userId",
            foreignField: "_id",
            pipeline: [{ $project: { name: 1, resume: 1, resumeUpdatedAt: 1, resumeFileName: 1, resumeSize: 1 } }],
            as: "candidate",
          },
        },
        {
          $project: {
            status: 1,
            date: 1,
            job: { $arrayElemAt: ["$job", 0] },
            candidate: { $arrayElemAt: ["$candidate", 0] },
          },
        },
      ]),
    ]);

    res.json({
      success: true,
      stats: {
        totalJobs: jobSummary[0]?.totalJobs || 0,
        activeJobs: jobSummary[0]?.activeJobs || 0,
        hiddenJobs: jobSummary[0]?.hiddenJobs || 0,
        totalApplications: applicationSummary[0]?.totalApplications || 0,
        accepted: applicationSummary[0]?.accepted || 0,
        pending: applicationSummary[0]?.pending || 0,
        rejected: applicationSummary[0]?.rejected || 0,
      },
      recentJobs,
      recentApplications,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Unable to load dashboard data" });
  }
};

// Change Job Application Status
export const ChangeJobApplicationsStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const applicationId = req.params.id || req.body.applicationId;
    const companyId = req.company._id;

    if (!applicationId || !mongoose.Types.ObjectId.isValid(applicationId)) {
      return res.status(400).json({ success: false, message: "Invalid application ID" });
    }

    if (!APPLICATION_STATUSES.includes(status)) {
      return res.status(400).json({ success: false, message: "Valid application ID and status are required" });
    }

    const existingApplication = await JobApplication.findById(applicationId).select("companyId").lean();
    if (!existingApplication) {
      return res.status(404).json({ success: false, message: "Application not found" });
    }

    if (existingApplication.companyId.toString() !== companyId.toString()) {
      return res.status(403).json({ success: false, message: "You do not have permission to manage this application" });
    }

    const application = await JobApplication.findByIdAndUpdate(
      applicationId,
      { status },
      { new: true, runValidators: true },
    );

    return res.status(200).json({
      success: true,
      message: "Status updated",
      application: { _id: application._id, status: application.status },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Unable to update application status",
    });
  }
};

// Change Job Visibility
export const changeVisibility = async (req, res) => {
  try {
    const { id } = req.body;
    const job = await findOwnedJob(id, req.company._id, res);
    if (!job) return;

    job.visible = !job.visible;
    await job.save();
    res.status(200).json({ success: true, job });
  } catch (error) {
    res.status(500).json({ success: false, message: "Unable to change hiring status" });
  }
};
