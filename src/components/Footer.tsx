import React, { useState, useRef } from 'react';
import {
  FileText,
  ShieldCheck,
  Mail,
  Send,
  Info,
  Tv,
  Play,
  Star,
  CheckCircle2,
  AlertCircle,
  X,
  MessageSquare,
  Sparkles,
} from 'lucide-react';
import { LiveTvLogo } from './LiveTvLogo';
import { InfoModal, InfoModalType } from './InfoModal';

const CONTACT_STORAGE_KEY = 'livetv_network_contact_messages';

// Read FormConnect environment keys with fallback to provided live keys
const FORMCONNECT_API_KEY: string =
  (import.meta as any).env?.VITE_FORMCONNECT_API_KEY ||
  (import.meta as any).env?.FORMCONNECT_API_KEY ||
  (typeof process !== 'undefined' ? process.env?.FORMCONNECT_API_KEY : undefined) ||
  'fc_live_eb39235f9e0abdc47e5e372e14765187';

const FORMCONNECT_API_URL: string =
  (import.meta as any).env?.VITE_FORMCONNECT_API_URL ||
  (import.meta as any).env?.FORMCONNECT_API_URL ||
  (typeof process !== 'undefined' ? process.env?.FORMCONNECT_API_URL : undefined) ||
  'https://formconnect.onrender.com';

const FORMCONNECT_ENDPOINT: string = FORMCONNECT_API_URL.endsWith('/api/submit')
  ? FORMCONNECT_API_URL
  : `${FORMCONNECT_API_URL.replace(/\/+$/, '')}/api/submit`;

interface FooterProps {
  onNavigateTab?: (tab: 'home' | 'epg' | 'favorites') => void;
  favoritesCount?: number;
  onToggleFullscreen?: (val: boolean) => void;
}

export const Footer: React.FC<FooterProps> = ({
  onNavigateTab,
  favoritesCount = 0,
  onToggleFullscreen,
}) => {
  // Contact Us inline form state
  const [contactOpen, setContactOpen] = useState<boolean>(false);
  const [contactName, setContactName] = useState<string>('');
  const [contactEmail, setContactEmail] = useState<string>('');
  const [contactMessage, setContactMessage] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [submittedName, setSubmittedName] = useState<string>('');
  const [submittedEmail, setSubmittedEmail] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Legal/Info modals (Terms & Conditions, Privacy, About)
  const [activeModal, setActiveModal] = useState<InfoModalType>(null);

  const contactSectionRef = useRef<HTMLDivElement | null>(null);

  // Toggle Contact Form & scroll smoothly into view
  const toggleContactForm = () => {
    setContactOpen((prev) => {
      const next = !prev;
      if (next) {
        setTimeout(() => {
          contactSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 100);
      }
      return next;
    });
  };

  // Form submission handler using FormConnect backend API
  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const name = contactName.trim();
    const email = contactEmail.trim();
    const message = contactMessage.trim();

    if (!name) {
      setErrorMessage('Please enter your name.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    if (!message || message.length < 5) {
      setErrorMessage('Please write a message with at least 5 characters.');
      return;
    }

    setIsSubmitting(true);

    try {
      // 3. Submission Format: Send JSON payload shaped as specified
      const payload = {
        apiKey: FORMCONNECT_API_KEY,
        data: {
          name,
          email,
          message,
          project: 'Live TV Network',
          submittedAt: new Date().toISOString(),
        },
      };

      const response = await fetch(FORMCONNECT_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(payload),
      });

      let responseData: any = null;
      try {
        responseData = await response.json();
      } catch {
        // Response might not be JSON
      }

      if (!response.ok) {
        const errorMsg =
          responseData?.message ||
          responseData?.error ||
          `FormConnect submission failed with HTTP status ${response.status}. Please try again later.`;
        throw new Error(errorMsg);
      }

      // Also persist backup copy in browser localStorage
      try {
        const existingRaw = localStorage.getItem(CONTACT_STORAGE_KEY);
        const existing = existingRaw ? JSON.parse(existingRaw) : [];
        const newEntry = {
          id: `contact-${Date.now()}`,
          name,
          email,
          message,
          timestamp: new Date().toISOString(),
          formConnectSynced: true,
        };
        localStorage.setItem(CONTACT_STORAGE_KEY, JSON.stringify([newEntry, ...existing]));
      } catch (err) {
        console.error('Failed to save local contact backup:', err);
      }

      // 4. Reset the form upon successful submission
      setSubmittedName(name);
      setSubmittedEmail(email);
      setContactName('');
      setContactEmail('');
      setContactMessage('');
      setIsSubmitted(true);
    } catch (err: any) {
      console.error('FormConnect submission error:', err);
      setErrorMessage(
        err.message || 'Network error occurred while connecting to FormConnect. Please verify your internet connection and try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetContact = () => {
    setContactName('');
    setContactEmail('');
    setContactMessage('');
    setSubmittedName('');
    setSubmittedEmail('');
    setIsSubmitted(false);
    setErrorMessage(null);
  };

  return (
    <>
      <footer className="mt-14 border-t border-neutral-800 bg-neutral-950 text-neutral-300 py-10 px-4 sm:px-8 lg:px-12 select-none">
        <div className="max-w-6xl mx-auto space-y-10">
          
          {/* Top Grid of Footer */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10">
            
            {/* Col 1: Brand & Description */}
            <div className="space-y-3.5 lg:col-span-1">
              <LiveTvLogo size="md" variant="dark" showTagline />
              <p className="text-xs text-neutral-400 leading-relaxed">
                India's high-speed web TV directory. Free-to-air HLS & MPEG-DASH streaming aggregator with live electronic program guide (EPG) schedules.
              </p>
              <div className="flex flex-wrap gap-1.5 pt-1">
                <span className="px-2 py-0.5 rounded-md bg-neutral-900 border border-neutral-800 text-[10px] text-emerald-400 font-mono">
                  HLS & DASH
                </span>
                <span className="px-2 py-0.5 rounded-md bg-neutral-900 border border-neutral-800 text-[10px] text-neutral-300 font-mono">
                  14+ Languages
                </span>
                <span className="px-2 py-0.5 rounded-md bg-neutral-900 border border-neutral-800 text-[10px] text-neutral-300 font-mono">
                  Zero Signup
                </span>
              </div>
            </div>

            {/* Col 2: Navigation */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-white">
                Live Broadcast
              </h4>
              <ul className="space-y-2 text-xs">
                <li>
                  <button
                    type="button"
                    onClick={() => {
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                      onNavigateTab?.('home');
                    }}
                    className="flex items-center gap-1.5 text-neutral-400 hover:text-white transition-colors cursor-pointer"
                  >
                    <Tv className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Home Channels</span>
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => {
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                      onToggleFullscreen?.(true);
                    }}
                    className="flex items-center gap-1.5 text-neutral-400 hover:text-white transition-colors cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5 text-emerald-400 fill-current" />
                    <span>Live TV Player</span>
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => {
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                      onNavigateTab?.('epg');
                    }}
                    className="flex items-center gap-1.5 text-neutral-400 hover:text-white transition-colors cursor-pointer"
                  >
                    <Tv className="w-3.5 h-3.5 text-emerald-400" />
                    <span>TV Guide (EPG)</span>
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => {
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                      onNavigateTab?.('favorites');
                    }}
                    className="flex items-center gap-1.5 text-neutral-400 hover:text-white transition-colors cursor-pointer"
                  >
                    <Star className="w-3.5 h-3.5 text-amber-400 fill-current" />
                    <span>Watchlist {favoritesCount > 0 ? `(${favoritesCount})` : ''}</span>
                  </button>
                </li>
              </ul>
            </div>

            {/* Col 3: Details (Terms & Conditions, Privacy, About) */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-white">
                Details & Legal
              </h4>
              <ul className="space-y-2 text-xs">
                <li>
                  <button
                    type="button"
                    onClick={() => setActiveModal('terms')}
                    className="flex items-center gap-1.5 text-neutral-400 hover:text-white transition-colors cursor-pointer text-left"
                  >
                    <FileText className="w-3.5 h-3.5 text-neutral-400" />
                    <span>Terms & Conditions</span>
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => setActiveModal('privacy')}
                    className="flex items-center gap-1.5 text-neutral-400 hover:text-white transition-colors cursor-pointer text-left"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-neutral-400" />
                    <span>Privacy Policy</span>
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => setActiveModal('about')}
                    className="flex items-center gap-1.5 text-neutral-400 hover:text-white transition-colors cursor-pointer text-left"
                  >
                    <Info className="w-3.5 h-3.5 text-neutral-400" />
                    <span>About Us</span>
                  </button>
                </li>
                <li className="pt-1 text-[11px] text-neutral-500">
                  Client-side playback only. No stream files hosted.
                </li>
              </ul>
            </div>

            {/* Col 4: Contact Us Button & FormConnect info */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
                <span>Contact & Support</span>
                <span className="text-[10px] font-normal px-1.5 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800/40">
                  FormConnect
                </span>
              </h4>
              <p className="text-xs text-neutral-400">
                Have a broken stream to report, a channel to request, or DMCA inquiries?
              </p>
              <button
                type="button"
                onClick={toggleContactForm}
                className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  contactOpen
                    ? 'bg-emerald-600 text-white shadow-lg ring-2 ring-emerald-400'
                    : 'bg-neutral-900 hover:bg-neutral-800 text-white border border-neutral-700/80 shadow-sm'
                }`}
              >
                <Mail className="w-4 h-4 text-emerald-400" />
                <span>{contactOpen ? 'Close Contact Form' : 'Contact Us'}</span>
              </button>
              <div className="text-[11px] text-neutral-500 flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Automated FormConnect backend delivery</span>
              </div>
            </div>
          </div>

          {/* =====================================================================
              IN-FOOTER CONTACT US FORM (POWERED BY FORMCONNECT)
              ===================================================================== */}
          {contactOpen && (
            <div
              ref={contactSectionRef}
              className="p-5 sm:p-7 rounded-2xl bg-neutral-900/90 border border-neutral-800 shadow-2xl space-y-4 animate-in fade-in slide-in-from-top-2 duration-300"
            >
              {/* Header inside footer form */}
              <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-display font-bold text-white flex items-center gap-2">
                      Contact Us · Live TV Network
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-700/50 font-sans font-medium flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-emerald-400" />
                        FormConnect Backend
                      </span>
                    </h3>
                    <p className="text-[11px] sm:text-xs text-neutral-400 mt-0.5">
                      Submissions are securely routed via FormConnect API directly to our broadcast operations team.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setContactOpen(false)}
                  aria-label="Close Contact form"
                  className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Submitted Confirmation State */}
              {isSubmitted ? (
                <div className="p-4 sm:p-5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in duration-200">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-white">
                        ✓ Submitted successfully to FormConnect! Thank you, {submittedName || 'viewer'}.
                      </p>
                      <p className="text-xs text-emerald-200/80 mt-0.5">
                        Your message has been received by our broadcast support team. If a reply is required, we will follow up at{' '}
                        <strong className="text-white underline">{submittedEmail}</strong>.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    <button
                      type="button"
                      onClick={handleResetContact}
                      className="px-3.5 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-xs font-medium text-white transition-colors cursor-pointer"
                    >
                      Send Another
                    </button>
                    <button
                      type="button"
                      onClick={() => setContactOpen(false)}
                      className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white transition-colors cursor-pointer"
                    >
                      Done
                    </button>
                  </div>
                </div>
              ) : (
                /* The Contact Us Input Boxes & Submit Button */
                <form onSubmit={handleContactSubmit} className="space-y-4">
                  {errorMessage && (
                    <div className="p-3 rounded-lg bg-red-950/70 border border-red-500/50 flex items-start gap-2.5 text-xs text-red-200 animate-in fade-in">
                      <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                      <div>
                        <div className="font-semibold text-red-100">Submission Error</div>
                        <div>{errorMessage}</div>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {/* Name input box */}
                    <div>
                      <label className="block text-[11px] font-semibold text-neutral-300 mb-1">
                        Your Name <span className="text-emerald-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={contactName}
                        onChange={(e) => setContactName(e.target.value)}
                        placeholder="e.g. Rahul Sharma"
                        required
                        disabled={isSubmitting}
                        className="w-full px-3.5 py-2 text-xs rounded-lg bg-neutral-950 border border-neutral-700/80 text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors disabled:opacity-50"
                      />
                    </div>

                    {/* Email ID input box */}
                    <div>
                      <label className="block text-[11px] font-semibold text-neutral-300 mb-1">
                        Email ID <span className="text-emerald-400">*</span>
                      </label>
                      <input
                        type="email"
                        value={contactEmail}
                        onChange={(e) => setContactEmail(e.target.value)}
                        placeholder="e.g. rahul@example.com"
                        required
                        disabled={isSubmitting}
                        className="w-full px-3.5 py-2 text-xs rounded-lg bg-neutral-950 border border-neutral-700/80 text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors disabled:opacity-50"
                      />
                    </div>
                  </div>

                  {/* Message input box */}
                  <div>
                    <label className="block text-[11px] font-semibold text-neutral-300 mb-1">
                      Message <span className="text-emerald-400">*</span>
                    </label>
                    <textarea
                      rows={3}
                      value={contactMessage}
                      onChange={(e) => setContactMessage(e.target.value)}
                      placeholder="Please describe the channel name, stream feedback, or inquiry details..."
                      required
                      disabled={isSubmitting}
                      className="w-full px-3.5 py-2 text-xs rounded-lg bg-neutral-950 border border-neutral-700/80 text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 resize-none transition-colors disabled:opacity-50"
                    />
                  </div>

                  {/* Submit Button & Subtext Row */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
                    <p className="text-[11px] text-neutral-400 flex items-center gap-1.5">
                      <span>🔒 Connected to FormConnect backend</span>
                      <span className="text-neutral-600">·</span>
                      <span className="font-mono text-[10px] text-neutral-500">API: {FORMCONNECT_ENDPOINT}</span>
                    </p>

                    <div className="flex items-center gap-2 justify-end">
                      <button
                        type="button"
                        onClick={() => setContactOpen(false)}
                        disabled={isSubmitting}
                        className="px-4 py-2 text-xs rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-colors cursor-pointer disabled:opacity-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="flex items-center justify-center gap-2 px-6 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors shadow-md disabled:opacity-50 cursor-pointer"
                      >
                        {isSubmitting ? (
                          <>
                            <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            <span>Submitting to FormConnect...</span>
                          </>
                        ) : (
                          <>
                            <Send className="w-3.5 h-3.5" />
                            <span>Submit to FormConnect</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* Bottom Bar: Disclaimer & Copyright */}
          <div className="pt-6 border-t border-neutral-900 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-neutral-500">
            <div>
              Disclaimer: Live TV Network does not host or broadcast media streams directly. All content is delivered from publicly accessible third-party URLs.
            </div>
            <div className="shrink-0 font-mono-tabular">
              © {new Date().getFullYear()} Live TV Network. All rights reserved.
            </div>
          </div>

        </div>
      </footer>

      {/* Info Modals for Terms & Conditions, Privacy, About */}
      <InfoModal
        type={activeModal}
        onClose={() => setActiveModal(null)}
      />
    </>
  );
};
