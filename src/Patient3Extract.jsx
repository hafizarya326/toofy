import React, { useEffect, useMemo, useRef, useState } from "react";
import aruBefore from "./assets/aru_before.png";
import gigiAru from "./assets/gigi_aru.png";
import mirrorImg from "./assets/kaca_mulut.png";
import probeImg from "./assets/sonde.png";
import syringeImg from "./assets/jarum_suntik.png";
import forcepsImg from "./assets/tang.png";
import suctionImg from "./assets/penyedot.png";
import gauzeImg from "./assets/kapas.png";
import tweezersImg from "./assets/pinset.png";
import porphyromonasImg from "./assets/Porphyromonas_gingivalis.png";
import candidaImg from "./assets/Candida_albicans.png";
import "./patient3extract.css";

const soreAreas = [
  { id: "s-1", x: 28, y: 42, w: 18, h: 20 },
  { id: "s-2", x: 52, y: 43, w: 18, h: 20 },
  { id: "s-3", x: 36, y: 66, w: 22, h: 20 },
];

const toothTargets = [{ id: "t-1", x: 30, y: 60, w: 18, h: 22 }];

const bleedingAreas = [{ id: "b-1", x: 30, y: 62, w: 20, h: 22 }];

const bacteriaAreas = [
  { id: "p-1", type: "porphyromonas", x: 24, y: 28, w: 12, h: 12, rot: -12 },
  { id: "p-2", type: "porphyromonas", x: 64, y: 30, w: 12, h: 12, rot: 14 },
  { id: "c-1", type: "candida", x: 42, y: 24, w: 12, h: 12, rot: 8 },
  { id: "c-2", type: "candida", x: 38, y: 78, w: 12, h: 12, rot: -6 },
];

const buildState = (areas, initial = true) =>
  areas.reduce((acc, area) => ({ ...acc, [area.id]: initial }), {});

const isInside = (x, y, area) =>
  x >= area.x && x <= area.x + area.w && y >= area.y && y <= area.y + area.h;

const Patient3Extract = ({ onComplete }) => {
  const stageRef = useRef(null);
  const [phase, setPhase] = useState("intro");
  const [status, setStatus] = useState(
    "Gunakan kaca mulut untuk memeriksa gusi Aru."
  );
  const [draggingTool, setDraggingTool] = useState(null);
  const [hoveringStage, setHoveringStage] = useState(false);
  const [toolPos, setToolPos] = useState({ x: 0, y: 0 });
  const [completed, setCompleted] = useState({
    mirrorProbe: false,
    anesthesia: false,
    extract: false,
    suction: false,
    gauze: false,
    tweezers: false,
  });

  const [soreState, setSoreState] = useState(() => buildState(soreAreas, true));
  const [numbState, setNumbState] = useState(() =>
    buildState(soreAreas, false)
  );
  const [toothState, setToothState] = useState(() =>
    buildState(toothTargets, true)
  );
  const [bleedState, setBleedState] = useState(() =>
    buildState(bleedingAreas, true)
  );
  const [bacteriaState, setBacteriaState] = useState(() =>
    buildState(bacteriaAreas, true)
  );

  const remainingSore = useMemo(
    () => Object.values(soreState).filter(Boolean).length,
    [soreState]
  );
  const remainingTooth = useMemo(
    () => Object.values(toothState).filter(Boolean).length,
    [toothState]
  );
  const remainingBleed = useMemo(
    () => Object.values(bleedState).filter(Boolean).length,
    [bleedState]
  );
  const remainingBacteria = useMemo(
    () => Object.values(bacteriaState).filter(Boolean).length,
    [bacteriaState]
  );

  const toolSequence = useMemo(
    () => [
      {
        id: "mirrorProbe",
        label: "Mirror + Probe",
        asset: mirrorImg,
        available: true,
        done: completed.mirrorProbe,
        dragHint: "Seret kaca mulut dan probe untuk melihat gigi dan gusi.",
        lockMessage: "Mulai dengan pemeriksaan menggunakan kaca mulut.",
      },
      {
        id: "anesthesia",
        label: "Suntik Bius",
        asset: syringeImg,
        available: completed.mirrorProbe,
        done: completed.anesthesia,
        dragHint: "Suntikkan bius pada gusi yang bengkak.",
        lockMessage: "Periksa kondisi gusi terlebih dahulu.",
      },
      {
        id: "extract",
        label: "Tang Cabut",
        asset: forcepsImg,
        available: completed.anesthesia,
        done: completed.extract,
        dragHint: "Capit gigi rusak dan cabut perlahan.",
        lockMessage: "Pastikan bius sudah bekerja sebelum mencabut gigi.",
      },
      {
        id: "suction",
        label: "Penyedot",
        asset: suctionImg,
        available: completed.extract,
        done: completed.suction,
        dragHint: "Seret untuk menyedot darah/air liur di area pencabutan.",
        lockMessage: "Cabut gigi dulu baru bersihkan area.",
      },
      {
        id: "gauze",
        label: "Kapas Tekan",
        asset: gauzeImg,
        available: completed.suction,
        done: completed.gauze,
        dragHint: "Tekan area bekas cabut dengan kapas steril.",
        lockMessage: "Bersihkan darah dengan penyedot dahulu.",
      },
      {
        id: "tweezers",
        label: "Pinset Bakteri",
        asset: tweezersImg,
        available: completed.gauze,
        done: completed.tweezers,
        dragHint: "Angkat bakteri Porphyromonas dan Candida yang tersisa.",
        lockMessage: "Hentikan perdarahan dulu sebelum membersihkan bakteri.",
      },
    ],
    [completed]
  );

  const stageClassName = useMemo(() => {
    const base = ["patient3-stage__viewport"];
    if (phase === "intro") base.push("is-intro");
    if (draggingTool === "mirrorProbe" && !completed.mirrorProbe)
      base.push("target-mirror");
    if (
      hoveringStage &&
      draggingTool === "mirrorProbe" &&
      !completed.mirrorProbe
    )
      base.push("is-hover");
    return base.join(" ");
  }, [phase, draggingTool, hoveringStage, completed.mirrorProbe]);

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
      if (draggingTool === "mirrorProbe") return;
      if (phase !== "exposed") return;

      const relX = ((event.clientX - rect.left) / rect.width) * 100;
      const relY = ((event.clientY - rect.top) / rect.height) * 100;

      if (draggingTool === "anesthesia") {
        let numbed = false;
        soreAreas.some((area) => {
          if (!soreState[area.id]) return false;
          if (isInside(relX, relY, area)) {
            numbed = true;
            setSoreState((prev) => ({ ...prev, [area.id]: false }));
            setNumbState((prev) => ({ ...prev, [area.id]: true }));
            return true;
          }
          return false;
        });
        if (numbed)
          setStatus("Bius bekerja. Lanjutkan pada area bengkak lainnya.");
      } else if (draggingTool === "extract") {
        let pulled = false;
        toothTargets.some((area) => {
          if (!toothState[area.id]) return false;
          if (isInside(relX, relY, area)) {
            pulled = true;
            setToothState((prev) => ({ ...prev, [area.id]: false }));
            return true;
          }
          return false;
        });
        if (pulled)
          setStatus("Gigi berhasil dicabut! Bersihkan darah dengan penyedot.");
      } else if (draggingTool === "suction") {
        let cleaned = false;
        bleedingAreas.some((area) => {
          if (!bleedState[area.id]) return false;
          if (isInside(relX, relY, area)) {
            cleaned = true;
            setBleedState((prev) => ({ ...prev, [area.id]: false }));
            return true;
          }
          return false;
        });
        if (cleaned) setStatus("Area kering. Tekan dengan kapas steril.");
      } else if (draggingTool === "gauze") {
        let pressed = false;
        bleedingAreas.some((area) => {
          if (bleedState[area.id]) return false;
          if (isInside(relX, relY, area)) {
            pressed = true;
            setBleedState((prev) => ({ ...prev, [area.id]: false }));
            return true;
          }
          return false;
        });
        if (pressed)
          setStatus("Perdarahan berhenti. Angkat bakterinya dengan pinset.");
      } else if (draggingTool === "tweezers") {
        let removedSomething = false;
        bacteriaAreas.some((area) => {
          if (!bacteriaState[area.id]) return false;
          if (isInside(relX, relY, area)) {
            removedSomething = true;
            setBacteriaState((prev) => ({ ...prev, [area.id]: false }));
            return true;
          }
          return false;
        });
        if (removedSomething)
          setStatus("Bakteri terangkat! Bersihkan semua sebelum lanjut.");
      }
    };

    const handleUp = (event) => {
      const stage = stageRef.current;
      const active = draggingTool;
      setDraggingTool(null);
      setHoveringStage(false);

      if (!stage || active !== "mirrorProbe") return;

      const rect = stage.getBoundingClientRect();
      const inside =
        event.clientX >= rect.left &&
        event.clientX <= rect.right &&
        event.clientY >= rect.top &&
        event.clientY <= rect.bottom;
      if (!inside) {
        setStatus("Pastikan kaca mulut tepat pada mulut pasien.");
        return;
      }

      if (!completed.mirrorProbe) {
        setPhase("exposed");
        setCompleted((prev) => ({ ...prev, mirrorProbe: true }));
        setStatus("Gusi bengkak terdeteksi. Suntikkan bius pada area merah.");
      }
    };

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);

    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
    };
  }, [
    draggingTool,
    phase,
    soreState,
    toothState,
    bleedState,
    bacteriaState,
    completed.mirrorProbe,
  ]);

  useEffect(() => {
    if (!draggingTool) return undefined;
    const previous = document.body.style.userSelect;
    document.body.style.userSelect = "none";
    return () => {
      document.body.style.userSelect = previous;
    };
  }, [draggingTool]);

  useEffect(() => {
    if (!completed.mirrorProbe) return;
    if (!completed.anesthesia && remainingSore === 0) {
      setCompleted((prev) => ({ ...prev, anesthesia: true }));
      setStatus("Gusi sudah kebas. Siapkan tang untuk mencabut gigi rusak.");
    }
  }, [completed.mirrorProbe, completed.anesthesia, remainingSore]);

  useEffect(() => {
    if (!completed.anesthesia) return;
    if (!completed.extract && remainingTooth === 0) {
      setCompleted((prev) => ({ ...prev, extract: true }));
      setStatus("Gigi lepas! Segera sedot darah dengan penyedot.");
    }
  }, [completed.anesthesia, completed.extract, remainingTooth]);

  useEffect(() => {
    if (!completed.extract) return;
    if (!completed.suction && remainingBleed === 0) {
      setCompleted((prev) => ({ ...prev, suction: true }));
      setStatus("Area bersih, tekan dengan kapas steril.");
    }
  }, [completed.extract, completed.suction, remainingBleed]);

  useEffect(() => {
    if (!completed.suction) return;
    if (!completed.gauze) {
      setCompleted((prev) => ({ ...prev, gauze: true }));
      setStatus("Sekarang singkirkan bakterinya dengan pinset.");
    }
  }, [completed.suction, completed.gauze]);

  useEffect(() => {
    if (!completed.gauze) return;
    if (!completed.tweezers && remainingBacteria === 0) {
      setCompleted((prev) => ({ ...prev, tweezers: true }));
      setStatus("Infeksi terkendali! Klik lanjut untuk meracik obat.");
    }
  }, [completed.gauze, completed.tweezers, remainingBacteria]);

  const handleToolPointerDown = (tool, event) => {
    event.preventDefault();
    if (tool.done) {
      setStatus("Langkah ini sudah selesai, lanjutkan ke alat berikutnya.");
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
    completed.mirrorProbe &&
    completed.anesthesia &&
    completed.extract &&
    completed.suction &&
    completed.gauze &&
    completed.tweezers;

  return (
    <div className="patient3-layout">
      <div className="patient3-info">
        <h2>Aru - Pencabutan Gigi</h2>
        <p className="patient3-complaint">
          "Gusi aku sakit dan giginya rusak!"
        </p>
        <div className="patient3-steps">
          <strong>Langkah Perawatan:</strong>
          <ol>
            <li>Mirror + probe memeriksa gusi dan gigi.</li>
            <li>Suntik bius di gusi bengkak.</li>
            <li>Tang cabut gigi rusak.</li>
            <li>Penyedot bersihkan darah/air liur.</li>
            <li>Kapas tekan bekas cabutan.</li>
            <li>Pinset angkat bakteri berbahaya.</li>
          </ol>
        </div>
        <div className="patient3-progress">
          <div>
            <span>Area bengkak</span>
            <strong>{remainingSore}</strong>
          </div>
          <div>
            <span>Gigi rusak</span>
            <strong>{remainingTooth}</strong>
          </div>
          <div>
            <span>Darah/air liur</span>
            <strong>{remainingBleed}</strong>
          </div>
          <div>
            <span>Bakteri</span>
            <strong>{remainingBacteria}</strong>
          </div>
        </div>
      </div>

      <div className="patient3-stage">
        <div
          ref={stageRef}
          className={stageClassName}
          style={{
            backgroundImage: `url(${phase === "intro" ? aruBefore : gigiAru})`,
          }}
        >
          {phase === "intro" && !completed.mirrorProbe && (
            <div className="patient3-stage__hint">
              Seret mirror + probe untuk memeriksa gusi
            </div>
          )}

          {phase === "exposed" && (
            <>
              {soreAreas.map((area) =>
                soreState[area.id] ? (
                  <div
                    key={`sore-${area.id}`}
                    className="aru-overlay aru-overlay--sore"
                    style={areaStyle(area)}
                  />
                ) : numbState[area.id] ? (
                  <div
                    key={`numb-${area.id}`}
                    className="aru-overlay aru-overlay--numb"
                    style={areaStyle(area)}
                  />
                ) : null
              )}

              {toothTargets.map((area) =>
                toothState[area.id] ? (
                  <div
                    key={`tooth-${area.id}`}
                    className="aru-overlay aru-overlay--tooth"
                    style={areaStyle(area)}
                  />
                ) : (
                  <div
                    key={`socket-${area.id}`}
                    className="aru-overlay aru-overlay--socket"
                    style={areaStyle(area)}
                  />
                )
              )}

              {bleedingAreas.map((area) =>
                bleedState[area.id] ? (
                  <div
                    key={`bleed-${area.id}`}
                    className="aru-overlay aru-overlay--bleed"
                    style={areaStyle(area)}
                  />
                ) : (
                  <div
                    key={`dry-${area.id}`}
                    className="aru-overlay aru-overlay--dry"
                    style={areaStyle(area)}
                  />
                )
              )}

              {bacteriaAreas.map((area) =>
                bacteriaState[area.id] ? (
                  <img
                    key={area.id}
                    src={
                      area.type === "porphyromonas"
                        ? porphyromonasImg
                        : candidaImg
                    }
                    alt={area.type}
                    className={`aru-bacteria aru-bacteria--${area.type}`}
                    style={{
                      ...areaStyle(area),
                      "--aru-rot": `${area.rot}deg`,
                    }}
                  />
                ) : null
              )}
            </>
          )}
        </div>

        <div className="patient3-statusBar">
          <p>{status}</p>
          <button
            type="button"
            className="patient3-next"
            onClick={() => onComplete?.()}
            disabled={!allDone}
          >
            Lanjut Racik Obat
          </button>
        </div>

        <div className="patient3-toolDock">
          <div className="patient3-toolDock__inner">
            {toolSequence.map((tool) => (
              <button
                key={tool.id}
                type="button"
                className={[
                  "patient3-toolBtn",
                  tool.done ? "is-done" : "",
                  tool.id === draggingTool ? "is-active" : "",
                  tool.available ? "" : "is-locked",
                ]
                  .filter(Boolean)
                  .join(" ")}
                onPointerDown={(event) => handleToolPointerDown(tool, event)}
                title={tool.available ? tool.dragHint : tool.lockMessage}
              >
                <img src={tool.asset} alt={tool.label} draggable="false" />
                <span>{tool.label}</span>
                {tool.done && (
                  <span className="patient3-toolBtn__done">Selesai</span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {draggingTool && activeTool && (
        <div
          className="patient3-dragGhost"
          style={{ left: toolPos.x, top: toolPos.y }}
        >
          <img src={activeTool.asset} alt="" />
        </div>
      )}
    </div>
  );
};

export default Patient3Extract;
