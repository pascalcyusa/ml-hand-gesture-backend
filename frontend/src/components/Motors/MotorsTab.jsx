/**
 * MotorsTab — Standalone motor control configuration per class
 *
 * Modified to save/load configurations to backend.
 */
import { useState, useRef, useCallback, useEffect } from 'react';
import {
    CogIcon,
    CloudArrowUpIcon,
    CloudArrowDownIcon,
} from '@heroicons/react/24/outline';
import { useStorageManager } from '../../hooks/useStorageManager.js';
import { useAuth } from '../../hooks/useAuth.js';
import { Button } from '../ui/button.jsx';
import { Card } from '../ui/card.jsx';
import { Input } from '../ui/input.jsx';
import MotorSequencer from '../Piano/MotorSequencer.jsx';
import WebcamPanel from '../Training/WebcamPanel.jsx';
import PredictionBars from '../Training/PredictionBars.jsx';
import './MotorsTab.css';

export default function MotorsTab({ classNames, showToast, hand, prediction }) {
    const storage = useStorageManager();
    const { user } = useAuth();

    const [showSaveDialog, setShowSaveDialog] = useState(false);
    const [showLoadDialog, setShowLoadDialog] = useState(false);
    const [saveName, setSaveName] = useState('');
    const [savedConfigs, setSavedConfigs] = useState([]);
    const [configData, setConfigData] = useState({}); // { className: config[] }

    // Store state in a ref to avoid re-renders but have access for saving
    const currentConfigsRef = useRef({});

    const handleConfigChange = useCallback((className, config) => {
        currentConfigsRef.current[className] = config;
    }, []);

    // Start camera when tab mounts
    const handleVideoReady = useCallback((video, canvas) => {
        hand.start(video, canvas);
    }, [hand]);

    const handleSave = async () => {
        if (!saveName.trim()) return showToast('Enter a name', 'warning');

        const success = await storage.saveGestureMapping(saveName, currentConfigsRef.current, true);
        if (success) {
            showToast('Configuration saved!', 'success');
            setShowSaveDialog(false);
        } else {
            showToast('Failed to save', 'error');
        }
    };

    const handleLoadList = async () => {
        const list = await storage.getGestureMappings();
        setSavedConfigs(list);
        setShowLoadDialog(true);
    };

    const handleLoad = (config) => {
        if (config.data) {
            setConfigData(config.data);
            showToast(`Loaded "${config.name_or_title}"`, 'success');
            setShowLoadDialog(false);
        }
    };

    if (!classNames || classNames.length === 0) {
        return (
            <div className="motors-tab">
                <Card className="flex flex-col items-center justify-center gap-4 py-12 text-center">
                    <CogIcon className="h-12 w-12 text-[var(--fg-muted)] opacity-40" />
                    <h2 className="text-lg font-bold">Motor Controls</h2>
                    <p className="text-sm text-[var(--fg-dim)] max-w-[400px]">
                        Train at least one class in the Train tab to configure motor actions.
                    </p>
                </Card>
            </div>
        );
    }

    return (
        <div className="motors-layout animate-fade-in relative">
            {/* ── Save Dialog ── */}
            {showSaveDialog && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <Card className="w-full max-w-sm p-5 space-y-4 shadow-2xl">
                        <h3 className="font-bold">Save Configuration</h3>
                        <Input
                            placeholder="e.g. Robot Arm Setup"
                            value={saveName}
                            onChange={e => setSaveName(e.target.value)}
                        />
                        <div className="flex justify-end gap-2">
                            <Button variant="ghost" onClick={() => setShowSaveDialog(false)}>Cancel</Button>
                            <Button onClick={handleSave}>Save</Button>
                        </div>
                    </Card>
                </div>
            )}

            {/* ── Load Dialog ── */}
            {showLoadDialog && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <Card className="w-full max-w-md p-5 space-y-4 shadow-2xl max-h-[80vh] flex flex-col">
                        <div className="flex justify-between items-center">
                            <h3 className="font-bold">Load Configuration</h3>
                            <Button variant="ghost" size="sm" onClick={() => setShowLoadDialog(false)}>Close</Button>
                        </div>
                        <div className="overflow-y-auto space-y-2 flex-1">
                            {savedConfigs.length === 0 ? <p className="text-sm text-[var(--fg-muted)]">No saved configs.</p> :
                                savedConfigs.map(s => (
                                    <button key={s.id} onClick={() => handleLoad(s)} className="w-full text-left p-3 rounded bg-[var(--bg3)] hover:bg-[var(--bg2)] flex justify-between">
                                        <span className="font-medium">{s.name_or_title}</span>
                                        <span className="text-xs text-[var(--fg-muted)]">{new Date(s.created_at).toLocaleDateString()}</span>
                                    </button>
                                ))}
                        </div>
                    </Card>
                </div>
            )}

            {/* Left Column: Camera & Predictions */}
            <div className="motors-left flex flex-col gap-6">
                <WebcamPanel
                    onVideoReady={handleVideoReady}
                    isDetecting={hand.isHandDetected || prediction.isPredicting}
                />
                <PredictionBars
                    predictions={prediction.predictions}
                    classNames={classNames}
                />
            </div>

            {/* Right Column: Motor Controls */}
            <div className="motors-right flex flex-col gap-6">
                <div>
                    <div className="motors-header flex justify-between items-start">
                        <div className="flex items-center gap-2">
                            <CogIcon className="h-6 w-6 text-[var(--orange)]" />
                            <h2>Motor Controls</h2>
                        </div>

                        {user && (
                            <div className="flex items-center gap-2">
                                <Button variant="ghost" size="sm" onClick={handleLoadList}>
                                    <CloudArrowDownIcon className="h-4 w-4 mr-1.5" />
                                    Load
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => setShowSaveDialog(true)}>
                                    <CloudArrowUpIcon className="h-4 w-4 mr-1.5" />
                                    Save
                                </Button>
                            </div>
                        )}
                    </div>
                    <p className="motors-subtitle mt-1">
                        Configure motor actions for each gesture class. Connect your LEGO Spike Prime in the Devices tab.
                    </p>
                </div>

                <div className="motors-section-list mt-6 space-y-4">
                    {classNames.map((name, i) => (
                        <MotorSequencer
                            key={`motor-${name}-${i}`}
                            className={name}
                            classId={i}
                            onConfigChange={(config) => handleConfigChange(name, config)}
                            initialConfig={configData[name]}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}
