export default function LoadingOverlay({ message = 'Loading...', progress }) {
    return (
        <div className="loading-overlay">
            <div className="spinner" />
            <p className="loading-text">{message}</p>
            {progress && (
                <div className="loading-progress">
                    <div className="loading-progress-bar">
                        <div
                            className="loading-progress-fill"
                            style={{ width: `${Math.round(progress * 100)}%` }}
                        />
                    </div>
                    <span className="loading-progress-label">
                        {Math.round(progress * 100)}%
                    </span>
                </div>
            )}
        </div>
    );
}
