/**
 * 每像素对应分钟数 hook
 * 根据窗口宽度自动调整日历网格的缩放比例
 */
import { useState, useEffect } from 'react';

export function usePixelPerMin() {
  const [pixelPerMin, setPixelPerMin] = useState(0.8);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 480) {
        setPixelPerMin(35 / 60);
      } else if (window.innerWidth <= 768) {
        setPixelPerMin(40 / 60);
      } else {
        setPixelPerMin(0.8);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return pixelPerMin;
}
