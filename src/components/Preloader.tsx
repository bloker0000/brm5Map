import { useState, useEffect } from 'react';
import './Preloader.css';

interface PreloaderProps {
  onLoaded: () => void;
}

export function Preloader({ onLoaded }: PreloaderProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const loadAssets = async () => {
      setProgress(10);

      const mapImage = new Image();
      const svgLoaded = new Promise<void>((resolve, reject) => {
        mapImage.onload = () => resolve();
        mapImage.onerror = () => reject(new Error('Failed to load map'));
        mapImage.src = '/Brm5Map.svg';
      });

      try {
        await svgLoaded;
        setProgress(80);

        await new Promise(resolve => setTimeout(resolve, 300));
        setProgress(100);

        await new Promise(resolve => setTimeout(resolve, 200));
        onLoaded();
      } catch (error) {
        console.error('Failed to load assets:', error);
        setTimeout(() => loadAssets(), 1000);
      }
    };

    loadAssets();
  }, [onLoaded]);

  return (
    <div className="preloader">
      <div className="preloader-bar" style={{ width: `${progress}%` }} />
    </div>
  );
}
