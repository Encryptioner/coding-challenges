# Chrome Extension Examples and Customization Guide

This document provides practical examples, customization guides, and real-world use cases for the Coding Challenges Chrome Extension.

## Table of Contents

1. [Basic Usage](#basic-usage)
2. [Customization Examples](#customization-examples)
3. [Adding New Features](#adding-new-features)
4. [API Integration Examples](#api-integration-examples)
5. [Styling Modifications](#styling-modifications)
6. [Advanced Customizations](#advanced-customizations)
7. [Troubleshooting Common Issues](#troubleshooting-common-issues)
8. [Real-World Use Cases](#real-world-use-cases)

## Basic Usage

### Opening a New Tab

The most basic usage is simply opening a new tab:

**Windows/Linux:**
```
Ctrl + T
```

**macOS:**
```
Cmd + T
```

Your custom dashboard immediately appears!

### Interacting with Pull Requests

1. **Viewing PRs**: Scroll through the list of open pull requests
2. **Opening a PR**: Click any PR card to open it in a new tab on GitHub
3. **Checking Updates**: PRs automatically refresh every 5 minutes

### Reading the Time

The extension shows:
- **Current Time**: Large clock display (HH:MM:SS format)
- **Current Date**: Human-readable format (e.g., "Monday, January 15, 2024")

## Customization Examples

### Example 1: Changing the Background Color

Want a different color scheme? Here's how:

**Edit `styles.css`:**
```css
body {
    background-color: #1a1a2e;  /* Dark purple-blue */
    /* Original: #04295B */
}
```

**Popular Alternatives:**
```css
/* Dark Mode */
background-color: #1a1a1a;

/* Material Design Blue */
background-color: #1976d2;

/* Gradient Background */
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);

/* Image Background */
background-image: url('bg-image.jpg');
background-size: cover;
background-position: center;
```

### Example 2: Changing Text Colors

**Edit `styles.css`:**
```css
/* Change all text to a different color */
body {
    color: #f0f0f0;  /* Light gray instead of white */
}

/* Change brand text specifically */
.brand {
    color: #ffd700;  /* Gold */
    text-shadow: 3px 3px 6px rgba(0, 0, 0, 0.5);
}

/* Change time display */
.time {
    color: #00ff00;  /* Green terminal-style */
}
```

### Example 3: Customizing Fonts

**Edit `styles.css`:**
```css
/* Use a monospace font for code aesthetic */
body {
    font-family: 'Courier New', Courier, monospace;
}

/* Or use Google Fonts */
@import url('https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;700&display=swap');

body {
    font-family: 'Roboto', sans-serif;
}
```

### Example 4: Changing Time Format

**Edit `script.js` - Change to 12-hour format:**
```javascript
function updateTime() {
    const now = new Date();

    // 12-hour format with AM/PM
    const timeString = now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
    });

    // Rest of the code...
    document.getElementById('time').textContent = timeString;
}
```

**Result**: "02:30:45 PM" instead of "14:30:45"

### Example 5: Changing Date Format

**Edit `script.js`:**
```javascript
function updateTime() {
    const now = new Date();

    // Short format
    const dateString = now.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });

    // Result: "Jan 15, 2024"
}
```

**Alternative Formats:**
```javascript
// ISO Format: "2024-01-15"
const dateString = now.toISOString().split('T')[0];

// Full month: "January 15, 2024"
const dateString = now.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
});

// With weekday: "Mon, Jan 15"
const dateString = now.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
});
```

### Example 6: Changing PR Refresh Interval

**Edit `script.js`:**
```javascript
function init() {
    // ... existing code ...

    // Change from 5 minutes (300000) to 10 minutes (600000)
    setInterval(fetchPullRequests, 600000);

    // Or 2 minutes (120000)
    setInterval(fetchPullRequests, 120000);
}
```

**Considerations:**
- More frequent = more up-to-date, but uses more API calls
- Less frequent = slower updates, but respects rate limits
- GitHub rate limit: 60 requests/hour (unauthenticated)

## Adding New Features

### Feature 1: Add a Greeting Message

**Edit `newtab.html` - Add after the header:**
```html
<div class="greeting-section">
    <p class="greeting" id="greeting">Good morning!</p>
</div>
```

**Edit `styles.css`:**
```css
.greeting-section {
    margin-bottom: 30px;
    animation: fadeIn 1s ease-in 0.3s both;
}

.greeting {
    font-size: 1.8rem;
    font-weight: 300;
    opacity: 0.9;
}
```

**Edit `script.js` - Add greeting function:**
```javascript
function updateGreeting() {
    const hour = new Date().getHours();
    let greeting;

    if (hour < 12) {
        greeting = "Good morning! ☀️";
    } else if (hour < 18) {
        greeting = "Good afternoon! 🌤️";
    } else {
        greeting = "Good evening! 🌙";
    }

    document.getElementById('greeting').textContent = greeting;
}

// Call in init()
function init() {
    updateGreeting();
    updateTime();
    // ... rest of code
}
```

### Feature 2: Add Quick Links

**Edit `newtab.html` - Add before prs-section:**
```html
<div class="quick-links">
    <h2 class="section-title">Quick Links</h2>
    <div class="links-container">
        <a href="https://codingchallenges.fyi/" target="_blank" class="link-card">
            <span class="link-icon">🚀</span>
            <span class="link-text">Coding Challenges</span>
        </a>
        <a href="https://github.com/" target="_blank" class="link-card">
            <span class="link-icon">💻</span>
            <span class="link-text">GitHub</span>
        </a>
        <a href="https://stackoverflow.com/" target="_blank" class="link-card">
            <span class="link-icon">📚</span>
            <span class="link-text">Stack Overflow</span>
        </a>
    </div>
</div>
```

**Edit `styles.css`:**
```css
.quick-links {
    margin-bottom: 40px;
}

.links-container {
    display: flex;
    gap: 15px;
    justify-content: center;
    flex-wrap: wrap;
}

.link-card {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 15px 25px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 10px;
    text-decoration: none;
    color: white;
    transition: all 0.3s ease;
    border: 1px solid rgba(255, 255, 255, 0.2);
}

.link-card:hover {
    background: rgba(255, 255, 255, 0.2);
    transform: translateY(-3px);
}

.link-icon {
    font-size: 1.5rem;
}

.link-text {
    font-size: 1.1rem;
    font-weight: 500;
}
```

### Feature 3: Add Search Box

**Edit `newtab.html`:**
```html
<div class="search-section">
    <form id="search-form" class="search-form">
        <input
            type="text"
            id="search-input"
            class="search-input"
            placeholder="Search Google or enter URL..."
        >
        <button type="submit" class="search-button">🔍</button>
    </form>
</div>
```

**Edit `styles.css`:**
```css
.search-section {
    margin-bottom: 40px;
    animation: fadeIn 1s ease-in 0.2s both;
}

.search-form {
    display: flex;
    max-width: 600px;
    margin: 0 auto;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 25px;
    overflow: hidden;
    border: 1px solid rgba(255, 255, 255, 0.2);
}

.search-input {
    flex: 1;
    padding: 15px 20px;
    border: none;
    background: transparent;
    color: white;
    font-size: 1rem;
    outline: none;
}

.search-input::placeholder {
    color: rgba(255, 255, 255, 0.6);
}

.search-button {
    padding: 15px 20px;
    border: none;
    background: transparent;
    color: white;
    font-size: 1.2rem;
    cursor: pointer;
    transition: background 0.3s;
}

.search-button:hover {
    background: rgba(255, 255, 255, 0.1);
}
```

**Edit `script.js`:**
```javascript
function handleSearch(event) {
    event.preventDefault();
    const input = document.getElementById('search-input');
    const query = input.value.trim();

    if (!query) return;

    // Check if it's a URL
    const urlPattern = /^https?:\/\//;
    if (urlPattern.test(query)) {
        window.location.href = query;
    } else if (query.includes('.') && !query.includes(' ')) {
        // Likely a domain without protocol
        window.location.href = 'https://' + query;
    } else {
        // Search Google
        window.location.href = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
    }
}

function init() {
    // ... existing code ...

    // Add search handler
    const searchForm = document.getElementById('search-form');
    if (searchForm) {
        searchForm.addEventListener('submit', handleSearch);
    }
}
```

### Feature 4: Add Quote of the Day

**Edit `newtab.html`:**
```html
<div class="quote-section">
    <blockquote class="quote" id="quote">
        <p class="quote-text" id="quote-text">Loading...</p>
        <footer class="quote-author" id="quote-author"></footer>
    </blockquote>
</div>
```

**Edit `styles.css`:**
```css
.quote-section {
    margin-bottom: 40px;
    max-width: 700px;
    margin-left: auto;
    margin-right: auto;
}

.quote {
    background: rgba(255, 255, 255, 0.05);
    padding: 25px;
    border-radius: 10px;
    border-left: 4px solid rgba(255, 255, 255, 0.3);
}

.quote-text {
    font-size: 1.2rem;
    font-style: italic;
    margin-bottom: 10px;
    line-height: 1.6;
}

.quote-author {
    text-align: right;
    opacity: 0.8;
    font-size: 1rem;
}

.quote-author::before {
    content: "— ";
}
```

**Edit `script.js`:**
```javascript
async function fetchQuote() {
    try {
        const response = await fetch('https://api.quotable.io/random');
        const data = await response.json();

        document.getElementById('quote-text').textContent = `"${data.content}"`;
        document.getElementById('quote-author').textContent = data.author;
    } catch (error) {
        console.error('Error fetching quote:', error);
        document.getElementById('quote-text').textContent =
            '"The only way to do great work is to love what you do."';
        document.getElementById('quote-author').textContent = 'Steve Jobs';
    }
}

function init() {
    // ... existing code ...
    fetchQuote();
}
```

**Note**: You'll need to add permission in `manifest.json`:
```json
"host_permissions": [
    "https://api.github.com/*",
    "https://api.quotable.io/*"
]
```

## API Integration Examples

### Example 1: Weather Integration

**Add OpenWeatherMap API:**

```javascript
async function fetchWeather() {
    const apiKey = 'YOUR_API_KEY';  // Get from openweathermap.org
    const city = 'London';  // Or use geolocation

    try {
        const response = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`
        );
        const data = await response.json();

        const weatherHtml = `
            <div class="weather-widget">
                <div class="weather-icon">${getWeatherEmoji(data.weather[0].main)}</div>
                <div class="weather-temp">${Math.round(data.main.temp)}°C</div>
                <div class="weather-desc">${data.weather[0].description}</div>
                <div class="weather-location">${data.name}</div>
            </div>
        `;

        document.getElementById('weather-container').innerHTML = weatherHtml;
    } catch (error) {
        console.error('Weather fetch error:', error);
    }
}

function getWeatherEmoji(condition) {
    const emojiMap = {
        'Clear': '☀️',
        'Clouds': '☁️',
        'Rain': '🌧️',
        'Snow': '❄️',
        'Thunderstorm': '⛈️',
        'Drizzle': '🌦️',
        'Mist': '🌫️'
    };
    return emojiMap[condition] || '🌤️';
}
```

### Example 2: Cryptocurrency Prices

**Add crypto price tracking:**

```javascript
async function fetchCryptoPrices() {
    try {
        const response = await fetch(
            'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd'
        );
        const data = await response.json();

        const cryptoHtml = `
            <div class="crypto-widget">
                <div class="crypto-item">
                    <span class="crypto-name">₿ Bitcoin</span>
                    <span class="crypto-price">$${data.bitcoin.usd.toLocaleString()}</span>
                </div>
                <div class="crypto-item">
                    <span class="crypto-name">Ξ Ethereum</span>
                    <span class="crypto-price">$${data.ethereum.usd.toLocaleString()}</span>
                </div>
            </div>
        `;

        document.getElementById('crypto-container').innerHTML = cryptoHtml;
    } catch (error) {
        console.error('Crypto fetch error:', error);
    }
}
```

### Example 3: RSS Feed Integration

**Display blog posts from an RSS feed:**

```javascript
async function fetchRSSFeed() {
    // Using a CORS proxy for RSS feeds
    const rssUrl = 'https://codingchallenges.substack.com/feed';
    const proxyUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}`;

    try {
        const response = await fetch(proxyUrl);
        const data = await response.json();

        const feedHtml = data.items.slice(0, 5).map(item => `
            <div class="feed-item">
                <a href="${item.link}" target="_blank" class="feed-title">
                    ${item.title}
                </a>
                <div class="feed-date">
                    ${new Date(item.pubDate).toLocaleDateString()}
                </div>
            </div>
        `).join('');

        document.getElementById('feed-container').innerHTML = feedHtml;
    } catch (error) {
        console.error('RSS fetch error:', error);
    }
}
```

### Example 4: GitHub User Stats

**Display your GitHub profile stats:**

```javascript
async function fetchGitHubStats(username) {
    try {
        const response = await fetch(`https://api.github.com/users/${username}`);
        const data = await response.json();

        const statsHtml = `
            <div class="github-stats">
                <img src="${data.avatar_url}" alt="${data.login}" class="github-avatar">
                <div class="github-info">
                    <h3>${data.name || data.login}</h3>
                    <p>${data.bio || 'No bio available'}</p>
                    <div class="github-metrics">
                        <span>📦 ${data.public_repos} repos</span>
                        <span>👥 ${data.followers} followers</span>
                        <span>⭐ ${data.following} following</span>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('github-stats-container').innerHTML = statsHtml;
    } catch (error) {
        console.error('GitHub stats error:', error);
    }
}

// Usage
fetchGitHubStats('yourusername');
```

## Styling Modifications

### Example 1: Card-Based Layout

Transform the layout into cards:

```css
.container {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
    gap: 20px;
    padding: 40px;
}

.header,
.time-section,
.prs-section {
    background: rgba(255, 255, 255, 0.05);
    padding: 30px;
    border-radius: 15px;
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.1);
}
```

### Example 2: Glassmorphism Effect

Create a modern glass effect:

```css
.container {
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10px);
    border-radius: 20px;
    padding: 40px;
    border: 1px solid rgba(255, 255, 255, 0.2);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.pr-card {
    background: rgba(255, 255, 255, 0.05);
    backdrop-filter: blur(5px);
    border: 1px solid rgba(255, 255, 255, 0.1);
}
```

### Example 3: Animated Gradient Background

```css
body {
    background: linear-gradient(
        -45deg,
        #04295B,
        #1a3a5c,
        #2d4a6d,
        #405a7e
    );
    background-size: 400% 400%;
    animation: gradientShift 15s ease infinite;
}

@keyframes gradientShift {
    0% {
        background-position: 0% 50%;
    }
    50% {
        background-position: 100% 50%;
    }
    100% {
        background-position: 0% 50%;
    }
}
```

### Example 4: Dark Theme with Accent Colors

```css
:root {
    --bg-primary: #1a1a1a;
    --bg-secondary: #2d2d2d;
    --text-primary: #ffffff;
    --text-secondary: #b0b0b0;
    --accent: #00ff88;
}

body {
    background-color: var(--bg-primary);
    color: var(--text-primary);
}

.brand {
    color: var(--accent);
}

.pr-card {
    background: var(--bg-secondary);
    border-color: var(--accent);
}

.pr-card:hover {
    box-shadow: 0 0 20px rgba(0, 255, 136, 0.3);
}
```

### Example 5: Neon/Cyberpunk Theme

```css
body {
    background: #0a0a0a;
    color: #00ffff;
    font-family: 'Courier New', monospace;
}

.brand {
    color: #ff00ff;
    text-shadow:
        0 0 10px #ff00ff,
        0 0 20px #ff00ff,
        0 0 30px #ff00ff;
    animation: neonFlicker 3s infinite;
}

@keyframes neonFlicker {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.8; }
    55% { opacity: 1; }
    57% { opacity: 0.9; }
}

.time {
    color: #00ff00;
    text-shadow:
        0 0 5px #00ff00,
        0 0 10px #00ff00;
}

.pr-card {
    background: rgba(0, 255, 255, 0.05);
    border: 2px solid #00ffff;
    box-shadow: 0 0 10px rgba(0, 255, 255, 0.5);
}
```

## Advanced Customizations

### Customization 1: Local Storage for User Preferences

**Save user preferences:**

```javascript
// Save preferences
function savePreferences() {
    const prefs = {
        backgroundColor: '#04295B',
        refreshInterval: 300000,
        showGreeting: true,
        timeFormat: '24h'
    };

    chrome.storage.sync.set({ preferences: prefs }, () => {
        console.log('Preferences saved');
    });
}

// Load preferences
function loadPreferences() {
    chrome.storage.sync.get(['preferences'], (result) => {
        if (result.preferences) {
            applyPreferences(result.preferences);
        }
    });
}

// Apply preferences
function applyPreferences(prefs) {
    document.body.style.backgroundColor = prefs.backgroundColor;
    // Apply other preferences...
}

// Call in init()
function init() {
    loadPreferences();
    // ... rest of code
}
```

### Customization 2: Settings Panel

**Add a settings overlay:**

```html
<!-- Add to newtab.html -->
<button class="settings-button" id="settings-btn">⚙️</button>

<div class="settings-overlay" id="settings-overlay">
    <div class="settings-panel">
        <h2>Settings</h2>
        <label>
            Background Color:
            <input type="color" id="bg-color" value="#04295B">
        </label>
        <label>
            Refresh Interval (minutes):
            <input type="number" id="refresh-interval" min="1" max="60" value="5">
        </label>
        <button id="save-settings">Save</button>
        <button id="close-settings">Close</button>
    </div>
</div>
```

```javascript
// Settings functionality
function initSettings() {
    const settingsBtn = document.getElementById('settings-btn');
    const overlay = document.getElementById('settings-overlay');
    const closeBtn = document.getElementById('close-settings');
    const saveBtn = document.getElementById('save-settings');

    settingsBtn.addEventListener('click', () => {
        overlay.style.display = 'flex';
    });

    closeBtn.addEventListener('click', () => {
        overlay.style.display = 'none';
    });

    saveBtn.addEventListener('click', () => {
        const bgColor = document.getElementById('bg-color').value;
        const interval = document.getElementById('refresh-interval').value;

        chrome.storage.sync.set({
            backgroundColor: bgColor,
            refreshInterval: interval * 60000
        }, () => {
            applySettings();
            overlay.style.display = 'none';
        });
    });
}
```

### Customization 3: Keyboard Shortcuts

**Add keyboard shortcuts:**

```javascript
document.addEventListener('keydown', (event) => {
    // Ctrl/Cmd + K: Focus search
    if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
        event.preventDefault();
        document.getElementById('search-input')?.focus();
    }

    // Ctrl/Cmd + R: Refresh PRs
    if ((event.ctrlKey || event.metaKey) && event.key === 'r') {
        event.preventDefault();
        fetchPullRequests();
    }

    // Escape: Close settings
    if (event.key === 'Escape') {
        document.getElementById('settings-overlay').style.display = 'none';
    }
});
```

### Customization 4: Animations Toggle

**Allow disabling animations for better performance:**

```javascript
function toggleAnimations(enabled) {
    if (!enabled) {
        // Add class to disable animations
        document.body.classList.add('no-animations');
    } else {
        document.body.classList.remove('no-animations');
    }
}
```

```css
.no-animations * {
    animation: none !important;
    transition: none !important;
}
```

## Troubleshooting Common Issues

### Issue 1: PRs Not Loading

**Symptom**: "Failed to load pull requests" message

**Debugging steps:**

```javascript
// Add detailed error logging
async function fetchPullRequests() {
    try {
        console.log('Fetching PRs...');
        const response = await fetch(/* ... */);
        console.log('Response status:', response.status);
        console.log('Response headers:', response.headers);

        const data = await response.json();
        console.log('PR count:', data.length);
        console.log('First PR:', data[0]);

        // ... rest of code
    } catch (error) {
        console.error('Detailed error:', error);
        console.error('Error stack:', error.stack);
    }
}
```

**Common solutions:**
1. Check internet connection
2. Verify GitHub API is accessible
3. Check rate limiting (open browser console)
4. Ensure manifest.json has correct permissions

### Issue 2: Time Not Updating

**Symptom**: Clock frozen at one time

**Check:**

```javascript
// Verify setInterval is running
const intervalId = setInterval(updateTime, 1000);
console.log('Update interval ID:', intervalId);

// Test update function manually
updateTime();  // Should update immediately
```

**Solutions:**
1. Clear browser cache
2. Reload extension
3. Check for JavaScript errors in console

### Issue 3: Styling Not Applied

**Symptom**: Extension looks unstyled or broken

**Verify:**

```javascript
// Check if CSS loaded
const styles = document.styleSheets;
console.log('Loaded stylesheets:', styles.length);
for (let sheet of styles) {
    console.log('Sheet:', sheet.href);
}
```

**Solutions:**
1. Verify `styles.css` exists
2. Check `link` tag in HTML
3. Clear browser cache
4. Hard refresh (Ctrl+Shift+R)

## Real-World Use Cases

### Use Case 1: Developer Dashboard

Transform the extension into a complete developer dashboard:

**Features:**
- GitHub notifications
- Stack Overflow reputation
- Dev.to latest posts
- Current sprint tasks
- Code review queue
- CI/CD build status

**Implementation:**
```javascript
async function fetchDeveloperDashboard() {
    const [github, stackoverflow, devto] = await Promise.all([
        fetchGitHubNotifications(),
        fetchStackOverflowStats(),
        fetchDevToPosts()
    ]);

    renderDashboard({ github, stackoverflow, devto });
}
```

### Use Case 2: Learning Tracker

Track your coding challenge progress:

**Features:**
- Completed challenges checklist
- Current challenge timer
- Study goals
- Progress statistics
- Next challenge recommendation

### Use Case 3: Team Hub

Create a team-focused new tab:

**Features:**
- Team members' latest commits
- Open pull requests needing review
- Team calendar/meetings
- Shared resources/links
- Team announcements

### Use Case 4: Productivity Suite

Focus on productivity:

**Features:**
- Pomodoro timer
- Todo list
- Daily goals
- Time tracking
- Distraction blocker

**Pomodoro Implementation:**
```javascript
class PomodoroTimer {
    constructor() {
        this.duration = 25 * 60; // 25 minutes
        this.remaining = this.duration;
        this.isRunning = false;
    }

    start() {
        this.isRunning = true;
        this.interval = setInterval(() => {
            this.remaining--;
            this.render();

            if (this.remaining === 0) {
                this.complete();
            }
        }, 1000);
    }

    stop() {
        this.isRunning = false;
        clearInterval(this.interval);
    }

    reset() {
        this.stop();
        this.remaining = this.duration;
        this.render();
    }

    render() {
        const minutes = Math.floor(this.remaining / 60);
        const seconds = this.remaining % 60;
        document.getElementById('pomodoro-display').textContent =
            `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }

    complete() {
        this.stop();
        new Notification('Pomodoro Complete!', {
            body: 'Time for a break!',
            icon: 'icons/icon48.png'
        });
    }
}
```

---

## Summary

This document covered:
- ✅ Basic usage and interaction
- ✅ 20+ customization examples
- ✅ Adding 10+ new features
- ✅ 4 API integration examples
- ✅ 5 styling transformations
- ✅ Advanced customizations
- ✅ Troubleshooting guides
- ✅ Real-world use cases

For more information:
- See `implementation.md` for technical architecture
- See `api.md` for API reference
- See `../README.md` for installation

**Total Lines**: ~1,000+ lines of practical examples and guides
