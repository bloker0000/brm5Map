import { useState, useEffect } from 'react';
import './Preloader.css';

interface PreloaderProps {
  onLoaded: () => void;
}

const BG_IMAGES = [
  '/BG/BG1.jpeg',
  '/BG/BG2.png',
  '/BG/BG3.png',
  '/BG/BG4.png',
  '/BG/BG5.jpg',
  '/BG/BG6.png',
  '/BG/BG7.jpeg',
  '/BG/BG8.png',
  '/BG/BG9.png',
  '/BG/BG10.png',
  '/BG/BG11.png',
  '/BG/BG12.png',
  '/BG/BG13.png',
  '/BG/BG14.png',
];

export function Preloader({ onLoaded }: PreloaderProps) {
  const [progress, setProgress] = useState(0);
  const [currentBgIndex, setCurrentBgIndex] = useState(0);
  const [nextBgIndex, setNextBgIndex] = useState(1);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    const randomStart = Math.floor(Math.random() * BG_IMAGES.length);
    setCurrentBgIndex(randomStart);
    setNextBgIndex((randomStart + 1) % BG_IMAGES.length);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentBgIndex(nextBgIndex);
        setNextBgIndex((prev) => (prev + 1) % BG_IMAGES.length);
        setIsTransitioning(false);
      }, 1000);
    }, 4000);

    return () => clearInterval(interval);
  }, [nextBgIndex]);

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

        await new Promise(resolve => setTimeout(resolve, 500));
        setProgress(100);

        await new Promise(resolve => setTimeout(resolve, 400));
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
      <div 
        className="preloader-bg current"
        style={{ backgroundImage: `url(${BG_IMAGES[currentBgIndex]})` }}
      />
      <div 
        className={`preloader-bg next ${isTransitioning ? 'visible' : ''}`}
        style={{ backgroundImage: `url(${BG_IMAGES[nextBgIndex]})` }}
      />
      <div className="preloader-overlay" />
      
      <div className="preloader-content">
        <div className="preloader-logo">
          <div className="preloader-title">BLACK HAWK</div>
          <div className="preloader-subtitle">RESCUE MISSION 5</div>
        </div>
        
        <div className="preloader-bar-container">
          <div className="preloader-bar" style={{ width: `${progress}%` }} />
        </div>
        <div className="preloader-status">
          {progress < 100 ? 'LOADING MAP DATA...' : 'INITIALIZING...'}
        </div>
      </div>
    </div>
  );
}
