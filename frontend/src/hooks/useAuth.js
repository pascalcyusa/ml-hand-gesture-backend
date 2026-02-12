/**
 * useAuth — React hook for JWT authentication
 * 
 * Manages signup, login, logout, and authenticated API calls.
 * Stores JWT in localStorage and auto-loads user on mount.
 */

import { useState, useCallback, useEffect } from 'react';

const TOKEN_KEY = 'handpose-auth-token';
const USER_KEY = 'handpose-auth-user';

export function useAuth() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Load stored session on mount
    useEffect(() => {
        const storedToken = localStorage.getItem(TOKEN_KEY);
        const storedUser = localStorage.getItem(USER_KEY);
        if (storedToken && storedUser) {
            try {
                setUser(JSON.parse(storedUser));
            } catch {
                localStorage.removeItem(TOKEN_KEY);
                localStorage.removeItem(USER_KEY);
            }
        }
        setLoading(false);
    }, []);

    // Get stored token
    const getToken = useCallback(() => {
        return localStorage.getItem(TOKEN_KEY);
    }, []);

    // Authenticated fetch wrapper
    const fetchWithAuth = useCallback(async (url, options = {}) => {
        const token = localStorage.getItem(TOKEN_KEY);
        const headers = {
            'Content-Type': 'application/json',
            ...(options.headers || {}),
        };
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        return fetch(url, { ...options, headers });
    }, []);

    // Signup
    const signup = useCallback(async (username, email, password) => {
        const res = await fetch('/api/auth/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password }),
        });

        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.detail || 'Signup failed');
        }

        const data = await res.json();
        localStorage.setItem(TOKEN_KEY, data.access_token);
        localStorage.setItem(USER_KEY, JSON.stringify(data.user));
        setUser(data.user);
        return data.user;
    }, []);

    // Login
    const login = useCallback(async (email, password) => {
        const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });

        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.detail || 'Login failed');
        }

        const data = await res.json();
        localStorage.setItem(TOKEN_KEY, data.access_token);
        localStorage.setItem(USER_KEY, JSON.stringify(data.user));
        setUser(data.user);
        return data.user;
    }, []);

    // Logout
    const logout = useCallback(() => {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        setUser(null);
    }, []);

    return {
        user,
        loading,
        isLoggedIn: !!user,
        signup,
        login,
        logout,
        getToken,
        fetchWithAuth,
    };
}
