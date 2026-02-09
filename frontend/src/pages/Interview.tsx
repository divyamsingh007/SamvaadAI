import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";

const ANALYSIS_STEPS = [
  "Analysing technicality in answers",
  "Evaluating communication clarity",
  "Measuring confidence & delivery",
  "Reviewing depth of knowledge",
  "Assessing problem-solving approach",
  "Scoring relevance to role",
  "Generating personalised feedback",
];

const QUESTIONS = [
  "Tell me about yourself and your professional background.",
  "What are your key technical strengths and how have you applied them?",
  "Describe a challenging project you worked on. What was your role and how did you handle it?",
  "How do you stay updated with the latest trends and technologies in your field?",
  "Where do you see yourself in the next three years?",
];

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

const ArrowRightIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);

export default function Interview() {
  const navigate = useNavigate();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [transcript, setTranscript] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [answers, setAnswers] = useState<string[]>([]);
  const [showConfirm, setShowConfirm] = useState(false);
  const [analysing, setAnalysing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState(0);

  useEffect(() => {
    if (!analysing) return;
    const interval = setInterval(() => {
      setAnalysisStep((prev) => (prev + 1) % ANALYSIS_STEPS.length);
    }, 2800);
    return () => clearInterval(interval);
  }, [analysing]);

  const recognitionRef = useRef<any>(null);
  const totalQuestions = QUESTIONS.length;
  const isLastQuestion = currentIndex === totalQuestions - 1;
  const canProceed =
    transcript.trim().length > 0 && !isListening && !submitting;

  const startListening = useCallback(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Your browser does not support Speech Recognition.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    let finalTranscript = "";

    recognition.onresult = (event: any) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += t + " ";
        } else {
          interim = t;
        }
      }
      setTranscript(finalTranscript + interim);
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }, []);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  useEffect(() => {
    return () => recognitionRef.current?.stop();
  }, []);

  const goToResults = useCallback(
    (finalAnswers: string[]) => {
      setAnalysing(true);
      setTimeout(() => {
        navigate("/results", { state: { answers: finalAnswers } });
      }, 4000);
    },
    [navigate],
  );

  const handleNext = async () => {
    if (!canProceed) return;
    setSubmitting(true);

    const newAnswers = [...answers, transcript.trim()];
    setAnswers(newAnswers);

    await new Promise((r) => setTimeout(r, 800));
    setSubmitting(false);

    if (isLastQuestion) {
      goToResults(newAnswers);
    } else {
      setCurrentIndex((prev) => prev + 1);
      setTranscript("");
    }
  };

  const handleEndInterview = () => {
    if (isListening) stopListening();
    setShowConfirm(true);
  };

  const confirmEnd = () => {
    setShowConfirm(false);
    const finalAnswers = transcript.trim()
      ? [...answers, transcript.trim()]
      : [...answers];
    setAnswers(finalAnswers);
    goToResults(finalAnswers);
  };

  const progress = ((currentIndex + 1) / totalQuestions) * 100;

  return (
    <>
      <style>{`
        .interview-wrapper {
          width: 100vw;
          height: 100vh;
          background: #000;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        .interview-main {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 0 2rem 2rem;
          gap: 2rem;
          overflow-y: hidden;
        }
        @media (max-width: 768px) {
          .interview-wrapper {
            height: auto;
            min-height: 100vh;
            overflow-y: auto;
          }
          .interview-main {
            overflow-y: auto;
            justify-content: flex-start;
            padding-top: 1.5rem;
            padding-bottom: 3rem;
          }
        }
        @keyframes pulse-ring {
          0% { transform: scale(1); opacity: 0.5; }
          100% { transform: scale(1.6); opacity: 0; }
        }
      `}</style>

      {/* ── Analysis loader ── */}
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
            {/* Brand reveal */}
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

            {/* White shimmer bar */}
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

            {/* Analysis step text */}
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

      {/* ── Confirmation modal ── */}
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

      <div className="interview-wrapper">
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "1.2rem 2rem",
            flexShrink: 0,
          }}
        >
          <span
            style={{
              fontFamily: '"Bricolage Grotesque", sans-serif',
              fontSize: "1.6rem",
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

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "1.2rem",
            }}
          >
            <span
              style={{
                fontFamily: '"Bricolage Grotesque", sans-serif',
                fontSize: "0.8rem",
                fontWeight: 600,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                color: "rgba(245,245,245,0.4)",
              }}
            >
              Question {currentIndex + 1}{" "}
              <span style={{ color: "rgba(245,245,245,0.2)" }}>
                / {totalQuestions}
              </span>
            </span>

            <button
              onClick={handleEndInterview}
              style={{
                padding: "0.45em 1.2em",
                fontFamily: '"Quicksand", sans-serif',
                fontSize: "0.75rem",
                fontWeight: 600,
                letterSpacing: "0.03em",
                color: "rgba(245,245,245,0.45)",
                background: "transparent",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 8,
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "rgba(231,76,60,0.4)";
                e.currentTarget.style.color = "#e74c3c";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
                e.currentTarget.style.color = "rgba(245,245,245,0.45)";
              }}
            >
              End Interview
            </button>
          </div>
        </div>

        <div style={{ padding: "0 2rem", flexShrink: 0 }}>
          <div
            style={{
              width: "100%",
              height: "3px",
              background: "rgba(255,255,255,0.06)",
              borderRadius: "2px",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${progress}%`,
                height: "100%",
                background: "#03b3c3",
                borderRadius: "2px",
                transition: "width 0.4s ease",
              }}
            />
          </div>
        </div>

        <div className="interview-main">
          <div
            style={{
              width: "100%",
              maxWidth: "680px",
              textAlign: "center",
            }}
          >
            <h2
              style={{
                fontFamily: '"Bricolage Grotesque", sans-serif',
                fontWeight: 800,
                fontSize: "clamp(1.4rem, 3vw, 2rem)",
                lineHeight: 1.25,
                letterSpacing: "-0.025em",
                color: "#F5F5F5",
                margin: 0,
              }}
            >
              {QUESTIONS[currentIndex]}
            </h2>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "0.8rem",
            }}
          >
            <div style={{ position: "relative", display: "inline-flex" }}>
              {isListening && (
                <div
                  style={{
                    position: "absolute",
                    inset: -6,
                    borderRadius: "50%",
                    border: "2px solid #03b3c3",
                    animation: "pulse-ring 1.4s ease-out infinite",
                    pointerEvents: "none",
                  }}
                />
              )}
              <button
                onClick={isListening ? stopListening : startListening}
                disabled={submitting}
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: "50%",
                  border: `2px solid ${isListening ? "#03b3c3" : "rgba(255,255,255,0.12)"}`,
                  background: isListening
                    ? "rgba(3,179,195,0.12)"
                    : "transparent",
                  color: isListening ? "#03b3c3" : "rgba(245,245,245,0.5)",
                  cursor: submitting ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.25s ease",
                  opacity: submitting ? 0.4 : 1,
                }}
              >
                {isListening ? <StopIcon /> : <MicIcon />}
              </button>
            </div>
            <span
              style={{
                fontFamily: '"Quicksand", sans-serif',
                fontSize: "0.75rem",
                fontWeight: 500,
                color: isListening ? "#03b3c3" : "rgba(245,245,245,0.3)",
                letterSpacing: "0.04em",
                textTransform: "uppercase",
              }}
            >
              {isListening ? "Listening…" : "Tap to speak"}
            </span>
          </div>

          <div style={{ width: "100%", maxWidth: "680px" }}>
            <label
              style={{
                fontFamily: '"Bricolage Grotesque", sans-serif',
                fontSize: "0.75rem",
                fontWeight: 600,
                color: "rgba(245,245,245,0.4)",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                display: "block",
                marginBottom: "0.5rem",
              }}
            >
              Your Answer
            </label>
            <div
              style={{
                width: "100%",
                minHeight: "120px",
                maxHeight: "200px",
                overflowY: "auto",
                padding: "1rem",
                fontFamily: '"Quicksand", sans-serif',
                fontSize: "0.92rem",
                fontWeight: 400,
                lineHeight: 1.75,
                color: transcript ? "#F5F5F5" : "rgba(245,245,245,0.25)",
                background: "transparent",
                border: `1px solid ${isListening ? "rgba(3,179,195,0.35)" : "rgba(255,255,255,0.08)"}`,
                borderRadius: "12px",
                transition: "border-color 0.25s ease",
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
              }}
            >
              {transcript || "Your spoken answer will appear here…"}
            </div>
          </div>

          <button
            onClick={handleNext}
            disabled={!canProceed}
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.5em",
              padding: "0.85em 2.2em",
              fontFamily: '"Quicksand", sans-serif',
              fontSize: "1rem",
              fontWeight: 600,
              letterSpacing: "0.02em",
              color: canProceed ? "#03b3c3" : "rgba(245,245,245,0.25)",
              background: "transparent",
              border: `1.5px solid ${canProceed ? "#03b3c3" : "rgba(255,255,255,0.08)"}`,
              borderRadius: "14px",
              cursor: canProceed ? "pointer" : "not-allowed",
              transition: "all 0.25s ease",
              opacity: submitting ? 0.5 : 1,
            }}
          >
            {submitting
              ? "Saving…"
              : isLastQuestion
                ? "Finish Interview"
                : "Next Question"}
            {!submitting && <ArrowRightIcon />}
          </button>
        </div>
      </div>
    </>
  );
}
