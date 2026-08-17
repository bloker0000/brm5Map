// changelog popup, also pops up on first visit and after updates

import { useState, useEffect } from 'react';
import { CHANGELOG } from '../data/changelog';
import './ChangelogModal.css';

interface ChangelogModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ChangelogModal({ isOpen, onClose }: ChangelogModalProps) {
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
      className={`changelog-modal-overlay brm-scrim ${isOpen ? 'open' : 'closing'}`}
      onClick={onClose}
      onAnimationEnd={handleAnimationEnd}
    >
      <div className="changelog-modal brm-panel-anim" onClick={e => e.stopPropagation()}>
        <div className="changelog-modal-header">
          <h2>Changelog</h2>
          <button className="changelog-modal-close" onClick={onClose}>X</button>
        </div>

        <div className="changelog-modal-content">
          <div className="changelog-note">
            <p>
              The map is finished and now gets updates now and then. Some locations
              are still missing images or details.
            </p>
            <p>
              Have screenshots or information to add? Message me on Discord at{' '}
              <span className="brm-handle">.multyply</span> — contributors are
              credited in the About panel.
            </p>
          </div>

          {CHANGELOG.map((entry) => (
            <div key={entry.version} className="changelog-entry">
              <div className="changelog-entry-header">
                <span className="changelog-version">v{entry.version}</span>
                <span className="changelog-date">{entry.date}</span>
              </div>
              <ul className="changelog-changes">
                {entry.changes.map((change, index) => (
                  <li key={index}>{change}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
