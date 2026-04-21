import type { InterviewFeedback } from "../types";
import { apiFetch } from "../lib/apiFetch";

export interface SaveInterviewResponseRequest {
  interviewId: string;
  userId: string;
  qaTranscript?: Array<{
    question: string;
    answer: string;
    timestamp?: string;
  }>;
  fullTranscript?: string[];
  vapiCallId?: string;
  evaluation?: InterviewFeedback;
  duration?: number;
}

export interface InterviewResponseData {
  _id: string;
  interviewId: any;
  userId: string;
  qaTranscript: Array<{
    question: string;
    answer: string;
    timestamp: string;
  }>;
  fullTranscript: string[];
  vapiCallId?: string;
  evaluation: InterviewFeedback;
  duration?: number;
  completedAt: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Save interview response after completion
 */
export async function saveInterviewResponse(
  data: SaveInterviewResponseRequest
): Promise<{ success: boolean; data?: InterviewResponseData; message?: string }> {
  try {
    console.log("Saving interview response:", data);
    const response = await apiFetch(`/interview-responses`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log("Interview response saved:", result);
    return result;
  } catch (error) {
    console.error("Error saving interview response:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to save interview response",
    };
  }
}

/**
 * Get interview response by ID
 */
export async function getInterviewResponse(
  responseId: string
): Promise<InterviewResponseData | null> {
  try {
    console.log(`Fetching interview response with ID: ${responseId}`);
    const response = await apiFetch(`/interview-responses/${responseId}`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log("Fetched interview response:", result);
    return result.data || null;
  } catch (error) {
    console.error("Error fetching interview response:", error);
    return null;
  }
}

/**
 * Get all interview responses for a user
 */
export async function getUserInterviewResponses(
  userId: string
): Promise<InterviewResponseData[]> {
  try {
    const response = await apiFetch(`/interview-responses/user/${userId}`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result.data || [];
  } catch (error) {
    console.error("Error fetching user interview responses:", error);
    return [];
  }
}

/**
 * Delete interview response
 */
export async function deleteInterviewResponse(responseId: string): Promise<boolean> {
  try {
    const response = await apiFetch(`/interview-responses/${responseId}`, {
      method: "DELETE",
    });

    return response.ok;
  } catch (error) {
    console.error("Error deleting interview response:", error);
    return false;
  }
}
