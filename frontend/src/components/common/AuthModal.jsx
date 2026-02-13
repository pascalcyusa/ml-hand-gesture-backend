import { useState } from 'react';
import {
    XMarkIcon,
    ArrowRightIcon,
    EnvelopeIcon,
    LockClosedIcon,
    UserIcon
} from '@heroicons/react/24/outline';
import './AuthModal.css';

export default function AuthModal({ onClose, onLogin, onSignup }) {
    const [isLogin, setIsLogin] = useState(true);
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: ''
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (isLogin) {
            onLogin(formData.email, formData.password);
        } else {
            onSignup(formData.username, formData.email, formData.password);
        }
    };

    return (
        <div className="auth-overlay" onClick={onClose}>
            <div className="auth-card" onClick={(e) => e.stopPropagation()}>
                {/* The Green Glow */}
                <div className="auth-glow"></div>

                <button className="close-btn" onClick={onClose}>
                    <XMarkIcon className="w-6 h-6" />
                </button>

                <div className="auth-content">
                    <div className="auth-header">
                        <h2 className="auth-title">
                            {isLogin ? 'Welcome back' : 'Create account'}
                        </h2>
                        <p className="auth-subtitle">
                            {isLogin ? 'Sign in to your account' : 'Get started with your free account'}
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="auth-fields">
                        {!isLogin && (
                            <div className="input-group">
                                <label className="input-label">Username</label>
                                <input
                                    type="text"
                                    name="username"
                                    value={formData.username}
                                    onChange={handleChange}
                                    className="auth-input"
                                    placeholder="johndoe"
                                    autoFocus={!isLogin}
                                />
                            </div>
                        )}

                        <div className="input-group">
                            <label className="input-label">Email</label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                className="auth-input"
                                placeholder="name@example.com"
                                autoFocus={isLogin}
                            />
                        </div>

                        <div className="input-group">
                            <label className="input-label">Password</label>
                            <input
                                type="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                className="auth-input"
                                placeholder="••••••••"
                            />
                        </div>

                        {/* Submit Button - Circular style to match the image's arrow button */}
                        <div className="submit-row">
                            <button type="submit" className="submit-btn">
                                <ArrowRightIcon className="w-6 h-6 stroke-[3px]" />
                            </button>
                        </div>
                    </form>

                    <div className="auth-divider">OR</div>

                    {/* Placeholder for future social logins to match image style */}
                    <button className="alt-auth-btn" onClick={() => alert("Google Auth not implemented yet")}>
                        <div className="flex items-center gap-3">
                            <span className="font-bold text-[var(--blue)]">G</span>
                            <span>Continue with Google</span>
                        </div>
                        <ArrowRightIcon className="w-4 h-4 text-[var(--fg-muted)]" />
                    </button>

                    <div className="auth-footer">
                        {isLogin ? "Don't have an account?" : "Already have an account?"}
                        <span
                            className="auth-link"
                            onClick={() => {
                                setIsLogin(!isLogin);
                                setFormData({ username: '', email: '', password: '' });
                            }}
                        >
                            {isLogin ? 'Sign up' : 'Sign in'}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}