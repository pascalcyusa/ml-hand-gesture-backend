// Central configuration for API URL
// In development, this will use http://localhost:8000
// In production, this should be set via VITE_API_URL environment variable

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
