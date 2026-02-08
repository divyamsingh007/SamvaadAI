import { useNavigate, useLocation, useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import CtaButton from "../components/CtaButton";
import { getInterviewResponse } from "../services/interviewResponse.service";

const FALLBACK_DATA = {
  score: 67,
  summary:
    "You demonstrated solid communication skills and a reasonable understanding of your domain. Your answers showed self-awareness and structure. With more specific examples and concise delivery, you can elevate your performance further.",
  strengths: [
    "Clear and confident communication throughout the session.",
    "Good use of structured responses with logical flow.",
    "Demonstrated genuine passion for learning and growth.",
    "Self-aware about professional goals and career direction.",
  ],
  improvements: [
    "Provide more specific, quantifiable examples from past experience.",
    "Aim for more comprehensive answers — 60 to 90 seconds per response.",
    "Strengthen technical depth when discussing projects and tools.",
    "Practice the STAR method for behavioral questions.",
  ],
};

const CheckIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#03b3c3"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const AlertIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="rgba(245,245,245,0.45)"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

const sectionTitle: React.CSSProperties = {
  fontFamily: '"Bricolage Grotesque", sans-serif',
  fontSize: "0.75rem",
  fontWeight: 600,
  letterSpacing: "0.07em",
  textTransform: "uppercase",
  color: "rgba(245,245,245,0.4)",
  marginBottom: "1rem",
};

const bulletRow: React.CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  gap: "0.65rem",
  marginBottom: "0.7rem",
};

const bulletText: React.CSSProperties = {
  fontFamily: '"Quicksand", sans-serif',
  fontSize: "0.9rem",
  fontWeight: 400,
  lineHeight: 1.65,
  color: "rgba(245,245,245,0.75)",
};

export default function Results() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams<{ id: string }>();

  const [loading, setLoading] = useState(!!id);
  const [responseData, setResponseData] = useState<any>(null);

  // Fetch interview response if ID is provided
  useEffect(() => {
    async function fetchResponse() {
      if (id) {
        setLoading(true);
        try {
          const data = await getInterviewResponse(id);
          if (data) {
            setResponseData(data);
          } else {
            console.error("Interview response not found");
          }
        } catch (error) {
          console.error("Error fetching interview response:", error);
        } finally {
          setLoading(false);
        }
      }
    }
    fetchResponse();
  }, [id]);

  // Use fetched data or fallback to location state or default
  const evaluationData =
    responseData?.evaluation ||
    (location.state as any)?.evaluation ||
    FALLBACK_DATA;

  const interviewInfo =
    responseData?.interviewId || (location.state as any)?.interview;

  // Map the data structure
  const data = {
    score: evaluationData.totalScore,
    summary: evaluationData.finalAssessment,
    strengths: evaluationData.strengths || [],
    improvements: evaluationData.areasForImprovement || [],
    categoryScores: evaluationData.categoryScores || [],
  };

  const { score, summary, strengths, improvements, categoryScores } = data;

  const scoreColor =
    score >= 75 ? "#03b3c3" : score >= 62 ? "rgba(245,245,245,0.7)" : "#e2a03f";

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
          Loading results...
        </p>
      </div>
    );
  }

  return (
    <>
      <style>{`
        .results-wrapper {
          width: 100vw;
          height: 100vh;
          background: #000;
          display: flex;
          flex-direction: column;
          overflow-y: hidden;
        }
        .results-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 0 2rem 4rem;
          overflow-y: auto;
          gap: 2.5rem;
        }
        @media (max-width: 768px) {
          .results-wrapper {
            height: auto;
            min-height: 100vh;
            overflow-y: auto;
          }
          .results-content {
            padding: 0 1.25rem 3rem;
          }
        }
      `}</style>

      <div className="results-wrapper">
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
              color: "rgba(245,245,245,0.35)",
            }}
          >
            Interview Complete
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

        <div className="results-content">
          <div
            style={{
              textAlign: "center",
              marginTop: "1.5rem",
            }}
          >
            <p style={sectionTitle}>Overall Score</p>
            <span
              style={{
                fontFamily: '"Bricolage Grotesque", sans-serif',
                fontSize: "clamp(3.5rem, 8vw, 5.5rem)",
                fontWeight: 800,
                letterSpacing: "-0.04em",
                lineHeight: 1,
                color: scoreColor,
              }}
            >
              {score}
            </span>
            <span
              style={{
                fontFamily: '"Bricolage Grotesque", sans-serif',
                fontSize: "clamp(1.2rem, 2.5vw, 1.6rem)",
                fontWeight: 600,
                color: "rgba(245,245,245,0.2)",
                marginLeft: "0.15em",
              }}
            >
              / 100
            </span>
          </div>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "center",
              gap: "0.5rem 0.75rem",
              maxWidth: "540px",
            }}
          >
            {[
              { range: "78–82", label: "Excellent", color: "#03b3c3" },
              { range: "70–77", label: "Strong", color: "#03b3c3" },
              {
                range: "62–69",
                label: "Moderate",
                color: "rgba(245,245,245,0.7)",
              },
              { range: "55–61", label: "Developing", color: "#e2a03f" },
              { range: "50–54", label: "Needs Work", color: "#c0392b" },
            ].map(({ range, label, color }) => {
              const [lo, hi] = range.split("\u2013").map(Number);
              const isActive = score >= lo && score <= hi;
              return (
                <div
                  key={range}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.4rem",
                    padding: "0.35rem 0.7rem",
                    borderRadius: "8px",
                    border: `1px solid ${isActive ? color : "rgba(255,255,255,0.06)"}`,
                    background: isActive ? `${color}10` : "transparent",
                    transition: "all 0.2s ease",
                  }}
                >
                  <span
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: "50%",
                      background: color,
                      opacity: isActive ? 1 : 0.35,
                      flexShrink: 0,
                    }}
                  />
                  <span
                    style={{
                      fontFamily: '"Quicksand", sans-serif',
                      fontSize: "0.72rem",
                      fontWeight: isActive ? 600 : 400,
                      color: isActive ? color : "rgba(245,245,245,0.3)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {range} — {label}
                  </span>
                </div>
              );
            })}
          </div>

          <div
            style={{ maxWidth: "640px", width: "100%", textAlign: "center" }}
          >
            <p
              style={{
                fontFamily: '"Quicksand", sans-serif',
                fontSize: "clamp(0.92rem, 1.1vw, 1.05rem)",
                fontWeight: 400,
                lineHeight: 1.75,
                color: "rgba(245,245,245,0.5)",
                margin: 0,
              }}
            >
              {summary}
            </p>
          </div>

          {/* Category Scores */}
          {categoryScores && categoryScores.length > 0 && (
            <div
              style={{
                marginTop: "2.5rem",
                width: "100%",
                maxWidth: "800px",
              }}
            >
              <h3
                style={{
                  ...sectionTitle,
                  textAlign: "center",
                  marginBottom: "1.5rem",
                }}
              >
                Performance Breakdown
              </h3>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                  gap: "1rem",
                }}
              >
                {categoryScores.map((category: any, idx: number) => (
                  <div
                    key={idx}
                    style={{
                      padding: "1.2rem",
                      background: "rgba(255,255,255,0.02)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: "10px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "0.5rem",
                      }}
                    >
                      <span
                        style={{
                          fontFamily: '"Bricolage Grotesque", sans-serif',
                          fontSize: "0.9rem",
                          fontWeight: 600,
                          color: "#03b3c3",
                        }}
                      >
                        {category.name}
                      </span>
                      <span
                        style={{
                          fontFamily: '"Bricolage Grotesque", sans-serif',
                          fontSize: "1.1rem",
                          fontWeight: 700,
                          color:
                            category.score >= 75
                              ? "#03b3c3"
                              : category.score >= 62
                                ? "rgba(245,245,245,0.7)"
                                : "#e2a03f",
                        }}
                      >
                        {category.score}/100
                      </span>
                    </div>
                    <p
                      style={{
                        fontFamily: '"Quicksand", sans-serif',
                        fontSize: "0.85rem",
                        color: "rgba(245,245,245,0.55)",
                        lineHeight: 1.5,
                        margin: 0,
                      }}
                    >
                      {category.comment}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div
            style={{
              width: "100%",
              maxWidth: "740px",
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "2.5rem",
            }}
          >
            <div>
              <p style={sectionTitle}>Strengths</p>
              {strengths.map((s: string, i: number) => (
                <div key={i} style={bulletRow}>
                  <span style={{ marginTop: "0.2rem", flexShrink: 0 }}>
                    <CheckIcon />
                  </span>
                  <span style={bulletText}>{s}</span>
                </div>
              ))}
            </div>

            <div>
              <p style={sectionTitle}>Areas to Improve</p>
              {improvements.map((item: string, i: number) => (
                <div key={i} style={bulletRow}>
                  <span style={{ marginTop: "0.2rem", flexShrink: 0 }}>
                    <AlertIcon />
                  </span>
                  <span style={bulletText}>{item}</span>
                </div>
              ))}
            </div>
          </div>

          <p
            style={{
              fontFamily: '"Quicksand", sans-serif',
              fontSize: "0.72rem",
              fontWeight: 400,
              color: "rgba(245,245,245,0.22)",
              textAlign: "center",
              letterSpacing: "0.02em",
              maxWidth: "500px",
              lineHeight: 1.6,
              margin: 0,
            }}
          >
            This evaluation was generated by AI based on your spoken responses.
            Results are intended for practice purposes only.
          </p>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "0.8rem",
              marginBottom: "1rem",
            }}
          >
            <CtaButton
              text="Start Another Mock Interview"
              onClick={() => navigate("/pre-interview")}
            />
            <button
              onClick={() => navigate("/")}
              style={{
                fontFamily: '"Quicksand", sans-serif',
                fontSize: "0.85rem",
                fontWeight: 500,
                color: "rgba(245,245,245,0.35)",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                padding: "0.4rem 0",
                letterSpacing: "0.02em",
                transition: "color 0.2s ease",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.color = "rgba(245,245,245,0.6)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.color = "rgba(245,245,245,0.35)")
              }
            >
              Go to Home
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
