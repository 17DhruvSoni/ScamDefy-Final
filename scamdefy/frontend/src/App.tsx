import React, { useState } from 'react';
import { Dashboard } from './screens/Dashboard';
import { WebThreats } from './screens/WebThreats';
import { CallLogs } from './screens/CallLogs';
import { Settings } from './screens/Settings';
import { BottomNav } from './components/BottomNav';
import { ToastContainer } from './components/ui/Toast';

type Screen = 'dashboard' | 'webthreats' | 'calllogs' | 'settings';

export default function App() {
  const [screen, setScreen] = useState<Screen>('dashboard');

  const renderScreen = () => {
    switch (screen) {
      case 'dashboard': return <Dashboard />;
      case 'webthreats': return <WebThreats />;
      case 'calllogs': return <CallLogs />;
      case 'settings': return <Settings />;
      default: return <Dashboard />;
    }
  };

  return (
    <div style={{
      minHeight: '100vh', background: '#0a0f1e',
      maxWidth: 430, margin: '0 auto', position: 'relative',
    }}>
      {/* Toast overlay — always mounted */}
      <ToastContainer />

      {/* Active screen */}
      <div style={{ minHeight: '100vh', paddingBottom: 60 }}>
        {renderScreen()}
      </div>

      {/* Bottom navigation */}
      <BottomNav active={screen} onNav={setScreen} />
    </div>
  );
}
