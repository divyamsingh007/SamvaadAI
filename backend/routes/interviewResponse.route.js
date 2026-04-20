import express from "express";
import {
  saveInterviewResponse,
  getInterviewResponse,
  getUserInterviewResponses,
  getInterviewResponsesByInterview,
  deleteInterviewResponse,
} from "../controllers/interviewResponse.controller.js";

const router = express.Router();

// Save interview response
router.post("/", saveInterviewResponse);

// Get all responses for a user (query param: ?userId=...)
router.get("/", getUserInterviewResponses);

// Get all responses for a user (path param)
router.get("/user/:userId", getUserInterviewResponses);

// Get all responses for an interview
router.get("/interview/:interviewId", getInterviewResponsesByInterview);

// Delete interview response
router.delete("/:id", deleteInterviewResponse);

// Get interview response by ID (must come last — catches any :id)
router.get("/:id", getInterviewResponse);

export default router;
