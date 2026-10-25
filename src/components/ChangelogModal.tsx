// changelog popup, also pops up for returning visitors after an update

import { useState, useRef, useId } from 'react';
import { CHANGELOG } from '../data/changelog';
import { useDialog } from '../hooks/useDialog';
import './ChangelogModal.css';

interface ChangelogModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ChangelogModal({ isOpen, onClose }: ChangelogModalProps) {
  const [isVisible, setIsVisible] = useState(isOpen);
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  if (isOpen && !isVisible) setIsVisible(true);

  useDialog(dialogRef, isOpen && isVisible);

  const handleAnimationEnd = () => {
    if (!isOpen) {
      setIsVisible(false);
    }
  };

  if (!isVisible) return null;

  return (
    <div
      className={`brm-modal-overlay changelog-modal-overlay brm-scrim ${isOpen ? 'open' : 'closing'}`}
      onClick={onClose}
      onAnimationEnd={handleAnimationEnd}
    >
      <div
        ref={dialogRef}
        className="brm-modal brm-panel-anim"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onClick={e => e.stopPropagation()}
      >
        <div className="brm-modal-head">
          <h2 className="brm-modal-title" id={titleId}>Changelog</h2>
          <button className="brm-btn brm-modal-close" onClick={onClose} aria-label="Close">X</button>
        </div>

        <div className="brm-modal-body">
          <div className="changelog-note">
            <p>
              The map is finished and now gets updates now and then. Some locations
              are still missing images or details.
            </p>
            <p>
              Have screenshots or information to add? Message me on Discord at{' '}
              <span className="brm-handle">.multyply</span>, contributors are
              credited in the About panel.
            </p>
          </div>

          {CHANGELOG.map((entry) => (
            <section key={entry.version} className="changelog-entry">
              <h3 className="brm-section-title">
                v{entry.version}
                <span className="brm-section-meta tabular">{entry.date}</span>
              </h3>
              <ul className="brm-bullets">
                {entry.changes.map((change, index) => (
                  <li key={index}>{change}</li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
