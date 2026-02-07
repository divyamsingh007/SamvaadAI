import { useNavigate } from "react-router-dom";
import CtaButton from "../components/CtaButton";

const STEPS = [
  {
    number: "01",
    title: "Upload Resume",
    description:
      "Upload your resume in PDF format so the AI can tailor questions to your experience.",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
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
    ),
  },
  {
    number: "02",
    title: "Select Role",
    description:
      "Choose the interview role you're preparing for from a list of common positions.",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#03b3c3"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
      </svg>
    ),
  },
  {
    number: "03",
    title: "Mock Interview",
    description:
      "The AI presents role-specific questions one at a time in a focused interview session.",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#03b3c3"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
  {
    number: "04",
    title: "Voice Responses",
    description:
      "Speak your answers naturally using your microphone — no typing required.",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#03b3c3"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
        <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
        <line x1="12" y1="19" x2="12" y2="23" />
        <line x1="8" y1="23" x2="16" y2="23" />
      </svg>
    ),
  },
  {
    number: "05",
    title: "Evaluation",
    description:
      "Receive an AI-generated score with strengths, improvements, and actionable feedback.",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#03b3c3"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    ),
  },
];

export default function HowItWorks() {
  const navigate = useNavigate();

  return (
    <>
      <style>{`
        .hiw-wrapper {
          width: 100vw;
          height: 100vh;
          background: #000;
          display: flex;
          flex-direction: column;
          overflow-y: hidden;
        }
        .hiw-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 0 2rem 4rem;
          overflow-y: auto;
          gap: 3rem;
        }
        .hiw-steps {
          width: 100%;
          max-width: 600px;
          display: flex;
          flex-direction: column;
          gap: 0;
        }
        .hiw-step {
          display: flex;
          gap: 1.25rem;
          align-items: flex-start;
          position: relative;
          padding-bottom: 2.2rem;
        }
        .hiw-step:last-child {
          padding-bottom: 0;
        }
        .hiw-step-line {
          position: absolute;
          left: 19px;
          top: 44px;
          bottom: 0;
          width: 1px;
          background: rgba(255,255,255,0.06);
        }
        .hiw-step:last-child .hiw-step-line {
          display: none;
        }
        @media (max-width: 768px) {
          .hiw-wrapper {
            height: auto;
            min-height: 100vh;
            overflow-y: auto;
          }
          .hiw-content {
            padding: 0 1.25rem 3rem;
            gap: 2.5rem;
          }
        }
      `}</style>

      <div className="hiw-wrapper">
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
        </div>

        <div
          style={{
            width: "100%",
            height: "1px",
            background: "rgba(255,255,255,0.06)",
            flexShrink: 0,
          }}
        />

        <div className="hiw-content">
          <div
            style={{
              textAlign: "center",
              marginTop: "2rem",
              maxWidth: "560px",
            }}
          >
            <h1
              style={{
                fontFamily: '"Bricolage Grotesque", sans-serif',
                fontWeight: 800,
                fontSize: "clamp(1.8rem, 4vw, 3rem)",
                lineHeight: 1.1,
                letterSpacing: "-0.035em",
                color: "#F5F5F5",
                margin: 0,
              }}
            >
              How It Works
            </h1>
            <p
              style={{
                fontFamily: '"Quicksand", sans-serif',
                fontSize: "clamp(0.92rem, 1.1vw, 1.05rem)",
                color: "rgba(245,245,245,0.42)",
                marginTop: "0.8rem",
                marginBottom: 0,
                fontWeight: 400,
                lineHeight: 1.7,
              }}
            >
              Five simple steps from resume upload to detailed AI feedback.
            </p>
          </div>

          <div className="hiw-steps">
            {STEPS.map((step) => (
              <div key={step.number} className="hiw-step">
                <div className="hiw-step-line" />
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: "12px",
                    border: "1px solid rgba(255,255,255,0.08)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  {step.icon}
                </div>
                <div style={{ paddingTop: "0.15rem" }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      marginBottom: "0.3rem",
                    }}
                  >
                    <span
                      style={{
                        fontFamily: '"Bricolage Grotesque", sans-serif',
                        fontSize: "0.65rem",
                        fontWeight: 600,
                        letterSpacing: "0.08em",
                        color: "#03b3c3",
                        opacity: 0.6,
                      }}
                    >
                      {step.number}
                    </span>
                    <span
                      style={{
                        fontFamily: '"Bricolage Grotesque", sans-serif',
                        fontSize: "1.05rem",
                        fontWeight: 700,
                        color: "#F5F5F5",
                        letterSpacing: "-0.01em",
                      }}
                    >
                      {step.title}
                    </span>
                  </div>
                  <p
                    style={{
                      fontFamily: '"Quicksand", sans-serif',
                      fontSize: "0.88rem",
                      fontWeight: 400,
                      lineHeight: 1.65,
                      color: "rgba(245,245,245,0.42)",
                      margin: 0,
                    }}
                  >
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "0.6rem",
            }}
          >
            <CtaButton
              text="Start Mock Interview"
              onClick={() => navigate("/pre-interview")}
            />
            <span
              style={{
                fontFamily: '"Quicksand", sans-serif',
                fontSize: "0.72rem",
                color: "rgba(245,245,245,0.22)",
                fontWeight: 400,
                letterSpacing: "0.02em",
              }}
            >
              No signup required
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
