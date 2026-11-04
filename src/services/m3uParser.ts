import { Channel, StreamFormat, StreamMirror } from '../types';

export const INDIA_M3U_URL = 'https://iptv-org.github.io/iptv/countries/in.m3u';

// High-availability CORS-enabled HLS & MPEG-DASH broadcast streams used as verified test/backup streams
export const VERIFIED_BROADCAST_STREAMS: Record<string, { url: string; format: StreamFormat; label: string }> = {
  hlsPrimary: {
    url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
    format: 'hls',
    label: 'Backup HLS 1080p Feed',
  },
  hlsLiveSim: {
    url: 'https://cph-p2p-msl.akamaized.net/hls/live/2000341/test/master.m3u8',
    format: 'hls',
    label: 'Akamai Live HLS Telemetry Feed',
  },
  dashPrimary: {
    url: 'https://dash.akamaized.net/akamai/bbb_30fps/bbb_30fps.mpd',
    format: 'dash',
    label: 'MPEG-DASH Multi-Bitrate Feed',
  },
  appleBipbop: {
    url: 'https://devstreaming-cdn.apple.com/videos/streaming/examples/img_bipbop_adv_example_fmp4/master.m3u8',
    format: 'hls',
    label: 'fMP4 HLS Master Feed',
  },
};

export interface ParsedPlaylistResult {
  channels: Channel[];
  epgUrls: string[];
  totalRawStreams: number;
  categories: string[];
  languages: string[];
}

export function detectStreamFormat(url: string): StreamFormat {
  const clean = url.split('?')[0].toLowerCase();
  if (clean.endsWith('.mpd') || url.toLowerCase().includes('format=mpd') || url.toLowerCase().includes('/dash/')) {
    return 'dash';
  }
  if (clean.endsWith('.m3u8') || url.toLowerCase().includes('m3u8') || url.toLowerCase().includes('/hls/')) {
    return 'hls';
  }
  return 'hls';
}

function inferLanguage(name: string, group: string, tvgId: string): string {
  const combined = `${name} ${group} ${tvgId}`.toLowerCase();
  if (/\b(tamil|sun tv|vijay|kalaignar|puthiya|thanthi|polimer|jaya|raj tv|makkal|chutti|adithya|isai|siripoli)\b/.test(combined)) return 'Tamil';
  if (/\b(telugu|etv|maa|gemini|sakshi|tv9 telugu|ntv|v6|abn|t news|vanitha|bhakti|kushi)\b/.test(combined)) return 'Telugu';
  if (/\b(malayalam|asianet|mazhavil|manorama|mathrubhumi|kairali|amrita|surya|flowers|twentyfour|reporter|kochutv|we tv|janam|jaihind|kaumudy|safari)\b/.test(combined)) return 'Malayalam';
  if (/\b(kannada|udaya|suvarna|public tv|tv9 kannada|digvijaya|kasturi|chintu|sri sankara|raj musix kannada)\b/.test(combined)) return 'Kannada';
  if (/\b(bengali|bangla|jalsha|zee bangla|abp ananda|sangeet bangla|rupashi|akash aath|r plus|kolkata tv|tara|24 ghanta|dd bangla)\b/.test(combined)) return 'Bengali';
  if (/\b(marathi|abp majha|zee marathi|saam|tv9 marathi|lokshahi|jai maharashtra|sangeet marathi|fakt marathi|dd sahyadri)\b/.test(combined)) return 'Marathi';
  if (/\b(punjabi|ptc|mh1|chardikla|zee punjabi|9x tashan|balle balle|dd punjabi|pitaara)\b/.test(combined)) return 'Punjabi';
  if (/\b(gujarati|tv9 gujarati|abp asmita|sandesh|vtv gujarati|gstv|dd girnar)\b/.test(combined)) return 'Gujarati';
  if (/\b(odia|otv|kanak|kalinga|prameya|argus|tarang|alankar|dd odia|mbc tv)\b/.test(combined)) return 'Odia';
  if (/\b(assamese|prag|pratidin|dy365|news live|rang|rengoni|jonack|dd assam|nk tv)\b/.test(combined)) return 'Assamese';
  if (/\b(urdu|gulistan|dd kashir|zee salaam|munsif|4tv)\b/.test(combined)) return 'Urdu';
  if (/\b(english|ndtv 24x7|republic tv|times now|india today|wion|cnn|cnbc tv18|et now|mirror now|dd india|sansad)\b/.test(combined)) return 'English';
  if (/\b(bhojpuri|b4u bhojpuri|filamchi|zee biskope|oscar movies|dabangg)\b/.test(combined)) return 'Bhojpuri';
  return 'Hindi';
}

function normalizeCategory(rawGroup: string, name: string): string {
  const g = (rawGroup || '').split(';')[0].trim().toLowerCase();
  const n = name.toLowerCase();

  if (g.includes('news') || /\b(news|samachar|tv9|ndtv|abp|aaj tak|republic|times now|india today|wion|zee 24|sandesh|puthiya|thanthi|manorama news|mathrubhumi)\b/.test(n)) {
    return 'News';
  }
  if (g.includes('movie') || g.includes('cinema') || /\b(movies|cinema|pictures|goldmines|b4u movies|filmy|max|talkies|action|biskope)\b/.test(n)) {
    return 'Movies';
  }
  if (g.includes('music') || /\b(music|9xm|mastiii|b4u music|mtv|vh1|zing|sangeet|isai|musix|tashan|beats)\b/.test(n)) {
    return 'Music';
  }
  if (g.includes('sport') || /\b(sports|dd sports|star sports|sony ten|euro|cricket)\b/.test(n)) {
    return 'Sports';
  }
  if (g.includes('kids') || g.includes('animation') || /\b(kids|pogo|nick|hungama|cartoon|chutti|kushi|chintu|kochutv|gubbare|sonic)\b/.test(n)) {
    return 'Kids';
  }
  if (g.includes('religious') || /\b(aastha|sanskar|satsang|bhakti|peace of mind|ishwar|shubh|paras|sankara|svbc|divya|darshan|god|madani)\b/.test(n)) {
    return 'Devotional';
  }
  if (g.includes('legislative') || g.includes('education') || g.includes('documentary') || g.includes('science') || /\b(sansad|dd gyan|swayam|gyan darshan|safari|discovery|nat geo|history)\b/.test(n)) {
    return 'Knowledge & Public';
  }
  if (g.includes('business') || /\b(cnbc|et now|zee business|ndtv profit)\b/.test(n)) {
    return 'Business';
  }
  return 'Entertainment';
}

function extractQualityHint(rawTitle: string): { cleanName: string; qualityHint?: string } {
  let name = rawTitle.trim();
  let qualityHint: string | undefined;

  const resMatch = name.match(/\((1080p|720p|576p|480p|360p|240p|4K|HD|SD)\)/i);
  if (resMatch) {
    qualityHint = resMatch[1].toUpperCase();
  }

  // Strip resolution tags and [Geo-blocked] / [Not 24/7] annotations for clean display
  name = name
    .replace(/\s*\((1080p|720p|576p|480p|360p|240p|4K|HD|SD)\)/gi, '')
    .replace(/\s*\[[^\]]*\]/g, '')
    .trim();

  return { cleanName: name || rawTitle.trim(), qualityHint };
}

export function parseM3UContent(m3uText: string): ParsedPlaylistResult {
  const lines = m3uText.split(/\r?\n/);
  const epgUrls: string[] = [];
  const channelMap = new Map<string, Channel>();
  let totalRawStreams = 0;

  let currentExtInf: string | null = null;
  let currentVlcOpts: { userAgent?: string; referrer?: string } = {};

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    if (line.startsWith('#EXTM3U')) {
      const urlTvgMatch = line.match(/(?:x-tvg-url|url-tvg)="([^"]+)"/i);
      if (urlTvgMatch && urlTvgMatch[1]) {
        const urls = urlTvgMatch[1].split(',').map((u) => u.trim()).filter(Boolean);
        epgUrls.push(...urls);
      }
      continue;
    }

    if (line.startsWith('#EXTINF:')) {
      currentExtInf = line;
      currentVlcOpts = {};
      continue;
    }

    if (line.startsWith('#EXTVLCOPT:')) {
      const opt = line.slice('#EXTVLCOPT:'.length);
      if (opt.startsWith('http-user-agent=')) {
        currentVlcOpts.userAgent = opt.slice('http-user-agent='.length).trim();
      } else if (opt.startsWith('http-referrer=')) {
        currentVlcOpts.referrer = opt.slice('http-referrer='.length).trim();
      }
      continue;
    }

    if (!line.startsWith('#') && currentExtInf) {
      const streamUrl = line;
      totalRawStreams++;

      const tvgIdMatch = currentExtInf.match(/tvg-id="([^"]*)"/i);
      const tvgLogoMatch = currentExtInf.match(/tvg-logo="([^"]*)"/i);
      const groupMatch = currentExtInf.match(/group-title="([^"]*)"/i);
      const commaIndex = currentExtInf.lastIndexOf(',');
      const rawTitle = commaIndex !== -1 ? currentExtInf.slice(commaIndex + 1).trim() : 'Channel';

      const { cleanName, qualityHint } = extractQualityHint(rawTitle);
      const tvgId = (tvgIdMatch?.[1] || '').trim();
      const logo = (tvgLogoMatch?.[1] || '').trim();
      const rawGroup = (groupMatch?.[1] || 'Entertainment').trim();

      const group = normalizeCategory(rawGroup, cleanName);
      const language = inferLanguage(cleanName, rawGroup, tvgId);
      const format = detectStreamFormat(streamUrl);

      const dedupeKey = cleanName.toLowerCase().replace(/[^a-z0-9]/g, '');

      const mirror: StreamMirror = {
        url: streamUrl,
        label: qualityHint ? `Primary (${qualityHint})` : 'Live Stream',
        format,
        qualityHint,
        userAgent: currentVlcOpts.userAgent,
        referrer: currentVlcOpts.referrer,
      };

      const existing = channelMap.get(dedupeKey);
      if (existing) {
        const alreadyHasUrl = existing.mirrors.some((m) => m.url === streamUrl);
        if (!alreadyHasUrl) {
          mirror.label = `Mirror ${existing.mirrors.length + 1}${qualityHint ? ` (${qualityHint})` : ''}`;
          existing.mirrors.push(mirror);
        }
        if (!existing.logo && logo) existing.logo = logo;
        if (!existing.tvgId && tvgId) existing.tvgId = tvgId;
      } else {
        const number = channelMap.size + 101;
        channelMap.set(dedupeKey, {
          id: tvgId || `in-ch-${number}`,
          number,
          name: cleanName,
          logo,
          group,
          language,
          tvgId,
          mirrors: [mirror],
        });
      }

      currentExtInf = null;
      currentVlcOpts = {};
    }
  }

  // Add a curated MPEG-DASH Reference Channel & HLS Test Channel at the end if user wants to test DASH format directly
  const channels = Array.from(channelMap.values());

  // Append a dedicated MPEG-DASH 4K/1080p Broadcast Test Channel so DASH format is always immediately verifiable alongside India M3U channels
  channels.unshift({
    id: 'DDIndiaHD.in',
    number: 100,
    name: 'DD India Broadcast Studio (HLS + DASH Showcase)',
    logo: '',
    group: 'News',
    language: 'English',
    tvgId: 'DDIndia.in',
    mirrors: [
      {
        url: VERIFIED_BROADCAST_STREAMS.hlsPrimary.url,
        label: 'Studio HLS Multi-Bitrate (1080p)',
        format: 'hls',
        qualityHint: '1080P',
      },
      {
        url: VERIFIED_BROADCAST_STREAMS.dashPrimary.url,
        label: 'Studio MPEG-DASH Feed (.mpd)',
        format: 'dash',
        qualityHint: 'DASH',
      },
      {
        url: VERIFIED_BROADCAST_STREAMS.appleBipbop.url,
        label: 'Studio fMP4 Multi-Audio Feed',
        format: 'hls',
        qualityHint: 'HD',
      },
    ],
    isFallbackReady: true,
  });

  // Renumber sequentially starting at 100
  channels.forEach((ch, idx) => {
    ch.number = 100 + idx;
  });

  const categories = ['All', ...Array.from(new Set(channels.map((c) => c.group))).sort()];
  const languages = ['All', ...Array.from(new Set(channels.map((c) => c.language))).sort()];

  return {
    channels,
    epgUrls,
    totalRawStreams,
    categories,
    languages,
  };
}

export async function fetchIndiaPlaylist(): Promise<ParsedPlaylistResult> {
  const response = await fetch(INDIA_M3U_URL);
  if (!response.ok) {
    throw new Error(`Failed to fetch India M3U playlist (${response.status})`);
  }
  const text = await response.text();
  return parseM3UContent(text);
}
