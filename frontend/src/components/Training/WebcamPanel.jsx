import { useRef, useEffect, useState } from 'react';
import './WebcamPanel.css';

export default function WebcamPanel({ onVideoReady, isDetecting, showVideo = true }) {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const [videoBlurred, setVideoBlurred] = useState(false);

    useEffect(() => {
        if (videoRef.current && canvasRef.current && onVideoReady) {
            onVideoReady(videoRef.current, canvasRef.current);
        }
    }, [onVideoReady]);

    return (
        <div className="webcam-panel card">
            <div className="webcam-header">
                <h3 className="webcam-title">
                    <span className="webcam-dot" data-active={isDetecting} />
                    Camera Feed
                </h3>
                <label className="toggle-switch">
                    <input
                        type="checkbox"
                        checked={!videoBlurred}
                        onChange={(e) => setVideoBlurred(!e.target.checked)}
                    />
                    <span className="toggle-slider" />
                    <span className="toggle-label">Show Video</span>
                </label>
            </div>

            <div className="webcam-container">
                <video
                    ref={videoRef}
                    className={`webcam-video ${videoBlurred ? 'blurred' : ''}`}
                    playsInline
                    muted
                    autoPlay
                />
                <canvas ref={canvasRef} className="webcam-canvas" />

                {!isDetecting && (
                    <div className="webcam-placeholder">
                        <span className="webcam-placeholder-icon">📷</span>
                        <p>Camera will start when you begin</p>
                    </div>
                )}
            </div>

            <div className="webcam-footer">
                <span className={`status-badge ${isDetecting ? 'status-badge-ready' : 'status-badge-warning'}`}>
                    {isDetecting ? '● Detecting' : '○ Idle'}
                </span>
            </div>
        </div>
    );
}
