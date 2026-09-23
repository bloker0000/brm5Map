import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import './ErrorBoundary.css';

interface ErrorBoundaryProps {
  children: ReactNode;
  title?: string;
  message?: string;
  onBack?: () => void;
}

interface ErrorBoundaryState {
  failed: boolean;
}

// without one of these, a single thrown error unmounts the whole page and leaves it blank
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { failed: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(error, info.componentStack);
  }

  render() {
    if (!this.state.failed) return this.props.children;

    const { title, message, onBack } = this.props;
    return (
      <div className="crash" role="alert">
        <img src="/logos/logowhite.svg" alt="BRMap5" className="crash-logo" />
        <h1 className="crash-title">{title ?? 'Something went wrong'}</h1>
        <p className="crash-text">{message ?? 'Reloading the page usually fixes it.'}</p>
        <div className="crash-actions">
          <button className="brm-btn" onClick={() => window.location.reload()}>
            Reload
          </button>
          {onBack && (
            <button className="brm-btn" onClick={onBack}>
              Back to the map
            </button>
          )}
        </div>
      </div>
    );
  }
}
