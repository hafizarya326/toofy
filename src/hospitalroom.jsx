import React, { useEffect, useRef, useState } from "react";
import "./hospitalroom.css";

// Aset (taruh di: src/assets/)
import bg from "./assets/bghospital.png";
import cikoImg from "./assets/ciko.png";
import meimeiImg from "./assets/meimei.png";
import nanaImg from "./assets/nana.png";
import doctorImg from "./assets/doctor.png";

/** Posisi pasien (biarkan seperti ini) */
const PATIENTS = [
  { name: "Ciko", img: cikoImg, x: 255, y: 400, rotate: -10 },
  { name: "Memei", img: meimeiImg, x: 585, y: 380, rotate: 0 },
  { name: "Aru", img: nanaImg, x: 900, y: 400, rotate: 0 },
];

/** --- JALUR MERAH ---
 * Urutkan hanya nilai X, nanti dipilih urutannya (kiri-ke-kanan / kanan-ke-kiri)
 * sesuai arah menuju pasien, lalu filter yang berada di antara start & dest.
 */
const RED_Y = 400; // start Y pada jalur agar tidak mentok di frame awal
const RED_LINE_POINTS = [850, 900, 900, 940]; // titik X di jalur (boleh tambah/kurangi)

/** Bangun path ke pasien: mulai dari posisi dokter -> titik jalur (monoton) -> dest */
function buildPathToPatient(patient, doctorPos) {
  // offset Y khusus per pasien (negatif = naik)
  const DEST_Y_OFFSET = {
    Ciko: -110, // naik 110px saat ke Ciko
    Memei: -90,
    Aru: 0,
  };

  const extraY = DEST_Y_OFFSET[patient.name] ?? 0;

  // sisi kasur pasien + offset khusus
  const dest = { x: patient.x + 30, y: patient.y + 70 + extraY };

  const goingLeft = dest.x < doctorPos.x;
  const xs = goingLeft ? [...RED_LINE_POINTS].reverse() : RED_LINE_POINTS;

  const minX = Math.min(doctorPos.x, dest.x);
  const maxX = Math.max(doctorPos.x, dest.x);
  const waypoints = xs
    .map((x) => ({ x, y: RED_Y }))
    .filter((pt) => pt.x >= minX && pt.x <= maxX);

  return [{ x: doctorPos.x, y: doctorPos.y }, ...waypoints, dest];
}

const HospitalRoom = ({
  onPatientClick,
  onBack,
  treatmentDone = [false, false, false],
  craftDone = [false, false, false],
}) => {
  // Posisi awal dokter diset ke Y jalur (RED_Y)
  const [doctor, setDoctor] = useState({ x: 1110, y: RED_Y });

  // RAF + path follower
  const rafRef = useRef(null);
  const pathRef = useRef([]);
  const idxRef = useRef(0);

  // Klik pasien -> bangun path dan mulai jalan
  const goToPatient = (idx) => {
    if (craftDone[idx]) return;
    const p = PATIENTS[idx];
    pathRef.current = buildPathToPatient(p, doctor);
    idxRef.current = 1; // targetkan waypoint pertama setelah posisi sekarang
    startWalking(idx);
  };

  // Mesin animasi berjalan sepanjang pathRef.current
  const startWalking = (patientIdx) => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    const speed = 5; // px per frame-ish

    const step = () => {
      const path = pathRef.current;
      if (!path.length || idxRef.current >= path.length) {
        cancelAnimationFrame(rafRef.current);
        onPatientClick?.(patientIdx); // sampai ke pasien
        return;
      }

      const target = path[idxRef.current];

      setDoctor((prev) => {
        const dx = target.x - prev.x;
        const dy = target.y - prev.y;
        const d = Math.hypot(dx, dy);

        if (d <= speed) {
          idxRef.current += 1;
          return { x: target.x, y: target.y };
        }

        return {
          x: prev.x + (dx / d) * speed,
          y: prev.y + (dy / d) * speed,
        };
      });
      rafRef.current = requestAnimationFrame(step);
    };

    rafRef.current = requestAnimationFrame(step);
  };

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <div className="room" style={{ backgroundImage: `url(${bg})` }}>
      <header className="header">
        <h1 className="title">Toofy</h1>
        <h2 className="subtitle">Ruang Rawat Toofy Clinic</h2>
      </header>

      {/* Pasien */}
      {PATIENTS.map((p, idx) => {
        const treated = !!treatmentDone[idx];
        const crafted = !!craftDone[idx];
        const disabled = crafted;
        const title = disabled
          ? "Pasien selesai dirawat"
          : treated
          ? "Perawatan selesai - siapkan ramuan"
          : `Pasien: ${p.name}`;
        return (
          <button
            key={p.name}
            className="patientBtn"
            style={{ left: p.x, top: p.y }}
            onClick={() => goToPatient(idx)}
            aria-label={`Panggil dokter ke pasien ${p.name}`}
            title={title}
            disabled={disabled}
          >
            <img
              className="patientImg"
              src={p.img}
              alt={p.name}
              style={{ transform: `rotate(${p.rotate || 0}deg)` }}
            />
            <span className="patientName">{p.name}</span>

            {crafted && <span className="badge done">Selesai</span>}
            {!crafted && treated && <span className="badge ok">Siap Ramuan</span>}
          </button>
        );
      })}
      {/* Dokter */}
      {/* <div className="doctorLabel" style={{ left: doctor.x + 4, top: doctor.y - 10 }}>
        Dr. Lilo
      </div> */}
      <img
        className="doctorImg"
        src={doctorImg}
        alt="Dr. Lilo"
        style={{ left: doctor.x, top: doctor.y + 80 }}
      />
    </div>
  );
};

export default HospitalRoom;

