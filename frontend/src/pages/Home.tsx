import { useNavigate } from "react-router-dom";
import Hyperspeed from "../components/Hyperspeed";
import Dock from "../components/Dock";
import CtaButton from "../components/CtaButton";

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
    <div
      style={{
        position: "relative",
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
      }}
    >
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

      <div
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
      </div>

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
        <h1
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
        </h1>

        <p
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
        </p>

        <div style={{ marginTop: "2rem", pointerEvents: "auto" }}>
          <CtaButton
            text="Begin Mock Interview Now"
            onClick={() => navigate("/interview")}
          />
        </div>

        <p
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
        </p>
      </div>

      <Dock className="z-10" items={dockItems} />
    </div>
  );
}
