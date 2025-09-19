import React, { useEffect, useState } from "react";

/* ========= Definisi Lencana (ASCII-only friendly) ========= */
export const BADGE_DEFS = {
  pasien1_selesai: {
    id: 1,
    key: "pasien1_selesai",
    title: "Pasien 1 Beres",
    subtitle: "Gigi Bersih",
    description: "Kamu berhasil membersihkan gigi Ciko hingga kinclong!",
    accent: "#22c55e",
  },
  pasien2_selesai: {
    id: 2,
    key: "pasien2_selesai",
    title: "Pasien 2 Beres",
    subtitle: "Tambal Rapi",
    description: "Lubang gigi Memei sudah ditangani dan ditambal rapi.",
    accent: "#3b82f6",
  },
  pasien3_selesai: {
    id: 3,
    key: "pasien3_selesai",
    title: "Pasien 3 Beres",
    subtitle: "Cabut Aman",
    description: "Gigi Aru berhasil dicabut dengan aman dan nyaman.",
    accent: "#f59e0b",
  },
};

const ALL_KEYS = Object.keys(BADGE_DEFS);
const STORAGE_KEY = "game_badges_unlocked_v1";
// tambahan kecil agar flow reward bisa diulang saat popup ditutup (reset pending)
const STORAGE_KEY_PENDING = "game_badges_pending_v1";

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

/* ========= Util: Ikon SVG ringan ========= */
function BadgeSVG({ type, accent, locked = false }) {
  // 3 tipe ikon sederhana agar tampak konsisten: TOOTH, FILL, EXTR
  // Namun tetap ASCII-safe (tanpa emoji/teks khusus)
  const common = { fill: "none", stroke: locked ? "#94a3b8" : "#fff", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" };
  return (
    <svg viewBox="0 0 48 48" width="44" height="44" style={{ display: "block" }}>
      <defs>
        <linearGradient id={`g-${accent}`} x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor={locked ? "#cbd5e1" : accent} />
          <stop offset="1" stopColor={locked ? "#94a3b8" : shade(accent, -12)} />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="44" height="44" rx="12" fill={`url(#g-${accent})`} />
      {/* overlay locked */}
      {locked && <rect x="2" y="2" width="44" height="44" rx="12" fill="rgba(15,23,42,.22)" />}
      {type === "TOOTH" && (
        <g {...common}>
          <path d="M24 12c8 0 12 4 12 10 0 6-4 10-6 10-2 0-2-3-4-3s-2 3-4 3-6-4-6-10c0-6 4-10 12-10Z" />
          <path d="M20 18c2-2 6-2 8 0" />
        </g>
      )}
      {type === "FILL" && (
        <g {...common}>
          <rect x="12" y="14" width="24" height="20" rx="6" />
          <path d="M16 20h16" />
          <path d="M20 28h8" />
        </g>
      )}
      {type === "EXTR" && (
        <g {...common}>
          <path d="M16 30h16" />
          <path d="M32 18v12" />
          <path d="M12 22h10l2-4h10" />
        </g>
      )}
    </svg>
  );
}

function shade(hex, amt = -10) {
  // kecil2an util ubah terang/gelap warna
  try {
    const c = hex.replace("#", "");
    const n = parseInt(c, 16);
    let r = (n >> 16) + amt, g = ((n >> 8) & 0xff) + amt, b = (n & 0xff) + amt;
    r = Math.max(0, Math.min(255, r));
    g = Math.max(0, Math.min(255, g));
    b = Math.max(0, Math.min(255, b));
    return `#${(r << 16 | g << 8 | b).toString(16).padStart(6, "0")}`;
  } catch {
    return hex;
  }
}

/* ========= Komponen Utama ========= */
export default function LencanaMenu({ onBack, pendingBadgeKey, onClaimed }) {
  const [unlocked, setUnlocked] = useState(load);
  const [popup, setPopup] = useState(null); // key

  // simpan/bersihkan pending ke storage (agar bisa diulang saat close)
  useEffect(() => {
    try {
      if (pendingBadgeKey) {
        localStorage.setItem(STORAGE_KEY_PENDING, pendingBadgeKey);
      } else {
        localStorage.removeItem(STORAGE_KEY_PENDING);
      }
    } catch {}
  }, [pendingBadgeKey]);

  // buka popup otomatis jika ada pending badge yang belum diklaim
  useEffect(() => {
    if (!pendingBadgeKey) return;
    if (!unlocked.has(pendingBadgeKey)) setPopup(pendingBadgeKey);
  }, [pendingBadgeKey, unlocked]);

  // global keyframes (sekali saja) — animasi sama persis
  useEffect(() => {
    if (document.getElementById("badge-kf")) return;
    const s = document.createElement("style");
    s.id = "badge-kf";
    s.innerHTML = `
      @keyframes fall {0%{transform:translateY(-20px) rotate(0);opacity:0}
        12%{opacity:1}100%{transform:translateY(110vh) rotate(360deg);opacity:.9}}
      @keyframes popIn {0%{transform:scale(.92);opacity:0}100%{transform:scale(1);opacity:1}}
      @keyframes floaty {0%{transform:translateY(0)}50%{transform:translateY(-6px)}100%{transform:translateY(0)}}
    `;
    document.head.appendChild(s);
  }, []);

  const progress = unlocked.size / ALL_KEYS.length;

  // GATING: klaim hanya jika key === pendingBadgeKey dan belum unlocked
  const claim = (key) => {
    if (!key || key !== pendingBadgeKey) return;
    const next = new Set(unlocked);
    if (next.has(key)) return;

    next.add(key);
    setUnlocked(next);
    save(next);
    setPopup(null);
    try { localStorage.removeItem(STORAGE_KEY_PENDING); } catch {}
    onClaimed?.(key);
  };

  return (
    <div style={wrap}>
      {/* Header */}
      <div style={headerRow}>
        <button onClick={onBack} style={btnBack} title="Kembali">Kembali</button>
        <h2 style={title}>Menu Lencana</h2>
        <div style={progressWrap} aria-label="Progres Lencana">
          <div style={progressBar}>
            <div style={{ ...progressFill, width: `${Math.round(progress * 100)}%` }} />
          </div>
          <span style={progressText}>
            {unlocked.size}/{ALL_KEYS.length} lencana
          </span>
        </div>
      </div>

      {/* Grid Lencana */}
      <div style={grid}>
        {ALL_KEYS.map((k) => {
          const def = BADGE_DEFS[k];
          const got = unlocked.has(k);
          const canClaim = !got && pendingBadgeKey === k; // <== gating tombol

          return (
            <div key={k} style={{ ...card, borderColor: got ? def.accent : "#e5e7eb" }}>
              <div style={cardTop}>
                <div style={{ ...iconRing, background: got ? "transparent" : "#f1f5f9", borderColor: got ? def.accent : "#e2e8f0" }}>
                  <BadgeSVG type={getTypeFromKey(k)} accent={def.accent} locked={!got} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={titleRow}>
                    <span style={badgeTitle}>{def.title}</span>
                    <span style={{ ...pill, borderColor: got ? def.accent : "#cbd5e1", color: got ? def.accent : "#64748b" }}>#{def.id}</span>
                  </div>
                  <div style={subtitle}>{def.subtitle}</div>
                </div>
              </div>

              <p style={desc}>{def.description}</p>

              <div style={cardBottom}>
                <button
                  onClick={() => setPopup(k)}
                  disabled={!canClaim} // hanya aktif bila eligible
                  style={{
                    ...btnPrimary,
                    background: canClaim ? def.accent : "#e5e7eb",
                    color: canClaim ? "#fff" : "#475569",
                    cursor: canClaim ? "pointer" : "not-allowed",
                  }}
                  title={
                    got
                      ? "Sudah diklaim"
                      : canClaim
                      ? "Klaim lencana"
                      : "Terkunci (selesaikan pasien dulu)"
                  }
                >
                  {got ? "Terklaim" : (canClaim ? "Claim" : "Terkunci")}
                </button>
                <span
                  style={{
                    ...statusText,
                    color: got ? "#16a34a" : "#64748b",
                  }}
                >
                  {got ? "Diperoleh" : "Terkunci"}
                </span>
              </div>

              {!got && <div style={lockStripe} aria-hidden />}
            </div>
          );
        })}
      </div>

      {/* Popup Klaim */}
      {popup && (
        <BadgePopup
          def={BADGE_DEFS[popup]}
          onClose={() => {
            // RESET flow reward saat tombol silang: pending dihapus, bisa muncul lagi nanti
            try { localStorage.removeItem(STORAGE_KEY_PENDING); } catch {}
            setPopup(null);
          }}
          onClaim={() => claim(popup)}
          canClaim={pendingBadgeKey === popup && !unlocked.has(popup)} // anti-bypass
        />
      )}
    </div>
  );
}

/* ========= Popup Klaim ========= */
function BadgePopup({ def, onClose, onClaim, canClaim }) {
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
        <div style={modalHead}>
          <div style={{ ...iconRing, borderColor: def.accent }}>
            <BadgeSVG type={getTypeFromKey(def.key)} accent={def.accent} />
          </div>
          <div>
            <div style={modalTitleRow}>
              <span style={modalTitle}>{def.title}</span>
              <span style={{ ...pill, borderColor: def.accent, color: def.accent }}>#{def.id}</span>
            </div>
            <div style={modalSubtitle}>{def.subtitle}</div>
          </div>
        </div>
        <Medal accent={def.accent} />
        <p style={modalDesc}>{def.description}</p>
        <div style={{ display: "flex", justifyContent: "center" }}>
          <button
            onClick={onClaim}
            disabled={!canClaim}
            style={{ ...btnPrimary, background: canClaim ? def.accent : "#e5e7eb", color: canClaim ? "#fff" : "#475569", cursor: canClaim ? "pointer" : "not-allowed" }}
            title={canClaim ? "Klaim lencana" : "Terkunci (selesaikan pasien dulu)"}
          >
            {canClaim ? "Claim" : "Terkunci"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ========= Animasi Konfeti ========= */
function Confetti({ accent = "#22c55e" }) {
  const n = 38, colors = [accent, "#f59e0b", "#3b82f6", "#ef4444", "#10b981", "#a855f7"];
  return (
    <div aria-hidden style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
      {Array.from({ length: n }).map((_, i) => {
        const style = {
          left: `${Math.random() * 100}%`,
          animationDelay: `${Math.random() * 0.6}s`,
          animationDuration: `${1.15 + Math.random() * 0.9}s`,
          width: 6 + Math.floor(Math.random() * 8),
          height: 6 + Math.floor(Math.random() * 8),
          background: colors[i % colors.length],
          transform: `rotate(${Math.random() * 360}deg)`,
        };
        return <span key={i} style={{ position: "absolute", top: "-10px", borderRadius: 2, animation: "fall linear 1", ...style }} />;
      })}
    </div>
  );
}

/* ========= Medal ========= */
function Medal({ accent }) {
  return (
    <div style={{ marginTop: 10, marginBottom: 4, animation: "floaty 3s ease-in-out infinite" }}>
      <svg width="160" height="160" viewBox="0 0 160 160">
        <circle cx="80" cy="80" r="64" fill="#f8fafc" stroke="#e5e7eb" strokeWidth="4" />
        <circle cx="80" cy="76" r="38" fill={accent} opacity=".92" />
        <circle cx="80" cy="76" r="28" fill="rgba(255,255,255,.28)" />
        <path d="M58 118 l-14 28 22 -10 4 -18 Z" fill="#cbd5e1" />
        <path d="M102 118 l14 28 -22 -10 -4 -18 Z" fill="#94a3b8" />
      </svg>
    </div>
  );
}

/* ========= Helper ========= */
function getTypeFromKey(k) {
  if (k.includes("pasien1")) return "TOOTH";
  if (k.includes("pasien2")) return "FILL";
  return "EXTR";
}

/* ========= Styles ========= */
const wrap = { padding: 24, maxWidth: 1040, margin: "0 auto", fontFamily: "Inter, system-ui, Arial, sans-serif" };

const headerRow = { display: "grid", gridTemplateColumns: "auto 1fr auto", alignItems: "center", gap: 12 };
const title = { margin: 0, fontSize: 22, fontWeight: 800, color: "#0f172a", letterSpacing: ".2px" };

const progressWrap = { display: "flex", alignItems: "center", gap: 10, marginLeft: 8 };
const progressBar = { width: 180, height: 10, background: "#e5e7eb", borderRadius: 999, overflow: "hidden", boxShadow: "inset 0 1px 3px rgba(0,0,0,.06)" };
const progressFill = { height: "100%", background: "linear-gradient(90deg,#22c55e,#16a34a)", borderRadius: 999, transition: "width .25s ease" };
const progressText = { color: "#475569", fontWeight: 700, fontSize: 13 };

const grid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
  gap: 16,
  marginTop: 16,
};

const card = {
  display: "grid",
  gridTemplateRows: "auto 1fr auto",
  minHeight: 176,
  padding: 16,
  borderRadius: 14,
  background: "#fff",
  border: "1px solid #e5e7eb",
  boxShadow: "0 2px 10px rgba(0,0,0,.06)",
  position: "relative",
  transition: "transform .14s ease, box-shadow .14s ease, border-color .14s ease",
};
const cardTop = { display: "flex", gap: 12, alignItems: "center" };
const titleRow = { display: "flex", alignItems: "center", gap: 8, minWidth: 0, flexWrap: "wrap" };
const badgeTitle = { fontSize: 16, fontWeight: 800, color: "#0f172a", whiteSpace: "nowrap", textOverflow: "ellipsis", overflow: "hidden", maxWidth: "100%" };
const subtitle = { fontSize: 13, color: "#475569", fontWeight: 600, marginTop: 2 };
const desc = { margin: "10px 0 0", color: "#334155", fontSize: 13, lineHeight: 1.5 };

const cardBottom = { display: "flex", gap: 10, alignItems: "center", marginTop: 12 };
const statusText = { fontWeight: 800, marginLeft: "auto" };

const iconRing = {
  height: 56,
  width: 56,
  borderRadius: 14,
  display: "grid",
  placeItems: "center",
  border: "2px solid",
  boxShadow: "0 12px 28px rgba(0,0,0,.08)",
  background: "#fff",
};

const pill = {
  fontSize: 12,
  padding: "2px 8px",
  borderRadius: 999,
  border: "1px solid",
  fontWeight: 800,
  background: "#fff",
};

const btnPrimary = {
  border: "none",
  color: "#fff",
  fontWeight: 900,
  padding: "10px 16px",
  borderRadius: 12,
  cursor: "pointer",
  boxShadow: "0 10px 24px rgba(0,0,0,.12)",
  transition: "transform .08s ease, box-shadow .12s ease, filter .12s ease",
};
const btnBack = {
  padding: "8px 14px",
  borderRadius: 10,
  border: "1px solid #1976d2",
  background: "#e3f2fd",
  color: "#1976d2",
  fontWeight: "bold",
  cursor: "pointer",
};

const lockStripe = {
  content: '""',
  position: "absolute",
  inset: 0,
  pointerEvents: "none",
  background:
    "repeating-linear-gradient(135deg, rgba(2,6,23,.03) 0 16px, rgba(2,6,23,.06) 16px 32px)",
  borderRadius: 14,
};

/* ========= Modal Styles ========= */
const overlay = {
  position: "fixed",
  inset: 0,
  background: "radial-gradient(ellipse at center, rgba(15,23,42,.45), rgba(2,6,23,.65))",
  backdropFilter: "blur(2px)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 50,
  padding: 16,
};

const modalCard = {
  position: "relative",
  width: "min(560px,92vw)",
  borderRadius: 16,
  border: "2px solid",
  background: "#fff",
  boxShadow: "0 24px 80px rgba(0,0,0,.25)",
  padding: 20,
  textAlign: "center",
  overflow: "hidden",
  animation: "popIn .18s ease-out both",
};

const closeBtn = {
  position: "absolute",
  top: 10,
  right: 10,
  height: 36,
  width: 36,
  borderRadius: 10,
  border: "1px solid #e5e7eb",
  background: "#f8fafc",
  cursor: "pointer",
  fontWeight: 700,
};

const modalHead = { display: "flex", gap: 14, alignItems: "center", justifyContent: "center", marginTop: 4 };
const modalTitleRow = { display: "flex", alignItems: "center", gap: 8, justifyContent: "center", flexWrap: "wrap" };
const modalTitle = { fontSize: 22, fontWeight: 900, color: "#0f172a", letterSpacing: ".2px" };
const modalSubtitle = { fontSize: 14, color: "#475569", fontWeight: 700, textAlign: "center", marginTop: 2 };
const modalDesc = { margin: "8px auto 14px", color: "#334155", lineHeight: 1.6, maxWidth: 440 };
