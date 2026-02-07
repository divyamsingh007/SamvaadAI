import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";

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

  const handleNext = async () => {
    if (!canProceed) return;
    setSubmitting(true);

    const newAnswers = [...answers, transcript.trim()];
    setAnswers(newAnswers);

    await new Promise((r) => setTimeout(r, 800));
    setSubmitting(false);

    if (isLastQuestion) {
      navigate("/results", { state: { answers: newAnswers } });
    } else {
      setCurrentIndex((prev) => prev + 1);
      setTranscript("");
    }
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
