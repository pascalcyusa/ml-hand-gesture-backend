import { useState, useRef, useEffect } from 'react';
import { NavLink, Link } from 'react-router-dom';
import {
    UserCircleIcon,
    HandRaisedIcon,
    MusicalNoteIcon,
    SignalIcon,
    GlobeAltIcon,
    InformationCircleIcon,
    ChevronDownIcon,
    ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline';
import { CogIcon } from '@heroicons/react/24/solid';
import './Header.css';

const NAV_ITEMS = [
    { to: '/train', label: 'Train', icon: HandRaisedIcon },
    { to: '/piano', label: 'Piano', icon: MusicalNoteIcon },
    { to: '/motors', label: 'Motors', icon: CogIcon },
    { to: '/devices', label: 'Devices', icon: SignalIcon },
];

export default function Header({ user, onSignIn, onLogout }) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef(null);

    // Close menu when clicking outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsMenuOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [menuRef]);

    const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

    return (
        <header className="app-header">
            <div className="header-inner">
                {/* Logo Area */}
                <Link to="/" className="logo-area">
                    <img src="/img/logo.png" alt="ML Hand Gesture" className="logo-img" />
                    <h1 className="app-title">ML Hand Gesture</h1>
                </Link>

                {/* Main Navigation */}
                <nav className="main-nav">
                    {NAV_ITEMS.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            className={({ isActive }) =>
                                `nav-link ${isActive ? 'active' : ''}`
                            }
                        >
                            <item.icon className="nav-icon" />
                            <span className="nav-label">{item.label}</span>
                        </NavLink>
                    ))}
                </nav>

                {/* User Area */}
                <div className="user-area" ref={menuRef}>
                    <button
                        className="user-profile-btn"
                        onClick={toggleMenu}
                        title={user ? "User Menu" : "Menu"}
                    >
                        {user ? (
                            <div className="user-avatar">
                                {user.username.charAt(0).toUpperCase()}
                            </div>
                        ) : (
                            <UserCircleIcon className="h-6 w-6 text-[var(--fg-dim)]" />
                        )}
                        <ChevronDownIcon className="h-3 w-3 text-[var(--fg-muted)]" />
                    </button>

                    {/* Dropdown Menu */}
                    {isMenuOpen && (
                        <div className="user-dropdown">
                            {user ? (
                                <>
                                    <div className="dropdown-header">
                                        <p className="font-medium">{user.username}</p>
                                        <p className="text-xs text-[var(--fg-muted)]">{user.email}</p>
                                    </div>
                                    <Link
                                        to="/dashboard"
                                        className="dropdown-item"
                                        onClick={() => setIsMenuOpen(false)}
                                    >
                                        Dashboard
                                    </Link>
                                    <button
                                        className="dropdown-item text-[var(--gold)] hover:text-[var(--gold-light)]"
                                        onClick={() => {
                                            onLogout();
                                            setIsMenuOpen(false);
                                        }}
                                    >
                                        <div className="flex items-center gap-2 w-full">
                                            <ArrowRightOnRectangleIcon className="h-4 w-4" />
                                            <span>Sign Out</span>
                                        </div>
                                    </button>
                                    <div className="dropdown-divider"></div>
                                    <Link
                                        to="/community"
                                        className="dropdown-item"
                                        onClick={() => setIsMenuOpen(false)}
                                    >
                                        Community
                                    </Link>
                                    <Link
                                        to="/about"
                                        className="dropdown-item"
                                        onClick={() => setIsMenuOpen(false)}
                                    >
                                        About
                                    </Link>
                                    <div className="dropdown-divider"></div>
                                </>
                            ) : (
                                <>
                                    <button
                                        className="dropdown-item"
                                        onClick={() => {
                                            onSignIn();
                                            setIsMenuOpen(false);
                                        }}
                                    >
                                        Log In
                                    </button>
                                    <div className="dropdown-divider"></div>
                                    <Link
                                        to="/community"
                                        className="dropdown-item"
                                        onClick={() => setIsMenuOpen(false)}
                                    >
                                        Community
                                    </Link>
                                    <Link
                                        to="/about"
                                        className="dropdown-item"
                                        onClick={() => setIsMenuOpen(false)}
                                    >
                                        About
                                    </Link>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </header >
    );
}
