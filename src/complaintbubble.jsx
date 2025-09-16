import React from 'react';

const ComplaintBubble = ({ text }) => (
  <div style={{
    position: 'absolute',
    top: -40,
    left: '50%',
    transform: 'translateX(-50%)',
    background: '#fff',
    border: '2px solid #90caf9',
    borderRadius: 16,
    padding: '8px 16px',
    boxShadow: '0 2px 8px #bbb',
    fontSize: 16,
    minWidth: 120,
    zIndex: 2
  }}>
    {text}
  </div>
);

export default ComplaintBubble; 