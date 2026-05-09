import { useCallback, useRef, useState } from 'react';
import type { AppConfig, MonitorEvent, StatusJson } from '../../types/status';
import { getJson } from '../../services/azureBlob';
import { usePoll } from '../../hooks/usePoll';
import { AlertBanner } from './AlertBanner';
import { PhotoViewer } from './PhotoViewer';
import { AudioStrip } from './AudioStrip';
import { EventLog } from './EventLog';
import { SyncControls } from './SyncControls';

interface Props {
  config: AppConfig;
  onSettings: () => void;
}

export function PersonMode({ config, onSettings }: Props) {
  const [status, setStatus] = useState<StatusJson | null>(null);
  const [localEvents, setLocalEvents] = useState<MonitorEvent[]>([]);
  const seenEventIds = useRef(new Set<string>());

  const fetchStatus = useCallback(async () => {
    const s = await getJson<StatusJson>(config.sasUri, 'status.json');
    setStatus(s);

    const newEvents = s.events.filter((e) => !seenEventIds.current.has(e.id));
    if (newEvents.length > 0) {
      newEvents.forEach((e) => seenEventIds.current.add(e.id));
      setLocalEvents((prev) => [
        ...prev,
        ...newEvents.map((e) => ({ ...e, acknowledged: false })),
      ]);
    }
  }, [config.sasUri]);

  const { lastPollTime, isPending, error, pollNow } = usePoll(fetchStatus, config.syncIntervalSec);

  function dismissAlerts() {
    setLocalEvents((prev) => prev.map((e) => ({ ...e, acknowledged: true })));
  }

  const allEvents = [
    ...(status?.events.filter((e) => !localEvents.find((l) => l.id === e.id)) ?? []),
    ...localEvents,
  ];

  return (
    <div className="person-mode">
      <div className="mode-header">
        <h2>Person Mode <span className="app-version">v{__APP_VERSION__}</span></h2>
        <button className="btn-icon" onClick={onSettings}>Settings</button>
      </div>

      <AlertBanner events={localEvents} onDismiss={dismissAlerts} />

      <SyncControls
        lastPollTime={lastPollTime}
        isPending={isPending}
        error={error}
        onRefresh={pollNow}
        lastUpdate={status?.lastUpdate ?? null}
        location={status?.location ?? null}
      />

      <PhotoViewer
        sasUri={config.sasUri}
        latestPhoto={status?.latestPhoto ?? null}
        photoHistory={status?.photoHistory ?? []}
      />

      <AudioStrip sasUri={config.sasUri} audioHistory={status?.audioHistory ?? []} />

      <EventLog events={allEvents} sasUri={config.sasUri} />
    </div>
  );
}
