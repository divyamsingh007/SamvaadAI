import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createInterview } from "../services/interview.service";

const INTERVIEW_TYPES = ["Technical", "Behavioral", "Mixed"];
const EXPERIENCE_LEVELS = ["Junior", "Mid-Level", "Senior", "Lead"];

export default function PreVapiInterview() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    role: "",
    type: "Technical",
    level: "Mid-Level",
    techstack: "",
    amount: "5",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validation
    if (!formData.role.trim()) {
      setError("Please enter a job role");
      return;
    }
    if (!formData.techstack.trim()) {
      setError("Please enter at least one technology");
      return;
    }

    setLoading(true);

    try {
      const response = await createInterview({
        type: formData.type,
        role: formData.role,
        level: formData.level,
        techstack: formData.techstack,
        amount: parseInt(formData.amount),
        userid: "698656a085972488d244dff3", // Hardcoded user ID
      });

      if (response.success && response.data) {
        // Redirect to vapi-interview with the interview ID
        const interviewId = response.data._id || response.data.id;
        navigate(`/vapi-interview/${interviewId}`);
      } else {
        setError(response.message || "Failed to create interview");
        setLoading(false);
      }
    } catch (err) {
      console.error("Error creating interview:", err);
      setError("An error occurred while creating the interview");
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        .pre-vapi-wrapper {
          width: 100vw;
          min-height: 100vh;
          background: #000;
          display: flex;
          flex-direction: column;
          overflow-y: auto;
        }
        .pre-vapi-header {
          padding: 1.5rem 2rem;
          flex-shrink: 0;
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }
        .pre-vapi-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 2rem;
        }
        .pre-vapi-form {
          width: 100%;
          max-width: 600px;
          padding: 2.5rem;
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 16px;
        }
        .form-group {
          margin-bottom: 1.5rem;
        }
        .form-label {
          display: block;
          font-family: "Quicksand", sans-serif;
          font-size: 0.85rem;
          font-weight: 600;
          color: rgba(245,245,245,0.7);
          margin-bottom: 0.5rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .form-input,
        .form-select {
          width: 100%;
          padding: 0.9rem 1rem;
          font-family: "Quicksand", sans-serif;
          font-size: 0.95rem;
          color: #F5F5F5;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 10px;
          outline: none;
          transition: all 0.2s ease;
        }
        .form-input:focus,
        .form-select:focus {
          border-color: rgba(3,179,195,0.5);
          background: rgba(255,255,255,0.05);
        }
        .form-select option {
          background: #0a0a0a;
          color: #F5F5F5;
          padding: 0.5rem;
        }
        .form-input::placeholder {
          color: rgba(245,245,245,0.3);
        }
        .submit-button {
          width: 100%;
          padding: 1rem;
          font-family: "Quicksand", sans-serif;
          font-size: 1rem;
          font-weight: 600;
          color: white;
          background: #03b3c3;
          border: none;
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.2s ease;
          margin-top: 0.5rem;
        }
        .submit-button:hover:not(:disabled) {
          background: #029ba8;
          transform: translateY(-2px);
        }
        .submit-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .error-message {
          padding: 1rem;
          margin-bottom: 1.5rem;
          background: rgba(231,76,60,0.1);
          border: 1px solid rgba(231,76,60,0.3);
          border-radius: 10px;
          color: #e74c3c;
          font-family: "Quicksand", sans-serif;
          font-size: 0.9rem;
        }
        .form-hint {
          font-family: "Quicksand", sans-serif;
          font-size: 0.8rem;
          color: rgba(245,245,245,0.4);
          margin-top: 0.3rem;
        }
      `}</style>

      <div className="pre-vapi-wrapper">
        {/* Header */}
        <div className="pre-vapi-header">
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

        <div className="pre-vapi-content">
          {/* Title */}
          <div style={{ textAlign: "center", marginBottom: "2rem" }}>
            <h1
              style={{
                fontFamily: '"Bricolage Grotesque", sans-serif',
                fontWeight: 800,
                fontSize: "clamp(2rem, 4.5vw, 3rem)",
                lineHeight: 1.1,
                letterSpacing: "-0.035em",
                color: "#F5F5F5",
                margin: 0,
              }}
            >
              Create Interview
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
              Configure your AI-powered voice interview
            </p>
          </div>

          {/* Form */}
          <form className="pre-vapi-form" onSubmit={handleSubmit}>
            {error && <div className="error-message">{error}</div>}

            <div className="form-group">
              <label className="form-label">Job Role *</label>
              <input
                type="text"
                name="role"
                value={formData.role}
                onChange={handleChange}
                placeholder="e.g., Full Stack Developer"
                className="form-input"
                disabled={loading}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Interview Type *</label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="form-select"
                disabled={loading}
                required
              >
                {INTERVIEW_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Experience Level *</label>
              <select
                name="level"
                value={formData.level}
                onChange={handleChange}
                className="form-select"
                disabled={loading}
                required
              >
                {EXPERIENCE_LEVELS.map((level) => (
                  <option key={level} value={level}>
                    {level}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Tech Stack *</label>
              <input
                type="text"
                name="techstack"
                value={formData.techstack}
                onChange={handleChange}
                placeholder="e.g., React, Node.js, MongoDB"
                className="form-input"
                disabled={loading}
                required
              />
              <div className="form-hint">
                Enter technologies separated by commas
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Number of Questions *</label>
              <input
                type="number"
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                min="1"
                max="10"
                className="form-input"
                disabled={loading}
                required
              />
              <div className="form-hint">
                Choose between 1-10 questions
              </div>
            </div>

            <button
              type="submit"
              className="submit-button"
              disabled={loading}
            >
              {loading ? "Generating Questions..." : "Create & Start Interview"}
            </button>

            <p
              style={{
                fontFamily: '"Quicksand", sans-serif',
                fontSize: "0.75rem",
                color: "rgba(245,245,245,0.3)",
                textAlign: "center",
                marginTop: "1rem",
                marginBottom: 0,
              }}
            >
              Questions are generated by AI based on your inputs
            </p>
          </form>
        </div>
      </div>
    </>
  );
}
