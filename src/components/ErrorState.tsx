import '../styles/ErrorState.css';

interface ErrorStateProps {
  onRetry: () => void;
  message?: string;
}

export const ErrorState = ({ onRetry, message }: ErrorStateProps) => {
  return (
    <div className="error-state fade-in">
      <h2 className="error-title">CONNECTION INTERRUPTED</h2>
      <p className="error-message">
        The archive could not be reached. Check your connection and try again.
      </p>
      <button className="retry-button" onClick={onRetry}>
        RETRY FETCH
      </button>
      {message && (
        <details className="error-details">
          <summary>TECHNICAL DETAILS</summary>
          <code>{message}</code>
        </details>
      )}
    </div>
  );
};
