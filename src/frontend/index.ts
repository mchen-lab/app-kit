
import { useState, useEffect } from 'react';

export interface AppVersion {
  version: string;
  commit: string;
}

export interface AppStatus {
  status: string;
  appName: string;
  timestamp: string;
  port?: number | string;
}

export function useAppKit() {
  const [version, setVersion] = useState<AppVersion | null>(null);
  const [settings, setSettings] = useState<any | null>(null);
  const [status, setStatus] = useState<AppStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refreshVersion = async () => {
    try {
      const res = await fetch('/api/version');
      if (!res.ok) throw new Error('Failed to fetch version');
      const data = await res.json();
      setVersion(data);
    } catch (e) {
      console.error('[AppKit] Error fetching version:', e);
    }
  };

  const refreshSettings = async () => {
    try {
      const res = await fetch('/api/settings');
      if (!res.ok) throw new Error('Failed to fetch settings');
      const data = await res.json();
      setSettings(data);
    } catch (e) {
      console.error('[AppKit] Error fetching settings:', e);
      setError(e instanceof Error ? e : new Error(String(e)));
    }
  };

  const updateSettings = async (newSettings: any) => {
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings),
      });
      if (!res.ok) throw new Error('Failed to update settings');
      const data = await res.json();
      setSettings(data.config);
      return data.config;
    } catch (e) {
      console.error('[AppKit] Error updating settings:', e);
      throw e;
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([refreshVersion(), refreshSettings()]);
      setLoading(false);
    };
    init();
  }, []);

  return {
    version,
    settings,
    status,
    loading,
    error,
    refreshVersion,
    refreshSettings,
    updateSettings
  };
}
export { VersionBanner, AboutDialog } from './components.js';
