import {
    CpuChipIcon,
    BoltIcon,
    StarIcon,
    CodeBracketIcon,
    LockClosedIcon,
} from '@heroicons/react/24/outline';
import { Card, CardTitle, CardContent } from '../ui/card.jsx';
import './AboutTab.css';

export default function AboutTab() {
    return (
        <div className="about-tab animate-fade-in">
            <div className="about-hero">
                <CpuChipIcon className="h-12 w-12 text-[var(--green)] drop-shadow-[0_0_8px_rgba(184,187,38,0.4)]" />
                <h2>Hand Pose Trainer</h2>
                <p className="about-tagline">A teachable machine for hand gestures</p>
            </div>

            <div className="about-grid">
                <Card>
                    <CardContent>
                        <h3 className="flex items-center gap-2 text-base font-bold mb-3">
                            <CpuChipIcon className="h-5 w-5 text-[var(--green)]" />
                            How It Works
                        </h3>
                        <ol className="about-steps">
                            <li>Create gesture classes (e.g. "thumbs up", "peace")</li>
                            <li>Show your hand to the webcam and collect samples</li>
                            <li>Train a neural network on your gesture data</li>
                            <li>Use real-time predictions to play notes or control motors</li>
                        </ol>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent>
                        <h3 className="flex items-center gap-2 text-base font-bold mb-3">
                            <BoltIcon className="h-5 w-5 text-[var(--yellow)]" />
                            Tech Stack
                        </h3>
                        <ul className="about-tech-list">
                            <li><strong>MediaPipe</strong> — hand landmark detection</li>
                            <li><strong>TensorFlow.js</strong> — in-browser ML training</li>
                            <li><strong>React + Vite</strong> — modern frontend</li>
                            <li><strong>Web Audio API</strong> — synthesizer</li>
                            <li><strong>Web Bluetooth</strong> — motor control</li>
                        </ul>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent>
                        <h3 className="flex items-center gap-2 text-base font-bold mb-3">
                            <StarIcon className="h-5 w-5 text-[var(--orange)]" />
                            Features
                        </h3>
                        <ul className="about-tech-list">
                            <li>Real-time hand tracking at 60fps</li>
                            <li>Custom gesture class training</li>
                            <li>Note sequencer with waveform selection</li>
                            <li>BLE motor control interface</li>
                            <li>Model save/load/export/import</li>
                        </ul>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent>
                        <h3 className="flex items-center gap-2 text-base font-bold mb-3">
                            <CodeBracketIcon className="h-5 w-5 text-[var(--blue)]" />
                            Open Source
                        </h3>
                        <p className="text-sm text-[var(--fg-dim)] leading-relaxed">
                            Built with love and open-source technologies. All processing happens
                            in your browser — your camera feed and trained models never leave your device.
                        </p>
                        <div className="about-privacy">
                            <LockClosedIcon className="h-4 w-4 text-[var(--aqua)] shrink-0" />
                            <span className="text-xs font-medium text-[var(--aqua)]">
                                100% client-side processing. No data ever leaves your device.
                            </span>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
