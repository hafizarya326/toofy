// import React, { useEffect, useMemo, useRef, useState } from 'react';
// import bgPatient from './assets/patient1_bg.png';
// import brushImg from './assets/cleangigi.png';
// import dirtPNG from './assets/kotoran.png';
// import './patient1clean.css';

// // Utility: point in polygon (ray casting)
// function ptInPoly(pt, poly) {
//   let c = false;
//   for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
//     const xi = poly[i][0], yi = poly[i][1];
//     const xj = poly[j][0], yj = poly[j][1];
//     const intersect = ((yi > pt[1]) !== (yj > pt[1])) &&
//       (pt[0] < (xj - xi) * (pt[1] - yi) / (yj - yi + 0.00001) + xi);
//     if (intersect) c = !c;
//   }
//   return c;
// }

// // Convert relative poly (0..1) to pixel poly for given size
// function scalePoly(poly, w, h) {
//   return poly.map(([x, y]) => [x * w, y * h]);
// }

// const Patient1Clean = ({ onBack, onComplete }) => {
//   const wrapRef = useRef(null);
//   const canvasRef = useRef(null);
//   const [size, setSize] = useState({ w: 0, h: 0 });
//   const [imgNat, setImgNat] = useState({ w: 0, h: 0 });
//   const [progress, setProgress] = useState(0); // 0-100 cleaned
//   const [brushing, setBrushing] = useState(false);
//   const [cursor, setCursor] = useState({ x: 0, y: 0 });

//   // Dua band (atas & bawah) mengikuti garis gigi; tweak angka agar pas.
//   const upperBandRel = useMemo(() => [
//     [0.20, 0.505], [0.80, 0.505], [0.82, 0.532], [0.18, 0.532],
//   ], []);
//   const lowerBandRel = useMemo(() => [
//     [0.18, 0.558], [0.82, 0.558], [0.80, 0.586], [0.20, 0.586],
//   ], []);

//   // Map koordinat relatif gambar → koordinat canvas saat <img> memakai object-fit: cover
//   const mapCover = (xRel, yRel, cw, ch, iw, ih) => {
//     if (!cw || !ch || !iw || !ih) return [0, 0];
//     const scale = Math.max(cw / iw, ch / ih);
//     const dw = iw * scale, dh = ih * scale;
//     const ox = (cw - dw) / 2, oy = (ch - dh) / 2;
//     return [ox + xRel * dw, oy + yRel * dh];
//   };
//   const scalePolyCover = (poly, cw, ch, iw, ih) => poly.map(([x, y]) => mapCover(x, y, cw, ch, iw, ih));
//   const ptInAny = (pt, polys) => polys.some((poly) => ptInPoly(pt, poly));

//   // Ambil ukuran asli gambar untuk perhitungan cover
//   useEffect(() => {
//     const img = new Image();
//     img.src = bgPatient;
//     img.onload = () => setImgNat({ w: img.naturalWidth, h: img.naturalHeight });
//   }, []);

//   // Resize handling to keep canvas in sync with container
//   useEffect(() => {
//     const el = wrapRef.current;
//     if (!el) return;
//     const resize = () => setSize({ w: el.clientWidth, h: el.clientHeight });
//     resize();
//     const obs = new ResizeObserver(resize);
//     obs.observe(el);
//     return () => obs.disconnect();
//   }, []);

//   // Draw initial dirt overlay once size known
//   useEffect(() => {
//     const c = canvasRef.current;
//     if (!c || !size.w || !size.h || !imgNat.w || !imgNat.h) return;
//     c.width = size.w; c.height = size.h;
//     const ctx = c.getContext('2d');
//     ctx.clearRect(0, 0, c.width, c.height);
//     // Build clip for both bands
//     const polyU = scalePolyCover(upperBandRel, c.width, c.height, imgNat.w, imgNat.h);
//     const polyL = scalePolyCover(lowerBandRel, c.width, c.height, imgNat.w, imgNat.h);
//     ctx.save();
//     ctx.beginPath();
//     // add upper band subpath
//     polyU.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
//     ctx.closePath();
//     // add lower band subpath in SAME path (no new beginPath)
//     polyL.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
//     ctx.closePath();
//     ctx.clip();

//     // Fill with kotoran.png pattern (tiled)
//     const dirt = new Image();
//     dirt.src = dirtPNG;
//     dirt.onload = () => {
//       // scale tile relative to mouth width
//       const xs = [...polyU.map(p => p[0]), ...polyL.map(p => p[0])];
//       const mouthW = Math.max(...xs) - Math.min(...xs);
//       const desiredTileW = Math.max(48, Math.min(160, mouthW / 6));
//       const scale = desiredTileW / dirt.width;
//       const tileW = dirt.width * scale;
//       const tileH = dirt.height * scale;

//       // Use pattern tile; some browsers don't scale patterns from drawImage directly,
//       // so draw in a loop for deterministic result under clip.
//       for (let y = 0; y < c.height + tileH; y += tileH) {
//         for (let x = 0; x < c.width + tileW; x += tileW) {
//           ctx.drawImage(dirt, x, y, tileW, tileH);
//         }
//       }
//       ctx.restore();
//       setProgress(0);
//     };
//   }, [size, upperBandRel, lowerBandRel, imgNat]);

//   // Brush draw (erase dirt)
//   const brush = (x, y) => {
//     const c = canvasRef.current;
//     if (!c) return;
//     const ctx = c.getContext('2d');
//     const polyU = scalePolyCover(upperBandRel, c.width, c.height, imgNat.w, imgNat.h);
//     const polyL = scalePolyCover(lowerBandRel, c.width, c.height, imgNat.w, imgNat.h);
//     if (!ptInAny([x, y], [polyU, polyL])) return; // ignore outside area

//     // Erase dirt by painting destination-out circles
//     const R = 24;
//     ctx.save();
//     ctx.globalCompositeOperation = 'destination-out';
//     ctx.fillStyle = '#000';
//     ctx.beginPath();
//     ctx.arc(x, y, R, 0, Math.PI * 2);
//     ctx.fill();
//     ctx.restore();
//   };

//   // Compute cleaned percent (throttled)
//   const recomputeProgress = () => {
//     const c = canvasRef.current;
//     if (!c) return;
//     const ctx = c.getContext('2d');
//     const img = ctx.getImageData(0, 0, c.width, c.height);
//     const polyU = scalePolyCover(upperBandRel, c.width, c.height, imgNat.w, imgNat.h);
//     const polyL = scalePolyCover(lowerBandRel, c.width, c.height, imgNat.w, imgNat.h);

//     let opaque = 0, total = 0;
//     // Compute polygon bounding box for faster sampling
//     const xs = [...polyU.map(p => p[0]), ...polyL.map(p => p[0])];
//     const ys = [...polyU.map(p => p[1]), ...polyL.map(p => p[1])];
//     const minX = Math.max(0, Math.floor(Math.min(...xs)));
//     const maxX = Math.min(img.width - 1, Math.ceil(Math.max(...xs)));
//     const minY = Math.max(0, Math.floor(Math.min(...ys)));
//     const maxY = Math.min(img.height - 1, Math.ceil(Math.max(...ys)));

//     for (let y = minY; y <= maxY; y += 4) {
//       for (let x = minX; x <= maxX; x += 4) {
//         if (!ptInAny([x, y], [polyU, polyL])) continue;
//         const idx = (y * img.width + x) * 4 + 3; // alpha channel
//         total++;
//         if (img.data[idx] < 8) opaque++; // transparent = erased
//       }
//     }
//     if (total === 0) return;
//     const cleaned = Math.max(0, Math.min(100, Math.round((opaque / total) * 100)));
//     setProgress(cleaned);
//   };

//   // Pointer handlers
//   const onDown = (e) => {
//     const rect = canvasRef.current.getBoundingClientRect();
//     const x = e.clientX - rect.left, y = e.clientY - rect.top;
//     setCursor({ x, y });
//     setBrushing(true);
//     brush(x, y);
//     recomputeProgress();
//   };
//   const onMove = (e) => {
//     const rect = canvasRef.current.getBoundingClientRect();
//     const x = e.clientX - rect.left, y = e.clientY - rect.top;
//     setCursor({ x, y });
//     if (brushing) {
//       brush(x, y);
//     }
//   };
//   const endBrush = () => {
//     if (brushing) recomputeProgress();
//     setBrushing(false);
//   };

//   // Auto complete when cleaned enough
//   useEffect(() => {
//     if (progress >= 85) {
//       // little delay for feedback
//       const t = setTimeout(() => onComplete && onComplete(), 400);
//       return () => clearTimeout(t);
//     }
//   }, [progress, onComplete]);

//   return (
//     <div className="p1c-root">
//       <div className="p1c-stage" ref={wrapRef}>
//         <div className="p1c-layer">
//           <img src={bgPatient} alt="Patient 1" className="p1c-bg" draggable="false" />
//           <canvas
//             ref={canvasRef}
//             className="p1c-dirt"
//             onMouseDown={onDown}
//             onMouseMove={onMove}
//             onMouseUp={endBrush}
//             onMouseLeave={endBrush}
//             onTouchStart={(e) => { const t = e.touches[0]; if (!t) return; onDown({ clientX: t.clientX, clientY: t.clientY }); e.preventDefault(); }}
//             onTouchMove={(e) => { const t = e.touches[0]; if (!t) return; onMove({ clientX: t.clientX, clientY: t.clientY }); e.preventDefault(); }}
//             onTouchEnd={(e) => { endBrush(); e.preventDefault(); }}
//           />
//         </div>

//         {/* Focus ring to indicate cleaning zone */}
//         <div className="p1c-focus" />

//         {/* Cursor brush preview */}
//         {brushing && (
//           <img src={brushImg} alt="Brush" className="p1c-brush" style={{ left: cursor.x, top: cursor.y }} />
//         )}

//         {/* Top bar */}
//         <div className="p1c-top">
//           <div className="p1c-title" style={{ margin: '0 auto' }}>Bersihkan Gigi</div>
//           <div className="p1c-progress" style={{ marginLeft: 'auto' }}>Bersih {progress}%</div>
//         </div>
//       </div>

//       <div className="p1c-hint">Tahan klik dan gosok area mulut sampai bersih.</div>
//     </div>
//   );
// };

// // no DirtBand needed in canvas version

// export default Patient1Clean;
