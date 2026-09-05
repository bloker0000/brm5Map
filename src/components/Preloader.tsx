import { useState, useEffect } from 'react';
import { BG_IMAGES, randomBgIndex } from '../data/backgrounds';
import './Preloader.css';

interface PreloaderProps {
  onLoaded: () => void;
  isFadingOut?: boolean;
  onFadeComplete?: () => void;
}

const getRandomDelay = () => Math.random() * (400 - 150) + 150;

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export function Preloader({ onLoaded, isFadingOut = false, onFadeComplete }: PreloaderProps) {
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('INITIALIZING...');
  const [currentBgIndex] = useState(randomBgIndex);
  const [nextBgIndex, setNextBgIndex] = useState(() => (randomBgIndex() + 1) % BG_IMAGES.length);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [bgReady, setBgReady] = useState(false);

  const handleAnimationEnd = () => {
    if (isFadingOut && onFadeComplete) {
      onFadeComplete();
    }
  };

  useEffect(() => {
    const img = new Image();
    img.onload = () => setBgReady(true);
    img.src = BG_IMAGES[currentBgIndex];
  }, [currentBgIndex]);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        setNextBgIndex((prev) => (prev + 1) % BG_IMAGES.length);
        setIsTransitioning(false);
      }, 1000);
    }, 4000);

    return () => clearInterval(interval);
  }, [nextBgIndex]);

  useEffect(() => {
    const loadAssets = async () => {
      try {
        setStatusText('INITIALIZING...');
        setProgress(10);
        await delay(getRandomDelay());

        setStatusText('LOADING MAP DATA...');
        setProgress(30);
        const mapImage = new Image();
        await new Promise<void>((resolve, reject) => {
          mapImage.onload = () => resolve();
          mapImage.onerror = () => reject(new Error('Failed to load map'));
          mapImage.src = '/Brm5Map.svg';
        });
        setProgress(50);
        await delay(getRandomDelay());

        setStatusText('LOADING ASSETS...');
        setProgress(60);
        const logoImage = new Image();
        await new Promise<void>((resolve, reject) => {
          logoImage.onload = () => resolve();
          logoImage.onerror = () => reject(new Error('Failed to load logo'));
          logoImage.src = '/logos/logowhite.svg';
        });
        setProgress(80);
        await delay(getRandomDelay());

        setStatusText('FINALIZING...');
        setProgress(90);
        await delay(getRandomDelay());

        setStatusText('READY');
        setProgress(100);
        await delay(getRandomDelay());

        onLoaded();
      } catch (error) {
        console.error('Failed to load assets:', error);
        setTimeout(() => loadAssets(), 1000);
      }
    };

    loadAssets();
  }, [onLoaded]);

  return (
    <div
      className={`preloader ${isFadingOut ? 'fade-out' : ''}`}
      onAnimationEnd={handleAnimationEnd}
    >
      {bgReady && (
        <>
          <div
            className="preloader-bg current"
            style={{ backgroundImage: `url(${BG_IMAGES[currentBgIndex]})` }}
          />
          <div
            className={`preloader-bg next ${isTransitioning ? 'visible' : ''}`}
            style={{ backgroundImage: `url(${BG_IMAGES[nextBgIndex]})` }}
          />
        </>
      )}
      <div className="preloader-overlay" />

      <div className="preloader-content">
        <img
          src="/logos/logowhite.svg"
          alt="BRMap5"
          className="preloader-logo-image"
        />
        <div className="preloader-subtitle">Operation CRYO Zombies</div>

        <div className="preloader-status">{statusText}</div>
        <div
          className="preloader-bar-container"
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Loading"
        >
          <div className="preloader-bar" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="preloader-footer">
        <span>A community project by Multyply. Map data is fan-made.</span>
        <span>Not affiliated with GameLoaded Entertainment or the PLATINUM FIVE team.</span>
      </div>
    </div>
  );
}
