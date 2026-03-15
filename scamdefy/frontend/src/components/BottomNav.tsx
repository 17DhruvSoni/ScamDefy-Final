import React from 'react';

type Screen = 'dashboard' | 'webthreats' | 'calllogs' | 'settings';

const TABS: Array<{ id: Screen; icon: string; label: string }> = [
  { id: 'dashboard',  icon: '🏠', label: 'Home'      },
  { id: 'webthreats', icon: '🛡️', label: 'Scanner'   },
  { id: 'calllogs',   icon: '📞', label: 'Voice'     },
  { id: 'settings',   icon: '⚙️', label: 'Settings'  },
];

export function BottomNav({ active, onNav }: { active: Screen; onNav: (s: Screen) => void }) {
  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: 0, right: 0,
      height: 60, background: '#0a0f1e',
      borderTop: '1px solid #1e293b',
      display: 'flex', alignItems: 'stretch',
      zIndex: 100, maxWidth: 430, margin: '0 auto',
    }}>
      {TABS.map(tab => {
        const isActive = active === tab.id;
        return (
          <button key={tab.id} onClick={() => onNav(tab.id)} style={{
            flex: 1, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: 3,
            background: 'none', border: 'none', cursor: 'pointer',
            position: 'relative', paddingTop: isActive ? 0 : 2,
            transition: 'all 0.15s',
          }}>
            {isActive && (
              <div style={{
                position: 'absolute', top: 0, left: '20%', right: '20%',
                height: 2, background: '#6366f1', borderRadius: '0 0 3px 3px',
              }} />
            )}
            <span style={{ fontSize: 18 }}>{tab.icon}</span>
            {isActive && (
              <span style={{ fontSize: 10, color: '#6366f1', fontWeight: 700, letterSpacing: '0.3px' }}>
                {tab.label}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
}
