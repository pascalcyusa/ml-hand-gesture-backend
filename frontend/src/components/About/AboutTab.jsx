/**
 * AboutTab — App information, credits, and technology stack
 */

import './AboutTab.css';

export default function AboutTab() {
    return (
        <div className="about-tab animate-fade-in">
            <div className="about-hero">
                <span className="about-hero-icon">🤖</span>
                <h2>Hand Pose Trainer</h2>
                <p className="about-tagline">A teachable machine for hand gestures</p>
            </div>

            <div className="about-grid">
                <div className="about-card card">
                    <h3>🧠 How It Works</h3>
                    <ol className="about-steps">
                        <li>Show your hand to the camera — MediaPipe detects 21 landmarks</li>
                        <li>Create gesture classes and collect training samples</li>
                        <li>Train a neural network to classify your gestures in real-time</li>
                        <li>Map gestures to musical notes or motor actions</li>
                    </ol>
                </div>

                <div className="about-card card">
                    <h3>⚡ Tech Stack</h3>
                    <div className="about-tech-list">
                        <div className="about-tech-item">
                            <span className="about-tech-name">MediaPipe</span>
                            <span className="about-tech-desc">Hand landmark detection</span>
                        </div>
                        <div className="about-tech-item">
                            <span className="about-tech-name">TensorFlow.js</span>
                            <span className="about-tech-desc">In-browser ML training</span>
                        </div>
                        <div className="about-tech-item">
                            <span className="about-tech-name">Web Audio API</span>
                            <span className="about-tech-desc">Synthesized note playback</span>
                        </div>
                        <div className="about-tech-item">
                            <span className="about-tech-name">Web Bluetooth</span>
                            <span className="about-tech-desc">BLE device control</span>
                        </div>
                        <div className="about-tech-item">
                            <span className="about-tech-name">React + Vite</span>
                            <span className="about-tech-desc">Fast, modern frontend</span>
                        </div>
                        <div className="about-tech-item">
                            <span className="about-tech-name">FastAPI</span>
                            <span className="about-tech-desc">Python backend + PostgreSQL</span>
                        </div>
                    </div>
                </div>

                <div className="about-card card">
                    <h3>🎯 Features</h3>
                    <ul className="about-features">
                        <li>Real-time hand pose detection via GPU-accelerated MediaPipe</li>
                        <li>Custom gesture class creation with visual sample collection</li>
                        <li>In-browser TF.js model training — no server upload needed</li>
                        <li>Save, load, export & import trained models</li>
                        <li>Musical note sequences triggered by gestures</li>
                        <li>BLE motor control for robotics projects</li>
                    </ul>
                </div>

                <div className="about-card card">
                    <h3>📦 Open Source</h3>
                    <p className="about-open-source">
                        Built as part of an accessible ML education platform.
                        All processing runs locally in your browser — no data leaves your device.
                    </p>
                    <div className="about-privacy">
                        <span className="about-privacy-icon">🔒</span>
                        <span>100% client-side inference — your camera feed is never uploaded</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
