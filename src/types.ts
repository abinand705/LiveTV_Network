export type StreamFormat = 'hls' | 'dash' | 'native';

export type CameraPreset = 'studio' | 'screen' | 'console' | 'dual';

export type ViewMode = 'studio3d' | 'epgFull' | 'multiview' | 'favorites';

export interface StreamMirror {
  url: string;
  label: string;
  format: StreamFormat;
  qualityHint?: string;
  userAgent?: string;
  referrer?: string;
}

export interface Channel {
  id: string;
  number: number;
  name: string;
  logo: string;
  group: string;
  language: string;
  tvgId: string;
  mirrors: StreamMirror[];
  isCustom?: boolean;
  isFallbackReady?: boolean;
}

export interface ProgramSlot {
  id: string;
  channelId: string;
  title: string;
  category: string;
  description: string;
  startTime: number; // epoch ms
  endTime: number;   // epoch ms
  rating?: string;
  language?: string;
}

export interface QualityLevel {
  index: number; // -1 for Auto
  height: number;
  bitrate: number;
  label: string;
}

export interface AudioTrackOption {
  id: number;
  name: string;
  lang: string;
}

export interface StreamTelemetry {
  status: 'idle' | 'loading' | 'playing' | 'paused' | 'recovering' | 'error';
  errorMessage?: string;
  format: StreamFormat;
  resolution: string;
  bitrateKbps: number;
  latencySec: number;
  droppedFrames: number;
  usingFallbackStream?: boolean;
}
