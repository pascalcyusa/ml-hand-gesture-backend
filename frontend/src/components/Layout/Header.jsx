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
    { to: '/community', label: 'Community', icon: GlobeAltIcon },
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

    const allNavItems = [
        ...NAV_ITEMS,
        ...(user ? [{ to: '/dashboard', label: 'Dashboard', icon: UserCircleIcon }] : [])
    ];

    return (
        <header className="app-header">
            <div className="header-inner">
                {/* Left: Hamburger + Logo */}
                <div className="flex items-center gap-4">
                    {/* Hamburger Button (Mobile Only) */}
                    <button
                        className="mobile-menu-btn md:hidden"
                        onClick={toggleMenu}
                        aria-label="Toggle menu"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                        </svg>
                    </button>

                    {/* Logo Area */}
                    <Link to="/" className="logo-area">
                        <img src="/img/logo.png" alt="ML Hand Gesture" className="logo-img" width="100" height="100" />
                        <h1 className="app-title hidden sm:block">ML Hand Gesture</h1>
                    </Link>
                </div>

                {/* Desktop Navigation */}
                <nav className="main-nav hidden md:flex">
                    {allNavItems.map((item) => (
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
                        onClick={() => setIsMenuOpen(!isMenuOpen)} // Use explicit toggle for user menu if needed, or share logic
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
                            {/* Mobile Nav Links (Visible only in dropdown on mobile) */}
                            <div className="md:hidden border-b border-[var(--border-dim)] mb-2 pb-2">
                                {allNavItems.map((item) => (
                                    <NavLink
                                        key={item.to}
                                        to={item.to}
                                        className={({ isActive }) =>
                                            `dropdown-item flex items-center gap-2 ${isActive ? 'text-[var(--gold)] bg-[var(--bg1)]' : ''}`
                                        }
                                        onClick={() => setIsMenuOpen(false)}
                                    >
                                        <item.icon className="h-4 w-4" />
                                        <span>{item.label}</span>
                                    </NavLink>
                                ))}
                            </div>

                            {user ? (
                                <>
                                    <div className="dropdown-header">
                                        <p className="font-medium">{user.username}</p>
                                        <p className="text-xs text-[var(--fg-muted)]">{user.email}</p>
                                    </div>

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
