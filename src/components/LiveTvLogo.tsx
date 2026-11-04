import React from 'react';

interface LiveTvLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showTagline?: boolean;
  variant?: 'light' | 'dark';
}

export const LiveTvLogo: React.FC<LiveTvLogoProps> = ({
  size = 'md',
  showTagline = false,
  variant = 'light',
}) => {
  const iconDimensions =
    size === 'sm'
      ? 'w-8 h-8'
      : size === 'lg'
        ? 'w-11 h-11 sm:w-12 sm:h-12'
        : 'w-9 h-9 sm:w-10 sm:h-10';

  const titleClass =
    size === 'sm'
      ? 'text-base sm:text-lg'
      : size === 'lg'
        ? 'text-xl sm:text-2xl'
        : 'text-lg sm:text-xl';

  return (
    <div className="inline-flex items-center gap-2.5 sm:gap-3 select-none group">
      {/* Custom Broadcast Emblem */}
      <div
        className={`relative ${iconDimensions} shrink-0 rounded-xl overflow-hidden shadow-md ring-1 ring-emerald-700/20 transition-transform duration-200 group-hover:scale-105`}
      >
        <svg
          viewBox="0 0 64 64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
          aria-hidden="true"
        >
          <defs>
            <linearGradient
              id="ltv-logo-bg"
              x1="4"
              y1="4"
              x2="60"
              y2="60"
              gradientUnits="userSpaceOnUse"
            >
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="50%" stopColor="#059669" />
              <stop offset="100%" stopColor="#064e3b" />
            </linearGradient>
            <linearGradient
              id="ltv-logo-screen"
              x1="13"
              y1="18"
              x2="51"
              y2="45"
              gradientUnits="userSpaceOnUse"
            >
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="100%" stopColor="#ecfdf5" />
            </linearGradient>
          </defs>

          {/* Badge Background */}
          <rect x="2" y="2" width="60" height="60" rx="15" fill="url(#ltv-logo-bg)" />
          <rect
            x="3"
            y="3"
            width="58"
            height="58"
            rx="14"
            stroke="#ffffff"
            strokeOpacity="0.28"
            strokeWidth="1.5"
          />

          {/* Broadcast Signal Waves */}
          <path
            d="M23 11.5L32 18L41 11.5"
            stroke="#ffffff"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="32" cy="10" r="2.4" fill="#a7f3d0" />

          {/* Widescreen TV Frame */}
          <rect
            x="12"
            y="18"
            width="40"
            height="27"
            rx="6"
            fill="url(#ltv-logo-screen)"
          />

          {/* Play Triangle */}
          <path d="M28 25.2L40 31.5L28 37.8V25.2Z" fill="#047857" />

          {/* Live On-Air Indicator Dot */}
          <circle cx="45.5" cy="23.5" r="2.4" fill="#10b981" />

          {/* Broadcast Stand */}
          <path
            d="M23.5 50.5H40.5"
            stroke="#ffffff"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {/* Brand Wordmark */}
      <div className="flex flex-col leading-none">
        <div className="flex items-center gap-1.5">
          <span
            className={`${titleClass} font-display font-bold tracking-tight ${
              variant === 'dark' ? 'text-white' : 'text-black'
            }`}
          >
            Live TV
          </span>
          <span className="px-1.5 py-0.5 rounded-md bg-emerald-600 text-white text-[10px] sm:text-xs font-display font-bold uppercase tracking-wider shadow-xs">
            Network
          </span>
        </div>
        {showTagline && (
          <span
            className={`text-[10px] font-medium tracking-wide mt-0.5 ${
              variant === 'dark' ? 'text-emerald-200/80' : 'text-neutral-700'
            }`}
          >
            India Live Broadcast
          </span>
        )}
      </div>
    </div>
  );
};
