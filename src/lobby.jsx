import React, { useEffect, useRef, useState } from "react";
import "./lobby.css";

// Aset
import bg from "./assets/background.png";
import buttonPlay from "./assets/button_play.png";
import buttonExit from "./assets/button_exit.png";
import welcomeBg from "./assets/Welcome1.png"; // background ruangan (tanpa teks)
import doctorImg from "./assets/doctor.png";  // gambar dokter (tanpa bubble)

const Lobby = ({ onStart, sfxStartUrl, bgmUrl }) => {
  // 'lobby' | 'flash' | 'welcome' | 'loading' | 'ward'
  const [screen, setScreen] = useState("lobby");
  const [choice, setChoice] = useState(null); // simpan pilihan mini-dialog

  // Audio refs (user akan isi URL via props). Tidak wajib ada.
  const sfxRef = useRef(null);
  const bgmRef = useRef(null);
  useEffect(() => {
    // Inisialisasi audio sekali
    sfxRef.current = new Audio();
    bgmRef.current = new Audio();
    bgmRef.current.loop = true;
    if (sfxStartUrl) sfxRef.current.src = sfxStartUrl;
    if (bgmUrl) bgmRef.current.src = bgmUrl;
  }, [sfxStartUrl, bgmUrl]);

  // ===== Typewriter (teks berjalan) =====
  const fullText = (
    "Halo pasien kecilku! 🦷 Selamat datang di Tootfy Dental Care.\n" +
    "Di sini, gigi kamu akan jadi bintang utama!\n" +
    "Aku dokter Tootfy, siap membantumu melawan kuman nakal dan membuat senyummu bersinar."
  );
  const [typedText, setTypedText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [doneTyping, setDoneTyping] = useState(false);

  const speed = 35; // ms/karakter
  const idxRef = useRef(0);
  const timerRef = useRef(null);

  const startTyping = () => {
    setTypedText("");
    setIsTyping(true);
    setDoneTyping(false);
    idxRef.current = 0;

    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      const i = idxRef.current;
      if (i < fullText.length) {
        setTypedText((p) => p + fullText[i]);
        idxRef.current = i + 1;
      } else {
        clearInterval(timerRef.current);
        timerRef.current = null;
        setIsTyping(false);
        setDoneTyping(true);
      }
    }, speed);
  };

  useEffect(() => {
    if (screen === "welcome") {
      startTyping();
      // mulai BGM halus (jika ada)
      setTimeout(() => {
        try { bgmRef.current && bgmRef.current.play && bgmRef.current.play(); } catch (_) {}
      }, 400);
    }
    return () => timerRef.current && clearInterval(timerRef.current);
  }, [screen]);

  // ===== Loading data & efek (HOOKS harus di top-level, sebelum return) =====
  const teethCount = 10;
  const [progress, setProgress] = useState(0);
  const [factIndex, setFactIndex] = useState(0);
  const facts = [
    "Tahukah kamu? Gigi susu pertama muncul sekitar usia 6 bulan!",
    "Email gigi adalah bagian terkeras di tubuh manusia.",
    "Senyum cerah datang dari sikat gigi 2x sehari.",
    "Gigi geraham membantu mengunyah makanan lebih halus.",
    "Flossing membantu membersihkan sela gigi yang tak terjangkau sikat.",
  ];
  useEffect(() => {
    if (screen !== "loading") return;
    setProgress(0);
    let p = 0;
    const id = setInterval(() => {
      p += Math.floor(5 + Math.random() * 10);
      if (p >= 100) {
        p = 100;
        clearInterval(id);
        // berhenti sejenak lalu masuk ward + panggil onStart (App → hospitalroom)
        setTimeout(() => {
          setScreen("ward");
          onStart && onStart();
        }, 500);
      }
      setProgress(p);
    }, 220);
    const fid = setInterval(() => {
      setFactIndex((i) => (i + 1) % facts.length);
    }, 1500);
    return () => { clearInterval(id); clearInterval(fid); };
  }, [screen]);

  const handleWelcomeClick = () => {
    if (screen !== "welcome") return;
    if (isTyping) {
      // selesaikan ketikan seketika
      timerRef.current && clearInterval(timerRef.current);
      setTypedText(fullText);
      setIsTyping(false);
      setDoneTyping(true);
    } else if (doneTyping) {
      // Selesai mengetik dan layar ditekan → langsung lanjut ke room (App)
      if (!choice) setChoice("siap");
      onStart && onStart();
      setScreen("ward");
    }
  };

  // Klik tombol Start → flash putih + SFX
  const handleStart = () => {
    try { sfxRef.current && sfxRef.current.play && sfxRef.current.play(); } catch (_) {}
    setScreen("flash");
    // Setelah flash sebentar → masuk welcome
    setTimeout(() => setScreen("welcome"), 800);
  };

  // Setelah pilih pilihan mini dialog → masuk loading
  const handleChoice = (value) => {
    setChoice(value);
    onStart && onStart();
    setScreen("ward");
  };

  const handleExit = () => {
    window.close();
    setTimeout(() => (window.location.href = "https://google.com"), 200);
  };

  // ===== LOBBY =====
  if (screen === "lobby") {
    return (
      <div className="lobby-container" style={{ backgroundImage: `url(${bg})` }}>
        <button className="icon-btn icon-right" onClick={handleExit}>
          <img src={buttonExit} alt="Exit" draggable="false" />
        </button>

        <img
          src={buttonPlay}
          alt="Mulai Game"
          onClick={handleStart}
          className="lobby-button"
          draggable="false"
        />
      </div>
    );
  }

  // ===== FLASH (whiteout) =====
  if (screen === "flash") {
    return (
      <div className="lobby-container" style={{ backgroundImage: `url(${bg})` }}>
        <div className="whiteout flash-in" />
      </div>
    );
  }

  // ===== WELCOME =====
  if (screen === "welcome") {
    return (
      <div className="welcome-container" onClick={handleWelcomeClick}>
        <img
          src={welcomeBg}
          alt="Welcome Background"
          className="welcome-img"
          draggable="false"
        />

        {/* Kelompok dokter + bubble */}
        <div className="doctor vn-enter">
          <img src={doctorImg} alt="Dokter" className="doctor-img" draggable="false" />

          {/* Bubble putih border biru (sejajar kepala) */}
          <div className="speech-bubble">
            <span>{typedText}</span>
            {isTyping && <span className="caret">|</span>}
          </div>
        </div>

        {/* Hint bawah */}
        <p className="welcome-text">
          {isTyping ? "Klik untuk menuntaskan teks…" : "Pilih jawabanmu di atas"}
        </p>

        {/* Pilihan mini-dialog */}
        {doneTyping && (
          <div className="vn-choices" onClick={(e) => e.stopPropagation()}>
            <button className="vn-btn" onClick={() => handleChoice("siap")}>Hai dokter, aku siap!</button>
            <button className="vn-btn" onClick={() => handleChoice("takut")}>Agak takut sih…</button>
            <button className="vn-btn" onClick={() => handleChoice("kinclong")}>Aku mau senyum paling kinclong!</button>
          </div>
        )}
      </div>
    );
  }


  // ===== LOADING =====
  if (screen === "loading") {
    const filled = Math.round((progress / 100) * teethCount);
    return (
      <div className="loading-container">
        <div className="loading-card">
          <div className="teethbar" aria-label="Loading progress">
            {Array.from({ length: teethCount }).map((_, i) => (
              <div key={i} className={`tooth ${i < filled ? "filled" : ""}`} />
            ))}
          </div>
          <div className="loading-percent">{progress}%</div>
          <div className="loading-fact">{facts[factIndex]}</div>
        </div>
      </div>
    );
  }

  // ===== WARD =====
  return null;
};

export default Lobby;
