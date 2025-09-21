import React, { useEffect, useMemo, useRef, useState } from 'react';
import meimeiBefore from './assets/meimei_before.png';
import gigiMemei from './assets/gigi_memei.png';
import mirrorImg from './assets/kaca_mulut.png';
import sondeImg from './assets/sonde.png';
import borImg from './assets/bor.png';
import sprayImg from './assets/semprotan.png';
import curingImg from './assets/sinar_biru.png';
import lactoImg from './assets/Lactobacillus__2.png';
import './patient2cavity.css';

const lesionAreas = [
  { id: 'l-1', x: 32, y: 36, w: 12, h: 14 },
  { id: 'l-2', x: 48, y: 37, w: 12, h: 14 },
  { id: 'l-3', x: 40, y: 63, w: 14, h: 13 },
];

const bacteriaAreas = [
  { id: 'b-1', target: 'l-1', x: 28, y: 46, w: 13, h: 12, rotate: -12 },
  { id: 'b-2', target: 'l-2', x: 56, y: 45, w: 13, h: 12, rotate: 10 },
  { id: 'b-3', target: 'l-3', x: 44, y: 74, w: 14, h: 13, rotate: 4 },
];

const buildStateMap = (areas, initialValue = true) => {
  const map = {};
  areas.forEach((area) => {
    map[area.id] = initialValue;
  });
  return map;
};

const countTrue = (stateMap) => Object.values(stateMap).filter(Boolean).length;

const isInside = (relX, relY, area) =>
  relX >= area.x && relX <= area.x + area.w && relY >= area.y && relY <= area.y + area.h;

const Patient2Cavity = ({ onComplete }) => {
  const stageRef = useRef(null);
  const [phase, setPhase] = useState('intro');
  const [status, setStatus] = useState('Gunakan kaca mulut untuk memeriksa gigi Memei.');
  const [draggingTool, setDraggingTool] = useState(null);
  const [hoveringStage, setHoveringStage] = useState(false);
  const [toolPos, setToolPos] = useState({ x: 0, y: 0 });
  const [completed, setCompleted] = useState({
    mirrorOpen: false,
    sonde: false,
    drill: false,
    water: false,
    resin: false,
    cure: false,
  });

  const [decayState, setDecayState] = useState(() => buildStateMap(lesionAreas, true));
  const [roughState, setRoughState] = useState(() => buildStateMap(lesionAreas, false));
  const [debrisState, setDebrisState] = useState(() => buildStateMap(lesionAreas, false));
  const [resinState, setResinState] = useState(() => buildStateMap(lesionAreas, false));
  const [softResinState, setSoftResinState] = useState(() => buildStateMap(lesionAreas, false));
  const [bacteriaState, setBacteriaState] = useState(() => buildStateMap(bacteriaAreas, true));

  const decayRemaining = useMemo(() => countTrue(decayState), [decayState]);
  const roughRemaining = useMemo(() => countTrue(roughState), [roughState]);
  const debrisRemaining = useMemo(() => countTrue(debrisState), [debrisState]);
  const resinRemaining = useMemo(() => countTrue(resinState), [resinState]);
  const softRemaining = useMemo(() => countTrue(softResinState), [softResinState]);
  const bacteriaRemaining = useMemo(() => countTrue(bacteriaState), [bacteriaState]);

  const toolSequence = useMemo(
    () => [
      {
        id: 'mirror-open',
        label: 'Kaca Mulut',
        asset: mirrorImg,
        available: true,
        done: completed.mirrorOpen,
        dragHint: 'Seret kaca mulut ke mulut Memei untuk melihat karies.',
        lockMessage: 'Kaca mulut selalu bisa digunakan.',
      },
      {
        id: 'sonde',
        label: 'Sonde',
        asset: sondeImg,
        available: completed.mirrorOpen,
        done: completed.sonde,
        dragHint: 'Kerik jaringan gigi yang rusak berwarna cokelat.',
        lockMessage: 'Buka tampilan gigi dengan kaca mulut dulu.',
      },
      {
        id: 'bor',
        label: 'Bor Gigi',
        asset: borImg,
        available: completed.sonde,
        done: completed.drill,
        dragHint: 'Haluskan dinding lubang gigi yang sudah dibersihkan.',
        lockMessage: 'Bersihkan karies dengan sonde terlebih dahulu.',
      },
      {
        id: 'water',
        label: 'Selang Air',
        asset: sprayImg,
        available: completed.drill,
        done: completed.water,
        dragHint: 'Semprot area lubang untuk mengusir bakteri dan debu bor.',
        lockMessage: 'Rapikan bentuk lubang dengan bor dulu.',
      },
      {
        id: 'resin',
        label: 'Resin Komposit',
        asset: null,
        iconClass: 'resin',
        available: completed.water,
        done: completed.resin,
        dragHint: 'Isi lubang bersih dengan resin komposit.',
        lockMessage: 'Pastikan lubang sudah bersih dan kering.',
      },
      {
        id: 'cure',
        label: 'Curing Light',
        asset: curingImg,
        available: completed.resin,
        done: completed.cure,
        dragHint: 'Arahkan sinar biru untuk mengeraskan resin.',
        lockMessage: 'Isi lubang dengan resin terlebih dahulu.',
      },
    ],
    [completed]
  );

  const stageClassName = useMemo(() => {
    const base = ['patient2-stage__viewport'];
    if (phase === 'intro') base.push('is-intro');
    if (draggingTool === 'mirror-open' && !completed.mirrorOpen) base.push('target-mirror');
    if (hoveringStage && draggingTool === 'mirror-open') base.push('is-hover');
    return base.join(' ');
  }, [phase, draggingTool, hoveringStage, completed]);

  useEffect(() => {
    if (!draggingTool) return undefined;

    const handleMove = (event) => {
      setToolPos({ x: event.clientX, y: event.clientY });
      const stage = stageRef.current;
      if (!stage) return;
      const rect = stage.getBoundingClientRect();
      const inside =
        event.clientX >= rect.left &&
        event.clientX <= rect.right &&
        event.clientY >= rect.top &&
        event.clientY <= rect.bottom;
      setHoveringStage(inside);

      if (!inside) return;
      if (draggingTool === 'mirror-open') return;
      if (phase !== 'exposed') return;

      const relX = ((event.clientX - rect.left) / rect.width) * 100;
      const relY = ((event.clientY - rect.top) / rect.height) * 100;

      if (draggingTool === 'sonde') {
        let cleanedId = null;
        lesionAreas.some((area) => {
          if (!decayState[area.id]) return false;
          if (isInside(relX, relY, area)) {
            cleanedId = area.id;
            setDecayState((prev) => ({ ...prev, [area.id]: false }));
            setRoughState((prev) => ({ ...prev, [area.id]: true }));
            return true;
          }
          return false;
        });
        if (cleanedId) setStatus('Jaringan busuk terangkat. Lanjutkan sonde di area lain.');
      } else if (draggingTool === 'bor') {
        let preppedId = null;
        lesionAreas.some((area) => {
          if (!roughState[area.id]) return false;
          if (isInside(relX, relY, area)) {
            preppedId = area.id;
            setRoughState((prev) => ({ ...prev, [area.id]: false }));
            setDebrisState((prev) => ({ ...prev, [area.id]: true }));
            return true;
          }
          return false;
        });
        if (preppedId) setStatus('Lubang terbentuk rapi. Bersihkan debu bor dengan selang air.');
      } else if (draggingTool === 'water') {
        let message = null;
        bacteriaAreas.some((bact) => {
          if (!bacteriaState[bact.id]) return false;
          if (isInside(relX, relY, bact)) {
            message = 'Koloni Lactobacillus tersapu bersih!';
            setBacteriaState((prev) => ({ ...prev, [bact.id]: false }));
            return true;
          }
          return false;
        });

        let rinsedId = null;
        lesionAreas.some((area) => {
          if (!debrisState[area.id]) return false;
          if (isInside(relX, relY, area)) {
            rinsedId = area.id;
            setDebrisState((prev) => ({ ...prev, [area.id]: false }));
            setResinState((prev) => ({ ...prev, [area.id]: true }));
            return true;
          }
          return false;
        });

        if (rinsedId) {
          message = 'Area sudah bersih. Siapkan resin komposit.';
          setBacteriaState((prev) => {
            const next = { ...prev };
            bacteriaAreas.forEach((bact) => {
              if (bact.target === rinsedId) next[bact.id] = false;
            });
            return next;
          });
        }

        if (message) setStatus(message);
      } else if (draggingTool === 'resin') {
        let filledId = null;
        lesionAreas.some((area) => {
          if (!resinState[area.id]) return false;
          if (isInside(relX, relY, area)) {
            filledId = area.id;
            setResinState((prev) => ({ ...prev, [area.id]: false }));
            setSoftResinState((prev) => ({ ...prev, [area.id]: true }));
            return true;
          }
          return false;
        });
        if (filledId) setStatus('Resin masuk rapi. Keras-kan dengan sinar biru.');
      } else if (draggingTool === 'cure') {
        let curedId = null;
        lesionAreas.some((area) => {
          if (!softResinState[area.id]) return false;
          if (isInside(relX, relY, area)) {
            curedId = area.id;
            setSoftResinState((prev) => ({ ...prev, [area.id]: false }));
            return true;
          }
          return false;
        });
        if (curedId) setStatus('Resin telah mengeras! Klik Lanjut bila semua area selesai.');
      }
    };

    const handleUp = (event) => {
      const active = draggingTool;
      setDraggingTool(null);
      setHoveringStage(false);

      const stage = stageRef.current;
      if (!stage || active !== 'mirror-open') return;

      const rect = stage.getBoundingClientRect();
      const inside =
        event.clientX >= rect.left &&
        event.clientX <= rect.right &&
        event.clientY >= rect.top &&
        event.clientY <= rect.bottom;
      if (!inside) {
        setStatus('Arahkan kaca mulut tepat pada area gigi.');
        return;
      }

      if (!completed.mirrorOpen) {
        setPhase('exposed');
        setCompleted((prev) => ({ ...prev, mirrorOpen: true }));
        setStatus('Karies dan bakteri tampak jelas. Bersihkan jaringan rusak dengan sonde.');
      }
    };

    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
    return () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
    };
  }, [
    draggingTool,
    phase,
    decayState,
    roughState,
    debrisState,
    resinState,
    softResinState,
    bacteriaState,
    completed,
  ]);

  useEffect(() => {
    if (!draggingTool) return undefined;
    const previous = document.body.style.userSelect;
    document.body.style.userSelect = 'none';
    return () => {
      document.body.style.userSelect = previous;
    };
  }, [draggingTool]);

  useEffect(() => {
    if (!completed.mirrorOpen) return;
    if (!completed.sonde && decayRemaining === 0) {
      setCompleted((prev) => ({ ...prev, sonde: true }));
      setStatus('Struktur gigi bersih. Bentuk lubang dengan bor gigi.');
    }
  }, [completed.mirrorOpen, completed.sonde, decayRemaining]);

  useEffect(() => {
    if (!completed.sonde) return;
    if (!completed.drill && roughRemaining === 0) {
      setCompleted((prev) => ({ ...prev, drill: true }));
      setStatus('Lubang rapi. Hilangkan bakteri dan sisa bor dengan selang air.');
    }
  }, [completed.sonde, completed.drill, roughRemaining]);

  useEffect(() => {
    if (!completed.drill) return;
    if (!completed.water && debrisRemaining === 0 && bacteriaRemaining === 0) {
      setCompleted((prev) => ({ ...prev, water: true }));
      setStatus('Area sudah bersih dan kering. Isi dengan resin komposit.');
    }
  }, [completed.drill, completed.water, debrisRemaining, bacteriaRemaining]);

  useEffect(() => {
    if (!completed.water) return;
    if (!completed.resin && resinRemaining === 0) {
      setCompleted((prev) => ({ ...prev, resin: true }));
      setStatus('Tambalan terpasang. Keras-kan resin dengan sinar biru.');
    }
  }, [completed.water, completed.resin, resinRemaining]);

  useEffect(() => {
    if (!completed.resin) return;
    if (!completed.cure && softRemaining === 0) {
      setCompleted((prev) => ({ ...prev, cure: true }));
      setStatus('Tambalan mengeras. Klik Lanjut untuk meracik obat.');
    }
  }, [completed.resin, completed.cure, softRemaining]);

  const handleToolPointerDown = (tool, event) => {
    event.preventDefault();
    if (tool.done) {
      setStatus('Langkah ini sudah selesai. Gunakan alat berikutnya.');
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

  const activeTool = useMemo(
    () => toolSequence.find((tool) => tool.id === draggingTool),
    [draggingTool, toolSequence]
  );

  const areaStyle = (area) => ({
    left: `${area.x}%`,
    top: `${area.y}%`,
    width: `${area.w}%`,
    height: `${area.h}%`,
  });

  const allDone =
    completed.mirrorOpen &&
    completed.sonde &&
    completed.drill &&
    completed.water &&
    completed.resin &&
    completed.cure;

  return (
    <div className="patient2-layout">
      <div className="patient2-info">
        <h2>Memei - Penambalan Karies</h2>
        <p className="patient2-complaint">"Gigi aku berlubang dan ada bakteri nakal!"</p>
        <div className="patient2-steps">
          <strong>Langkah Perawatan:</strong>
          <ol>
            <li>Kaca mulut membuka pandangan.</li>
            <li>Sonde mengikis jaringan busuk.</li>
            <li>Bor gigi membentuk lubang sehat.</li>
            <li>Selang air mengusir bakteri.</li>
            <li>Resin komposit menambal.</li>
            <li>Curing light mengeraskan tambalan.</li>
          </ol>
        </div>
        <div className="patient2-progress">
          <div>
            <span>Karies tersisa</span>
            <strong>{decayRemaining}</strong>
          </div>
          <div>
            <span>Koloni bakteri</span>
            <strong>{bacteriaRemaining}</strong>
          </div>
          <div>
            <span>Sisa bor</span>
            <strong>{debrisRemaining}</strong>
          </div>
          <div>
            <span>Tambalan lunak</span>
            <strong>{softRemaining}</strong>
          </div>
        </div>
      </div>

      <div className="patient2-stage">
        <div
          ref={stageRef}
          className={stageClassName}
          style={{ backgroundImage: `url(${phase === 'intro' ? meimeiBefore : gigiMemei})` }}
        >
          {phase === 'intro' && !completed.mirrorOpen && (
            <div className="patient2-stage__hint">Seret kaca mulut untuk melihat lubang gigi</div>
          )}

          {phase === 'exposed' && (
            <>
              {lesionAreas.map((area) => {
                if (decayState[area.id]) {
                  return (
                    <div
                      key={`decay-${area.id}`}
                      className="memei-overlay memei-overlay--decay"
                      style={areaStyle(area)}
                    />
                  );
                }
                if (roughState[area.id]) {
                  return (
                    <div
                      key={`rough-${area.id}`}
                      className="memei-overlay memei-overlay--rough"
                      style={areaStyle(area)}
                    />
                  );
                }
                if (debrisState[area.id]) {
                  return (
                    <div
                      key={`debris-${area.id}`}
                      className="memei-overlay memei-overlay--debris"
                      style={areaStyle(area)}
                    />
                  );
                }
                if (resinState[area.id]) {
                  return (
                    <div
                      key={`resin-${area.id}`}
                      className="memei-overlay memei-overlay--etched"
                      style={areaStyle(area)}
                    />
                  );
                }
                if (softResinState[area.id]) {
                  return (
                    <div
                      key={`soft-${area.id}`}
                      className="memei-overlay memei-overlay--soft"
                      style={areaStyle(area)}
                    />
                  );
                }
                return null;
              })}

              {bacteriaAreas.map((bact) =>
                bacteriaState[bact.id] ? (
                  <img
                    key={bact.id}
                    src={lactoImg}
                    alt="Lactobacillus"
                    className="memei-bacteria"
                    style={{ ...areaStyle(bact), transform: `rotate(${bact.rotate}deg)` }}
                  />
                ) : null
              )}
            </>
          )}
        </div>

        <div className="patient2-statusBar">
          <p>{status}</p>
          <button
            type="button"
            className="patient2-next"
            onClick={() => onComplete?.()}
            disabled={!allDone}
          >
            Lanjut Racik Obat
          </button>
        </div>
      </div>

      {draggingTool && activeTool && (
        <div className="patient2-dragGhost" style={{ left: toolPos.x, top: toolPos.y }}>
          {activeTool.asset ? (
            <img src={activeTool.asset} alt="" />
          ) : (
            <span
              className={`patient2-toolIcon patient2-toolIcon--${activeTool.iconClass || activeTool.id}`}
            />
          )}
        </div>
      )}

      <div className="patient2-toolDock">
        <div className="patient2-toolDock__inner">
          {toolSequence.map((tool) => (
            <button
              key={tool.id}
              type="button"
              className={[
                'patient2-toolBtn',
                tool.done ? 'is-done' : '',
                tool.id === draggingTool ? 'is-active' : '',
                tool.available ? '' : 'is-locked',
              ]
                .filter(Boolean)
                .join(' ')}
              onPointerDown={(event) => handleToolPointerDown(tool, event)}
              title={tool.available ? tool.dragHint : tool.lockMessage}
            >
              {tool.asset ? (
                <img src={tool.asset} alt={tool.label} draggable="false" />
              ) : (
                <span className={`patient2-toolIcon patient2-toolIcon--${tool.iconClass || tool.id}`} />
              )}
              <span>{tool.label}</span>
              {tool.done && <span className="patient2-toolBtn__done">Selesai</span>}
            </button>
          ))}
        </div>
      </div>
      <div className="patient2-dockSpacer" />
    </div>
  );
};

export default Patient2Cavity;
