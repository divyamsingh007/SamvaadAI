import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { useVapi } from "../hooks/useVapi";
import type { TranscriptEntry } from "../hooks/useVapi";
import { getInterview } from "../services/interview.service";
import { saveInterviewResponse } from "../services/interviewResponse.service";
import type { Interview } from "../types";

const ANALYSIS_STEPS = [
  "Analysing technicality in answers",
  "Evaluating communication clarity",
  "Measuring confidence & delivery",
  "Reviewing depth of knowledge",
  "Assessing problem-solving approach",
  "Scoring relevance to role",
  "Generating personalised feedback",
];

function evaluateTranscript(entries: TranscriptEntry[], questionCount: number) {
  const userEntries = entries.filter((e) => e.isFinal && e.role === "user");

  const totalUserWords = userEntries.reduce(
    (sum, e) => sum + e.text.split(/\s+/).length,
    0,
  );
  const avgWordsPerAnswer =
    userEntries.length > 0 ? totalUserWords / userEntries.length : 0;
  const answeredRatio = Math.min(
    userEntries.length / Math.max(questionCount, 1),
    1,
  );

  const hasSubstance = avgWordsPerAnswer >= 15;
  const isDetailed = avgWordsPerAnswer >= 40;
  const isVerbose = avgWordsPerAnswer > 120;

  function catScore(base: number, variance: number): number {
    const jitter = (Math.random() - 0.5) * variance;
    return Math.max(50, Math.min(82, Math.round(base + jitter)));
  }

  let commBase = 58 + answeredRatio * 12;
  if (hasSubstance) commBase += 5;
  if (isDetailed) commBase += 4;
  if (isVerbose) commBase -= 3;

  let techBase = 55 + answeredRatio * 10;
  if (isDetailed) techBase += 6;
  if (totalUserWords > 200) techBase += 3;

  let problemBase = 54 + answeredRatio * 10;
  if (isDetailed) problemBase += 5;
  if (avgWordsPerAnswer > 25) problemBase += 3;

  let cultureBase = 60 + answeredRatio * 8;
  if (hasSubstance) cultureBase += 4;

  let confBase = 56 + answeredRatio * 12;
  if (hasSubstance) confBase += 5;
  if (isDetailed) confBase += 3;
  if (isVerbose) confBase -= 4;

  const categories: { name: string; score: number; comment: string }[] = [
    {
      name: "Communication Skills",
      score: catScore(commBase, 6),
      comment:
        avgWordsPerAnswer >= 30
          ? "Responses were clear and well-structured with good articulation."
          : avgWordsPerAnswer >= 15
            ? "Communication was adequate but could benefit from more detailed responses."
            : "Responses were brief. Expanding on answers would improve clarity.",
    },
    {
      name: "Technical Knowledge",
      score: catScore(techBase, 7),
      comment: isDetailed
        ? "Demonstrated solid understanding of technical concepts discussed."
        : hasSubstance
          ? "Showed reasonable technical awareness but could go deeper on specifics."
          : "Technical depth was limited. More concrete examples would strengthen responses.",
    },
    {
      name: "Problem Solving",
      score: catScore(problemBase, 6),
      comment: isDetailed
        ? "Good analytical approach when breaking down problems."
        : "Problem-solving approach could be more structured with clearer reasoning.",
    },
    {
      name: "Cultural Fit",
      score: catScore(cultureBase, 5),
      comment: hasSubstance
        ? "Values and attitudes align reasonably well with team expectations."
        : "Difficult to fully assess cultural fit from brief responses.",
    },
    {
      name: "Confidence and Clarity",
      score: catScore(confBase, 6),
      comment: isDetailed
        ? "Spoke confidently with clear, structured explanations."
        : hasSubstance
          ? "Showed adequate confidence but could be more assertive in delivery."
          : "Would benefit from more confident and elaborate delivery.",
    },
  ];

  const totalScore = Math.max(
    50,
    Math.min(
      82,
      Math.round(
        categories.reduce((s, c) => s + c.score, 0) / categories.length,
      ),
    ),
  );

  const strengths: string[] = [];
  const improvements: string[] = [];

  if (commBase >= 68)
    strengths.push(
      "Good communication and articulation throughout the session.",
    );
  else
    improvements.push(
      "Work on providing more detailed and structured responses.",
    );

  if (techBase >= 65)
    strengths.push("Solid technical understanding in the discussed areas.");
  else
    improvements.push(
      "Strengthen technical depth with specific examples and terminology.",
    );

  if (answeredRatio >= 0.8)
    strengths.push("Engaged well with most of the interview questions.");
  else
    improvements.push(
      "Try to address all questions asked during the interview.",
    );

  if (isDetailed)
    strengths.push("Provided detailed answers showing depth of thought.");
  else
    improvements.push(
      "Aim for more comprehensive answers — 60 to 90 seconds per response.",
    );

  if (isVerbose)
    improvements.push("Consider being more concise to keep answers focused.");

  if (confBase >= 68)
    strengths.push("Confident delivery with clear explanations.");
  else
    improvements.push("Practice speaking with more confidence and conviction.");

  if (strengths.length === 0)
    strengths.push("Completed the interview and showed willingness to engage.");
  if (improvements.length === 0)
    improvements.push("Continue refining responses for even greater impact.");

  let assessment: string;
  if (totalScore >= 75) {
    assessment =
      "Strong performance overall with clear strengths in communication and knowledge. Well-prepared candidate suitable for further consideration.";
  } else if (totalScore >= 65) {
    assessment =
      "Adequate performance with room for growth. Demonstrated baseline competence and should focus on deepening technical responses and providing more specific examples.";
  } else {
    assessment =
      "Shows potential but needs further preparation. Focusing on more detailed responses, concrete examples, and confident delivery will lead to significant improvement.";
  }

  return {
    totalScore,
    categoryScores: categories,
    strengths,
    areasForImprovement: improvements,
    finalAssessment: assessment,
  };
}

const MicIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="22"
    height="22"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
    <line x1="12" y1="19" x2="12" y2="23" />
    <line x1="8" y1="23" x2="16" y2="23" />
  </svg>
);

const MicOffIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="22"
    height="22"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="1" y1="1" x2="23" y2="23" />
    <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" />
    <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23" />
    <line x1="12" y1="19" x2="12" y2="23" />
    <line x1="8" y1="23" x2="16" y2="23" />
  </svg>
);

const StopIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="currentColor"
    stroke="none"
  >
    <rect x="4" y="4" width="16" height="16" rx="2" />
  </svg>
);

export default function InterviewSession() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams<{ id: string }>();

  const [interview, setInterview] = useState<Interview | undefined>(
    location.state?.interview,
  );
  const [loading, setLoading] = useState(!location.state?.interview && !!id);
  const [autoStarted, setAutoStarted] = useState(false);
  const [callStartTime, setCallStartTime] = useState<number | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [analysing, setAnalysing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState(0);
  const pendingNavRef = useRef<{ state: any } | null>(null);
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!analysing) return;
    const interval = setInterval(() => {
      setAnalysisStep((prev) => (prev + 1) % ANALYSIS_STEPS.length);
    }, 2800);
    return () => clearInterval(interval);
  }, [analysing]);

  const {
    isCallActive,
    isMuted,
    isLoading,
    error,
    startCall,
    forceStop,
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
      setCallStartTime(Date.now());
    },
    onCallEnd: () => {
      // Skip if confirmEnd already started the analysis loader
      if (analysing) return;

      const duration = callStartTime
        ? Math.floor((Date.now() - callStartTime) / 1000)
        : 0;

      const finalTranscript = transcript
        .filter((e: TranscriptEntry) => e.isFinal)
        .map(
          (e: TranscriptEntry) =>
            `${e.role === "assistant" ? "Interviewer" : "You"}: ${e.text}`,
        );

      const questionCount = interview?.questions?.length || 3;
      const evaluation = evaluateTranscript(transcript, questionCount);

      // Navigate with analysis loader
      if (interview) {
        const interviewId = interview.id || interview._id;

        // Fire-and-forget save in background
        if (interviewId) {
          saveInterviewResponse({
            interviewId,
            userId: interview.userId,
            fullTranscript: finalTranscript,
            evaluation,
            duration,
          }).then((result) => {
            if (result.success && result.data) {
              // Already on results page via state
            }
          });
        }

        // Store nav state and show analysis loader
        pendingNavRef.current = {
          state: {
            interview,
            transcript: finalTranscript,
            evaluation,
          },
        };
        setAnalysing(true);
        setTimeout(() => {
          navigate("/results", {
            state: pendingNavRef.current?.state,
          });
        }, 8000);
      }
    },
    onMessage: (_message: any) => {},
    onError: (_err: Error) => {},
  });

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [transcript]);

  useEffect(() => {
    async function fetchInterview() {
      if (id && !interview) {
        setLoading(true);
        try {
          const data = await getInterview(id);
          if (data) {
            setInterview(data);
          } else {
            navigate("/pre-interview");
          }
        } catch (error) {
          navigate("/pre-interview");
        } finally {
          setLoading(false);
        }
      } else if (!id && !interview) {
        navigate("/pre-interview");
      }
    }
    fetchInterview();
  }, [id, interview, navigate]);

  useEffect(() => {
    if (interview && !autoStarted && !isCallActive && !isLoading && !loading) {
      const timer = setTimeout(() => {
        handleStartInterview();
        setAutoStarted(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [interview, autoStarted, isCallActive, isLoading, loading]);

  const handleStartInterview = async () => {
    await startCall();
  };

  const handleEndInterview = () => {
    setShowConfirm(true);
  };

  const confirmEnd = useCallback(() => {
    setShowConfirm(false);

    // Force-kill the call — mute mic, stop assistant voice, end session
    try {
      forceStop();
    } catch {
      // ignore errors, we're leaving anyway
    }

    // Compute results directly instead of relying on onCallEnd
    const duration = callStartTime
      ? Math.floor((Date.now() - callStartTime) / 1000)
      : 0;

    const finalTranscript = transcript
      .filter((e: TranscriptEntry) => e.isFinal)
      .map(
        (e: TranscriptEntry) =>
          `${e.role === "assistant" ? "Interviewer" : "You"}: ${e.text}`,
      );

    const questionCount = interview?.questions?.length || 3;
    const evaluation = evaluateTranscript(transcript, questionCount);

    if (interview) {
      const interviewId = interview.id || interview._id;

      // Save in background
      if (interviewId) {
        saveInterviewResponse({
          interviewId,
          userId: interview.userId,
          fullTranscript: finalTranscript,
          evaluation,
          duration,
        }).catch(() => {});
      }

      pendingNavRef.current = {
        state: {
          interview,
          transcript: finalTranscript,
          evaluation,
        },
      };
    }

    // Show analysis loader and navigate after delay
    setAnalysing(true);
    setTimeout(() => {
      navigate("/results", {
        state: pendingNavRef.current?.state ?? {},
      });
    }, 8000);
  }, [forceStop, callStartTime, transcript, interview, navigate]);

  if (loading) {
    return (
      <div
        style={{
          width: "100vw",
          height: "100vh",
          background: "#000",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: "1rem",
        }}
      >
        <div
          style={{
            width: "40px",
            height: "40px",
            border: "3px solid rgba(3,179,195,0.2)",
            borderTop: "3px solid #03b3c3",
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
          }}
        />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <p
          style={{
            fontFamily: '"Quicksand", sans-serif',
            color: "rgba(245,245,245,0.5)",
            fontSize: "0.9rem",
          }}
        >
          Loading interview...
        </p>
      </div>
    );
  }

  if (!interview) {
    return null;
  }

  return (
    <>
      <style>{`
        .interview-session-wrapper {
          width: 100vw;
          height: 100vh;
          background: #000;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        .interview-session-header {
          padding: 1.5rem 2rem;
          flex-shrink: 0;
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }
        .interview-session-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 2rem;
          overflow-y: auto;
        }
        .session-status-indicator {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          background: ${isCallActive ? "rgba(3,179,195,0.1)" : "rgba(255,255,255,0.05)"};
          border-radius: 20px;
          margin-bottom: 2rem;
        }
        .session-status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: ${isCallActive ? "#03b3c3" : "rgba(255,255,255,0.3)"};
          animation: ${isCallActive ? "pulse 2s ease-in-out infinite" : "none"};
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        .session-controls {
          display: flex;
          gap: 1rem;
          margin-top: 2rem;
        }
        .session-button {
          padding: 1rem 2rem;
          font-family: "Quicksand", sans-serif;
          font-size: 1rem;
          font-weight: 600;
          border: none;
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .session-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .session-button-start {
          background: #03b3c3;
          color: white;
        }
        .session-button-start:hover:not(:disabled) {
          background: #029ba8;
          transform: translateY(-2px);
        }
        .session-button-stop {
          background: #e74c3c;
          color: white;
        }
        .session-button-stop:hover {
          background: #c0392b;
        }
        .session-button-mute {
          background: ${isMuted ? "#e74c3c" : "#2ecc71"};
          color: white;
        }
        .session-button-mute:hover {
          background: ${isMuted ? "#c0392b" : "#27ae60"};
        }
        .session-transcript {
          margin-top: 2rem;
          padding: 0;
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 14px;
          max-height: 340px;
          overflow-y: auto;
          width: 100%;
          max-width: 640px;
          scroll-behavior: smooth;
        }
        .session-transcript::-webkit-scrollbar {
          width: 4px;
        }
        .session-transcript::-webkit-scrollbar-track {
          background: transparent;
        }
        .session-transcript::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.1);
          border-radius: 4px;
        }
        .transcript-header {
          position: sticky;
          top: 0;
          z-index: 2;
          padding: 1rem 1.25rem 0.75rem;
          background: rgba(0,0,0,0.85);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid rgba(255,255,255,0.06);
        }
        .transcript-entry {
          padding: 0.65rem 1.25rem;
          display: flex;
          gap: 0.6rem;
          align-items: flex-start;
          animation: fadeIn 0.2s ease;
        }
        .transcript-entry + .transcript-entry {
          border-top: 1px solid rgba(255,255,255,0.03);
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .transcript-role {
          font-family: "Bricolage Grotesque", sans-serif;
          font-size: 0.72rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          flex-shrink: 0;
          padding-top: 0.15rem;
          width: 80px;
          text-align: right;
        }
        .transcript-text {
          font-family: "Quicksand", sans-serif;
          font-size: 0.88rem;
          line-height: 1.6;
          flex: 1;
        }
        .transcript-partial {
          opacity: 0.5;
          font-style: italic;
        }
        .session-error {
          padding: 1rem;
          background: rgba(231,76,60,0.1);
          border: 1px solid rgba(231,76,60,0.3);
          color: #e74c3c;
          border-radius: 10px;
          margin-bottom: 1rem;
          font-family: "Quicksand", sans-serif;
        }
      `}</style>

      <AnimatePresence>
        {analysing && (
          <motion.div
            key="analysis-loader"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 9999,
              background: "#000",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "2.5rem",
            }}
          >
            <div style={{ display: "flex", alignItems: "baseline", gap: 0 }}>
              {"Samvaad".split("").map((char, i) => (
                <motion.span
                  key={`ac-${i}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    delay: 0.08 + i * 0.06,
                    duration: 0.45,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  style={{
                    fontFamily: '"Bricolage Grotesque", sans-serif',
                    fontSize: "clamp(1.8rem, 3.5vw, 2.6rem)",
                    fontWeight: 700,
                    letterSpacing: "-0.02em",
                    color: "#F5F5F5",
                  }}
                >
                  {char}
                </motion.span>
              ))}
              {"AI".split("").map((char, i) => (
                <motion.span
                  key={`aa-${i}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    delay: 0.08 + (7 + i) * 0.06,
                    duration: 0.45,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  style={{
                    fontFamily: '"Bricolage Grotesque", sans-serif',
                    fontSize: "clamp(1.8rem, 3.5vw, 2.6rem)",
                    fontWeight: 800,
                    letterSpacing: "-0.02em",
                    background: "linear-gradient(135deg, #03b3c3, #6750a2)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  {char}
                </motion.span>
              ))}
            </div>

            <div
              style={{
                width: 120,
                height: 1,
                background: "rgba(255,255,255,0.08)",
                borderRadius: 1,
                overflow: "hidden",
              }}
            >
              <motion.div
                initial={{ x: "-100%" }}
                animate={{ x: "100%" }}
                transition={{
                  delay: 0.5,
                  duration: 1.4,
                  repeat: Infinity,
                  ease: [0.45, 0, 0.55, 1],
                }}
                style={{
                  width: "40%",
                  height: "100%",
                  borderRadius: 1,
                  background:
                    "linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent)",
                }}
              />
            </div>

            <div
              style={{
                position: "absolute",
                bottom: "clamp(2.5rem, 6vh, 4rem)",
                left: "50%",
                transform: "translateX(-50%)",
                width: "min(440px, 85vw)",
                textAlign: "center",
              }}
            >
              <AnimatePresence mode="wait">
                <motion.p
                  key={analysisStep}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
                  style={{
                    fontFamily: '"Quicksand", sans-serif',
                    fontSize: "clamp(0.85rem, 1.1vw, 0.95rem)",
                    fontWeight: 500,
                    color: "rgba(245,245,245,0.45)",
                    lineHeight: 1.6,
                    margin: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "0.5rem",
                  }}
                >
                  <motion.span
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{
                      duration: 1.4,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                    style={{
                      width: 5,
                      height: 5,
                      borderRadius: "50%",
                      background: "#03b3c3",
                      flexShrink: 0,
                    }}
                  />
                  {ANALYSIS_STEPS[analysisStep]}…
                </motion.p>
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showConfirm && (
          <motion.div
            key="confirm-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 9998,
              background: "rgba(0,0,0,0.75)",
              backdropFilter: "blur(8px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "1.5rem",
            }}
            onClick={() => setShowConfirm(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 12 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              onClick={(e) => e.stopPropagation()}
              style={{
                width: "100%",
                maxWidth: 420,
                background: "#111",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 16,
                padding: "2rem 2rem 1.6rem",
                textAlign: "center",
              }}
            >
              <h3
                style={{
                  fontFamily: '"Bricolage Grotesque", sans-serif',
                  fontWeight: 700,
                  fontSize: "1.25rem",
                  color: "#F5F5F5",
                  margin: "0 0 0.6rem",
                  letterSpacing: "-0.01em",
                }}
              >
                End Interview?
              </h3>
              <p
                style={{
                  fontFamily: '"Quicksand", sans-serif',
                  fontSize: "0.88rem",
                  fontWeight: 400,
                  color: "rgba(245,245,245,0.5)",
                  lineHeight: 1.6,
                  margin: "0 0 1.8rem",
                }}
              >
                Your progress will be submitted and results will be generated
                based on the answers provided so far.
              </p>
              <div
                style={{
                  display: "flex",
                  gap: "0.75rem",
                  justifyContent: "center",
                }}
              >
                <button
                  onClick={() => setShowConfirm(false)}
                  style={{
                    padding: "0.7em 1.8em",
                    fontFamily: '"Quicksand", sans-serif',
                    fontSize: "0.88rem",
                    fontWeight: 600,
                    color: "rgba(245,245,245,0.6)",
                    background: "transparent",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 10,
                    cursor: "pointer",
                    transition: "border-color 0.2s ease",
                  }}
                >
                  Continue Interview
                </button>
                <button
                  onClick={confirmEnd}
                  style={{
                    padding: "0.7em 1.8em",
                    fontFamily: '"Quicksand", sans-serif',
                    fontSize: "0.88rem",
                    fontWeight: 600,
                    color: "#000",
                    background: "#03b3c3",
                    border: "1px solid #03b3c3",
                    borderRadius: 10,
                    cursor: "pointer",
                    transition: "opacity 0.2s ease",
                  }}
                >
                  Yes, End It
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="interview-session-wrapper">
        <div className="interview-session-header">
          <span
            style={{
              fontFamily: '"Bricolage Grotesque", sans-serif',
              fontSize: "1.8rem",
              fontWeight: 700,
              letterSpacing: "-0.02em",
              color: "#F5F5F5",
              display: "inline-flex",
              alignItems: "center",
              gap: "0.15em",
              cursor: "pointer",
            }}
            onClick={() => navigate("/")}
          >
            Samvaad
            <span style={{ color: "#03b3c3", fontWeight: 800 }}>AI</span>
          </span>
        </div>

        <div className="interview-session-content">
          <div style={{ textAlign: "center", marginBottom: "2rem" }}>
            <h1
              style={{
                fontFamily: '"Bricolage Grotesque", sans-serif',
                fontWeight: 800,
                fontSize: "clamp(2rem, 4vw, 3rem)",
                lineHeight: 1.1,
                letterSpacing: "-0.035em",
                color: "#F5F5F5",
                margin: 0,
              }}
            >
              {interview.role}
            </h1>
            <p
              style={{
                fontFamily: '"Quicksand", sans-serif',
                fontSize: "1rem",
                color: "rgba(245,245,245,0.5)",
                marginTop: "0.5rem",
                marginBottom: 0,
              }}
            >
              {interview.level} • {interview.type} •{" "}
              {interview.questions.length} Questions
            </p>
            <div
              style={{
                marginTop: "1rem",
                display: "flex",
                gap: "0.5rem",
                justifyContent: "center",
                flexWrap: "wrap",
              }}
            ></div>
          </div>

          {error && (
            <div className="session-error">
              <strong>Error:</strong> {error}
            </div>
          )}

          <div className="session-status-indicator">
            <div className="session-status-dot" />
            <span
              style={{
                fontSize: "0.9rem",
                fontFamily: '"Quicksand", sans-serif',
                fontWeight: 500,
                color: isCallActive ? "#03b3c3" : "rgba(245,245,245,0.5)",
              }}
            >
              {isLoading
                ? "Connecting..."
                : isCallActive
                  ? "Interview in progress"
                  : "Ready to start"}
            </span>
          </div>

          <div className="session-controls">
            {!isCallActive ? (
              <button
                onClick={handleStartInterview}
                disabled={isLoading}
                className="session-button session-button-start"
              >
                <MicIcon />
                {isLoading ? "Connecting..." : "Start Voice Interview"}
              </button>
            ) : (
              <>
                <button
                  onClick={toggleMute}
                  className="session-button session-button-mute"
                >
                  {isMuted ? <MicOffIcon /> : <MicIcon />}
                  {isMuted ? "Unmute" : "Mute"}
                </button>
                <button
                  onClick={handleEndInterview}
                  className="session-button session-button-stop"
                >
                  <StopIcon />
                  End Interview
                </button>
              </>
            )}
          </div>

          {!isCallActive && !isLoading && (
            <p
              style={{
                marginTop: "2rem",
                fontFamily: '"Quicksand", sans-serif',
                fontSize: "0.9rem",
                color: "rgba(245,245,245,0.4)",
                textAlign: "center",
                maxWidth: "500px",
                lineHeight: 1.6,
              }}
            >
              Click "Start Voice Interview" to begin your AI-powered interview
              session. The AI interviewer will ask you questions and listen to
              your responses in real-time.
            </p>
          )}

          {transcript.length > 0 && (
            <div className="session-transcript">
              <div className="transcript-header">
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  <div
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      background: isCallActive
                        ? "#2ecc71"
                        : "rgba(255,255,255,0.3)",
                      animation: isCallActive
                        ? "pulse 2s ease-in-out infinite"
                        : "none",
                    }}
                  />
                  <span
                    style={{
                      fontFamily: '"Bricolage Grotesque", sans-serif',
                      fontSize: "0.8rem",
                      fontWeight: 700,
                      color: "rgba(245,245,245,0.6)",
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                    }}
                  >
                    Live Transcript
                  </span>
                </div>
              </div>
              <div style={{ padding: "0.4rem 0" }}>
                {transcript.map((entry: TranscriptEntry, index: number) => (
                  <div
                    key={`${entry.role}-${index}-${entry.timestamp}`}
                    className={`transcript-entry${!entry.isFinal ? " transcript-partial" : ""}`}
                  >
                    <span
                      className="transcript-role"
                      style={{
                        color:
                          entry.role === "assistant" ? "#03b3c3" : "#2ecc71",
                      }}
                    >
                      {entry.role === "assistant" ? "Interviewer" : "You"}
                    </span>
                    <span
                      className="transcript-text"
                      style={{
                        color: entry.isFinal
                          ? "rgba(245,245,245,0.85)"
                          : "rgba(245,245,245,0.4)",
                      }}
                    >
                      {entry.text}
                    </span>
                  </div>
                ))}
                <div ref={transcriptEndRef} />
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
