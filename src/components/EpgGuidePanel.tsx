import React, { useMemo, useState } from 'react';
import {
  Search,
  Star,
  Tv,
  Play,
  Filter,
  Globe,
} from 'lucide-react';
import { Channel, ProgramSlot } from '../types';
import { generateChannelSchedule, getNowAndNext } from '../services/epgService';

interface EpgGuidePanelProps {
  channels: Channel[];
  activeChannel: Channel | null;
  secondaryChannel: Channel | null;
  favorites: string[];
  recentIds: string[];
  categories: string[];
  languages: string[];
  selectedCategory: string;
  selectedLanguage: string;
  selectedLanguages?: string[];
  searchQuery: string;
  onlyFavorites: boolean;
  isMultiView: boolean;
  xmltvMap: Map<string, ProgramSlot[]>;
  onSearchChange: (q: string) => void;
  onCategoryChange: (c: string) => void;
  onLanguageChange: (l: string) => void;
  onToggleOnlyFavorites: () => void;
  onSelectChannel: (ch: Channel) => void;
  onSelectSecondaryChannel: (ch: Channel) => void;
  onToggleFavorite: (channelId: string) => void;
}

export const EpgGuidePanel: React.FC<EpgGuidePanelProps> = ({
  channels,
  activeChannel,
  favorites,
  categories,
  languages,
  selectedCategory,
  selectedLanguage,
  selectedLanguages,
  searchQuery,
  onlyFavorites,
  xmltvMap,
  onSearchChange,
  onCategoryChange,
  onLanguageChange,
  onToggleOnlyFavorites,
  onSelectChannel,
  onToggleFavorite,
}) => {
  const [visibleLimit, setVisibleLimit] = useState(60);

  const filteredChannels = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return channels.filter((ch) => {
      if (onlyFavorites && !favorites.includes(ch.id)) return false;
      if (selectedCategory !== 'All' && ch.group !== selectedCategory) return false;
      if (selectedLanguages && selectedLanguages.length > 0 && !selectedLanguages.includes('All')) {
        if (!selectedLanguages.includes(ch.language)) return false;
      } else if (selectedLanguage !== 'All' && ch.language !== selectedLanguage) {
        return false;
      }
      if (q) {
        return (
          ch.name.toLowerCase().includes(q) ||
          ch.group.toLowerCase().includes(q) ||
          ch.language.toLowerCase().includes(q) ||
          String(ch.number).includes(q)
        );
      }
      return true;
    });
  }, [
    channels,
    onlyFavorites,
    favorites,
    selectedCategory,
    selectedLanguage,
    selectedLanguages,
    searchQuery,
  ]);

  const displayedChannels = useMemo(
    () => filteredChannels.slice(0, visibleLimit),
    [filteredChannels, visibleLimit]
  );

  return (
    <div className="flex flex-col h-full text-black select-none bg-white">
      {/* Search & Language Filter Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 px-3.5 sm:px-5 py-3 sm:py-3.5 border-b border-emerald-200 bg-emerald-50/60">
        <div className="relative flex-1 w-full sm:max-w-md">
          <Search className="w-4 h-4 text-neutral-600 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              onSearchChange(e.target.value);
              setVisibleLimit(60);
            }}
            placeholder={`Search ${filteredChannels.length} channels...`}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg bg-white border border-emerald-300 text-black placeholder-neutral-500 focus:outline-none focus:border-emerald-600"
          />
        </div>

        <div className="flex flex-wrap items-center justify-between sm:justify-end gap-2">
          <div className="flex items-center gap-1.5 bg-white border border-emerald-300 rounded-lg px-2.5 sm:px-3 py-1.5 flex-1 sm:flex-initial">
            <Globe className="w-3.5 h-3.5 text-black shrink-0" />
            <select
              value={selectedLanguage}
              onChange={(e) => {
                onLanguageChange(e.target.value);
                setVisibleLimit(60);
              }}
              aria-label="Filter by language"
              className="w-full bg-transparent text-xs text-black font-medium focus:outline-none cursor-pointer"
            >
              {languages.map((lang) => (
                <option key={lang} value={lang} className="bg-white text-black">
                  {lang === 'All' ? 'All Languages' : lang}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={onToggleOnlyFavorites}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 ${
              onlyFavorites
                ? 'bg-emerald-600 text-white border-emerald-600 font-semibold'
                : 'bg-white text-black border-emerald-300 hover:bg-emerald-50'
            }`}
          >
            <Star className={`w-3.5 h-3.5 ${onlyFavorites ? 'fill-current' : ''}`} />
            Watchlist ({favorites.length})
          </button>
        </div>
      </div>

      {/* Category Filter Bar */}
      <div className="flex items-center gap-1.5 px-3.5 sm:px-5 py-2 sm:py-2.5 border-b border-emerald-100 bg-white overflow-x-auto no-scrollbar">
        <Filter className="w-3.5 h-3.5 text-black mr-1 shrink-0" />
        {categories.map((cat) => {
          const active = selectedCategory === cat;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => {
                onCategoryChange(cat);
                setVisibleLimit(60);
              }}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                active
                  ? 'bg-emerald-600 text-white font-semibold'
                  : 'text-black hover:bg-emerald-50'
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* Channel & Program List */}
      <div className="flex-1 overflow-y-auto divide-y divide-emerald-100">
        {displayedChannels.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center px-4">
            <Tv className="w-8 h-8 text-neutral-400 mb-2" />
            <p className="text-sm font-medium text-black">No channels match your current filter</p>
          </div>
        ) : (
          displayedChannels.map((channel) => {
            const isSelected = activeChannel?.id === channel.id;
            const isFav = favorites.includes(channel.id);
            const externalSlots = xmltvMap.get(channel.tvgId);
            const slots =
              externalSlots && externalSlots.length > 0
                ? externalSlots
                : generateChannelSchedule(channel);
            const { current, next, progressPercent } = getNowAndNext(channel, slots);

            return (
              <div
                key={channel.id}
                className={`flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-2.5 sm:gap-3 px-3.5 sm:px-5 py-3 transition-colors ${
                  isSelected ? 'bg-emerald-50' : 'hover:bg-emerald-50/40'
                }`}
              >
                {/* Top row on mobile: Channel Info + Watch Button */}
                <div className="flex items-center justify-between gap-2 lg:w-[280px] shrink-0 min-w-0">
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                    <button
                      type="button"
                      onClick={() => onToggleFavorite(channel.id)}
                      aria-label={`Favorite ${channel.name}`}
                      className={`p-1 rounded transition-colors shrink-0 ${
                        isFav ? 'text-emerald-600' : 'text-neutral-400 hover:text-black'
                      }`}
                    >
                      <Star className={`w-4 h-4 ${isFav ? 'fill-current' : ''}`} />
                    </button>

                    <span className="text-xs font-mono-tabular text-neutral-700 w-7 sm:w-9 shrink-0">
                      {channel.number}
                    </span>

                    <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center overflow-hidden shrink-0">
                      {channel.logo ? (
                        <img
                          src={channel.logo}
                          alt={channel.name}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-contain p-1"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <span className="text-xs font-display font-bold text-black">
                          {channel.name.slice(0, 2).toUpperCase()}
                        </span>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <button
                        type="button"
                        onClick={() => onSelectChannel(channel)}
                        className="text-xs sm:text-sm font-display font-semibold text-black hover:underline truncate text-left transition-colors block w-full"
                      >
                        {channel.name}
                      </button>
                      <div className="flex items-center gap-1.5 text-[11px] text-neutral-700 truncate">
                        <span>{channel.language}</span>
                        <span aria-hidden="true">·</span>
                        <span>{channel.group}</span>
                      </div>
                    </div>
                  </div>

                  {/* Mobile Watch Button */}
                  <button
                    type="button"
                    onClick={() => onSelectChannel(channel)}
                    className={`lg:hidden flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                      isSelected
                        ? 'bg-emerald-700 text-white'
                        : 'bg-emerald-600 text-white hover:bg-emerald-700'
                    }`}
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>{isSelected ? 'Playing' : 'Watch'}</span>
                  </button>
                </div>

                {/* Now & Next Programs */}
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-2.5 min-w-0">
                  <div className="rounded-lg bg-emerald-50/70 border border-emerald-200 px-3 py-2">
                    <div className="flex items-center justify-between gap-2 text-[11px] text-black font-semibold">
                      <span>LIVE NOW</span>
                      <span className="font-mono-tabular">{progressPercent}%</span>
                    </div>
                    <div className="text-xs font-semibold text-black truncate mt-0.5">
                      {current.title}
                    </div>
                    <div className="w-full h-1 bg-emerald-200 rounded-full overflow-hidden mt-1.5">
                      <div
                        className="h-full bg-emerald-600 transition-all"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>

                  <div className="hidden md:flex flex-col justify-between rounded-lg bg-white border border-emerald-200 px-3 py-2">
                    <div className="text-[11px] text-neutral-700 font-semibold">UP NEXT</div>
                    <div className="text-xs font-medium text-black truncate mt-0.5">
                      {next.title}
                    </div>
                    <div className="text-[11px] text-neutral-600 truncate">
                      {next.category} · {channel.language}
                    </div>
                  </div>
                </div>

                {/* Desktop Watch Button */}
                <div className="hidden lg:flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => onSelectChannel(channel)}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                      isSelected
                        ? 'bg-emerald-700 text-white'
                        : 'bg-emerald-600 text-white hover:bg-emerald-700'
                    }`}
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    {isSelected ? 'Playing' : 'Watch Live'}
                  </button>
                </div>
              </div>
            );
          })
        )}

        {filteredChannels.length > visibleLimit && (
          <div className="p-4 flex justify-center bg-emerald-50/40">
            <button
              type="button"
              onClick={() => setVisibleLimit((prev) => prev + 80)}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
            >
              Show More Channels ({filteredChannels.length - visibleLimit} remaining)
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
