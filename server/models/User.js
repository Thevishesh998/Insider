import mongoose from "mongoose";
const userSchema = new mongoose.Schema({
    _id: {type:String,required:true},
    name: {type:String,required:true},
    email: {type:String, required:true, unique:true},
    resume: {type:String},
    resumeUpdatedAt: { type: Date },
    resumeOriginalName: { type: String, default: "" },
    resumeFileName: { type: String, default: "" },
    resumeSize: { type: Number, min: 0, default: 0 },
    image: {type:String, required:true},
    candidateSkills: [{ type: String }],
    manualSkills: [{ type: String }],
    manualSkillsConfigured: { type: Boolean, default: false },
    primaryRole: { type: String, default: "" },
    primaryCategory: { type: String, default: "" },
    preferredLocation: { type: String, default: "" },
    experienceLevel: { type: String, default: "" },
    phone: { type: String, default: "" },
    education: { type: String, default: "" },
    savedJobs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Job' }]
})

const User = mongoose.model('User', userSchema)
export default User;
