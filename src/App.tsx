import { useState } from 'react';
import type { AppConfig } from './types/status';
import { CONFIG_KEY } from './types/status';
import { Setup } from './components/Setup/Setup';
import { CarMode } from './components/CarMode/CarMode';
import { PersonMode } from './components/PersonMode/PersonMode';

function loadConfig(): AppConfig | null {
  try {
    const raw = localStorage.getItem(CONFIG_KEY);
    return raw ? (JSON.parse(raw) as AppConfig) : null;
  } catch { return null; }
}

export default function App() {
  const [config, setConfig] = useState<AppConfig | null>(loadConfig);
  const [showSettings, setShowSettings] = useState(false);

  if (!config || showSettings) {
    return (
      <Setup
        initial={config ?? undefined}
        onSave={(c) => { setConfig(c); setShowSettings(false); }}
      />
    );
  }

  if (config.mode === 'car') {
    return <CarMode config={config} onSettings={() => setShowSettings(true)} />;
  }

  return <PersonMode config={config} onSettings={() => setShowSettings(true)} />;
}
