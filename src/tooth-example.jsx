// ===== CONTOH PENGGUNAAN GAMBAR KUSTOM UNTUK GIGI =====
// File ini adalah contoh implementasi lengkap

import React from 'react';

// Import gambar gigi kustom (sesuaikan dengan nama file Anda)
import normalToothImage from './assets/normal-tooth.png';
import dirtyToothImage from './assets/dirty-tooth.png';
import cavityToothImage from './assets/cavity-tooth.png';
import filledToothImage from './assets/filled-tooth.png';
import extractToothImage from './assets/extract-tooth.png';
import extractedToothImage from './assets/extracted-tooth.png';

const toothStyle = {
  width: 40,
  height: 48,
  borderRadius: '0 0 20px 20px / 0 0 32px 32px',
  background: '#fff',
  border: '2px solid #bbb',
  margin: 4,
  display: 'inline-block',
  position: 'relative',
};

const ToothWithCustomImages = ({ type = 'normal', rotate = 0 }) => {
  let extra = null;
  let toothImage = null;
  
  // Pilih gambar gigi berdasarkan tipe
  switch(type) {
    case 'normal':
      toothImage = normalToothImage;
      break;
    case 'dirty':
      toothImage = dirtyToothImage;
      // Tambahan overlay untuk karang gigi (opsional)
      extra = <div style={{ position: 'absolute', bottom: 8, left: 8, width: 20, height: 10, background: '#d4a017', borderRadius: 8, opacity: 0.7 }} />;
      break;
    case 'cavity':
      toothImage = cavityToothImage;
      break;
    case 'filled':
      toothImage = filledToothImage;
      break;
    case 'extract':
      toothImage = extractToothImage;
      break;
    case 'extracted':
      toothImage = extractedToothImage;
      break;
    case 'behel':
      extra = <div style={{ position: 'absolute', top: 18, left: 8, width: 24, height: 8, background: '#90caf9', borderRadius: 4, border: '1px solid #1976d2' }} />;
      break;
    case 'extra':
      extra = <div style={{ position: 'absolute', right: -18, top: 0 }}><ToothWithCustomImages type="normal" /></div>;
      break;
  }

  // Render dengan gambar kustom
  if (toothImage) {
    return (
      <div style={{ position: 'relative', transform: `rotate(${rotate}deg)`, transition: 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)', margin: 4 }}>
        <img 
          src={toothImage} 
          alt={`Gigi ${type}`} 
          style={{ 
            width: 40, 
            height: 48, 
            display: 'inline-block',
            position: 'relative'
          }} 
        />
        {extra}
      </div>
    );
  }

  // Fallback ke style default jika tidak ada gambar
  return (
    <div style={{ ...toothStyle, position: 'relative', transform: `rotate(${rotate}deg)`, transition: 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)' }}>
      {extra}
    </div>
  );
};

export default ToothWithCustomImages; 