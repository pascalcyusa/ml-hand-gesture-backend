import { UserCircleIcon } from '@heroicons/react/24/outline';
import { Button } from '../ui/button.jsx';
import './Header.css';

export default function Header({ user, onSignIn, onLogout, onProfileClick }) {
    return (
        <header className="app-header">
            <div className="header-inner">
                <div className="logo-area">
                    <img src="/img/logo.png" alt="ML Hand Gesture" className="logo-img" />
                    <h1 className="app-title">ML Hand Gesture</h1>
                </div>

                <div className="user-area">
                    {user ? (
                        <button className="user-profile-btn" onClick={onProfileClick} title="Dashboard">
                            <div className="user-avatar">
                                {user.username.charAt(0).toUpperCase()}
                            </div>
                        </button>
                    ) : (
                        <Button variant="ghost" size="icon" onClick={onSignIn} className="sign-in-btn" title="Sign In">
                            <UserCircleIcon className="h-5 w-5" />
                        </Button>
                    )}
                </div>
            </div>
        </header>
    );
}
