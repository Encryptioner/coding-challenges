# Notion Clone

A simplified version of Notion - an all-in-one workspace for notes, documents, and knowledge management. Built as part of the [CodingChallenges.fyi](https://codingchallenges.fyi/challenges/challenge-notion) challenge series.

## Features

### Core Functionality

- **Rich Text Editor** - Write and format content with a powerful editor
  - Headings (H1, H2, H3)
  - Text formatting (bold, italic, underline, strikethrough)
  - Lists (bulleted and numbered)
  - Code blocks and inline code
  - Blockquotes
  - Links

- **Page Management** - Create, edit, and organize pages
  - Create new blank pages
  - Auto-save changes
  - Delete pages (with confirmation)
  - Real-time updates

- **Navigation Sidebar** - Easy navigation between pages
  - List all pages
  - Search pages by name
  - Highlight current page
  - Collapsible sidebar

- **Page Duplication** (Step 5) - Copy pages for templates
  - Duplicate any page with content
  - Automatic naming (adds "(1)", "(2)", etc.)
  - Maintains page hierarchy

- **Page Organization** (Step 6) - Organize pages hierarchically
  - Drag and drop to reorder pages
  - Nest pages under other pages (parent-child relationships)
  - Collapsible page groups
  - Move pages via modal dialog

- **Persistence** - All data saved to SQLite database
  - Automatic database initialization
  - Cascading deletes for child pages
  - Position tracking for page ordering

## Project Structure

```
69-notion/
├── server/
│   ├── index.js          # Express API server
│   └── notion.db         # SQLite database (created on first run)
├── public/
│   ├── index.html        # Main HTML
│   ├── styles.css        # Notion-like styling
│   └── app.js            # Frontend application logic
├── docs/
│   └── ...               # Additional documentation
├── package.json
└── README.md
```

## Installation

### Prerequisites

- Node.js >= 14.0.0
- npm or yarn

### Setup

1. **Clone or navigate to the project:**
   ```bash
   cd 69-notion
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the server:**
   ```bash
   npm start
   ```

4. **Open your browser:**
   ```
   http://localhost:3000
   ```

## Usage

### Creating Pages

1. Click the **"New Page"** button in the sidebar
2. Or click **"Create a Page"** on the welcome screen
3. A new untitled page will be created and opened

### Editing Pages

1. Click on any page in the sidebar to open it
2. Click on the title to rename the page
3. Use the rich text editor to write content
4. Changes are saved automatically

### Organizing Pages

**Drag and Drop:**
- Click and drag any page in the sidebar
- Drop it in a new position
- Pages will reorder automatically

**Move to Parent:**
1. Click the **"Move"** button on the current page
2. Select a parent page from the list
3. Or select "Top Level" for no parent
4. Click **"Move"** to confirm

### Duplicating Pages

1. Open the page you want to duplicate
2. Click the **"Duplicate"** button
3. A copy will be created with "(1)" appended to the name
4. The duplicate will include all content

### Deleting Pages

1. Open the page you want to delete
2. Click the **"Delete"** button
3. Confirm the deletion
4. **Note:** Deleting a page also deletes all its child pages

### Searching Pages

- Use the search box at the top of the sidebar
- Type to filter pages by name
- Search is case-insensitive

## API Endpoints

The backend provides a RESTful API:

### Get All Pages
```
GET /api/pages
```

### Get Single Page
```
GET /api/pages/:id
```

### Create Page
```
POST /api/pages
Body: { title, content, parent_id }
```

### Update Page
```
PUT /api/pages/:id
Body: { title, content }
```

### Delete Page
```
DELETE /api/pages/:id
```

### Duplicate Page
```
POST /api/pages/:id/duplicate
```

### Move Page
```
PUT /api/pages/:id/move
Body: { parent_id, position }
```

## Technology Stack

### Backend
- **Express.js** - Web server framework
- **better-sqlite3** - SQLite database driver
- **cors** - Cross-origin resource sharing
- **body-parser** - Request body parsing
- **uuid** - Unique ID generation

### Frontend
- **Quill.js** - Rich text WYSIWYG editor
- **SortableJS** - Drag and drop functionality
- **Font Awesome** - Icons
- **Vanilla JavaScript** - No framework, pure JS

### Database
- **SQLite** - Lightweight, file-based database
  - Tables: `pages`
  - Columns: `id`, `title`, `content`, `parent_id`, `position`, `created_at`, `updated_at`

## Database Schema

```sql
CREATE TABLE pages (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT DEFAULT '',
  parent_id TEXT,
  position INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (parent_id) REFERENCES pages(id) ON DELETE CASCADE
);
```

## Development

### Run in Development Mode

With auto-restart on file changes:

```bash
npm run dev
```

### Project Scripts

- `npm start` - Start the server
- `npm run dev` - Start with nodemon (auto-restart)

## Features by Challenge Step

### ✓ Step 1: Basic Editor
- Quill.js rich text editor
- Text formatting (bold, italic, underline, strike)
- Headings (H1, H2, H3)
- Lists (ordered and unordered)
- Code blocks and inline code
- Links

### ✓ Step 2: Page Management
- Create new pages
- Edit existing pages
- Delete pages
- View all pages
- Auto-save functionality

### ✓ Step 3: Persistence
- SQLite database
- Pages saved automatically
- Data persists across sessions
- Cascading deletes

### ✓ Step 4: Navigation Sidebar
- List all created pages
- Click to navigate
- Current page highlighted
- New page button
- Search functionality

### ✓ Step 5: Page Duplication
- Duplicate button on each page
- Copies page content
- Smart naming (adds "(1)", "(2)", etc.)
- Maintains parent relationship

### ✓ Step 6: Page Reorganization
- Hierarchical page structure
- Parent-child relationships
- Drag and drop reordering
- Move dialog for changing parents
- Collapsible page groups
- Circular reference prevention

### ⚠ Step 7: AI Integration (Not Implemented)
AI text generation with Ollama is not included in this implementation but could be added as a future enhancement.

## Architecture

### Client-Server Architecture

```
┌─────────────────────────────────────┐
│         Frontend (Browser)           │
│  ┌──────────┐     ┌──────────┐      │
│  │ Quill.js │     │  App.js  │      │
│  │  Editor  │◄────┤  Logic   │      │
│  └──────────┘     └─────┬────┘      │
│                         │            │
└─────────────────────────┼────────────┘
                          │ HTTP/REST
                          │
┌─────────────────────────▼────────────┐
│       Backend (Node.js)              │
│  ┌──────────┐     ┌──────────┐      │
│  │ Express  │────►│  SQLite  │      │
│  │   API    │     │ Database │      │
│  └──────────┘     └──────────┘      │
└──────────────────────────────────────┘
```

### Data Flow

1. **Page Load:**
   - Frontend requests pages from API
   - API queries SQLite database
   - Pages rendered in sidebar

2. **Page Edit:**
   - User types in editor
   - Debounced auto-save (1 second delay)
   - API updates database
   - UI updates local state

3. **Page Organization:**
   - User drags page in sidebar
   - Frontend sends move request to API
   - API updates position/parent
   - Pages list reloaded and re-rendered

## Security Considerations

⚠️ **This is a learning project and lacks production-ready security:**

- No authentication/authorization
- No input validation/sanitization
- No rate limiting
- No CSRF protection
- No SQL injection protection (using prepared statements helps but not complete)

**For production use, add:**
- User authentication (JWT, sessions)
- Input validation and sanitization
- SQL injection prevention
- XSS protection
- CORS configuration
- Rate limiting
- HTTPS/TLS

## Performance

### Optimizations Included

- **Debounced Auto-save** - Reduces API calls (1-second delay)
- **SQLite Indexes** - Fast queries on `parent_id` and `position`
- **Lazy Loading** - Pages loaded on demand
- **Efficient Re-renders** - Only update affected DOM elements

### Scalability Considerations

For larger datasets:
- Add pagination to page list
- Implement virtual scrolling
- Add database caching (Redis)
- Consider PostgreSQL for multi-user scenarios

## Troubleshooting

### Port Already in Use

If port 3000 is busy:

```bash
# Change port in server/index.js
const PORT = process.env.PORT || 8080;

# Or set environment variable
PORT=8080 npm start
```

### Database Locked

If you see "database is locked" errors:
- Close other connections to the database
- Restart the server
- Delete `server/notion.db` and restart (data will be lost)

### Pages Not Loading

1. Check browser console for errors
2. Verify server is running on http://localhost:3000
3. Check CORS settings if running on different port
4. Clear browser cache

### Drag and Drop Not Working

- Ensure SortableJS is loaded
- Check browser console for JavaScript errors
- Verify pages have correct `data-page-id` attributes

## Future Enhancements

### Potential Features

1. **AI Integration** (Step 7)
   - Integrate Ollama for text generation
   - AI writing assistant
   - Smart completions

2. **Real-time Collaboration**
   - WebSocket for multi-user editing
   - Operational transformation or CRDT
   - User presence indicators

3. **Rich Blocks**
   - Tables and databases
   - Image uploads
   - Embeds (YouTube, Twitter, etc.)
   - Toggle lists
   - Calendars

4. **Export/Import**
   - Export to PDF
   - Export to Markdown
   - Export to HTML
   - Import from Markdown

5. **Mobile/Desktop Apps**
   - Electron desktop app
   - React Native mobile app
   - Offline support

6. **Advanced Features**
   - Templates
   - Tags and properties
   - Full-text search
   - Version history
   - Comments
   - Dark mode

## Contributing

This is an educational project. Feel free to fork and extend it!

## License

MIT License - Educational purposes

## References

- [CodingChallenges.fyi - Notion Challenge](https://codingchallenges.fyi/challenges/challenge-notion)
- [Notion](https://www.notion.so/)
- [Quill.js](https://quilljs.com/)
- [SortableJS](https://sortablejs.github.io/Sortable/)
- [better-sqlite3](https://github.com/WiseLibs/better-sqlite3)
- [Express.js](https://expressjs.com/)

## Author

Built as part of the 94 coding challenges from [CodingChallenges.fyi](https://codingchallenges.fyi/).
