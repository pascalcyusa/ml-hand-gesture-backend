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
    PlayIcon,
    TrashIcon,
} from '@heroicons/react/24/outline';
import { useStorageManager } from '../../hooks/useStorageManager.js';
import { useAuth } from '../../hooks/useAuth.js';
import { Button } from '../ui/button.jsx';
import { Card } from '../ui/card.jsx';
import { Input } from '../ui/input.jsx';
import ModalPortal from '../common/ModalPortal.jsx';
import MotorSequencer from '../Piano/MotorSequencer.jsx';
import WebcamPanel from '../Training/WebcamPanel.jsx';
import PredictionBars from '../Training/PredictionBars.jsx';
import { generateMotorCommand, encodeCommand } from '../../utils/spikeProtocol.js';
import './MotorsTab.css';

export default function MotorsTab({ classNames, showToast, hand, prediction, ble }) {
    const storage = useStorageManager();
    const { user } = useAuth();

    const [showSaveDialog, setShowSaveDialog] = useState(false);
    const [showLoadDialog, setShowLoadDialog] = useState(false);
    const [saveName, setSaveName] = useState('');
    const [savedConfigs, setSavedConfigs] = useState([]);
    const [configData, setConfigData] = useState({}); // { className: config[] }
    const [isPlaying, setIsPlaying] = useState(false);
    const [isCameraStarted, setIsCameraStarted] = useState(false);
    const videoReadyRef = useRef(false);

    // Store state in a ref to avoid re-renders but have access for saving
    const currentConfigsRef = useRef({});

    const handleConfigChange = useCallback((className, config) => {
        currentConfigsRef.current[className] = config;
    }, []);

    // Start camera when tab mounts
    const handleVideoReady = useCallback((video, canvas) => {
        if (videoReadyRef.current) return;
        videoReadyRef.current = true;
        hand.start(video, canvas);
    }, [hand]);

    const handleStartCamera = useCallback(() => {
        setIsCameraStarted(true);
    }, []);

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

    const handleDelete = async (id, name) => {
        if (!window.confirm(`Delete configuration "${name}"?`)) return;
        const success = await storage.deleteGestureMapping(id);
        if (success) {
            setSavedConfigs(prev => prev.filter(c => c.id !== id));
            showToast("Configuration deleted", "success");
        } else {
            showToast("Failed to delete", "error");
        }
    };

    // Play All Logic
    const handlePlayAll = useCallback(async () => {
        if (isPlaying) return;
        if (!ble.device?.connected) {
            showToast('Connect LEGO Hub first!', 'warning');
            return;
        }

        setIsPlaying(true);
        try {
            for (const name of classNames) {
                // Get config for this class. 
                // Prioritize ref (current edits), fallback to configData (loaded)
                const config = currentConfigsRef.current[name] || configData[name];

                if (config && Array.isArray(config)) {
                    await showToast(`Executing ${name}...`, 'info', 1000);

                    for (const motor of config) {
                        if (motor.action === 'stop') continue;

                        const cmdString = generateMotorCommand(motor.port, motor.action, motor.speed, motor.degrees);
                        if (cmdString) {
                            const bytes = encodeCommand(cmdString);
                            await ble.write(bytes);
                        }
                    }

                    // Fixed delay between classes 
                    await new Promise(r => setTimeout(r, 2000));

                    // Stop motors before next class (safety)
                    for (const port of ['A', 'B', 'C', 'D', 'E', 'F']) {
                        const stopCmd = generateMotorCommand(port, 'stop', 0, 0);
                        if (stopCmd) await ble.write(encodeCommand(stopCmd));
                    }
                }
            }
            showToast('Done playing all steps', 'success');
        } catch (err) {
            console.error("Play All Error:", err);
            showToast("Error executing commands", 'error');
        } finally {
            setIsPlaying(false);
        }
    }, [classNames, ble, isPlaying, configData, showToast]);

    if (!classNames || classNames.length === 0) {
        return (
            <div className="motors-tab animate-fade-in">
                <div className="motors-header">
                    <h2 className="flex items-center gap-2">
                        <CogIcon className="h-6 w-6 text-[var(--gold)]" />
                        Motors
                    </h2>
                </div>

                <Card className="flex flex-col items-center justify-center gap-4 py-12 text-center">
                    <CogIcon className="h-16 w-16 text-[var(--fg-muted)] opacity-20" />
                    <h2 className="text-xl font-bold text-[var(--fg-dim)]">No Model Loaded</h2>
                    <p className="text-[var(--fg-muted)] max-w-[400px]">
                        Train gesture classes in the Train tab, or load a pre-trained model to configure motor actions.
                    </p>
                </Card>
            </div>
        );
    }

    return (
        <div className="motors-layout animate-fade-in relative">
            {/* ── Save Dialog ── */}
            {showSaveDialog && (
                <ModalPortal>
                    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                        <Card className="w-full max-w-sm p-4 space-y-4 shadow-2xl">
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
                </ModalPortal>
            )}

            {/* ── Load Dialog ── */}
            {showLoadDialog && (
                <ModalPortal>
                    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                        <Card className="w-full max-w-sm p-4 space-y-4 shadow-2xl max-h-[400px] flex flex-col">
                            <div className="flex justify-between items-center">
                                <h3 className="font-bold">Load Configuration</h3>
                                <Button variant="ghost" size="sm" onClick={() => setShowLoadDialog(false)}>Close</Button>
                            </div>
                            <div className="overflow-y-auto space-y-2 flex-1">
                                {savedConfigs.length === 0 ? <p className="text-sm text-[var(--fg-muted)]">No saved configs.</p> :
                                    savedConfigs.map(s => (
                                        <div key={s.id} className="flex gap-2 items-center w-full p-2 hover:bg-[var(--bg3)] rounded">
                                            <button onClick={() => handleLoad(s)} className="flex-1 text-left">
                                                <div className="font-medium">{s.name_or_title}</div>
                                                <div className="text-xs text-[var(--fg-muted)]">{new Date(s.created_at).toLocaleDateString()}</div>
                                            </button>
                                            <button
                                                className="p-2 text-[var(--fg-muted)] hover:text-[var(--red)] transition-colors"
                                                onClick={(e) => { e.stopPropagation(); handleDelete(s.id, s.name_or_title); }}
                                                title="Delete"
                                            >
                                                <TrashIcon className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                            </div>
                        </Card>
                    </div>
                </ModalPortal>
            )}

            {/* Left Column: Camera & Predictions */}
            <div className="motors-left flex flex-col gap-6">
                <WebcamPanel
                    onVideoReady={handleVideoReady}
                    isDetecting={hand.isHandDetected || prediction.isPredicting}
                    isStarted={isCameraStarted}
                    onStartCamera={handleStartCamera}
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
                            <CogIcon className="h-6 w-6 text-[var(--gold)]" />
                            <h2>Motors</h2>
                        </div>

                        <div className="flex items-center gap-2">
                            {user && (
                                <>
                                    <Button variant="ghost" size="sm" onClick={handleLoadList}>
                                        <CloudArrowDownIcon className="h-4 w-4 mr-1.5" />
                                        Load
                                    </Button>
                                    <Button variant="ghost" size="sm" onClick={() => setShowSaveDialog(true)}>
                                        <CloudArrowUpIcon className="h-4 w-4 mr-1.5" />
                                        Save
                                    </Button>
                                </>
                            )}
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={handlePlayAll}
                                disabled={isPlaying}
                            >
                                <PlayIcon className="h-4 w-4 mr-1.5" />
                                Play All
                            </Button>
                        </div>
                    </div>
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
