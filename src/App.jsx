import React, { useRef, useState, useEffect } from 'react';
import Lobby from './lobby';
import HospitalRoom from './hospitalroom';
import TeethCloseup from './teethcloseup';
import CraftingLab from './CraftingLab';

import LencanaMenu, { BADGE_DEFS } from './lencana';   // komponen & defs
import lencanaIcon from './assets/lencana.png';        // ikon tombol bulat

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
  const [muted, setMuted] = useState(() => localStorage.getItem('muted') === '1');
  const [soundStarted, setSoundStarted] = useState(false);
  const audioRef = useRef(null);

  useEffect(() => { localStorage.setItem('muted', muted ? '1' : '0'); }, [muted]);

  useEffect(() => {
    const resetProgressOnUnload = () => { try { localStorage.removeItem('game_badges_unlocked_v1'); } catch (_) {} };
    window.addEventListener('beforeunload', resetProgressOnUnload);
    return () => window.removeEventListener('beforeunload', resetProgressOnUnload);
  }, []);

  const isPlaying = (a) => a && !a.paused && !a.ended && a.currentTime > 0;

  const ensureAudioPlaying = () => {
    const a = audioRef.current;
    if (!a) return;
    a.muted = muted;
    if (muted) { a.pause(); return; }
    if (isPlaying(a)) { if (!soundStarted) setSoundStarted(true); return; }
    const tryPlay = () => a.play().then(() => setSoundStarted(true));
    tryPlay().catch(() => {
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

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    a.loop = true; a.muted = muted; a.volume = 0.6;
    ensureAudioPlaying();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    a.muted = muted;
    if (muted) a.pause(); else ensureAudioPlaying();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [muted]);

  // --- Routing & loading ---
  const handleStart = () => {
    resetGameState();
    setLoadingVisible(true);
    setLoadingActive(true);
    setScreen('room');
    ensureAudioPlaying();
    requestAnimationFrame(() => { requestAnimationFrame(() => setRunProgress(true)); });
  };

  const handleProgressDone = (e) => {
    if (e.propertyName !== 'transform') return;
    setLoadingActive(false);
    setTimeout(() => { setLoadingVisible(false); setRunProgress(false); }, 400);
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
    if (screen === 'closeup') { setScreen('room'); return; }
    if (screen === 'craft') { setScreen('closeup'); return; }
    if (screen === 'room') { resetGameState(); setScreen('lobby'); return; }
    resetGameState(); setScreen('lobby');
  };

  const goToCraft = () => setScreen('craft');
  const finishCraft = () => {
    if (selectedPatient != null) {
      setCraftDone((prev) => { const next = [...prev]; next[selectedPatient] = true; return next; });
    }
    setSelectedPatient(null);
    setScreen('room');
  };

  // Saat perawatan selesai di closeup
  const handleTreatmentComplete = (idx) => {
    setTreatmentDone((prev) => { const next = [...prev]; next[idx] = true; return next; });
    const key = `pasien${idx + 1}_selesai`;
    if (BADGE_DEFS[key]) {
      setPendingBadgeKey(key);
      setShowBadges(true);
    } else {
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
      <audio ref={audioRef} src={backsound} />

      {/* Tombol Sound */}
      <button
        className={`icon-btn icon-left${muted ? ' muted' : ''}`}
        onClick={handleSoundClick}
        style={{ position: 'fixed', top: 18, left: 24, zIndex: 9999 }}
      >
        <img src={buttonSound} alt="Sound" draggable="false" />
      </button>

      {/* Tombol Back */}
      {screen !== 'lobby' && (
        <button
          className="icon-btn icon-right"
          onClick={handleBack}
          style={{ position: 'fixed', top: 18, right: 24, zIndex: 9999 }}
        >
          <img src={buttonBack} alt="Back" draggable="false" />
        </button>
      )}

      {/* Tombol Lencana (bulat, tanpa card) */}
      {screen !== 'lobby' && (
        <button
          onClick={() => { setPendingBadgeKey(null); setShowBadges(true); }}
          style={{
            position: 'fixed',
            top: 18,
            left: 'calc(24px + clamp(42px, 7vw, 72px) + 12px)', // di kanan tombol sound
            zIndex: 9999,
            width: 'clamp(42px, 7vw, 72px)',
            height: 'clamp(42px, 7vw, 72px)',
            padding: 0,
            border: 'none',
            borderRadius: '50%',
            background: 'transparent', // HILANGKAN CARD
            cursor: 'pointer',
          }}
          title="Lihat Lencana"
          aria-label="Lihat Lencana"
        >
          <img
            src={lencanaIcon}
            alt=""
            aria-hidden="true"
            style={{ width: '100%', height: '100%', display: 'block', objectFit: 'contain', pointerEvents: 'none', userSelect: 'none' }}
            draggable="false"
          />
        </button>
      )}

      {/* Loading */}
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
                if (hadPending) setScreen('craft');
              }}
              onClaimed={() => {
                const hadPending = !!pendingBadgeKey;
                setShowBadges(false);
                setPendingBadgeKey(null);
                if (hadPending) setScreen('craft');
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
