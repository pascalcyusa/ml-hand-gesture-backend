/**
 * useAuth — Authentication Hook
 *
 * Connects to the Python/FastAPI backend for JWT-based auth.
 * Stores token in localStorage and provides user state to the app.
 */

import { useState, useCallback, useEffect } from 'react';

const API_Base = 'http://localhost:8000';

export function useAuth() {
    const [user, setUser] = useState(null); // { id, username, email }
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [loading, setLoading] = useState(true);

    // Helper for auth headers
    const getHeaders = useCallback(() => {
        const t = localStorage.getItem('token');
        return t ? { 'Authorization': `Bearer ${t}` } : {};
    }, []);

    // Check current user on mount if token exists
    useEffect(() => {
        const checkUser = async () => {
            const t = localStorage.getItem('token');
            if (!t) {
                setLoading(false);
                return;
            }

            try {
                const res = await fetch(`${API_Base}/auth/me`, {
                    headers: { 'Authorization': `Bearer ${t}` }
                });

                if (res.ok) {
                    const userData = await res.json();
                    setUser(userData);
                } else {
                    // Token invalid
                    logout();
                }
            } catch (err) {
                console.error("Auth check failed:", err);
                logout();
            } finally {
                setLoading(false);
            }
        };

        checkUser();
    }, []);

    const login = useCallback(async (email, password) => {
        try {
            const res = await fetch(`${API_Base}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            if (!res.ok) {
                return null;
            }

            const data = await res.json();
            localStorage.setItem('token', data.access_token);
            setToken(data.access_token);
            setUser(data.user);
            return data.user;
        } catch (err) {
            console.error("Login error:", err);
            return null;
        }
    }, []);

    const signup = useCallback(async (username, email, password) => {
        try {
            const res = await fetch(`${API_Base}/auth/signup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, email, password }),
            });

            if (!res.ok) {
                const body = await res.json().catch(() => null);
                throw new Error(body?.detail || 'Signup failed');
            }

            const data = await res.json();
            localStorage.setItem('token', data.access_token);
            setToken(data.access_token);
            setUser(data.user);
            return data.user;
        } catch (err) {
            console.error("Signup error:", err);
            throw err;
        }
    }, []);

    const logout = useCallback(() => {
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
    }, []);

    return {
        user,
        loading,
        login,
        signup,
        logout,
        getHeaders,
    };
}
