import React, { useEffect, useMemo, useRef, useState } from 'react';

/* ===================== Data ===================== */
const BASE_INGREDIENTS = [
  { id: 'mint', label: '🌿 Daun Mint', color: '#6ee7b7' },
  { id: 'fluoride_salt', label: '🧂 Garam Fluoride', color: '#bfdbfe' },
  { id: 'honey', label: '🍯 Madu antiseptik', color: '#fbbf24' },
  { id: 'herbal_mouthwash', label: '🫗 Obat Kumur Herbal', color: '#8fd694' },

  { id: 'paracetamol', label: '💊 Parasetamol mini', color: '#e0e7ff' },
  { id: 'green_tea', label: '🍵 Ekstrak Teh Hijau', color: '#86efac' },
  { id: 'garlic_powder', label: '🧄 Bubuk Bawang Putih', color: '#fde68a' },
  { id: 'med_fluoride_gel', label: '🧴 Gel Fluoride Medis', color: '#a5b4fc' },

  { id: 'light_antibiotic', label: '💊 Antibiotik ringan', color: '#fecaca' },
  { id: 'chamomile', label: '🌼 Ekstrak Chamomile', color: '#fcd34d' },
  { id: 'herbal_ice', label: '🧊 Bubuk Es Herbal', color: '#bae6fd' },
  { id: 'calcium_milk', label: '🥛 Susu Kalsium', color: '#f1f5f9' },
];

// Item tambahan non-herbal untuk variasi acak (bukan bagian resep)
const EXTRA_POOL = [
  { id: 'xylitol', label: '🍭 Xylitol', color: '#fde68a' },
  { id: 'sodium_bicarb', label: '🧪 Sodium Bikarbonat', color: '#c7d2fe' },
  { id: 'menthol_synth', label: '🌬️ Menthol Sintetis', color: '#bae6fd' },
  { id: 'sweetener', label: '🍬 Pemanis Buatan', color: '#fbcfe8' },
  { id: 'preservative', label: '🧴 Pengawet Ringan', color: '#d1fae5' },
  { id: 'food_color', label: '🎨 Pewarna Pangan', color: '#fecaca' },
  { id: 'glycerin', label: '🧫 Gliserin', color: '#e5e7eb' },
  { id: 'sorbitol', label: '🧊 Sorbitol', color: '#e0f2fe' },
];

const RECIPES = {
  0: {
    goal: 'mencegah bakteri balik & bikin gigi lebih segar',
    needs: ['mint', 'fluoride_salt', 'honey', 'herbal_mouthwash'],
    result: 'Racikan akhir: Obat kumur pencegah karang.',
    targetName: 'Pasta Gigi',
  },
  1: {
    goal: 'meredakan nyeri & mencegah infeksi',
    needs: ['paracetamol', 'green_tea', 'garlic_powder', 'med_fluoride_gel'],
    result:
      'Racikan akhir: Obat minum pereda sakit gigi + gel oles penguat gigi.',
    targetName: 'Botol Obat Pencegah Gigi Berlubang',
  },
  2: {
    goal: 'mencegah infeksi & mempercepat penyembuhan',
    needs: ['light_antibiotic', 'chamomile', 'herbal_ice', 'calcium_milk'],
    result:
      'Racikan akhir: Obat minum antibiotik ringan + obat oles pereda bengkak.',
    targetName: 'Botol Obat Pereda Nyeri Pasca Cabut',
  },
};

/* ===================== Utils ===================== */
function mixColors(hexList, base = '#c7f9e5') {
  const list = hexList.length ? hexList : [base];
  const toRGB = (h) => {
    const v = h.replace('#', '');
    const n = parseInt(v, 16);
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
  };
  const acc = list.map(toRGB).reduce(
    (a, c) => ({ r: a.r + c.r, g: a.g + c.g, b: a.b + c.b }),
    { r: 0, g: 0, b: 0 }
  );
  const n = list.length;
  const r = Math.round(acc.r / n).toString(16).padStart(2, '0');
  const g = Math.round(acc.g / n).toString(16).padStart(2, '0');
  const b = Math.round(acc.b / n).toString(16).padStart(2, '0');
  return `#${r}${g}${b}`;
}

const getIcon = (label) => (label ? label.split(' ')[0] : '🧪');
const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

/* ===================== Component ===================== */
const CraftingLab = ({ patientIdx = 0, onBack, onFinish }) => {
  const recipe = RECIPES[patientIdx] ?? RECIPES[0];

  const [beakerItems, setBeakerItems] = useState([]); // array of ids
  const [isShaking, setIsShaking] = useState(false);
  const [isRotten, setIsRotten] = useState(false);
  const [message, setMessage] = useState('');
  const [hoverTip, setHoverTip] = useState(null); // {text, x, y}
  const [isPouring, setIsPouring] = useState(false);
  const [fillLevel, setFillLevel] = useState(0); // 0..1
  const [hasShaken, setHasShaken] = useState(false);
  const [hasPoured, setHasPoured] = useState(false);

  const beakerRef = useRef(null);

  // Random inventory = base items + 4 random extras, lalu diacak posisinya
  const inventoryItems = useMemo(() => {
    const extras = shuffle(EXTRA_POOL).slice(0, 4);
    return shuffle([...BASE_INGREDIENTS, ...extras]);
  }, []);

  const beakerColor = useMemo(() => {
    if (isRotten) return '#556b2f';
    const colors = beakerItems
      .map((id) => inventoryItems.find((i) => i.id === id)?.color)
      .filter(Boolean);
    return mixColors(colors);
  }, [beakerItems, isRotten, inventoryItems]);

  const valid = useMemo(() => {
    const need = new Set(recipe.needs);
    const have = new Set(beakerItems);
    if (need.size !== have.size) return false;
    for (const x of need) if (!have.has(x)) return false;
    return true;
  }, [recipe.needs, beakerItems]);

  const canCraft = beakerItems.length >= 4;
  const canPour = canCraft && valid && hasShaken && !isPouring;
  const pourTitle = canPour
    ? 'Tuang ke ' + recipe.targetName
    : isPouring
    ? 'Sedang menuang...'
    : !canCraft
    ? 'Masukkan minimal 4 bahan dulu.'
    : !valid
    ? 'Racikan harus sesuai resep sebelum menuang.'
    : hasShaken
    ? 'Shake ulang jika perlu sebelum menuang.'
    : 'Shake ramuan dulu sebelum menuang.';

  // Sembunyikan scrollbar halaman saat di lab (tanpa mematikan scroll)
  useEffect(() => {
    document.body.classList.add('lab-hide-scrollbars');
    return () => document.body.classList.remove('lab-hide-scrollbars');
  }, []);

  /* ---------- DnD ---------- */
  const onDragStart = (e, id) => {
    e.dataTransfer.setData('text/plain', id);
    e.dataTransfer.effectAllowed = 'move';
  };
  const onDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };
  const onDrop = (e) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain');
    if (!id || beakerItems.includes(id)) return;
    setBeakerItems((prev) => [...prev, id]);
    setIsShaking(true);
    setIsRotten(false);
    setHasShaken(false);
    setHasPoured(false);
    setTimeout(() => setIsShaking(false), 600);
  };

  const removeFromBeaker = (id) => {
    setBeakerItems((prev) => prev.filter((x) => x !== id));
    setHasShaken(false);
    setHasPoured(false);
  };

  const reset = () => {
    setBeakerItems([]);
    setIsRotten(false);
    setMessage('');
    setIsPouring(false);
    setFillLevel(0);
    setHasShaken(false);
    setHasPoured(false);
  };

  const tryShake = () => {
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 600);
    if (!canCraft) {
      setMessage('Masukkan minimal 4 bahan dulu.');
      setHasShaken(false);
      return;
    }
    setHasShaken(true);
    if (valid) {
      setMessage('Racikan cocok! Sekarang bisa dituang ke ' + recipe.targetName + '.');
      return;
    }
    setMessage('Ramuan meledak busuk! Coba kombinasi lain.');
    setIsRotten(true);
    setTimeout(() => setIsRotten(false), 2500);
  };

  const pourToContainer = () => {
    if (!canPour) return;
    setIsPouring(true);
    setMessage('Menuang ke ' + recipe.targetName + '...');
    setIsShaking(false);
    const start = Date.now();
    const duration = 1400;
    const step = () => {
      const t = Math.min(1, (Date.now() - start) / duration);
      setFillLevel(t);
      if (t < 1) requestAnimationFrame(step);
      else {
        setIsPouring(false);
        setMessage('Tertuang ke ' + recipe.targetName + '!');
        setBeakerItems([]);
        setHasShaken(false);
        setHasPoured(true);
      }
    };
    requestAnimationFrame(step);
  };

  /* ---------- Styles ---------- */
  const card = {
    padding: 16,
    borderRadius: 12,
    background: '#fff',
    boxShadow: '0 2px 8px rgba(0,0,0,.08)',
  };

  return (
    <div style={{ padding: 32, maxWidth: 1100, margin: '0 auto' }}>
      <style>{`
        @keyframes shake { 0%{transform:rotate(0)} 25%{transform:rotate(-2deg)} 50%{transform:rotate(2deg)} 75%{transform:rotate(-1deg)} 100%{transform:rotate(0)} }
        .shake { animation: shake .6s ease; }
        .tilt { transform: rotate(18deg); transform-origin: 50% 90%; transition: transform .25s ease; }

        @keyframes rise {
          0% { transform: translate(-50%, 0); opacity: 0; }
          20% { opacity: .9; }
          100% { transform: translate(-50%, -130px); opacity: 0; }
        }
        .bubble { position:absolute; bottom:90px; left:50%; border-radius:999px; background:white; filter:blur(.5px); }

        @keyframes smokeUp {
          0% { transform: translateY(0) scale(.8); opacity: 0; }
          20% { opacity: .8; }
          100% { transform: translateY(-120px) scale(1.2); opacity: 0; }
        }
        .smoke { position:absolute; bottom:140px; left:50%; width: 14px; height: 14px; border-radius: 50%;
                 background: radial-gradient(closest-side, rgba(185,255,170,.8), rgba(85,107,47,0));
                 animation: smokeUp 1.6s linear infinite; filter: blur(2px); }
        .rot-border { box-shadow: inset 0 0 0 2px rgba(85,107,47,.5), 0 0 24px rgba(85,107,47,.35); }

        .hotbar { position: sticky; bottom: 0; z-index: 5; background: linear-gradient(180deg, rgba(241,245,249,.95), rgba(226,232,240,.95));
                  border-top: 1px solid #cbd5e1; box-shadow: 0 -6px 16px rgba(0,0,0,.08); border-radius: 12px 12px 0 0; padding: 10px 12px; }
        .slot { height: 56px; width: 56px; border-radius: 8px; border: 2px solid #cbd5e1; background: #fff; display: inline-flex; align-items: center;
                justify-content: center; user-select: none; cursor: grab; box-shadow: inset 0 0 0 2px rgba(255,255,255,0.6), 0 1px 3px rgba(0,0,0,.06); }
        .slotFilled { outline: 3px solid #a7f3d0; }
        .tooltip { position: fixed; pointer-events: none; transform: translate(12px, 12px); background: rgba(17,24,39,.95); color: white; font-size: 12px;
                   padding: 6px 10px; border-radius: 6px; border: 1px solid rgba(255,255,255,.15); z-index: 30; white-space: nowrap; }

        /* Sembunyikan scrollbar global saat di lab (tetap bisa scroll) */
        body.lab-hide-scrollbars { -ms-overflow-style: none; scrollbar-width: none; }
        body.lab-hide-scrollbars::-webkit-scrollbar { display: none; }

        /* Sembunyikan scrollbar di baris inventory, tetap bisa geser */
        .hotbar .scroll-row { overflow-x: auto; padding-bottom: 2px; -ms-overflow-style: none; scrollbar-width: none; }
        .hotbar .scroll-row::-webkit-scrollbar { display: none; }
      `}</style>

      {/* Header */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 12, alignItems: 'center', justifyContent: 'center' }}>
        <h2 style={{ margin: 0, fontSize: 18, color: '#0f172a', letterSpacing: 0.2 }}>Peracikan Obat - Pasien {patientIdx + 1}</h2>
      </div>

      {/* Resep */}
      <div style={{ ...card, marginBottom: 16 }}>
        <h3 style={{ marginTop: 0, marginBottom: 6 }}>Resep Pasien</h3>
        <p style={{ marginTop: 0, color: '#4b5563' }}>Tujuan: <b>{recipe.goal}</b></p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {recipe.needs.map((id) => {
            const item = BASE_INGREDIENTS.find((x) => x.id === id);
            return (
              <span key={id} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 10px', borderRadius: 999, border: '1px solid #e5e7eb', background: '#f8fafc', fontSize: 13 }}>
                <span style={{ height: 10, width: 10, borderRadius: 999, background: item?.color || '#ddd', border: '1px solid rgba(0,0,0,.15)' }} />
                {item?.label || id}
              </span>
            );
          })}
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <button
            onClick={tryShake}
            disabled={!canCraft}
            style={{ padding: '10px 18px', borderRadius: 10, border: '1px solid #6a1b9a', background: canCraft ? (valid ? '#f3e5f5' : '#fee2e2') : '#eee', color: canCraft ? (valid ? '#6a1b9a' : '#b91c1c') : '#999', fontWeight: 800, cursor: canCraft ? 'pointer' : 'not-allowed' }}
            title={canCraft ? (valid ? 'Racikan cocok! Shake untuk memastikan.' : 'Shake untuk mencoba campuran (bisa busuk jika salah).') : 'Masukkan minimal 4 bahan dulu.'}
          >
            🧪 Shake Ramuan
          </button>

          <button
            onClick={pourToContainer}
            disabled={!canPour}
            style={{ padding: '10px 18px', borderRadius: 10, border: '1px solid #0f766e', background: canPour ? '#d1fae5' : '#eee', color: canPour ? '#065f46' : '#999', fontWeight: 800, cursor: canPour ? 'pointer' : 'not-allowed' }}
            title={pourTitle}
          >
            🫗 Tuang ke {recipe.targetName}
          </button>
          {hasPoured && (
            <button
              onClick={() => onFinish && onFinish()}
              style={{ padding: '10px 18px', borderRadius: 10, border: '1px solid #2563eb', background: '#dbeafe', color: '#1d4ed8', fontWeight: 800 }}
              title="Lanjut ke pasien berikutnya"
            >
              Next
            </button>
          )}
        </div>

        <div role="status" aria-live="polite" style={{ marginTop: 10, fontWeight: 600, color: isRotten ? '#b91c1c' : valid ? '#2e7d32' : '#8d6e63' }}>
          {message || (canCraft ? (valid ? recipe.result : 'Kombinasi belum tepat.') : 'Masukkan minimal 4 bahan untuk mencoba meracik.')}
        </div>
      </div>

      {/* ======= Beaker & Wadah ======= */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(480px, 1.4fr) minmax(320px, 1fr)', gap: 16, alignItems: 'stretch' }}>
        {/* Beaker */}
        <div style={card}>
          <h3 style={{ marginTop: 0 }}>🧪 Beaker (Drop Zone)</h3>
          <div
            ref={beakerRef}
            onDrop={onDrop}
            onDragOver={onDragOver}
            className={(isShaking ? 'shake ' : '') + (isRotten ? 'rot-border ' : '') + (isPouring ? 'tilt' : '')}
            style={{ position: 'relative', height: 320, borderRadius: 16, background: 'linear-gradient(135deg, #f8fafc 0%, #eef2ff 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px dashed #c7d2fe' }}
          >
            <BeakerSVG color={beakerColor} filled={beakerItems.length > 0} rotten={isRotten} />

            {!isRotten && beakerItems.length > 0 &&
              Array.from({ length: 10 }).map((_, i) => {
                const size = 4 + ((i * 7) % 8);
                const left = 35 + ((i * 9) % 30);
                const anim = `${0.9 + i * 0.08}s`;
                return (
                  <div key={i} className="bubble" style={{ width: size, height: size, left: `${left}%`, opacity: 0.85, animation: `rise ${anim} linear ${i * 0.1}s infinite` }} />
                );
              })}

            {isRotten &&
              Array.from({ length: 8 }).map((_, i) => (
                <div key={'smk' + i} className="smoke" style={{ left: `${45 + (i % 5) * 6}%`, animationDelay: `${i * 0.12}s` }} />
              ))}

            {beakerItems.length === 0 && (
              <div style={{ position: 'absolute', bottom: 12, left: '50%', transform: 'translateX(-50%)', fontSize: 12, background: 'rgba(255,255,255,.8)', padding: '6px 10px', borderRadius: 999, border: '1px solid #e5e7eb' }}>
                Drop bahan ke sini 👇
              </div>
            )}
          </div>

          {/* Chips beaker */}
          <div style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap', minHeight: 28 }}>
            {beakerItems.map((id) => {
              const it = inventoryItems.find((x) => x.id === id);
              return (
                <button key={id} onClick={() => removeFromBeaker(id)} title="Hapus dari beaker" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 10px', borderRadius: 999, border: '1px solid #e5e7eb', background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,.05)', cursor: 'pointer' }}>
                  <span style={{ height: 10, width: 10, borderRadius: 999, background: it?.color, border: '1px solid rgba(0,0,0,.1)' }} />
                  <span style={{ fontSize: 12 }}>{it?.label}</span>
                  <span aria-hidden>✕</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Wadah target */}
        <div style={card}>
          <h3 style={{ marginTop: 0 }}>🧴 Wadah {recipe.targetName}</h3>
          <div style={{ position: 'relative', height: 320, borderRadius: 16, background: 'linear-gradient(135deg, #fdf2f8 0%, #eff6ff 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px dashed #e5e7eb', overflow: 'hidden' }}>
            {isPouring && (
              <div style={{ position: 'absolute', top: 40, left: '50%', transform: 'translateX(-50%)', width: 10, height: 140, borderRadius: 8, background: beakerColor, boxShadow: '0 0 16px rgba(0,0,0,.08)' }} />
            )}
            <TargetContainer idx={patientIdx} color={beakerColor} fill={fillLevel} />
          </div>
          <div style={{ marginTop: 10, fontSize: 12, color: '#64748b' }}>
            {canPour ? 'Siap menuang. Klik Tuang ke Wadah.' : 'Racikan harus valid (≥4 bahan & sesuai resep) agar bisa dituang.'}
          </div>
        </div>
      </div>

      {/* ======= HOTBAR INVENTORY (BOTTOM) ======= */}
      <div className="hotbar" style={{ marginTop: 8 }}>
        <div className="scroll-row" style={{ display: 'flex', gap: 8, flexWrap: 'nowrap' }}>
          {inventoryItems.map((ing) => (
            <div
              key={ing.id}
              className={'slot ' + (beakerItems.includes(ing.id) ? 'slotFilled' : '')}
              draggable
              onDragStart={(e) => onDragStart(e, ing.id)}
              onMouseEnter={(e) => setHoverTip({ text: ing.label, x: e.clientX, y: e.clientY })}
              onMouseMove={(e) => setHoverTip((t) => (t ? { ...t, x: e.clientX, y: e.clientY } : t))}
              onMouseLeave={() => setHoverTip(null)}
              title={ing.label}
            >
              <div style={{ textAlign: 'center', lineHeight: 1 }}>
                <div style={{ fontSize: 22 }}>{getIcon(ing.label)}</div>
                <div style={{ margin: '4px auto 0', width: 10, height: 10, borderRadius: 999, background: ing.color, border: '1px solid rgba(0,0,0,.2)' }} />
              </div>
            </div>
          ))}

          {/* Reset hanya di hotbar */}
          <button
            onClick={reset}
            className="slot"
            style={{ cursor: 'pointer', borderStyle: 'dashed', fontWeight: 700, color: '#475569', width: 96 }}
            onMouseEnter={(e) => setHoverTip({ text: 'Reset Beaker', x: e.clientX, y: e.clientY })}
            onMouseMove={(e) => setHoverTip((t) => (t ? { ...t, x: e.clientX, y: e.clientY } : t))}
            onMouseLeave={() => setHoverTip(null)}
            title="Reset Beaker"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Tooltip */}
      {hoverTip && (
        <div className="tooltip" style={{ top: hoverTip.y, left: hoverTip.x, position: 'fixed' }} role="tooltip">
          {hoverTip.text}
        </div>
      )}
    </div>
  );
};

/* ---------- Beaker SVG ---------- */
function BeakerSVG({ color, filled, rotten }) {
  return (
    <svg width="360" height="300" viewBox="0 0 360 300">
      <path d="M40 10 h280 l-16 16 v190 c0 40 -32 72 -72 72 H128 c-40 0 -72 -32 -72 -72 V26 Z" fill="rgba(255,255,255,0.35)" stroke={rotten ? '#374151' : '#1f2937'} strokeWidth="3.5" />
      <g>
        <path d="M66 210 c40 -28 188 -28 228 0 v-150 H66 Z" fill={color} opacity={filled ? 0.95 : 0.5} />
      </g>
      <path d="M60 42 q18 40 0 140" stroke="white" strokeWidth="5" opacity="0.35" fill="none" />
    </svg>
  );
}

/* ---------- Target Containers ---------- */
function TargetContainer({ idx, color, fill }) {
  if (idx === 0) return <ToothpasteTube color={color} fill={fill} />;
  if (idx === 1) return <CavityBottle color={color} fill={fill} />;
  return <PainReliefBottle color={color} fill={fill} />;
}

function ToothpasteTube({ color, fill }) {
  const h = 200;
  const filledH = Math.max(0, Math.min(1, fill)) * h;
  return (
    <svg width="220" height="260" viewBox="0 0 220 260">
      <rect x="95" y="20" width="30" height="20" rx="4" fill="#94a3b8" />
      <rect x="88" y="40" width="44" height="14" rx="6" fill="#cbd5e1" />
      <rect x="60" y="54" width="100" height="180" rx="18" fill="#e2e8f0" stroke="#475569" strokeWidth="2" />
      <rect x="62" y={234 - filledH} width="96" height={filledH} rx="16" fill={color} opacity="0.95" />
      <rect x="70" y="110" width="80" height="40" rx="8" fill="#f1f5f9" stroke="#94a3b8" />
      <text x="110" y="135" textAnchor="middle" fontSize="11" fill="#334155" style={{ fontWeight: 700 }}>Pasta Gigi</text>
    </svg>
  );
}

function CavityBottle({ color, fill }) {
  const h = 160;
  const filledH = Math.max(0, Math.min(1, fill)) * h;
  return (
    <svg width="220" height="260" viewBox="0 0 220 260">
      <rect x="98" y="22" width="24" height="20" rx="4" fill="#94a3b8" />
      <rect x="92" y="42" width="36" height="16" rx="6" fill="#cbd5e1" />
      <path d="M60 58 h100 v130 a30 30 0 0 1 -30 30 H90 a30 30 0 0 1 -30 -30 Z" fill="#e2e8f0" stroke="#475569" strokeWidth="2" />
      <rect x="62" y={188 - filledH} width="96" height={filledH} fill={color} opacity="0.95" />
      <rect x="72" y="100" width="76" height="34" rx="8" fill="#f1f5f9" stroke="#94a3b8" />
      <text x="110" y="122" textAnchor="middle" fontSize="10.5" fill="#334155" style={{ fontWeight: 700 }}>Anti-Karang</text>
    </svg>
  );
}

function PainReliefBottle({ color, fill }) {
  const h = 150;
  const filledH = Math.max(0, Math.min(1, fill)) * h;
  return (
    <svg width="220" height="260" viewBox="0 0 220 260">
      <rect x="95" y="18" width="30" height="18" rx="4" fill="#94a3b8" />
      <rect x="88" y="36" width="44" height="16" rx="6" fill="#cbd5e1" />
      <path d="M60 52 h100 v120 a36 36 0 0 1 -36 36 H96 a36 36 0 0 1 -36 -36 Z" fill="#e2e8f0" stroke="#475569" strokeWidth="2" />
      <rect x="62" y={172 - filledH} width="96" height={filledH} fill={color} opacity="0.95" />
      <rect x="72" y="92" width="76" height="34" rx="8" fill="#f1f5f9" stroke="#94a3b8" />
      <text x="110" y="114" textAnchor="middle" fontSize="10.5" fill="#334155" style={{ fontWeight: 700 }}>Pereda Nyeri</text>
    </svg>
  );
}

export default CraftingLab;

