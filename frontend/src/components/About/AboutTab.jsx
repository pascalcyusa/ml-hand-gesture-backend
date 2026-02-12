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
                <h2>ML Hand Gesture</h2>
                <p className="about-tagline">A teachable machine for hand gestures</p>
            </div>

            <div className="about-grid">

                <Card>
                    <CardContent>
                        <h3 className="flex items-center gap-2 text-base font-bold mb-3">
                            <HeartIcon className="h-5 w-5 text-[var(--orange)]" />
                            Special Thanks
                        </h3>
                        <ul className="about-tech-list">
                            <li>Tufts CEEO</li>
                            <li>Prof. Ethan Danahy</li>
                        </ul>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent>
                        <h3 className="flex items-center gap-2 text-base font-bold mb-3">
                            <CodeBracketIcon className="h-5 w-5 text-[var(--blue)]" />
                            Open Source
                        </h3>
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
