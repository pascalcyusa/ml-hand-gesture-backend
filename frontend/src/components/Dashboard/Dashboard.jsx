import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeftIcon,
    CubeIcon,
    MusicalNoteIcon,
    CogIcon,
    ChatBubbleLeftRightIcon,
    UserCircleIcon,
    LockClosedIcon
} from '@heroicons/react/24/outline';
import { useStorageManager } from '../../hooks/useStorageManager.js';
import { Button } from '../ui/button.jsx';
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

    const handlePasswordUpdate = async (current, newPass) => {
        try {
            await updatePassword(current, newPass);
            showToast("Password updated successfully", "success");
        } catch (err) {
            showToast("Failed to update password", "error");
            throw err;
        }
    };

    if (!user) return <div className="p-8 text-center text-[var(--fg-muted)]">Please log in.</div>;

    return (
        <div className="dashboard-container animate-fade-in">

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
                        }} className="bg-[var(--gold)] text-white hover:bg-[var(--gold-dim)] border-none">
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
                                            <div key={model.id} className="info-card">
                                                <div className="card-header">
                                                    <span className="card-label">{model.name}</span>
                                                    <CubeIcon className="card-icon" />
                                                </div>
                                                <div className="card-value">
                                                    {model.class_names.length} Classes • {model.is_public ? 'Public' : 'Private'}
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
                                            <div key={idx} className="info-card">
                                                <div className="card-header">
                                                    <span className="card-label">{seq.name || `Sequence ${idx + 1}`}</span>
                                                    <MusicalNoteIcon className="card-icon" />
                                                </div>
                                                <div className="card-value">
                                                    {seq.notes?.length || 0} Notes
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
                                            <div key={idx} className="info-card">
                                                <div className="card-header">
                                                    <span className="card-label">{config.name || `Config ${idx + 1}`}</span>
                                                    <CogIcon className="card-icon" />
                                                </div>
                                                <div className="card-value">
                                                    {Object.keys(config.mappings || {}).length} Mappings
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
        </div>
    );
}