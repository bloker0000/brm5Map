import { useState, useEffect } from 'react';
import { CloseIcon } from './Icons';
import './WelcomeModal.css';

const SESSION_KEY = 'brm5_map_welcome_dismissed';

export function WelcomeModal() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const dismissed = sessionStorage.getItem(SESSION_KEY);
    if (!dismissed) {
      setIsVisible(true);
    }
  }, []);

  const handleDismiss = () => {
    sessionStorage.setItem(SESSION_KEY, 'true');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="welcome-overlay">
      <div className="welcome-modal">
        <button className="welcome-close" onClick={handleDismiss}>
          <CloseIcon size={20} />
        </button>
        
        <div className="welcome-header">
          <h2>Welcome to BRM5 Interactive Map</h2>
        </div>
        
        <div className="welcome-content">
          <p>
            This map is currently a <strong>work in progress</strong>. Some locations may be missing, incomplete, or have inaccurate information.
          </p>
          <p>
            We're actively working on improving the accuracy and adding more locations. Thank you for your patience!
          </p>
        </div>
        
        <div className="welcome-footer">
          <button className="welcome-btn" onClick={handleDismiss}>
            Got it, thanks!
          </button>
        </div>
      </div>
    </div>
  );
}