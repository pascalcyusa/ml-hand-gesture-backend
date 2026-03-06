import { useRef, useEffect } from 'react';
import './ActivityLog.css';

/**
 * Scrollable log of prediction-triggered actions (motor commands, piano notes).
 * Renders below PredictionBars in the left column.
 */
export default function ActivityLog({ entries = [], title = 'Activity' }) {
    const listRef = useRef(null);

    // Auto-scroll to bottom on new entries
    useEffect(() => {
        if (listRef.current) {
            listRef.current.scrollTop = listRef.current.scrollHeight;
        }
    }, [entries.length]);

    return (
        <div className="activity-log card">
            <h3 className="activity-log-title">
                {title}
                {entries.length > 0 && (
                    <span className="activity-log-count">{entries.length}</span>
                )}
            </h3>
            {entries.length === 0 ? (
                <div className="activity-log-empty">
                    <p>Actions will appear here</p>
                </div>
            ) : (
                <div className="activity-log-list" ref={listRef}>
                    {entries.map((entry, i) => (
                        <div key={i} className="activity-log-entry">
                            <span className="activity-log-icon">{entry.icon || '⚡'}</span>
                            <span className="activity-log-gesture">{entry.gesture}</span>
                            <span className="activity-log-arrow">→</span>
                            <span className="activity-log-action">{entry.action}</span>
                            <span className="activity-log-time">{entry.time}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
