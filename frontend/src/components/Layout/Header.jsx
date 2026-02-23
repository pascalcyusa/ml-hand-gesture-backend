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
    const [isNavOpen, setIsNavOpen] = useState(false);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const navRef = useRef(null);
    const userMenuRef = useRef(null);

    // Close menus when clicking outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (navRef.current && !navRef.current.contains(event.target)) {
                setIsNavOpen(false);
            }
            if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
                setIsUserMenuOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const allNavItems = [
        ...NAV_ITEMS,
        ...(user ? [{ to: '/dashboard', label: 'Dashboard', icon: UserCircleIcon }] : [])
    ];

    return (
        <header className="app-header">
            <div className="header-inner">
                {/* Left: Logo */}
                <div className="flex items-center gap-4">
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

                {/* Right: Hamburger (mobile) + User Profile */}
                <div className="header-right">
                    {/* Hamburger Nav (Mobile Only) */}
                    <div className="nav-menu-area md:hidden" ref={navRef}>
                        <button
                            className="mobile-menu-btn"
                            onClick={() => { setIsNavOpen(!isNavOpen); setIsUserMenuOpen(false); }}
                            aria-label="Toggle menu"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                            </svg>
                        </button>

                        {isNavOpen && (
                            <div className="user-dropdown">
                                {allNavItems.map((item) => (
                                    <NavLink
                                        key={item.to}
                                        to={item.to}
                                        className={({ isActive }) =>
                                            `dropdown-item flex items-center gap-2 ${isActive ? 'text-[var(--gold)] bg-[var(--bg1)]' : ''}`
                                        }
                                        onClick={() => setIsNavOpen(false)}
                                    >
                                        <item.icon className="h-4 w-4" />
                                        <span>{item.label}</span>
                                    </NavLink>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* User Profile (All Screens) */}
                    <div className="user-profile-area" ref={userMenuRef}>
                        <button
                            className="user-profile-btn"
                            onClick={() => { setIsUserMenuOpen(!isUserMenuOpen); setIsNavOpen(false); }}
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

                        {isUserMenuOpen && (
                            <div className="user-dropdown">
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
                                                setIsUserMenuOpen(false);
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
                                            onClick={() => setIsUserMenuOpen(false)}
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
                                                setIsUserMenuOpen(false);
                                            }}
                                        >
                                            Log In
                                        </button>
                                        <div className="dropdown-divider"></div>
                                        <Link
                                            to="/about"
                                            className="dropdown-item"
                                            onClick={() => setIsUserMenuOpen(false)}
                                        >
                                            About
                                        </Link>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </header >
    );
}
