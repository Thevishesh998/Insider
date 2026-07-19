import multer from "multer";
const storage = multer.diskStorage({})
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (req, file, callback) => {
    if (file.mimetype !== 'application/pdf') return callback(new Error('Only PDF files are allowed'))
    callback(null, true)
  },
})

export default upload
