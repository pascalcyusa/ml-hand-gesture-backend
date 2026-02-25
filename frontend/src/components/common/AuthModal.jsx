import { useState } from 'react';
import {
    XMarkIcon,
    ArrowRightIcon,
    EnvelopeIcon,
    LockClosedIcon,
    UserIcon
} from '@heroicons/react/24/outline';
import './AuthModal.css';
import { API_BASE_URL } from '../../config';

export default function AuthModal({ onClose, onLogin, onSignup, initialView = 'login', initialToken = '' }) {
    const [view, setView] = useState(initialView); // login | signup | forgot | reset
    const [message, setMessage] = useState(null);
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        resetToken: initialToken,
        newPassword: ''
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage(null);

        if (view === 'signup') {
            if (formData.password !== formData.confirmPassword) {
                setMessage('Passwords do not match');
                return;
            }
            onSignup(formData.username, formData.email, formData.password);
        } else if (view === 'login') {
            onLogin(formData.email, formData.password);
        } else if (view === 'forgot') {
            try {
                const res = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: formData.email })
                });
                const data = await res.json();
                setMessage(data.detail);
                if (res.ok) setTimeout(() => setView('reset'), 2000);
            } catch (err) {
                setMessage('Error request failed');
            }
        } else if (view === 'reset') {
            try {
                const res = await fetch(`${API_BASE_URL}/auth/reset-password`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ token: formData.resetToken, new_password: formData.newPassword })
                });
                const data = await res.json();
                setMessage(data.detail);
                if (res.ok) setTimeout(() => setView('login'), 2000);
            } catch (err) {
                setMessage('Error reset failed');
            }
        }
    };

    const toggleView = () => {
        setView(view === 'login' ? 'signup' : 'login');
        setFormData({ username: '', email: '', password: '', confirmPassword: '', resetToken: '', newPassword: '' });
        setMessage(null);
    };

    return (
        <div className="auth-overlay" onClick={onClose}>
            <div className="auth-card" onClick={(e) => e.stopPropagation()}>
                <div className="auth-glow"></div>
                <button className="close-btn" onClick={onClose}>
                    <XMarkIcon className="w-6 h-6" />
                </button>

                <div className="auth-content">
                    <div className="auth-header">
                        <h2 className="auth-title">
                            {view === 'login' && 'Welcome back'}
                            {view === 'signup' && 'Create account'}
                            {view === 'forgot' && 'Reset Password'}
                            {view === 'reset' && 'New Password'}
                        </h2>
                        <p className="auth-subtitle">
                            {view === 'login' && 'Log in to your account'}
                            {view === 'signup' && 'Get started with your free account'}
                            {view === 'forgot' && 'Enter your email to receive a reset link'}
                            {view === 'reset' && 'Enter your token and new password'}
                        </p>
                    </div>

                    {message && (
                        <div className="p-3 mb-4 text-sm text-center bg-[var(--bg3)] rounded text-[var(--primary)]">
                            {message}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="auth-fields">
                        {view === 'signup' && (
                            <div className="input-group">
                                <label className="input-label">Username</label>
                                <input
                                    type="text"
                                    name="username"
                                    value={formData.username}
                                    onChange={handleChange}
                                    className="auth-input"
                                    placeholder="johndoe"
                                    required
                                />
                            </div>
                        )}

                        {(view === 'login' || view === 'signup' || view === 'forgot') && (
                            <div className="input-group">
                                <label className="input-label">Email</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    className="auth-input"
                                    placeholder="name@example.com"
                                    required
                                />
                            </div>
                        )}

                        {(view === 'login' || view === 'signup') && (
                            <div className="input-group">
                                <div className="flex justify-between">
                                    <label className="input-label">Password</label>
                                    {view === 'login' && (
                                        <span
                                            className="text-xs text-[var(--primary)] cursor-pointer hover:underline"
                                            onClick={() => setView('forgot')}
                                        >
                                            Forgot?
                                        </span>
                                    )}
                                </div>
                                <input
                                    type="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    className="auth-input"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                        )}

                        {view === 'signup' && (
                            <div className="input-group">
                                <label className="input-label">Confirm Password</label>
                                <input
                                    type="password"
                                    name="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    className="auth-input"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                        )}

                        {view === 'reset' && (
                            <>
                                <div className="input-group">
                                    <label className="input-label">Reset Token</label>
                                    <input
                                        type="text"
                                        name="resetToken"
                                        value={formData.resetToken}
                                        onChange={handleChange}
                                        className="auth-input"
                                        placeholder="Paste token here"
                                        required
                                    />
                                </div>
                                <div className="input-group">
                                    <label className="input-label">New Password</label>
                                    <input
                                        type="password"
                                        name="newPassword"
                                        value={formData.newPassword}
                                        onChange={handleChange}
                                        className="auth-input"
                                        placeholder="••••••••"
                                        required
                                    />
                                </div>
                            </>
                        )}

                        <div className="submit-row">
                            <button type="submit" className="submit-btn" title="Submit">
                                <ArrowRightIcon className="w-6 h-6 stroke-[3px]" />
                            </button>
                        </div>
                    </form>

                    {(view === 'login' || view === 'signup') && (
                        <>
                            <div className="auth-divider">OR</div>
                            <div className="auth-footer">
                                {view === 'login' ? "Don't have an account?" : "Already have an account?"}
                                <span
                                    className="auth-link"
                                    onClick={toggleView}
                                >
                                    {view === 'login' ? 'Sign up' : 'Log in'}
                                </span>
                            </div>
                        </>
                    )}

                    {(view === 'forgot' || view === 'reset') && (
                        <div className="auth-footer mt-4">
                            <span className="auth-link" onClick={() => setView('login')}>
                                Back to Login
                            </span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}