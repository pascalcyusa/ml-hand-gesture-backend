import { useState, useEffect, useCallback } from 'react';
import {
    GlobeAltIcon,
    MagnifyingGlassIcon,
    ArrowDownTrayIcon,
    InboxIcon,
} from '@heroicons/react/24/outline';
import { Button } from '../ui/button.jsx';
import { Card } from '../ui/card.jsx';
import { Input } from '../ui/input.jsx';
import { Badge } from '../ui/badge.jsx';
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
                    <h2 className="flex items-center gap-2">
                        <GlobeAltIcon className="h-6 w-6 text-[var(--blue)]" />
                        Community Models
                    </h2>
                    <p className="community-subtitle">
                        Browse and import gesture models shared by other users
                    </p>
                </div>
            </div>

            <Card className="flex items-center gap-4 py-3 px-4">
                <div className="relative flex-1">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--fg-muted)]" />
                    <Input
                        className="pl-9"
                        placeholder="Search models by name..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <span className="text-xs font-mono text-[var(--fg-muted)] whitespace-nowrap">
                    {models.length} model{models.length !== 1 ? 's' : ''} found
                </span>
            </Card>

            {loading ? (
                <div className="community-loading">
                    <div className="spinner" />
                    <span>Loading models...</span>
                </div>
            ) : models.length === 0 ? (
                <Card className="flex flex-col items-center justify-center gap-4 py-12 text-center">
                    <InboxIcon className="h-12 w-12 text-[var(--fg-muted)] opacity-40" />
                    <h3 className="text-lg font-bold text-[var(--fg-dim)]">No Public Models Yet</h3>
                    <p className="text-sm text-[var(--fg-muted)] max-w-[400px]">
                        Be the first to share! Save a model and toggle "Public" to share it with the community.
                    </p>
                </Card>
            ) : (
                <div className="community-grid">
                    {models.map((model) => (
                        <Card key={model.id} className="community-card">
                            <div className="community-card-header">
                                <h4 className="font-bold">{model.name}</h4>
                                <span className="text-xs font-mono text-[var(--fg-muted)]">
                                    by {model.author}
                                </span>
                            </div>

                            {model.description && (
                                <p className="text-xs text-[var(--fg-dim)] leading-relaxed">{model.description}</p>
                            )}

                            <div className="flex flex-wrap gap-1">
                                {model.class_names.map((cls, i) => (
                                    <Badge key={i} variant="info">{cls}</Badge>
                                ))}
                            </div>

                            <div className="community-card-footer">
                                <span className="text-[0.7rem] font-mono text-[var(--fg-muted)]">
                                    {new Date(model.created_at).toLocaleDateString()}
                                </span>
                                <Button
                                    variant="primary"
                                    size="sm"
                                    onClick={() => handleImport(model.id)}
                                    disabled={importing === model.id}
                                >
                                    <ArrowDownTrayIcon className="h-3.5 w-3.5" />
                                    {importing === model.id ? 'Importing...' : 'Import'}
                                </Button>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
