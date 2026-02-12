import { useState, useCallback } from 'react';
import './components/Layout/Header.css';
import './components/Layout/TabNav.css';
import './components/common/Toast.css';
import './components/common/LoadingOverlay.css';
import Header from './components/Layout/Header.jsx';
import TabNav from './components/Layout/TabNav.jsx';
import TrainTab from './components/Training/TrainTab.jsx';
import PianoTab from './components/Piano/PianoTab.jsx';
import DevicesTab from './components/Devices/DevicesTab.jsx';
import AboutTab from './components/About/AboutTab.jsx';
import Toast from './components/common/Toast.jsx';

import { useHandDetection } from './hooks/useHandDetection.js';
import { useClassManager } from './hooks/useClassManager.js';
import { useModelTrainer } from './hooks/useModelTrainer.js';
import { usePredictionManager } from './hooks/usePredictionManager.js';
import { useStorageManager } from './hooks/useStorageManager.js';

const TABS = [
  { id: 'train', label: '🤚 Train', icon: '🧠' },
  { id: 'piano', label: '🎹 Piano', icon: '🎵' },
  { id: 'devices', label: '📡 Devices', icon: '🔌' },
  { id: 'about', label: '📖 About', icon: 'ℹ️' },
];

export default function App() {
  const [activeTab, setActiveTab] = useState('train');
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = 'info', duration = 3000) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), duration);
  }, []);

  // ── Shared hooks (lifted so PianoTab can access classNames + topPrediction) ──
  const hand = useHandDetection();
  const cm = useClassManager();
  const trainer = useModelTrainer();
  const storage = useStorageManager();

  const prediction = usePredictionManager({
    getFeatures: hand.getFeatures,
    predict: trainer.predict,
    classNames: cm.classNames,
  });

  return (
    <div className="app">
      <Header />
      <TabNav tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />

      <main className="app-content">
        {activeTab === 'train' && (
          <TrainTab
            showToast={showToast}
            hand={hand}
            cm={cm}
            trainer={trainer}
            prediction={prediction}
            storage={storage}
          />
        )}
        {activeTab === 'piano' && (
          <PianoTab
            classNames={cm.classNames}
            topPrediction={prediction.topPrediction}
            showToast={showToast}
          />
        )}
        {activeTab === 'devices' && (
          <DevicesTab showToast={showToast} />
        )}
        {activeTab === 'about' && (
          <AboutTab />
        )}
      </main>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
