/**
 * CommunityTab — Browse and import public models from other users
 */

import { useState, useEffect, useCallback } from 'react';
import './CommunityTab.css';

export default function CommunityTab({ auth, onImportModel, showToast }) {
    const [models, setModels] = useState([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(false);
    const [importing, setImporting] = useState(null);

    const fetchModels = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (search.trim()) params.set('search', search.trim());
            params.set('limit', '50');
            const res = await fetch(`/api/models/community?${params}`);
            if (res.ok) {
                setModels(await res.json());
            }
        } catch (err) {
            console.error('Failed to fetch community models:', err);
        } finally {
            setLoading(false);
        }
    }, [search]);

    useEffect(() => {
        fetchModels();
    }, [fetchModels]);

    const handleImport = useCallback(async (modelId) => {
        setImporting(modelId);
        try {
            const res = await fetch(`/api/models/${modelId}`);
            if (!res.ok) throw new Error('Failed to fetch model');
            const data = await res.json();

            if (onImportModel) {
                await onImportModel(data);
                showToast(`Imported "${data.name}" successfully!`, 'success');
            }
        } catch (err) {
            showToast(`Import failed: ${err.message}`, 'error');
        } finally {
            setImporting(null);
        }
    }, [onImportModel, showToast]);

    return (
        <div className="community-tab animate-fade-in">
            <div className="community-header">
                <div className="community-header-text">
                    <h2>🌍 Community Models</h2>
                    <p className="community-subtitle">
                        Browse and import gesture models shared by other users
                    </p>
                </div>
            </div>

            <div className="community-search card">
                <input
                    type="text"
                    className="community-search-input"
                    placeholder="🔍 Search models by name..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
                <span className="community-count">
                    {models.length} model{models.length !== 1 ? 's' : ''} found
                </span>
            </div>

            {loading ? (
                <div className="community-loading">
                    <span className="community-spinner">⏳</span>
                    <span>Loading models...</span>
                </div>
            ) : models.length === 0 ? (
                <div className="community-empty card">
                    <span className="community-empty-icon">📭</span>
                    <h3>No Public Models Yet</h3>
                    <p>Be the first to share! Save a model and toggle "Public" to share it with the community.</p>
                </div>
            ) : (
                <div className="community-grid">
                    {models.map((model) => (
                        <div key={model.id} className="community-card card">
                            <div className="community-card-header">
                                <h4 className="community-card-name">{model.name}</h4>
                                <span className="community-card-author">by {model.author}</span>
                            </div>

                            {model.description && (
                                <p className="community-card-desc">{model.description}</p>
                            )}

                            <div className="community-card-classes">
                                {model.class_names.map((cls, i) => (
                                    <span key={i} className="community-class-tag">{cls}</span>
                                ))}
                            </div>

                            <div className="community-card-footer">
                                <span className="community-card-date">
                                    {new Date(model.created_at).toLocaleDateString()}
                                </span>
                                <button
                                    className="btn btn-primary btn-sm"
                                    onClick={() => handleImport(model.id)}
                                    disabled={importing === model.id}
                                >
                                    {importing === model.id ? '⏳ Importing...' : '📥 Import'}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
