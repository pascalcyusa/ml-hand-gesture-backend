import { useState, useCallback } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';

import './components/Layout/Header.css';
import './components/common/Toast.css';
import './components/common/LoadingOverlay.css';

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
import Toast from './components/common/Toast.jsx';

import { useAuth } from './hooks/useAuth.js';
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

  const showToast = useCallback((message, type = 'info', duration = 3000) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), duration);
  }, []);

  // ── Auth ──
  const auth = useAuth();

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
    if (result) {
      trainer.setModel(result.model, result.classes.length);
      cm.restoreClasses(result.classes);
      navigate('/train');
      showToast('Model imported successfully!', 'success');
      return true;
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

        const model = await tf.loadLayersModel(tf.io.fromMemory(
          modelTopology,
          weightSpecs,
          weightBuffer
        ));

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
            />
          } />

          <Route path="/devices" element={
            <DevicesTab showToast={showToast} />
          } />

          <Route path="/community" element={
            <CommunityTab
              auth={auth}
              onImportModel={handleImportCommunityModel}
              showToast={showToast}
            />
          } />

          <Route path="/about" element={<AboutTab />} />

          <Route path="/dashboard" element={
            <Dashboard
              showToast={showToast}
              onBack={() => navigate('/')}
              onLoadModel={handleLoadModel}
            />
          } />

          {/* Fallback for unknown routes */}
          <Route path="*" element={<Navigate to="/train" replace />} />
        </Routes>
      </main>

      <Footer />

      {showAuth && (
        <AuthModal
          onClose={() => setShowAuth(false)}
          onLogin={async (email, pw) => {
            const user = await auth.login(email, pw);
            if (!user) throw new Error('Invalid email or password');
            showToast(`Welcome back, ${user.username}!`, 'success');
            setShowAuth(false);
          }}
          onSignup={async (username, email, pw) => {
            const user = await auth.signup(username, email, pw);
            showToast(`Welcome, ${user.username}!`, 'success');
            setShowAuth(false);
          }}
        />
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
