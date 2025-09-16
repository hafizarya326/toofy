// import React from 'react';
// import ComplaintBubble from './complaintbubble';

// const faceByMood = {
//   normal: '😐',
//   happy: '😄',
//   pain: '😣',
//   relieved: '😊',
// };

// const Patient = ({ mood = 'normal', complaint }) => (
//   <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
//     {complaint && <ComplaintBubble text={complaint} />}
//     <div style={{ width: 80, height: 80, background: '#fff', borderRadius: '50%', border: '2px solid #bbb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40 }}>
//       {faceByMood[mood]}
//     </div>
//     <div style={{ width: 60, height: 20, background: '#b3e5fc', borderRadius: 8, marginTop: 8 }}></div>
//   </div>
// );

// export default Patient;