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
    StopIcon,
    TrashIcon,
} from '@heroicons/react/24/outline';
import { useStorageManager } from '../../hooks/useStorageManager.js';
import { useSessionStorage } from '../../hooks/useSessionStorage.js';
import { useAuth } from '../../hooks/useAuth.js';
import { Button } from '../ui/button.jsx';
import { Card } from '../ui/card.jsx';
import { Input } from '../ui/input.jsx';
import ModalPortal from '../common/ModalPortal.jsx';
import ConfirmDialog from '../common/ConfirmDialog.jsx';
import MotorSequencer from '../Piano/MotorSequencer.jsx';
import WebcamPanel from '../Training/WebcamPanel.jsx';
import PredictionBars from '../Training/PredictionBars.jsx';
import { generateMotorCommand, encodeCommand } from '../../utils/spikeProtocol.js';
import './MotorsTab.css';

export default function MotorsTab({ classNames, showToast, hand, prediction, ble, trainer }) {
    const storage = useStorageManager();
    const { user } = useAuth();

    const [showSaveDialog, setShowSaveDialog] = useState(false);
    const [showLoadDialog, setShowLoadDialog] = useState(false);
    const [saveName, setSaveName] = useState('');
    const [savedConfigs, setSavedConfigs] = useState([]);
    const [configData, setConfigData] = useSessionStorage('motors_draft', {}); // { className: config[] }
    const [isPlaying, setIsPlaying] = useState(false);
    const [isCameraStarted, setIsCameraStarted] = useState(hand.isRunning);
    const videoReadyRef = useRef(false);
    const lastPredRef = useRef(null);
    const lastTimeRef = useRef(0);
    const playCancelledRef = useRef(false);

    const [deleteConfirm, setDeleteConfirm] = useState({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: null
    });

    const handleConfigChange = useCallback((className, config) => {
        setConfigData(prev => ({
            ...prev,
            [className]: config
        }));
    }, [setConfigData]);

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

        const success = await storage.saveGestureMapping(saveName, configData, true);
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

    const handleDelete = (id, name) => {
        setDeleteConfirm({
            isOpen: true,
            title: 'Delete Configuration',
            message: `Are you sure you want to delete configuration "${name}"?`,
            onConfirm: async () => {
                const success = await storage.deleteGestureMapping(id);
                if (success) {
                    setSavedConfigs(prev => prev.filter(c => c.id !== id));
                    showToast("Configuration deleted", "success");
                } else {
                    showToast("Failed to delete", "error");
                }
                setDeleteConfirm(prev => ({ ...prev, isOpen: false }));
            }
        });
    };

    const playSequence = useCallback(async (className) => {
        const config = configData[className];
        if (!config || !Array.isArray(config) || config.length === 0) return;

        setIsPlaying(true);
        try {
            let combinedCmd = 'import hub\nimport motor\nfrom hub import port\n';
            for (const motor of config) {
                if (motor.action === 'stop') {
                    const cmdString = generateMotorCommand(motor.port, 'stop', 0, 0);
                    if (cmdString) combinedCmd += cmdString;
                    continue;
                }

                const cmdString = generateMotorCommand(motor.port, motor.action, motor.speed, motor.degrees);
                if (cmdString) combinedCmd += cmdString;
            }
            
            if (combinedCmd) {
                const bytes = encodeCommand(combinedCmd);
                await ble.write(bytes);
            }
        } catch (err) {
            console.error(`Error playing sequence for ${className}:`, err);
        } finally {
            setIsPlaying(false);
        }
    }, [configData, ble]);

    // React to ML predictions
    useEffect(() => {
        const topPrediction = prediction.topPrediction;
        
        if (!topPrediction || isPlaying) {
            if (!topPrediction) {
                lastPredRef.current = null;
            }
            return;
        }

        if (!ble.device?.connected) return;

        const now = Date.now();
        // Debounce: prevent same class from spamming commands constantly
        if (topPrediction.className === lastPredRef.current && now - lastTimeRef.current < 1000) {
            return; 
        }

        lastPredRef.current = topPrediction.className;
        lastTimeRef.current = now;

        playSequence(topPrediction.className);
    }, [prediction.topPrediction, isPlaying, playSequence, ble.device?.connected]);

    const handleStopAll = useCallback(async () => {
        playCancelledRef.current = true;
        setIsPlaying(false);
        lastPredRef.current = null;
        if (!ble.device?.connected) return;
        try {
            const stopCmds = 'import hub\nimport motor\nfrom hub import port\n' +
                ['A', 'B', 'C', 'D', 'E', 'F']
                    .map(p => `try:\n    motor.stop(port.${p})\nexcept:\n    pass\n`)
                    .join('');
            await ble.write(encodeCommand(stopCmds));
        } catch (err) {
            console.error("Stop All Error:", err);
        }
    }, [ble]);

    // Play All Logic
    const handlePlayAll = useCallback(async () => {
        if (isPlaying) return;
        if (!ble.device?.connected) {
            showToast('Connect LEGO Hub first!', 'warning');
            return;
        }

        playCancelledRef.current = false;
        setIsPlaying(true);
        try {
            for (const name of classNames) {
                if (playCancelledRef.current) break;
                // Get config for this class. 
                const config = configData[name];

                if (config && Array.isArray(config)) {
                    await showToast(`Executing ${name}...`, 'info', 1000);
                    if (playCancelledRef.current) break;

                    let classCmds = 'import hub\nimport motor\nfrom hub import port\n';
                    for (const motor of config) {
                        if (motor.action === 'stop') continue;

                        const cmdString = generateMotorCommand(motor.port, motor.action, motor.speed, motor.degrees);
                        if (cmdString) classCmds += cmdString;
                    }
                    
                    // Only send if it contains more than just the imports
                    if (classCmds.split('\n').length > 4) {
                        await ble.write(encodeCommand(classCmds));
                    }

                    // Fixed delay between classes 
                    await new Promise(r => setTimeout(r, 2000));
                    if (playCancelledRef.current) break;

                    // Stop motors before next class (safety)
                    let stopCmds = 'import hub\nimport motor\nfrom hub import port\n';
                    for (const port of ['A', 'B', 'C', 'D', 'E', 'F']) {
                        const stopCmd = generateMotorCommand(port, 'stop', 0, 0);
                        if (stopCmd) stopCmds += stopCmd;
                    }
                    if (stopCmds.split('\n').length > 4) {
                        await ble.write(encodeCommand(stopCmds));
                    }
                }
            }
            if (!playCancelledRef.current) {
                showToast('Done playing all steps', 'success');
            } else {
                showToast('Stopped sequence', 'info');
            }
        } catch (err) {
            console.error("Play All Error:", err);
            showToast("Error executing commands", 'error');
        } finally {
            setIsPlaying(false);
            playCancelledRef.current = false;
        }
    }, [classNames, ble, isPlaying, configData, showToast]);

    if (!classNames || classNames.length === 0 || !trainer?.isTrained) {
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
                    <h2 className="text-xl font-bold text-[var(--fg-dim)]">Model Not Trained</h2>
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
                    showVideo={hand.showVideo}
                    onToggleVideo={hand.setShowVideo}
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
                            <Button
                                variant="danger"
                                size="sm"
                                onClick={handleStopAll}
                            >
                                <StopIcon className="h-4 w-4 mr-1.5" />
                                Stop
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
