import React, { useEffect, useState } from "react";

// ========= Definisi Lencana (ASCII-only to avoid encoding issues) =========
export const BADGE_DEFS = {
  pasien1_selesai: {
    id: 1,
    key: "pasien1_selesai",
    title: "Pasien 1 Beres",
    subtitle: "Gigi Bersih",
    description: "Kamu berhasil membersihkan gigi Ciko hingga kinclong!",
    accent: "#22c55e",
    icon: "TOOTH",
  },
  pasien2_selesai: {
    id: 2,
    key: "pasien2_selesai",
    title: "Pasien 2 Beres",
    subtitle: "Tambal Rapi",
    description: "Lubang gigi Memei sudah ditangani dan ditambal rapi.",
    accent: "#3b82f6",
    icon: "FILL",
  },
  pasien3_selesai: {
    id: 3,
    key: "pasien3_selesai",
    title: "Pasien 3 Beres",
    subtitle: "Cabut Aman",
    description: "Gigi Aru berhasil dicabut dengan aman dan nyaman.",
    accent: "#f59e0b",
    icon: "EXTR",
  },
};

const ALL_KEYS = Object.keys(BADGE_DEFS);
const STORAGE_KEY = "game_badges_unlocked_v1";
const load = () => {
  try {
    return new Set(JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"));
  } catch {
    return new Set();
  }
};
const save = (set) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...set]));
  } catch {}
};

// ========= Menu Lencana =========
export default function LencanaMenu({ onBack, pendingBadgeKey, onClaimed }) {
  const [unlocked, setUnlocked] = useState(load);
  const [popup, setPopup] = useState(null); // key

  // auto buka popup jika ada pending
  useEffect(() => {
    if (!pendingBadgeKey) return;
    if (!unlocked.has(pendingBadgeKey)) setPopup(pendingBadgeKey);
  }, [pendingBadgeKey, unlocked]);

  // global keyframes (sekali)
  useEffect(() => {
    if (document.getElementById("badge-kf")) return;
    const s = document.createElement("style");
    s.id = "badge-kf";
    s.innerHTML = `
      @keyframes fall {0%{transform:translateY(-20px) rotate(0);opacity:0}
        10%{opacity:1}100%{transform:translateY(110vh) rotate(360deg);opacity:.9}}
      @keyframes popIn {0%{transform:scale(.92);opacity:0}100%{transform:scale(1);opacity:1}}
      @keyframes rise {0%{transform:translateY(8px);opacity:.2}100%{transform:translateY(-8px);opacity:1}}
    `;
    document.head.appendChild(s);
  }, []);

  const claim = (key) => {
    const next = new Set(unlocked);
    next.add(key);
    setUnlocked(next);
    save(next);
    setPopup(null);
    onClaimed?.(key);
  };

  return (
    <div style={{ padding: 24, maxWidth: 980, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <button onClick={onBack} style={btnBack} title="Kembali">
          - Kembali
        </button>
        <h2 style={{ margin: 0 }}>Menu Lencana</h2>
        <span style={{ marginLeft: "auto", color: "#64748b", fontWeight: 600 }}>
          Progres: {unlocked.size}/{ALL_KEYS.length} lencana
        </span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px,1fr))", gap: 14, marginTop: 16 }}>
        {ALL_KEYS.map((k) => {
          const def = BADGE_DEFS[k];
          const got = unlocked.has(k);
          const tint = got ? def.accent : "#cbd5e1";
          return (
            <div key={k} style={{ ...card, borderColor: tint }}>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <span style={{ ...badgeIcon, background: tint, filter: got ? "none" : "grayscale(60%)" }}>{def.icon}</span>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 18, fontWeight: 800 }}>{def.title}</span>
                    <span style={{ ...pill, borderColor: tint, color: tint }}>#{def.id}</span>
                  </div>
                  <div style={{ fontSize: 13, color: "#475569", fontWeight: 600 }}>{def.subtitle}</div>
                </div>
              </div>
              <div style={{ marginTop: 8, color: "#334155", fontSize: 13 }}>{def.description}</div>
              <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                <button
                  onClick={() => setPopup(k)}
                  disabled={got}
                  style={{ ...btnPrimary, background: got ? "#e5e7eb" : def.accent, cursor: got ? "not-allowed" : "pointer" }}
                >
                  {got ? "Terklaim" : "Claim"}
                </button>
                <span style={{ marginLeft: "auto", color: got ? "#16a34a" : "#64748b", fontWeight: 700, alignSelf: "center" }}>
                  {got ? "Diperoleh" : "Terkunci"}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {popup && (
        <BadgePopup def={BADGE_DEFS[popup]} onClose={() => setPopup(null)} onClaim={() => claim(popup)} />
      )}
    </div>
  );
}

// ========= Popup Klaim =========
function BadgePopup({ def, onClose, onClaim }) {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => (document.body.style.overflow = prev);
  }, []);
  return (
    <div role="dialog" aria-modal="true" style={overlay}>
      <Confetti accent={def.accent} />
      <div style={{ ...modalCard, borderColor: def.accent }}>
        <button onClick={onClose} style={closeBtn} aria-label="Tutup">x</button>
        <div style={{ display: "flex", gap: 12, alignItems: "center", justifyContent: "center", marginTop: 2 }}>
          <span style={{ ...badgeIcon, background: def.accent }}>{def.icon}</span>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "center" }}>
              <span style={{ fontSize: 22, fontWeight: 800 }}>{def.title}</span>
              <span style={{ ...pill, borderColor: def.accent, color: def.accent }}>#{def.id}</span>
            </div>
            <div style={{ fontSize: 14, color: "#475569", fontWeight: 600, textAlign: "center" }}>{def.subtitle}</div>
          </div>
        </div>
        <Medal accent={def.accent} />
        <p style={{ margin: "6px auto 12px", color: "#334155", lineHeight: 1.5, maxWidth: 420 }}>{def.description}</p>
        <div style={{ display: "flex", justifyContent: "center" }}>
          <button onClick={onClaim} style={{ ...btnPrimary, background: def.accent }}>Claim</button>
        </div>
      </div>
    </div>
  );
}

function Confetti({ accent = "#22c55e" }) {
  const n = 36, colors = [accent, "#f59e0b", "#3b82f6", "#ef4444", "#10b981", "#a855f7"];
  return (
    <div aria-hidden style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
      {Array.from({ length: n }).map((_, i) => {
        const style = {
          left: `${Math.random() * 100}%`,
          animationDelay: `${Math.random() * 0.6}s`,
          animationDuration: `${1.2 + Math.random() * 0.8}s`,
          width: 6 + Math.floor(Math.random() * 8),
          height: 6 + Math.floor(Math.random() * 8),
          background: colors[i % colors.length],
          transform: `rotate(${Math.random() * 360}deg)`
        };
        return <span key={i} style={{ position: "absolute", top: "-10px", borderRadius: 2, animation: "fall linear 1", ...style }} />;
      })}
    </div>
  );
}

function Medal({ accent }) {
  return (
    <div style={{ marginTop: 12, marginBottom: 6 }}>
      <svg width="160" height="160" viewBox="0 0 160 160">
        <circle cx="80" cy="80" r="64" fill="#f8fafc" stroke="#e5e7eb" strokeWidth="4" />
        <circle cx="80" cy="76" r="38" fill={accent} opacity=".92" />
        <circle cx="80" cy="76" r="28" fill="rgba(255,255,255,.3)" />
        <path d="M58 118 l-14 28 22 -10 4 -18 Z" fill="#94a3b8" />
        <path d="M102 118 l14 28 -22 -10 -4 -18 Z" fill="#64748b" />
      </svg>
    </div>
  );
}

// ========= Styles =========
const card = { padding: 16, borderRadius: 14, background: "#fff", border: "1px solid #e5e7eb", boxShadow: "0 2px 8px rgba(0,0,0,.06)" };
const badgeIcon = { height: 44, width: 44, borderRadius: 12, color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800, boxShadow: "0 6px 18px rgba(0,0,0,.15)" };
const pill = { fontSize: 12, padding: "2px 8px", borderRadius: 999, border: "1px solid", fontWeight: 700, background: "#fff" };
const btnPrimary = { border: "none", color: "#fff", fontWeight: 800, padding: "10px 16px", borderRadius: 12, cursor: "pointer", boxShadow: "0 10px 24px rgba(0,0,0,.12)" };
const btnBack = { padding: "8px 14px", borderRadius: 10, border: "1px solid #1976d2", background: "#e3f2fd", color: "#1976d2", fontWeight: "bold", cursor: "pointer" };
const overlay = { position: "fixed", inset: 0, background: "radial-gradient(ellipse at center, rgba(15,23,42,.45), rgba(2,6,23,.65))", backdropFilter: "blur(2px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: 16 };
const modalCard = { position: "relative", width: "min(560px,92vw)", borderRadius: 16, border: "2px solid", background: "#fff", boxShadow: "0 24px 80px rgba(0,0,0,.25)", padding: 20, textAlign: "center", overflow: "hidden", animation: "popIn .18s ease-out both" };
const closeBtn = { position: "absolute", top: 10, right: 10, height: 36, width: 36, borderRadius: 10, border: "1px solid #e5e7eb", background: "#f8fafc", cursor: "pointer", fontWeight: 700 };

