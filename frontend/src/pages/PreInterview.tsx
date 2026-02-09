import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import CtaButton from "../components/CtaButton";
import { createInterview } from "../services/interview.service";

const INTERVIEW_TIPS = [
  "Take a moment to structure your answer before speaking.",
  "Use the STAR method — Situation, Task, Action, Result.",
  "It's okay to pause and think. Silence beats rambling.",
  "Speak to the interviewer, not at them. Be conversational.",
  "Quantify your impact wherever possible.",
  "Ask clarifying questions — it shows critical thinking.",
  "Keep answers concise. Aim for 60–90 seconds per response.",
  "Show enthusiasm for the role. Energy is contagious.",
  "Relate your experience directly to the job requirements.",
  "End each answer confidently — don't trail off.",
];

const UploadIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="28"
    height="28"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#03b3c3"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </svg>
);

const ChevronIcon = ({ open }: { open: boolean }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="rgba(245,245,245,0.4)"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{
      transition: "transform 0.2s ease",
      transform: open ? "rotate(180deg)" : "rotate(0deg)",
      flexShrink: 0,
    }}
  >
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

function CustomDropdown({
  label,
  placeholder,
  options,
  value,
  onChange,
}: {
  label: string;
  placeholder: string;
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) close();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [close]);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <label style={labelStyle}>{label}</label>
      <div
        role="button"
        tabIndex={0}
        onClick={() => setOpen((p) => !p)}
        onKeyDown={(e) => e.key === "Enter" && setOpen((p) => !p)}
        style={{
          ...inputBase,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          cursor: "pointer",
          color: value ? "#F5F5F5" : "rgba(245,245,245,0.35)",
          borderColor: open ? "rgba(3,179,195,0.45)" : "rgba(255,255,255,0.1)",
        }}
      >
        <span
          style={{
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {value || placeholder}
        </span>
        <ChevronIcon open={open} />
      </div>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            left: 0,
            right: 0,
            background: "#111",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "10px",
            padding: "0.35rem 0",
            zIndex: 50,
            maxHeight: "220px",
            overflowY: "auto",
            animation: "dropIn 0.15s ease",
          }}
        >
          {options.map((opt) => (
            <div
              key={opt}
              role="option"
              aria-selected={value === opt}
              onClick={() => {
                onChange(opt);
                close();
              }}
              style={{
                padding: "0.6rem 1rem",
                fontFamily: '"Quicksand", sans-serif',
                fontSize: "0.88rem",
                fontWeight: 500,
                color: value === opt ? "#03b3c3" : "rgba(245,245,245,0.75)",
                cursor: "pointer",
                transition: "background 0.15s ease, color 0.15s ease",
                background:
                  value === opt ? "rgba(3,179,195,0.08)" : "transparent",
              }}
              onMouseEnter={(e) => {
                if (value !== opt)
                  e.currentTarget.style.background = "rgba(255,255,255,0.05)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background =
                  value === opt ? "rgba(3,179,195,0.08)" : "transparent";
              }}
            >
              {opt}
            </div>
          ))}
        </div>
      )}

      <style>{`
        @keyframes dropIn {
          from { opacity: 0; transform: translateY(-4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

const inputBase: React.CSSProperties = {
  width: "100%",
  padding: "0.8rem 1rem",
  fontFamily: '"Quicksand", sans-serif',
  fontSize: "0.9rem",
  fontWeight: 500,
  color: "#F5F5F5",
  background: "transparent",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: "10px",
  outline: "none",
  transition: "border-color 0.2s ease",
  appearance: "none" as const,
};

const labelStyle: React.CSSProperties = {
  fontFamily: '"Bricolage Grotesque", sans-serif',
  fontSize: "0.8rem",
  fontWeight: 600,
  color: "rgba(245,245,245,0.5)",
  marginBottom: "0.5rem",
  display: "block",
  letterSpacing: "0.06em",
  textTransform: "uppercase",
};

const ROLES = [
  "Frontend Developer",
  "Backend Developer",
  "Full-Stack Developer",
  "Data Analyst",
  "Machine Learning Engineer",
  "DevOps Engineer",
  "Product Manager",
];

const EXPERIENCE_LEVELS = ["Fresher", "1-2 Years", "3-5 Years", "5+ Years"];

export default function PreInterview() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [role, setRole] = useState("");
  const [experience, setExperience] = useState("");
  const [focusArea, setFocusArea] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [tipIndex, setTipIndex] = useState(() =>
    Math.floor(Math.random() * INTERVIEW_TIPS.length),
  );

  useEffect(() => {
    if (!loading) return;
    const interval = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % INTERVIEW_TIPS.length);
    }, 3500);
    return () => clearInterval(interval);
  }, [loading]);

  const isReady = resumeFile && role !== "";

  const experienceToLevel: Record<string, string> = {
    Fresher: "Junior",
    "1-2 Years": "Junior",
    "3-5 Years": "Mid-Level",
    "5+ Years": "Senior",
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === "application/pdf") {
      setResumeFile(file);
    }
  };

  const handleStart = async () => {
    if (!isReady) return;
    setError("");
    setLoading(true);

    try {
      const response = await createInterview({
        type: "Technical",
        role,
        level: experienceToLevel[experience] || "Mid-Level",
        techstack: focusArea || role,
        amount: 5,
        userid: "698656a085972488d244dff3",
      });

      if (response.success && response.data) {
        const interviewId = response.data._id || response.data.id;
        navigate(`/interview/${interviewId}`);
      } else {
        setError(response.message || "Failed to create interview");
        setLoading(false);
      }
    } catch (err) {
      setError("An error occurred while creating the interview");
      setLoading(false);
    }
  };

  return (
    <>
      <AnimatePresence>
        {loading && (
          <motion.div
            key="interview-loader"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
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
                  key={`lc-${i}`}
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
                  key={`la-${i}`}
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

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7, duration: 0.5 }}
              style={{
                fontFamily: '"Quicksand", sans-serif',
                fontSize: "0.85rem",
                fontWeight: 500,
                color: "rgba(245,245,245,0.4)",
                letterSpacing: "0.08em",
                textTransform: "uppercase" as const,
                margin: 0,
              }}
            >
              Preparing your interview…
            </motion.p>

            {/* Minimal white shimmer bar */}
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
                bottom: "clamp(2rem, 6vh, 4rem)",
                left: "50%",
                transform: "translateX(-50%)",
                width: "min(480px, 85vw)",
                textAlign: "center",
              }}
            >
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1, duration: 0.5 }}
                style={{
                  fontFamily: '"Quicksand", sans-serif',
                  fontSize: "0.7rem",
                  fontWeight: 600,
                  color: "rgba(3,179,195,0.5)",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase" as const,
                  marginBottom: "0.6rem",
                }}
              >
                Interview Tip
              </motion.p>
              <AnimatePresence mode="wait">
                <motion.p
                  key={tipIndex}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
                  style={{
                    fontFamily: '"Quicksand", sans-serif',
                    fontSize: "clamp(0.88rem, 1.1vw, 1rem)",
                    fontWeight: 400,
                    color: "rgba(245,245,245,0.55)",
                    lineHeight: 1.6,
                    margin: 0,
                  }}
                >
                  "{INTERVIEW_TIPS[tipIndex]}"
                </motion.p>
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .pre-interview-wrapper {
          position: relative;
          width: 100vw;
          height: 100vh;
          background: #000;
          display: flex;
          flex-direction: column;
          overflow-y: hidden;
        }
        .pre-interview-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 0 2rem 4rem;
          overflow-y: hidden;
        }
        @media (max-width: 768px) {
          .pre-interview-wrapper {
            height: auto;
            min-height: 100vh;
            overflow-y: auto;
          }
          .pre-interview-content {
            overflow-y: auto;
            justify-content: flex-start;
            padding-top: 1rem;
          }
        }
      `}</style>
      <div className="pre-interview-wrapper">
        <div style={{ padding: "1.5rem 2rem", flexShrink: 0 }}>
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

        <div className="pre-interview-content">
          {error && (
            <div
              style={{
                maxWidth: "640px",
                width: "100%",
                padding: "1rem",
                marginBottom: "1.5rem",
                background: "rgba(231,76,60,0.1)",
                border: "1px solid rgba(231,76,60,0.3)",
                borderRadius: "10px",
                color: "#e74c3c",
                fontFamily: '"Quicksand", sans-serif',
                fontSize: "0.9rem",
              }}
            >
              {error}
            </div>
          )}
          <div style={{ textAlign: "center", marginBottom: "3rem" }}>
            <h1
              style={{
                fontFamily: '"Bricolage Grotesque", sans-serif',
                fontWeight: 800,
                fontSize: "clamp(2rem, 4.5vw, 3.5rem)",
                lineHeight: 1.08,
                letterSpacing: "-0.035em",
                color: "#F5F5F5",
                margin: 0,
              }}
            >
              Set Up Your Interview
            </h1>
            <p
              style={{
                fontFamily: '"Quicksand", sans-serif',
                fontSize: "clamp(0.95rem, 1.2vw, 1.1rem)",
                color: "rgba(245,245,245,0.45)",
                marginTop: "0.8rem",
                marginBottom: 0,
                fontWeight: 400,
                lineHeight: 1.7,
                letterSpacing: "0.01em",
              }}
            >
              Upload your resume, pick a role, and start practicing in seconds.
            </p>
          </div>

          <div
            style={{
              width: "100%",
              maxWidth: "640px",
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: "1.8rem 2rem",
            }}
          >
            {" "}
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={labelStyle}>Resume</label>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,application/pdf"
                onChange={handleFileChange}
                style={{ display: "none" }}
              />
              <div
                onClick={() => fileInputRef.current?.click()}
                style={{
                  width: "100%",
                  padding: "1.4rem 1rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.75rem",
                  border: `1px dashed ${resumeFile ? "#03b3c3" : "rgba(255,255,255,0.12)"}`,
                  borderRadius: "10px",
                  background: "transparent",
                  cursor: "pointer",
                  transition: "border-color 0.25s ease",
                }}
              >
                <UploadIcon />
                <span
                  style={{
                    fontFamily: '"Quicksand", sans-serif',
                    fontSize: "0.9rem",
                    color: resumeFile ? "#03b3c3" : "rgba(245,245,245,0.4)",
                    fontWeight: 500,
                  }}
                >
                  {resumeFile ? resumeFile.name : "Click to upload PDF"}
                </span>
              </div>
            </div>
            <CustomDropdown
              label="Role *"
              placeholder="Select a role…"
              options={ROLES}
              value={role}
              onChange={setRole}
            />
            <CustomDropdown
              label="Experience"
              placeholder="Select level…"
              options={EXPERIENCE_LEVELS}
              value={experience}
              onChange={setExperience}
            />
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={labelStyle}>Focus Area</label>
              <input
                type="text"
                placeholder="e.g. React, System Design, SQL…"
                value={focusArea}
                onChange={(e) => setFocusArea(e.target.value)}
                style={inputBase}
                onFocus={(e) =>
                  (e.currentTarget.style.borderColor = "rgba(3,179,195,0.45)")
                }
                onBlur={(e) =>
                  (e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)")
                }
              />
            </div>
            <div
              style={{
                gridColumn: "1 / -1",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "0.8rem",
                marginTop: "0.5rem",
                opacity: isReady && !loading ? 1 : 0.4,
                pointerEvents: isReady && !loading ? "auto" : "none",
                transition: "opacity 0.25s ease",
              }}
            >
              <CtaButton
                text={loading ? "Preparing Interview…" : "Start Mock Interview"}
                onClick={handleStart}
              />
              <span
                style={{
                  fontFamily: '"Quicksand", sans-serif',
                  fontSize: "0.75rem",
                  color: "rgba(245,245,245,0.28)",
                  fontWeight: 400,
                  letterSpacing: "0.02em",
                }}
              >
                Your resume is processed securely and never stored.
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
