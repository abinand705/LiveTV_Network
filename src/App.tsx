/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Play,
  Volume2,
  VolumeX,
  Search,
  ChevronLeft,
  ChevronRight,
  Star,
  Maximize2,
  PictureInPicture2,
  RefreshCw,
  RotateCw,
  Tv,
  AlertCircle,
  X,
  Globe,
  Check,
} from 'lucide-react';
import {
  Channel,
  ProgramSlot,
  QualityLevel,
  StreamTelemetry,
} from './types';
import {
  fetchIndiaPlaylist,
  VERIFIED_BROADCAST_STREAMS,
} from './services/m3uParser';
import { getNowAndNext, parseXMLTVDocument } from './services/epgService';
import { AdaptiveStreamController } from './services/streamController';
import { EpgGuidePanel } from './components/EpgGuidePanel';
import { LiveTvLogo } from './components/LiveTvLogo';

const FAVORITES_STORAGE_KEY = 'livetv_network_favorites_v1';
const BANNER_INTERVAL_MS = 8000;

const RECOMMENDED_LANGUAGES = [
  { id: 'Hindi', label: 'Hindi', native: 'हिन्दी', tag: 'Recommended' },
  { id: 'English', label: 'English', native: 'English', tag: 'Recommended' },
  { id: 'Malayalam', label: 'Malayalam', native: 'മലയാളം', tag: 'Popular' },
  { id: 'Tamil', label: 'Tamil', native: 'தமிழ்', tag: 'Popular' },
  { id: 'Telugu', label: 'Telugu', native: 'తెలుగు', tag: 'Popular' },
  { id: 'Kannada', label: 'Kannada', native: 'ಕನ್ನಡ', tag: 'Regional' },
  { id: 'Bengali', label: 'Bengali', native: 'বাংলা', tag: 'Regional' },
  { id: 'Marathi', label: 'Marathi', native: 'मराठी', tag: 'Regional' },
  { id: 'Punjabi', label: 'Punjabi', native: 'ਪੰਜਾਬੀ', tag: 'Regional' },
  { id: 'Gujarati', label: 'Gujarati', native: 'ગુજરાતી', tag: 'Regional' },
  { id: 'Odia', label: 'Odia', native: 'ଓଡ଼ିଆ', tag: 'Regional' },
  { id: 'Assamese', label: 'Assamese', native: 'অসমীয়া', tag: 'Regional' },
  { id: 'Urdu', label: 'Urdu', native: 'اردو', tag: 'Regional' },
  { id: 'Bhojpuri', label: 'Bhojpuri', native: 'भोजपुरी', tag: 'Regional' },
  { id: 'All', label: 'All Languages', native: 'All India', tag: 'Complete List' },
];

interface HorizontalSwimlaneProps {
  title: string;
  subtitle?: string;
  channels: Channel[];
  activeChannel: Channel | null;
  favorites: string[];
  xmltvMap: Map<string, ProgramSlot[]>;
  onSelectChannel: (ch: Channel) => void;
  onWatchFullscreen: (ch: Channel) => void;
  onToggleFavorite: (id: string, e: React.MouseEvent) => void;
}

const HorizontalSwimlane: React.FC<HorizontalSwimlaneProps> = ({
  title,
  subtitle,
  channels,
  activeChannel,
  favorites,
  xmltvMap,
  onSelectChannel,
  onWatchFullscreen,
  onToggleFavorite,
}) => {
  const rowRef = useRef<HTMLDivElement | null>(null);

  const scrollRow = (dir: -1 | 1) => {
    if (!rowRef.current) return;
    const distance = Math.max(320, rowRef.current.clientWidth * 0.75);
    rowRef.current.scrollBy({ left: dir * distance, behavior: 'smooth' });
  };

  return (
    <div className="space-y-2 sm:space-y-2.5 group/row">
      {/* Row Header */}
      <div className="flex items-center justify-between px-3.5 sm:px-6 lg:px-10">
        <div className="flex items-baseline gap-2 sm:gap-3 min-w-0">
          <h3 className="text-base sm:text-xl font-display font-bold text-black tracking-tight truncate">
            {title}
          </h3>
          {subtitle && (
            <span className="text-[11px] sm:text-xs text-neutral-700 font-mono-tabular shrink-0">
              {subtitle}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 opacity-90 group-hover/row:opacity-100 transition-opacity shrink-0">
          <button
            type="button"
            onClick={() => scrollRow(-1)}
            aria-label={`Scroll ${title} left`}
            className="p-1.5 rounded-full bg-white hover:bg-emerald-600 text-black hover:text-white border border-emerald-300 shadow-sm transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => scrollRow(1)}
            aria-label={`Scroll ${title} right`}
            className="p-1.5 rounded-full bg-white hover:bg-emerald-600 text-black hover:text-white border border-emerald-300 shadow-sm transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Horizontal 16:9 Android TV Cards Rail */}
      <div
        ref={rowRef}
        className="flex items-stretch gap-3 sm:gap-4 overflow-x-auto no-scrollbar px-3.5 sm:px-6 lg:px-10 py-2.5 sm:py-3 scroll-smooth"
      >
        {channels.slice(0, 40).map((ch) => {
          const isCurrent = activeChannel?.id === ch.id;
          const isFav = favorites.includes(ch.id);
          const { current, progressPercent } = getNowAndNext(ch, xmltvMap.get(ch.tvgId));

          return (
            <div
              key={ch.id}
              tabIndex={0}
              onClick={() => onSelectChannel(ch)}
              onDoubleClick={() => onWatchFullscreen(ch)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') onSelectChannel(ch);
              }}
              className={`group relative w-[196px] sm:w-[252px] lg:w-[268px] shrink-0 rounded-xl overflow-hidden cursor-pointer transition-all duration-200 ease-out select-none outline-none sm:hover:scale-[1.04] focus-visible:scale-[1.04] ${
                isCurrent
                  ? 'bg-white ring-2 ring-emerald-600 shadow-xl'
                  : 'bg-white hover:bg-emerald-50/50 ring-1 ring-emerald-200 hover:ring-emerald-500 focus-visible:ring-2 focus-visible:ring-emerald-600 shadow-sm'
              }`}
            >
              {/* Top 16:9 Tile Preview Surface */}
              <div className="relative h-28 sm:h-32 bg-gradient-to-br from-emerald-50 via-white to-emerald-100/70 flex items-center justify-center p-3 sm:p-4">
                <div className="absolute top-2 left-2.5 sm:top-2.5 sm:left-3 flex items-center gap-1 text-[10px] sm:text-[11px] text-neutral-700 font-mono-tabular">
                  <span>CH {ch.number}</span>
                  <span aria-hidden="true">·</span>
                  <span className="text-black font-semibold font-sans">{ch.language}</span>
                </div>

                <button
                  type="button"
                  onClick={(e) => onToggleFavorite(ch.id, e)}
                  aria-label={`Favorite ${ch.name}`}
                  className={`absolute top-2 right-2 p-1.5 rounded-full transition-colors ${
                    isFav
                      ? 'text-emerald-600 bg-white shadow-sm'
                      : 'text-neutral-500 hover:text-black bg-white/80 opacity-100 sm:opacity-0 sm:group-hover:opacity-100'
                  }`}
                >
                  <Star className={`w-3.5 h-3.5 ${isFav ? 'fill-current' : ''}`} />
                </button>

                {ch.logo ? (
                  <img
                    src={ch.logo}
                    alt={ch.name}
                    referrerPolicy="no-referrer"
                    className="max-h-12 sm:max-h-14 max-w-[120px] sm:max-w-[140px] object-contain transition-transform duration-200 group-hover:scale-105"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-sm">
                    <span className="text-sm sm:text-base font-display font-bold">
                      {ch.name.slice(0, 2).toUpperCase()}
                    </span>
                  </div>
                )}

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onWatchFullscreen(ch);
                  }}
                  title="Watch Fullscreen TV (F)"
                  className="absolute bottom-2 right-2 sm:bottom-2.5 sm:right-2.5 px-2 sm:px-2.5 py-1 rounded-md bg-emerald-600 text-white text-[10px] sm:text-[11px] font-semibold opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity flex items-center gap-1 shadow-sm"
                >
                  <Play className="w-2.5 h-2.5 sm:w-3 sm:h-3 fill-current" />
                  <span>Full TV</span>
                </button>

                <div className="absolute inset-x-0 bottom-0 h-1 bg-emerald-100">
                  <div
                    className="h-full bg-emerald-600"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>

              <div className="p-2.5 sm:p-3 space-y-1 bg-white">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-xs sm:text-sm font-display font-semibold text-black truncate">
                    {ch.name}
                  </h4>
                  <span className="text-[10px] font-mono-tabular uppercase text-black font-semibold shrink-0">
                    {ch.mirrors[0]?.format || 'HLS'}
                  </span>
                </div>
                <p className="text-[11px] sm:text-xs text-neutral-700 truncate">{current.title}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default function App() {
  // Playlist & EPG State
  const [channels, setChannels] = useState<Channel[]>([]);
  const [categories, setCategories] = useState<string[]>(['All']);
  const [languages, setLanguages] = useState<string[]>(['All']);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [xmltvMap, setXmltvMap] = useState<Map<string, ProgramSlot[]>>(new Map());

  // Multi-Language Onboarding Gate
  const [hasChosenLanguage, setHasChosenLanguage] = useState<boolean>(false);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(['Hindi']);

  // Active Channel & Auto-Rotating Hero Banner State
  const [activeChannel, setActiveChannel] = useState<Channel | null>(null);
  const [activeMirrorIndex, setActiveMirrorIndex] = useState<number>(0);
  const [bannerIndex, setBannerIndex] = useState<number>(0);
  const [autoRotateBanner, setAutoRotateBanner] = useState<boolean>(true);
  const [bannerProgress, setBannerProgress] = useState<number>(0);

  // Android TV Navigation & Running Search Bar State
  const [activeNavTab, setActiveNavTab] = useState<'home' | 'epg' | 'favorites'>('home');
  const [searchMode, setSearchMode] = useState<'closed' | 'opening' | 'open' | 'closing'>('closed');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isFullscreenTV, setIsFullscreenTV] = useState<boolean>(false);
  const [isLandscapeRotated, setIsLandscapeRotated] = useState<boolean>(false);
  const [isViewportPortrait, setIsViewportPortrait] = useState<boolean>(() =>
    typeof window !== 'undefined' ? window.innerHeight > window.innerWidth : false
  );
  const [isPiP, setIsPiP] = useState<boolean>(false);
  const [isFloatingPiP, setIsFloatingPiP] = useState<boolean>(false);

  const searchContainerRef = useRef<HTMLDivElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const videoStageRef = useRef<HTMLDivElement | null>(null);

  // Favorites
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(FAVORITES_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Stream Player State
  const [, setIsPlaying] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(true);
  const [, setQualities] = useState<QualityLevel[]>([
    { index: -1, height: 0, bitrate: 0, label: 'Auto' },
  ]);
  const [, setSelectedQuality] = useState<number>(-1);
  const [telemetry, setTelemetry] = useState<StreamTelemetry>({
    status: 'loading',
    format: 'hls',
    resolution: '—',
    bitrateKbps: 0,
    latencySec: 0,
    droppedFrames: 0,
  });

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamControllerRef = useRef<AdaptiveStreamController | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favorites));
    } catch {
      // ignore storage errors
    }
  }, [favorites]);

  // Track physical device viewport orientation (portrait vs landscape) on mobile
  useEffect(() => {
    const updateViewportOrientation = () => {
      const portrait = window.innerHeight > window.innerWidth;
      setIsViewportPortrait(portrait);
    };

    updateViewportOrientation();
    window.addEventListener('resize', updateViewportOrientation);
    window.addEventListener('orientationchange', updateViewportOrientation);
    screen.orientation?.addEventListener?.('change', updateViewportOrientation);
    return () => {
      window.removeEventListener('resize', updateViewportOrientation);
      window.removeEventListener('orientationchange', updateViewportOrientation);
      screen.orientation?.removeEventListener?.('change', updateViewportOrientation);
    };
  }, []);

  // Helper to lock/unlock native mobile screen orientation when supported
  const setNativeLandscapeLock = useCallback(async (lockLandscape: boolean) => {
    const orientationApi = screen.orientation as
      | (ScreenOrientation & {
          lock?: (mode: string) => Promise<void>;
          unlock?: () => void;
        })
      | undefined;

    try {
      if (lockLandscape) {
        if (!document.fullscreenElement && videoStageRef.current?.requestFullscreen) {
          await videoStageRef.current.requestFullscreen().catch(() => {});
        }
        if (orientationApi?.lock) {
          await orientationApi.lock('landscape');
        }
      } else {
        if (orientationApi?.unlock) {
          orientationApi.unlock();
        }
        if (document.fullscreenElement && document.exitFullscreen) {
          await document.exitFullscreen().catch(() => {});
        }
      }
    } catch {
      // Browser or iframe policy may block native orientation lock; CSS landscape rotation handles it
    }
  }, []);

  // Toggle mobile landscape screen rotation (supports both native Screen Orientation API and 90° CSS landscape rotation)
  const handleToggleRotateScreen = useCallback(
    (e?: React.MouseEvent) => {
      if (e) e.stopPropagation();
      setAutoRotateBanner(false);
      setIsFloatingPiP(false);

      setIsLandscapeRotated((prev) => {
        const next = !prev;
        if (next) {
          setIsFullscreenTV(true);
          if (videoRef.current) {
            videoRef.current.muted = false;
            setIsMuted(false);
          }
          setNativeLandscapeLock(true);
        } else {
          setIsFullscreenTV(false);
          setNativeLandscapeLock(false);
        }
        return next;
      });
    },
    [setNativeLandscapeLock]
  );

  // Sync native Picture-in-Picture browser events with React state
  useEffect(() => {
    const videoEl = videoRef.current;
    if (!videoEl) return;

    const handleEnterPiP = () => {
      setIsPiP(true);
      setAutoRotateBanner(false);
    };
    const handleLeavePiP = () => {
      setIsPiP(false);
    };

    videoEl.addEventListener('enterpictureinpicture', handleEnterPiP);
    videoEl.addEventListener('leavepictureinpicture', handleLeavePiP);
    return () => {
      videoEl.removeEventListener('enterpictureinpicture', handleEnterPiP);
      videoEl.removeEventListener('leavepictureinpicture', handleLeavePiP);
    };
  }, [hasChosenLanguage]);

  // Toggle native Picture-in-Picture mode (with corner dock fallback if blocked by iframe/browser)
  const handleTogglePiP = useCallback(async () => {
    const videoEl = videoRef.current as
      | (HTMLVideoElement & {
          webkitPresentationMode?: string;
          webkitSupportsPresentationMode?: (mode: string) => boolean;
          webkitSetPresentationMode?: (mode: string) => void;
        })
      | null;
    if (!videoEl) return;

    setAutoRotateBanner(false);
    if (isFullscreenTV) {
      setIsFullscreenTV(false);
    }

    if (isFloatingPiP) {
      setIsFloatingPiP(false);
      return;
    }

    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
        setIsPiP(false);
        return;
      }

      if (
        typeof document.pictureInPictureEnabled !== 'undefined' &&
        document.pictureInPictureEnabled &&
        typeof videoEl.requestPictureInPicture === 'function'
      ) {
        await videoEl.requestPictureInPicture();
        setIsPiP(true);
        return;
      }

      if (
        typeof videoEl.webkitSupportsPresentationMode === 'function' &&
        videoEl.webkitSupportsPresentationMode('picture-in-picture') &&
        typeof videoEl.webkitSetPresentationMode === 'function'
      ) {
        const nextMode =
          videoEl.webkitPresentationMode === 'picture-in-picture'
            ? 'inline'
            : 'picture-in-picture';
        videoEl.webkitSetPresentationMode(nextMode);
        setIsPiP(nextMode === 'picture-in-picture');
        return;
      }

      // Fallback if native OS PiP is disabled by browser/iframe policy
      setIsFloatingPiP((prev) => !prev);
    } catch {
      // Fallback to floating corner PiP if native requestPictureInPicture throws
      setIsFloatingPiP((prev) => !prev);
    }
  }, [isFullscreenTV, isFloatingPiP]);

  // Open search bar from the exact place where the Search button exists
  const openSearchBar = useCallback(() => {
    setSearchMode('opening');
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setSearchMode('open');
        searchInputRef.current?.focus();
      });
    });
  }, []);

  // Close search bar with running retraction back to the Search button spot, then restore header buttons
  const closeSearchBar = useCallback(() => {
    setSearchMode((prev) => {
      if (prev === 'closed' || prev === 'closing') return prev;
      return 'closing';
    });
    window.setTimeout(() => {
      setSearchMode('closed');
    }, 300);
  }, []);

  // Detect click outside the search bar to hide it in a running effect and restore header buttons
  useEffect(() => {
    if (searchMode !== 'open' && searchMode !== 'opening') return;

    const handlePointerDownOutside = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node | null;
      if (searchContainerRef.current && target && !searchContainerRef.current.contains(target)) {
        closeSearchBar();
      }
    };

    document.addEventListener('mousedown', handlePointerDownOutside);
    document.addEventListener('touchstart', handlePointerDownOutside);
    return () => {
      document.removeEventListener('mousedown', handlePointerDownOutside);
      document.removeEventListener('touchstart', handlePointerDownOutside);
    };
  }, [searchMode, closeSearchBar]);

  // Load India M3U Playlist
  const loadPlaylist = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchIndiaPlaylist();
      setChannels(result.channels);
      setCategories(result.categories);
      setLanguages(result.languages);

      if (result.channels.length > 0) {
        setActiveChannel(result.channels[0]);
        setActiveMirrorIndex(0);
      }

      if (result.epgUrls.length > 0) {
        for (const epgUrl of result.epgUrls) {
          if (epgUrl.endsWith('.xml')) {
            fetch(epgUrl)
              .then((r) => (r.ok ? r.text() : ''))
              .then((xml) => {
                if (xml) {
                  const parsedEpg = parseXMLTVDocument(xml);
                  if (parsedEpg.size > 0) setXmltvMap(parsedEpg);
                }
              })
              .catch(() => {});
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load channels.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPlaylist();
  }, [loadPlaylist]);

  // Language counts for the onboarding screen and language rail
  const languageCounts = useMemo(() => {
    const counts: Record<string, number> = { All: channels.length };
    for (const ch of channels) {
      counts[ch.language] = (counts[ch.language] || 0) + 1;
    }
    return counts;
  }, [channels]);

  // Toggle a language in the multi-select array
  const handleToggleLanguageSelection = (langId: string) => {
    setSelectedLanguages((prev) => {
      if (langId === 'All') {
        return ['All'];
      }
      const withoutAll = prev.filter((item) => item !== 'All');
      if (withoutAll.includes(langId)) {
        const next = withoutAll.filter((item) => item !== langId);
        return next.length > 0 ? next : [];
      } else {
        return [...withoutAll, langId];
      }
    });
  };

  // Confirm language selection and enter ONLY when clicking Continue
  const handleConfirmLanguagesAndContinue = () => {
    if (selectedLanguages.length === 0) return;
    setHasChosenLanguage(true);
    setBannerIndex(0);
    setBannerProgress(0);
    setAutoRotateBanner(true);

    const matching = selectedLanguages.includes('All')
      ? channels
      : channels.filter((c) => selectedLanguages.includes(c.language));

    if (matching.length > 0) {
      setActiveChannel(matching[0]);
      setActiveMirrorIndex(0);
    } else if (channels.length > 0) {
      setActiveChannel(channels[0]);
      setActiveMirrorIndex(0);
    }
  };

  // Filtered channels based on multi-selected languages, search, and favorites tab
  const filteredChannels = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return channels.filter((ch) => {
      if (activeNavTab === 'favorites' && !favorites.includes(ch.id)) return false;
      if (
        selectedLanguages.length > 0 &&
        !selectedLanguages.includes('All') &&
        !selectedLanguages.includes(ch.language)
      ) {
        return false;
      }
      if (q) {
        return (
          ch.name.toLowerCase().includes(q) ||
          ch.language.toLowerCase().includes(q) ||
          ch.group.toLowerCase().includes(q) ||
          String(ch.number).includes(q)
        );
      }
      return true;
    });
  }, [channels, activeNavTab, favorites, selectedLanguages, searchQuery]);

  // Curate featured live channels for the auto-switching banner from the chosen languages
  const bannerChannels = useMemo(() => {
    const sourcePool = filteredChannels.length > 0 ? filteredChannels : channels;
    if (sourcePool.length === 0) return [];
    const picked: Channel[] = [];
    const seenGroups = new Set<string>();

    for (const ch of sourcePool) {
      if (!seenGroups.has(ch.group) && picked.length < 8) {
        picked.push(ch);
        seenGroups.add(ch.group);
      }
    }
    for (const ch of sourcePool) {
      if (picked.length >= 8) break;
      if (!picked.some((p) => p.id === ch.id)) {
        picked.push(ch);
      }
    }
    return picked;
  }, [filteredChannels, channels]);

  // Auto-switch featured channels in the Android TV hero banner at an interval
  useEffect(() => {
    if (
      !hasChosenLanguage ||
      !autoRotateBanner ||
      isFullscreenTV ||
      isPiP ||
      isFloatingPiP ||
      bannerChannels.length <= 1
    ) {
      setBannerProgress(0);
      return;
    }

    const stepMs = 100;
    const increment = (stepMs / BANNER_INTERVAL_MS) * 100;

    const timer = window.setInterval(() => {
      setBannerProgress((prev) => {
        if (prev + increment >= 100) {
          setBannerIndex((currentIdx) => {
            const nextIdx = (currentIdx + 1) % bannerChannels.length;
            const nextChannel = bannerChannels[nextIdx];
            if (nextChannel) {
              setActiveChannel(nextChannel);
              setActiveMirrorIndex(0);
            }
            return nextIdx;
          });
          return 0;
        }
        return prev + increment;
      });
    }, stepMs);

    return () => window.clearInterval(timer);
  }, [hasChosenLanguage, autoRotateBanner, isFullscreenTV, isPiP, isFloatingPiP, bannerChannels]);

  // Initialize HLS / DASH Stream Controller when video element mounts
  useEffect(() => {
    if (!hasChosenLanguage || !videoRef.current) return;
    const ctrl = new AdaptiveStreamController(videoRef.current, {
      onTelemetryChange: (tel) => {
        setTelemetry(tel);
        if (tel.status === 'playing') setIsPlaying(true);
        if (tel.status === 'paused') setIsPlaying(false);
      },
      onQualitiesLoaded: (qList, curIdx) => {
        setQualities(qList);
        setSelectedQuality(curIdx);
      },
      onAudioTracksLoaded: () => {},
    });
    streamControllerRef.current = ctrl;

    if (activeChannel) {
      const mirror = activeChannel.mirrors[activeMirrorIndex] || activeChannel.mirrors[0];
      if (mirror) {
        ctrl.loadStream(mirror.url, mirror.format, false);
      }
    }

    return () => {
      ctrl.dispose();
      streamControllerRef.current = null;
    };
  }, [hasChosenLanguage]);

  // Load stream when activeChannel or mirror changes
  useEffect(() => {
    if (!hasChosenLanguage || !activeChannel || !streamControllerRef.current) return;
    const mirror = activeChannel.mirrors[activeMirrorIndex] || activeChannel.mirrors[0];
    if (!mirror) return;
    streamControllerRef.current.loadStream(mirror.url, mirror.format, false);
  }, [hasChosenLanguage, activeChannel, activeMirrorIndex]);

  // Global Keyboard Shortcuts: 'f' / 'F' toggles fullscreen; ArrowUp / ArrowDown surfs channels in fullscreen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!hasChosenLanguage) return;
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        setIsFullscreenTV((prev) => {
          const next = !prev;
          if (next) {
            setAutoRotateBanner(false);
            setIsFloatingPiP(false);
          } else {
            setIsLandscapeRotated(false);
            setNativeLandscapeLock(false);
          }
          return next;
        });
        return;
      }

      if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        handleToggleRotateScreen();
        return;
      }

      if (!isFullscreenTV) return;

      if (e.key === 'Escape' || e.key === 'Backspace') {
        setIsFullscreenTV(false);
        setIsLandscapeRotated(false);
        setNativeLandscapeLock(false);
      } else if (e.key === 'ArrowUp' || e.key === 'ChannelUp') {
        e.preventDefault();
        if (!activeChannel || filteredChannels.length === 0) return;
        const idx = filteredChannels.findIndex((c) => c.id === activeChannel.id);
        const nextCh = filteredChannels[(idx + 1) % filteredChannels.length];
        if (nextCh) {
          setActiveChannel(nextCh);
          setActiveMirrorIndex(0);
        }
      } else if (e.key === 'ArrowDown' || e.key === 'ChannelDown') {
        e.preventDefault();
        if (!activeChannel || filteredChannels.length === 0) return;
        const idx = filteredChannels.findIndex((c) => c.id === activeChannel.id);
        const prevCh =
          filteredChannels[(idx - 1 + filteredChannels.length) % filteredChannels.length];
        if (prevCh) {
          setActiveChannel(prevCh);
          setActiveMirrorIndex(0);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    hasChosenLanguage,
    isFullscreenTV,
    activeChannel,
    filteredChannels,
    handleToggleRotateScreen,
    setNativeLandscapeLock,
  ]);

  const handleSelectChannel = (ch: Channel) => {
    setActiveChannel(ch);
    setActiveMirrorIndex(0);
    setBannerProgress(0);
    setAutoRotateBanner(false);
    const bIdx = bannerChannels.findIndex((b) => b.id === ch.id);
    if (bIdx !== -1) setBannerIndex(bIdx);
    // Keep scroll position when browsing channels in Picture-in-Picture mode
    if (!isPiP && !isFloatingPiP) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleWatchFullscreen = (ch: Channel) => {
    setActiveChannel(ch);
    setActiveMirrorIndex(0);
    setAutoRotateBanner(false);
    setIsFloatingPiP(false);
    setIsFullscreenTV(true);
    if (window.innerWidth < 768) {
      setIsLandscapeRotated(true);
      setNativeLandscapeLock(true);
    }
    if (videoRef.current) {
      videoRef.current.muted = false;
      setIsMuted(false);
    }
  };

  const handleBannerStep = (dir: -1 | 1) => {
    if (bannerChannels.length === 0) return;
    const nextIdx = (bannerIndex + dir + bannerChannels.length) % bannerChannels.length;
    setBannerIndex(nextIdx);
    setBannerProgress(0);
    const nextCh = bannerChannels[nextIdx];
    if (nextCh) {
      setActiveChannel(nextCh);
      setActiveMirrorIndex(0);
    }
  };

  const handleToggleFavorite = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleToggleMute = () => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setIsMuted(v.muted);
    if (!v.muted) {
      setAutoRotateBanner(false);
    }
  };

  const handleLoadBackupStream = (format: 'hls' | 'dash') => {
    if (!streamControllerRef.current) return;
    setAutoRotateBanner(false);
    const preset =
      format === 'dash'
        ? VERIFIED_BROADCAST_STREAMS.dashPrimary
        : VERIFIED_BROADCAST_STREAMS.hlsPrimary;
    streamControllerRef.current.loadStream(preset.url, preset.format, true);
  };

  // Group filtered channels into horizontal Android TV swimlanes by Type
  const channelsByCategory = useMemo(() => {
    const groups = new Map<string, Channel[]>();
    const preferredOrder = [
      'News',
      'Entertainment',
      'Movies',
      'Music',
      'Sports',
      'Kids',
      'Knowledge & Public',
      'Business',
      'Devotional',
    ];

    for (const cat of preferredOrder) {
      groups.set(cat, []);
    }

    for (const ch of filteredChannels) {
      const list = groups.get(ch.group) || [];
      list.push(ch);
      groups.set(ch.group, list);
    }

    return Array.from(groups.entries()).filter(([, list]) => list.length > 0);
  }, [filteredChannels]);

  const activeEpg = useMemo(() => {
    if (!activeChannel) return null;
    return getNowAndNext(activeChannel, xmltvMap.get(activeChannel.tvgId));
  }, [activeChannel, xmltvMap]);

  const selectedLanguagesSummary = useMemo(() => {
    if (selectedLanguages.includes('All') || selectedLanguages.length === 0) {
      return 'All Languages';
    }
    return selectedLanguages.join(', ');
  }, [selectedLanguages]);

  // ---------------------------------------------------------------------------
  // STEP 1: MULTI-SELECT LANGUAGE ONBOARDING SCREEN
  // ---------------------------------------------------------------------------
  if (!hasChosenLanguage) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-100 via-white to-emerald-50 text-black flex flex-col justify-between p-4 sm:p-8 lg:p-12 select-none">
        <div className="flex flex-wrap items-center justify-between gap-2 max-w-6xl w-full mx-auto">
          <LiveTvLogo size="md" showTagline />
          <span className="text-[11px] sm:text-xs font-semibold text-neutral-700">
            {loading
              ? 'Loading India Live Channels...'
              : `${channels.length} Live Channels Ready`}
          </span>
        </div>

        <div className="max-w-5xl w-full mx-auto my-auto py-5 sm:py-8 space-y-6 sm:space-y-8">
          <div className="space-y-1.5 sm:space-y-2 text-center sm:text-left">
            <p className="text-[11px] sm:text-xs font-bold uppercase tracking-widest text-black">
              Step 1 · Personalize Live TV Network
            </p>
            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-display font-bold text-black tracking-tight">
              Choose Your Preferred Languages
            </h1>
            <p className="text-xs sm:text-base text-neutral-700 max-w-2xl">
              Select one or multiple languages below, then click <strong>Continue</strong> to enter and watch live channels tailored to your selection.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5 sm:gap-3.5">
            {RECOMMENDED_LANGUAGES.map((item) => {
              const count = languageCounts[item.id] ?? 0;
              const isSelected = selectedLanguages.includes(item.id);
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleToggleLanguageSelection(item.id)}
                  className={`group relative rounded-2xl p-3 sm:p-4 text-left transition-all duration-200 outline-none sm:hover:scale-[1.03] focus-visible:scale-[1.03] border ${
                    isSelected
                      ? 'bg-emerald-600 text-white border-emerald-700 shadow-xl ring-2 ring-emerald-600'
                      : 'bg-white hover:bg-emerald-50 text-black border-emerald-300 hover:border-emerald-500 shadow-sm'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] sm:text-[11px] font-semibold gap-1">
                    <span className={`truncate ${isSelected ? 'text-white' : 'text-neutral-700'}`}>
                      {item.tag}
                    </span>
                    <div className="flex items-center gap-1 shrink-0">
                      {!loading && (
                        <span
                          className={`font-mono-tabular ${
                            isSelected ? 'text-white' : 'text-neutral-600'
                          }`}
                        >
                          {count} CH
                        </span>
                      )}
                      <div
                        className={`w-4 h-4 rounded-full flex items-center justify-center border ${
                          isSelected
                            ? 'bg-white text-emerald-700 border-white'
                            : 'border-neutral-400 bg-transparent'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                    </div>
                  </div>

                  <div className="mt-2 sm:mt-3">
                    <div
                      className={`text-base sm:text-lg font-display font-bold truncate ${
                        isSelected ? 'text-white' : 'text-black'
                      }`}
                    >
                      {item.label}
                    </div>
                    <div
                      className={`text-xs mt-0.5 truncate ${
                        isSelected ? 'text-white/90' : 'text-neutral-600'
                      }`}
                    >
                      {item.native}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 pt-4 sm:pt-5 border-t border-emerald-200">
            <div className="text-xs sm:text-sm font-medium text-black text-center sm:text-left">
              {selectedLanguages.length === 0 ? (
                <span className="text-red-600">Please select at least one language to continue.</span>
              ) : (
                <span>
                  Selected: <strong>{selectedLanguagesSummary}</strong>
                </span>
              )}
            </div>

            <button
              type="button"
              disabled={(loading && channels.length === 0) || selectedLanguages.length === 0}
              onClick={handleConfirmLanguagesAndContinue}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 rounded-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:pointer-events-none text-white text-sm font-semibold transition-colors shadow-lg cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>
                {loading && channels.length === 0
                  ? 'Loading Channels...'
                  : `Continue (${selectedLanguages.includes('All') ? 'All' : selectedLanguages.length})`}
              </span>
            </button>
          </div>
        </div>

        <div className="max-w-6xl w-full mx-auto text-[11px] sm:text-xs text-neutral-600 text-center sm:text-left">
          Live TV Network · HLS & MPEG-DASH Broadcast Directory
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // STEP 2: ANDROID TV MAIN INTERFACE
  // ---------------------------------------------------------------------------
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-100/70 via-white to-emerald-50 text-black select-none overflow-x-hidden">
      {/* ANDROID TV TOP LAUNCHER BAR — 50% transparent background, mobile responsive */}
      {!isFullscreenTV && (
        <header className="sticky top-0 z-30 flex flex-wrap md:flex-nowrap items-center justify-between gap-x-4 gap-y-2.5 md:gap-8 px-3.5 sm:px-6 lg:px-10 py-2.5 sm:py-3.5 bg-gradient-to-r from-emerald-100/50 via-white/50 to-emerald-50/50 backdrop-blur-md min-h-[60px] sm:min-h-[68px]">
          {/* Zone 1: Brand Logo & Wordmark */}
          <a
            href="#tv-home"
            onClick={(e) => {
              e.preventDefault();
              setActiveNavTab('home');
              setSearchQuery('');
              setIsFullscreenTV(false);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="whitespace-nowrap shrink-0"
          >
            <LiveTvLogo size="md" />
          </a>

          {/* Zone 2: Center Navigation / In-Place Running Search Bar */}
          <div className="order-3 md:order-2 w-full md:w-auto md:flex-1 flex items-center justify-start md:justify-center">
            <div className="w-full max-w-xl flex items-center justify-start">
              {searchMode !== 'closed' ? (
                /* Search bar expands directly from the left spot where the Search button sits */
                <div
                  ref={searchContainerRef}
                  className={`origin-left overflow-hidden transition-all duration-300 ease-out ${
                    searchMode === 'open'
                      ? 'w-full opacity-100 scale-x-100'
                      : 'w-0 opacity-0 scale-x-75'
                  }`}
                >
                  <div className="relative w-full">
                    <Search className="w-4 h-4 text-black absolute left-3.5 sm:left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      ref={searchInputRef}
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Escape') closeSearchBar();
                      }}
                      placeholder={`Search ${filteredChannels.length} live channels...`}
                      className="w-full pl-10 sm:pl-11 pr-9 sm:pr-10 py-1.5 sm:py-2 text-xs sm:text-sm rounded-full bg-white/95 border-2 border-emerald-600 text-black placeholder-neutral-500 focus:outline-none shadow-md"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => {
                          setSearchQuery('');
                          searchInputRef.current?.focus();
                        }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-neutral-600 hover:text-black"
                        aria-label="Clear search"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <nav className="flex items-center gap-4 sm:gap-6 text-xs sm:text-sm font-medium text-neutral-800 overflow-x-auto no-scrollbar w-full py-0.5">
                  <button
                    type="button"
                    onClick={openSearchBar}
                    className="flex items-center gap-1.5 hover:text-black transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span>Search</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveNavTab('home');
                      setIsFullscreenTV(false);
                    }}
                    className={`hover:text-black transition-colors whitespace-nowrap shrink-0 ${
                      activeNavTab === 'home' && !isFullscreenTV
                        ? 'text-black font-bold underline underline-offset-8 decoration-2 decoration-emerald-600'
                        : ''
                    }`}
                  >
                    Home
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsFullscreenTV(true)}
                    className="hover:text-black transition-colors whitespace-nowrap shrink-0"
                  >
                    Live Player
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveNavTab('epg');
                      setIsFullscreenTV(false);
                    }}
                    className={`hover:text-black transition-colors whitespace-nowrap shrink-0 ${
                      activeNavTab === 'epg' && !isFullscreenTV
                        ? 'text-black font-bold underline underline-offset-8 decoration-2 decoration-emerald-600'
                        : ''
                    }`}
                  >
                    TV Guide
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveNavTab('favorites');
                      setIsFullscreenTV(false);
                    }}
                    className={`hover:text-black transition-colors whitespace-nowrap shrink-0 ${
                      activeNavTab === 'favorites' && !isFullscreenTV
                        ? 'text-black font-bold underline underline-offset-8 decoration-2 decoration-emerald-600'
                        : ''
                    }`}
                  >
                    Watchlist ({favorites.length})
                  </button>
                </nav>
              )}
            </div>
          </div>

          {/* Zone 3: 1 Primary Action (Hidden when Search is open) */}
          <div className="order-2 md:order-3 flex items-center gap-2 sm:gap-3 shrink-0 md:min-w-[140px] justify-end">
            {searchMode === 'closed' && (
              <button
                type="button"
                onClick={() => setHasChosenLanguage(false)}
                className="flex items-center gap-1.5 px-3 sm:px-4 py-1.5 text-[11px] sm:text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-full transition-colors whitespace-nowrap shrink-0 shadow-sm"
              >
                <Globe className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate max-w-[130px] sm:max-w-[180px]">
                  <span className="hidden sm:inline">Languages: </span>
                  {selectedLanguagesSummary}
                </span>
              </button>
            )}
          </div>
        </header>
      )}

      {/* SHARED LIVE VIDEO STAGE:
          Press 'f' (or click the fullscreen video / press Escape) to toggle fullscreen.
          In Fullscreen mode (`isFullscreenTV === true`), ALL details, banners, and OSD overlays are hidden. */}
      <div
        ref={videoStageRef}
        onClick={() => {
          if (isFullscreenTV) {
            setIsFullscreenTV(false);
            setIsLandscapeRotated(false);
            setNativeLandscapeLock(false);
          }
        }}
        className={
          isFullscreenTV
            ? isLandscapeRotated && isViewportPortrait
              ? 'fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[100dvh] h-[100dvw] rotate-90 z-50 bg-black cursor-pointer'
              : 'fixed inset-0 z-50 bg-black cursor-pointer'
            : isFloatingPiP
              ? 'fixed bottom-3 right-3 sm:bottom-5 sm:right-5 z-40 w-[236px] sm:w-[360px] aspect-video rounded-xl sm:rounded-2xl overflow-hidden bg-black border-2 border-emerald-600 shadow-2xl flex flex-col justify-between transition-all duration-300'
              : 'relative mx-2.5 sm:mx-6 lg:mx-10 mt-2 sm:mt-3 rounded-2xl sm:rounded-3xl overflow-hidden bg-black border-2 border-emerald-500/40 shadow-2xl h-[45vh] sm:h-[62vh] lg:h-[74vh] min-h-[290px] sm:min-h-[420px] max-h-[860px] flex flex-col justify-between'
        }
      >
        {/* Full-Width Unobstructed Video Element */}
        <div className="absolute inset-0 w-full h-full bg-black">
          <video
            ref={videoRef}
            playsInline
            crossOrigin="anonymous"
            muted={isMuted}
            className="w-full h-full object-contain bg-black"
          />

          {/* Native Picture-in-Picture Active Status Banner inside Main Stage */}
          {!isFullscreenTV && isPiP && (
            <div className="absolute inset-0 bg-black/75 flex flex-col items-center justify-center p-4 sm:p-6 text-center z-10 pointer-events-none">
              <PictureInPicture2 className="w-7 h-7 sm:w-9 sm:h-9 text-emerald-400 mb-2" />
              <p className="text-xs sm:text-base font-display font-bold text-white">
                Playing in Picture-in-Picture
              </p>
              <p className="text-[11px] sm:text-xs text-white/80 mt-1 max-w-sm">
                Browse channels below — selecting any channel switches the live stream directly inside your Picture-in-Picture window.
              </p>
            </div>
          )}

          {/* Subtle Bottom Scrim ONLY when NOT in Fullscreen */}
          {!isFullscreenTV && (
            <div className="absolute inset-x-0 bottom-0 h-36 sm:h-44 bg-gradient-to-t from-black/85 via-black/40 to-transparent pointer-events-none" />
          )}

          {/* Offline / Geo-Blocked Stream Recovery Overlay (Only shown when not in clean fullscreen) */}
          {!isFullscreenTV && telemetry.status === 'error' && (
            <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center p-4 sm:p-6 text-center z-20">
              <AlertCircle className="w-7 h-7 sm:w-8 sm:h-8 text-emerald-400 mb-1.5 sm:mb-2" />
              <p className="text-xs sm:text-sm font-medium text-white max-w-md">
                {telemetry.errorMessage || 'Channel stream is currently offline or geo-restricted.'}
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2 mt-3 sm:mt-4">
                {activeChannel && activeChannel.mirrors.length > 1 && (
                  <button
                    type="button"
                    onClick={() =>
                      setActiveMirrorIndex((prev) => (prev + 1) % activeChannel.mirrors.length)
                    }
                    className="px-3 sm:px-4 py-1.5 sm:py-2 text-[11px] sm:text-xs font-semibold rounded-full bg-white/15 hover:bg-white/25 text-white transition-colors"
                  >
                    Switch Feed ({activeMirrorIndex + 1}/{activeChannel.mirrors.length})
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleLoadBackupStream('hls')}
                  className="px-3 sm:px-4 py-1.5 sm:py-2 text-[11px] sm:text-xs font-semibold rounded-full bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
                >
                  Play Verified HLS Stream
                </button>
                <button
                  type="button"
                  onClick={() => handleLoadBackupStream('dash')}
                  className="px-3 sm:px-4 py-1.5 sm:py-2 text-[11px] sm:text-xs font-semibold rounded-full bg-white hover:bg-neutral-100 text-black transition-colors"
                >
                  Play Verified DASH Stream
                </button>
              </div>
            </div>
          )}
        </div>

        {/* COMPACT FLOATING CORNER CONTROLS (Used if browser/iframe falls back to in-app corner PiP) */}
        {!isFullscreenTV && isFloatingPiP && (
          <div className="relative z-10 w-full h-full flex flex-col justify-between p-2 sm:p-3">
            <div className="flex items-center justify-between gap-1.5 sm:gap-2">
              <span className="px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full bg-white/95 text-black font-mono-tabular font-bold text-[10px] sm:text-[11px] truncate shadow">
                CH {activeChannel?.number || 100} · {activeChannel?.name}
              </span>
              <button
                type="button"
                onClick={handleTogglePiP}
                title="Exit Picture-in-Picture"
                aria-label="Exit Picture-in-Picture"
                className="p-1 sm:p-1.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white shadow transition-colors shrink-0"
              >
                <X className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              </button>
            </div>
            <div className="flex items-center justify-end gap-1.5">
              <button
                type="button"
                onClick={handleToggleMute}
                title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
                className="p-1 sm:p-1.5 rounded-full bg-white/95 hover:bg-white text-black shadow transition-colors"
              >
                {isMuted ? (
                  <VolumeX className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-black" />
                ) : (
                  <Volume2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-600" />
                )}
              </button>
              <button
                type="button"
                onClick={handleToggleRotateScreen}
                title="Rotate Screen to Landscape (R)"
                className="p-1 sm:p-1.5 rounded-full bg-white/95 hover:bg-white text-black shadow transition-colors"
              >
                <RotateCw className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-black" />
              </button>
              <button
                type="button"
                onClick={() => activeChannel && handleWatchFullscreen(activeChannel)}
                title="Watch Fullscreen (F)"
                className="p-1 sm:p-1.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white shadow transition-colors"
              >
                <Maximize2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* HERO BANNER DETAILS & CONTROLS — Completely hidden when watching in Fullscreen or Corner PiP */}
        {!isFullscreenTV && !isFloatingPiP && (
          <>
            {/* Top Bar Inside Banner: Channel Badge & Auto-Switch Controls */}
            <div className="relative z-10 flex flex-wrap items-center justify-between gap-2 sm:gap-3 p-3 sm:p-6">
              <div className="flex items-center gap-1.5 sm:gap-2.5 px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-full bg-white/95 text-black shadow-md max-w-full">
                <span className="font-mono-tabular font-bold text-[11px] sm:text-xs whitespace-nowrap">
                  LIVE · CH {activeChannel?.number || 100}
                </span>
                <span aria-hidden="true">·</span>
                <span className="text-[11px] sm:text-xs font-semibold truncate">
                  {activeChannel?.language || 'India'}
                </span>
                <span className="hidden xs:inline" aria-hidden="true">
                  ·
                </span>
                <span className="hidden xs:inline text-[11px] sm:text-xs text-neutral-700 truncate">
                  {activeChannel?.group || 'TV'}
                </span>
              </div>

              <div className="flex items-center gap-1.5 sm:gap-2">
                <button
                  type="button"
                  onClick={() => setAutoRotateBanner((prev) => !prev)}
                  className={`px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-full text-[11px] sm:text-xs font-semibold transition-colors shadow-md whitespace-nowrap ${
                    autoRotateBanner
                      ? 'bg-emerald-600 text-white'
                      : 'bg-white/95 text-black hover:bg-white'
                  }`}
                >
                  {autoRotateBanner ? 'Auto-Switch: On' : 'Auto-Switch: Paused'}
                </button>
                <button
                  type="button"
                  onClick={() => handleBannerStep(-1)}
                  aria-label="Previous spotlight channel"
                  className="p-1.5 sm:p-2 rounded-full bg-white/95 hover:bg-emerald-600 text-black hover:text-white shadow-md transition-colors"
                >
                  <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleBannerStep(1)}
                  aria-label="Next spotlight channel"
                  className="p-1.5 sm:p-2 rounded-full bg-white/95 hover:bg-emerald-600 text-black hover:text-white shadow-md transition-colors"
                >
                  <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </button>
              </div>
            </div>

            {/* Bottom Compact Dock Inside Banner: Channel Info & Action Controls */}
            <div className="relative z-10 w-full p-3.5 sm:p-6 lg:p-8 flex flex-col lg:flex-row items-start lg:items-end justify-between gap-3 sm:gap-4">
              <div className="flex items-center gap-3 sm:gap-4 min-w-0 max-w-full">
                {activeChannel?.logo && (
                  <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-white p-1.5 sm:p-2 flex items-center justify-center shrink-0 shadow-lg">
                    <img
                      src={activeChannel.logo}
                      alt={activeChannel.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                )}
                <div className="min-w-0">
                  <h1 className="text-base sm:text-2xl lg:text-3xl font-display font-bold text-white tracking-tight truncate drop-shadow">
                    {activeChannel?.name || 'Loading Live Television...'}
                  </h1>
                  {activeEpg && (
                    <p className="text-[11px] sm:text-sm text-white/90 truncate mt-0.5 drop-shadow">
                      Now Playing: <strong>{activeEpg.current.title}</strong>
                    </p>
                  )}
                </div>
              </div>

              {/* Action Controls & Slide Indicators */}
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2.5 w-full lg:w-auto shrink-0">
                <button
                  type="button"
                  onClick={() => activeChannel && handleWatchFullscreen(activeChannel)}
                  className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-semibold transition-colors shadow-lg whitespace-nowrap shrink-0"
                >
                  <Maximize2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span className="sm:hidden">Fullscreen</span>
                  <span className="hidden sm:inline">Watch Fullscreen (F)</span>
                </button>

                <button
                  type="button"
                  onClick={handleToggleRotateScreen}
                  title="Rotate Screen to Landscape (R)"
                  className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-semibold transition-colors shadow-lg whitespace-nowrap shrink-0 ${
                    isLandscapeRotated
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                      : 'bg-white hover:bg-neutral-100 text-black'
                  }`}
                >
                  <RotateCw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span className="sm:hidden">Rotate</span>
                  <span className="hidden sm:inline">Rotate Screen</span>
                </button>

                <button
                  type="button"
                  onClick={handleTogglePiP}
                  title="Toggle Picture-in-Picture mode"
                  className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-semibold transition-colors shadow-lg whitespace-nowrap shrink-0 ${
                    isPiP || isFloatingPiP
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                      : 'bg-white hover:bg-neutral-100 text-black'
                  }`}
                >
                  <PictureInPicture2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span className="sm:hidden">{isPiP || isFloatingPiP ? 'Exit PiP' : 'PiP'}</span>
                  <span className="hidden sm:inline">
                    {isPiP || isFloatingPiP ? 'Exit PiP' : 'Picture-in-Picture'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={handleToggleMute}
                  className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-white hover:bg-neutral-100 text-black text-xs sm:text-sm font-semibold transition-colors shadow-lg whitespace-nowrap shrink-0"
                >
                  {isMuted ? (
                    <>
                      <VolumeX className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-black" />
                      <span className="sm:hidden">Unmute</span>
                      <span className="hidden sm:inline">Unmute Audio</span>
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600" />
                      <span className="sm:hidden">Mute</span>
                      <span className="hidden sm:inline">Mute Audio</span>
                    </>
                  )}
                </button>

                {activeChannel && (
                  <button
                    type="button"
                    onClick={() => handleToggleFavorite(activeChannel.id)}
                    className={`flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap shrink-0 shadow-lg ${
                      favorites.includes(activeChannel.id)
                        ? 'bg-emerald-600 text-white'
                        : 'bg-white hover:bg-neutral-100 text-black'
                    }`}
                  >
                    <Star
                      className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${
                        favorites.includes(activeChannel.id) ? 'fill-current' : ''
                      }`}
                    />
                    <span>
                      {favorites.includes(activeChannel.id) ? 'Saved' : 'Watchlist'}
                    </span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    if (activeChannel) {
                      const m =
                        activeChannel.mirrors[activeMirrorIndex] || activeChannel.mirrors[0];
                      if (m) streamControllerRef.current?.loadStream(m.url, m.format, false);
                    }
                  }}
                  className="p-1.5 sm:p-2 rounded-full bg-white hover:bg-neutral-100 text-black shadow-lg transition-colors shrink-0"
                  title="Reload Stream"
                  aria-label="Reload Stream"
                >
                  <RefreshCw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </button>

                {/* Slide Indicators */}
                <div className="hidden sm:flex items-center gap-1.5 bg-white/95 px-3 py-2 rounded-full shadow-lg">
                  {bannerChannels.map((bCh, idx) => {
                    const isCurrent = idx === bannerIndex;
                    return (
                      <button
                        key={bCh.id}
                        type="button"
                        onClick={() => {
                          setBannerIndex(idx);
                          setBannerProgress(0);
                          setActiveChannel(bCh);
                          setActiveMirrorIndex(0);
                        }}
                        title={bCh.name}
                        className={`h-1.5 rounded-full overflow-hidden transition-all ${
                          isCurrent ? 'w-8 bg-neutral-300' : 'w-2.5 bg-neutral-300 hover:bg-neutral-500'
                        }`}
                      >
                        {isCurrent && (
                          <div
                            className="h-full bg-emerald-600 transition-all duration-100 ease-linear"
                            style={{ width: `${autoRotateBanner ? bannerProgress : 100}%` }}
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* MAIN ANDROID TV CONTENT AREA BELOW HERO — Hidden when watching in Fullscreen */}
      {!isFullscreenTV && (
        <main className="py-5 sm:py-8 space-y-6 sm:space-y-8">
          {activeNavTab === 'epg' ? (
            <div className="mx-2.5 sm:mx-6 lg:mx-10 rounded-2xl bg-white border border-emerald-200 shadow-lg overflow-hidden h-[75vh] min-h-[420px] sm:min-h-[520px]">
              <EpgGuidePanel
                channels={channels}
                activeChannel={activeChannel}
                secondaryChannel={null}
                favorites={favorites}
                recentIds={[]}
                categories={categories}
                languages={languages}
                selectedCategory="All"
                selectedLanguage={selectedLanguages[0] || 'All'}
                selectedLanguages={selectedLanguages}
                searchQuery={searchQuery}
                onlyFavorites={false}
                isMultiView={false}
                xmltvMap={xmltvMap}
                onSearchChange={setSearchQuery}
                onCategoryChange={() => {}}
                onLanguageChange={(l) => setSelectedLanguages([l])}
                onToggleOnlyFavorites={() => {}}
                onSelectChannel={(ch) => {
                  handleSelectChannel(ch);
                  setActiveNavTab('home');
                }}
                onSelectSecondaryChannel={() => {}}
                onToggleFavorite={handleToggleFavorite}
              />
            </div>
          ) : (
            <>
              {/* ANDROID TV MULTI-SELECT LANGUAGE RAIL */}
              <section className="space-y-2 sm:space-y-2.5">
                <div className="px-3.5 sm:px-6 lg:px-10 flex flex-wrap items-center justify-between gap-2">
                  <h2 className="text-xs sm:text-sm font-bold text-black">
                    Languages (Tap to toggle multiple)
                  </h2>
                  <span className="text-[11px] sm:text-xs font-mono-tabular text-neutral-700">
                    {filteredChannels.length} channels available
                  </span>
                </div>

                <div className="flex items-center gap-2 sm:gap-2.5 overflow-x-auto no-scrollbar px-3.5 sm:px-6 lg:px-10 py-1">
                  {languages.map((lang) => {
                    const active = selectedLanguages.includes(lang);
                    const count = languageCounts[lang] || 0;
                    return (
                      <button
                        key={lang}
                        type="button"
                        onClick={() => {
                          setSelectedLanguages((prev) => {
                            if (lang === 'All') return ['All'];
                            const withoutAll = prev.filter((item) => item !== 'All');
                            if (withoutAll.includes(lang)) {
                              const next = withoutAll.filter((item) => item !== lang);
                              return next.length > 0 ? next : ['All'];
                            }
                            return [...withoutAll, lang];
                          });
                        }}
                        className={`px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-all whitespace-nowrap shrink-0 border ${
                          active
                            ? 'bg-emerald-600 text-white border-emerald-600 font-semibold shadow-md scale-[1.03]'
                            : 'bg-white text-black hover:bg-emerald-50 border-emerald-200 shadow-xs'
                        }`}
                      >
                        <span>{lang === 'All' ? 'All Languages' : lang}</span>
                        <span
                          className={`ml-1.5 text-[11px] sm:text-xs font-mono-tabular ${
                            active ? 'text-white/90' : 'text-neutral-600'
                          }`}
                        >
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </section>

              {/* CATEGORIZED ANDROID TV HORIZONTAL SWIMLANES */}
              {loading ? (
                <div className="py-16 sm:py-20 text-center space-y-3">
                  <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-xs sm:text-sm text-black">
                    Loading live Indian TV channels...
                  </p>
                </div>
              ) : error ? (
                <div className="mx-3.5 sm:mx-10 rounded-2xl bg-white border border-emerald-300 p-6 sm:p-8 text-center space-y-3 shadow-sm">
                  <p className="text-xs sm:text-sm text-black">{error}</p>
                  <button
                    type="button"
                    onClick={loadPlaylist}
                    className="px-4 py-2 text-xs font-semibold rounded-full bg-emerald-600 text-white"
                  >
                    Retry
                  </button>
                </div>
              ) : channelsByCategory.length === 0 ? (
                <div className="mx-3.5 sm:mx-10 rounded-2xl bg-white border border-emerald-200 py-14 sm:py-16 text-center space-y-2 shadow-sm">
                  <Tv className="w-8 h-8 text-neutral-400 mx-auto" />
                  <p className="text-xs sm:text-sm font-medium text-black">
                    No channels match your current filter
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedLanguages(['All']);
                      setSearchQuery('');
                      setActiveNavTab('home');
                    }}
                    className="mt-2 px-4 py-1.5 text-xs font-semibold rounded-full bg-emerald-600 text-white"
                  >
                    Show All Languages
                  </button>
                </div>
              ) : (
                <section className="space-y-5 sm:space-y-6">
                  {channelsByCategory.map(([categoryName, categoryChannels]) => (
                    <HorizontalSwimlane
                      key={categoryName}
                      title={
                        selectedLanguages.includes('All') || selectedLanguages.length > 2
                          ? categoryName
                          : `${selectedLanguages.join(' & ')} ${categoryName}`
                      }
                      subtitle={`${categoryChannels.length} Channels`}
                      channels={categoryChannels}
                      activeChannel={activeChannel}
                      favorites={favorites}
                      xmltvMap={xmltvMap}
                      onSelectChannel={handleSelectChannel}
                      onWatchFullscreen={handleWatchFullscreen}
                      onToggleFavorite={handleToggleFavorite}
                    />
                  ))}
                </section>
              )}
            </>
          )}
        </main>
      )}
    </div>
  );
}
