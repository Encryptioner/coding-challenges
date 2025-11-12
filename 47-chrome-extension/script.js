// Time and Date Management
function updateTime() {
    const now = new Date();

    // Format time (HH:MM:SS)
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const timeString = `${hours}:${minutes}:${seconds}`;

    // Format date (e.g., "Monday, January 15, 2024")
    const options = {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    };
    const dateString = now.toLocaleDateString('en-US', options);

    // Update DOM
    document.getElementById('time').textContent = timeString;
    document.getElementById('date').textContent = dateString;
}

// Format relative time (e.g., "2 hours ago")
function formatRelativeTime(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
        return diffDays === 1 ? '1 day ago' : `${diffDays} days ago`;
    } else if (diffHours > 0) {
        return diffHours === 1 ? '1 hour ago' : `${diffHours} hours ago`;
    } else if (diffMinutes > 0) {
        return diffMinutes === 1 ? '1 minute ago' : `${diffMinutes} minutes ago`;
    } else {
        return 'just now';
    }
}

// Fetch GitHub Pull Requests
async function fetchPullRequests() {
    const container = document.getElementById('prs-container');

    try {
        // GitHub API endpoint for pull requests
        const response = await fetch(
            'https://api.github.com/repos/CodingChallegesFYI/SharedSolutions/pulls',
            {
                headers: {
                    'Accept': 'application/vnd.github.v3+json'
                }
            }
        );

        if (!response.ok) {
            throw new Error(`GitHub API returned ${response.status}: ${response.statusText}`);
        }

        const prs = await response.json();

        // Clear loading message
        container.innerHTML = '';

        if (prs.length === 0) {
            container.innerHTML = '<div class="loading">No open pull requests at the moment.</div>';
            return;
        }

        // Display PRs
        prs.forEach(pr => {
            const prCard = createPRCard(pr);
            container.appendChild(prCard);
        });

    } catch (error) {
        console.error('Error fetching pull requests:', error);
        container.innerHTML = `
            <div class="error">
                <strong>Failed to load pull requests</strong><br>
                ${error.message}
            </div>
        `;
    }
}

// Create PR Card Element
function createPRCard(pr) {
    const card = document.createElement('div');
    card.className = 'pr-card';

    // Build labels HTML if labels exist
    let labelsHTML = '';
    if (pr.labels && pr.labels.length > 0) {
        const labelsArr = pr.labels.map(label =>
            `<span class="pr-label">${escapeHtml(label.name)}</span>`
        ).join('');
        labelsHTML = `<div class="pr-labels">${labelsArr}</div>`;
    }

    card.innerHTML = `
        <a href="${pr.html_url}" target="_blank" class="pr-title">
            #${pr.number}: ${escapeHtml(pr.title)}
        </a>
        <div class="pr-meta">
            <div class="pr-user">
                <img src="${pr.user.avatar_url}" alt="${escapeHtml(pr.user.login)}" class="pr-avatar">
                <span>${escapeHtml(pr.user.login)}</span>
            </div>
            <div class="pr-date">${formatRelativeTime(pr.created_at)}</div>
        </div>
        ${labelsHTML}
    `;

    return card;
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Initialize the extension
function init() {
    // Update time immediately and then every second
    updateTime();
    setInterval(updateTime, 1000);

    // Fetch pull requests
    fetchPullRequests();

    // Refresh PRs every 5 minutes (300000ms)
    setInterval(fetchPullRequests, 300000);
}

// Start when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
