import express from "express";
import { 
  generatePost, 
  generateGet,
  getUserInterviews,
  getInterview,
  deleteInterview 
} from "../controllers/vapi.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

// Generate interview questions
router.post("/generate", generatePost);
router.get("/generate", generateGet); // Optional: A simple GET endpoint to test if the route is working

// Interview CRUD operations
router.get("/interviews", getUserInterviews);
router.get("/interviews/:id",protect, getInterview);
router.delete("/interviews/:id", deleteInterview);

export default router;
