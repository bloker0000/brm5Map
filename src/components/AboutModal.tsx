import { useState, useEffect } from 'react';
import './AboutModal.css';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AboutModal({ isOpen, onClose }: AboutModalProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
    }
  }, [isOpen]);

  const handleAnimationEnd = () => {
    if (!isOpen) {
      setIsVisible(false);
    }
  };

  if (!isVisible) return null;

  return (
    <div 
      className={`about-modal-overlay ${isOpen ? 'open' : 'closing'}`}
      onClick={onClose}
      onAnimationEnd={handleAnimationEnd}
    >
      <div className="about-modal" onClick={e => e.stopPropagation()}>
        <div className="about-modal-header">
          <h2>About BRM5 Map</h2>
          <button className="about-modal-close" onClick={onClose}>X</button>
        </div>
        
        <div className="about-modal-content">
          <section>
            <h3>Navigation</h3>
            <ul>
              <li><strong>Pan:</strong> Click and drag the map to move around</li>
              <li><strong>Zoom:</strong> Use the scroll wheel or the +/- buttons</li>
              <li><strong>Rotate:</strong> Right-click and drag left/right, or drag the compass</li>
              <li><strong>Reset:</strong> Click the reset button to center the map and reset rotation</li>
            </ul>
          </section>

          <section>
            <h3>Locations</h3>
            <ul>
              <li><strong>Browse:</strong> Use the Locations tab to see all available pins</li>
              <li><strong>Search:</strong> Type in the search bar to find specific locations</li>
              <li><strong>Filter:</strong> Use Categories to filter by location type</li>
              <li><strong>Select:</strong> Click on a pin or list item to view details</li>
              <li><strong>Un-Select:</strong> Ctrl/Cmd click on a selected pin or list item to un-select</li>
              <li><strong>Multi-select:</strong> Hold Ctrl/Cmd while clicking to select multiple</li>
            </ul>
          </section>

          <section>
            <h3>Display</h3>
            <ul>
              <li><strong>Toggle Pins:</strong> Show or hide all map pins</li>
              <li><strong>Background:</strong> Refresh the page for a new background image</li>
              <li><strong>Compass:</strong> Shows the current map orientation</li>
            </ul>
          </section>

          <section className="about-credits">
            <h3>Credits</h3>
            <p>Map and website made by Multyply.</p>
            <p>Background artwork by many talented artists. See footer for current artist.</p>
          </section>
        </div>
      </div>
    </div>
  );
}