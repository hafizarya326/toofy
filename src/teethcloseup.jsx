import React, { useMemo, useRef, useState, useEffect } from 'react';
import Tooth from './tooth';
import Patient1Clean from './Patient1Clean';
import Patient2Cavity from './Patient2Cavity';
import Patient3Extract from './Patient3Extract';
import borImage from './assets/bor.png';

const teethByPatient = [
  Array(20).fill('normal').map((_, i) => ([1, 4, 7, 12, 16, 11, 18].includes(i) ? 'dirty' : 'normal')),
  Array(20).fill('normal').map((_, i) => ([2, 5, 8, 13, 17, 10, 15, 19].includes(i) ? 'cavity' : 'normal')),
  Array(20).fill('normal').map((_, i) => ([3, 5, 6, 13, 15, 12, 18].includes(i) ? 'extract' : 'normal')),
];

const complaints = [
  'Gigi saya kotor dan ada karang gigi!',
  'Gigi saya berlubang dan agak kuning!',
  'Gigi saya perlu dicabut dan ditambal kapas!',
];

const TOOTH_W = 48;
const TOOTH_H = 60;

const TeethCloseupGrid = ({ patientIdx = 0, onBack, onComplete }) => {
  const boxRef = useRef(null);

  // Modes & positions
  const [isBrushing, setIsBrushing] = useState(false);
  const [isDraggingDrill, setIsDraggingDrill] = useState(false);
  const [isDraggingExtract, setIsDraggingExtract] = useState(false);
  const [brushPos, setBrushPos] = useState({ x: 0, y: 0 });
  const [drillPos, setDrillPos] = useState({ x: 0, y: 0 });
  const [extractPos, setExtractPos] = useState({ x: 0, y: 0 });

  // State gigi
  const [teethState, setTeethState] = useState(teethByPatient[patientIdx]);

  // Feedback singkat
  const [feedback, setFeedback] = useState(null); // {msg, ts}
  const pingFeedback = (msg) => {
    const ts = Date.now();
    setFeedback({ msg, ts });
    setTimeout(() => {
      setFeedback((prev) => (prev && prev.ts === ts ? null : prev));
    }, 900);
  };

  // Reset saat ganti pasien
  useEffect(() => {
    setTeethState(teethByPatient[patientIdx]);
    setIsBrushing(false);
    setIsDraggingDrill(false);
    setIsDraggingExtract(false);
    setFeedback(null);
  }, [patientIdx]);

  // Precompute posisi tengah tiap gigi
  const toothCenters = useMemo(() => {
    const arr = [];
    for (let i = 0; i < 20; i++) {
      const row = i < 10 ? 0 : 1;
      const col = i % 10;
      const x = col * TOOTH_W + TOOTH_W / 2;
      const y = row === 0 ? TOOTH_H / 2 : TOOTH_H * 1.5 + 8;
      arr.push({ x, y });
    }
    return arr;
  }, []);

  // Kondisi selesai per pasien
  const isCleanDone    = teethState.every((t) => t !== 'dirty');   // P1
  const isFillDone     = teethState.every((t) => t !== 'cavity');  // P2
  const isExtractDone  = teethState.every((t) => t !== 'extract'); // P3
  const treatmentDone =
    (patientIdx === 0 && isCleanDone) ||
    (patientIdx === 1 && isFillDone) ||
    (patientIdx === 2 && isExtractDone);

  const localPos = (e) => {
    const box = boxRef.current.getBoundingClientRect();
    return { x: e.clientX - box.left, y: e.clientY - box.top };
  };

  // Utility: terapkan efek ke tipe target di area pointer
  const tryApplyAt = (pos, targetType, nextType, stopAfterFirst = false) => {
    let changed = false;
    setTeethState((prev) => {
      const next = [...prev];
      for (let i = 0; i < next.length; i++) {
        if (next[i] !== targetType) continue;
        const c = toothCenters[i];
        const dx = pos.x - c.x, dy = pos.y - c.y;
        if (dx * dx + dy * dy < 32 * 32) {
          next[i] = nextType;
          changed = true;
          if (stopAfterFirst) break;
        }
      }
      return changed ? next : prev;
    });
    return changed;
  };

  // Mouse handlers (drag tools)
  const onAreaMouseMove = (e) => {
    const p = localPos(e);
    if (isBrushing) {
      setBrushPos(p);
      const ok = tryApplyAt(p, 'dirty', 'normal');
      if (!ok) pingFeedback('ðŸª¥ Tidak ada yang berubahâ€¦');
    }
    if (isDraggingDrill) {
      setDrillPos(p);
      const ok = tryApplyAt(p, 'cavity', 'filled', true);
      if (ok) setIsDraggingDrill(false);
      else pingFeedback('ðŸ› ï¸ Bor tidak menemukan bolonganâ€¦');
    }
    if (isDraggingExtract) {
      setExtractPos(p);
      const ok = tryApplyAt(p, 'extract', 'extracted', true);
      if (ok) setIsDraggingExtract(false);
      else pingFeedback('ðŸ§· Tidak ada gigi untuk dicabutâ€¦');
    }
  };

  const onAreaMouseUp = () => {
    setIsBrushing(false);
    setIsDraggingDrill(false);
    setIsDraggingExtract(false);
  };

  // Klik gigi (fallback)
  const clickTooth = (i) => {
    if (!isDraggingExtract) {
      pingFeedback('Aktifkan & seret alat ðŸ§· di atas gigi yang perlu dicabut');
      return;
    }
  };

  // Ringkasan sisa tugas
  const remainDirty   = teethState.filter((t) => t === 'dirty').length;
  const remainCavity  = teethState.filter((t) => t === 'cavity').length;
  const remainExtract = teethState.filter((t) => t === 'extract').length;

  // Tools yang DIBUTUHKAN sesuai kondisi pasien saat ini
  const neededTools = useMemo(() => {
    const arr = [];
    if (remainDirty > 0) arr.push('brush');
    if (remainCavity > 0) arr.push('drill');
    if (remainExtract > 0) arr.push('extract');
    return arr;
  }, [remainDirty, remainCavity, remainExtract]);

  const showDock = neededTools.length > 0 && !treatmentDone;

  // Helper: set mode unik (hanya satu aktif sekaligus)
  const setMode = (mode) => {
    setIsBrushing(mode === 'brush');
    setIsDraggingDrill(mode === 'drill');
    setIsDraggingExtract(mode === 'extract');
  };

  // Tombol alat
  const ToolButton = ({ tool }) => {
    if (tool === 'brush') {
      return (
        <button
          style={{
            padding: '10px 16px',
            borderRadius: 12,
            border: '1px solid #1976d2',
            background: isBrushing ? '#e0f2ff' : '#e3f2fd',
            color: '#0d47a1',
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 2px 6px rgba(0,0,0,.12)',
          }}
          onMouseDown={() => setMode('brush')}
          onMouseUp={() => setIsBrushing(false)}
          title="Tahan & gerakkan di area gigi untuk membersihkan"
        >
          ðŸª¥ Sikat Â· {remainDirty}
        </button>
      );
    }
    if (tool === 'drill') {
      return (
        <button
          style={{
            padding: '10px 16px',
            borderRadius: 12,
            border: '1px solid #d32f2f',
            background: isDraggingDrill ? '#ffcdd2' : '#ffebee',
            color: '#b71c1c',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            boxShadow: '0 2px 6px rgba(0,0,0,.12)',
          }}
          onMouseDown={() => setMode('drill')}
          onMouseUp={() => setIsDraggingDrill(false)}
          title="Tahan & gerakkan untuk menambal"
        >
          <img src={borImage} alt="Bor" style={{ width: 24, height: 24 }} />
          Bor Â· {remainCavity}
        </button>
      );
    }
    // extract
    return (
      <button
        style={{
          padding: '10px 16px',
          borderRadius: 12,
          border: '1px solid #388e3c',
          background: isDraggingExtract ? '#c8e6c9' : '#e8f5e9',
          color: '#1b5e20',
          fontWeight: 700,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          boxShadow: '0 2px 6px rgba(0,0,0,.12)',
        }}
        onMouseDown={() => setMode('extract')}
        onMouseUp={() => setIsDraggingExtract(false)}
        title="Tahan & seret di gigi bertanda untuk mencabut"
      >
        ðŸ§· Cabut Â· {remainExtract}
      </button>
    );
  };

  return (
    <div style={{ padding: 32, textAlign: 'center' }}>
      <h2>Perawatan Gigi Pasien {patientIdx + 1}</h2>
      <div style={{ marginBottom: 16, color: '#1976d2', fontWeight: 'bold' }}>{complaints[patientIdx]}</div>

      <div
        ref={boxRef}
        onMouseMove={onAreaMouseMove}
        onMouseUp={onAreaMouseUp}
        onMouseLeave={onAreaMouseUp}
        style={{
          position: 'relative',
          margin: '32px auto',
          width: 520,
          height: 180,
          background: '#fffde7',
          borderRadius: 24,
          boxShadow: feedback ? '0 0 0 3px rgba(211,47,47,.3), 0 2px 8px #aaa' : '0 2px 8px #aaa',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 32,
          userSelect: 'none',
          transition: 'box-shadow .15s ease',
        }}
        title="Tahan ðŸª¥/ðŸ› ï¸/ðŸ§· lalu seret di area gigi"
      >
        {/* Baris atas */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
          {teethState.slice(0, 10).map((type, i) => (
            <div key={i} style={{ cursor: 'pointer' }} onClick={() => clickTooth(i)} title="Untuk cabut, tahan & seret ðŸ§·">
              <Tooth type={type} rotate={0} />
            </div>
          ))}
        </div>
        {/* Baris bawah */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          {teethState.slice(10, 20).map((type, j) => {
            const i = j + 10;
            return (
              <div key={i} style={{ cursor: 'pointer' }} onClick={() => clickTooth(i)} title="Untuk cabut, tahan & seret ðŸ§·">
                <Tooth type={type} rotate={0} />
              </div>
            );
          })}
        </div>

        {/* ðŸª¥ sikat draggable */}
        {isBrushing && (
          <div style={{ position: 'absolute', left: brushPos.x - 20, top: brushPos.y - 20, pointerEvents: 'none', fontSize: 32 }}>
            ðŸª¥
          </div>
        )}

        {/* ðŸ› ï¸ bor draggable */}
        {isDraggingDrill && (
          <div style={{ position: 'absolute', left: drillPos.x - 20, top: drillPos.y - 20, pointerEvents: 'none' }}>
            <img src={borImage} alt="Bor" style={{ width: 32, height: 32 }} />
          </div>
        )}

        {/* ðŸ§· cabut draggable */}
        {isDraggingExtract && (
          <div style={{ position: 'absolute', left: extractPos.x - 16, top: extractPos.y - 16, pointerEvents: 'none', fontSize: 28 }}>
            ðŸ§·
          </div>
        )}
      </div>

      {/* Feedback & progress hint */}
      <div style={{ marginTop: 12, minHeight: 20, color: feedback ? '#c62828' : '#666', fontSize: 14 }}>
        {feedback ? feedback.msg : 'Tahan tombol alat dan seret di area gigi.'}
      </div>

      {/* Tombol lanjut */}
      <div style={{ marginTop: 12 }}>
        <button
          onClick={() => onComplete && onComplete()}
          disabled={!treatmentDone}
          style={{
            padding: '10px 18px',
            borderRadius: 10,
            border: '1px solid #6a1b9a',
            background: treatmentDone ? '#f3e5f5' : '#eee',
            color: treatmentDone ? '#6a1b9a' : '#999',
            fontWeight: 800,
            cursor: treatmentDone ? 'pointer' : 'not-allowed',
          }}
          title={treatmentDone ? 'Lanjut ke racik obat' : 'Selesaikan dulu perawatannya'}
        >
          Lanjut Racik Obat
        </button>
      </div>

      {/* Hint sisa masalah */}
      <div style={{ marginTop: 12, fontSize: 12, color: '#555' }}>
        Sisa: ðŸª¥ {remainDirty} kotor Â· ðŸ› ï¸ {remainCavity} bolong Â· ðŸ§· {remainExtract} cabut
      </div>

      {/* ===== Bottom Dock: alat relevan saja, slide in/out dari bawah ===== */}
      <div
        style={{
          position: 'fixed',
          left: 0,
          right: 0,
          bottom: 0,
          padding: '12px 16px 20px',
          display: 'flex',
          justifyContent: 'center',
          pointerEvents: 'none', // biar hanya tombol yg bisa di-klik
          zIndex: 999,
        }}
      >
        <div
          style={{
            pointerEvents: 'auto',
            background: '#ffffff',
            border: '1px solid #e0e0e0',
            boxShadow: '0 -8px 24px rgba(0,0,0,.12)',
            borderRadius: '16px 16px 0 0',
            padding: 12,
            minWidth: 320,
            maxWidth: 560,
            display: 'flex',
            gap: 12,
            justifyContent: 'center',
            transform: showDock ? 'translateY(0)' : 'translateY(140%)',
            transition: 'transform .28s cubic-bezier(0.22, 1, 0.36, 1)',
          }}
        >
          {neededTools.map((t) => (
            <ToolButton key={t} tool={t} />
          ))}
        </div>
      </div>
      {/* Spacer agar konten atas tidak ketutup dock di layar kecil */}
      <div style={{ height: showDock ? 90 : 0 }} />
    </div>
  );
};

const TeethCloseup = ({ patientIdx = 0, onBack, onComplete }) => {
  if (patientIdx === 0) {
    return <Patient1Clean onComplete={onComplete} />;
  }
  if (patientIdx === 1) {
    return <Patient2Cavity onComplete={onComplete} />;
  }
  if (patientIdx === 2) {
    return <Patient3Extract onComplete={onComplete} />;
  }
  return <TeethCloseupGrid patientIdx={patientIdx} onBack={onBack} onComplete={onComplete} />;
};

export default TeethCloseup;


