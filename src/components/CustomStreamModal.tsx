import React, { useState } from 'react';
import { X, Play, Plus, Radio, CheckCircle2 } from 'lucide-react';
import { Channel, StreamFormat } from '../types';
import { detectStreamFormat, VERIFIED_BROADCAST_STREAMS } from '../services/m3uParser';

interface CustomStreamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddAndPlayChannel: (channel: Channel) => void;
  onImportM3UUrl: (url: string) => Promise<void>;
  onImportXmltvUrl: (url: string) => Promise<void>;
}

export const CustomStreamModal: React.FC<CustomStreamModalProps> = ({
  isOpen,
  onClose,
  onAddAndPlayChannel,
  onImportM3UUrl,
  onImportXmltvUrl,
}) => {
  const [activeTab, setActiveTab] = useState<'stream' | 'playlist' | 'epg'>('stream');
  const [streamName, setStreamName] = useState('');
  const [streamUrl, setStreamUrl] = useState('');
  const [streamCategory, setStreamCategory] = useState('Entertainment');
  const [streamLanguage, setStreamLanguage] = useState('Hindi');
  const [explicitFormat, setExplicitFormat] = useState<'auto' | StreamFormat>('auto');

  const [m3uUrl, setM3uUrl] = useState('https://iptv-org.github.io/iptv/countries/in.m3u');
  const [xmltvUrl, setXmltvUrl] = useState('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleTuneStream = (e: React.FormEvent) => {
    e.preventDefault();
    if (!streamUrl.trim()) return;

    const format = explicitFormat === 'auto' ? detectStreamFormat(streamUrl.trim()) : explicitFormat;
    const customChannel: Channel = {
      id: `custom-${Date.now()}`,
      number: 999,
      name: streamName.trim() || `Custom ${format.toUpperCase()} Broadcast`,
      logo: '',
      group: streamCategory,
      language: streamLanguage,
      tvgId: 'custom.in',
      isCustom: true,
      mirrors: [
        {
          url: streamUrl.trim(),
          label: `Custom ${format.toUpperCase()} Stream`,
          format,
          qualityHint: 'HD',
        },
      ],
    };

    onAddAndPlayChannel(customChannel);
    onClose();
  };

  const handleLoadPreset = (presetKey: keyof typeof VERIFIED_BROADCAST_STREAMS) => {
    const preset = VERIFIED_BROADCAST_STREAMS[presetKey];
    setStreamName(preset.label);
    setStreamUrl(preset.url);
    setExplicitFormat(preset.format);
  };

  const handlePlaylistSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!m3uUrl.trim()) return;
    setIsLoading(true);
    setStatusMessage(null);
    try {
      await onImportM3UUrl(m3uUrl.trim());
      setStatusMessage('M3U playlist parsed and merged into channel directory.');
    } catch (err) {
      setStatusMessage(err instanceof Error ? err.message : 'Failed to fetch M3U playlist.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleXmltvSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!xmltvUrl.trim()) return;
    setIsLoading(true);
    setStatusMessage(null);
    try {
      await onImportXmltvUrl(xmltvUrl.trim());
      setStatusMessage('XMLTV schedule parsed and synchronized with EPG timeline.');
    } catch (err) {
      setStatusMessage(err instanceof Error ? err.message : 'Failed to parse XMLTV feed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
      <div className="w-full max-w-xl rounded-xl bg-[#0e121b] border border-white/10 shadow-2xl overflow-hidden text-slate-100">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div>
            <h2 className="text-lg font-display font-semibold text-white">
              Stream Tester & Feed Configuration
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Test direct HLS (.m3u8) or MPEG-DASH (.mpd) manifests, or import custom M3U / XMLTV feeds
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Functional Tab Switcher */}
        <div className="flex items-center gap-1 px-6 pt-4">
          <button
            type="button"
            onClick={() => {
              setActiveTab('stream');
              setStatusMessage(null);
            }}
            className={`px-3.5 py-2 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'stream'
                ? 'bg-amber-500 text-slate-950 font-semibold'
                : 'bg-[#161c2a] text-slate-300 hover:text-white'
            }`}
          >
            Direct HLS / DASH Stream
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('playlist');
              setStatusMessage(null);
            }}
            className={`px-3.5 py-2 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'playlist'
                ? 'bg-amber-500 text-slate-950 font-semibold'
                : 'bg-[#161c2a] text-slate-300 hover:text-white'
            }`}
          >
            M3U Playlist Source
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('epg');
              setStatusMessage(null);
            }}
            className={`px-3.5 py-2 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'epg'
                ? 'bg-amber-500 text-slate-950 font-semibold'
                : 'bg-[#161c2a] text-slate-300 hover:text-white'
            }`}
          >
            XMLTV EPG Source
          </button>
        </div>

        <div className="p-6">
          {activeTab === 'stream' && (
            <form onSubmit={handleTuneStream} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Quick Load Verified Broadcast Presets
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleLoadPreset('hlsPrimary')}
                    className="flex items-center gap-2 px-3 py-2 text-left text-xs rounded-lg bg-[#151b28] hover:bg-[#1c2436] border border-white/10 text-slate-200 transition-colors"
                  >
                    <Radio className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span className="truncate">HLS 1080p Adaptive (.m3u8)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleLoadPreset('dashPrimary')}
                    className="flex items-center gap-2 px-3 py-2 text-left text-xs rounded-lg bg-[#151b28] hover:bg-[#1c2436] border border-white/10 text-slate-200 transition-colors"
                  >
                    <Radio className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    <span className="truncate">MPEG-DASH Multi-Bitrate (.mpd)</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Channel Label</label>
                  <input
                    type="text"
                    value={streamName}
                    onChange={(e) => setStreamName(e.target.value)}
                    placeholder="e.g. DD National HD"
                    className="w-full px-3 py-2 text-sm rounded-lg bg-[#141925] border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Stream Protocol</label>
                  <select
                    value={explicitFormat}
                    onChange={(e) => setExplicitFormat(e.target.value as 'auto' | StreamFormat)}
                    className="w-full px-3 py-2 text-sm rounded-lg bg-[#141925] border border-white/10 text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="auto">Auto-Detect (.m3u8 / .mpd)</option>
                    <option value="hls">HLS (HTTP Live Streaming)</option>
                    <option value="dash">MPEG-DASH (.mpd)</option>
                    <option value="native">Direct Native Video</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Stream Manifest URL (.m3u8 or .mpd)
                </label>
                <input
                  type="url"
                  required
                  value={streamUrl}
                  onChange={(e) => setStreamUrl(e.target.value)}
                  placeholder="https://example.com/live/master.m3u8 or manifest.mpd"
                  className="w-full px-3 py-2 text-sm font-mono-tabular rounded-lg bg-[#141925] border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Category</label>
                  <select
                    value={streamCategory}
                    onChange={(e) => setStreamCategory(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg bg-[#141925] border border-white/10 text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="News">News</option>
                    <option value="Entertainment">Entertainment</option>
                    <option value="Movies">Movies</option>
                    <option value="Music">Music</option>
                    <option value="Sports">Sports</option>
                    <option value="Knowledge & Public">Knowledge & Public</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Language</label>
                  <input
                    type="text"
                    value={streamLanguage}
                    onChange={(e) => setStreamLanguage(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg bg-[#141925] border border-white/10 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-950 bg-amber-500 hover:bg-amber-400 rounded-lg transition-colors whitespace-nowrap shrink-0"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  Add & Tune Live
                </button>
              </div>
            </form>
          )}

          {activeTab === 'playlist' && (
            <form onSubmit={handlePlaylistSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  M3U Playlist URL
                </label>
                <input
                  type="url"
                  required
                  value={m3uUrl}
                  onChange={(e) => setM3uUrl(e.target.value)}
                  placeholder="https://iptv-org.github.io/iptv/countries/in.m3u"
                  className="w-full px-3 py-2 text-sm font-mono-tabular rounded-lg bg-[#141925] border border-white/10 text-white focus:outline-none focus:border-amber-500"
                />
                <p className="text-xs text-slate-400 mt-1.5">
                  Default feed parses live Indian channels from iptv-org (`countries/in.m3u`), grouping duplicate entries into failover mirrors.
                </p>
              </div>

              {statusMessage && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 text-xs text-cyan-300">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{statusMessage}</span>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-950 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 rounded-lg transition-colors whitespace-nowrap shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  {isLoading ? 'Parsing Playlist...' : 'Reload / Merge M3U Playlist'}
                </button>
              </div>
            </form>
          )}

          {activeTab === 'epg' && (
            <form onSubmit={handleXmltvSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Custom XMLTV Schedule URL (.xml)
                </label>
                <input
                  type="url"
                  required
                  value={xmltvUrl}
                  onChange={(e) => setXmltvUrl(e.target.value)}
                  placeholder="https://example.com/epg.xml"
                  className="w-full px-3 py-2 text-sm font-mono-tabular rounded-lg bg-[#141925] border border-white/10 text-white focus:outline-none focus:border-amber-500"
                />
                <p className="text-xs text-slate-400 mt-1.5">
                  Synchronizes `&lt;programme&gt;` schedule nodes with matching `tvg-id` channels, while preserving deterministic Indian broadcast EPG schedules for remaining channels.
                </p>
              </div>

              {statusMessage && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 text-xs text-cyan-300">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{statusMessage}</span>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-950 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 rounded-lg transition-colors whitespace-nowrap shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  {isLoading ? 'Fetching XMLTV...' : 'Load XMLTV Feed'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
