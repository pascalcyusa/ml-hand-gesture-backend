/**
 * Dashboard.jsx — User settings and saved items management
 * 
 * Shows account info, saved models, and saved configurations.
 * Only accessible when logged in.
 */

import { useState, useEffect } from 'react';
import {
    UserCircleIcon,
    TrashIcon,
    ArrowRightOnRectangleIcon,
    CubeIcon,
    MusicalNoteIcon,
    CogIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../../hooks/useAuth.js';
import { useStorageManager } from '../../hooks/useStorageManager.js';
import { Button } from '../ui/button.jsx';
import { Card } from '../ui/card.jsx';
import { Badge } from '../ui/badge.jsx';
import './Dashboard.css';

export default function Dashboard({ showToast }) {
    const { user, logout } = useAuth();
    const storage = useStorageManager();
    const [savedModels, setSavedModels] = useState([]);
    const [savedPiano, setSavedPiano] = useState([]);
    const [savedGestures, setSavedGestures] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            if (!user) return;
            setIsLoading(true);
            try {
                const [models, piano, gestures] = await Promise.all([
                    storage.listMyModels(),
                    storage.getPianoSequences(),
                    storage.getGestureMappings()
                ]);
                setSavedModels(models);
                setSavedPiano(piano);
                setSavedGestures(gestures);
            } catch (err) {
                console.error("Failed to load dashboard data", err);
                showToast("Failed to load your data", "error");
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    }, [user, storage, showToast]);

    if (!user) {
        return <div className="p-8 text-center text-[var(--fg-muted)]">Please log in to view dashboard.</div>;
    }

    const handleDeleteModel = async (id) => {
        // Implement delete model (requires delete endpoint in storage manager)
        // For now just console log as useStorageManager doesn't expose delete yet
        console.log("Delete model", id);
        showToast("Model deletion not implemented yet", "info");
    };

    return (
        <div className="dashboard-container animate-fade-in">
            <header className="dashboard-header">
                <div className="user-profile">
                    <div className="user-avatar-large">
                        {user.username.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold">{user.username}</h1>
                        <p className="text-[var(--fg-muted)]">{user.email}</p>
                    </div>
                </div>
                <Button variant="outline" onClick={logout} className="ml-auto">
                    <ArrowRightOnRectangleIcon className="h-5 w-5 mr-2" />
                    Sign Out
                </Button>
            </header>

            <div className="dashboard-grid">
                {/* Saved Models Section */}
                <section className="dashboard-section">
                    <h2 className="section-title flex items-center gap-2">
                        <CubeIcon className="h-5 w-5 text-[var(--blue)]" />
                        Saved Models ({savedModels.length})
                    </h2>
                    <div className="items-list">
                        {savedModels.length === 0 ? (
                            <p className="empty-state">No saved models yet. Train a model to save it.</p>
                        ) : (
                            savedModels.map(m => (
                                <Card key={m.id} className="item-card">
                                    <div className="item-info">
                                        <h3 className="font-semibold">{m.name}</h3>
                                        <div className="flex gap-2 text-xs text-[var(--fg-muted)] mt-1">
                                            <span>{new Date(m.created_at).toLocaleDateString()}</span>
                                            <span>•</span>
                                            <span>{m.class_names.length} classes</span>
                                        </div>
                                        {m.description && <p className="text-sm text-[var(--fg-dim)] mt-2 line-clamp-2">{m.description}</p>}
                                    </div>
                                    <div className="item-actions">
                                        {m.is_public && <Badge variant="outline" className="text-xs">Public</Badge>}
                                    </div>
                                </Card>
                            ))
                        )}
                    </div>
                </section>

                {/* Saved Piano Sequences */}
                <section className="dashboard-section">
                    <h2 className="section-title flex items-center gap-2">
                        <MusicalNoteIcon className="h-5 w-5 text-[var(--purple)]" />
                        Piano Sequences ({savedPiano.length})
                    </h2>
                    <div className="items-list">
                        {savedPiano.length === 0 ? (
                            <p className="empty-state">No saved sequences. Configure your piano in the Piano tab.</p>
                        ) : (
                            savedPiano.map(s => (
                                <Card key={s.id} className="item-card">
                                    <div className="item-info">
                                        <h3 className="font-semibold">{s.name_or_title}</h3>
                                        <p className="text-xs text-[var(--fg-muted)] mt-1">
                                            {new Date(s.created_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                    {s.is_active && <Badge variant="default" className="bg-[var(--purple)] text-white text-xs">Active</Badge>}
                                </Card>
                            ))
                        )}
                    </div>
                </section>

                {/* Saved Motor Configs */}
                <section className="dashboard-section">
                    <h2 className="section-title flex items-center gap-2">
                        <CogIcon className="h-5 w-5 text-[var(--orange)]" />
                        Motor Configs ({savedGestures.length})
                    </h2>
                    <div className="items-list">
                        {savedGestures.length === 0 ? (
                            <p className="empty-state">No saved motor configs. Set up your motors in the Motors tab.</p>
                        ) : (
                            savedGestures.map(g => (
                                <Card key={g.id} className="item-card">
                                    <div className="item-info">
                                        <h3 className="font-semibold">{g.name_or_title}</h3>
                                        <p className="text-xs text-[var(--fg-muted)] mt-1">
                                            {new Date(g.created_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                    {g.is_active && <Badge variant="default" className="bg-[var(--orange)] text-white text-xs">Active</Badge>}
                                </Card>
                            ))
                        )}
                    </div>
                </section>
            </div>
        </div>
    );
}
