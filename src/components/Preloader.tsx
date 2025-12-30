import { useState, useEffect } from 'react';
import './Preloader.css';

interface PreloaderProps {
  onLoaded: () => void;
}

export function Preloader({ onLoaded }: PreloaderProps) {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('Initializing...');

  useEffect(() => {
    const loadAssets = async () => {
      setStatus('Loading map...');
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
        setStatus('Preparing interface...');

        await new Promise(resolve => setTimeout(resolve, 300));
        setProgress(100);
        setStatus('Ready!');

        await new Promise(resolve => setTimeout(resolve, 200));
        onLoaded();
      } catch (error) {
        console.error('Failed to load assets:', error);
        setStatus('Error loading assets. Retrying...');
        setTimeout(() => loadAssets(), 1000);
      }
    };

    loadAssets();
  }, [onLoaded]);

  return (
    <div className="preloader">
      <div className="preloader-content">
        <h1 className="preloader-title">BRM5 MAP</h1>
        <div className="preloader-subtitle">Blackhawk Rescue Mission 5</div>
        <div className="preloader-bar-container">
          <div className="preloader-bar" style={{ width: `${progress}%` }} />
        </div>
        <div className="preloader-status">{status}</div>
      </div>
    </div>
  );
}
