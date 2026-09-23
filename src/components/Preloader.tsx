import { useState, useEffect } from 'react';
import { BG_IMAGES } from '../data/backgrounds';
import './Preloader.css';

interface PreloaderProps {
  bgIndex: number;
  onLoaded: () => void;
  isFadingOut?: boolean;
  onFadeComplete?: () => void;
}

// long enough for each status line to register, short enough not to be a wait
const STEP = 140;
// the artwork is decoration, a slow one should not hold the map back
const BG_WAIT = 1500;
const MAX_RETRY_DELAY = 8000;

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

function loadImage(src: string) {
  return new Promise<void>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = () => reject(new Error(`Failed to load ${src}`));
    img.src = src;
  });
}

export function Preloader({ bgIndex, onLoaded, isFadingOut = false, onFadeComplete }: PreloaderProps) {
  const [progress, setProgress] = useState(10);
  const [statusText, setStatusText] = useState('INITIALIZING...');
  const [bgReady, setBgReady] = useState(false);
  const background = BG_IMAGES[bgIndex];

  // the artwork fading in bubbles up here too, only the preloader's own fade counts
  const handleAnimationEnd = (e: React.AnimationEvent) => {
    if (e.target !== e.currentTarget) return;
    if (isFadingOut && onFadeComplete) {
      onFadeComplete();
    }
  };

  useEffect(() => {
    let cancelled = false;
    const backgroundLoaded = loadImage(background).then(
      () => { if (!cancelled) setBgReady(true); },
      () => {}
    );

    const run = async () => {
      await delay(STEP);
      if (cancelled) return;
      setStatusText('LOADING MAP DATA...');
      setProgress(30);

      let retryDelay = 1000;
      for (;;) {
        try {
          await loadImage('/Brm5Map.svg');
          break;
        } catch (error) {
          if (cancelled) return;
          console.error(error);
          setStatusText('CONNECTION PROBLEM, RETRYING...');
          await delay(retryDelay);
          retryDelay = Math.min(retryDelay * 2, MAX_RETRY_DELAY);
          if (cancelled) return;
          setStatusText('LOADING MAP DATA...');
        }
      }
      if (cancelled) return;

      setStatusText('LOADING ASSETS...');
      setProgress(70);
      await Promise.race([backgroundLoaded, delay(BG_WAIT)]);
      if (cancelled) return;

      setStatusText('READY');
      setProgress(100);
      await delay(STEP * 2);
      if (!cancelled) onLoaded();
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [background, onLoaded]);

  return (
    <div
      className={`preloader ${isFadingOut ? 'fade-out' : ''}`}
      onAnimationEnd={handleAnimationEnd}
    >
      {bgReady && (
        <div
          className="preloader-bg"
          style={{ backgroundImage: `url(${background})` }}
        />
      )}
      <div className="preloader-overlay" />

      <div className="preloader-content">
        <img
          src="/logos/logowhite.svg"
          alt="BRMap5"
          className="preloader-logo-image"
        />
        <div className="preloader-subtitle">Operation CRYO Zombies</div>

        <div className="preloader-status" role="status">{statusText}</div>
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
