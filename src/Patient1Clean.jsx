import React, { useEffect, useMemo, useRef, useState } from 'react';
import cikoBefore from './assets/ciko_before.png';
import gigiCiko from './assets/gigi_ciko.png';
import kacaMulutImg from './assets/kaca_mulut.png';
import sondeImg from './assets/sonde.png';
import penyedotImg from './assets/penyedot.png';
import sikatElektrikImg from './assets/sikat_gigi_elektrik.png';
import './patient1clean.css';

const tartarAreas = [
  { id: 't-1', x: 19, y: 38, w: 13, h: 11 },
  { id: 't-2', x: 34, y: 37, w: 13, h: 11 },
  { id: 't-3', x: 49, y: 37, w: 13, h: 11 },
  { id: 't-4', x: 64, y: 38, w: 13, h: 11 },
  { id: 't-5', x: 27, y: 63, w: 12, h: 10 },
  { id: 't-6', x: 42, y: 64, w: 12, h: 10 },
  { id: 't-7', x: 57, y: 64, w: 12, h: 10 },
];

const plaqueAreas = [
  { id: 'p-1', x: 24, y: 29, w: 16, h: 12 },
  { id: 'p-2', x: 40, y: 29, w: 16, h: 12 },
  { id: 'p-3', x: 56, y: 29, w: 16, h: 12 },
  { id: 'p-4', x: 30, y: 55, w: 16, h: 12 },
  { id: 'p-5', x: 46, y: 55, w: 16, h: 12 },
];

const moistureAreas = [
  { id: 'm-1', x: 24, y: 73, w: 18, h: 13 },
  { id: 'm-2', x: 49, y: 74, w: 18, h: 13 },
  { id: 'm-3', x: 36, y: 80, w: 20, h: 14 },
];

const buildStateMap = (areas) => {
  const map = {};
  areas.forEach((area) => {
    map[area.id] = true;
  });
  return map;
};

const Patient1Clean = ({ onComplete }) => {
  const stageRef = useRef(null);
  const [phase, setPhase] = useState('intro');
  const [status, setStatus] = useState('Gunakan kaca mulut untuk melihat kondisi gigi Ciko.');
  const [draggingTool, setDraggingTool] = useState(null);
  const [hoveringStage, setHoveringStage] = useState(false);
  const [toolPos, setToolPos] = useState({ x: 0, y: 0 });
  const [completed, setCompleted] = useState({ mirror: false, sonde: false, penyedot: false, brush: false });
  const [tartarState, setTartarState] = useState(() => buildStateMap(tartarAreas));
  const [moistureState, setMoistureState] = useState(() => buildStateMap(moistureAreas));
  const [plaqueState, setPlaqueState] = useState(() => buildStateMap(plaqueAreas));
  const [completionAnnounced, setCompletionAnnounced] = useState(false);

  const tartarRemaining = useMemo(() => Object.values(tartarState).filter(Boolean).length, [tartarState]);
  const moistureRemaining = useMemo(() => Object.values(moistureState).filter(Boolean).length, [moistureState]);
  const plaqueRemaining = useMemo(() => Object.values(plaqueState).filter(Boolean).length, [plaqueState]);

  const toolSequence = useMemo(() => ([
    {
      id: 'mirror',
      label: 'Kaca Mulut',
      asset: kacaMulutImg,
      available: true,
      done: completed.mirror,
      dragHint: 'Seret kaca mulut ke mulut Ciko untuk membuka tampilan gigi.',
      lockMessage: 'Kaca mulut selalu siap digunakan.',
    },
    {
      id: 'sonde',
      label: 'Sonde',
      asset: sondeImg,
      available: completed.mirror,
      done: completed.sonde,
      dragHint: 'Kerik karang gigi berwarna cokelat di sela gigi.',
      lockMessage: 'Gunakan kaca mulut dulu supaya giginya terlihat.',
    },
    {
      id: 'penyedot',
      label: 'Penyedot',
      asset: penyedotImg,
      available: completed.sonde,
      done: completed.penyedot,
      dragHint: 'Seret ke area biru untuk mengeringkan rongga mulut.',
      lockMessage: 'Bersihkan karang gigi dengan sonde terlebih dahulu.',
    },
    {
      id: 'brush',
      label: 'Sikat Elektrik',
      asset: sikatElektrikImg,
      available: completed.penyedot,
      done: completed.brush,
      dragHint: 'Sikat plak kekuningan sampai gigi kembali putih.',
      lockMessage: 'Pastikan mulut sudah kering sebelum menyikat.',
    },
  ]), [completed]);

  const allStepsDone = completed.mirror && completed.sonde && completed.penyedot && completed.brush;

  const stageClassName = useMemo(() => {
    const base = ['patient1-stage__viewport'];
    if (phase === 'intro') base.push('is-intro');
    if (hoveringStage && draggingTool === 'mirror' && !completed.mirror) base.push('is-hover');
    if (draggingTool === 'mirror' && !completed.mirror) base.push('target-mirror');
    return base.join(' ');
  }, [phase, hoveringStage, draggingTool, completed.mirror]);

  useEffect(() => {
    if (!draggingTool) return undefined;

    const handleMove = (event) => {
      setToolPos({ x: event.clientX, y: event.clientY });
      const stage = stageRef.current;
      if (!stage) return;
      const rect = stage.getBoundingClientRect();
      const inside = event.clientX >= rect.left && event.clientX <= rect.right && event.clientY >= rect.top && event.clientY <= rect.bottom;
      setHoveringStage(inside);

      if (!inside) return;
      if (draggingTool === 'mirror') return;
      if (phase !== 'exposed') return;

      const relX = ((event.clientX - rect.left) / rect.width) * 100;
      const relY = ((event.clientY - rect.top) / rect.height) * 100;

      if (draggingTool === 'sonde') {
        tartarAreas.some((area) => {
          if (!tartarState[area.id]) return false;
          if (relX >= area.x && relX <= area.x + area.w && relY >= area.y && relY <= area.y + area.h) {
            let cleaned = false;
            setTartarState((prev) => {
              if (!prev[area.id]) return prev;
              cleaned = true;
              return { ...prev, [area.id]: false };
            });
            if (cleaned) setStatus('Karang gigi terangkat! Lanjutkan sampai bersih.');
            return true;
          }
          return false;
        });
      } else if (draggingTool === 'penyedot') {
        moistureAreas.some((area) => {
          if (!moistureState[area.id]) return false;
          if (relX >= area.x && relX <= area.x + area.w && relY >= area.y && relY <= area.y + area.h) {
            let cleaned = false;
            setMoistureState((prev) => {
              if (!prev[area.id]) return prev;
              cleaned = true;
              return { ...prev, [area.id]: false };
            });
            if (cleaned) setStatus('Mulut makin kering. Pastikan tidak ada sisa air.');
            return true;
          }
          return false;
        });
      } else if (draggingTool === 'brush') {
        plaqueAreas.some((area) => {
          if (!plaqueState[area.id]) return false;
          if (relX >= area.x && relX <= area.x + area.w && relY >= area.y && relY <= area.y + area.h) {
            let cleaned = false;
            setPlaqueState((prev) => {
              if (!prev[area.id]) return prev;
              cleaned = true;
              return { ...prev, [area.id]: false };
            });
            if (cleaned) setStatus('Plak hilang! Teruskan sampai giginya putih.');
            return true;
          }
          return false;
        });
      }
    };

    const handleUp = (event) => {
      const stage = stageRef.current;
      if (draggingTool === 'mirror' && stage) {
        const rect = stage.getBoundingClientRect();
        const inside = event.clientX >= rect.left && event.clientX <= rect.right && event.clientY >= rect.top && event.clientY <= rect.bottom;
        if (inside) {
          if (!completed.mirror) {
            setPhase('exposed');
            setCompleted((prev) => ({ ...prev, mirror: true }));
            setStatus('Karang gigi terlihat. Kerik dengan sonde sampai bersih.');
          }
        } else {
          setStatus('Arahkan kaca mulut tepat ke mulut Ciko.');
        }
      }
      setDraggingTool(null);
      setHoveringStage(false);
    };

    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);

    return () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
    };
  }, [draggingTool, phase, tartarState, moistureState, plaqueState, completed.mirror]);

  useEffect(() => {
    if (!draggingTool) return undefined;
    const previousUserSelect = document.body.style.userSelect;
    document.body.style.userSelect = 'none';
    return () => { document.body.style.userSelect = previousUserSelect; };
  }, [draggingTool]);

  useEffect(() => {
    if (phase !== 'exposed') return;
    if (!completed.sonde && tartarRemaining === 0) {
      setCompleted((prev) => ({ ...prev, sonde: true }));
      setStatus('Bagus! Sekarang keringkan mulut dengan penyedot.');
    }
  }, [phase, tartarRemaining, completed.sonde]);

  useEffect(() => {
    if (phase !== 'exposed') return;
    if (completed.sonde && !completed.penyedot && moistureRemaining === 0) {
      setCompleted((prev) => ({ ...prev, penyedot: true }));
      setStatus('Mulut sudah kering. Saatnya sikat plaknya.');
    }
  }, [phase, completed.sonde, completed.penyedot, moistureRemaining]);

  useEffect(() => {
    if (phase !== 'exposed') return;
    if (completed.penyedot && !completed.brush && plaqueRemaining === 0) {
      setCompleted((prev) => ({ ...prev, brush: true }));
    }
  }, [phase, completed.penyedot, completed.brush, plaqueRemaining]);

  useEffect(() => {
    if (allStepsDone && !completionAnnounced) {
      setCompletionAnnounced(true);
      setStatus('Gigi Ciko kini bersih dan berkilau! Klik Lanjut untuk meracik obat.');
    }
  }, [allStepsDone, completionAnnounced]);

  const handleToolPointerDown = (tool, event) => {
    event.preventDefault();
    if (tool.done) {
      setStatus('Langkah ini sudah beres. Lanjutkan ke alat berikutnya.');
      return;
    }
    if (!tool.available) {
      setStatus(tool.lockMessage);
      return;
    }
    setDraggingTool(tool.id);
    setToolPos({ x: event.clientX, y: event.clientY });
    setStatus(tool.dragHint);
  };

  const activeTool = toolSequence.find((tool) => tool.id === draggingTool);

  const areaStyle = (area) => ({
    left: `${area.x}%`,
    top: `${area.y}%`,
    width: `${area.w}%`,
    height: `${area.h}%`,
  });

  return (
    <div className="patient1-layout">
      <div className="patient1-info">
        <h2>Ciko - Pemeriksaan</h2>
        <p className="patient1-complaint">"Gigi saya kotor dan ada karang gigi!"</p>
        <div className="patient1-steps">
          <strong>Langkah Perawatan:</strong>
          <ol>
            <li>Kaca mulut untuk membuka tampilan gigi.</li>
            <li>Sonde mengikis karang gigi.</li>
            <li>Penyedot mengeringkan rongga mulut.</li>
            <li>Sikat gigi elektrik membersihkan plak.</li>
          </ol>
        </div>
        <div className="patient1-progress">
          <div>
            <span>Karang gigi</span>
            <strong>{tartarRemaining}</strong>
          </div>
          <div>
            <span>Area basah</span>
            <strong>{moistureRemaining}</strong>
          </div>
          <div>
            <span>Plak</span>
            <strong>{plaqueRemaining}</strong>
          </div>
        </div>
      </div>

      <div className="patient1-stage">
        <div
          ref={stageRef}
          className={stageClassName}
          style={{ backgroundImage: `url(${phase === 'intro' ? cikoBefore : gigiCiko})` }}
        >
          {phase === 'intro' && !completed.mirror && (
            <div className="patient1-stage__hint">Seret kaca mulut untuk melihat gigi</div>
          )}
          {phase === 'exposed' && (
            <>
              {tartarAreas.map((area) => (
                tartarState[area.id] ? (
                  <div key={area.id} className="ciko-dirt ciko-dirt--tartar" style={areaStyle(area)} />
                ) : null
              ))}
              {moistureAreas.map((area) => (
                moistureState[area.id] ? (
                  <div key={area.id} className="ciko-dirt ciko-dirt--moist" style={areaStyle(area)} />
                ) : null
              ))}
              {plaqueAreas.map((area) => (
                plaqueState[area.id] ? (
                  <div key={area.id} className="ciko-dirt ciko-dirt--plaque" style={areaStyle(area)} />
                ) : null
              ))}
            </>
          )}
        </div>
        <div className="patient1-statusBar">
          <p>{status}</p>
          <button
            type="button"
            className="patient1-next"
            onClick={() => onComplete?.()}
            disabled={!allStepsDone}
          >
            Lanjut Racik Obat
          </button>
        </div>
      </div>

      {draggingTool && activeTool && (
        <div className="patient1-dragGhost" style={{ left: toolPos.x, top: toolPos.y }}>
          <img src={activeTool.asset} alt="" />
        </div>
      )}

      <div className="patient1-toolDock">
        <div className="patient1-toolDock__inner">
          {toolSequence.map((tool) => (
            <button
              key={tool.id}
              type="button"
              className={[
                'patient1-toolBtn',
                tool.done ? 'is-done' : '',
                tool.id === draggingTool ? 'is-active' : '',
                tool.available ? '' : 'is-locked',
              ].filter(Boolean).join(' ')}
              onPointerDown={(event) => handleToolPointerDown(tool, event)}
              title={tool.available ? tool.dragHint : tool.lockMessage}
            >
              <img src={tool.asset} alt={tool.label} draggable="false" />
              <span>{tool.label}</span>
              {tool.done && <span className="patient1-toolBtn__done">Selesai</span>}
            </button>
          ))}
        </div>
      </div>
      <div className="patient1-dockSpacer" />
    </div>
  );
};

export default Patient1Clean;
