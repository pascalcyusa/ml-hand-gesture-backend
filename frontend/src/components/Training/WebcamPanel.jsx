import { useRef, useEffect, useState } from 'react';
import { VideoCameraIcon } from '@heroicons/react/24/outline';
import './WebcamPanel.css';

export default function WebcamPanel({ onVideoReady, isDetecting, isStarted, onStartCamera, showVideo, onToggleVideo }) {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);

    useEffect(() => {
        if (isStarted && videoRef.current && canvasRef.current && onVideoReady) {
            onVideoReady(videoRef.current, canvasRef.current);
        }
    }, [isStarted, onVideoReady]);

    return (
        <div className="webcam-panel card">
            <div className="webcam-header">
                <h2 className="webcam-title">
                    <span className="webcam-dot" data-active={isDetecting} />
                    Camera
                </h2>
                {isStarted && onToggleVideo && (
                    <label className="toggle-switch">
                        <input
                            type="checkbox"
                            checked={showVideo}
                            onChange={(e) => onToggleVideo(e.target.checked)}
                        />
                        <span className="toggle-slider" />
                        <span className="toggle-label">Show Video</span>
                    </label>
                )}
            </div>

            <div className="webcam-container">
                {isStarted ? (
                    <>
                        <video
                            ref={videoRef}
                            className={`webcam-video ${!showVideo ? 'blurred' : ''}`}
                            playsInline
                            muted
                            autoPlay
                        />
                        <canvas ref={canvasRef} className="webcam-canvas" />
                    </>
                ) : (
                    <div className="webcam-placeholder">
                        <VideoCameraIcon className="w-16 h-16 text-[var(--gold)] opacity-50 mb-2" />
                        <button className="start-camera-btn" onClick={onStartCamera}>
                            Start Camera
                        </button>
                    </div>
                )}

                {isStarted && !isDetecting && (
                    <div className="webcam-placeholder">
                        <VideoCameraIcon className="w-16 h-16 text-[var(--gold)] opacity-50 mb-2 animate-pulse" />
                        <p>Loading hand detection...</p>
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
