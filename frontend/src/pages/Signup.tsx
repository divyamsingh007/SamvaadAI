import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "motion/react";
import { useAuth } from "../contexts/AuthContext";
import Hyperspeed from "../components/Hyperspeed";
import { ArrowLeft, Mail, Lock, User as UserIcon, AlertCircle } from "lucide-react";

const smooth = { type: "spring" as const, damping: 30, stiffness: 120 };

const fadeUp = (delay: number) => ({
  hidden: { opacity: 0, y: 24, filter: "blur(6px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { ...smooth, delay },
  },
});

export default function Signup() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    username: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState("");

  const { register, isLoading } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    setError("");
    const res = await register(formData);
    if (res.success) {
      navigate("/dashboard");
    } else {
      setError(res.message || "Failed to create account");
      setIsSubmitting(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "1rem 1rem 1rem 3rem",
    fontFamily: '"Quicksand", sans-serif',
    fontSize: "1rem",
    fontWeight: 400,
    color: "#F5F5F5",
    background: "rgba(255, 255, 255, 0.04)",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    borderRadius: "12px",
    outline: "none",
    transition: "border-color 0.3s ease, box-shadow 0.3s ease",
    boxSizing: "border-box",
  };

  const inputStyleShort: React.CSSProperties = {
    ...inputStyle,
    paddingLeft: "1rem",
  };

  const iconStyle: React.CSSProperties = {
    position: "absolute",
    left: "1rem",
    top: "50%",
    transform: "translateY(-50%)",
    color: "rgba(245, 245, 245, 0.3)",
    pointerEvents: "none",
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.borderColor = "rgba(3, 179, 195, 0.5)";
    e.target.style.boxShadow = "0 0 0 3px rgba(3, 179, 195, 0.1)";
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.borderColor = "rgba(255, 255, 255, 0.1)";
    e.target.style.boxShadow = "none";
  };

  return (
    <div
      style={{
        position: "relative",
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
      }}
    >
      {/* Background */}
      <div style={{ position: "absolute", inset: 0, zIndex: 0 }}>
        <Hyperspeed
          effectOptions={{
            onSpeedUp: () => {},
            onSlowDown: () => {},
            distortion: "turbulentDistortion",
            length: 400,
            roadWidth: 10,
            islandWidth: 2,
            lanesPerRoad: 3,
            fov: 90,
            fovSpeedUp: 150,
            speedUp: 2,
            carLightsFade: 0.4,
            totalSideLightSticks: 20,
            lightPairsPerRoadWay: 40,
            shoulderLinesWidthPercentage: 0.05,
            brokenLinesWidthPercentage: 0.1,
            brokenLinesLengthPercentage: 0.5,
            lightStickWidth: [0.12, 0.5],
            lightStickHeight: [1.3, 1.7],
            movingAwaySpeed: [60, 80],
            movingCloserSpeed: [-120, -160],
            carLightsLength: [12, 80],
            carLightsRadius: [0.05, 0.14],
            carWidthPercentage: [0.3, 0.5],
            carShiftX: [-0.8, 0.8],
            carFloorSeparation: [0, 5],
            colors: {
              roadColor: 0x080808,
              islandColor: 0x0a0a0a,
              background: 0x000000,
              shoulderLines: 0x131318,
              brokenLines: 0x131318,
              leftCars: [0xd856bf, 0x6750a2, 0xc247ac],
              rightCars: [0x03b3c3, 0x0e5ea5, 0x324555],
              sticks: 0x03b3c3,
            },
          }}
        />
      </div>

      {/* ── Logo — top left ── */}
      <motion.div
        variants={fadeUp(0.1)}
        initial="hidden"
        animate="visible"
        style={{
          position: "absolute",
          top: "1.5rem",
          left: "2rem",
          zIndex: 10,
        }}
      >
        <Link to="/" style={{ textDecoration: "none" }}>
          <span
            style={{
              fontFamily: '"Bricolage Grotesque", sans-serif',
              fontSize: "2rem",
              fontWeight: 700,
              letterSpacing: "-0.02em",
              color: "#F5F5F5",
              display: "inline-flex",
              alignItems: "center",
              gap: "0.15em",
            }}
          >
            Samvaad
            <span style={{ color: "#03b3c3", fontWeight: 800 }}>AI</span>
          </span>
        </Link>
      </motion.div>

      {/* ── Back to Home — top right ── */}
      <motion.button
        variants={fadeUp(0.15)}
        initial="hidden"
        animate="visible"
        onClick={() => navigate("/")}
        style={{
          position: "absolute",
          top: "1.8rem",
          right: "2rem",
          zIndex: 10,
          display: "flex",
          alignItems: "center",
          gap: "0.4rem",
          color: "rgba(245, 245, 245, 0.6)",
          background: "none",
          border: "none",
          cursor: "pointer",
          fontFamily: '"Quicksand", sans-serif',
          fontSize: "0.95rem",
          transition: "color 0.2s ease",
        }}
        onMouseOver={(e) =>
          (e.currentTarget.style.color = "#F5F5F5")
        }
        onMouseOut={(e) =>
          (e.currentTarget.style.color = "rgba(245, 245, 245, 0.6)")
        }
      >
        <ArrowLeft size={18} /> Back
      </motion.button>

      {/* ── Main Content ── */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          display: "flex",
          flexDirection: "column",
          height: "100%",
          alignItems: "center",
          justifyContent: "center",
          padding: "0 1.5rem",
        }}
      >
        {/* Ambient glow behind card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.6, ease: "easeOut", delay: 0.2 }}
          style={{
            position: "absolute",
            width: "min(550px, 80vw)",
            height: "300px",
            borderRadius: "50%",
            background:
              "radial-gradient(ellipse, rgba(103,80,162,0.12) 0%, rgba(3,179,195,0.08) 40%, transparent 70%)",
            filter: "blur(60px)",
            pointerEvents: "none",
          }}
        />

        {/* Heading */}
        <motion.h1
          variants={fadeUp(0.2)}
          initial="hidden"
          animate="visible"
          style={{
            fontFamily: '"Bricolage Grotesque", sans-serif',
            fontWeight: 800,
            fontSize: "clamp(2rem, 3.5vw, 3rem)",
            lineHeight: 1.1,
            letterSpacing: "-0.03em",
            color: "#F5F5F5",
            textAlign: "center",
            margin: "0 0 0.5rem 0",
          }}
        >
          Create Your Account
        </motion.h1>

        <motion.p
          variants={fadeUp(0.35)}
          initial="hidden"
          animate="visible"
          style={{
            fontFamily: '"Quicksand", sans-serif',
            fontSize: "1.05rem",
            color: "rgba(247, 247, 242, 0.55)",
            textAlign: "center",
            marginBottom: "2.5rem",
            fontWeight: 400,
          }}
        >
          Start practicing with AI-powered mock interviews
        </motion.p>

        {/* Error */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              width: "100%",
              maxWidth: "480px",
              marginBottom: "1.5rem",
              padding: "0.85rem 1rem",
              borderRadius: "10px",
              background: "rgba(220, 38, 38, 0.08)",
              border: "1px solid rgba(220, 38, 38, 0.2)",
              color: "#f87171",
              display: "flex",
              alignItems: "center",
              gap: "0.6rem",
              fontFamily: '"Quicksand", sans-serif',
              fontSize: "0.9rem",
            }}
          >
            <AlertCircle size={16} />
            {error}
          </motion.div>
        )}

        {/* Form */}
        <motion.form
          variants={fadeUp(0.5)}
          initial="hidden"
          animate="visible"
          id="signup-form"
          onSubmit={handleSubmit}
          style={{
            width: "100%",
            maxWidth: "480px",
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
          }}
        >
          {/* Name row */}
          <div style={{ display: "flex", gap: "1rem" }}>
            <input
              type="text"
              name="firstName"
              placeholder="First Name"
              value={formData.firstName}
              onChange={handleChange}
              onFocus={handleFocus}
              onBlur={handleBlur}
              style={inputStyleShort}
            />
            <input
              type="text"
              name="lastName"
              placeholder="Last Name"
              value={formData.lastName}
              onChange={handleChange}
              onFocus={handleFocus}
              onBlur={handleBlur}
              style={inputStyleShort}
            />
          </div>

          {/* Username */}
          <div style={{ position: "relative" }}>
            <UserIcon size={18} style={iconStyle} />
            <input
              type="text"
              name="username"
              placeholder="Username"
              value={formData.username}
              onChange={handleChange}
              onFocus={handleFocus}
              onBlur={handleBlur}
              required
              style={inputStyle}
            />
          </div>

          {/* Email */}
          <div style={{ position: "relative" }}>
            <Mail size={18} style={iconStyle} />
            <input
              type="email"
              name="email"
              placeholder="Email Address"
              value={formData.email}
              onChange={handleChange}
              onFocus={handleFocus}
              onBlur={handleBlur}
              required
              style={inputStyle}
            />
          </div>

          {/* Password */}
          <div style={{ position: "relative" }}>
            <Lock size={18} style={iconStyle} />
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              onFocus={handleFocus}
              onBlur={handleBlur}
              required
              style={inputStyle}
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              marginTop: "0.75rem",
              width: "100%",
              padding: "1rem",
              fontFamily: '"Quicksand", sans-serif',
              fontSize: "1.05rem",
              fontWeight: 600,
              letterSpacing: "0.02em",
              color: "#03b3c3",
              background: "transparent",
              border: "1.5px solid #03b3c3",
              borderRadius: "14px",
              cursor: isSubmitting ? "not-allowed" : "pointer",
              opacity: isSubmitting ? 0.6 : 1,
              transition:
                "transform 0.3s cubic-bezier(0.25,0.46,0.45,0.94), opacity 0.25s ease",
            }}
            onMouseOver={(e) => {
              if (!isSubmitting) e.currentTarget.style.transform = "scale(1.03)";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = "scale(1)";
            }}
          >
            {isSubmitting ? "Creating Account..." : "Create Account →"}
          </button>
        </motion.form>

        {/* Footer link */}
        <motion.p
          variants={fadeUp(0.7)}
          initial="hidden"
          animate="visible"
          style={{
            fontFamily: '"Quicksand", sans-serif',
            fontSize: "0.9rem",
            color: "rgba(245, 245, 245, 0.45)",
            marginTop: "1.8rem",
            textAlign: "center",
          }}
        >
          Already have an account?{" "}
          <Link
            to="/signin"
            style={{
              color: "#03b3c3",
              textDecoration: "none",
              fontWeight: 500,
              transition: "color 0.2s ease",
            }}
            onMouseOver={(e) =>
              (e.currentTarget.style.color = "#04d6e8")
            }
            onMouseOut={(e) =>
              (e.currentTarget.style.color = "#03b3c3")
            }
          >
            Sign in
          </Link>
        </motion.p>
      </div>
    </div>
  );
}
