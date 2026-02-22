// frontend/src/config.js

// Determine the API base URL based on environment variables or defaults.
// VITE_API_URL should be set in .env or deployment configuration.
// If VITE_API_URL is not set, we default to localhost for development.
const VITE_API_URL = import.meta.env.VITE_API_URL;

// Ensure we don't have a trailing slash, to make concatenation consistent.
const cleanUrl = (url) => url ? url.replace(/\/$/, '') : '';

export const API_BASE_URL = cleanUrl(VITE_API_URL || 'http://localhost:8000');
