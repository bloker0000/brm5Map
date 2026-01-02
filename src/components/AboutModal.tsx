import { useState, useEffect } from 'react';
import { useVisitorCount } from '../hooks/useVisitorCount';
import { ChangelogModal } from './ChangelogModal';
import './AboutModal.css';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AboutModal({ isOpen, onClose }: AboutModalProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isChangelogOpen, setIsChangelogOpen] = useState(false);
  const { totalVisits, yourVisitNumber, isLoading } = useVisitorCount();

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
          <h2>About BRMap5</h2>
          <button className="about-modal-close" onClick={onClose}>X</button>
        </div>
        
        <div className="about-modal-content">
          <section>
            <h3>Navigation</h3>
            <ul>
              <li><strong>Pan:</strong> Click and drag the map to move around</li>
              <li><strong>Zoom:</strong> Use the scroll wheel or the +/- buttons</li>
              <li><strong>Rotate:</strong> Right-click and drag left/right, or drag the compass</li>
              <li><strong>Reset Position:</strong> Click the crosshair button to center the map</li>
              <li><strong>Reset Rotation:</strong> Click the rotation arrow button to reset rotation</li>
            </ul>
          </section>

          <section>
            <h3>Locations</h3>
            <ul>
              <li><strong>Browse:</strong> Use the Locations tab to see all available pins</li>
              <li><strong>Search:</strong> Type in the search bar to find specific locations</li>
              <li><strong>Filter:</strong> Use Categories to filter by location type</li>
              <li><strong>Select:</strong> Click on a pin or list item to view details</li>
              <li><strong>Un-Select:</strong> Click on a selected item to deselect, or use Clear button</li>
              <li><strong>Multi-select:</strong> Hold Ctrl/Cmd while clicking to select multiple</li>
            </ul>
          </section>

          <section>
            <h3>Images</h3>
            <ul>
              <li><strong>Preview:</strong> Hover over a pin to see image slideshow (auto-cycles)</li>
              <li><strong>Expand:</strong> Click any image to open fullscreen lightbox</li>
              <li><strong>Zoom:</strong> Use scroll wheel, +/- buttons, or +/- keys to zoom (up to 5x)</li>
              <li><strong>Pan:</strong> Click and drag when zoomed to move around</li>
              <li><strong>Navigate:</strong> Use arrow keys or thumbnails to browse images</li>
              <li><strong>Shortcuts:</strong> Press 0 to reset zoom, Escape to close</li>
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
            <p>Help is always welcome, send me a DM on discord if you want to.</p>
          </section>

          <section className="about-visits">
            <h3>Site Stats</h3>
            {isLoading ? (
              <p>Loading visitor stats...</p>
            ) : (
              <div className="visit-stats">
                <div className="visit-stat">
                  <span className="visit-label">Total Visits</span>
                  <span className="visit-number">{totalVisits?.toLocaleString() ?? '—'}</span>
                </div>
                <div className="visit-stat">
                  <span className="visit-label">You Are Visitor</span>
                  <span className="visit-number">#{yourVisitNumber?.toLocaleString() ?? '—'}</span>
                </div>
              </div>
            )}
            <button 
              className="about-changelog-btn"
              onClick={() => setIsChangelogOpen(true)}
            >
              View Changelog
            </button>
          </section>
        </div>
      </div>
      <ChangelogModal 
        isOpen={isChangelogOpen} 
        onClose={() => setIsChangelogOpen(false)} 
      />
    </div>
  );
}