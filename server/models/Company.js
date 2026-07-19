import mongoose from "mongoose";
const companySchema = new mongoose.Schema({
     name: { type: String, required: true, trim: true, maxlength: 120 },
     email: { type: String, required: true, unique: true, trim: true, lowercase: true },
     image: { type: String, required: true },
     password: { type: String, required: true },
     about: { type: String, trim: true, maxlength: 3000, default: "" },
     website: { type: String, trim: true, maxlength: 2048, default: "" },
     industry: { type: String, trim: true, maxlength: 100, default: "" },
     companySize: {
       type: String,
       enum: ["", "1-10", "11-50", "51-200", "201-500", "501-1000", "1001+"],
       default: "",
     },
     headquarters: { type: String, trim: true, maxlength: 160, default: "" },
     foundedYear: { type: Number, min: 1800, max: new Date().getFullYear(), default: null },
}, { timestamps: true })

const Company = mongoose.model('Company', companySchema)
export default Company
