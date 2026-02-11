import './PredictionBars.css';

export default function PredictionBars({ predictions, classNames, threshold = 0.75 }) {
    if (!predictions || predictions.length === 0) {
        return (
            <div className="prediction-bars card">
                <h3 className="prediction-bars-title">Predictions</h3>
                <div className="prediction-bars-empty">
                    <p>Train a model to see predictions</p>
                </div>
            </div>
        );
    }

    return (
        <div className="prediction-bars card">
            <h3 className="prediction-bars-title">
                Predictions
                <span className="prediction-threshold">threshold: {Math.round(threshold * 100)}%</span>
            </h3>
            <div className="prediction-bars-list">
                {predictions.map((pred, i) => {
                    const pct = Math.round(pred.confidence * 100);
                    const isHigh = pred.confidence >= threshold;
                    const isMedium = pred.confidence >= 0.3 && !isHigh;

                    return (
                        <div key={i} className="prediction-bar">
                            <div
                                className={`prediction-fill ${isHigh ? 'high' : isMedium ? 'medium' : ''}`}
                                style={{ width: `${pct}%` }}
                            />
                            <span className="prediction-label">
                                {pred.className}
                                <span className="prediction-pct">{pct}%</span>
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
