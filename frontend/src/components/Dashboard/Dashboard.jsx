import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeftIcon,
    CubeIcon,
    MusicalNoteIcon,
    CogIcon,
    ChatBubbleLeftRightIcon,
    UserCircleIcon,
    LockClosedIcon,
    GlobeAltIcon,
    TrashIcon
} from '@heroicons/react/24/outline';
import { useStorageManager } from '../../hooks/useStorageManager.js';
import { Button } from '../ui/button.jsx';
import ConfirmDialog from '../common/ConfirmDialog.jsx';
import ProfileSettings from './ProfileSettings.jsx';
import SecuritySettings from './SecuritySettings.jsx';
import './Dashboard.css';

export default function Dashboard({ showToast, onBack, onLoadModel, auth }) {
    const { user, logout, updateProfile, updatePassword } = auth;
    const storage = useStorageManager();
    const navigate = useNavigate();

    // Data States
    const [savedModels, setSavedModels] = useState([]);
    const [savedPiano, setSavedPiano] = useState([]);

    const [savedGestures, setSavedGestures] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const [deleteConfirm, setDeleteConfirm] = useState({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: null
    });

    // UI State
    const [activeTab, setActiveTab] = useState('profile');

    // Fetch Data for counts
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
                // showToast("Failed to load your data", "error");
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    }, [user, storage]);

    const handleProfileUpdate = async (data) => {
        try {
            await updateProfile(data);
            showToast("Profile updated successfully", "success");
        } catch (err) {
            showToast("Failed to update profile", "error");
            throw err;
        }
    };

    const handlePasswordUpdate = async (currentPassword, newPassword) => {
        try {
            await updatePassword(currentPassword, newPassword);
            showToast("Password updated successfully", "success");
        } catch (err) {
            showToast("Failed to update password", "error");
            throw err;
        }
    };

    const handleDeleteModel = (id, name) => {
        setDeleteConfirm({
            isOpen: true,
            title: 'Delete Model',
            message: `Are you sure you want to delete model "${name}"?`,
            onConfirm: async () => {
                const success = await storage.deleteModel(id);
                if (success) {
                    setSavedModels(prev => prev.filter(m => m.id !== id));
                    showToast(`Model "${name}" deleted`, "success");
                } else {
                    showToast("Failed to delete model", "error");
                }
                setDeleteConfirm(prev => ({ ...prev, isOpen: false }));
            }
        });
    };

    const handleDeletePiano = (id, title) => {
        setDeleteConfirm({
            isOpen: true,
            title: 'Delete Sequence',
            message: `Are you sure you want to delete piano sequence "${title}"?`,
            onConfirm: async () => {
                const success = await storage.deletePianoSequence(id);
                if (success) {
                    setSavedPiano(prev => prev.filter(s => s.id !== id));
                    showToast("Sequence deleted", "success");
                } else {
                    showToast("Failed to delete sequence", "error");
                }
                setDeleteConfirm(prev => ({ ...prev, isOpen: false }));
            }
        });
    };

    const handleDeleteGesture = (id, name) => {
        setDeleteConfirm({
            isOpen: true,
            title: 'Delete Configuration',
            message: `Are you sure you want to delete motor config "${name}"?`,
            onConfirm: async () => {
                const success = await storage.deleteGestureMapping(id);
                if (success) {
                    setSavedGestures(prev => prev.filter(g => g.id !== id));
                    showToast("Configuration deleted", "success");
                } else {
                    showToast("Failed to delete configuration", "error");
                }
                setDeleteConfirm(prev => ({ ...prev, isOpen: false }));
            }
        });
    };

    const handleVisibilityToggle = async (model) => {
        const newStatus = !model.is_public;
        const success = await storage.updateModelVisibility(model.id, newStatus);

        if (success) {
            setSavedModels(prev => prev.map(m =>
                m.id === model.id ? { ...m, is_public: newStatus } : m
            ));
            showToast(`Model is now ${newStatus ? 'Public' : 'Private'}`, 'success');
        } else {
            showToast("Failed to update visibility", "error");
        }
    };

    const handlePianoVisibilityToggle = async (seq) => {
        const newStatus = !seq.is_public;
        const success = await storage.updatePianoVisibility(seq.id, newStatus);

        if (success) {
            setSavedPiano(prev => prev.map(s =>
                s.id === seq.id ? { ...s, is_public: newStatus } : s
            ));
            showToast(`Sequence is now ${newStatus ? 'Public' : 'Private'}`, 'success');
        } else {
            showToast("Failed to update visibility", "error");
        }
    };

    const handleGestureVisibilityToggle = async (config) => {
        const newStatus = !config.is_public;
        const success = await storage.updateGestureVisibility(config.id, newStatus);

        if (success) {
            setSavedGestures(prev => prev.map(c =>
                c.id === config.id ? { ...c, is_public: newStatus } : c
            ));
            showToast(`Configuration is now ${newStatus ? 'Public' : 'Private'}`, 'success');
        } else {
            showToast("Failed to update visibility", "error");
        }
    };

    if (!user) return <div className="p-8 text-center text-[var(--fg-muted)]">Please log in.</div>;

    return (
        <div className="dashboard-container animate-fade-in">
            {/* ... rest of the file ... */}

            {/* ── Main Content ── */}
            <div className="dashboard-content">

                {/* Page Header Row */}
                <div className="dashboard-header-row">
                    <h1 className="page-title">Account Settings</h1>
                    <div className="flex gap-4">
                        <Button variant="accent" onClick={() => {
                            logout();
                            showToast('Logged out', 'info');
                            navigate('/');
                        }} className="bg-[var(--primary)] text-white hover:bg-[var(--primary-dim)] border-none">
                            Sign out
                        </Button>
                    </div>
                </div>

                {/* ── Two Column Layout ── */}
                <div className="profile-grid">

                    {/* Left Sidebar: User Info */}
                    <aside className="user-sidebar">
                        <div className="user-identity">
                            <div className="user-avatar-large">
                                {user.username.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <h2 className="user-name">{user.username}</h2>
                                <p className="user-email">{user.email}</p>
                            </div>
                        </div>

                        {/* Navigation Menu */}
                        <div className="sidebar-menu">
                            <div
                                className={`sidebar-item ${activeTab === 'profile' ? 'active' : ''}`}
                                onClick={() => setActiveTab('profile')}
                            >
                                <UserCircleIcon className="w-5 h-5 inline mr-2" />
                                Personal information
                            </div>
                            <div
                                className={`sidebar-item ${activeTab === 'security' ? 'active' : ''}`}
                                onClick={() => setActiveTab('security')}
                            >
                                <LockClosedIcon className="w-5 h-5 inline mr-2" />
                                Security
                            </div>

                            <div className="h-px bg-[var(--bg2)] my-2" />

                            <div
                                className={`sidebar-item ${activeTab === 'models' ? 'active' : ''}`}
                                onClick={() => setActiveTab('models')}
                            >
                                <CubeIcon className="w-5 h-5 inline mr-2" />
                                Saved Models <span className="text-xs bg-[var(--bg2)] px-2 py-0.5 rounded-full ml-auto">{savedModels.length}</span>
                            </div>
                            <div
                                className={`sidebar-item ${activeTab === 'piano' ? 'active' : ''}`}
                                onClick={() => setActiveTab('piano')}
                            >
                                <MusicalNoteIcon className="w-5 h-5 inline mr-2" />
                                Piano Sequences <span className="text-xs bg-[var(--bg2)] px-2 py-0.5 rounded-full ml-auto">{savedPiano.length}</span>
                            </div>
                            <div
                                className={`sidebar-item ${activeTab === 'motors' ? 'active' : ''}`}
                                onClick={() => setActiveTab('motors')}
                            >
                                <CogIcon className="w-5 h-5 inline mr-2" />
                                Motor Configs <span className="text-xs bg-[var(--bg2)] px-2 py-0.5 rounded-full ml-auto">{savedGestures.length}</span>
                            </div>
                        </div>
                    </aside>

                    {/* Right Content */}
                    <main className="main-section">

                        {activeTab === 'profile' && (
                            <>
                                <div className="section-heading">
                                    <h2>Personal Information</h2>
                                    <p>Manage your profile and account details.</p>
                                </div>
                                <ProfileSettings user={user} onUpdate={handleProfileUpdate} />
                            </>
                        )}

                        {activeTab === 'security' && (
                            <>
                                <div className="section-heading">
                                    <h2>Security</h2>
                                    <p>Update your password and security settings.</p>
                                </div>
                                <SecuritySettings onUpdatePassword={handlePasswordUpdate} />
                            </>
                        )}

                        {activeTab === 'models' && (
                            <>
                                <div className="section-heading">
                                    <h2>Saved Models</h2>
                                    <p>View and load your trained gesture models.</p>
                                </div>
                                <div className="info-cards-grid">
                                    {savedModels.length === 0 ? (
                                        <div className="col-span-full text-[var(--fg-muted)] italic">No models found.</div>
                                    ) : (
                                        savedModels.map(model => (
                                            <div key={model.id} className="info-card relative group">
                                                <div className="absolute bottom-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                                    <button
                                                        className={`p-1.5 rounded-lg transition-all ${model.is_public ? 'text-[var(--primary)] bg-[var(--bg2)]' : 'text-[var(--fg-muted)] hover:text-[var(--primary)] hover:bg-[var(--bg3)]'}`}
                                                        onClick={(e) => { e.stopPropagation(); handleVisibilityToggle(model); }}
                                                        title={model.is_public ? "Make Private" : "Make Public"}
                                                    >
                                                        {model.is_public ? <GlobeAltIcon className="w-4 h-4" /> : <LockClosedIcon className="w-4 h-4" />}
                                                    </button>
                                                    <button
                                                        className="p-1.5 text-[var(--fg-muted)] hover:text-[var(--red)] hover:bg-[var(--bg3)] rounded-lg"
                                                        onClick={(e) => { e.stopPropagation(); handleDeleteModel(model.id, model.name); }}
                                                        title="Delete Model"
                                                    >
                                                        <TrashIcon className="w-4 h-4" />
                                                    </button>
                                                </div>
                                                <div className="card-header">
                                                    <span className="card-label truncate max-w-[160px]" title={model.name}>{model.name}</span>
                                                    <CubeIcon className="card-icon" />
                                                </div>
                                                <div className="card-value">
                                                    {model.class_names.length} Classes • <span className={model.is_public ? "text-[var(--primary)]" : "text-[var(--fg-muted)]"}>{model.is_public ? 'Public' : 'Private'}</span>
                                                </div>
                                                <div className="card-meta">
                                                    Created: {new Date(model.created_at).toLocaleDateString()}
                                                </div>
                                                <div
                                                    className="card-action-btn"
                                                    onClick={() => onLoadModel(model.id)}
                                                >
                                                    Load Model →
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </>
                        )}

                        {activeTab === 'piano' && (
                            <>
                                <div className="section-heading">
                                    <h2>Piano Sequences</h2>
                                    <p>View and load your recorded piano sequences.</p>
                                </div>
                                <div className="info-cards-grid">
                                    {savedPiano.length === 0 ? (
                                        <div className="col-span-full text-[var(--fg-muted)] italic">No sequences found.</div>
                                    ) : (
                                        savedPiano.map((seq, idx) => (
                                            <div key={seq.id || idx} className="info-card relative group">
                                                <div className="absolute bottom-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                                    <button
                                                        className={`p-1.5 rounded-lg transition-all ${seq.is_public ? 'text-[var(--primary)] bg-[var(--bg2)]' : 'text-[var(--fg-muted)] hover:text-[var(--primary)] hover:bg-[var(--bg3)]'}`}
                                                        onClick={(e) => { e.stopPropagation(); handlePianoVisibilityToggle(seq); }}
                                                        title={seq.is_public ? "Make Private" : "Make Public"}
                                                    >
                                                        {seq.is_public ? <GlobeAltIcon className="w-4 h-4" /> : <LockClosedIcon className="w-4 h-4" />}
                                                    </button>
                                                    <button
                                                        className="p-1.5 text-[var(--fg-muted)] hover:text-[var(--red)] hover:bg-[var(--bg3)] rounded-lg"
                                                        onClick={(e) => { e.stopPropagation(); handleDeletePiano(seq.id, seq.name_or_title); }}
                                                        title="Delete Sequence"
                                                    >
                                                        <TrashIcon className="w-4 h-4" />
                                                    </button>
                                                </div>
                                                <div className="card-header">
                                                    <span className="card-label truncate max-w-[160px]" title={seq.name_or_title}>{seq.name_or_title || `Sequence ${idx + 1}`}</span>
                                                    <MusicalNoteIcon className="card-icon" />
                                                </div>
                                                <div className="card-value">
                                                    {(seq.data?.notes || []).length} Notes • <span className={seq.is_public ? "text-[var(--primary)]" : "text-[var(--fg-muted)]"}>{seq.is_public ? 'Public' : 'Private'}</span>
                                                </div>
                                                <div className="card-action-btn" onClick={() => navigate('/piano')}>
                                                    Load Sequence →
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </>
                        )}

                        {activeTab === 'motors' && (
                            <>
                                <div className="section-heading">
                                    <h2>Motor Configurations</h2>
                                    <p>View and load your motor configurations.</p>
                                </div>
                                <div className="info-cards-grid">
                                    {savedGestures.length === 0 ? (
                                        <div className="col-span-full text-[var(--fg-muted)] italic">No configurations found.</div>
                                    ) : (
                                        savedGestures.map((config, idx) => (
                                            <div key={config.id || idx} className="info-card relative group">
                                                <div className="absolute bottom-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                                    <button
                                                        className={`p-1.5 rounded-lg transition-all ${config.is_public ? 'text-[var(--primary)] bg-[var(--bg2)]' : 'text-[var(--fg-muted)] hover:text-[var(--primary)] hover:bg-[var(--bg3)]'}`}
                                                        onClick={(e) => { e.stopPropagation(); handleGestureVisibilityToggle(config); }}
                                                        title={config.is_public ? "Make Private" : "Make Public"}
                                                    >
                                                        {config.is_public ? <GlobeAltIcon className="w-4 h-4" /> : <LockClosedIcon className="w-4 h-4" />}
                                                    </button>
                                                    <button
                                                        className="p-1.5 text-[var(--fg-muted)] hover:text-[var(--red)] hover:bg-[var(--bg3)] rounded-lg"
                                                        onClick={(e) => { e.stopPropagation(); handleDeleteGesture(config.id, config.name_or_title); }}
                                                        title="Delete Config"
                                                    >
                                                        <TrashIcon className="w-4 h-4" />
                                                    </button>
                                                </div>
                                                <div className="card-header">
                                                    <span className="card-label truncate max-w-[160px]" title={config.name_or_title}>{config.name_or_title || `Config ${idx + 1}`}</span>
                                                    <CogIcon className="card-icon" />
                                                </div>
                                                <div className="card-value">
                                                    {Object.keys(config.data || {}).length} Mappings • <span className={config.is_public ? "text-[var(--primary)]" : "text-[var(--fg-muted)]"}>{config.is_public ? 'Public' : 'Private'}</span>
                                                </div>
                                                <div className="card-action-btn" onClick={() => navigate('/motors')}>
                                                    Load Configuration →
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </>
                        )}

                    </main>
                </div>
            </div>

            <ConfirmDialog
                isOpen={deleteConfirm.isOpen}
                title={deleteConfirm.title}
                message={deleteConfirm.message}
                onConfirm={deleteConfirm.onConfirm}
                onCancel={() => setDeleteConfirm(prev => ({ ...prev, isOpen: false }))}
                confirmText="Delete"
                isDangerous={true}
            />
        </div>
    );
}