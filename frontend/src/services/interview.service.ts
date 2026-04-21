import type { Interview } from "../types";
import { apiFetch } from "../lib/apiFetch";

export interface CreateInterviewRequest {
  type: string;
  role: string;
  level: string;
  techstack: string;
  amount: number;
  customQuestions?: string[];
}

export interface CreateInterviewResponse {
  success: boolean;
  data?: Interview;
  message?: string;
  error?: string;
}

export interface AnalyzeResumeResponse {
  success: boolean;
  data?: {
    personal_info: any;
    education: any[];
    experience: any[];
    skills: any;
    analysis: {
      ats_score: number;
      strengths: string[];
      weaknesses: string[];
    };
    interview_questions: {
      easy: string[];
      medium: string[];
      hard: string[];
    }
  };
  message?: string;
  error?: string;
}

/**
 * Creates a new interview with AI-generated questions
 */
export async function createInterview(
  data: CreateInterviewRequest,
): Promise<CreateInterviewResponse> {
  try {
    const response = await apiFetch(`/vapi/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      console.error("Backend error payload:", errData);
      throw new Error(`HTTP error! status: ${response.status} - ${errData.message || ''}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error creating interview:", error);
    return {
      success: false,
      message: "Failed to create interview",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Uploads a resume PDF to be analyzed by the Gemini AI endpoint
 */
export async function analyzeResume(file: File): Promise<AnalyzeResumeResponse> {
  try {
    const formData = new FormData();
    formData.append("resume", file);

    const response = await apiFetch(`/resume/analyze`, {
      method: "POST",
      body: formData, // No Content-Type header needed for FormData; browser sets it with boundary
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      console.error("Backend error payload:", errData);
      throw new Error(`HTTP error! status: ${response.status} - ${errData.message || ''}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error analyzing resume:", error);
    return {
      success: false,
      message: "Failed to analyze resume",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Fetches all interviews for a user
 */
export async function getUserInterviews(userId: string): Promise<Interview[]> {
  try {
    const response = await apiFetch(`/interviews?userId=${userId}`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error("Error fetching interviews:", error);
    return [];
  }
}

/**
 * Fetches a specific interview by ID
 */
export async function getInterview(
  interviewId: string,
): Promise<Interview | null> {
  try {
    const response = await apiFetch(`/vapi/interviews/${interviewId}`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();

    const interview = result.data;
    if (interview && interview._id) {
      interview.id = interview._id;
    }

    return interview || null;
  } catch (error) {
    console.error("Error fetching interview:", error);
    return null;
  }
}

/**
 * Deletes an interview
 */
export async function deleteInterview(interviewId: string): Promise<boolean> {
  try {
    const response = await apiFetch(`/interviews/${interviewId}`, {
      method: "DELETE",
    });

    return response.ok;
  } catch (error) {
    console.error("Error deleting interview:", error);
    return false;
  }
}
