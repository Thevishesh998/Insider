import Job from "../models/Job.js"




//Get all jobs
export const getJobs = async (req,res) => {
     try {
        const jobs = await Job.find({visible: true}).populate({
            path: 'companyId', select: '-password'
        })

        res.json({success: true, jobs})
     } catch (error) {
        res.status(500).json({success: false, message: 'Unable to get jobs'})
     }
}


//Get a single job by ID
export const getJobByID = async (req,res) => {
      try {
        
        const {id} = req.params
        const job = await Job.findOne({_id: id, visible: true}).populate({
            path: 'companyId',
            select: '-password'
        })

        if(!job){
            return res.status(404).json({
                success: false,
                message: 'Job not found'
            })
        }

        res.json({
            success: true,
            job
        })
      } catch (error) {
        res.status(500).json({success: false, message: 'Unable to get job'})
      }
}
