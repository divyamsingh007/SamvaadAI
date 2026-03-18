import express from "express";
import multer from "multer";
import { uploadAndAnalyzeResume } from "../controllers/resumeController.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

// Setup Multer to store the uploaded files temporarily in '/tmp' or a simple 'uploads' folder
const upload = multer({ dest: 'uploads/' });

// Apply JWT protection (optional, assuming we want authenticated users only to upload resumes)
// Removed protect middleware here temporarily during the hackathon if ease of use is prioritized,
// but adding it back is recommended for production.
router.post("/analyze", upload.single("resume"), uploadAndAnalyzeResume);

export default router;
