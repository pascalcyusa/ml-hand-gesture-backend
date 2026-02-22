import { useState, useCallback } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';

import './components/Layout/Header.css';

import './components/common/LoadingOverlay.css';

import './components/common/Toast.css';

import Header from './components/Layout/Header.jsx';
import Footer from './components/Layout/Footer.jsx';

import TrainTab from './components/Training/TrainTab.jsx';
import PianoTab from './components/Piano/PianoTab.jsx';
import MotorsTab from './components/Motors/MotorsTab.jsx';
import DevicesTab from './components/Devices/DevicesTab.jsx';
import CommunityTab from './components/Community/CommunityTab.jsx';
import AboutTab from './components/About/AboutTab.jsx';
import Dashboard from './components/Dashboard/Dashboard.jsx';
import AuthModal from './components/common/AuthModal.jsx';
import ResetPasswordHandler from './components/common/ResetPasswordHandler.jsx';
import Toast from './components/common/Toast.jsx';

import { useAuth } from './hooks/useAuth.js';
import { useBLE } from './hooks/useBLE.js';
import { useHandDetection } from './hooks/useHandDetection.js';
import { useClassManager } from './hooks/useClassManager.js';
import { useModelTrainer } from './hooks/useModelTrainer.js';
import { usePredictionManager } from './hooks/usePredictionManager.js';
import { useStorageManager } from './hooks/useStorageManager.js';
import * as tf from '@tensorflow/tfjs';
import { base64ToArrayBuffer } from './utils/helpers.js';

export default function App() {
  const navigate = useNavigate();
  const [toast, setToast] = useState(null);
  const [showAuth, setShowAuth] = useState(false);
  const [authView, setAuthView] = useState('login');
  const [resetToken, setResetToken] = useState('');

  const showToast = useCallback((message, type = 'info', duration = 3000) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), duration);
  }, []);

  const handleOpenReset = useCallback((token) => {
    setAuthView('reset');
    setResetToken(token);
    setShowAuth(true);
  }, []);

  // ── Auth ──
  const auth = useAuth();

  // ── BLE ──
  const ble = useBLE();

  // ── Shared hooks ──
  const hand = useHandDetection();
  const cm = useClassManager();
  const trainer = useModelTrainer();
  const storage = useStorageManager();

  const prediction = usePredictionManager({
    getFeatures: hand.getFeatures,
    predict: trainer.predict,
    classNames: cm.classNames,
  });

  // Import community model into local training
  const handleImportCommunityModel = useCallback(async (cloudModel) => {
    const result = await storage.importFromCloud(cloudModel);
    if (result && result.model) {
      try {
        const { modelTopology, weightSpecs, weightData } = result.model;
        const weightBuffer = base64ToArrayBuffer(weightData);

        const model = await tf.loadLayersModel(tf.io.fromMemory({
          modelTopology,
          weightSpecs,
          weightData: weightBuffer
        }));

        trainer.setModel(model, result.classes.length);
        cm.restoreClasses(result.classes);
        navigate('/train');

        if (!result.dataset || !result.dataset.classes || result.dataset.classes.every(c => !c.samples || c.samples.length === 0)) {
          showToast('Model imported (Pre-trained only). No training samples found.', 'warning');
        } else {
          showToast('Model and samples imported successfully!', 'success');
        }
        return true;
      } catch (err) {
        console.error("Error hydrating imported model:", err);
        showToast('Failed to reconstruct model', 'error');
        return false;
      }
    }
    return false;
  }, [storage, trainer, cm, navigate, showToast]);

  // Load model from Dashboard
  const handleLoadModel = useCallback(async (modelId) => {
    try {
      const modelData = await storage.loadModel(modelId);
      if (modelData && modelData.model_data) {

        // Restore classes
        if (modelData.dataset && modelData.dataset.classes) {
          cm.restoreClasses(modelData.dataset.classes);
        } else {
          // Fallback if no dataset (legacy)
          cm.restoreClasses(modelData.class_names.map(n => ({ name: n, samples: [] })));
        }

        // Restore model
        const { modelTopology, weightSpecs, weightData } = modelData.model_data;
        const weightBuffer = base64ToArrayBuffer(weightData);

        const model = await tf.loadLayersModel(tf.io.fromMemory({
          modelTopology,
          weightSpecs,
          weightData: weightBuffer
        }));

        trainer.setModel(model, modelData.class_names.length);

        navigate('/train');
        showToast(`Loaded model: ${modelData.name}`, 'success');
      } else {
        showToast('Failed to load model data', 'error');
      }
    } catch (err) {
      console.error("Error loading model:", err);
      showToast('Error loading model', 'error');
    }
  }, [storage, trainer, cm, navigate, showToast]);

  return (
    <div className="app flex flex-col min-h-screen">
      <Header
        user={auth.user}
        onSignIn={() => setShowAuth(true)}
        onLogout={() => {
          auth.logout();
          cm.reset();
          trainer.resetModel();
          prediction.stopPredicting();
          showToast('Logged out', 'info');
          navigate('/');
        }}
      />

      <main className="app-content flex-grow">
        <Routes>
          <Route path="/" element={<Navigate to="/train" replace />} />

          <Route path="/train" element={
            <TrainTab
              showToast={showToast}
              hand={hand}
              cm={cm}
              trainer={trainer}
              prediction={prediction}
              storage={storage}
              auth={auth}
            />
          } />

          <Route path="/piano" element={
            <PianoTab
              classNames={cm.classNames}
              topPrediction={prediction.topPrediction}
              showToast={showToast}
              hand={hand}
              prediction={prediction}
            />
          } />

          <Route path="/motors" element={
            <MotorsTab
              classNames={cm.classNames}
              showToast={showToast}
              hand={hand}
              prediction={prediction}
              ble={ble}
            />
          } />

          <Route path="/devices" element={
            <DevicesTab showToast={showToast} ble={ble} />
          } />

          <Route path="/community" element={
            <CommunityTab
              auth={auth}
              onImportModel={handleImportCommunityModel}
              onImportPiano={async (item) => {
                const success = await storage.savePianoSequence(item.name_or_title, item.data, false);
                if (success) showToast('Piano sequence saved to your library!', 'success');
                else showToast('Failed to save piano sequence', 'error');
              }}
              onImportGesture={async (item) => {
                const success = await storage.saveGestureMapping(item.name_or_title, item.data, false);
                if (success) showToast('Motor config saved to your library!', 'success');
                else showToast('Failed to save motor config', 'error');
              }}
              showToast={showToast}
            />
          } />

          <Route path="/about" element={<AboutTab />} />

          <Route path="/dashboard" element={
            <Dashboard
              showToast={showToast}
              onBack={() => navigate('/')}
              onLoadModel={handleLoadModel}
              auth={auth}
            />
          } />

          <Route path="/reset-password" element={
            <ResetPasswordHandler onOpenReset={handleOpenReset} />
          } />

          {/* Fallback for unknown routes */}
          <Route path="*" element={<Navigate to="/train" replace />} />
        </Routes>
      </main>

      <Footer />

      {showAuth && (
        <AuthModal
          initialView={authView}
          initialToken={resetToken}
          onClose={() => {
            setShowAuth(false);
            setAuthView('login');
            setResetToken('');
          }}
          onLogin={async (email, pw) => {
            try {
              const user = await auth.login(email, pw);
              if (!user) throw new Error('Invalid email or password');
              showToast(`Welcome back, ${user.username}!`, 'success');
              setShowAuth(false);
            } catch (err) {
              showToast(err.message, 'error');
            }
          }}
          onSignup={async (username, email, pw) => {
            try {
              const user = await auth.signup(username, email, pw);
              showToast(`Welcome, ${user.username}!`, 'success');
              setShowAuth(false);
            } catch (err) {
              showToast(err.message || 'Signup failed', 'error');
            }
          }}
        />
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
