import { useState, useRef, useId } from 'react';
import { useVisitorCount } from '../hooks/useVisitorCount';
import { useDialog } from '../hooks/useDialog';
import './AboutModal.css';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenChangelog: () => void;
}

export function AboutModal({ isOpen, onClose, onOpenChangelog }: AboutModalProps) {
  const [isVisible, setIsVisible] = useState(isOpen);
  const { totalVisits, yourVisitNumber, isLoading } = useVisitorCount(isOpen);
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
      className={`brm-modal-overlay brm-scrim ${isOpen ? 'open' : 'closing'}`}
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
          <h2 className="brm-modal-title" id={titleId}>About BRMap5</h2>
          <button className="brm-btn brm-modal-close" onClick={onClose} aria-label="Close">X</button>
        </div>

        <div className="brm-modal-body about-modal-content">
          <section>
            <h3 className="brm-section-title">Navigation</h3>
            <ul className="brm-bullets">
              <li><strong>Pan:</strong> Drag the map with the mouse or one finger</li>
              <li><strong>Zoom:</strong> Scroll wheel, pinch, double-click or double-tap, or the +/- buttons</li>
              <li><strong>Rotate:</strong> Right-click and drag left/right, twist with two fingers, or drag the compass</li>
              <li><strong>Keyboard:</strong> Click the map or Tab to it, then arrow keys pan, + and - zoom, Q and E rotate, 0 resets the view. Tab also steps through the markers</li>
              <li><strong>Reset Position:</strong> Click the crosshair button to center the map</li>
              <li><strong>Reset Rotation:</strong> Click the rotation arrow button to reset rotation</li>
            </ul>
          </section>

          <section>
            <h3 className="brm-section-title">Locations</h3>
            <ul className="brm-bullets">
              <li><strong>Browse:</strong> Use the Locations tab to see all available pins</li>
              <li><strong>Search:</strong> Type in the search box in the Locations tab to find specific locations</li>
              <li><strong>Filter:</strong> Use Categories to filter by location type</li>
              <li><strong>Select:</strong> Click on a pin or list item to view details</li>
              <li><strong>Un-Select:</strong> Click on a selected item to deselect, or use Clear button</li>
              <li><strong>Multi-select:</strong> Hold Ctrl/Cmd while clicking to select multiple</li>
            </ul>
          </section>

          <section>
            <h3 className="brm-section-title">Images</h3>
            <ul className="brm-bullets">
              <li><strong>Preview:</strong> Hover over a pin to see image slideshow (auto-cycles)</li>
              <li><strong>Expand:</strong> Click any image to open fullscreen lightbox</li>
              <li><strong>Zoom:</strong> Scroll wheel, pinch, +/- buttons, or +/- keys (up to 5x)</li>
              <li><strong>Pan:</strong> Drag when zoomed to move around</li>
              <li><strong>Navigate:</strong> Swipe, use the arrow keys, or pick a thumbnail</li>
              <li><strong>Shortcuts:</strong> Press 0 to reset zoom, Escape to close</li>
            </ul>
          </section>

          <section>
            <h3 className="brm-section-title">Display</h3>
            <ul className="brm-bullets">
              <li><strong>Grid:</strong> The gold numbers along the top and left edge are metres, like on the game's own map. The Grid readout shows the spot under the mouse</li>
              <li><strong>Toggle Pins:</strong> Show or hide all map pins</li>
              <li><strong>Toggle Sidebar:</strong> Use the arrow button on the left edge to hide/show the sidebar</li>
              <li><strong>Toggle Compass:</strong> Show or hide the compass under Display in the sidebar</li>
              <li><strong>Compass:</strong> Drag it to turn the map</li>
              <li><strong>Artwork:</strong> A different piece every visit, on the loading screen and in the Mission Library</li>
            </ul>
          </section>

          <section>
            <h3 className="brm-section-title">Mission Library</h3>
            <ul className="brm-bullets">
              <li><strong>Open:</strong> Click Missions at the top</li>
              <li><strong>Browse:</strong> Missions are grouped by who gives them</li>
              <li><strong>Filter:</strong> Narrow by difficulty, gasmask, raids, or unmarked objectives</li>
              <li><strong>Variants:</strong> Some missions roll a random spawn point, every candidate is listed</li>
              <li><strong>Unmarked:</strong> Objectives the game gives no waypoint for are shown as in-game screenshots</li>
              <li><strong>Technical:</strong> Switch any mission to the raw task list from the game files</li>
              <li><strong>Share:</strong> Each mission has its own link</li>
            </ul>
          </section>

          <section>
            <h3 className="brm-section-title">FAQ</h3>
            <div className="faq-item">
              <p className="faq-question"><strong>Q: What are the green and yellow shapes on the map?</strong></p>
              <p className="faq-answer">A: Green shapes represent military tents, and yellow shapes represent medical or quarantine tents.</p>
            </div>
            <div className="faq-item">
              <p className="faq-question"><strong>Q: What are the yellow marked areas?</strong></p>
              <p className="faq-answer">A: They indicate quarantine zones.</p>
            </div>
            <div className="faq-item">
              <p className="faq-question"><strong>Q: What are the red rectangles?</strong></p>
              <p className="faq-answer">A: They are reinforced walls used as map borders or to separate quarantine zones.</p>
            </div>
          </section>

          <section>
            <h3 className="brm-section-title">Credits</h3>
            <p>Map and website made by Multyply</p>
            <p>Background artwork by many talented artists, the current one is credited on the loading screen and in the Mission Library.</p>
            <p>Help is always welcome. Send me a DM on Discord at <span className="brm-handle">.multyply</span> if you want to contribute.</p>
          </section>

          <section>
            <h3 className="brm-section-title">Contributors</h3>
            <p><a href="https://github.com/T0TR0X" target="_blank" rel="noopener noreferrer">TotroX</a>: Location data, descriptions, images, and icon improvements <span className="about-aside">(Discord: .totrox)</span></p>
            <p><a href="https://roblox-blackhawk-rescue-mission-5.fandom.com/wiki/User:Nintendoboi2" target="_blank" rel="noopener noreferrer">Nintendoboi2</a>: Location images</p>
          </section>

          <section>
            <h3 className="brm-section-title">Site Stats</h3>
            <div className="brm-row about-stat">
              <span className="brm-row-label">Total Visits</span>
              <span className="about-stat-value tabular">
                {isLoading ? '...' : totalVisits?.toLocaleString() ?? '-'}
              </span>
            </div>
            <div className="brm-row about-stat">
              <span className="brm-row-label">You Are Visitor</span>
              <span className="about-stat-value tabular">
                {isLoading ? '...' : `#${yourVisitNumber?.toLocaleString() ?? '-'}`}
              </span>
            </div>
            <p className="about-small">
              <a href="https://github.com/bloker0000/brm5Map" target="_blank" rel="noopener noreferrer">Source code</a> available on GitHub. Hosted on Vercel.
            </p>
          </section>

          <button className="brm-btn about-changelog-btn" onClick={onOpenChangelog}>
            View Changelog
          </button>
        </div>
      </div>
    </div>
  );
}
