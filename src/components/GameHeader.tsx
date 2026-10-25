import './GameHeader.css';

export type Page = 'map' | 'missions';

interface GameHeaderProps {
  page: Page;
  stat: string;
  isAboutOpen: boolean;
  onNavigate: (page: Page) => void;
  onAbout: () => void;
}

// the game's pause menu header: gold logo, a two line readout, the page tabs under it
export function GameHeader({ page, stat, isAboutOpen, onNavigate, onAbout }: GameHeaderProps) {
  const pageTab = (target: Page, label: string) => (
    <button
      className={`brm-btn${page === target && !isAboutOpen ? ' active' : ''}`}
      aria-current={page === target ? 'page' : undefined}
      onClick={() => onNavigate(target)}
    >
      {label}
    </button>
  );

  return (
    <header className="game-header">
      <div className="game-header-bar">
        <h1 className="game-header-brand">
          <span className="game-header-logo" role="img" aria-label="BRMap5" />
        </h1>
        <div className="game-header-readout">
          <span className="game-header-op">Operation CRYO Zombies</span>
          <span className="game-header-stat tabular">{stat}</span>
        </div>
      </div>
      <nav className="game-header-tabs" aria-label="Pages">
        {pageTab('map', 'Map')}
        {pageTab('missions', 'Missions')}
        <button
          className={`brm-btn${isAboutOpen ? ' active' : ''}`}
          aria-haspopup="dialog"
          onClick={onAbout}
        >
          About
        </button>
      </nav>
    </header>
  );
}
