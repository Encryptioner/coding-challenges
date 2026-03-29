/**
 * Centralized Google Analytics event tracking for Coding Challenges.
 *
 * Loaded as a standalone <script> tag in both generated HTML pages.
 * Guards for window.gtag so it no-ops cleanly with ad blockers or SSR.
 */

// ── Type Definition ──────────────────────────────────────────────────────────

/**
 * @typedef {
 *   | { name: 'challenge_clicked', params: { challenge_id: string, challenge_title: string, action: 'code' | 'docs' | 'preview' } }
 *   | { name: 'filter_applied', params: { filter: 'all' | 'completed' | 'web' | 'docs' | 'preview' | 'in_progress', visible_count: number } }
 *   | { name: 'external_link_clicked', params: { destination: 'github_repo' | 'codingchallenges_fyi' | 'portfolio' | 'linkedin' | 'twitter' | 'blog' } }
 *   | { name: 'stats_viewed' }
 *   | { name: 'doc_section_viewed', params: { challenge_id: string, section: 'overview' | 'challenge' | 'implementation' | 'examples' | 'algorithms' | 'tutorial' | 'api' } }
 *   | { name: 'view_mode_changed', params: { mode: 'docs' | 'app' | 'split' } }
 *   | { name: 'code_copied', params: { challenge_id: string, language: string } }
 *   | { name: 'pane_resized' }
 *   | { name: 'toc_link_clicked', params: { challenge_id: string, heading: string } }
 *   | { name: 'back_to_index' }
 *   | { name: 'preview_loaded', params: { challenge_id: string } }
 *   | { name: 'mobile_menu_toggled', params: { opened: boolean } }
 *   | { name: 'error_occurred', params: { category: string, action: string, error: string } }
 * } AnalyticsEvent
 */

// ── Core tracking function ───────────────────────────────────────────────────

const EMAIL_PATTERN = /[\w.+-]+@[\w.-]+\.\w+/g;

/**
 * Strip email addresses from error messages to prevent PII leakage.
 * @param {string} msg
 * @returns {string}
 */
function sanitizeError(msg) {
  return String(msg).replace(EMAIL_PATTERN, '[email]').slice(0, 100);
}

/**
 * Send a typed analytics event to Google Analytics.
 * No-ops gracefully when gtag is unavailable (ad blockers, no GA script).
 *
 * @param {AnalyticsEvent} event
 */
function trackEvent(event) {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') return;

  const { name, ...rest } = event;
  const params = 'params' in rest ? rest.params : undefined;
  window.gtag('event', name, params);
}

// Expose on window so script.js and docs-viewer.js can call it
window.Analytics = { trackEvent, sanitizeError };
