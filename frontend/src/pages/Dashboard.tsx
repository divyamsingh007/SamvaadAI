import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { motion, AnimatePresence } from "motion/react";
import Hyperspeed from "../components/Hyperspeed";
import Dock from "../components/Dock";
import { apiFetch } from "../lib/apiFetch";
import {
  ArrowLeft, LogOut, BarChart2, Clock, TrendingUp, ChevronRight,
  Trash2, RefreshCw, Award, Target, Zap,
  AlertTriangle, CheckCircle, ChevronDown, ChevronUp, Star,
  Mic, Shield, Eye, Brain, MessageSquare, Lightbulb, ArrowRight,
} from "lucide-react";

/* ── design tokens (identical to Home / Signin / Signup) ──────────────── */
const smooth = { type: "spring" as const, damping: 30, stiffness: 120 };
const fadeUp = (delay: number) => ({
  hidden: { opacity: 0, y: 24, filter: "blur(6px)" },
  visible: { opacity: 1, y: 0, filter: "blur(0px)", transition: { ...smooth, delay } },
});
const slideUp = (delay: number) => ({
  hidden: { opacity: 0, y: 60 },
  visible: { opacity: 1, y: 0, transition: { ...smooth, delay } },
});

/* ── types ─────────────────────────────────────────────────────────────── */
interface CatScore { name: string; score: number; comment: string }
interface Eval { totalScore: number; categoryScores: CatScore[]; strengths: string[]; areasForImprovement: string[]; finalAssessment: string }
interface IV { _id: string; role: string; type: string; level: string; techstack: string[]; questions: string[]; createdAt: string }
interface Resp { _id: string; interviewId: IV; evaluation: Eval; duration?: number; completedAt: string; qaTranscript: { question: string; answer: string }[] }

/* ── helpers ────────────────────────────────────────────────────────────── */
const scoreClr = (s: number) => s >= 80 ? "#03b3c3" : s >= 60 ? "#a78bfa" : s >= 40 ? "#f59e0b" : "#ef4444";
const scoreLbl = (s: number) => s >= 80 ? "Excellent" : s >= 60 ? "Good" : s >= 40 ? "Fair" : "Needs Work";
const fmtDur = (sec?: number) => { if (!sec) return "—"; return `${Math.floor(sec / 60)}m ${sec % 60}s`; };
const fmtDate = (d: string) => new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

/* ── shared input style (same as Signin/Signup) ────────────────────────── */
const inputStyle: React.CSSProperties = {
  width: "100%", padding: "1rem", fontFamily: '"Quicksand", sans-serif', fontSize: "1rem",
  fontWeight: 400, color: "#F5F5F5", background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", outline: "none",
  transition: "border-color 0.3s ease, box-shadow 0.3s ease", boxSizing: "border-box" as const,
};
const onFocus = (e: React.FocusEvent<HTMLInputElement>) => { e.target.style.borderColor = "rgba(3,179,195,0.5)"; e.target.style.boxShadow = "0 0 0 3px rgba(3,179,195,0.1)"; };
const onBlur = (e: React.FocusEvent<HTMLInputElement>) => { e.target.style.borderColor = "rgba(255,255,255,0.1)"; e.target.style.boxShadow = "none"; };

/* ── Dock SVG icons (same style as Home page icons) ────────────────────── */
const OverviewIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#F5F5F5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
  </svg>
);
const HistoryIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#F5F5F5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
  </svg>
);
const ProfileIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#F5F5F5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
  </svg>
);

/* ── Score Ring ─────────────────────────────────────────────────────────── */
function ScoreRing({ score, size = 64 }: { score: number; size?: number }) {
  const r = (size - 8) / 2, circ = 2 * Math.PI * r, filled = (score / 100) * circ, color = scoreClr(score);
  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={5} />
        <motion.circle initial={{ strokeDasharray: `0 ${circ}` }} animate={{ strokeDasharray: `${filled} ${circ - filled}` }} transition={{ duration: 1, ease: "easeOut" }} cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={5} strokeLinecap="round" />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontFamily: '"Bricolage Grotesque",sans-serif', fontWeight: 800, fontSize: `${size * 0.018}rem`, color }}>{score}</span>
        <span style={{ fontFamily: '"Quicksand",sans-serif', fontSize: "0.5rem", color: "rgba(245,245,245,0.3)" }}>/100</span>
      </div>
    </div>
  );
}

/* ── Category Bar ──────────────────────────────────────────────────────── */
function CatBar({ cat, delay = 0 }: { cat: CatScore; delay?: number }) {
  const c = scoreClr(cat.score);
  return (
    <div style={{ marginBottom: "0.6rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
        <span style={{ fontFamily: '"Quicksand",sans-serif', fontSize: "0.82rem", color: "rgba(245,245,245,0.6)" }}>{cat.name}</span>
        <span style={{ fontFamily: '"Bricolage Grotesque",sans-serif', fontSize: "0.82rem", fontWeight: 700, color: c }}>{cat.score}</span>
      </div>
      <div style={{ height: 4, borderRadius: 10, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
        <motion.div initial={{ width: 0 }} animate={{ width: `${cat.score}%` }} transition={{ duration: 0.8, ease: "easeOut", delay }} style={{ height: "100%", borderRadius: 10, background: `linear-gradient(90deg, ${c}88, ${c})` }} />
      </div>
    </div>
  );
}

/* ── Section heading ───────────────────────────────────────────────────── */
const SectionHead = ({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) => (
  <h3 style={{ fontFamily: '"Bricolage Grotesque",sans-serif', fontSize: "0.82rem", fontWeight: 700, color: "rgba(245,245,245,0.45)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.8rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>{icon}{children}</h3>
);

/* ── Card wrapper ──────────────────────────────────────────────────────── */
const Card = ({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) => (
  <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, padding: "1.2rem", ...style }}>{children}</div>
);

/* ── Response Card ─────────────────────────────────────────────────────── */
function ResponseCard({ resp, onDelete }: { resp: Resp; onDelete: (id: string) => void }) {
  const [expanded, setExpanded] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const iv = resp.interviewId, sc = resp.evaluation?.totalScore ?? 0;
  const del = async (e: React.MouseEvent) => {
    e.stopPropagation(); if (!confirm("Delete this result?")) return;
    setDeleting(true);
    try { const r = await apiFetch(`/interview-responses/${resp._id}`, { method: "DELETE" }); if (r.ok) onDelete(resp._id); } finally { setDeleting(false); }
  };
  return (
    <motion.div layout initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, overflow: "hidden", marginBottom: "0.75rem" }}>
      <div onClick={() => setExpanded(p => !p)} style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "1rem 1.2rem", cursor: "pointer", transition: "background 0.2s" }}
        onMouseOver={e => (e.currentTarget.style.background = "rgba(255,255,255,0.02)")} onMouseOut={e => (e.currentTarget.style.background = "transparent")}>
        <ScoreRing score={sc} size={60} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
            <span style={{ fontFamily: '"Bricolage Grotesque",sans-serif', fontWeight: 700, fontSize: "1rem", color: "#F5F5F5" }}>{iv?.role || "Interview"}</span>
            <span style={{ padding: "0.12rem 0.5rem", borderRadius: 99, fontSize: "0.68rem", background: scoreClr(sc) + "15", color: scoreClr(sc), fontFamily: '"Quicksand",sans-serif', fontWeight: 600 }}>{scoreLbl(sc)}</span>
          </div>
          <div style={{ display: "flex", gap: "0.4rem", marginTop: "0.3rem", flexWrap: "wrap" }}>
            {[iv?.type, iv?.level, ...(iv?.techstack?.slice(0, 3) || [])].filter(Boolean).map((tag, i) => (
              <span key={i} style={{ fontFamily: '"Quicksand",sans-serif', fontSize: "0.7rem", color: "rgba(245,245,245,0.35)", background: "rgba(255,255,255,0.04)", padding: "0.12rem 0.45rem", borderRadius: 6, border: "1px solid rgba(255,255,255,0.06)" }}>{tag}</span>
            ))}
          </div>
          <div style={{ display: "flex", gap: "1rem", marginTop: "0.3rem" }}>
            <span style={{ fontFamily: '"Quicksand",sans-serif', fontSize: "0.72rem", color: "rgba(245,245,245,0.3)", display: "flex", alignItems: "center", gap: 4 }}><Clock size={11} />{fmtDate(resp.completedAt)}</span>
            {resp.duration && <span style={{ fontFamily: '"Quicksand",sans-serif', fontSize: "0.72rem", color: "rgba(245,245,245,0.3)", display: "flex", alignItems: "center", gap: 4 }}><Zap size={11} />{fmtDur(resp.duration)}</span>}
          </div>
        </div>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexShrink: 0 }}>
          <button onClick={del} disabled={deleting} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(245,245,245,0.15)", padding: 6, borderRadius: 8, transition: "all 0.2s" }}
            onMouseOver={e => { e.currentTarget.style.color = "#ef4444"; e.currentTarget.style.background = "rgba(239,68,68,0.07)"; }}
            onMouseOut={e => { e.currentTarget.style.color = "rgba(245,245,245,0.15)"; e.currentTarget.style.background = "transparent"; }}>
            {deleting ? <RefreshCw size={14} /> : <Trash2 size={14} />}
          </button>
          {expanded ? <ChevronUp size={15} style={{ color: "rgba(245,245,245,0.2)" }} /> : <ChevronDown size={15} style={{ color: "rgba(245,245,245,0.2)" }} />}
        </div>
      </div>
      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }} style={{ overflow: "hidden", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            <div style={{ padding: "1.2rem", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.2rem" }}>
              <div>
                <SectionHead icon={<BarChart2 size={13} />}>Category Breakdown</SectionHead>
                {resp.evaluation?.categoryScores?.map((c, i) => <CatBar key={i} cat={c} delay={i * 0.06} />)}
              </div>
              <div>
                {resp.evaluation?.strengths?.length > 0 && (<>
                  <SectionHead icon={<CheckCircle size={13} style={{ color: "#03b3c3" }} />}>Strengths</SectionHead>
                  <ul style={{ paddingLeft: 0, listStyle: "none", marginBottom: "1rem" }}>
                    {resp.evaluation.strengths.map((s, i) => (<li key={i} style={{ display: "flex", gap: "0.4rem", alignItems: "flex-start", marginBottom: "0.35rem" }}><CheckCircle size={11} style={{ color: "#03b3c3", marginTop: 3, flexShrink: 0 }} /><span style={{ fontFamily: '"Quicksand",sans-serif', fontSize: "0.78rem", color: "rgba(245,245,245,0.55)", lineHeight: 1.45 }}>{s}</span></li>))}
                  </ul></>)}
                {resp.evaluation?.areasForImprovement?.length > 0 && (<>
                  <SectionHead icon={<AlertTriangle size={13} style={{ color: "#f59e0b" }} />}>Areas to Improve</SectionHead>
                  <ul style={{ paddingLeft: 0, listStyle: "none" }}>
                    {resp.evaluation.areasForImprovement.map((a, i) => (<li key={i} style={{ display: "flex", gap: "0.4rem", alignItems: "flex-start", marginBottom: "0.35rem" }}><AlertTriangle size={11} style={{ color: "#f59e0b", marginTop: 3, flexShrink: 0 }} /><span style={{ fontFamily: '"Quicksand",sans-serif', fontSize: "0.78rem", color: "rgba(245,245,245,0.55)", lineHeight: 1.45 }}>{a}</span></li>))}
                  </ul></>)}
              </div>
              {resp.evaluation?.finalAssessment && (
                <div style={{ gridColumn: "1/-1", background: "rgba(3,179,195,0.06)", borderRadius: 10, padding: "0.9rem 1rem", border: "1px solid rgba(3,179,195,0.1)" }}>
                  <h4 style={{ fontFamily: '"Bricolage Grotesque",sans-serif', fontSize: "0.76rem", fontWeight: 700, color: "#03b3c3", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.35rem", display: "flex", alignItems: "center", gap: 5 }}><Brain size={13} />AI Assessment</h4>
                  <p style={{ fontFamily: '"Quicksand",sans-serif', fontSize: "0.8rem", color: "rgba(245,245,245,0.55)", lineHeight: 1.6, margin: 0 }}>{resp.evaluation.finalAssessment}</p>
                </div>
              )}
              {resp.qaTranscript?.length > 0 && (
                <div style={{ gridColumn: "1/-1" }}>
                  <SectionHead icon={<MessageSquare size={13} />}>Q&A Transcript ({resp.qaTranscript.length})</SectionHead>
                  {resp.qaTranscript.slice(0, 3).map((qa, i) => (
                    <div key={i} style={{ marginBottom: "0.7rem", padding: "0.7rem 0.9rem", borderRadius: 10, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                      <div style={{ fontFamily: '"Quicksand",sans-serif', fontSize: "0.78rem", fontWeight: 600, color: "#03b3c3", marginBottom: 3 }}>Q: {qa.question}</div>
                      <div style={{ fontFamily: '"Quicksand",sans-serif', fontSize: "0.75rem", color: "rgba(245,245,245,0.5)", lineHeight: 1.5 }}>A: {qa.answer.length > 200 ? qa.answer.slice(0, 200) + "…" : qa.answer}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  DASHBOARD                                                                */
/* ═══════════════════════════════════════════════════════════════════════════ */
export default function Dashboard() {
  const { user, logout, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [responses, setResponses] = useState<Resp[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"overview" | "history" | "profile">("overview");
  const [profileMsg, setProfileMsg] = useState("");
  const [profileForm, setProfileForm] = useState({ firstName: user?.firstName || "", lastName: user?.lastName || "", username: user?.username || "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate("/signin");
      return;
    }
    fetchData();
  }, [authLoading, user, navigate]);

  const fetchData = async () => {
    if (!user) return; setLoading(true);
    try { const r = await apiFetch(`/interview-responses?userId=${user.id}`); const j = await r.json(); if (j.success) setResponses(j.data || []); } catch { } finally { setLoading(false); }
  };

  const delResp = (id: string) => setResponses(p => p.filter(r => r._id !== id));
  const handleLogout = async () => { await logout(); navigate("/"); };
  const handleSaveProfile = async () => {
    setSaving(true); setProfileMsg("");
    try { const r = await apiFetch(`/auth/update-profile`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(profileForm) }); const j = await r.json(); setProfileMsg(j.success ? "Profile updated!" : (j.message || "Update failed")); } catch { setProfileMsg("Network error"); } finally { setSaving(false); setTimeout(() => setProfileMsg(""), 3000); }
  };

  /* ── analytics ─────────────────────────────────────────────── */
  const total = responses.length;
  const avg = total ? Math.round(responses.reduce((s, r) => s + (r.evaluation?.totalScore || 0), 0) / total) : 0;
  const best = total ? Math.max(...responses.map(r => r.evaluation?.totalScore || 0)) : 0;
  const totalTime = responses.reduce((s, r) => s + (r.duration || 0), 0);
  const totalQs = responses.reduce((s, r) => s + (r.qaTranscript?.length || 0), 0);
  const catMap = new Map<string, number[]>();
  responses.forEach(r => r.evaluation?.categoryScores?.forEach(c => { if (!catMap.has(c.name)) catMap.set(c.name, []); catMap.get(c.name)!.push(c.score); }));
  const avgCats = Array.from(catMap.entries()).map(([name, scores]) => ({ name, score: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length), comment: "" })).sort((a, b) => b.score - a.score);
  const strongest = avgCats[0] ?? null;
  const weakest = avgCats.length > 1 ? avgCats[avgCats.length - 1] : null;
  const allStrengths = [...new Set(responses.flatMap(r => r.evaluation?.strengths || []))].slice(0, 5);
  const allImprovements = [...new Set(responses.flatMap(r => r.evaluation?.areasForImprovement || []))].slice(0, 5);
  const recentScores = responses.slice(0, 6).map(r => r.evaluation?.totalScore || 0).reverse();
  const trending = recentScores.length >= 2 ? (recentScores[recentScores.length - 1] >= recentScores[0] ? "up" : "down") : "neutral";
  const typeCount = new Map<string, number>(); responses.forEach(r => { const t = r.interviewId?.type || "Unknown"; typeCount.set(t, (typeCount.get(t) || 0) + 1); });
  const roleCount = new Map<string, number>(); responses.forEach(r => { const rl = r.interviewId?.role || "Unknown"; roleCount.set(rl, (roleCount.get(rl) || 0) + 1); });

  /* ── Dock items ────────────────────────────────────────────── */
  const dockItems = [
    { icon: <OverviewIcon />, label: "Overview", onClick: () => setView("overview") },
    { icon: <HistoryIcon />, label: "History", onClick: () => setView("history") },
    { icon: <ProfileIcon />, label: "Profile", onClick: () => setView("profile") },
  ];

  /* ════════════════════════════════════════════════════════════════════════ */
  return (
    <div style={{ position: "relative", width: "100vw", height: "100vh", overflow: "hidden", background: "#000" }}>

      {/* ── Hyperspeed (dimmed so content is readable) ── */}
      <div style={{ position: "absolute", inset: 0, zIndex: 0, opacity: 0.35 }}>
        <Hyperspeed effectOptions={{
          onSpeedUp: () => { }, onSlowDown: () => { },
          distortion: "turbulentDistortion", length: 400, roadWidth: 10, islandWidth: 2,
          lanesPerRoad: 3, fov: 90, fovSpeedUp: 150, speedUp: 2, carLightsFade: 0.4,
          totalSideLightSticks: 20, lightPairsPerRoadWay: 40,
          shoulderLinesWidthPercentage: 0.05, brokenLinesWidthPercentage: 0.1, brokenLinesLengthPercentage: 0.5,
          lightStickWidth: [0.12, 0.5], lightStickHeight: [1.3, 1.7],
          movingAwaySpeed: [60, 80], movingCloserSpeed: [-120, -160],
          carLightsLength: [12, 80], carLightsRadius: [0.05, 0.14],
          carWidthPercentage: [0.3, 0.5], carShiftX: [-0.8, 0.8], carFloorSeparation: [0, 5],
          colors: {
            roadColor: 0x080808, islandColor: 0x0a0a0a, background: 0x000000,
            shoulderLines: 0x131318, brokenLines: 0x131318,
            leftCars: [0xd856bf, 0x6750a2, 0xc247ac], rightCars: [0x03b3c3, 0x0e5ea5, 0x324555], sticks: 0x03b3c3
          },
        }} />
      </div>

      {/* ── Dark overlay so content stays readable ── */}
      <div style={{ position: "absolute", inset: 0, zIndex: 1, background: "linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.3) 40%, rgba(0,0,0,0.6) 100%)", pointerEvents: "none" }} />

      {/* ── Logo — top left ── */}
      <motion.div variants={fadeUp(0.1)} initial="hidden" animate="visible"
        style={{ position: "absolute", top: "1.5rem", left: "2rem", zIndex: 20 }}>
        <Link to="/" style={{ textDecoration: "none" }}>
          <span style={{ fontFamily: '"Bricolage Grotesque", sans-serif', fontSize: "2rem", fontWeight: 700, letterSpacing: "-0.02em", color: "#F5F5F5", display: "inline-flex", alignItems: "center", gap: "0.15em" }}>
            Samvaad<span style={{ color: "#03b3c3", fontWeight: 800 }}>AI</span>
          </span>
        </Link>
      </motion.div>

      {/* ── Controls — top right (same as Home) ── */}
      <motion.div variants={fadeUp(0.15)} initial="hidden" animate="visible"
        style={{ position: "absolute", top: "1.8rem", right: "2rem", zIndex: 20, display: "flex", gap: "0.8rem", alignItems: "center" }}>
        <button onClick={() => navigate("/")} style={{ display: "flex", alignItems: "center", gap: "0.4rem", color: "rgba(245,245,245,0.6)", background: "none", border: "none", cursor: "pointer", fontFamily: '"Quicksand", sans-serif', fontSize: "0.95rem", transition: "color 0.2s ease" }}
          onMouseOver={e => (e.currentTarget.style.color = "#F5F5F5")} onMouseOut={e => (e.currentTarget.style.color = "rgba(245,245,245,0.6)")}>
          <ArrowLeft size={18} /> Back
        </button>
        <button onClick={handleLogout} style={{ display: "flex", alignItems: "center", gap: "0.35rem", color: "rgba(245,245,245,0.6)", background: "none", border: "none", cursor: "pointer", fontFamily: '"Quicksand", sans-serif', fontSize: "0.95rem", transition: "color 0.2s ease" }}
          onMouseOver={e => (e.currentTarget.style.color = "#f87171")} onMouseOut={e => (e.currentTarget.style.color = "rgba(245,245,245,0.6)")}>
          <LogOut size={16} /> Logout
        </button>
      </motion.div>

      {/* ── Content layer (scrollable, above everything) ── */}
      <div style={{ position: "relative", zIndex: 5, height: "100%", overflowY: "auto", display: "flex", flexDirection: "column", alignItems: "center", padding: "5.5rem 2rem 10rem" }}>

        {/* Ambient glow */}
        <motion.div initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1.6, ease: "easeOut", delay: 0.2 }}
          style={{ position: "fixed", top: "6%", width: "min(600px, 80vw)", height: 260, borderRadius: "50%", background: "radial-gradient(ellipse, rgba(3,179,195,0.1) 0%, rgba(103,80,162,0.06) 40%, transparent 70%)", filter: "blur(60px)", pointerEvents: "none", zIndex: 0 }} />

        {/* ── View content ── */}
        <div style={{ width: "100%", maxWidth: 860, position: "relative", zIndex: 2 }}>
          <AnimatePresence mode="wait">

            {/* ═══ OVERVIEW ═══════════════════════════════════════════ */}
            {view === "overview" && (
              <motion.div key="ov" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.35 }}>
                <motion.h1 variants={fadeUp(0.2)} initial="hidden" animate="visible"
                  style={{ fontFamily: '"Bricolage Grotesque", sans-serif', fontWeight: 800, fontSize: "clamp(2rem, 3.5vw, 3rem)", lineHeight: 1.08, letterSpacing: "-0.03em", color: "#F5F5F5", textAlign: "center", margin: "0 0 0.5rem" }}>
                  Welcome back,{" "}
                  <span style={{ background: "linear-gradient(135deg, #03b3c3, #6750a2)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                    {user?.firstName || user?.username}
                  </span>
                </motion.h1>
                <motion.p variants={fadeUp(0.35)} initial="hidden" animate="visible"
                  style={{ fontFamily: '"Quicksand", sans-serif', fontSize: "clamp(1rem, 1.2vw, 1.2rem)", lineHeight: 1.7, color: "rgba(247,247,242,0.55)", textAlign: "center", fontWeight: 400, marginBottom: "2.5rem", maxWidth: 580, marginLeft: "auto", marginRight: "auto" }}>
                  {total > 0 ? `${total} interview${total !== 1 ? "s" : ""} completed · ${totalQs} questions answered` : "Start your first AI mock interview to unlock insights"}
                </motion.p>

                {/* stat cards */}
                <motion.div variants={fadeUp(0.45)} initial="hidden" animate="visible"
                  style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.75rem", marginBottom: "2rem" }}>
                  {[
                    { label: "Interviews", value: total, icon: <BarChart2 size={18} />, color: "#03b3c3" },
                    { label: "Avg Score", value: avg, icon: <Target size={18} />, color: "#a78bfa" },
                    { label: "Best Score", value: best, icon: <Award size={18} />, color: "#f59e0b" },
                    { label: "Practice", value: fmtDur(totalTime), icon: <Clock size={18} />, color: "#6750a2" },
                  ].map(s => (
                    <Card key={s.label} style={{ textAlign: "center", padding: "1.2rem 0.8rem" }}>
                      <div style={{ color: s.color, marginBottom: "0.5rem", opacity: 0.7 }}>{s.icon}</div>
                      <div style={{ fontFamily: '"Bricolage Grotesque",sans-serif', fontWeight: 800, fontSize: "1.6rem", color: "#F5F5F5", lineHeight: 1, letterSpacing: "-0.02em" }}>{s.value}</div>
                      <div style={{ fontFamily: '"Quicksand",sans-serif', fontSize: "0.78rem", color: "rgba(245,245,245,0.4)", marginTop: "0.3rem" }}>{s.label}</div>
                    </Card>
                  ))}
                </motion.div>

                {/* insight chips */}
                {total > 0 && (
                  <motion.div variants={fadeUp(0.5)} initial="hidden" animate="visible" style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", justifyContent: "center", marginBottom: "2rem" }}>
                    {strongest && <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "0.35rem 0.8rem", borderRadius: 99, background: "rgba(3,179,195,0.08)", border: "1px solid rgba(3,179,195,0.15)", fontFamily: '"Quicksand",sans-serif', fontSize: "0.78rem", fontWeight: 600 }}><Star size={12} style={{ color: "#03b3c3" }} /><span style={{ color: "rgba(245,245,245,0.45)" }}>Strongest:</span><span style={{ color: "#03b3c3" }}>{strongest.name} ({strongest.score})</span></span>}
                    {weakest && <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "0.35rem 0.8rem", borderRadius: 99, background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.15)", fontFamily: '"Quicksand",sans-serif', fontSize: "0.78rem", fontWeight: 600 }}><Lightbulb size={12} style={{ color: "#f59e0b" }} /><span style={{ color: "rgba(245,245,245,0.45)" }}>Focus:</span><span style={{ color: "#f59e0b" }}>{weakest.name} ({weakest.score})</span></span>}
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "0.35rem 0.8rem", borderRadius: 99, background: trending === "up" ? "rgba(3,179,195,0.08)" : "rgba(167,139,250,0.08)", border: `1px solid ${trending === "up" ? "rgba(3,179,195,0.15)" : "rgba(167,139,250,0.15)"}`, fontFamily: '"Quicksand",sans-serif', fontSize: "0.78rem", fontWeight: 600, color: trending === "up" ? "#03b3c3" : "#a78bfa" }}><TrendingUp size={12} />{trending === "up" ? "Trending up" : "Keep practicing"}</span>
                  </motion.div>
                )}

                {/* skills + insights */}
                {total > 0 && (
                  <motion.div variants={fadeUp(0.55)} initial="hidden" animate="visible" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "1.5rem" }}>
                    <Card><SectionHead icon={<BarChart2 size={13} />}>Skill Breakdown</SectionHead>{avgCats.map((c, i) => <CatBar key={i} cat={c} delay={i * 0.05} />)}</Card>
                    <Card>
                      <SectionHead icon={<Shield size={13} />}>Insights</SectionHead>
                      {allStrengths.slice(0, 3).map((s, i) => (<div key={`s${i}`} style={{ display: "flex", gap: 5, alignItems: "flex-start", marginBottom: "0.4rem" }}><CheckCircle size={11} style={{ color: "#03b3c3", marginTop: 3, flexShrink: 0 }} /><span style={{ fontFamily: '"Quicksand",sans-serif', fontSize: "0.78rem", color: "rgba(245,245,245,0.55)", lineHeight: 1.4 }}>{s}</span></div>))}
                      {allImprovements.length > 0 && <div style={{ height: 1, background: "rgba(255,255,255,0.06)", margin: "0.6rem 0" }} />}
                      {allImprovements.slice(0, 3).map((a, i) => (<div key={`a${i}`} style={{ display: "flex", gap: 5, alignItems: "flex-start", marginBottom: "0.4rem" }}><AlertTriangle size={11} style={{ color: "#f59e0b", marginTop: 3, flexShrink: 0 }} /><span style={{ fontFamily: '"Quicksand",sans-serif', fontSize: "0.78rem", color: "rgba(245,245,245,0.55)", lineHeight: 1.4 }}>{a}</span></div>))}
                    </Card>
                  </motion.div>
                )}

                {/* type / role / trend */}
                {total > 0 && (
                  <motion.div variants={fadeUp(0.6)} initial="hidden" animate="visible" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem", marginBottom: "1.5rem" }}>
                    <Card>
                      <SectionHead icon={<Eye size={13} />}>By Type</SectionHead>
                      {Array.from(typeCount.entries()).map(([t, c]) => (<div key={t} style={{ display: "flex", justifyContent: "space-between", padding: "0.4rem 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}><span style={{ fontFamily: '"Quicksand",sans-serif', fontSize: "0.8rem", color: "rgba(245,245,245,0.5)", textTransform: "capitalize" }}>{t}</span><span style={{ fontFamily: '"Bricolage Grotesque",sans-serif', fontWeight: 700, color: "#03b3c3" }}>{c}</span></div>))}
                    </Card>
                    <Card>
                      <SectionHead icon={<Mic size={13} />}>By Role</SectionHead>
                      {Array.from(roleCount.entries()).slice(0, 4).map(([r, c]) => (<div key={r} style={{ display: "flex", justifyContent: "space-between", padding: "0.4rem 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}><span style={{ fontFamily: '"Quicksand",sans-serif', fontSize: "0.8rem", color: "rgba(245,245,245,0.5)" }}>{r}</span><span style={{ fontFamily: '"Bricolage Grotesque",sans-serif', fontWeight: 700, color: "#a78bfa" }}>{c}</span></div>))}
                    </Card>
                    <Card>
                      <SectionHead icon={<TrendingUp size={13} />}>Score Trend</SectionHead>
                      <div style={{ display: "flex", alignItems: "flex-end", gap: "0.4rem", height: 70 }}>
                        {recentScores.map((s, i) => (
                          <motion.div key={i} initial={{ height: 0 }} animate={{ height: `${Math.max(s, 5)}%` }} transition={{ duration: 0.6, delay: i * 0.08, ease: "easeOut" }}
                            style={{ flex: 1, borderRadius: "4px 4px 2px 2px", background: `linear-gradient(to top, ${scoreClr(s)}25, ${scoreClr(s)}99)`, position: "relative", minHeight: 3 }}>
                            <span style={{ position: "absolute", top: -15, left: "50%", transform: "translateX(-50%)", fontFamily: '"Bricolage Grotesque",sans-serif', fontSize: "0.6rem", fontWeight: 700, color: scoreClr(s) }}>{s}</span>
                          </motion.div>
                        ))}
                      </div>
                    </Card>
                  </motion.div>
                )}

                {/* recent sessions */}
                {total > 0 && (
                  <motion.div variants={fadeUp(0.65)} initial="hidden" animate="visible">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.8rem" }}>
                      <SectionHead icon={<Clock size={13} />}>Recent Sessions</SectionHead>
                      <button onClick={() => setView("history")} style={{ display: "flex", alignItems: "center", gap: 3, background: "none", border: "none", color: "#03b3c3", fontFamily: '"Quicksand",sans-serif', fontSize: "0.8rem", fontWeight: 600, cursor: "pointer" }}>View all<ChevronRight size={13} /></button>
                    </div>
                    {responses.slice(0, 3).map(r => {
                      const sc = r.evaluation?.totalScore || 0; return (
                        <div key={r._id} onClick={() => setView("history")} style={{ display: "flex", alignItems: "center", gap: "0.9rem", padding: "0.8rem 1rem", borderRadius: 10, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", marginBottom: "0.5rem", cursor: "pointer", transition: "background 0.2s" }}
                          onMouseOver={e => (e.currentTarget.style.background = "rgba(255,255,255,0.06)")} onMouseOut={e => (e.currentTarget.style.background = "rgba(255,255,255,0.04)")}>
                          <div style={{ width: 36, height: 36, borderRadius: 8, background: `${scoreClr(sc)}15`, border: `1px solid ${scoreClr(sc)}22`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: '"Bricolage Grotesque",sans-serif', fontWeight: 800, fontSize: "0.85rem", color: scoreClr(sc), flexShrink: 0 }}>{sc}</div>
                          <div style={{ flex: 1 }}><div style={{ fontFamily: '"Bricolage Grotesque",sans-serif', fontWeight: 700, fontSize: "0.88rem", color: "#F5F5F5" }}>{r.interviewId?.role || "Interview"}</div><div style={{ fontFamily: '"Quicksand",sans-serif', fontSize: "0.72rem", color: "rgba(245,245,245,0.3)" }}>{fmtDate(r.completedAt)}{r.duration && ` · ${fmtDur(r.duration)}`}</div></div>
                          <ArrowRight size={14} style={{ color: "rgba(245,245,245,0.15)" }} />
                        </div>
                      );
                    })}
                  </motion.div>
                )}

                {/* empty state */}
                {!loading && total === 0 && (
                  <motion.div variants={fadeUp(0.45)} initial="hidden" animate="visible" style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", marginTop: "1rem" }}>
                    <Zap size={36} style={{ color: "#03b3c3", opacity: 0.5, marginBottom: "1rem" }} />
                    <p style={{ fontFamily: '"Quicksand", sans-serif', fontSize: "clamp(1rem, 1.2vw, 1.2rem)", lineHeight: 1.7, color: "rgba(247,247,242,0.55)", marginBottom: "1.5rem" }}>Complete your first AI mock interview to unlock<br />analytics, skill breakdowns, and personalised feedback.</p>
                    <button onClick={() => navigate("/pre-interview")} className="cta-btn">Begin Mock Interview →</button>
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* ═══ HISTORY ═══════════════════════════════════════════ */}
            {view === "history" && (
              <motion.div key="hi" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.35 }}>
                <motion.h1 variants={fadeUp(0.2)} initial="hidden" animate="visible" style={{ fontFamily: '"Bricolage Grotesque", sans-serif', fontWeight: 800, fontSize: "clamp(2rem, 3.5vw, 3rem)", lineHeight: 1.08, letterSpacing: "-0.03em", color: "#F5F5F5", textAlign: "center", margin: "0 0 0.5rem" }}>Interview History</motion.h1>
                <motion.h1 variants={fadeUp(0.35)} initial="hidden" animate="visible" style={{ fontFamily: '"Quicksand", sans-serif', fontSize: "1.05rem", color: "rgba(247,247,242,0.55)", textAlign: "center", fontWeight: 400, marginBottom: "2rem" }}>
                  {total} session{total !== 1 ? "s" : ""} completed{total > 0 && ` · ${totalQs} questions answered`}
                </motion.h1>
                <motion.div variants={fadeUp(0.4)} initial="hidden" animate="visible" style={{ display: "flex", justifyContent: "right", marginBottom: "1rem" }}>
                  <button onClick={fetchData} style={{ display: "inline-flex", alignItems: "right", gap: 5, color: "rgba(245,245,245,0.5)", background: "none", border: "none", cursor: "pointer", fontFamily: '"Quicksand",sans-serif', fontSize: "0.85rem", transition: "color 0.2s" }}
                    onMouseOver={e => (e.currentTarget.style.color = "#03b3c3")} onMouseOut={e => (e.currentTarget.style.color = "rgba(245,245,245,0.5)")}>
                    <RefreshCw size={13} />Refresh
                  </button>
                </motion.div>
                {loading ? <div style={{ textAlign: "center", padding: "4rem 0", fontFamily: '"Quicksand",sans-serif', color: "rgba(245,245,245,0.2)" }}>Loading…</div>
                  : responses.length === 0 ? <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", padding: "4rem 0" }}><BarChart2 size={40} style={{ marginBottom: "1rem", opacity: 1, color: "#03b3c3" }} /><div style={{ fontFamily: '"Quicksand",sans-serif', color: "rgba(245,245,245,0.5)", fontSize: "0.95rem" }}>No interviews yet. <Link to="/" style={{ color: "#03b3c3", textDecoration: "none", fontWeight: 600 }}>Start one now →</Link></div></div>
                    : <motion.div variants={fadeUp(0.45)} initial="hidden" animate="visible"><AnimatePresence>{responses.map(r => <ResponseCard key={r._id} resp={r} onDelete={delResp} />)}</AnimatePresence></motion.div>}
              </motion.div>
            )}

            {/* ═══ PROFILE ═══════════════════════════════════════════ */}
            {view === "profile" && (
              <motion.div key="pr" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.35 }}>
                <motion.h1 variants={fadeUp(0.2)} initial="hidden" animate="visible" style={{ fontFamily: '"Bricolage Grotesque", sans-serif', fontWeight: 800, fontSize: "clamp(2rem, 3.5vw, 3rem)", lineHeight: 1.08, letterSpacing: "-0.03em", color: "#F5F5F5", textAlign: "center", margin: "0 0 0.5rem" }}>Your Profile</motion.h1>
                <motion.h1 variants={fadeUp(0.35)} initial="hidden" animate="visible" style={{ fontFamily: '"Quicksand", sans-serif', fontSize: "1.05rem", color: "rgba(247,247,242,0.55)", textAlign: "center", fontWeight: 400, marginBottom: "2.5rem" }}>Manage your account and view your stats</motion.h1>

                <div style={{ maxWidth: 480, margin: "0 auto", display: "flex", flexDirection: "column", gap: "1rem" }}>
                  {/* avatar */}
                  <motion.div variants={fadeUp(0.4)} initial="hidden" animate="visible">
                    <Card style={{ display: "flex", alignItems: "center", gap: "1.2rem", padding: "1.4rem" }}>
                      <div style={{ width: 60, height: 60, borderRadius: "50%", background: "linear-gradient(135deg, #03b3c3, #6750a2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <span style={{ fontFamily: '"Bricolage Grotesque",sans-serif', fontWeight: 800, fontSize: "1.4rem", color: "#fff" }}>{(user?.firstName?.[0] || user?.username?.[0] || "U").toUpperCase()}</span>
                      </div>
                      <div>
                        <div style={{ fontFamily: '"Bricolage Grotesque",sans-serif', fontWeight: 700, fontSize: "1.1rem", color: "#F5F5F5" }}>{user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : user?.username}</div>
                        <div style={{ fontFamily: '"Quicksand",sans-serif', fontSize: "0.85rem", color: "rgba(245,245,245,0.4)", marginTop: 2 }}>{user?.email}</div>
                      </div>
                    </Card>
                  </motion.div>

                  {/* form */}
                  <motion.form variants={fadeUp(0.5)} initial="hidden" animate="visible" onSubmit={e => { e.preventDefault(); handleSaveProfile(); }} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    {[{ label: "First Name", key: "firstName" }, { label: "Last Name", key: "lastName" }, { label: "Username", key: "username" }].map(f => (
                      <div key={f.key}>
                        <label style={{ display: "block", fontFamily: '"Quicksand",sans-serif', fontSize: "0.82rem", color: "rgba(245,245,245,0.4)", marginBottom: "0.35rem", fontWeight: 500 }}>{f.label}</label>
                        <input type="text" value={(profileForm as any)[f.key]} onChange={e => setProfileForm(p => ({ ...p, [f.key]: e.target.value }))} onFocus={onFocus} onBlur={onBlur} style={inputStyle} />
                      </div>
                    ))}
                    {profileMsg && <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ padding: "0.85rem 1rem", borderRadius: 10, background: profileMsg.includes("updated") ? "rgba(3,179,195,0.08)" : "rgba(220,38,38,0.08)", border: `1px solid ${profileMsg.includes("updated") ? "rgba(3,179,195,0.2)" : "rgba(220,38,38,0.2)"}`, color: profileMsg.includes("updated") ? "#03b3c3" : "#f87171", fontFamily: '"Quicksand",sans-serif', fontSize: "0.9rem" }}>{profileMsg}</motion.div>}
                    <button type="submit" disabled={saving} style={{ marginTop: "0.5rem", width: "100%", padding: "1rem", fontFamily: '"Quicksand",sans-serif', fontSize: "1.05rem", fontWeight: 600, letterSpacing: "0.02em", color: "#03b3c3", background: "transparent", border: "1.5px solid #03b3c3", borderRadius: 14, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.6 : 1, transition: "transform 0.3s cubic-bezier(0.25,0.46,0.45,0.94), opacity 0.25s ease" }}
                      onMouseOver={e => { if (!saving) e.currentTarget.style.transform = "scale(1.03)"; }} onMouseOut={e => { e.currentTarget.style.transform = "scale(1)"; }}>
                      {saving ? "Saving..." : "Save Changes →"}
                    </button>
                  </motion.form>

                  {/* stats */}
                  <motion.div variants={fadeUp(0.6)} initial="hidden" animate="visible" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem" }}>
                    {[{ label: "Interviews", value: total, color: "#03b3c3" }, { label: "Avg Score", value: avg, color: "#a78bfa" }, { label: "Best Score", value: best, color: "#f59e0b" }].map(s => (
                      <Card key={s.label} style={{ textAlign: "center", padding: "1rem" }}>
                        <div style={{ fontFamily: '"Bricolage Grotesque",sans-serif', fontWeight: 800, fontSize: "1.5rem", color: s.color, lineHeight: 1 }}>{s.value}</div>
                        <div style={{ fontFamily: '"Quicksand",sans-serif', fontSize: "0.75rem", color: "rgba(245,245,245,0.35)", marginTop: "0.25rem" }}>{s.label}</div>
                      </Card>
                    ))}
                  </motion.div>

                  {/* account info */}
                  <motion.div variants={fadeUp(0.65)} initial="hidden" animate="visible">
                    <Card>
                      <SectionHead icon={<Shield size={13} />}>Account Info</SectionHead>
                      <div style={{ fontFamily: '"Quicksand",sans-serif', fontSize: "0.85rem", color: "rgba(245,245,245,0.4)", lineHeight: 1.9 }}>
                        <div>Email: <span style={{ color: "rgba(245,245,245,0.65)" }}>{user?.email}</span></div>
                        <div>Username: <span style={{ color: "rgba(245,245,245,0.65)" }}>@{user?.username}</span></div>
                        <div>Role: <span style={{ color: "#03b3c3", textTransform: "capitalize" }}>{user?.role || "user"}</span></div>
                        <div>Questions answered: <span style={{ color: "rgba(245,245,245,0.65)" }}>{totalQs}</span></div>
                        <div>Practice time: <span style={{ color: "rgba(245,245,245,0.65)" }}>{fmtDur(totalTime)}</span></div>
                      </div>
                    </Card>
                  </motion.div>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>

      {/* ── Dock — bottom (same as Home page) ── */}
      <motion.div variants={slideUp(0.4)} initial="hidden" animate="visible">
        <Dock className="z-10" items={dockItems} />
      </motion.div>
    </div>
  );
}
