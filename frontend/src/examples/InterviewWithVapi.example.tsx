/**
 * Example: How to integrate Vapi AI into Interview.tsx
 * 
 * This file shows how to use the useVapi hook in your Interview component.
 * Copy the relevant parts into your actual Interview.tsx file.
 */

import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useVapi } from "../hooks/useVapi";
import type { Interview } from "../types";

export default function InterviewExample() {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get interview data from navigation state
  const interview = location.state?.interview as Interview | undefined;

  // Local state
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [conversationHistory, setConversationHistory] = useState<string[]>([]);

  // Initialize Vapi hook
  const {
    isCallActive,
    isMuted,
    isLoading,
    error,
    startCall,
    stopCall,
    toggleMute,
    transcript,
  } = useVapi({
    interview: interview || {
      id: "fallback",
      userId: "demo",
      role: "Software Engineer",
      type: "Technical",
      techstack: ["React", "TypeScript"],
      level: "Mid-Level",
      questions: [
        "Tell me about yourself and your professional background.",
        "What are your key technical strengths?",
        "Describe a challenging project you worked on.",
      ],
      finalized: true,
      createdAt: new Date().toISOString(),
    },
    onCallStart: () => {
      console.log("Interview started");
    },
    onCallEnd: () => {
      console.log("Interview ended");
      // Navigate to results page
      navigate("/results", {
        state: {
          interview,
          transcript: conversationHistory,
        },
      });
    },
    onMessage: (message: any) => {
      console.log("Message received:", message);
      
      // Handle different message types
      if (message.type === "transcript") {
        setConversationHistory((prev) => [...prev, message.text]);
      }
      
      if (message.type === "function-call" && message.function.name === "nextQuestion") {
        setCurrentQuestionIndex((prev) => prev + 1);
      }
    },
    onError: (err: Error) => {
      console.error("Vapi error:", err);
    },
  });

  // Redirect if no interview data
  useEffect(() => {
    if (!interview) {
      console.warn("No interview data found, redirecting to pre-interview");
      navigate("/pre-interview");
    }
  }, [interview, navigate]);

  const handleStartInterview = async () => {
    await startCall();
  };

  const handleEndInterview = () => {
    stopCall();
  };

  if (!interview) {
    return null; // Will redirect
  }

  return (
    <div style={{ padding: "2rem" }}>
      {/* Header */}
      <div style={{ marginBottom: "2rem" }}>
        <h1>Mock Interview</h1>
        <p>Role: {interview.role}</p>
        <p>Level: {interview.level}</p>
        <p>Tech Stack: {interview.techstack.join(", ")}</p>
      </div>

      {/* Error Display */}
      {error && (
        <div style={{ 
          padding: "1rem", 
          background: "#ff000020", 
          color: "#ff6b6b",
          borderRadius: "8px",
          marginBottom: "1rem"
        }}>
          Error: {error}
        </div>
      )}

      {/* Current Question */}
      <div style={{ marginBottom: "2rem" }}>
        <h3>Question {currentQuestionIndex + 1} of {interview.questions.length}</h3>
        <p style={{ fontSize: "1.2rem" }}>
          {interview.questions[currentQuestionIndex]}
        </p>
      </div>

      {/* Controls */}
      <div style={{ display: "flex", gap: "1rem", marginBottom: "2rem" }}>
        {!isCallActive ? (
          <button
            onClick={handleStartInterview}
            disabled={isLoading}
            style={{
              padding: "1rem 2rem",
              fontSize: "1rem",
              background: "#03b3c3",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: isLoading ? "not-allowed" : "pointer",
              opacity: isLoading ? 0.6 : 1,
            }}
          >
            {isLoading ? "Starting..." : "Start Interview"}
          </button>
        ) : (
          <>
            <button
              onClick={toggleMute}
              style={{
                padding: "1rem 2rem",
                fontSize: "1rem",
                background: isMuted ? "#e74c3c" : "#2ecc71",
                color: "white",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
              }}
            >
              {isMuted ? "Unmute" : "Mute"}
            </button>
            <button
              onClick={handleEndInterview}
              style={{
                padding: "1rem 2rem",
                fontSize: "1rem",
                background: "#e74c3c",
                color: "white",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
              }}
            >
              End Interview
            </button>
          </>
        )}
      </div>

      {/* Status Indicator */}
      <div style={{ marginBottom: "2rem" }}>
        <div style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "0.5rem",
          padding: "0.5rem 1rem",
          background: isCallActive ? "#2ecc7120" : "#95a5a620",
          borderRadius: "20px",
        }}>
          <div style={{
            width: "8px",
            height: "8px",
            borderRadius: "50%",
            background: isCallActive ? "#2ecc71" : "#95a5a6",
          }} />
          <span style={{ fontSize: "0.9rem" }}>
            {isCallActive ? "Interview in progress" : "Interview paused"}
          </span>
        </div>
      </div>

      {/* Transcript */}
      {transcript.length > 0 && (
        <div style={{
          marginTop: "2rem",
          padding: "1rem",
          background: "#f5f5f510",
          borderRadius: "8px",
          maxHeight: "300px",
          overflowY: "auto",
        }}>
          <h3 style={{ marginBottom: "1rem" }}>Transcript</h3>
          {transcript.map((entry: any, index: number) => (
            <p key={index} style={{ 
              marginBottom: "0.5rem",
              fontSize: "0.9rem",
              lineHeight: 1.6,
            }}>
              {entry.text || typeof entry === 'string' ? entry : ''}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Key Integration Points:
 * 
 * 1. Import the useVapi hook:
 *    import { useVapi } from "@/hooks/useVapi";
 * 
 * 2. Get interview data from navigation state:
 *    const interview = location.state?.interview as Interview;
 * 
 * 3. Initialize the hook with your interview:
 *    const { isCallActive, startCall, stopCall } = useVapi({ interview, ... });
 * 
 * 4. Call startCall() when user clicks "Start Interview"
 * 
 * 5. Call stopCall() when user clicks "End Interview" or navigate away
 * 
 * 6. Handle the transcript and messages as they come in
 * 
 * 7. Navigate to results page with transcript data when interview ends
 */
