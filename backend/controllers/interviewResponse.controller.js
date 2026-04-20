import InterviewResponse from "../models/interviewResponse.model.js";
import Interview from "../models/interview.model.js";
import { evaluateInterviewTranscript } from "../services/evaluationService.js";

// Save interview response after completion
export const saveInterviewResponse = async (req, res) => {
  const {
    interviewId,
    userId,
    qaTranscript,
    fullTranscript,
    vapiCallId,
    duration,
  } = req.body;

  let { evaluation } = req.body;

  try {
    // Validate required fields
    if (!interviewId || !userId) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: interviewId, userId",
      });
    }

    // Force AI evaluation securely on backend if transcript is provided and evaluation is empty or generic
    if (!evaluation && fullTranscript && fullTranscript.length > 0) {
      console.log(`[AI Scorer]: Evaluating transcript for interview ${interviewId}...`);
      evaluation = await evaluateInterviewTranscript(fullTranscript);
      console.log(`[AI Scorer]: Successfully generated 40+ parameter scorecard!`);
    } else if (!evaluation) {
      return res.status(400).json({
        success: false,
        message: "Transcript required for AI Evaluation",
      });
    }

    // Verify interview exists
    const interview = await Interview.findById(interviewId);
    if (!interview) {
      return res.status(404).json({
        success: false,
        message: "Interview not found",
      });
    }

    // Create interview response
    const interviewResponse = new InterviewResponse({
      interviewId,
      userId,
      qaTranscript: qaTranscript || [],
      fullTranscript: fullTranscript || [],
      vapiCallId,
      evaluation,
      duration,
      completedAt: new Date(),
    });

    await interviewResponse.save();

    // Populate interview details for response
    await interviewResponse.populate("interviewId");

    res.status(201).json({
      success: true,
      data: interviewResponse,
      message: "Interview response saved successfully",
    });
  } catch (error) {
    console.error("Error saving interview response:", error);
    res.status(500).json({
      success: false,
      message: "Error saving interview response",
      error: error.message,
    });
  }
};

// Get interview response by ID
export const getInterviewResponse = async (req, res) => {
  const { id } = req.params;

  try {
    const interviewResponse = await InterviewResponse.findById(id)
      .populate("interviewId")
      .populate("userId", "name email")
      .lean();

    if (!interviewResponse) {
      return res.status(404).json({
        success: false,
        message: "Interview response not found",
      });
    }

    res.status(200).json({
      success: true,
      data: interviewResponse,
    });
  } catch (error) {
    console.error("Error fetching interview response:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching interview response",
      error: error.message,
    });
  }
};

// Get all interview responses for a user
export const getUserInterviewResponses = async (req, res) => {
  const { userId } = { ...req.query, ...req.params };

  try {
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "userId is required",
      });
    }

    const responses = await InterviewResponse.find({ userId })
      .populate("interviewId")
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      data: responses,
    });
  } catch (error) {
    console.error("Error fetching interview responses:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching interview responses",
      error: error.message,
    });
  }
};

// Get all responses for a specific interview
export const getInterviewResponsesByInterview = async (req, res) => {
  const { interviewId } = req.params;

  try {
    const responses = await InterviewResponse.find({ interviewId })
      .populate("userId", "name email")
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      data: responses,
    });
  } catch (error) {
    console.error("Error fetching interview responses:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching interview responses",
      error: error.message,
    });
  }
};

// Delete interview response
export const deleteInterviewResponse = async (req, res) => {
  const { id } = req.params;

  try {
    const interviewResponse = await InterviewResponse.findByIdAndDelete(id);

    if (!interviewResponse) {
      return res.status(404).json({
        success: false,
        message: "Interview response not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Interview response deleted successfully",
      data: interviewResponse,
    });
  } catch (error) {
    console.error("Error deleting interview response:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting interview response",
      error: error.message,
    });
  }
};
