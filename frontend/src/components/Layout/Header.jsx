import { UserCircleIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';
import { Button } from '../ui/button.jsx';
import './Header.css';

export default function Header({ user, onSignIn, onLogout, onProfileClick }) {
    return (
        <header className="app-header">
            <div className="header-inner">
                <div className="logo-area">
                    <span className="logo-emoji">👋</span>
                    <div className="title-group">
                        <h1 className="app-title">Hand Pose Trainer</h1>
                        <span className="app-subtitle">Teach your browser to recognize gestures</span>
                    </div>
                </div>

                <div className="user-area">
                    {user ? (
                        <div className="flex items-center gap-3">
                            <button className="user-profile-btn" onClick={onProfileClick} title="Go to Dashboard">
                                <div className="user-avatar">
                                    {user.username.charAt(0).toUpperCase()}
                                </div>
                                <span className="username">{user.username}</span>
                            </button>
                        </div>
                    ) : (
                        <Button variant="ghost" size="sm" onClick={onSignIn} className="sign-in-btn">
                            <UserCircleIcon className="h-5 w-5 mr-1" />
                            Sign In
                        </Button>
                    )}
                </div>
            </div>
        </header>
    );
}
