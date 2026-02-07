import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import CtaButton from "../components/CtaButton";

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

  const isReady = resumeFile && role !== "";

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === "application/pdf") {
      setResumeFile(file);
    }
  };

  const handleStart = async () => {
    if (!isReady) return;
    setLoading(true);

    const formData = new FormData();
    formData.append("resume", resumeFile!);
    formData.append("role", role);
    if (experience) formData.append("experience", experience);
    if (focusArea) formData.append("focusArea", focusArea);

    await new Promise((r) => setTimeout(r, 1500));
    setLoading(false);
  };

  return (
    <>
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

          {/* Form — two-column grid on wider screens, single column on mobile */}
          <div
            style={{
              width: "100%",
              maxWidth: "640px",
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: "1.8rem 2rem",
            }}
          >
            {/* Resume Upload — spans full width */}
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

            {/* Role Selection */}
            <CustomDropdown
              label="Role *"
              placeholder="Select a role…"
              options={ROLES}
              value={role}
              onChange={setRole}
            />

            {/* Experience Level */}
            <CustomDropdown
              label="Experience"
              placeholder="Select level…"
              options={EXPERIENCE_LEVELS}
              value={experience}
              onChange={setExperience}
            />

            {/* Focus Area — spans full width */}
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

            {/* CTA — spans full width */}
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
