import { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { Button } from '../ui/button.jsx';
import { Input } from '../ui/input.jsx';
import { Card } from '../ui/card.jsx';
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
            onClose();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <Card className="auth-modal animate-fade-in max-w-[420px] w-full mx-4 p-8">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-[var(--fg)]">
                        {mode === 'login' ? 'Welcome Back' : 'Create Account'}
                    </h2>
                    <Button variant="ghost" size="icon" onClick={onClose}>
                        <XMarkIcon className="h-5 w-5" />
                    </Button>
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

                <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
                    {mode === 'signup' && (
                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-semibold text-[var(--fg-dim)] font-[var(--font-mono)]">
                                Username
                            </label>
                            <Input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="your_username"
                                required
                                autoComplete="username"
                            />
                        </div>
                    )}

                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-[var(--fg-dim)] font-[var(--font-mono)]">
                            Email
                        </label>
                        <Input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@example.com"
                            required
                            autoComplete="email"
                        />
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-[var(--fg-dim)] font-[var(--font-mono)]">
                            Password
                        </label>
                        <Input
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
                        <p className="text-xs font-[var(--font-mono)] text-[var(--red)] bg-[rgba(251,73,52,0.08)] px-3 py-1.5 rounded-[var(--radius-sm)]">
                            {error}
                        </p>
                    )}

                    <Button
                        type="submit"
                        variant="primary"
                        size="lg"
                        className="w-full mt-2"
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
    );
}
