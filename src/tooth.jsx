import React from 'react';

// ===== CARA MENGGUNAKAN GAMBAR KUSTOM =====
// 1. Letakkan gambar gigi Anda di folder src/assets/
// 2. Uncomment dan sesuaikan import di bawah ini:
// import normalToothImage from './assets/normal-tooth.png';
// import dirtyToothImage from './assets/dirty-tooth.png';
// import cavityToothImage from './assets/cavity-tooth.png';
// import filledToothImage from './assets/filled-tooth.png';
// import extractToothImage from './assets/extract-tooth.png';
// import extractedToothImage from './assets/extracted-tooth.png';

// 3. Uncomment baris yang sesuai di dalam fungsi Tooth

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

const Tooth = ({ type = 'normal', rotate = 0 }) => {
  let extra = null;
  
  // Pilih gambar gigi berdasarkan tipe
  let toothImage = null;
  
  switch(type) {
    case 'normal':
      // toothImage = normalToothImage; // Uncomment jika ada gambar
      break;
    case 'dirty':
      // toothImage = dirtyToothImage; // Uncomment jika ada gambar
      extra = <div style={{ position: 'absolute', bottom: 8, left: 8, width: 20, height: 10, background: '#d4a017', borderRadius: 8, opacity: 0.7 }} />;
      break;
    case 'cavity':
      // toothImage = cavityToothImage; // Uncomment jika ada gambar
      extra = <div style={{ position: 'absolute', top: 12, left: 16, width: 10, height: 10, background: '#5d4037', borderRadius: '50%' }} />;
      break;
    case 'filled':
      // toothImage = filledToothImage; // Uncomment jika ada gambar
      extra = <div style={{ position: 'absolute', top: 12, left: 16, width: 10, height: 10, background: '#ffd700', borderRadius: '50%' }} />;
      break;
    case 'extract':
      // toothImage = extractToothImage; // Uncomment jika ada gambar
      extra = <div style={{ position: 'absolute', top: 8, left: 12, width: 16, height: 16, background: '#8b4513', borderRadius: '50%', border: '2px solid #654321' }} />;
      break;
    case 'extracted':
      // toothImage = extractedToothImage; // Uncomment jika ada gambar
      extra = <div style={{ position: 'absolute', top: 8, left: 12, width: 16, height: 16, background: '#fff', borderRadius: '50%', border: '2px solid #ddd', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>🧻</div>;
      break;
    case 'behel':
      extra = <div style={{ position: 'absolute', top: 18, left: 8, width: 24, height: 8, background: '#90caf9', borderRadius: 4, border: '1px solid #1976d2' }} />;
      break;
    case 'extra':
      extra = <div style={{ position: 'absolute', right: -18, top: 0 }}><Tooth type="normal" /></div>;
      break;
  }

  // Jika menggunakan gambar kustom
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

  // Jika tidak menggunakan gambar kustom, gunakan style default
  return (
    <div style={{ ...toothStyle, position: 'relative', transform: `rotate(${rotate}deg)`, transition: 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)' }}>
      {extra}
    </div>
  );
};

export default Tooth; 