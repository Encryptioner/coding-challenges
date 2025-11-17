# Notion Clone - Static Demo

This is a static demonstration version of the Notion clone that runs entirely in the browser using `localStorage` for data persistence. Perfect for GitHub Pages deployment!

## Features

### Core Functionality
- ✅ Rich text editing with Quill.js
- ✅ Hierarchical page organization
- ✅ Page creation, duplication, and deletion
- ✅ Drag-and-drop reordering
- ✅ Search functionality

### Enhanced Features
- ✅ **Dark Mode** - Toggle between light and dark themes
- ✅ **Tags System** - Create and manage tags with custom colors
- ✅ **Templates** - Save pages as reusable templates
- ✅ **Version History** - Automatic versioning with restore capability
- ✅ **Export** - Export pages to Markdown or HTML
- ✅ **Filtering** - Filter pages by templates or tags

## Differences from Full Version

| Feature | Full-Stack Version | Static Demo |
|---------|-------------------|-------------|
| Data Storage | SQLite Database | localStorage |
| Image Upload | Server uploads | Not available |
| API Endpoints | Express.js REST API | Client-side only |
| Deployment | Requires Node.js server | Static hosting (GitHub Pages) |
| Data Persistence | Server-side | Browser-only (per device) |

## How to Use

### Option 1: Open Locally
1. Open `index.html` in a modern web browser
2. Start creating pages and exploring features
3. Data persists in your browser's localStorage

### Option 2: Deploy to GitHub Pages
1. Copy the `/demo` folder contents to your GitHub Pages repository
2. Push to GitHub
3. Access via `https://your-username.github.io/project-name/`

### Option 3: Serve with Local Server
```bash
# Using Python 3
python3 -m http.server 8000

# Using Node.js
npx serve .

# Then open http://localhost:8000
```

## Data Storage

All data is stored in your browser's localStorage:
- **notion_pages** - All pages with content, titles, hierarchy
- **notion_tags** - Tag definitions with colors
- **notion_versions** - Page version history
- **notion_preferences** - User preferences (theme, etc.)

**Important**: Data is stored per browser and device. Clearing browser data will erase all pages.

## Browser Compatibility

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Opera 76+

Requires modern browser with:
- localStorage support
- ES6 JavaScript
- Quill.js and SortableJS (loaded from CDN)

## Sample Data

On first load, a welcome page is automatically created to help you get started. You can delete it and create your own pages.

## Limitations

Due to the static nature:
- No image upload functionality (requires server)
- No collaborative editing
- Data is not synced across devices
- Limited to browser storage capacity (~5-10MB depending on browser)

## Full Version

For the complete full-stack version with:
- Backend API server
- SQLite database
- Image upload support
- Persistent data storage

See the main project folder: `/69-notion/`

## Technologies Used

- **Quill.js** - Rich text editor
- **SortableJS** - Drag-and-drop functionality
- **Font Awesome** - Icons
- **localStorage** - Data persistence
- **Vanilla JavaScript** - No framework dependencies

## Development

To modify the demo:

1. **HTML**: Edit `index.html` for structure
2. **CSS**: Edit `styles.css` for styling (same as full version)
3. **JavaScript**: Edit `app-demo.js` for functionality

The static demo uses the same CSS as the full version but has a separate JavaScript file (`app-demo.js`) that replaces API calls with localStorage operations.

## Demo URL

When deployed to GitHub Pages, this demo can be accessed at:
`https://[username].github.io/coding-challenges/69-notion/`

## License

Part of the [CodingChallenges.fyi](https://codingchallenges.fyi/challenges/challenge-notion) project.
