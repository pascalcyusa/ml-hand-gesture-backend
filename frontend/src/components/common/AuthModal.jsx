/**
 * AuthModal — Login/Signup overlay modal
 */

import { useState } from 'react';
import './AuthModal.css';

export default function AuthModal({ onClose, onLogin, onSignup }) {
    const [mode, setMode] = useState('login'); // 'login' | 'signup'
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
            onClose();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="auth-modal card animate-fade-in">
                <div className="auth-header">
                    <h2>{mode === 'login' ? '👋 Welcome Back' : '🚀 Create Account'}</h2>
                    <button className="auth-close" onClick={onClose}>✕</button>
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
                                type="text"
                                className="auth-input"
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
                            type="email"
                            className="auth-input"
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
                            type="password"
                            className="auth-input"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                            minLength={6}
                            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                        />
                    </div>

                    {error && <p className="auth-error">{error}</p>}

                    <button
                        type="submit"
                        className="btn btn-primary btn-lg auth-submit"
                        disabled={loading}
                    >
                        {loading ? '⏳ Please wait...' : mode === 'login' ? 'Log In' : 'Create Account'}
                    </button>
                </form>

                <button className="auth-guest" onClick={onClose}>
                    Continue as Guest →
                </button>
            </div>
        </div>
    );
}
