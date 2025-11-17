# Implementation Guide: Building a Notion Clone

This guide walks you through the complete implementation of a Notion-like workspace application, covering both the full-stack version with Node.js backend and the static demo version for GitHub Pages deployment.

## Table of Contents

1. [Project Architecture](#project-architecture)
2. [Backend Implementation](#backend-implementation)
3. [Frontend Implementation](#frontend-implementation)
4. [Enhanced Features](#enhanced-features)
5. [Static Demo Version](#static-demo-version)
6. [Design Decisions](#design-decisions)
7. [Code Organization](#code-organization)

---

## Project Architecture

### Overview

The Notion clone follows a client-server architecture with two distinct implementations:

```
┌─────────────────────────────────────────────┐
│         Full-Stack Architecture             │
├─────────────────────────────────────────────┤
│                                             │
│  ┌──────────────┐      ┌──────────────┐   │
│  │   Frontend   │◄────►│   Backend    │   │
│  │  (Vanilla JS)│      │  (Express)   │   │
│  └──────────────┘      └──────┬───────┘   │
│                                │           │
│                        ┌───────▼───────┐   │
│                        │    SQLite     │   │
│                        │   Database    │   │
│                        └───────────────┘   │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│         Static Demo Architecture            │
├─────────────────────────────────────────────┤
│                                             │
│  ┌──────────────┐      ┌──────────────┐   │
│  │   Frontend   │◄────►│ localStorage │   │
│  │  (Vanilla JS)│      │   (Browser)  │   │
│  └──────────────┘      └──────────────┘   │
│                                             │
└─────────────────────────────────────────────┘
```

### Technology Stack

**Backend (Full Version)**:
- **Express.js** - Web framework for REST API
- **better-sqlite3** - SQLite database driver
- **cors** - Cross-origin resource sharing
- **multer** - Multipart form data (image uploads)
- **uuid** - Unique ID generation

**Frontend (Both Versions)**:
- **Quill.js** - Rich text editor
- **SortableJS** - Drag-and-drop functionality
- **Font Awesome** - Icon library
- **Vanilla JavaScript** - No framework dependencies

**Storage**:
- **Full Version**: SQLite relational database
- **Static Demo**: Browser localStorage

---

## Backend Implementation

### 1. Database Schema Design

The database uses SQLite with a normalized schema to support all features:

#### Core Tables

**Pages Table**:
```sql
CREATE TABLE pages (
  id TEXT PRIMARY KEY,           -- UUID v4
  title TEXT NOT NULL,           -- Page title
  content TEXT DEFAULT '',       -- HTML content from Quill
  parent_id TEXT,                -- For hierarchical structure
  position INTEGER DEFAULT 0,    -- Order within parent
  created_at INTEGER NOT NULL,   -- Unix timestamp
  updated_at INTEGER NOT NULL,   -- Unix timestamp
  is_template BOOLEAN DEFAULT 0, -- Template flag
  icon TEXT,                     -- Emoji icon
  cover_image TEXT,              -- Cover image URL
  FOREIGN KEY (parent_id) REFERENCES pages(id) ON DELETE CASCADE
);
```

**Key Design Decisions**:
- **UUID for IDs**: Prevents ID collisions, better for distributed systems
- **TEXT for content**: Stores rich HTML from Quill editor
- **parent_id for hierarchy**: Self-referencing foreign key enables tree structure
- **position for ordering**: Integer field for drag-and-drop ordering
- **Timestamps as integers**: Unix timestamps for cross-platform compatibility
- **Cascading deletes**: Automatically delete child pages when parent is deleted

#### Enhancement Tables

**Tags Table**:
```sql
CREATE TABLE tags (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,     -- Tag name (must be unique)
  color TEXT DEFAULT '#808080',  -- Hex color code
  created_at INTEGER NOT NULL
);

CREATE INDEX idx_tags_name ON tags(name);
```

**Page-Tag Junction Table** (Many-to-Many Relationship):
```sql
CREATE TABLE page_tags (
  page_id TEXT NOT NULL,
  tag_id TEXT NOT NULL,
  PRIMARY KEY (page_id, tag_id),
  FOREIGN KEY (page_id) REFERENCES pages(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);
```

**Why Junction Table?**
- A page can have multiple tags
- A tag can be assigned to multiple pages
- Junction table enables efficient many-to-many queries

**Version History Table**:
```sql
CREATE TABLE page_versions (
  id TEXT PRIMARY KEY,
  page_id TEXT NOT NULL,         -- Reference to original page
  title TEXT NOT NULL,           -- Title at this version
  content TEXT DEFAULT '',       -- Content at this version
  created_at INTEGER NOT NULL,   -- When version was created
  FOREIGN KEY (page_id) REFERENCES pages(id) ON DELETE CASCADE
);

CREATE INDEX idx_versions_page ON page_versions(page_id);
CREATE INDEX idx_versions_created ON page_versions(created_at);
```

**Versioning Strategy**:
- Versions created automatically before updates
- Stores complete page state (title + content)
- Indexed by page_id for fast retrieval
- Cascading delete when page is removed

**Preferences Table** (Key-Value Store):
```sql
CREATE TABLE preferences (
  key TEXT PRIMARY KEY,          -- Preference name (e.g., "theme")
  value TEXT NOT NULL            -- Preference value (JSON string)
);
```

### 2. Express.js Server Setup

#### Server Initialization

```javascript
const express = require('express');
const Database = require('better-sqlite3');
const cors = require('cors');
const bodyParser = require('body-parser');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());                          // Enable CORS for frontend
app.use(bodyParser.json());               // Parse JSON bodies
app.use(express.static('public'));        // Serve static files
app.use('/uploads', express.static('uploads')); // Serve uploaded images

// Initialize database
const db = new Database('server/notion.db');
db.pragma('journal_mode = WAL');          // Write-Ahead Logging for performance
```

**Why These Choices?**
- **CORS enabled**: Frontend can call API from different port during development
- **body-parser**: Parses JSON request bodies into JavaScript objects
- **Static middleware**: Serves frontend files and uploaded images
- **WAL mode**: Improves concurrent read/write performance

#### Database Initialization Function

```javascript
function initializeDatabase() {
  // Create all tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS pages (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      content TEXT DEFAULT '',
      parent_id TEXT,
      position INTEGER DEFAULT 0,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      is_template BOOLEAN DEFAULT 0,
      icon TEXT,
      cover_image TEXT,
      FOREIGN KEY (parent_id) REFERENCES pages(id) ON DELETE CASCADE
    );

    -- Create indexes for common queries
    CREATE INDEX IF NOT EXISTS idx_pages_parent ON pages(parent_id);
    CREATE INDEX IF NOT EXISTS idx_pages_position ON pages(position);
    CREATE INDEX IF NOT EXISTS idx_pages_template ON pages(is_template);

    -- Additional tables...
  `);
}
```

**Index Strategy**:
- **idx_pages_parent**: Speed up hierarchy queries
- **idx_pages_position**: Speed up ordering queries
- **idx_pages_template**: Speed up template filtering

### 3. REST API Endpoints

#### GET /api/pages - List All Pages

```javascript
app.get('/api/pages', (req, res) => {
  try {
    // Support filtering by query parameters
    let query = 'SELECT * FROM pages';
    const params = [];
    const conditions = [];

    // Filter by template status
    if (req.query.template === 'true') {
      conditions.push('is_template = ?');
      params.push(1);
    }

    // Filter by tag
    if (req.query.tag) {
      conditions.push(`id IN (
        SELECT pt.page_id FROM page_tags pt
        JOIN tags t ON pt.tag_id = t.id
        WHERE t.name = ?
      )`);
      params.push(req.query.tag);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY position';

    const pages = db.prepare(query).all(...params);

    // Attach tags to each page
    pages.forEach(page => {
      page.tags = getPageTags(page.id);
    });

    res.json({ pages });
  } catch (error) {
    console.error('Error fetching pages:', error);
    res.status(500).json({ error: 'Failed to fetch pages' });
  }
});
```

**Learning Points**:
1. **Dynamic query building**: Conditionally add WHERE clauses based on query params
2. **Parameterized queries**: Use `?` placeholders to prevent SQL injection
3. **JOIN for filtering**: Use subquery with JOIN to filter by tag
4. **Data enrichment**: Attach related data (tags) to main entities
5. **Error handling**: Catch exceptions and return appropriate status codes

#### GET /api/pages/:id - Get Single Page

```javascript
app.get('/api/pages/:id', (req, res) => {
  try {
    const { id } = req.params;

    const page = db.prepare('SELECT * FROM pages WHERE id = ?').get(id);

    if (!page) {
      return res.status(404).json({ error: 'Page not found' });
    }

    // Attach tags
    page.tags = getPageTags(id);

    res.json({ page });
  } catch (error) {
    console.error('Error fetching page:', error);
    res.status(500).json({ error: 'Failed to fetch page' });
  }
});
```

**Helper Function** - Get Page Tags:
```javascript
function getPageTags(pageId) {
  return db.prepare(`
    SELECT t.* FROM tags t
    JOIN page_tags pt ON t.id = pt.tag_id
    WHERE pt.page_id = ?
  `).all(pageId);
}
```

#### POST /api/pages - Create New Page

```javascript
app.post('/api/pages', (req, res) => {
  try {
    const { title, content, parent_id } = req.body;

    const id = uuidv4();
    const now = Date.now();

    const stmt = db.prepare(`
      INSERT INTO pages (id, title, content, parent_id, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    stmt.run(id, title || 'Untitled', content || '', parent_id || null, now, now);

    const page = db.prepare('SELECT * FROM pages WHERE id = ?').get(id);
    page.tags = [];

    res.json({ page });
  } catch (error) {
    console.error('Error creating page:', error);
    res.status(500).json({ error: 'Failed to create page' });
  }
});
```

**Key Concepts**:
- **UUID generation**: `uuidv4()` creates unique IDs
- **Timestamp**: `Date.now()` returns milliseconds since epoch
- **Default values**: Use `||` operator for fallbacks
- **Return created entity**: Fetch and return the newly created page

#### PUT /api/pages/:id - Update Page

```javascript
app.put('/api/pages/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, tags, is_template } = req.body;

    // Get current page for version history
    const currentPage = db.prepare('SELECT * FROM pages WHERE id = ?').get(id);

    if (!currentPage) {
      return res.status(404).json({ error: 'Page not found' });
    }

    // Save version if content changed
    if (currentPage.content !== content) {
      const versionId = uuidv4();
      db.prepare(`
        INSERT INTO page_versions (id, page_id, title, content, created_at)
        VALUES (?, ?, ?, ?, ?)
      `).run(versionId, id, currentPage.title, currentPage.content, currentPage.updated_at);
    }

    // Update page
    const now = Date.now();
    const stmt = db.prepare(`
      UPDATE pages
      SET title = ?, content = ?, updated_at = ?, is_template = ?
      WHERE id = ?
    `);

    stmt.run(
      title ?? currentPage.title,
      content ?? currentPage.content,
      now,
      is_template ?? currentPage.is_template,
      id
    );

    // Update tags if provided
    if (tags !== undefined) {
      updatePageTags(id, tags);
    }

    const page = db.prepare('SELECT * FROM pages WHERE id = ?').get(id);
    page.tags = getPageTags(id);

    res.json({ page });
  } catch (error) {
    console.error('Error updating page:', error);
    res.status(500).json({ error: 'Failed to update page' });
  }
});
```

**Advanced Concepts**:
1. **Automatic versioning**: Create version before update if content changed
2. **Nullish coalescing**: Use `??` to only override if value provided
3. **Conditional updates**: Only update tags if explicitly provided
4. **Transaction safety**: Each statement is atomic in better-sqlite3

#### Helper Function - Update Page Tags:
```javascript
function updatePageTags(pageId, tagIds) {
  // Remove all existing tags
  db.prepare('DELETE FROM page_tags WHERE page_id = ?').run(pageId);

  // Add new tags
  if (tagIds && tagIds.length > 0) {
    const stmt = db.prepare('INSERT INTO page_tags (page_id, tag_id) VALUES (?, ?)');

    for (const tagId of tagIds) {
      stmt.run(pageId, tagId);
    }
  }
}
```

**Pattern**: Delete-then-insert for many-to-many updates

#### DELETE /api/pages/:id - Delete Page

```javascript
app.delete('/api/pages/:id', (req, res) => {
  try {
    const { id } = req.params;

    const page = db.prepare('SELECT * FROM pages WHERE id = ?').get(id);

    if (!page) {
      return res.status(404).json({ error: 'Page not found' });
    }

    // Delete page (cascades to children, tags, versions)
    db.prepare('DELETE FROM pages WHERE id = ?').run(id);

    res.json({ message: 'Page deleted', id });
  } catch (error) {
    console.error('Error deleting page:', error);
    res.status(500).json({ error: 'Failed to delete page' });
  }
});
```

**Cascade Behavior**:
- Child pages automatically deleted (ON DELETE CASCADE)
- Tag assignments removed
- Version history removed

#### POST /api/pages/:id/duplicate - Duplicate Page

```javascript
app.post('/api/pages/:id/duplicate', (req, res) => {
  try {
    const { id } = req.params;

    const original = db.prepare('SELECT * FROM pages WHERE id = ?').get(id);

    if (!original) {
      return res.status(404).json({ error: 'Page not found' });
    }

    const newId = uuidv4();
    const now = Date.now();

    // Create duplicate with new ID
    const stmt = db.prepare(`
      INSERT INTO pages (
        id, title, content, parent_id, position,
        created_at, updated_at, is_template, icon, cover_image
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      newId,
      original.title + ' (Copy)',
      original.content,
      original.parent_id,
      original.position + 1,
      now,
      now,
      original.is_template,
      original.icon,
      original.cover_image
    );

    // Copy tags
    const originalTags = getPageTags(id);
    const tagIds = originalTags.map(t => t.id);
    updatePageTags(newId, tagIds);

    const page = db.prepare('SELECT * FROM pages WHERE id = ?').get(newId);
    page.tags = getPageTags(newId);

    res.json({ page });
  } catch (error) {
    console.error('Error duplicating page:', error);
    res.status(500).json({ error: 'Failed to duplicate page' });
  }
});
```

**Duplication Strategy**:
1. Copy all fields except ID and timestamps
2. Append "(Copy)" to title
3. Place after original (position + 1)
4. Copy tag associations
5. Don't copy version history (fresh start)

### 4. Image Upload Implementation

#### Multer Configuration

```javascript
const fs = require('fs');

// Create uploads directory
const uploadsDir = 'uploads';
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// Configure multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

// File filter for images only
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP allowed.'), false);
  }
};

// Create upload middleware
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024  // 10MB limit
  }
});
```

#### Upload Endpoint

```javascript
app.post('/api/upload', upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const url = `/uploads/${req.file.filename}`;

    res.json({
      url,
      filename: req.file.filename,
      size: req.file.size,
      mimetype: req.file.mimetype
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({ error: 'Failed to upload file' });
  }
});

// Error handling middleware for multer
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large. Maximum size is 10MB.' });
    }
  }
  next(error);
});
```

**Security Considerations**:
- **File type validation**: Only allow image types
- **Size limits**: Prevent excessive uploads
- **Unique filenames**: Prevent overwrites with UUID
- **Extension preservation**: Keep original file extension

### 5. Export Endpoints

#### Export to Markdown

```javascript
app.get('/api/pages/:id/export/markdown', (req, res) => {
  try {
    const { id } = req.params;
    const page = db.prepare('SELECT * FROM pages WHERE id = ?').get(id);

    if (!page) {
      return res.status(404).json({ error: 'Page not found' });
    }

    // Convert HTML to Markdown
    let markdown = `# ${page.title}\n\n`;

    markdown += page.content
      .replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n\n')
      .replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n\n')
      .replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n\n')
      .replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n')
      .replace(/<strong>(.*?)<\/strong>/gi, '**$1**')
      .replace(/<em>(.*?)<\/em>/gi, '*$1*')
      .replace(/<u>(.*?)<\/u>/gi, '_$1_')
      .replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '[$2]($1)')
      .replace(/<img[^>]*src="([^"]*)"[^>]*>/gi, '![]($1)')
      .replace(/<ul>(.*?)<\/ul>/gis, (match, content) => {
        return content.replace(/<li>(.*?)<\/li>/gi, '- $1\n');
      })
      .replace(/<ol>(.*?)<\/ol>/gis, (match, content) => {
        let counter = 1;
        return content.replace(/<li>(.*?)<\/li>/gi, () => `${counter++}. $1\n`);
      })
      .replace(/<code>(.*?)<\/code>/gi, '`$1`')
      .replace(/<pre><code>(.*?)<\/code><\/pre>/gis, '```\n$1\n```')
      .replace(/<blockquote>(.*?)<\/blockquote>/gi, '> $1\n')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<[^>]+>/g, '');  // Remove remaining HTML tags

    res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${page.title}.md"`);
    res.send(markdown);
  } catch (error) {
    console.error('Error exporting markdown:', error);
    res.status(500).json({ error: 'Failed to export markdown' });
  }
});
```

**HTML to Markdown Conversion**:
1. Use regex to match HTML patterns
2. Replace with Markdown equivalents
3. Handle nested lists with counters
4. Preserve code blocks and links
5. Strip remaining HTML tags

#### Export to HTML

```javascript
app.get('/api/pages/:id/export/html', (req, res) => {
  try {
    const { id } = req.params;
    const page = db.prepare('SELECT * FROM pages WHERE id = ?').get(id);

    if (!page) {
      return res.status(404).json({ error: 'Page not found' });
    }

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${page.title}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      max-width: 800px;
      margin: 50px auto;
      padding: 20px;
      line-height: 1.6;
    }
    h1 { font-size: 2em; margin-bottom: 0.5em; }
    h2 { font-size: 1.5em; margin-top: 1em; }
    h3 { font-size: 1.25em; margin-top: 1em; }
    code { background: #f4f4f4; padding: 2px 6px; border-radius: 3px; }
    pre { background: #f4f4f4; padding: 15px; border-radius: 5px; overflow-x: auto; }
    blockquote { border-left: 3px solid #ccc; margin-left: 0; padding-left: 20px; color: #666; }
  </style>
</head>
<body>
  <h1>${page.title}</h1>
  ${page.content}
  <hr>
  <p><small>Exported from Notion Clone on ${new Date().toLocaleString()}</small></p>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${page.title}.html"`);
    res.send(html);
  } catch (error) {
    console.error('Error exporting HTML:', error);
    res.status(500).json({ error: 'Failed to export HTML' });
  }
});
```

**Export Features**:
- Standalone HTML document
- Embedded CSS for styling
- Timestamp footer
- Proper charset and viewport meta tags

---

## Frontend Implementation

### 1. Application State Management

```javascript
// Global state
let pages = [];              // All pages from API
let currentPage = null;      // Currently displayed page
let quill = null;            // Quill editor instance
let saveTimeout = null;      // Debounce timer for auto-save
let selectedMoveParent = null; // Selected parent for move operation
let allTags = [];            // All available tags
let currentFilter = 'all';   // Current filter mode
let currentTagFilter = null; // Current tag filter
```

**State Management Pattern**:
- Simple global variables (no framework)
- Centralized state for easy debugging
- Clear naming conventions

### 2. Quill Editor Integration

```javascript
function initializeEditor() {
  const toolbarOptions = [
    [{ 'header': [1, 2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    ['blockquote', 'code-block'],
    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
    ['link', 'image'],
    ['clean']
  ];

  quill = new Quill('#editor', {
    theme: 'snow',
    placeholder: 'Start writing...',
    modules: {
      toolbar: toolbarOptions
    }
  });

  // Custom image handler
  quill.getModule('toolbar').addHandler('image', handleImageUpload);

  // Auto-save on content change
  quill.on('text-change', () => {
    if (currentPage) {
      debouncedSave();
    }
  });
}
```

**Quill Configuration**:
- **Theme**: Snow (clean, modern look)
- **Toolbar**: Headings, formatting, lists, links, images
- **Custom handlers**: Override image button for upload
- **Event listeners**: React to content changes

#### Image Upload Handler

```javascript
function handleImageUpload() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';

  input.onchange = async () => {
    const file = input.files[0];
    if (!file) return;

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      showToast('Image must be less than 10MB', 'error');
      return;
    }

    const formData = new FormData();
    formData.append('image', file);

    try {
      showLoading(true);
      const response = await fetch(`${API_URL}/upload`, {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (data.url) {
        // Insert image into editor at cursor position
        const range = quill.getSelection(true);
        quill.insertEmbed(range.index, 'image', `http://localhost:3000${data.url}`);
        quill.setSelection(range.index + 1);
        showToast('Image uploaded', 'success');
      }

      showLoading(false);
    } catch (error) {
      console.error('Error uploading image:', error);
      showToast('Failed to upload image', 'error');
      showLoading(false);
    }
  };

  input.click();
}
```

**Upload Flow**:
1. Create hidden file input
2. Validate file size before upload
3. Create FormData with file
4. POST to upload endpoint
5. Insert image URL into editor at cursor
6. Show success/error feedback

### 3. Auto-Save with Debouncing

```javascript
function debouncedSave() {
  clearTimeout(saveTimeout);
  saveTimeout = setTimeout(savePage, 1000);
}

async function savePage() {
  if (!currentPage) return;

  try {
    const content = quill.root.innerHTML;
    const title = document.getElementById('pageTitle').value;

    await fetch(`${API_URL}/pages/${currentPage.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, content })
    });

    currentPage.title = title;
    currentPage.content = content;
    currentPage.updated_at = Date.now();

    updatePageInSidebar(currentPage);
    updateLastEdited();
  } catch (error) {
    console.error('Error saving page:', error);
    showToast('Failed to save page', 'error');
  }
}
```

**Debouncing Explained**:
- **Problem**: Saving on every keystroke is inefficient
- **Solution**: Wait for 1 second of inactivity
- **Implementation**: Clear previous timer, set new one
- **Result**: Save only after user stops typing

### 4. Hierarchical Page Rendering

```javascript
function renderPagesList() {
  const container = document.getElementById('pagesList');

  if (pages.length === 0) {
    container.innerHTML = `<div class="empty-state">No pages yet</div>`;
    return;
  }

  // Build hierarchical structure
  const rootPages = pages.filter(p => !p.parent_id);
  const pageMap = {};

  // Create page map with children arrays
  pages.forEach(p => {
    pageMap[p.id] = { ...p, children: [] };
  });

  // Build parent-child relationships
  pages.forEach(p => {
    if (p.parent_id && pageMap[p.parent_id]) {
      pageMap[p.parent_id].children.push(pageMap[p.id]);
    }
  });

  // Sort by position
  const sortByPosition = (a, b) => a.position - b.position;
  rootPages.sort(sortByPosition);
  Object.values(pageMap).forEach(p => p.children.sort(sortByPosition));

  // Render recursively
  container.innerHTML = '';
  rootPages.forEach(page => {
    container.appendChild(createPageElement(pageMap[page.id]));
  });

  initDragAndDrop();
}
```

**Hierarchy Algorithm**:
1. Filter root pages (no parent)
2. Create map of all pages
3. Add children arrays to each page
4. Link children to parents
5. Sort at each level by position
6. Render recursively

#### Recursive Page Element Creation

```javascript
function createPageElement(page, level = 0) {
  const div = document.createElement('div');
  div.className = 'page-group';
  div.dataset.pageId = page.id;

  const hasChildren = page.children && page.children.length > 0;
  const indent = 10 + level * 24; // Indent 24px per level

  div.innerHTML = `
    <div class="page-item ${currentPage?.id === page.id ? 'active' : ''}"
         data-page-id="${page.id}"
         draggable="true"
         style="padding-left: ${indent}px">
      ${hasChildren ?
        `<span class="page-toggle"><i class="fas fa-chevron-down"></i></span>` :
        '<span class="page-toggle"></span>'}
      <span class="page-icon"><i class="fas fa-file-alt"></i></span>
      <span class="page-title-text">${escapeHtml(page.title)}</span>
    </div>
    ${hasChildren ?
      `<div class="page-children">
        ${page.children.map(child =>
          createPageElement(child, level + 1).outerHTML
        ).join('')}
      </div>` : ''}
  `;

  // Attach event listeners
  const pageItem = div.querySelector('.page-item');
  pageItem.addEventListener('click', () => loadPage(page.id));

  if (hasChildren) {
    const toggle = div.querySelector('.page-toggle');
    toggle.addEventListener('click', (e) => {
      e.stopPropagation();
      const children = div.querySelector('.page-children');
      children.classList.toggle('collapsed');
      toggle.classList.toggle('collapsed');
    });
  }

  return div;
}
```

**Recursive Rendering**:
- Base case: Leaf pages (no children)
- Recursive case: Render children at level + 1
- Indentation increases with depth
- Toggle button for expandable pages

### 5. Drag-and-Drop with SortableJS

```javascript
function initDragAndDrop() {
  const pagesList = document.getElementById('pagesList');

  new Sortable(pagesList, {
    animation: 150,
    handle: '.page-item',
    draggable: '.page-group',
    ghostClass: 'dragging',
    onEnd: async function(evt) {
      const pageId = evt.item.dataset.pageId;
      const newPosition = evt.newIndex;

      try {
        await fetch(`${API_URL}/pages/${pageId}/move`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            parent_id: null,
            position: newPosition
          })
        });

        await loadPages();
      } catch (error) {
        console.error('Error reordering page:', error);
        showToast('Failed to reorder page', 'error');
        loadPages(); // Reload to reset
      }
    }
  });
}
```

**SortableJS Configuration**:
- **animation**: Smooth 150ms animation
- **handle**: Only drag by `.page-item`
- **draggable**: Apply to `.page-group` elements
- **ghostClass**: Style for dragging element
- **onEnd**: Update backend on drop

---

## Enhanced Features

### 1. Dark Mode Implementation

#### Theme Application

```javascript
function applyTheme(theme) {
  document.body.setAttribute('data-theme', theme);
  const icon = document.getElementById('themeIcon');
  const text = document.getElementById('themeText');

  if (theme === 'dark') {
    icon.className = 'fas fa-sun theme-toggle-icon';
    text.textContent = 'Light Mode';
  } else {
    icon.className = 'fas fa-moon theme-toggle-icon';
    text.textContent = 'Dark Mode';
  }
}
```

#### CSS Variables for Theming

```css
:root {
  --bg-primary: #ffffff;
  --bg-secondary: #f7f7f7;
  --bg-hover: #f0f0f0;
  --text-primary: #333333;
  --text-secondary: #666666;
  --border-color: #e0e0e0;
}

[data-theme="dark"] {
  --bg-primary: #191919;
  --bg-secondary: #252525;
  --bg-hover: #2f2f2f;
  --text-primary: #e6e6e6;
  --text-secondary: #9b9b9b;
  --border-color: #3a3a3a;
}

body {
  background-color: var(--bg-primary);
  color: var(--text-primary);
}
```

**Benefits of CSS Variables**:
- Single source of truth for colors
- Automatic cascade to all elements
- Easy to add new themes
- No JavaScript color manipulation

### 2. Tags System

#### Tag Modal UI

```html
<div id="tagModal" class="modal">
  <div class="modal-content">
    <div class="modal-header">
      <h3>Manage Tags</h3>
      <button id="closeTagModal" class="close-btn">×</button>
    </div>
    <div class="modal-body">
      <!-- Tag list (dynamically generated) -->
      <div id="tagList" class="tag-list"></div>

      <!-- Create new tag form -->
      <div class="tag-create">
        <h4>Create New Tag</h4>
        <input type="text" id="newTagName" placeholder="Tag name">
        <input type="color" id="newTagColor" value="#808080">
        <button id="btnCreateTag">Create Tag</button>
      </div>
    </div>
  </div>
</div>
```

#### Tag Management Functions

```javascript
async function createTag() {
  const nameInput = document.getElementById('newTagName');
  const colorInput = document.getElementById('newTagColor');
  const name = nameInput.value.trim();
  const color = colorInput.value;

  if (!name) {
    showToast('Tag name is required', 'error');
    return;
  }

  try {
    const response = await fetch(`${API_URL}/tags`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, color })
    });

    const data = await response.json();
    allTags.push(data.tag);
    renderTagList();
    nameInput.value = '';
    colorInput.value = '#808080';
    showToast('Tag created', 'success');
  } catch (error) {
    showToast('Failed to create tag', 'error');
  }
}
```

#### Tag Assignment

```javascript
async function togglePageTag(tagId) {
  if (!currentPage) return;

  const currentTags = currentPage.tags || [];
  const isAssigned = currentTags.some(t => t.id === tagId);

  let newTags;
  if (isAssigned) {
    newTags = currentTags.filter(t => t.id !== tagId).map(t => t.id);
  } else {
    newTags = [...currentTags.map(t => t.id), tagId];
  }

  try {
    const response = await fetch(`${API_URL}/pages/${currentPage.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: currentPage.title,
        content: currentPage.content,
        tags: newTags
      })
    });

    const data = await response.json();
    currentPage = data.page;
    renderTagList();
    renderPageTags();
    showToast(isAssigned ? 'Tag removed' : 'Tag added', 'success');
  } catch (error) {
    showToast('Failed to update tags', 'error');
  }
}
```

### 3. Version History

#### Version Display

```javascript
async function showVersionsModal() {
  if (!currentPage) return;

  const modal = document.getElementById('versionsModal');
  const listContainer = document.getElementById('versionList');

  try {
    const response = await fetch(`${API_URL}/pages/${currentPage.id}/versions`);
    const data = await response.json();
    const versions = data.versions;

    if (versions.length === 0) {
      listContainer.innerHTML = '<p>No previous versions</p>';
    } else {
      listContainer.innerHTML = versions.map(version => {
        const date = new Date(version.created_at);
        return `
          <div class="version-item">
            <div class="version-info">
              <div class="version-title">${escapeHtml(version.title)}</div>
              <div class="version-date">${date.toLocaleString()}</div>
            </div>
            <button class="btn-secondary"
                    onclick="restoreVersion('${version.id}')">
              <i class="fas fa-undo"></i> Restore
            </button>
          </div>
        `;
      }).join('');
    }

    modal.classList.add('show');
  } catch (error) {
    showToast('Failed to load version history', 'error');
  }
}
```

#### Version Restoration

```javascript
async function restoreVersion(versionId) {
  if (!currentPage) return;

  if (!confirm('Restore this version? Current changes will be saved.')) {
    return;
  }

  try {
    const response = await fetch(
      `${API_URL}/pages/${currentPage.id}/restore/${versionId}`,
      { method: 'POST' }
    );

    const data = await response.json();
    currentPage = data.page;

    // Update UI
    document.getElementById('pageTitle').value = currentPage.title;
    quill.root.innerHTML = currentPage.content || '';

    hideVersionsModal();
    showToast('Version restored', 'success');
  } catch (error) {
    showToast('Failed to restore version', 'error');
  }
}
```

---

## Static Demo Version

### Key Differences from Full Version

| Aspect | Full Version | Static Demo |
|--------|-------------|-------------|
| **Data Storage** | SQLite Database | localStorage |
| **API Calls** | fetch() to Express | Direct localStorage access |
| **Image Upload** | POST to /upload | Not supported |
| **Versioning** | Database table | localStorage array |
| **Tags** | Junction table | Embedded in pages |

### LocalStorage Implementation

#### Data Structure

```javascript
// localStorage keys:
{
  "notion_pages": [
    {
      id: "page_...",
      title: "...",
      content: "...",
      tags: [...],           // Embedded tags (not just IDs)
      is_template: false,
      parent_id: null,
      position: 0,
      created_at: 1234567890,
      updated_at: 1234567890
    }
  ],
  "notion_tags": [
    { id: "tag_...", name: "...", color: "#..." }
  ],
  "notion_versions": [
    { id: "ver_...", page_id: "...", title: "...", content: "..." }
  ],
  "notion_preferences": {
    theme: "light"
  }
}
```

#### Sample Functions

```javascript
function loadPages() {
  const stored = localStorage.getItem('notion_pages');
  let allPages = stored ? JSON.parse(stored) : [];

  // Apply filters
  if (currentFilter === 'templates') {
    pages = allPages.filter(p => p.is_template);
  } else if (currentFilter === 'tag' && currentTagFilter) {
    pages = allPages.filter(p => {
      return p.tags && p.tags.some(t => t.name === currentTagFilter);
    });
  } else {
    pages = allPages;
  }

  renderPagesList();
  renderTemplatesList(allPages);

  if (pages.length > 0 && !currentPage) {
    loadPage(pages[0].id);
  } else if (pages.length === 0) {
    showWelcomeScreen();
  }
}

function savePage() {
  if (!currentPage) return;

  // Update current page
  currentPage.title = document.getElementById('pageTitle').value;
  currentPage.content = quill.root.innerHTML;
  currentPage.updated_at = Date.now();

  // Save version
  saveVersion(currentPage.id, currentPage.title, currentPage.content);

  // Update in storage
  const stored = localStorage.getItem('notion_pages');
  const allPages = stored ? JSON.parse(stored) : [];
  const index = allPages.findIndex(p => p.id === currentPage.id);

  if (index !== -1) {
    allPages[index] = currentPage;
    localStorage.setItem('notion_pages', JSON.stringify(allPages));
  }

  updatePageInSidebar(currentPage);
  updateLastEdited();
}
```

---

## Design Decisions

### 1. Why Vanilla JavaScript?

**Advantages**:
- No build step required
- Smaller bundle size
- Direct browser APIs
- Easier to understand for learners
- No framework lock-in

**Trade-offs**:
- More manual DOM manipulation
- No reactive state updates
- More verbose code

### 2. Why SQLite over PostgreSQL/MySQL?

**Advantages**:
- Zero configuration
- Serverless (file-based)
- Perfect for small-to-medium apps
- Fast for local development
- Easy backup (single file)

**Trade-offs**:
- Limited concurrency
- No network access
- Fewer advanced features

### 3. Why better-sqlite3 over node-sqlite3?

**Advantages**:
- Synchronous API (simpler code)
- Faster performance
- No callback hell
- Better error handling

**Trade-offs**:
- Blocks event loop (use worker threads for heavy queries)

### 4. Why UUID over Auto-increment IDs?

**Advantages**:
- Globally unique
- Can generate client-side
- No ID prediction
- Easier merging

**Trade-offs**:
- Larger index size
- Slightly slower lookups
- Harder to remember

---

## Code Organization Best Practices

### 1. Separation of Concerns

```
Backend:
- Database logic (schema, queries)
- API endpoints (routes, controllers)
- Business logic (versioning, tagging)
- File handling (uploads)

Frontend:
- State management
- UI rendering
- Event handling
- API communication
```

### 2. Error Handling Pattern

```javascript
// Backend
app.post('/api/pages', (req, res) => {
  try {
    // ... operation
    res.json({ page });
  } catch (error) {
    console.error('Error creating page:', error);
    res.status(500).json({ error: 'Failed to create page' });
  }
});

// Frontend
async function createPage() {
  try {
    const response = await fetch(`${API_URL}/pages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'New Page' })
    });

    if (!response.ok) {
      throw new Error('Failed to create page');
    }

    const data = await response.json();
    pages.push(data.page);
    renderPagesList();
    showToast('Page created', 'success');
  } catch (error) {
    console.error(error);
    showToast('Failed to create page', 'error');
  }
}
```

### 3. Function Naming Conventions

```javascript
// CRUD operations
createPage()
loadPage()
updatePage()
deletePage()

// UI operations
renderPagesList()
showModal()
hideModal()
toggleSidebar()

// Helper functions
escapeHtml()
formatDate()
getPageTags()
updatePageTags()
```

### 4. Comment Standards

```javascript
// High-level comments for complex logic
// Build hierarchical structure from flat array
const pageMap = {};

// Inline comments for non-obvious code
position: original.position + 1,  // Place after original

// JSDoc for public functions
/**
 * Creates a version snapshot before updating a page
 * @param {string} pageId - The page ID
 * @param {string} title - Page title at this version
 * @param {string} content - Page content at this version
 */
function saveVersion(pageId, title, content) {
  // ...
}
```

---

## Summary

This implementation guide covered:

1. **Backend Architecture**: Express.js with SQLite database
2. **Database Design**: Normalized schema with proper relationships
3. **REST API**: Complete CRUD operations with filtering and search
4. **Frontend**: Vanilla JavaScript with Quill editor and SortableJS
5. **Enhanced Features**: Dark mode, tags, versions, exports
6. **Static Demo**: localStorage-based version for GitHub Pages
7. **Design Decisions**: Trade-offs and best practices

**Next Steps**:
- Read `examples.md` for practical usage scenarios
- Read `architecture.md` for system design deep dive
- Explore the codebase with this guide as reference

**Key Takeaways**:
- Start simple, add complexity gradually
- Normalize database schema for flexibility
- Use debouncing for performance
- Handle errors gracefully
- Keep code organized and well-commented
