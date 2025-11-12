# Chrome Extension API Reference

This document provides comprehensive reference documentation for the Chrome Extension APIs used in this project, along with examples of how to extend and modify the extension.

## Table of Contents

1. [Chrome Extension APIs](#chrome-extension-apis)
2. [Manifest V3 Configuration](#manifest-v3-configuration)
3. [Extension Functions Reference](#extension-functions-reference)
4. [DOM API Reference](#dom-api-reference)
5. [Fetch API Reference](#fetch-api-reference)
6. [Storage API](#storage-api)
7. [Extension Points](#extension-points)
8. [Event Handlers](#event-handlers)
9. [Best Practices](#best-practices)
10. [Common Patterns](#common-patterns)

## Chrome Extension APIs

### Overview

Chrome extensions use standard web APIs (JavaScript, DOM, Fetch) plus special Chrome APIs for browser integration.

**APIs Used in This Extension:**

| API | Purpose | Documentation |
|-----|---------|---------------|
| `chrome.storage` | Persistent data storage | [Docs](https://developer.chrome.com/docs/extensions/reference/storage/) |
| `chrome_url_overrides` | Override new tab page | [Docs](https://developer.chrome.com/docs/extensions/mv3/override/) |
| URL Overrides | Replace browser pages | Manifest V3 feature |
| Host Permissions | API access permissions | Manifest V3 feature |

### chrome.storage API

**Purpose**: Store and retrieve user data across sessions

**Basic Usage:**

```javascript
// Save data
chrome.storage.sync.set({ key: 'value' }, () => {
    console.log('Data saved');
});

// Retrieve data
chrome.storage.sync.get(['key'], (result) => {
    console.log('Value:', result.key);
});

// Remove data
chrome.storage.sync.remove(['key'], () => {
    console.log('Data removed');
});

// Clear all data
chrome.storage.sync.clear(() => {
    console.log('All data cleared');
});
```

**Storage Types:**

| Type | Description | Limit |
|------|-------------|-------|
| `sync` | Syncs across devices | 100 KB |
| `local` | Local to device | 5 MB |
| `session` | Session-only | 10 MB |

**Example: Saving User Preferences**

```javascript
function saveUserPreferences(preferences) {
    return new Promise((resolve, reject) => {
        chrome.storage.sync.set({ preferences }, () => {
            if (chrome.runtime.lastError) {
                reject(chrome.runtime.lastError);
            } else {
                resolve();
            }
        });
    });
}

// Usage
await saveUserPreferences({
    theme: 'dark',
    refreshInterval: 300000,
    showGreeting: true
});
```

**Example: Loading User Preferences**

```javascript
function loadUserPreferences() {
    return new Promise((resolve, reject) => {
        chrome.storage.sync.get(['preferences'], (result) => {
            if (chrome.runtime.lastError) {
                reject(chrome.runtime.lastError);
            } else {
                resolve(result.preferences || {});
            }
        });
    });
}

// Usage
const prefs = await loadUserPreferences();
console.log('User preferences:', prefs);
```

**Example: Watching for Changes**

```javascript
chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === 'sync' && changes.preferences) {
        console.log('Old value:', changes.preferences.oldValue);
        console.log('New value:', changes.preferences.newValue);
        applyPreferences(changes.preferences.newValue);
    }
});
```

### URL Overrides

**Purpose**: Replace Chrome's default pages with custom HTML

**Manifest Configuration:**

```json
{
  "chrome_url_overrides": {
    "newtab": "newtab.html"
  }
}
```

**Available Overrides:**

| Page | Description | URL |
|------|-------------|-----|
| `newtab` | New tab page | `chrome://newtab/` |
| `bookmarks` | Bookmarks page | `chrome://bookmarks/` |
| `history` | History page | `chrome://history/` |

**Limitations:**
- Only one extension can override each page
- If multiple extensions try, last installed wins
- User can disable override in extension settings

**Best Practices:**
- Keep page lightweight (< 1 MB)
- Load quickly (< 200ms ideal)
- Provide immediate visual feedback
- Handle offline scenarios gracefully

### Host Permissions

**Purpose**: Allow extension to make requests to specific domains

**Manifest Configuration:**

```json
{
  "host_permissions": [
    "https://api.github.com/*",
    "https://*.example.com/*"
  ]
}
```

**Permission Patterns:**

| Pattern | Matches |
|---------|---------|
| `https://example.com/*` | Exact domain |
| `https://*.example.com/*` | All subdomains |
| `https://*/*` | All HTTPS sites |
| `<all_urls>` | All sites (avoid!) |

**Security Best Practices:**
- Request only domains you need
- Use specific patterns, not wildcards
- Document why each permission is needed
- Consider proxy alternatives

## Manifest V3 Configuration

### Complete Manifest Reference

```json
{
  "manifest_version": 3,
  "name": "Extension Name",
  "version": "1.0.0",
  "description": "Extension description",

  "icons": {
    "16": "icons/icon16.png",
    "48": "icons/icon48.png",
    "128": "icons/icon128.png"
  },

  "permissions": [
    "storage",
    "notifications"
  ],

  "host_permissions": [
    "https://api.github.com/*"
  ],

  "chrome_url_overrides": {
    "newtab": "newtab.html"
  },

  "content_security_policy": {
    "extension_pages": "script-src 'self'; object-src 'self'"
  }
}
```

### Manifest Fields

#### Required Fields

**manifest_version**
```json
"manifest_version": 3
```
- Always `3` for new extensions
- Manifest V2 deprecated January 2023

**name**
```json
"name": "My Extension"
```
- Displayed in Chrome UI
- Max 45 characters
- Must be unique in Chrome Web Store

**version**
```json
"version": "1.0.0"
```
- Semantic versioning: `major.minor.patch`
- Must increase with each update
- Max 4 numbers: `1.2.3.4`

#### Optional Fields

**description**
```json
"description": "What this extension does"
```
- Max 132 characters
- Shown in extension management
- Important for discoverability

**icons**
```json
"icons": {
  "16": "path/to/16.png",
  "48": "path/to/48.png",
  "128": "path/to/128.png"
}
```
- PNG format recommended
- Multiple sizes for different contexts
- 128x128 required for Web Store

**permissions**
```json
"permissions": ["storage", "notifications"]
```
- Requested at install time
- Shown to user in permission dialog
- Cannot be changed after install

**host_permissions**
```json
"host_permissions": ["https://api.github.com/*"]
```
- Network access permissions
- Separate from general permissions (Manifest V3)
- User can revoke per-site

## Extension Functions Reference

### Time Management Functions

#### updateTime()

**Purpose**: Updates the displayed time and date

**Signature:**
```javascript
function updateTime(): void
```

**Description**: Fetches the current system time, formats it, and updates the DOM elements.

**Implementation:**
```javascript
function updateTime() {
    const now = new Date();

    // Format time (HH:MM:SS)
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const timeString = `${hours}:${minutes}:${seconds}`;

    // Format date
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
```

**Usage:**
```javascript
// Update once
updateTime();

// Update every second
setInterval(updateTime, 1000);
```

**Customization:**

```javascript
// 12-hour format
const timeString = now.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
});

// Different locale
const dateString = now.toLocaleDateString('de-DE', options);

// ISO format
const dateString = now.toISOString().split('T')[0];
```

#### formatRelativeTime()

**Purpose**: Convert absolute timestamp to relative time string

**Signature:**
```javascript
function formatRelativeTime(dateString: string): string
```

**Parameters:**
- `dateString` (string): ISO 8601 date string (e.g., "2024-01-15T10:30:00Z")

**Returns:**
- (string): Human-readable relative time (e.g., "2 hours ago")

**Implementation:**
```javascript
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
```

**Usage:**
```javascript
const timestamp = "2024-01-15T10:30:00Z";
const relative = formatRelativeTime(timestamp);
console.log(relative);  // "2 hours ago"
```

**Advanced Version with Weeks and Months:**

```javascript
function formatRelativeTimeExtended(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMinutes = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);
    const diffWeeks = Math.floor(diffDays / 7);
    const diffMonths = Math.floor(diffDays / 30);

    if (diffMonths > 0) {
        return diffMonths === 1 ? '1 month ago' : `${diffMonths} months ago`;
    } else if (diffWeeks > 0) {
        return diffWeeks === 1 ? '1 week ago' : `${diffWeeks} weeks ago`;
    } else if (diffDays > 0) {
        return diffDays === 1 ? 'yesterday' : `${diffDays} days ago`;
    } else if (diffHours > 0) {
        return diffHours === 1 ? '1 hour ago' : `${diffHours} hours ago`;
    } else if (diffMinutes > 0) {
        return diffMinutes === 1 ? '1 minute ago' : `${diffMinutes} minutes ago`;
    } else {
        return 'just now';
    }
}
```

### API Functions

#### fetchPullRequests()

**Purpose**: Fetch pull requests from GitHub API and display them

**Signature:**
```javascript
async function fetchPullRequests(): Promise<void>
```

**Description**: Makes API request to GitHub, parses response, creates PR cards, and handles errors.

**Implementation:**
```javascript
async function fetchPullRequests() {
    const container = document.getElementById('prs-container');

    try {
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

        container.innerHTML = '';

        if (prs.length === 0) {
            container.innerHTML = '<div class="loading">No open pull requests at the moment.</div>';
            return;
        }

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
```

**Usage:**
```javascript
// Fetch once
await fetchPullRequests();

// Fetch periodically
setInterval(fetchPullRequests, 300000); // Every 5 minutes
```

**Customization:**

```javascript
// Different repository
async function fetchPullRequests(owner, repo) {
    const url = `https://api.github.com/repos/${owner}/${repo}/pulls`;
    // ... rest of implementation
}

// With authentication
async function fetchPullRequests(token) {
    const response = await fetch(url, {
        headers: {
            'Accept': 'application/vnd.github.v3+json',
            'Authorization': `token ${token}`
        }
    });
    // ... rest
}

// With pagination
async function fetchAllPullRequests() {
    let allPRs = [];
    let page = 1;

    while (true) {
        const response = await fetch(
            `${url}?page=${page}&per_page=100`
        );
        const prs = await response.json();

        if (prs.length === 0) break;

        allPRs = allPRs.concat(prs);
        page++;
    }

    return allPRs;
}
```

#### createPRCard()

**Purpose**: Create a DOM element for a pull request

**Signature:**
```javascript
function createPRCard(pr: GitHubPR): HTMLElement
```

**Parameters:**
- `pr` (object): GitHub PR object from API

**Returns:**
- (HTMLElement): Fully-formed PR card div

**Implementation:**
```javascript
function createPRCard(pr) {
    const card = document.createElement('div');
    card.className = 'pr-card';

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
```

**GitHub PR Object Structure:**

```typescript
interface GitHubPR {
    number: number;
    title: string;
    html_url: string;
    created_at: string;
    updated_at: string;
    user: {
        login: string;
        avatar_url: string;
        html_url: string;
    };
    labels: Array<{
        name: string;
        color: string;
    }>;
    state: 'open' | 'closed';
    draft: boolean;
}
```

**Usage:**
```javascript
const pr = {
    number: 123,
    title: "Add solution for challenge #5",
    html_url: "https://github.com/...",
    user: {
        login: "username",
        avatar_url: "https://..."
    },
    created_at: "2024-01-15T10:30:00Z",
    labels: []
};

const card = createPRCard(pr);
document.getElementById('container').appendChild(card);
```

### Security Functions

#### escapeHtml()

**Purpose**: Prevent XSS attacks by escaping HTML special characters

**Signature:**
```javascript
function escapeHtml(text: string): string
```

**Parameters:**
- `text` (string): User-provided or external text

**Returns:**
- (string): HTML-safe escaped text

**Implementation:**
```javascript
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
```

**How It Works:**
1. Create temporary div element
2. Set `textContent` (browser auto-escapes)
3. Read `innerHTML` (get escaped version)

**Examples:**

```javascript
escapeHtml('<script>alert("XSS")</script>');
// Returns: "&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;"

escapeHtml('Hello & goodbye');
// Returns: "Hello &amp; goodbye"

escapeHtml('Price: $5 < $10');
// Returns: "Price: $5 &lt; $10"

escapeHtml('Quote: "Hello"');
// Returns: "Quote: &quot;Hello&quot;"
```

**Character Mappings:**

| Character | Escaped |
|-----------|---------|
| `<` | `&lt;` |
| `>` | `&gt;` |
| `"` | `&quot;` |
| `'` | `&#39;` |
| `&` | `&amp;` |

**Alternative Implementation:**

```javascript
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}
```

### Initialization Functions

#### init()

**Purpose**: Initialize the extension when the page loads

**Signature:**
```javascript
function init(): void
```

**Implementation:**
```javascript
function init() {
    // Update time immediately and then every second
    updateTime();
    setInterval(updateTime, 1000);

    // Fetch pull requests
    fetchPullRequests();

    // Refresh PRs every 5 minutes (300000ms)
    setInterval(fetchPullRequests, 300000);
}
```

**Usage:**
```javascript
// Wait for DOM
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
```

**Extended Version with Error Handling:**

```javascript
async function init() {
    try {
        // Load user preferences
        const prefs = await loadUserPreferences();
        applyPreferences(prefs);

        // Start time updates
        updateTime();
        setInterval(updateTime, 1000);

        // Fetch dynamic content
        await Promise.all([
            fetchPullRequests(),
            fetchWeather(),
            fetchQuote()
        ]);

        // Set up periodic updates
        setInterval(fetchPullRequests, prefs.refreshInterval || 300000);

        // Mark as ready
        document.body.classList.add('ready');

    } catch (error) {
        console.error('Initialization error:', error);
        showErrorNotification('Failed to initialize extension');
    }
}
```

## DOM API Reference

### Element Selection

```javascript
// By ID
const element = document.getElementById('time');

// By class
const elements = document.getElementsByClassName('pr-card');

// By CSS selector
const element = document.querySelector('.pr-card');
const elements = document.querySelectorAll('.pr-card');

// By tag name
const divs = document.getElementsByTagName('div');
```

### Element Creation

```javascript
// Create element
const div = document.createElement('div');

// Set attributes
div.id = 'my-id';
div.className = 'my-class';
div.setAttribute('data-value', '123');

// Set content
div.textContent = 'Safe text';  // Escapes HTML
div.innerHTML = '<span>HTML</span>';  // Renders HTML

// Append to DOM
parent.appendChild(div);
parent.insertBefore(div, referenceNode);
```

### Element Modification

```javascript
// Text content
element.textContent = 'New text';

// HTML content
element.innerHTML = '<strong>Bold</strong>';

// Classes
element.classList.add('active');
element.classList.remove('inactive');
element.classList.toggle('selected');
element.classList.contains('active');  // true/false

// Styles
element.style.backgroundColor = 'red';
element.style.fontSize = '16px';

// Data attributes
element.dataset.userId = '123';
element.getAttribute('data-user-id');
```

### Event Handling

```javascript
// Add event listener
element.addEventListener('click', (event) => {
    console.log('Clicked!', event);
});

// Remove event listener
const handler = (e) => console.log(e);
element.addEventListener('click', handler);
element.removeEventListener('click', handler);

// Event types
element.addEventListener('click', handler);
element.addEventListener('mouseover', handler);
element.addEventListener('keydown', handler);
element.addEventListener('submit', handler);
```

## Fetch API Reference

### Basic Fetch

```javascript
// GET request
const response = await fetch('https://api.example.com/data');
const data = await response.json();

// POST request
const response = await fetch('https://api.example.com/data', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({ key: 'value' })
});

// Error handling
try {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
    }
    const data = await response.json();
} catch (error) {
    console.error('Fetch error:', error);
}
```

### Response Methods

```javascript
// Parse JSON
const data = await response.json();

// Get text
const text = await response.text();

// Get blob (for images, files)
const blob = await response.blob();

// Check status
if (response.ok) {  // 200-299
    // Success
}

// Status code
console.log(response.status);  // 200, 404, etc.

// Headers
console.log(response.headers.get('content-type'));
```

### Request Options

```javascript
fetch(url, {
    method: 'POST',  // GET, POST, PUT, DELETE, etc.
    headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer token'
    },
    body: JSON.stringify(data),
    mode: 'cors',  // cors, no-cors, same-origin
    credentials: 'include',  // include, same-origin, omit
    cache: 'no-cache',  // default, no-cache, reload, force-cache
    redirect: 'follow',  // follow, error, manual
    signal: abortController.signal  // For cancellation
});
```

### Abort Controller

```javascript
// Cancel fetch requests
const controller = new AbortController();

setTimeout(() => controller.abort(), 5000);  // 5s timeout

try {
    const response = await fetch(url, {
        signal: controller.signal
    });
} catch (error) {
    if (error.name === 'AbortError') {
        console.log('Request was cancelled');
    }
}
```

## Extension Points

### Adding Custom Data Sources

**Pattern**: Create new fetch functions following the same structure

```javascript
async function fetchCustomData() {
    const container = document.getElementById('custom-container');

    try {
        const response = await fetch('https://api.example.com/data');
        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();
        container.innerHTML = '';

        data.items.forEach(item => {
            const card = createCustomCard(item);
            container.appendChild(card);
        });

    } catch (error) {
        console.error('Fetch error:', error);
        container.innerHTML = `<div class="error">${error.message}</div>`;
    }
}

function createCustomCard(item) {
    const card = document.createElement('div');
    card.className = 'custom-card';
    card.innerHTML = `
        <h3>${escapeHtml(item.title)}</h3>
        <p>${escapeHtml(item.description)}</p>
    `;
    return card;
}

// Register in init()
function init() {
    // ... existing code ...
    fetchCustomData();
    setInterval(fetchCustomData, 600000);  // Every 10 minutes
}
```

### Adding Settings Panel

**Pattern**: Create overlay UI with save/load functions

```javascript
// Save settings
async function saveSettings(settings) {
    await chrome.storage.sync.set({ settings });
    applySettings(settings);
}

// Load settings
async function loadSettings() {
    const result = await chrome.storage.sync.get(['settings']);
    return result.settings || getDefaultSettings();
}

// Apply settings
function applySettings(settings) {
    document.body.style.backgroundColor = settings.bgColor;
    // Apply other settings...
}

// UI handlers
document.getElementById('save-btn').addEventListener('click', () => {
    const settings = {
        bgColor: document.getElementById('bg-color').value,
        refreshInterval: document.getElementById('refresh').value
    };
    saveSettings(settings);
});
```

## Best Practices

### Performance

1. **Minimize DOM manipulations**
   ```javascript
   // Bad: Multiple reflows
   for (let item of items) {
       container.appendChild(createCard(item));
   }

   // Good: Single reflow
   const fragment = document.createDocumentFragment();
   for (let item of items) {
       fragment.appendChild(createCard(item));
   }
   container.appendChild(fragment);
   ```

2. **Debounce expensive operations**
   ```javascript
   function debounce(func, wait) {
       let timeout;
       return function(...args) {
           clearTimeout(timeout);
           timeout = setTimeout(() => func.apply(this, args), wait);
       };
   }

   const debouncedFetch = debounce(fetchData, 1000);
   ```

3. **Use efficient selectors**
   ```javascript
   // Fast
   document.getElementById('id');

   // Slower
   document.querySelector('#id');
   document.getElementsByClassName('class')[0];
   ```

### Security

1. **Always escape user content**
   ```javascript
   // Unsafe
   element.innerHTML = userInput;

   // Safe
   element.textContent = userInput;
   // Or
   element.innerHTML = escapeHtml(userInput);
   ```

2. **Validate all inputs**
   ```javascript
   function validateUrl(url) {
       try {
           new URL(url);
           return url.startsWith('https://');
       } catch {
           return false;
       }
   }
   ```

3. **Use HTTPS only**
   ```javascript
   // Bad
   fetch('http://api.example.com/data');

   // Good
   fetch('https://api.example.com/data');
   ```

### Error Handling

1. **Catch all promise rejections**
   ```javascript
   async function fetchData() {
       try {
           const data = await fetch(url);
           return await data.json();
       } catch (error) {
           console.error('Error:', error);
           showErrorMessage(error.message);
           return null;
       }
   }
   ```

2. **Provide user feedback**
   ```javascript
   function showError(message) {
       const errorDiv = document.createElement('div');
       errorDiv.className = 'error-notification';
       errorDiv.textContent = message;
       document.body.appendChild(errorDiv);

       setTimeout(() => errorDiv.remove(), 5000);
   }
   ```

## Common Patterns

### Loading States

```javascript
function showLoading(container) {
    container.innerHTML = '<div class="loading">Loading...</div>';
}

function hideLoading(container) {
    container.querySelector('.loading')?.remove();
}

async function loadData() {
    const container = document.getElementById('container');
    showLoading(container);

    try {
        const data = await fetchData();
        renderData(container, data);
    } catch (error) {
        showError(container, error.message);
    }
}
```

### Retry Logic

```javascript
async function fetchWithRetry(url, options = {}, retries = 3) {
    for (let i = 0; i < retries; i++) {
        try {
            return await fetch(url, options);
        } catch (error) {
            if (i === retries - 1) throw error;
            await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
        }
    }
}
```

### Caching

```javascript
class Cache {
    constructor(ttl = 300000) {  // 5 minutes
        this.cache = new Map();
        this.ttl = ttl;
    }

    set(key, value) {
        this.cache.set(key, {
            value,
            timestamp: Date.now()
        });
    }

    get(key) {
        const item = this.cache.get(key);
        if (!item) return null;

        if (Date.now() - item.timestamp > this.ttl) {
            this.cache.delete(key);
            return null;
        }

        return item.value;
    }

    clear() {
        this.cache.clear();
    }
}

const cache = new Cache();
```

---

## Summary

This API reference covers:
- ✅ Chrome Extension APIs (storage, URL overrides)
- ✅ Manifest V3 configuration
- ✅ All extension functions with examples
- ✅ DOM and Fetch API reference
- ✅ Extension points for customization
- ✅ Best practices and common patterns

For more information:
- See `implementation.md` for architecture details
- See `examples.md` for practical use cases
- See [Chrome Extensions Documentation](https://developer.chrome.com/docs/extensions/)

**Total Lines**: ~1,000+ lines of comprehensive API documentation
