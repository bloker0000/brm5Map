import { useState, useEffect, useRef } from 'react';
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

const MIN_STAGE_DURATION = 500;

interface LoadingStage {
  name: string;
  progress: number;
}

const LOADING_STAGES: LoadingStage[] = [
  { name: 'INITIALIZING...', progress: 10 },
  { name: 'LOADING MAP DATA...', progress: 40 },
  { name: 'LOADING ASSETS...', progress: 70 },
  { name: 'FINALIZING...', progress: 90 },
  { name: 'READY', progress: 100 },
];

export function Preloader({ onLoaded }: PreloaderProps) {
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState(LOADING_STAGES[0].name);
  const [currentBgIndex, setCurrentBgIndex] = useState(0);
  const [nextBgIndex, setNextBgIndex] = useState(1);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const stageStartTimeRef = useRef<number>(Date.now());

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

  const advanceStage = async (stageIndex: number) => {
    const stage = LOADING_STAGES[stageIndex];
    const elapsed = Date.now() - stageStartTimeRef.current;
    const remainingTime = Math.max(0, MIN_STAGE_DURATION - elapsed);
    
    if (remainingTime > 0) {
      await new Promise(resolve => setTimeout(resolve, remainingTime));
    }
    
    stageStartTimeRef.current = Date.now();
    setProgress(stage.progress);
    setStatusText(stage.name);
  };

  useEffect(() => {
    const loadAssets = async () => {
      stageStartTimeRef.current = Date.now();
      await advanceStage(0);

      const mapImage = new Image();
      const svgLoadPromise = new Promise<void>((resolve, reject) => {
        mapImage.onload = () => resolve();
        mapImage.onerror = () => reject(new Error('Failed to load map'));
        mapImage.src = '/Brm5Map.svg';
      });

      await advanceStage(1);

      try {
        await svgLoadPromise;
        await advanceStage(2);

        const logoImage = new Image();
        logoImage.src = '/logos/logoyellow.svg';
        await advanceStage(3);

        await advanceStage(4);
        
        await new Promise(resolve => setTimeout(resolve, 300));
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
          <img 
            src="/logos/logoyellow.svg" 
            alt="BRMap5" 
            className="preloader-logo-image"
          />
        </div>
        
        <div className="preloader-bar-container">
          <div className="preloader-bar" style={{ width: `${progress}%` }} />
        </div>
        <div className="preloader-status">
          {statusText}
        </div>
      </div>
    </div>
  );
}
