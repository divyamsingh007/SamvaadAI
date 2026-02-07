import "./CtaButton.css";

const CtaButton = ({ text = "Get started", onClick }) => {
  return (
    <button className="cta-btn" onClick={onClick}>
      <span className="cta-btn__text">{text}</span>
      <span className="cta-btn__arrow">
        <svg
          width="20"
          height="20"
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
      </span>
    </button>
  );
};

export default CtaButton;
