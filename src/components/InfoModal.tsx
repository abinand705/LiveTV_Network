import React, { useEffect } from 'react';
import { X, FileText, ShieldCheck, Info, CheckCircle2 } from 'lucide-react';

export type InfoModalType = 'terms' | 'privacy' | 'about' | null;

interface InfoModalProps {
  type: InfoModalType;
  onClose: () => void;
}

export const InfoModal: React.FC<InfoModalProps> = ({ type, onClose }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (type) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [type, onClose]);

  if (!type) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3.5 sm:p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl max-h-[88vh] bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-neutral-200 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-neutral-800 bg-neutral-950/70">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
              {type === 'terms' && <FileText className="w-5 h-5" />}
              {type === 'privacy' && <ShieldCheck className="w-5 h-5" />}
              {type === 'about' && <Info className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-display font-bold text-white">
                {type === 'terms' && 'Terms & Conditions'}
                {type === 'privacy' && 'Privacy Policy'}
                {type === 'about' && 'About Live TV Network'}
              </h3>
              <p className="text-[11px] sm:text-xs text-neutral-400 font-medium">
                {type === 'terms' && 'Legal Agreement & Broadcast Aggregation Terms'}
                {type === 'privacy' && 'Data Protection, Client-Side Storage & Telemetry'}
                {type === 'about' && 'India Premier Live Stream & EPG Broadcast Portal'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-5 space-y-4 text-xs sm:text-sm text-neutral-300 leading-relaxed">
          {type === 'terms' && (
            <>
              <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-600/30 text-emerald-200 text-xs">
                <strong>Important Notice:</strong> Live TV Network is a non-commercial web player and broadcast indexer. We do not store, host, re-encode, or transmit media files on our servers.
              </div>

              <section className="space-y-1.5">
                <h4 className="text-white font-semibold text-sm">1. Acceptance of Terms</h4>
                <p>
                  By visiting, accessing, or using the Live TV Network web application, you acknowledge that you have read, understood, and agree to be bound by these Terms and Conditions. If you do not agree, please discontinue using the service.
                </p>
              </section>

              <section className="space-y-1.5">
                <h4 className="text-white font-semibold text-sm">2. Free-to-Air Stream Aggregation & Disclaimer</h4>
                <p>
                  All broadcast channels, video streams (HLS/m3u8, MPEG-DASH/mpd), and Electronic Program Guide (EPG) metadata indexed on Live TV Network are sourced from publicly accessible URLs provided by authorized broadcasters and public media repositories. Live TV Network operates strictly as a client-side stream tuner and player.
                </p>
              </section>

              <section className="space-y-1.5">
                <h4 className="text-white font-semibold text-sm">3. Intellectual Property & Channel Rights</h4>
                <p>
                  All channel logos, names, broadcast trademarks, program schedules, and stream feeds remain the exclusive property of their respective copyright holders, networks, and broadcasting corporations. Inclusion in our directory does not imply endorsement or direct affiliation.
                </p>
              </section>

              <section className="space-y-1.5">
                <h4 className="text-white font-semibold text-sm">4. DMCA & Copyright Takedown Procedure</h4>
                <p>
                  We respect intellectual property rights. If you are a copyright owner or authorized representative and wish to request the removal of any stream URL or metadata reference, please submit a request via our in-navbar <strong>Contact Us</strong> form with the channel name and verification details. We will process compliant removal requests promptly.
                </p>
              </section>

              <section className="space-y-1.5">
                <h4 className="text-white font-semibold text-sm">5. User Code of Conduct</h4>
                <p>
                  This application is intended solely for personal, non-commercial entertainment and informational use. Users may not attempt to reverse engineer, disrupt broadcast servers, or overload public stream endpoints.
                </p>
              </section>

              <section className="space-y-1.5">
                <h4 className="text-white font-semibold text-sm">6. Limitation of Liability</h4>
                <p>
                  Stream availability, resolution, audio track synchronization, and uptime are managed entirely by source broadcasters and CDNs. Live TV Network provides no guarantees regarding stream continuity or geographical availability.
                </p>
              </section>
            </>
          )}

          {type === 'privacy' && (
            <>
              <div className="p-3 rounded-xl bg-neutral-800/80 border border-neutral-700 text-neutral-300 text-xs">
                <strong>Privacy First:</strong> Live TV Network requires no account registration, no credit card, and tracks no personal browsing history.
              </div>

              <section className="space-y-1.5">
                <h4 className="text-white font-semibold text-sm">1. Information Collection & Zero-Account Policy</h4>
                <p>
                  We believe in anonymous, accessible media. You do not need to create an account, log in, or provide personal credentials to watch any channel or view television program guides.
                </p>
              </section>

              <section className="space-y-1.5">
                <h4 className="text-white font-semibold text-sm">2. Local Storage Usage</h4>
                <p>
                  To personalize your viewing experience, Live TV Network saves preferences directly in your browser's local storage (<code className="text-emerald-400 font-mono text-[11px]">localStorage</code>):
                </p>
                <ul className="list-disc list-inside space-y-1 pl-2 text-neutral-300">
                  <li>Your channel <strong>Watchlist / Favorites</strong></li>
                  <li>Your preferred <strong>Languages</strong> selection (Hindi, English, Malayalam, Tamil, Telugu, etc.)</li>
                  <li>Feedback and inquiries submitted via the in-navbar <strong>Contact Us</strong> form</li>
                </ul>
                <p className="mt-1">
                  This data resides exclusively on your local device and is never uploaded to remote tracking databases or shared with third parties.
                </p>
              </section>

              <section className="space-y-1.5">
                <h4 className="text-white font-semibold text-sm">3. Direct Stream Connections & Third-Party CDNs</h4>
                <p>
                  When you play a channel, your web browser establishes a direct connection to the broadcast server or Content Delivery Network (CDN) hosting the video segments. These third-party servers may log standard IP connection metrics required for network routing.
                </p>
              </section>

              <section className="space-y-1.5">
                <h4 className="text-white font-semibold text-sm">4. Real-Time Telemetry & Quality Adaptation</h4>
                <p>
                  Our built-in adaptive stream controller measures client-side metrics such as buffer health, bitrate, and dropped frames strictly in memory to automatically tune video resolution and prevent buffering. No personal profiling is performed.
                </p>
              </section>

              <section className="space-y-1.5">
                <h4 className="text-white font-semibold text-sm">5. Contact Inquiries</h4>
                <p>
                  When you submit a message using the Contact Us form, the information you provide (name, email address, message) is used solely to respond to your inquiry and troubleshoot stream connectivity.
                </p>
              </section>
            </>
          )}

          {type === 'about' && (
            <>
              <div className="p-3.5 rounded-xl bg-gradient-to-r from-emerald-900/40 to-neutral-800 border border-emerald-500/30 space-y-1">
                <div className="text-white font-bold text-sm">Live TV Network · India Broadcast Directory</div>
                <p className="text-xs text-neutral-300">
                  A modern, ultra-responsive web application designed for seamless Indian television streaming and electronic program guide navigation.
                </p>
              </div>

              <section className="space-y-1.5">
                <h4 className="text-white font-semibold text-sm">Key Features</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  <div className="p-3 rounded-lg bg-neutral-800/60 border border-neutral-700/60 space-y-1">
                    <div className="text-white font-medium flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      Multi-Format Playback
                    </div>
                    <p className="text-[11px] text-neutral-400">
                      Native HLS (m3u8) & MPEG-DASH (mpd) playback powered by HLS.js and Dash.js.
                    </p>
                  </div>

                  <div className="p-3 rounded-lg bg-neutral-800/60 border border-neutral-700/60 space-y-1">
                    <div className="text-white font-medium flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      Complete XMLTV EPG
                    </div>
                    <p className="text-[11px] text-neutral-400">
                      Real-time TV guide schedules showing current and upcoming shows across categories.
                    </p>
                  </div>

                  <div className="p-3 rounded-lg bg-neutral-800/60 border border-neutral-700/60 space-y-1">
                    <div className="text-white font-medium flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      14+ Indian Languages
                    </div>
                    <p className="text-[11px] text-neutral-400">
                      Instant multi-selection for Hindi, English, Malayalam, Tamil, Telugu, Kannada, Bengali & more.
                    </p>
                  </div>

                  <div className="p-3 rounded-lg bg-neutral-800/60 border border-neutral-700/60 space-y-1">
                    <div className="text-white font-medium flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      Picture-in-Picture & Fullscreen
                    </div>
                    <p className="text-[11px] text-neutral-400">
                      Float live TV while exploring channels or enter immersive distraction-free fullscreen TV.
                    </p>
                  </div>
                </div>
              </section>

              <section className="space-y-1.5">
                <h4 className="text-white font-semibold text-sm">Broadcast Quality</h4>
                <p>
                  All channels feature verified backup mirrors and automatic stream recovery. If any stream experiences network latency, alternate official feeds are available instantly.
                </p>
              </section>
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-3.5 border-t border-neutral-800 bg-neutral-950/70">
          <span className="text-[11px] text-neutral-500">Live TV Network · 2026</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

