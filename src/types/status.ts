export type EventType = 'noise' | 'motion';

export interface MonitorEvent {
  id: string;
  type: EventType;
  time: string;
  level: number;
  acknowledged: boolean;
  audioClip?: string;
}

export interface GpsLocation {
  lat: number;
  lng: number;
  accuracy: number;
}

export interface StatusJson {
  schemaVersion: 1;
  lastUpdate: string;
  sessionStart: string;
  location: GpsLocation | null;
  latestPhoto: string | null;
  photoHistory: string[];
  events: MonitorEvent[];
}

export interface AppConfig {
  sasUri: string;
  mode: 'car' | 'person';
  photoIntervalSec: number;
  noiseThresholdDb: number;
  motionThresholdMs2: number;
  syncIntervalSec: number;
}

export const DEFAULT_CONFIG: Omit<AppConfig, 'sasUri' | 'mode'> = {
  photoIntervalSec: 60,
  noiseThresholdDb: -30,
  motionThresholdMs2: 3,
  syncIntervalSec: 30,
};

export const CONFIG_KEY = 'dogmonitor_config';
