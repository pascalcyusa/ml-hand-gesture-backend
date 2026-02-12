import { useState, useCallback } from 'react';
import {
  HandRaisedIcon,
  MusicalNoteIcon,
  SignalIcon,
  GlobeAltIcon,
  InformationCircleIcon,
  UserCircleIcon, // Import for dashboard tab/icon
} from '@heroicons/react/24/outline';
import { CogIcon, CpuChipIcon } from '@heroicons/react/24/solid';

import './components/Layout/Header.css';
import './components/Layout/TabNav.css';
import './components/common/Toast.css';
import './components/common/LoadingOverlay.css';
import Header from './components/Layout/Header.jsx';
import TabNav from './components/Layout/TabNav.jsx';
import TrainTab from './components/Training/TrainTab.jsx';
import PianoTab from './components/Piano/PianoTab.jsx';
import MotorsTab from './components/Motors/MotorsTab.jsx';
import DevicesTab from './components/Devices/DevicesTab.jsx';
import CommunityTab from './components/Community/CommunityTab.jsx';
import AboutTab from './components/About/AboutTab.jsx';
import Dashboard from './components/Dashboard/Dashboard.jsx'; // Import Dashboard
import AuthModal from './components/common/AuthModal.jsx';
import Toast from './components/common/Toast.jsx';

import { useAuth } from './hooks/useAuth.js';
import { useHandDetection } from './hooks/useHandDetection.js';
import { useClassManager } from './hooks/useClassManager.js';
import { useModelTrainer } from './hooks/useModelTrainer.js';
import { usePredictionManager } from './hooks/usePredictionManager.js';
import { useStorageManager } from './hooks/useStorageManager.js';

const TABS = [
  { id: 'train', label: 'Train', icon: HandRaisedIcon },
  { id: 'piano', label: 'Piano', icon: MusicalNoteIcon },
  { id: 'motors', label: 'Motors', icon: CogIcon },
  { id: 'devices', label: 'Devices', icon: SignalIcon },
  { id: 'community', label: 'Community', icon: GlobeAltIcon },
  { id: 'about', label: 'About', icon: InformationCircleIcon },
];

export default function App() {
  const [activeTab, setActiveTab] = useState('train');
  const [toast, setToast] = useState(null);
  const [showAuth, setShowAuth] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false); // State for dashboard view

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
    // If dataset exists in cloud model, restore it?
    // Current flow: imports model (topology+weights)
    // If we have dataset, we should restore classes AND maybe set dataset in trainer if trainer supports it.
    // train tab usually handles dataset via cm.

    // For now, load model & classes
    const result = await storage.importFromCloud(cloudModel);
    if (result) {
      trainer.setModel(result.model, result.classes.length); // pass numClasses
      cm.restoreClasses(result.classes);
      // result.dataset could be used here if trainer supported loading samples
      // We will enhance TrainTab to handle dataset loading separately or here
      return true;
    }
    return false;
  }, [storage, trainer, cm]);

  const handleDashboardClick = () => {
    setShowDashboard(true);
  };

  const handleTabChange = (tabId) => {
    setShowDashboard(false);
    setActiveTab(tabId);
  };

  return (
    <div className="app">
      <Header
        user={auth.user}
        onSignIn={() => setShowAuth(true)}
        onLogout={() => {
          auth.logout();
          showToast('Logged out', 'info');
          setShowDashboard(false);
        }}
        onProfileClick={handleDashboardClick} // New prop for user avatar click
      />

      {!showDashboard && (
        <TabNav tabs={TABS} activeTab={activeTab} onTabChange={handleTabChange} />
      )}

      <main className="app-content">
        {showDashboard ? (
          <Dashboard showToast={showToast} onBack={() => setShowDashboard(false)} />
        ) : (
          <>
            {activeTab === 'train' && (
              <TrainTab
                showToast={showToast}
                hand={hand}
                cm={cm}
                trainer={trainer}
                prediction={prediction}
                storage={storage}
                auth={auth} // Pass auth to train tab for conditional UI
              />
            )}
            {activeTab === 'piano' && (
              <PianoTab
                classNames={cm.classNames}
                topPrediction={prediction.topPrediction}
                showToast={showToast}
              />
            )}
            {activeTab === 'motors' && (
              <MotorsTab
                classNames={cm.classNames}
                showToast={showToast}
              />
            )}
            {activeTab === 'devices' && (
              <DevicesTab showToast={showToast} />
            )}
            {activeTab === 'community' && (
              <CommunityTab
                auth={auth}
                onImportModel={handleImportCommunityModel}
                showToast={showToast}
              />
            )}
            {activeTab === 'about' && (
              <AboutTab />
            )}
          </>
        )}
      </main>

      {showAuth && (
        <AuthModal
          onClose={() => setShowAuth(false)}
          onLogin={async (email, pw) => {
            const user = await auth.login(email, pw);
            if (user) showToast(`Welcome back, ${user.username}!`, 'success');
            else showToast('Login failed', 'error');
            setShowAuth(false);
          }}
          onSignup={async (username, email, pw) => {
            try {
              const user = await auth.signup(username, email, pw);
              showToast(`Welcome, ${user.username}!`, 'success');
              setShowAuth(false);
            } catch (e) {
              showToast('Signup failed', 'error');
            }
          }}
        />
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
