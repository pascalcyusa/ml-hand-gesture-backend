import { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { Button } from '../ui/button.jsx';
import { Card } from '../ui/card.jsx';
import ModalPortal from './ModalPortal.jsx';
import './AuthModal.css';

export default function AuthModal({ onClose, onLogin, onSignup }) {
    const [mode, setMode] = useState('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [username, setUsername] = useState('');
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            if (mode === 'signup') {
                if (!username.trim()) throw new Error('Username is required');
                await onSignup(username.trim(), email.trim(), password);
            } else {
                await onLogin(email.trim(), password);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <ModalPortal>
            <div className="auth-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
                <Card className="auth-modal animate-fade-in">
                    <div className="auth-header">
                        <h2>{mode === 'login' ? 'Welcome Back' : 'Create Account'}</h2>
                        <button className="auth-close" onClick={onClose}>
                            <XMarkIcon className="h-5 w-5" />
                        </button>
                    </div>

                    <div className="auth-tabs">
                        <button
                            className={`auth-tab ${mode === 'login' ? 'active' : ''}`}
                            onClick={() => { setMode('login'); setError(null); }}
                        >
                            Log In
                        </button>
                        <button
                            className={`auth-tab ${mode === 'signup' ? 'active' : ''}`}
                            onClick={() => { setMode('signup'); setError(null); }}
                        >
                            Sign Up
                        </button>
                    </div>

                    <form className="auth-form" onSubmit={handleSubmit}>
                        {mode === 'signup' && (
                            <div className="auth-field">
                                <label className="auth-label">Username</label>
                                <input
                                    className="auth-input"
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    placeholder="your_username"
                                    required
                                    autoComplete="username"
                                />
                            </div>
                        )}

                        <div className="auth-field">
                            <label className="auth-label">Email</label>
                            <input
                                className="auth-input"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="you@example.com"
                                required
                                autoComplete="email"
                            />
                        </div>

                        <div className="auth-field">
                            <label className="auth-label">Password</label>
                            <input
                                className="auth-input"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                                minLength={6}
                                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                            />
                        </div>

                        {error && (
                            <p className="auth-error">{error}</p>
                        )}

                        <Button
                            type="submit"
                            variant="primary"
                            className="auth-submit"
                            disabled={loading}
                        >
                            {loading ? 'Please wait...' : mode === 'login' ? 'Log In' : 'Create Account'}
                        </Button>
                    </form>

                    <button className="auth-guest" onClick={onClose}>
                        Continue as Guest →
                    </button>
                </Card>
            </div>
        </ModalPortal>
    );
}
