import { Channel, ProgramSlot } from '../types';

interface ProgramTemplate {
  title: string;
  category: string;
  description: string;
  durationMins: number;
  rating: string;
}

const CATEGORY_PROGRAMS: Record<string, ProgramTemplate[]> = {
  News: [
    {
      title: 'India Prime Bulletin',
      category: 'Live News',
      description: 'Comprehensive national coverage of parliamentary developments, economic policy updates, and live field reports across metropolitan bureaus.',
      durationMins: 30,
      rating: 'U',
    },
    {
      title: 'Newshour Debate: National Perspective',
      category: 'Current Affairs',
      description: 'Panel discussion with policy analysts, economists, and senior editors examining key geopolitical and domestic issues.',
      durationMins: 60,
      rating: 'U',
    },
    {
      title: 'Metro Express 360',
      category: 'Regional Headlines',
      description: 'Rapid-fire updates from Mumbai, Delhi, Bengaluru, Chennai, Kolkata, and Hyderabad bureaus with live traffic and weather radar.',
      durationMins: 30,
      rating: 'U',
    },
    {
      title: 'Markets & Macro Today',
      category: 'Business & Economy',
      description: 'Analysis of NIFTY, SENSEX, commodities, and technology sector earnings with institutional market strategists.',
      durationMins: 30,
      rating: 'U',
    },
    {
      title: 'Ground Report Special',
      category: 'Investigative Documentary',
      description: 'In-depth investigative field journalism exploring infrastructure, rural innovation, and environmental sustainability.',
      durationMins: 60,
      rating: 'U',
    },
  ],
  Movies: [
    {
      title: 'Matinee Blockbuster Showcase',
      category: 'Feature Film',
      description: 'Digitally remastered theatrical feature presentation with surround sound and behind-the-scenes production commentary.',
      durationMins: 120,
      rating: 'U/A 13+',
    },
    {
      title: 'Prime Time Premiere: Sikandar KiDaastan',
      category: 'Action Drama',
      description: 'A determined investigative officer uncovers a high-stakes conspiracy spanning coastal ports and metropolitan corridors.',
      durationMins: 120,
      rating: 'U/A 13+',
    },
    {
      title: 'Director’s Cut: Classic Indian Cinema',
      category: 'Classic Film',
      description: 'Acclaimed archival cinema restored in high definition, celebrating legendary directors and timeless musical scores.',
      durationMins: 90,
      rating: 'U',
    },
    {
      title: 'Box Office Rewind',
      category: 'Cinema Magazine',
      description: 'Exclusive interviews with cinematographers, composers, and lead actors on upcoming theatrical releases.',
      durationMins: 30,
      rating: 'U',
    },
  ],
  Music: [
    {
      title: 'Non-Stop Chartbusters Top 20',
      category: 'Music Countdown',
      description: 'Back-to-back high-definition music videos counting down the week’s most streamed soundtrack hits across India.',
      durationMins: 60,
      rating: 'U',
    },
    {
      title: 'Acoustic Unplugged Sessions',
      category: 'Live Studio Music',
      description: 'Intimate live studio arrangements featuring contemporary indie vocalists, classical fusion percussion, and orchestral strings.',
      durationMins: 30,
      rating: 'U',
    },
    {
      title: 'Retro Melodies & Golden Era',
      category: 'Classic Hits',
      description: 'Timeless compositions and evergreen playback melodies curated from the golden decades of Indian cinema.',
      durationMins: 60,
      rating: 'U',
    },
    {
      title: 'Indie Pulse & Underground',
      category: 'Independent Music',
      description: 'Spotlighting emerging regional singer-songwriters, electronic producers, and folk-rock collectives.',
      durationMins: 30,
      rating: 'U',
    },
  ],
  Sports: [
    {
      title: 'Ranji & Domestic Cricket Live Analysis',
      category: 'Cricket',
      description: 'Ball-by-ball tactical breakdown, pitch telemetry, and hawkeye seam projections from the national cricket championship.',
      durationMins: 60,
      rating: 'U',
    },
    {
      title: 'Indian Super League: Matchday Highlights',
      category: 'Football',
      description: 'Extended goals, tactical pressing heatmaps, and post-match manager interviews from top-flight Indian football.',
      durationMins: 60,
      rating: 'U',
    },
    {
      title: 'Pro Kabaddi & Indigenous Arena',
      category: 'Kabaddi & Athletics',
      description: 'High-intensity raid highlights, defender tackle stats, and national athletics championship qualifiers.',
      durationMins: 30,
      rating: 'U',
    },
    {
      title: 'Olympic Horizon: Road to Gold',
      category: 'Sports Documentary',
      description: 'Inside the national high-performance training centers with India’s badminton, javelin, and shooting contenders.',
      durationMins: 30,
      rating: 'U',
    },
  ],
  Kids: [
    {
      title: 'Mystery of the Himalayan Valley',
      category: 'Animated Adventure',
      description: 'Young explorers solve ancient riddles and protect mountain wildlife using science, teamwork, and wit.',
      durationMins: 30,
      rating: 'U',
    },
    {
      title: 'RoboCraft Junior League',
      category: 'Sci-Fi Animation',
      description: 'Inventive school friends build solar-powered gadgets to rescue their neighborhood from quirky mechanical mishaps.',
      durationMins: 30,
      rating: 'U',
    },
    {
      title: 'Panchatantra & Folk Tales Retold',
      category: 'Heritage Animation',
      description: 'Vibrant animated adaptations of classic Indian fables teaching empathy, strategy, and curiosity.',
      durationMins: 30,
      rating: 'U',
    },
  ],
  Devotional: [
    {
      title: 'Morning Prabhat Vandana & Raga',
      category: 'Spiritual & Classical',
      description: 'Serene classical vocal recitals, temple architecture documentaries, and meditative instrumental compositions.',
      durationMins: 60,
      rating: 'U',
    },
    {
      title: 'Sacred Rivers & Heritage Trails',
      category: 'Cultural Documentary',
      description: 'Visual journey across historic pilgrimage towns, ancient stone carvings, and living artisanal traditions.',
      durationMins: 60,
      rating: 'U',
    },
    {
      title: 'Evening Aarti & DiscourseLive',
      category: 'Devotional Broadcast',
      description: 'Live evening lamps, choral hymns, and philosophical reflections on mindfulness and harmony.',
      durationMins: 60,
      rating: 'U',
    },
  ],
  'Knowledge & Public': [
    {
      title: 'Vigyan & Space Frontiers: ISRO Special',
      category: 'Science & Space',
      description: 'Engineering deep-dive into orbital payload dynamics, lunar rover telemetry, and deep-space antenna arrays.',
      durationMins: 60,
      rating: 'U',
    },
    {
      title: 'Sansad Chronicle & Policy Forum',
      category: 'Public Affairs',
      description: 'Archival constitutional debates, committee reports, and interviews with public administration scholars.',
      durationMins: 60,
      rating: 'U',
    },
    {
      title: 'Biosphere India: Western Ghats to Ladakh',
      category: 'Nature & Wildlife',
      description: '4K wildlife cinematography documenting snow leopards, monsoon rainforests, and coastal marine ecosystems.',
      durationMins: 60,
      rating: 'U',
    },
  ],
  Business: [
    {
      title: 'Dalal Street Closing Bell',
      category: 'Financial Markets',
      description: 'Real-time institutional order flow, sectoral indices, and CFO interviews on quarterly corporate guidance.',
      durationMins: 60,
      rating: 'U',
    },
    {
      title: 'Founders & DeepTech India',
      category: 'Venture & Tech',
      description: 'Profiles of semiconductor, SaaS, and clean-energy startups scaling from Bengaluru, Hyderabad, and Pune.',
      durationMins: 30,
      rating: 'U',
    },
  ],
  Entertainment: [
    {
      title: 'Dastaan-e-Zindagi: Family Chronicle',
      category: 'Prime Drama',
      description: 'Multi-generational drama exploring ambition, tradition, and resilience in a rapidly changing metropolitan family.',
      durationMins: 30,
      rating: 'U/A 7+',
    },
    {
      title: 'Sur Sangam: National Talent Stage',
      category: 'Reality & Music',
      description: 'Performers from across 28 states compete before a panel of acclaimed composers and choreographers.',
      durationMins: 60,
      rating: 'U',
    },
    {
      title: 'Laughter Express & Studio Comedy',
      category: 'Comedy Showcase',
      description: 'Satirical sketches, observational stand-up, and celebrity conversations recorded in front of a live studio audience.',
      durationMins: 60,
      rating: 'U/A 13+',
    },
    {
      title: 'MasterChef Kitchen Chronicles',
      category: 'Culinary & Lifestyle',
      description: 'Regional chefs reimagine heirloom spice blends and coastal recipes into contemporary tasting plates.',
      durationMins: 30,
      rating: 'U',
    },
  ],
};

function hashString(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

/**
 * Generates a deterministic 12-hour window of EPG slots around `referenceTimeMs`
 * for any channel, guaranteeing zero blank cells in the EPG timeline.
 */
export function generateChannelSchedule(channel: Channel, referenceTimeMs: number = Date.now()): ProgramSlot[] {
  const templates = CATEGORY_PROGRAMS[channel.group] || CATEGORY_PROGRAMS.Entertainment;
  const seed = hashString(channel.id + channel.name);

  // Align window start to 2 hours before current half-hour boundary
  const halfHourMs = 30 * 60 * 1000;
  const windowStart = Math.floor(referenceTimeMs / halfHourMs) * halfHourMs - 2 * 60 * 60 * 1000;
  const windowEnd = windowStart + 10 * 60 * 60 * 1000; // 10 hours total span

  const slots: ProgramSlot[] = [];
  let cursor = windowStart;
  let step = 0;

  while (cursor < windowEnd) {
    const templateIndex = (seed + step) % templates.length;
    const tpl = templates[templateIndex];
    const durationMs = tpl.durationMins * 60 * 1000;
    const slotEnd = cursor + durationMs;

    const regionalPrefix =
      channel.language !== 'Hindi' && channel.language !== 'English'
        ? `${channel.language} Special: `
        : '';

    slots.push({
      id: `${channel.id}-slot-${cursor}`,
      channelId: channel.id,
      title: step % 2 === 0 ? `${regionalPrefix}${tpl.title}` : tpl.title,
      category: tpl.category,
      description: `${tpl.description} Broadcast in ${channel.language} on ${channel.name}.`,
      startTime: cursor,
      endTime: slotEnd,
      rating: tpl.rating,
      language: channel.language,
    });

    cursor = slotEnd;
    step++;
  }

  return slots;
}

export function getNowAndNext(
  channel: Channel,
  externalSlots?: ProgramSlot[],
  nowMs: number = Date.now()
): { current: ProgramSlot; next: ProgramSlot; progressPercent: number } {
  const slots = externalSlots && externalSlots.length > 0 ? externalSlots : generateChannelSchedule(channel, nowMs);

  let currentIndex = slots.findIndex((s) => nowMs >= s.startTime && nowMs < s.endTime);
  if (currentIndex === -1) {
    currentIndex = 0;
  }

  const current = slots[currentIndex];
  const next = slots[currentIndex + 1] || slots[0];
  const total = Math.max(1, current.endTime - current.startTime);
  const elapsed = Math.max(0, Math.min(total, nowMs - current.startTime));
  const progressPercent = Math.round((elapsed / total) * 100);

  return { current, next, progressPercent };
}

/**
 * Parses an XMLTV document string (<tv><programme start="..." stop="..." channel="...">)
 * if the user provides a custom XMLTV URL or if an uncompressed XMLTV feed is reachable.
 */
export function parseXMLTVDocument(xmlText: string): Map<string, ProgramSlot[]> {
  const map = new Map<string, ProgramSlot[]>();
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlText, 'text/xml');
    const programmes = Array.from(doc.querySelectorAll('programme'));

    const parseXmltvDate = (raw: string | null): number => {
      if (!raw) return Date.now();
      // Format: YYYYMMDDHHMMSS +0530
      const m = raw.trim().match(/^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})\s*([+-]\d{4})?/);
      if (!m) return Date.now();
      const iso = `${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6]}${
        m[7] ? `${m[7].slice(0, 3)}:${m[7].slice(3)}` : 'Z'
      }`;
      const parsed = Date.parse(iso);
      return Number.isNaN(parsed) ? Date.now() : parsed;
    };

    for (const prog of programmes) {
      const channelId = prog.getAttribute('channel') || '';
      if (!channelId) continue;
      const startTime = parseXmltvDate(prog.getAttribute('start'));
      const endTime = parseXmltvDate(prog.getAttribute('stop'));
      const title = prog.querySelector('title')?.textContent?.trim() || 'Live Broadcast';
      const desc = prog.querySelector('desc')?.textContent?.trim() || 'Scheduled television broadcast.';
      const category = prog.querySelector('category')?.textContent?.trim() || 'Broadcast';

      const slot: ProgramSlot = {
        id: `${channelId}-${startTime}`,
        channelId,
        title,
        category,
        description: desc,
        startTime,
        endTime,
      };

      const existing = map.get(channelId) || [];
      existing.push(slot);
      map.set(channelId, existing);
    }
  } catch {
    // Return empty map on malformed XML
  }
  return map;
}
