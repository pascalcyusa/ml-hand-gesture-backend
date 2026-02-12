import {
    HandRaisedIcon,
    CpuChipIcon,
    MusicalNoteIcon,
    SignalIcon,
    GlobeAltIcon,
    InformationCircleIcon,
    ArrowRightEndOnRectangleIcon,
} from '@heroicons/react/24/outline';
import { Button } from '../ui/button.jsx';

export default function Header({ user, onSignIn, onLogout }) {
    return (
        <header className="app-header">
            <div className="header-inner">
                <div className="header-logo">
                    <HandRaisedIcon className="h-8 w-8 text-[var(--green)] drop-shadow-[0_0_8px_rgba(184,187,38,0.4)]" />
                    <div>
                        <h1 className="header-title">Hand Pose Trainer</h1>
                        <p className="header-subtitle">Teachable Machine for Hand Gestures</p>
                    </div>
                </div>
                <div className="header-user">
                    {user ? (
                        <>
                            <span className="inline-flex items-center justify-center h-7 w-7 rounded-full bg-[var(--bg2)] text-[var(--fg-dim)] text-xs font-bold">
                                {user.username?.charAt(0).toUpperCase()}
                            </span>
                            <span className="header-username">{user.username}</span>
                            <Button variant="ghost" size="sm" onClick={onLogout}>
                                <ArrowRightEndOnRectangleIcon className="h-4 w-4" />
                                Logout
                            </Button>
                        </>
                    ) : (
                        <Button variant="primary" size="sm" onClick={onSignIn}>
                            Sign In
                        </Button>
                    )}
                </div>
            </div>
        </header>
    );
}
