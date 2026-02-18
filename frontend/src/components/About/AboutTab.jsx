import {
    CpuChipIcon,
    BoltIcon,
    StarIcon,
    CodeBracketIcon,
    LockClosedIcon,
    HeartIcon,
} from '@heroicons/react/24/outline';
import { Card, CardTitle, CardContent } from '../ui/card.jsx';
import './AboutTab.css';

export default function AboutTab() {
    return (
        <div className="about-tab animate-fade-in">
            <div className="about-header">
                <h2 className="flex items-center gap-2">
                    <CpuChipIcon className="h-6 w-6 text-[var(--gold)]" />
                    About
                </h2>
                <p className="text-[var(--fg-muted)] mt-1">
                    ML Hand Gesture is a web application for training and using machine learning models to play
                    piano notes and control your LEGO Spike Prime motors.
                </p>
            </div>

            <div className="about-grid">

                <Card>
                    <CardContent>
                        <h3 className="flex items-center gap-2 text-base font-bold mb-3">
                            <CodeBracketIcon className="h-5 w-5 text-[var(--gold)]" />
                            Open Source & Privacy First
                        </h3>
                        <ul className="about-tech-list">
                            <li>When you train a model, your data never leaves your device.</li>
                            <li>Learn more <a href="https://github.com/pascalcyusa/ml-hand-gesture-backend">here</a></li>
                        </ul>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent>
                        <h3 className="flex items-center gap-2 text-base font-bold mb-3">
                            <HeartIcon className="h-5 w-5 text-[var(--gold)]" />
                            Special Thanks
                        </h3>
                        <ul className="about-tech-list">
                            <li>Tufts CEEO</li>
                            <li>Prof. Ethan Danahy</li>
                            <li>LEGO Education</li>
                        </ul>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
