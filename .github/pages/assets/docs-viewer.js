// Interactive Documentation Viewer

// ── Doc-path → section name mapping ─────────────────────────────────────────

/** @type {Record<string, 'overview'|'challenge'|'implementation'|'examples'|'algorithms'|'tutorial'|'api'>} */
const DOC_SECTION_MAP = {
    'README.html': 'overview',
    'challenge.html': 'challenge',
    'docs/implementation.html': 'implementation',
    'docs/examples.html': 'examples',
    'docs/algorithms.html': 'algorithms',
    'docs/tutorial.html': 'tutorial',
    'docs/api.html': 'api',
};

// ── Analytics helpers ─────────────────────────────────────────────────────────

/** @returns {{ trackEvent: Function, sanitizeError: Function } | null} */
function analytics() {
    return window.Analytics || null;
}

/**
 * Derive the challenge_id from the page URL.
 * URL pattern: /coding-challenges/<challenge-folder>/docs.html
 * Returns the folder name, e.g. "ex-04-mobile-ide-app".
 * @returns {string}
 */
function getChallengeId() {
    const parts = window.location.pathname.split('/').filter(Boolean);
    // The challenge folder is the second-to-last segment before docs.html
    // e.g. ["coding-challenges", "ex-04-mobile-ide-app", "docs.html"]
    if (parts.length >= 2) {
        return parts[parts.length - 2] || '';
    }
    return '';
}

// ── Pane-resize debounce ─────────────────────────────────────────────────────

/** @type {ReturnType<typeof setTimeout> | null} */
let paneResizeTimer = null;

function trackPaneResized() {
    if (paneResizeTimer !== null) clearTimeout(paneResizeTimer);
    paneResizeTimer = setTimeout(() => {
        analytics()?.trackEvent({ name: 'pane_resized' });
        paneResizeTimer = null;
    }, 500);
}

// ── Main class ───────────────────────────────────────────────────────────────

class DocsViewer {
    constructor() {
        this.currentView = 'split'; // 'docs', 'app', 'split'
        this.currentDoc = null;
        this.docsData = {};
        this.challengeId = getChallengeId();
        this.init();
    }

    init() {
        this.setupViewControls();
        this.setupSidebar();
        this.setupResizer();
        this.setupMobileMenu();
        this.setupBackLink();
        this.loadInitialDoc();
    }

    setupViewControls() {
        const viewButtons = document.querySelectorAll('.view-btn');

        viewButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const view = btn.dataset.view;
                this.setView(view);

                // Update active button
                viewButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                analytics()?.trackEvent({
                    name: 'view_mode_changed',
                    params: { mode: /** @type {'docs'|'app'|'split'} */ (view) },
                });
            });
        });
    }

    setView(view) {
        this.currentView = view;
        const container = document.querySelector('.split-container');
        const docsPane = document.querySelector('.split-pane.docs-pane');
        const appPane = document.querySelector('.split-pane.app-pane');
        const resizer = document.querySelector('.resizer');

        // Reset
        docsPane.classList.remove('hidden');
        appPane.classList.remove('hidden');
        container.classList.remove('docs-only', 'app-only', 'split-view');

        switch (view) {
            case 'docs':
                appPane.classList.add('hidden');
                if (resizer) resizer.style.display = 'none';
                container.classList.add('docs-only');
                break;
            case 'app':
                docsPane.classList.add('hidden');
                if (resizer) resizer.style.display = 'none';
                container.classList.add('app-only');
                // Track preview_loaded when app pane first becomes visible
                this.trackPreviewIfNeeded();
                break;
            case 'split':
                if (resizer) resizer.style.display = 'block';
                container.classList.add('split-view');
                this.trackPreviewIfNeeded();
                break;
        }
    }

    trackPreviewIfNeeded() {
        if (this._previewTracked) return;
        const iframe = document.querySelector('.app-frame');
        if (!iframe) return;

        this._previewTracked = true;
        analytics()?.trackEvent({
            name: 'preview_loaded',
            params: { challenge_id: this.challengeId },
        });
    }

    setupSidebar() {
        const navItems = document.querySelectorAll('.docs-nav-item');

        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const docPath = item.dataset.doc;
                this.loadDoc(docPath);

                // Update active item
                navItems.forEach(nav => nav.classList.remove('active'));
                item.classList.add('active');

                // Track doc section viewed
                const section = DOC_SECTION_MAP[docPath] || 'overview';
                analytics()?.trackEvent({
                    name: 'doc_section_viewed',
                    params: { challenge_id: this.challengeId, section },
                });

                // Close mobile menu if open
                this.closeMobileMenu();
            });
        });
    }

    setupResizer() {
        const resizer = document.querySelector('.resizer');
        if (!resizer) return;

        let isResizing = false;
        let startX = 0;
        let startWidth = 0;

        resizer.addEventListener('mousedown', (e) => {
            isResizing = true;
            startX = e.clientX;
            const docsPane = document.querySelector('.split-pane.docs-pane');
            startWidth = docsPane.offsetWidth;

            document.body.style.cursor = 'col-resize';
            document.body.style.userSelect = 'none';
        });

        document.addEventListener('mousemove', (e) => {
            if (!isResizing) return;

            const deltaX = e.clientX - startX;
            const docsPane = document.querySelector('.split-pane.docs-pane');
            const newWidth = startWidth + deltaX;

            // Min and max widths
            if (newWidth >= 300 && newWidth <= window.innerWidth - 300) {
                docsPane.style.flex = `0 0 ${newWidth}px`;
            }
        });

        document.addEventListener('mouseup', () => {
            if (isResizing) {
                isResizing = false;
                document.body.style.cursor = '';
                document.body.style.userSelect = '';
                // Debounced: fires once per drag gesture
                trackPaneResized();
            }
        });
    }

    setupMobileMenu() {
        const menuBtn = document.querySelector('.mobile-menu-btn');
        const sidebar = document.querySelector('.docs-sidebar');
        const overlay = document.querySelector('.sidebar-overlay');

        if (menuBtn) {
            menuBtn.addEventListener('click', () => {
                const willOpen = !sidebar.classList.contains('open');
                sidebar.classList.toggle('open');
                overlay.classList.toggle('active');

                analytics()?.trackEvent({
                    name: 'mobile_menu_toggled',
                    params: { opened: willOpen },
                });
            });
        }

        if (overlay) {
            overlay.addEventListener('click', () => {
                this.closeMobileMenu();
            });
        }
    }

    setupBackLink() {
        // The back link (.back-link or .back-button) lives in the sidebar header
        const backLink = document.querySelector('.back-link, .back-button');
        if (backLink) {
            backLink.addEventListener('click', () => {
                analytics()?.trackEvent({ name: 'back_to_index' });
            });
        }
    }

    closeMobileMenu() {
        const sidebar = document.querySelector('.docs-sidebar');
        const overlay = document.querySelector('.sidebar-overlay');

        sidebar.classList.remove('open');
        overlay.classList.remove('active');
    }

    async loadDoc(docPath) {
        this.currentDoc = docPath;
        const docsContent = document.querySelector('.docs-content');

        // Show loading state
        docsContent.innerHTML = `
            <div class="docs-loading">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p>Loading documentation...</p>
            </div>
        `;

        try {
            // Check cache
            if (this.docsData[docPath]) {
                docsContent.innerHTML = this.docsData[docPath];
                this.enhanceContent();
                return;
            }

            // Fetch documentation
            const response = await fetch(docPath);
            if (!response.ok) throw new Error('Failed to load documentation');

            const html = await response.text();
            this.docsData[docPath] = html;
            docsContent.innerHTML = html;
            this.enhanceContent();

        } catch (error) {
            console.error('Error loading documentation:', error);
            docsContent.innerHTML = `
                <div class="docs-error">
                    <h2>Error Loading Documentation</h2>
                    <p>Failed to load ${docPath}. Please try again.</p>
                </div>
            `;
            analytics()?.trackEvent({
                name: 'error_occurred',
                params: {
                    category: 'docs_fetch',
                    action: 'load_doc',
                    error: analytics().sanitizeError(error instanceof Error ? error.message : String(error)),
                },
            });
        }
    }

    enhanceContent() {
        // Add syntax highlighting if available
        if (window.Prism) {
            Prism.highlightAll();
        }

        // Add copy buttons to code blocks
        this.addCopyButtons();

        // Generate table of contents
        this.generateTOC();

        // Smooth scroll to anchors
        this.setupSmoothScroll();
    }

    addCopyButtons() {
        const codeBlocks = document.querySelectorAll('pre code');

        codeBlocks.forEach(block => {
            const pre = block.parentElement;
            const button = document.createElement('button');
            button.className = 'copy-btn';
            button.innerHTML = `
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
                Copy
            `;

            button.addEventListener('click', async () => {
                const code = block.textContent;
                // Detect language from class (e.g. "language-bash")
                const langClass = Array.from(block.classList).find(c => c.startsWith('language-'));
                const language = langClass ? langClass.replace('language-', '') : 'unknown';

                try {
                    await navigator.clipboard.writeText(code);
                    analytics()?.trackEvent({
                        name: 'code_copied',
                        params: { challenge_id: this.challengeId, language },
                    });

                    button.innerHTML = `
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                        Copied!
                    `;
                    setTimeout(() => {
                        button.innerHTML = `
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                            </svg>
                            Copy
                        `;
                    }, 2000);
                } catch (err) {
                    console.error('Failed to copy:', err);
                }
            });

            pre.style.position = 'relative';
            pre.appendChild(button);
        });
    }

    generateTOC() {
        const docsContent = document.querySelector('.docs-content');
        const headings = docsContent.querySelectorAll('h2, h3');

        if (headings.length < 3) return; // Don't generate TOC for short docs

        const toc = document.createElement('div');
        toc.className = 'toc';
        toc.innerHTML = '<h4>Table of Contents</h4><ul></ul>';
        const tocList = toc.querySelector('ul');

        headings.forEach((heading, index) => {
            // Add ID to heading if it doesn't have one
            if (!heading.id) {
                heading.id = `heading-${index}`;
            }

            const li = document.createElement('li');
            const a = document.createElement('a');
            a.href = `#${heading.id}`;
            a.textContent = heading.textContent;
            a.style.paddingLeft = heading.tagName === 'H3' ? '1rem' : '0';

            a.addEventListener('click', () => {
                analytics()?.trackEvent({
                    name: 'toc_link_clicked',
                    params: { challenge_id: this.challengeId, heading: heading.textContent.trim() },
                });
            });

            li.appendChild(a);
            tocList.appendChild(li);
        });

        // Insert after first heading
        const firstHeading = docsContent.querySelector('h1, h2');
        if (firstHeading) {
            firstHeading.after(toc);
        }
    }

    setupSmoothScroll() {
        const links = document.querySelectorAll('.docs-content a[href^="#"]');

        links.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = link.getAttribute('href').slice(1);
                const target = document.getElementById(targetId);

                if (target) {
                    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            });
        });
    }

    loadInitialDoc() {
        // Load first documentation file or default
        const firstNavItem = document.querySelector('.docs-nav-item');
        if (firstNavItem) {
            firstNavItem.click();
        }
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.docsViewer = new DocsViewer();
});

// CSS for copy button (injected dynamically)
const style = document.createElement('style');
style.textContent = `
    .copy-btn {
        position: absolute;
        top: 0.5rem;
        right: 0.5rem;
        padding: 0.5rem 0.75rem;
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 0.25rem;
        color: white;
        font-size: 0.75rem;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        gap: 0.25rem;
        opacity: 0;
        transition: opacity 0.2s;
    }

    pre:hover .copy-btn {
        opacity: 1;
    }

    .copy-btn:hover {
        background: rgba(255, 255, 255, 0.2);
    }
`;
document.head.appendChild(style);
