import { useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import Hyperspeed from "../components/Hyperspeed";
import Dock from "../components/Dock";
import CtaButton from "../components/CtaButton";

const smooth = { type: "spring" as const, damping: 30, stiffness: 120 };

const fadeUp = (delay: number) => ({
  hidden: { opacity: 0, y: 32, filter: "blur(6px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { ...smooth, delay },
  },
});

const fadeLeft = (delay: number) => ({
  hidden: { opacity: 0, x: -28, filter: "blur(4px)" },
  visible: {
    opacity: 1,
    x: 0,
    filter: "blur(0px)",
    transition: { ...smooth, delay },
  },
});

const scaleFade = (delay: number) => ({
  hidden: { opacity: 0, scale: 0.88, filter: "blur(6px)" },
  visible: {
    opacity: 1,
    scale: 1,
    filter: "blur(0px)",
    transition: { ...smooth, delay },
  },
});

/* ── slide-up for dock ── */
const slideUp = (delay: number) => ({
  hidden: { opacity: 0, y: 60 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { ...smooth, delay },
  },
});

const HomeIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#F5F5F5"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);

const HowItWorksIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#F5F5F5"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

const AboutUsIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#F5F5F5"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

export default function Home() {
  const navigate = useNavigate();
  const hasSeenPreloader = useRef(
    sessionStorage.getItem("samvaad_preloader_shown") === "1",
  );
  const [loading, setLoading] = useState(!hasSeenPreloader.current);

  useEffect(() => {
    if (hasSeenPreloader.current) return;
    const timer = setTimeout(() => {
      setLoading(false);
      sessionStorage.setItem("samvaad_preloader_shown", "1");
    }, 2400);
    return () => clearTimeout(timer);
  }, []);

  const dockItems = [
    { icon: <HomeIcon />, label: "Home", onClick: () => navigate("/") },
    {
      icon: <HowItWorksIcon />,
      label: "How It Works",
      onClick: () => navigate("/how-it-works"),
    },
    {
      icon: <AboutUsIcon />,
      label: "About Us",
      onClick: () => navigate("/about-us"),
    },
  ];
  return (
    <>
      {/* ── Preloader ── */}
      <AnimatePresence>
        {loading && (
          <motion.div
            key="preloader"
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 9999,
              background: "#000000",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {/* Wordmark with letter-by-letter reveal */}
            <div style={{ display: "flex", alignItems: "baseline", gap: 0 }}>
              {"Samvaad".split("").map((char, i) => (
                <motion.span
                  key={`c-${i}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    delay: 0.1 + i * 0.07,
                    duration: 0.5,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  style={{
                    fontFamily: '"Bricolage Grotesque", sans-serif',
                    fontSize: "clamp(2rem, 4vw, 3rem)",
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
                  key={`a-${i}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    delay: 0.1 + (7 + i) * 0.07,
                    duration: 0.5,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  style={{
                    fontFamily: '"Bricolage Grotesque", sans-serif',
                    fontSize: "clamp(2rem, 4vw, 3rem)",
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

            {/* Minimal white loading bar */}
            <div
              style={{
                marginTop: "1.5rem",
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
                  delay: 0.6,
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
          </motion.div>
        )}
      </AnimatePresence>

      <div
        style={{
          position: "relative",
          width: "100vw",
          height: "100vh",
          overflow: "hidden",
        }}
      >
        {/* ── Hyperspeed background ── */}
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

        {/* ── Logo — slides in from the left ── */}
        <motion.div
          variants={fadeLeft(0.15)}
          initial="hidden"
          animate={loading ? "hidden" : "visible"}
          style={{
            position: "absolute",
            top: "1.5rem",
            left: "2rem",
            zIndex: 10,
          }}
        >
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
            <span
              style={{
                color: "#03b3c3",
                fontWeight: 800,
              }}
            >
              AI
            </span>
          </span>
        </motion.div>

        {/* ── Hero content ── */}
        <div
          style={{
            position: "relative",
            zIndex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            height: "100%",
            color: "white",
            textAlign: "center",
            padding: "0 1.5rem",
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.6 }}
            animate={
              loading ? { opacity: 0, scale: 0.6 } : { opacity: 1, scale: 1 }
            }
            transition={{ duration: 1.6, ease: "easeOut", delay: 0.2 }}
            style={{
              position: "absolute",
              width: "min(600px, 80vw)",
              height: "260px",
              borderRadius: "50%",
              background:
                "radial-gradient(ellipse, rgba(3,179,195,0.12) 0%, rgba(103,80,162,0.08) 40%, transparent 70%)",
              filter: "blur(60px)",
              pointerEvents: "none",
            }}
          />

          {/* Heading */}
          <motion.h1
            variants={fadeUp(0.3)}
            initial="hidden"
            animate={loading ? "hidden" : "visible"}
            style={{
              fontFamily: '"Bricolage Grotesque", sans-serif',
              fontWeight: 800,
              fontSize: "clamp(2.5rem, 5vw + 0.5rem, 4.5rem)",
              lineHeight: 1.08,
              letterSpacing: "-0.03em",
              color: "#F5F5F5",
              maxWidth: "800px",
              margin: 0,
            }}
          >
            Elevate Your Interview
            <br />
            Preparation With{" "}
            <span
              style={{
                background: "linear-gradient(135deg, #03b3c3, #6750a2)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              SamvaadAI
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            variants={fadeUp(0.55)}
            initial="hidden"
            animate={loading ? "hidden" : "visible"}
            style={{
              fontFamily: '"Quicksand", sans-serif',
              fontSize: "clamp(1rem, 1.2vw, 1.2rem)",
              lineHeight: 1.7,
              color: "rgba(247, 247, 242, 0.75)",
              maxWidth: "580px",
              marginTop: "1.5rem",
              fontWeight: 400,
            }}
          >
            Practice with realistic AI-generated questions, speak your answers
            naturally, and receive structured, role-specific feedback — all in
            minutes.
          </motion.p>

          {/* CTA button */}
          <motion.div
            variants={scaleFade(0.8)}
            initial="hidden"
            animate={loading ? "hidden" : "visible"}
            style={{ marginTop: "2rem", pointerEvents: "auto" }}
          >
            <CtaButton
              text="Begin Mock Interview Now"
              onClick={() => navigate("/pre-interview")}
            />
          </motion.div>

          {/* Sub-note */}
          <motion.p
            variants={fadeUp(1.0)}
            initial="hidden"
            animate={loading ? "hidden" : "visible"}
            style={{
              fontFamily: '"Quicksand", sans-serif',
              fontSize: "0.8rem",
              color: "rgba(245, 245, 245, 0.4)",
              marginTop: "1rem",
              fontWeight: 400,
              letterSpacing: "0.02em",
            }}
          >
            No signup required
          </motion.p>
        </div>

        {/* ── Dock — slides up from bottom ── */}
        <motion.div
          variants={slideUp(1.1)}
          initial="hidden"
          animate={loading ? "hidden" : "visible"}
        >
          <Dock className="z-10" items={dockItems} />
        </motion.div>
      </div>
    </>
  );
}
