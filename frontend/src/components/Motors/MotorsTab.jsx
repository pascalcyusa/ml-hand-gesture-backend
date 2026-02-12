/**
 * MotorsTab — Standalone motor control configuration per class
 *
 * Separated from PianoTab to be its own tab.
 * Configures motor actions for LEGO Spike Prime ports.
 */

import { CogIcon } from '@heroicons/react/24/outline';
import { Card } from '../ui/card.jsx';
import MotorSequencer from '../Piano/MotorSequencer.jsx';
import './MotorsTab.css';

export default function MotorsTab({ classNames, showToast }) {
    if (!classNames || classNames.length === 0) {
        return (
            <div className="motors-tab">
                <Card className="flex flex-col items-center justify-center gap-4 py-12 text-center">
                    <CogIcon className="h-12 w-12 text-[var(--fg-muted)] opacity-40" />
                    <h2 className="text-lg font-bold">Motor Controls</h2>
                    <p className="text-sm text-[var(--fg-dim)] max-w-[400px]">
                        Train at least one class in the Train tab to configure motor actions.
                    </p>
                    <p className="text-xs text-[var(--fg-muted)]">
                        Each trained class can trigger motor actions on your LEGO Spike Prime when detected.
                    </p>
                </Card>
            </div>
        );
    }

    return (
        <div className="motors-tab animate-fade-in">
            <div>
                <div className="motors-header">
                    <CogIcon className="h-6 w-6 text-[var(--orange)]" />
                    <h2>Motor Controls</h2>
                </div>
                <p className="motors-subtitle">
                    Configure motor actions for each gesture class. Connect your LEGO Spike Prime in the Devices tab.
                </p>
            </div>

            <div className="motors-section-list">
                {classNames.map((name, i) => (
                    <MotorSequencer
                        key={`motor-${name}-${i}`}
                        className={name}
                        classId={i}
                    />
                ))}
            </div>
        </div>
    );
}
