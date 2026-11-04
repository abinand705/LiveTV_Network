import Hls from 'hls.js';
import * as dashjs from 'dashjs';
import { AudioTrackOption, QualityLevel, StreamFormat, StreamTelemetry } from '../types';
import { detectStreamFormat } from './m3uParser';

export interface StreamControllerCallbacks {
  onTelemetryChange: (telemetry: StreamTelemetry) => void;
  onQualitiesLoaded: (qualities: QualityLevel[], currentIndex: number) => void;
  onAudioTracksLoaded: (tracks: AudioTrackOption[], currentId: number) => void;
  onRequestMirrorFailover?: () => void;
}

interface DashRepresentation {
  height?: number;
  bandwidth?: number;
  bitrate?: number;
}

interface DashCompatPlayer {
  initialize: (view?: HTMLElement, source?: string, autoPlay?: boolean) => void;
  updateSettings: (settings: Record<string, unknown>) => void;
  on: (type: string, listener: (e?: unknown) => void) => void;
  reset: () => void;
  getTracksFor: (type: 'audio' | 'video') => dashjs.MediaInfo[];
  setCurrentTrack: (track: dashjs.MediaInfo) => void;
  getCurrentLiveLatency: () => number;
  // dash.js v5+ APIs
  getRepresentationsByType?: (type: 'video' | 'audio') => DashRepresentation[];
  getCurrentRepresentationForType?: (type: 'video' | 'audio') => DashRepresentation | null;
  setRepresentationForTypeByIndex?: (type: 'video' | 'audio', index: number, replace?: boolean) => void;
  // dash.js v4 fallback APIs
  getBitrateInfoListFor?: (type: 'video' | 'audio') => DashRepresentation[];
  getQualityFor?: (type: 'video' | 'audio') => number;
  setQualityFor?: (type: 'video' | 'audio', index: number, replace?: boolean) => void;
}

export class AdaptiveStreamController {
  private video: HTMLVideoElement;
  private hls: Hls | null = null;
  private dash: DashCompatPlayer | null = null;
  private callbacks: StreamControllerCallbacks;
  private telemetryTimer: number | null = null;
  private timeoutTimer: number | null = null;
  private currentFormat: StreamFormat = 'hls';
  private isUsingFallback = false;
  private networkRetryCount = 0;

  constructor(video: HTMLVideoElement, callbacks: StreamControllerCallbacks) {
    this.video = video;
    this.callbacks = callbacks;
    this.bindVideoEvents();
  }

  private bindVideoEvents() {
    this.video.addEventListener('playing', () => {
      this.clearConnectionTimeout();
      this.emitTelemetry('playing');
    });

    this.video.addEventListener('pause', () => {
      if (!this.video.ended && this.video.readyState >= 2) {
        this.emitTelemetry('paused');
      }
    });

    this.video.addEventListener('waiting', () => {
      this.emitTelemetry('loading');
    });
  }

  private clearConnectionTimeout() {
    if (this.timeoutTimer !== null) {
      window.clearTimeout(this.timeoutTimer);
      this.timeoutTimer = null;
    }
  }

  public loadStream(url: string, explicitFormat?: StreamFormat, isFallback = false) {
    this.destroyEngines();
    this.isUsingFallback = isFallback;
    this.networkRetryCount = 0;

    const format = explicitFormat || detectStreamFormat(url);
    this.currentFormat = format;

    this.callbacks.onQualitiesLoaded([{ index: -1, height: 0, bitrate: 0, label: 'Auto' }], -1);
    this.callbacks.onAudioTracksLoaded([{ id: 0, name: 'Primary Audio', lang: 'default' }], 0);
    this.emitTelemetry('loading');

    // Set a 12-second connection watchdog for unresponsive IPTV servers
    this.clearConnectionTimeout();
    this.timeoutTimer = window.setTimeout(() => {
      if (this.video.readyState < 2) {
        this.handleUnreachableStream('Stream connection timed out (CORS or offline server).');
      }
    }, 12000);

    if (format === 'dash') {
      this.initDash(url);
    } else if (format === 'hls') {
      this.initHls(url);
    } else {
      this.initNative(url);
    }

    this.startTelemetryPolling();
  }

  private initHls(url: string) {
    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 30,
        manifestLoadingTimeOut: 10000,
        manifestLoadingMaxRetry: 2,
        levelLoadingTimeOut: 10000,
      });
      this.hls = hls;

      hls.loadSource(url);
      hls.attachMedia(this.video);

      hls.on(Hls.Events.MANIFEST_PARSED, (_event, data) => {
        this.clearConnectionTimeout();
        const levels: QualityLevel[] = [
          { index: -1, height: 0, bitrate: 0, label: 'Auto (Adaptive)' },
          ...data.levels.map((lvl, idx) => ({
            index: idx,
            height: lvl.height || 0,
            bitrate: lvl.bitrate || 0,
            label: lvl.height
              ? `${lvl.height}p (${Math.round((lvl.bitrate || 1500000) / 1000)} kbps)`
              : `Level ${idx + 1} (${Math.round((lvl.bitrate || 1000000) / 1000)} kbps)`,
          })),
        ];
        this.callbacks.onQualitiesLoaded(levels, hls.currentLevel);

        this.video.play().catch(() => {
          this.video.muted = true;
          this.video.play().catch(() => {});
        });
      });

      hls.on(Hls.Events.AUDIO_TRACKS_UPDATED, (_event, data) => {
        if (data.audioTracks && data.audioTracks.length > 0) {
          const tracks: AudioTrackOption[] = data.audioTracks.map((t, idx) => ({
            id: idx,
            name: t.name || t.lang || `Audio Track ${idx + 1}`,
            lang: t.lang || 'in',
          }));
          this.callbacks.onAudioTracksLoaded(tracks, hls.audioTrack);
        }
      });

      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
            this.emitTelemetry('recovering', 'Recovering media decoder...');
            hls.recoverMediaError();
          } else if (data.type === Hls.ErrorTypes.NETWORK_ERROR && this.networkRetryCount < 1) {
            this.networkRetryCount++;
            this.emitTelemetry('recovering', 'Retrying stream manifest...');
            hls.startLoad();
          } else {
            this.clearConnectionTimeout();
            this.handleUnreachableStream(`HLS stream unavailable (${data.details || 'Network/CORS blocked'}).`);
          }
        }
      });
    } else if (this.video.canPlayType('application/vnd.apple.mpegurl')) {
      this.initNative(url);
    } else {
      this.handleUnreachableStream('HLS playback is not supported in this browser.');
    }
  }

  private initDash(url: string) {
    try {
      const player = dashjs.MediaPlayer().create() as unknown as DashCompatPlayer;
      this.dash = player;
      player.initialize(this.video, url, true);
      player.updateSettings({
        streaming: {
          abr: { autoSwitchBitrate: { video: true, audio: true } },
        },
      });

      player.on(dashjs.MediaPlayer.events.STREAM_INITIALIZED, () => {
        this.clearConnectionTimeout();
        const reps: DashRepresentation[] =
          player.getRepresentationsByType?.('video') ||
          player.getBitrateInfoListFor?.('video') ||
          [];

        const qualities: QualityLevel[] = [
          { index: -1, height: 0, bitrate: 0, label: 'Auto (DASH ABR)' },
          ...reps.map((b: DashRepresentation, idx: number) => {
            const bps = b.bandwidth || b.bitrate || 1500000;
            return {
              index: idx,
              height: b.height || 0,
              bitrate: bps,
              label: `${b.height || 720}p (${Math.round(bps / 1000)} kbps)`,
            };
          }),
        ];
        this.callbacks.onQualitiesLoaded(qualities, -1);

        const audioTracks = player.getTracksFor('audio') || [];
        if (audioTracks.length > 0) {
          const mapped: AudioTrackOption[] = audioTracks.map((t, idx) => ({
            id: idx,
            name: t.labels?.[0]?.text || t.lang || `Audio ${idx + 1}`,
            lang: t.lang || 'und',
          }));
          this.callbacks.onAudioTracksLoaded(mapped, 0);
        }

        this.video.play().catch(() => {
          this.video.muted = true;
          this.video.play().catch(() => {});
        });
      });

      player.on(dashjs.MediaPlayer.events.ERROR, () => {
        this.clearConnectionTimeout();
        this.handleUnreachableStream('MPEG-DASH manifest failed to load or blocked by CORS.');
      });
    } catch {
      this.handleUnreachableStream('Failed to initialize MPEG-DASH engine.');
    }
  }

  private initNative(url: string) {
    this.video.src = url;
    this.video.load();
    this.video.play().catch(() => {
      this.video.muted = true;
      this.video.play().catch(() => {
        this.handleUnreachableStream('Direct stream playback failed.');
      });
    });
  }

  private handleUnreachableStream(reason: string) {
    this.emitTelemetry('error', reason);
    if (this.callbacks.onRequestMirrorFailover) {
      this.callbacks.onRequestMirrorFailover();
    }
  }

  public setQuality(index: number) {
    if (this.hls) {
      this.hls.currentLevel = index;
    } else if (this.dash) {
      if (index === -1) {
        this.dash.updateSettings({
          streaming: { abr: { autoSwitchBitrate: { video: true } } },
        });
      } else {
        this.dash.updateSettings({
          streaming: { abr: { autoSwitchBitrate: { video: false } } },
        });
        if (this.dash.setRepresentationForTypeByIndex) {
          this.dash.setRepresentationForTypeByIndex('video', index, true);
        } else if (this.dash.setQualityFor) {
          this.dash.setQualityFor('video', index, true);
        }
      }
    }
  }

  public setAudioTrack(id: number) {
    if (this.hls) {
      this.hls.audioTrack = id;
    } else if (this.dash) {
      const tracks = this.dash.getTracksFor('audio');
      if (tracks && tracks[id]) {
        this.dash.setCurrentTrack(tracks[id]);
      }
    }
  }

  private startTelemetryPolling() {
    if (this.telemetryTimer !== null) {
      window.clearInterval(this.telemetryTimer);
    }
    this.telemetryTimer = window.setInterval(() => {
      if (!this.video.paused && this.video.readyState >= 2) {
        this.emitTelemetry('playing');
      }
    }, 1500);
  }

  private emitTelemetry(status: StreamTelemetry['status'], errorMessage?: string) {
    const w = this.video.videoWidth;
    const h = this.video.videoHeight;
    const resolution = w && h ? `${w}×${h}` : status === 'playing' ? '1280×720' : '—';

    let bitrateKbps = 0;
    let latencySec = 0;

    if (this.hls) {
      const lvl = this.hls.levels[this.hls.currentLevel];
      if (lvl?.bitrate) {
        bitrateKbps = Math.round(lvl.bitrate / 1000);
      }
      if (typeof this.hls.latency === 'number' && !Number.isNaN(this.hls.latency)) {
        latencySec = Number(this.hls.latency.toFixed(1));
      }
    } else if (this.dash) {
      const currentRep = this.dash.getCurrentRepresentationForType?.('video');
      if (currentRep && (currentRep.bandwidth || currentRep.bitrate)) {
        bitrateKbps = Math.round(((currentRep.bandwidth || currentRep.bitrate) as number) / 1000);
      } else if (this.dash.getQualityFor && this.dash.getBitrateInfoListFor) {
        const q = this.dash.getQualityFor('video');
        const list = this.dash.getBitrateInfoListFor('video');
        if (list && list[q]?.bitrate) {
          bitrateKbps = Math.round((list[q].bitrate as number) / 1000);
        }
      }
      latencySec = Number((this.dash.getCurrentLiveLatency() || 0).toFixed(1));
    }

    const qualityPlayback = (this.video as HTMLVideoElement & {
      getVideoPlaybackQuality?: () => { droppedVideoFrames: number };
    }).getVideoPlaybackQuality?.();

    this.callbacks.onTelemetryChange({
      status,
      errorMessage,
      format: this.currentFormat,
      resolution,
      bitrateKbps: bitrateKbps || (status === 'playing' ? 2400 : 0),
      latencySec,
      droppedFrames: qualityPlayback?.droppedVideoFrames || 0,
      usingFallbackStream: this.isUsingFallback,
    });
  }

  private destroyEngines() {
    this.clearConnectionTimeout();
    if (this.hls) {
      this.hls.destroy();
      this.hls = null;
    }
    if (this.dash) {
      this.dash.reset();
      this.dash = null;
    }
  }

  public dispose() {
    this.destroyEngines();
    if (this.telemetryTimer !== null) {
      window.clearInterval(this.telemetryTimer);
      this.telemetryTimer = null;
    }
  }
}
