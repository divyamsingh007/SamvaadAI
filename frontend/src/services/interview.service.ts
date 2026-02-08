import type { Interview } from "../types";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export interface CreateInterviewRequest {
  type: string;
  role: string;
  level: string;
  techstack: string;
  amount: number;
  userid: string;
}

export interface CreateInterviewResponse {
  success: boolean;
  data?: Interview;
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
    const response = await fetch(`${API_BASE_URL}/vapi/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
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
 * Fetches all interviews for a user
 */
export async function getUserInterviews(userId: string): Promise<Interview[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/interviews?userId=${userId}`);

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
    const response = await fetch(
      `${API_BASE_URL}/vapi/interviews/${interviewId}`,
    );

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
    const response = await fetch(`${API_BASE_URL}/interviews/${interviewId}`, {
      method: "DELETE",
    });

    return response.ok;
  } catch (error) {
    console.error("Error deleting interview:", error);
    return false;
  }
}
