// Main site JavaScript

document.addEventListener('DOMContentLoaded', () => {
    initFilters();
    initCardButtons();
    initExternalLinks();
    trackStatsViewed();
});

// ── Analytics helpers ─────────────────────────────────────────────────────────

/** @returns {{ trackEvent: Function, sanitizeError: Function } | null} */
function analytics() {
    return window.Analytics || null;
}

// ── Stats viewed (fires once on page load) ────────────────────────────────────

function trackStatsViewed() {
    analytics()?.trackEvent({ name: 'stats_viewed' });
}

// ── Filter buttons ────────────────────────────────────────────────────────────

function initFilters() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    const challengeCards = document.querySelectorAll('.challenge-card');

    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Update active button
            filterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            const filter = button.dataset.filter;

            // Filter cards
            let visibleCount = 0;
            challengeCards.forEach(card => {
                const tags = card.dataset.tags || '';

                if (filter === 'all') {
                    card.classList.remove('hidden');
                    visibleCount++;
                } else if (tags.includes(filter)) {
                    card.classList.remove('hidden');
                    visibleCount++;
                } else {
                    card.classList.add('hidden');
                }
            });

            // Normalise filter value to AnalyticsEvent union member
            const filterValue = /** @type {'all'|'completed'|'web'|'docs'|'preview'|'in_progress'} */ (
                filter === 'in-progress' ? 'in_progress' : filter
            );
            analytics()?.trackEvent({
                name: 'filter_applied',
                params: { filter: filterValue, visible_count: visibleCount },
            });
        });
    });
}

// ── Card action buttons (View Code / Docs / Preview) ─────────────────────────

function initCardButtons() {
    const cards = document.querySelectorAll('.challenge-card');

    cards.forEach(card => {
        const titleEl = card.querySelector('.card-title');
        const challengeTitle = titleEl ? titleEl.textContent.trim() : '';

        // Derive challenge_id from the card's GitHub link href
        // href format: "https://github.com/…/tree/master/<folder>"
        const codeLink = card.querySelector('.card-footer .card-btn:first-child');
        const challengeId = codeLink
            ? (codeLink.href.split('/master/')[1] || '').replace(/\/$/, '')
            : '';

        card.querySelectorAll('.card-footer a.card-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const label = btn.textContent.trim().toLowerCase();

                if (label.includes('code')) {
                    analytics()?.trackEvent({
                        name: 'challenge_clicked',
                        params: { challenge_id: challengeId, challenge_title: challengeTitle, action: 'code' },
                    });
                } else if (label.includes('docs')) {
                    analytics()?.trackEvent({
                        name: 'challenge_clicked',
                        params: { challenge_id: challengeId, challenge_title: challengeTitle, action: 'docs' },
                    });
                } else if (label.includes('preview')) {
                    analytics()?.trackEvent({
                        name: 'challenge_clicked',
                        params: { challenge_id: challengeId, challenge_title: challengeTitle, action: 'preview' },
                    });
                }
            });
        });
    });
}

// ── External links ────────────────────────────────────────────────────────────

/** @type {Array<[string, 'github_repo'|'codingchallenges_fyi'|'portfolio'|'linkedin'|'twitter'|'blog']>} */
const EXTERNAL_LINK_MAP = [
    ['github.com/Encryptioner/coding-challenges', 'github_repo'],
    ['codingchallenges.fyi', 'codingchallenges_fyi'],
    ['encryptioner.github.io', 'portfolio'],
    ['linkedin.com', 'linkedin'],
    ['twitter.com', 'twitter'],
    ['nerddevs.com', 'blog'],
];

function initExternalLinks() {
    document.querySelectorAll('a[target="_blank"]').forEach(link => {
        link.addEventListener('click', () => {
            const href = link.href || '';
            for (const [pattern, destination] of EXTERNAL_LINK_MAP) {
                if (href.includes(pattern)) {
                    analytics()?.trackEvent({
                        name: 'external_link_clicked',
                        params: { destination },
                    });
                    break;
                }
            }
        });
    });
}
