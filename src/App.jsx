import React, { useRef, useState, useEffect } from 'react';
import Lobby from './lobby';
import HospitalRoom from './hospitalroom';
import TeethCloseup from './teethcloseup';
import CraftingLab from './CraftingLab';
import LencanaMenu, { BADGE_DEFS } from './lencana.jsx';
import buttonSound from './assets/button_sound.png';
import buttonBack from './assets/button_back.png';
import backsound from './assets/sounds/backsound.mp3';
import logo from './assets/logo.png';
import './App.css';

function App() {
  const [screen, setScreen] = useState('lobby');
  const [selectedPatient, setSelectedPatient] = useState(null);

  // Progress per pasien
  const [treatmentDone, setTreatmentDone] = useState([false, false, false]);
  const [craftDone, setCraftDone] = useState([false, false, false]);

  // Lencana UI
  const [showBadges, setShowBadges] = useState(false);
  const [pendingBadgeKey, setPendingBadgeKey] = useState(null);

  // Loading
  const [loadingVisible, setLoadingVisible] = useState(false);
  const [loadingActive, setLoadingActive] = useState(false);
  const [runProgress, setRunProgress] = useState(false);

  // === Audio global ===
  // Ambil preferensi mute terakhir (opsional)
  const [muted, setMuted] = useState(() => localStorage.getItem('muted') === '1');
  const [soundStarted, setSoundStarted] = useState(false);
  const audioRef = useRef(null);

  // Persist preferensi mute (opsional)
  useEffect(() => {
    localStorage.setItem('muted', muted ? '1' : '0');
  }, [muted]);

  // Reset progres pasien (lencana) saat keluar/refresh halaman
  useEffect(() => {
    const resetProgressOnUnload = () => {
      try { localStorage.removeItem('game_badges_unlocked_v1'); } catch (_) {}
    };
    window.addEventListener('beforeunload', resetProgressOnUnload);
    return () => window.removeEventListener('beforeunload', resetProgressOnUnload);
  }, []);

  // Helper: cek apakah audio sedang playing
  const isPlaying = (audio) =>
    audio && !audio.paused && !audio.ended && audio.currentTime > 0;

  // Helper: pastikan audio play; kalau autoplay diblok, tunggu gesture pertama
  const ensureAudioPlaying = () => {
    const a = audioRef.current;
    if (!a) return;

    // sinkronkan properti muted
    a.muted = muted;
    if (muted) {
      a.pause();
      return;
    }
    if (isPlaying(a)) {
      if (!soundStarted) setSoundStarted(true);
      return;
    }

    const tryPlay = () =>
      a.play().then(() => {
        setSoundStarted(true);
      });

    tryPlay().catch(() => {
      // Autoplay ditolak: tunggu interaksi pertama
      const unlock = () => {
        tryPlay().finally(() => {
          window.removeEventListener('pointerdown', unlock, { capture: true });
          window.removeEventListener('keydown', unlock, { capture: true });
        });
      };
      window.addEventListener('pointerdown', unlock, { once: true, capture: true });
      window.addEventListener('keydown', unlock, { once: true, capture: true });
    });
  };

  // Inisialisasi audio saat mount
  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    a.loop = true;
    a.muted = muted;        // JANGAN gunakan atribut muted di JSX
    a.volume = 0.6;         // silakan atur default volume
    // Coba play di awal jika tidak muted; kalau gagal, akan menunggu gesture
    ensureAudioPlaying();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reaksi saat toggle mute
  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    a.muted = muted;
    if (muted) {
      a.pause();
    } else {
      ensureAudioPlaying(); // coba lanjutkan setelah unmute
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [muted]);

  // --- Routing & loading (tetap) ---
  const handleStart = () => {
    // PENTING: Panggil reset di sini untuk memastikan game baru dimulai dari awal
    resetGameState();
    setLoadingVisible(true);
    setLoadingActive(true);
    setScreen('room');
    ensureAudioPlaying();
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setRunProgress(true));
    });
  };

  const handleProgressDone = (e) => {
    if (e.propertyName !== 'transform') return;
    setLoadingActive(false);
    setTimeout(() => {
      setLoadingVisible(false);
      setRunProgress(false);
    }, 400);
  };

  const handlePatientClick = (idx) => {
    if (craftDone[idx]) return;
    setSelectedPatient(idx);
    setScreen('closeup');
  };

  const resetGameState = () => {
    setSelectedPatient(null);
    setTreatmentDone([false, false, false]);
    setCraftDone([false, false, false]);
    setPendingBadgeKey(null);
    setShowBadges(false);
    setLoadingVisible(false);
    setLoadingActive(false);
    setRunProgress(false);
    try { localStorage.removeItem('game_badges_unlocked_v1'); } catch (_) {}
  };

  const handleBack = () => {
    // If we are on the closeup screen, go back to the hospital room without resetting state.
    if (screen === 'closeup') {
      setScreen('room');
      return;
    }
    // If we are on the craft screen, go back to the closeup screen without resetting state.
    if (screen === 'craft') {
      setScreen('closeup');
      return;
    }
    // If we are on the hospital room screen and press back, reset the game state and go to the lobby.
    if (screen === 'room') {
      resetGameState();
      setScreen('lobby');
      return;
    }
    // As a fallback for any other state, reset the game and go to the lobby.
    resetGameState();
    setScreen('lobby');
  };

  const goToCraft = () => setScreen('craft');
  const finishCraft = () => {
    if (selectedPatient != null) {
      setCraftDone((prev) => {
        const next = [...prev];
        next[selectedPatient] = true;
        return next;
      });
    }
    setSelectedPatient(null);
    setScreen('room');
  };

  // Saat perawatan selesai di closeup
  const handleTreatmentComplete = (idx) => {
    setTreatmentDone((prev) => {
      const next = [...prev];
      next[idx] = true;
      return next;
    });
    const key = `pasien${idx + 1}_selesai`;
    if (BADGE_DEFS[key]) {
      setPendingBadgeKey(key);
      setShowBadges(true);
    } else {
      // fallback langsung ke craft jika tidak ada badge
      goToCraft();
    }
  };

  const renderScreen = () => {
    if (screen === 'lobby' && loadingVisible) return null;
    switch (screen) {
      case 'lobby':
        return <Lobby onStart={handleStart} />;
      case 'room':
        return (
          <HospitalRoom
            onPatientClick={handlePatientClick}
            onBack={handleBack}
            treatmentDone={treatmentDone}
            craftDone={craftDone}
          />
        );
      case 'closeup':
        return (
          <TeethCloseup
            patientIdx={selectedPatient}
            onBack={handleBack}
            onComplete={() => handleTreatmentComplete(selectedPatient)}
          />
        );
      case 'craft':
        return (
          <CraftingLab
            patientIdx={selectedPatient}
            onBack={() => setScreen('closeup')}
            onFinish={finishCraft}
          />
        );
      default:
        return <Lobby onStart={handleStart} />;
    }
  };

  const handleSoundClick = () => setMuted((prev) => !prev);

  return (
    <div className="App" style={{ position: 'relative' }}>
      {/* NOTE: hilangkan atribut `muted` di sini */}
      <audio ref={audioRef} src={backsound} />

      <button
        className={`icon-btn icon-left${muted ? ' muted' : ''}`}
        onClick={handleSoundClick}
        style={{ position: 'fixed', top: 18, left: 24, zIndex: 9999 }}
      >
        <img src={buttonSound} alt="Sound" draggable="false" />
      </button>

      {screen !== 'lobby' && (
        <button
          className="icon-btn icon-right"
          onClick={handleBack}
          style={{ position: 'fixed', top: 18, right: 24, zIndex: 9999 }}
        >
          <img src={buttonBack} alt="Back" draggable="false" />
        </button>
      )}

      {loadingVisible && (
        <div className={`loading-overlay${!loadingActive ? ' loading-hide' : ''}`}>
          <div className="loading-box">
            <img src={logo} alt="Loading" className="loading-spin" />
            <div className="loading-title">Loading Game...</div>
            <div className="loading-bar" aria-hidden>
              <div
                className={`loading-bar-progress${runProgress ? ' run' : ''}`}
                style={{ transitionDuration: `1400ms` }}
                onTransitionEnd={handleProgressDone}
              />
            </div>
          </div>
        </div>
      )}

      {renderScreen()}

      {/* Tombol Lencana (kapan saja selain lobby) */}
      {screen !== 'lobby' && (
        <button
          onClick={() => { setPendingBadgeKey(null); setShowBadges(true); }}
          style={{
            position: 'fixed',
            top: 18,
            left: 'calc(24px + clamp(42px, 7vw, 72px) + 12px)',
            zIndex: 9999,
            padding: '10px 14px',
            borderRadius: 12,
            border: '1px solid #e5e7eb',
            background: '#ffffffcc',
            backdropFilter: 'blur(2px)',
            cursor: 'pointer',
            fontWeight: 800,
            color: '#0f172a',
            boxShadow: '0 4px 12px rgba(0,0,0,.12)'
          }}
          title="Lihat Lencana"
        >
          Lencana
        </button>
      )}

      {/* Overlay Lencana */}
      {showBadges && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(2,6,23,.55)', backdropFilter: 'blur(2px)', zIndex: 10000, overflow: 'auto' }}>
          <div style={{ maxWidth: 1040, margin: '24px auto' }}>
            <LencanaMenu
              pendingBadgeKey={pendingBadgeKey}
              onBack={() => {
                const hadPending = !!pendingBadgeKey;
                setShowBadges(false);
                setPendingBadgeKey(null);
                if (hadPending) goToCraft();
              }}
              onClaimed={() => {
                const hadPending = !!pendingBadgeKey;
                setShowBadges(false);
                setPendingBadgeKey(null);
                if (hadPending) goToCraft();
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default App;