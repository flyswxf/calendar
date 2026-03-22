import React from 'react';
import { BASE_START_MIN, END_MIN, fmtHM } from '../../utils/time';
import { usePixelPerMin } from '../../hooks/usePixelPerMin';

export const TimeGrid: React.FC = () => {
  const pixelPerMin = usePixelPerMin();
  const totalHeight = (END_MIN - BASE_START_MIN) * pixelPerMin;

  const times = [];
  for (let m = BASE_START_MIN; m <= END_MIN; m += 60) {
    times.push(m);
  }

  return (
    <div className="time-col">
      <div className="day-header" style={{ visibility: 'hidden', borderBottom: '1px solid transparent' }}>
        周一<br />
        <span className="date-label">01</span>
      </div>
      <div style={{ height: totalHeight, position: 'relative' }}>
        {times.map(t => (
          <div 
            key={t} 
            className="time-label"
            style={{ 
              position: 'absolute', 
              top: (t - BASE_START_MIN) * pixelPerMin,
              transform: 'translateY(-50%)'
            }}
          >
            {fmtHM(t)}
          </div>
        ))}
      </div>
    </div>
  );
};
