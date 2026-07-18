import Company from "../models/Company.js";
import bcrypt from "bcrypt";
import { v2 as cloudinary } from "cloudinary";
import generateToken from "../utils/generateToken.js";
import Job from "../models/Job.js";
import JobApplication from "../models/JobApplication.js";
import User from "../models/User.js";

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

  try {
    const newJob = new Job({
      title,
      description,
      location,
      salary,
      companyId,
      date: Date.now(),
      level,
      category,
    });

    await newJob.save();
    res.json({ success: true, newJob });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// Get Company Job Applicants
export const getCompanyJobApplicants = async (req, res) => {
  try {
    const companyId = req.company._id;

    const applications = await JobApplication.find({
      companyId,
    }).populate("jobId", "title location");

    const finalApplications = await Promise.all(
      applications.map(async (app) => {
        const user = await User.findOne({
          _id: String(app.userId),
        });
        console.log(user);
        return {
          ...app.toObject(),
          userId: user,
        };
      }),
    );

    res.json({
      success: true,
      applications: finalApplications,
    });
  } catch (error) {
    res.json({
      success: false,
      message: error.message,
    });
  }
};
// Get company Posted Jobs
export const getCompanyPostedJobs = async (req, res) => {
  try {
    const companyId = req.company._id;
    const jobs = await Job.find({ companyId });

    //(ToDo) Adding no. of applicants info in data
    res.json({ success: true, jobsData: jobs });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// Change Job Application Status
export const ChangeJobApplicationsStatus = async (req, res) => {
  try {
    const { applicationId, status } = req.body;
    const companyId = req.company._id;

    if (!applicationId || !["Accepted", "Rejected"].includes(status)) {
      return res.status(400).json({ success: false, message: "Valid application ID and status are required" });
    }

    const application = await JobApplication.findOneAndUpdate(
      { _id: applicationId, companyId },
      { status },
      { new: true },
    );

    if (!application) {
      return res.status(404).json({ success: false, message: "Application not found" });
    }

    res.json({
      success: true,
      message: "Status Updated",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Unable to update application status",
    });
  }
};

// Change Job Visibility
export const changeVisibility = async (req, res) => {
  try {
    const { id } = req.body;
    const companyId = req.company._id;
    const job = await Job.findById(id);

    if (companyId.toString() === job.companyId.toString()) {
      job.visible = !job.visible;
    }

    await job.save();
    res.json({ success: true, job });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};
