const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');
const { v4: uuidv4 } = require('uuid');
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 3000;

// Create uploads directory
const uploadsDir = path.join(__dirname, '../public/uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|gif|webp|svg/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
});

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(express.static(path.join(__dirname, '../public')));

// Initialize SQLite database
const db = new Database(path.join(__dirname, 'notion.db'));

// Create tables with enhanced schema
db.exec(`
  -- Pages table
  CREATE TABLE IF NOT EXISTS pages (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT DEFAULT '',
    parent_id TEXT,
    position INTEGER DEFAULT 0,
    is_template INTEGER DEFAULT 0,
    icon TEXT,
    cover_image TEXT,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    FOREIGN KEY (parent_id) REFERENCES pages(id) ON DELETE CASCADE
  );

  -- Tags table
  CREATE TABLE IF NOT EXISTS tags (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    color TEXT DEFAULT '#808080',
    created_at INTEGER NOT NULL
  );

  -- Page tags junction table
  CREATE TABLE IF NOT EXISTS page_tags (
    page_id TEXT NOT NULL,
    tag_id TEXT NOT NULL,
    PRIMARY KEY (page_id, tag_id),
    FOREIGN KEY (page_id) REFERENCES pages(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
  );

  -- Page versions table
  CREATE TABLE IF NOT EXISTS page_versions (
    id TEXT PRIMARY KEY,
    page_id TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT DEFAULT '',
    created_at INTEGER NOT NULL,
    FOREIGN KEY (page_id) REFERENCES pages(id) ON DELETE CASCADE
  );

  -- User preferences table
  CREATE TABLE IF NOT EXISTS preferences (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );

  -- Indexes
  CREATE INDEX IF NOT EXISTS idx_parent_id ON pages(parent_id);
  CREATE INDEX IF NOT EXISTS idx_position ON pages(position);
  CREATE INDEX IF NOT EXISTS idx_is_template ON pages(is_template);
  CREATE INDEX IF NOT EXISTS idx_page_tags_page ON page_tags(page_id);
  CREATE INDEX IF NOT EXISTS idx_page_tags_tag ON page_tags(tag_id);
  CREATE INDEX IF NOT EXISTS idx_versions_page ON page_versions(page_id);
`);

// Initialize default preferences
const initPrefs = db.prepare('INSERT OR IGNORE INTO preferences (key, value) VALUES (?, ?)');
initPrefs.run('theme', 'light');

console.log('Database initialized with enhanced schema');

// ============ Pages API ============

// Get all pages with tags
app.get('/api/pages', (req, res) => {
  try {
    const { template, tag } = req.query;

    let query = 'SELECT * FROM pages';
    let params = [];

    if (template !== undefined) {
      query += ' WHERE is_template = ?';
      params.push(template === 'true' ? 1 : 0);
    }

    if (tag) {
      query = `
        SELECT DISTINCT p.* FROM pages p
        JOIN page_tags pt ON p.id = pt.page_id
        JOIN tags t ON pt.tag_id = t.id
        WHERE t.name = ?
      `;
      params = [tag];
    }

    query += ' ORDER BY position ASC, created_at ASC';

    const pages = db.prepare(query).all(...params);

    // Get tags for each page
    pages.forEach(page => {
      const tags = db.prepare(`
        SELECT t.* FROM tags t
        JOIN page_tags pt ON t.id = pt.tag_id
        WHERE pt.page_id = ?
      `).all(page.id);
      page.tags = tags;
    });

    res.json({ pages });
  } catch (error) {
    console.error('Error fetching pages:', error);
    res.status(500).json({ error: 'Failed to fetch pages' });
  }
});

// Get single page
app.get('/api/pages/:id', (req, res) => {
  try {
    const page = db.prepare('SELECT * FROM pages WHERE id = ?').get(req.params.id);

    if (!page) {
      return res.status(404).json({ error: 'Page not found' });
    }

    // Get tags
    const tags = db.prepare(`
      SELECT t.* FROM tags t
      JOIN page_tags pt ON t.id = pt.tag_id
      WHERE pt.page_id = ?
    `).all(page.id);
    page.tags = tags;

    res.json({ page });
  } catch (error) {
    console.error('Error fetching page:', error);
    res.status(500).json({ error: 'Failed to fetch page' });
  }
});

// Create new page
app.post('/api/pages', (req, res) => {
  try {
    const { title, content, parent_id, is_template, tags, icon, cover_image } = req.body;
    const id = uuidv4();
    const now = Date.now();

    // Get the highest position for the parent
    const maxPosition = db.prepare(
      'SELECT MAX(position) as max_pos FROM pages WHERE parent_id IS ?'
    ).get(parent_id || null);

    const position = (maxPosition.max_pos || -1) + 1;

    const stmt = db.prepare(`
      INSERT INTO pages (id, title, content, parent_id, position, is_template, icon, cover_image, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      title || 'Untitled',
      content || '',
      parent_id || null,
      position,
      is_template ? 1 : 0,
      icon || null,
      cover_image || null,
      now,
      now
    );

    // Add tags if provided
    if (tags && tags.length > 0) {
      const tagStmt = db.prepare('INSERT OR IGNORE INTO page_tags (page_id, tag_id) VALUES (?, ?)');
      tags.forEach(tagId => {
        tagStmt.run(id, tagId);
      });
    }

    const page = db.prepare('SELECT * FROM pages WHERE id = ?').get(id);
    page.tags = tags ? db.prepare(`
      SELECT t.* FROM tags t
      JOIN page_tags pt ON t.id = pt.tag_id
      WHERE pt.page_id = ?
    `).all(id) : [];

    res.status(201).json({ page });
  } catch (error) {
    console.error('Error creating page:', error);
    res.status(500).json({ error: 'Failed to create page' });
  }
});

// Update page
app.put('/api/pages/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, tags, icon, cover_image } = req.body;
    const now = Date.now();

    // Create version history before updating
    const currentPage = db.prepare('SELECT * FROM pages WHERE id = ?').get(id);
    if (currentPage && currentPage.content !== content) {
      const versionId = uuidv4();
      db.prepare(`
        INSERT INTO page_versions (id, page_id, title, content, created_at)
        VALUES (?, ?, ?, ?, ?)
      `).run(versionId, id, currentPage.title, currentPage.content, currentPage.updated_at);
    }

    const stmt = db.prepare(`
      UPDATE pages
      SET title = ?, content = ?, icon = ?, cover_image = ?, updated_at = ?
      WHERE id = ?
    `);

    const result = stmt.run(title, content, icon || null, cover_image || null, now, id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Page not found' });
    }

    // Update tags
    if (tags !== undefined) {
      db.prepare('DELETE FROM page_tags WHERE page_id = ?').run(id);
      if (tags.length > 0) {
        const tagStmt = db.prepare('INSERT INTO page_tags (page_id, tag_id) VALUES (?, ?)');
        tags.forEach(tagId => {
          tagStmt.run(id, tagId);
        });
      }
    }

    const page = db.prepare('SELECT * FROM pages WHERE id = ?').get(id);
    page.tags = db.prepare(`
      SELECT t.* FROM tags t
      JOIN page_tags pt ON t.id = pt.tag_id
      WHERE pt.page_id = ?
    `).all(id);

    res.json({ page });
  } catch (error) {
    console.error('Error updating page:', error);
    res.status(500).json({ error: 'Failed to update page' });
  }
});

// Delete page
app.delete('/api/pages/:id', (req, res) => {
  try {
    const { id } = req.params;

    // Also delete child pages
    const deleteChildren = (parentId) => {
      const children = db.prepare('SELECT id FROM pages WHERE parent_id = ?').all(parentId);
      children.forEach(child => deleteChildren(child.id));
      db.prepare('DELETE FROM pages WHERE id = ?').run(parentId);
    };

    deleteChildren(id);

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting page:', error);
    res.status(500).json({ error: 'Failed to delete page' });
  }
});

// Duplicate page
app.post('/api/pages/:id/duplicate', (req, res) => {
  try {
    const { id } = req.params;
    const originalPage = db.prepare('SELECT * FROM pages WHERE id = ?').get(id);

    if (!originalPage) {
      return res.status(404).json({ error: 'Page not found' });
    }

    const newId = uuidv4();
    const now = Date.now();

    // Generate new title
    let newTitle = originalPage.title;
    const copyMatch = newTitle.match(/^(.+?)\s*\((\d+)\)$/);

    if (copyMatch) {
      const baseName = copyMatch[1];
      const number = parseInt(copyMatch[2]) + 1;
      newTitle = `${baseName} (${number})`;
    } else {
      newTitle = `${newTitle} (1)`;
    }

    // Get position for new page
    const maxPosition = db.prepare(
      'SELECT MAX(position) as max_pos FROM pages WHERE parent_id IS ?'
    ).get(originalPage.parent_id || null);

    const position = (maxPosition.max_pos || -1) + 1;

    const stmt = db.prepare(`
      INSERT INTO pages (id, title, content, parent_id, position, is_template, icon, cover_image, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      newId,
      newTitle,
      originalPage.content,
      originalPage.parent_id,
      position,
      originalPage.is_template,
      originalPage.icon,
      originalPage.cover_image,
      now,
      now
    );

    // Copy tags
    const tags = db.prepare(`
      SELECT tag_id FROM page_tags WHERE page_id = ?
    `).all(id);

    const tagStmt = db.prepare('INSERT INTO page_tags (page_id, tag_id) VALUES (?, ?)');
    tags.forEach(tag => {
      tagStmt.run(newId, tag.tag_id);
    });

    const newPage = db.prepare('SELECT * FROM pages WHERE id = ?').get(newId);
    newPage.tags = db.prepare(`
      SELECT t.* FROM tags t
      JOIN page_tags pt ON t.id = pt.tag_id
      WHERE pt.page_id = ?
    `).all(newId);

    res.status(201).json({ page: newPage });
  } catch (error) {
    console.error('Error duplicating page:', error);
    res.status(500).json({ error: 'Failed to duplicate page' });
  }
});

// Move page
app.put('/api/pages/:id/move', (req, res) => {
  try {
    const { id } = req.params;
    const { parent_id, position } = req.body;
    const now = Date.now();

    const updatePage = db.transaction(() => {
      const page = db.prepare('SELECT * FROM pages WHERE id = ?').get(id);
      if (!page) throw new Error('Page not found');

      if (parent_id) {
        let checkParent = parent_id;
        while (checkParent) {
          if (checkParent === id) {
            throw new Error('Cannot move page under itself');
          }
          const parentPage = db.prepare('SELECT parent_id FROM pages WHERE id = ?').get(checkParent);
          checkParent = parentPage ? parentPage.parent_id : null;
        }
      }

      db.prepare(`
        UPDATE pages
        SET parent_id = ?, position = ?, updated_at = ?
        WHERE id = ?
      `).run(parent_id || null, position || 0, now, id);

      const siblings = db.prepare(`
        SELECT id, position FROM pages
        WHERE parent_id IS ? AND id != ?
        ORDER BY position ASC
      `).all(parent_id || null, id);

      siblings.forEach((sibling, index) => {
        const newPosition = index >= position ? index + 1 : index;
        db.prepare('UPDATE pages SET position = ? WHERE id = ?').run(newPosition, sibling.id);
      });
    });

    updatePage();

    const page = db.prepare('SELECT * FROM pages WHERE id = ?').get(id);
    res.json({ page });
  } catch (error) {
    console.error('Error moving page:', error);
    res.status(500).json({ error: error.message || 'Failed to move page' });
  }
});

// ============ Tags API ============

// Get all tags
app.get('/api/tags', (req, res) => {
  try {
    const tags = db.prepare('SELECT * FROM tags ORDER BY name ASC').all();
    res.json({ tags });
  } catch (error) {
    console.error('Error fetching tags:', error);
    res.status(500).json({ error: 'Failed to fetch tags' });
  }
});

// Create tag
app.post('/api/tags', (req, res) => {
  try {
    const { name, color } = req.body;
    const id = uuidv4();
    const now = Date.now();

    const stmt = db.prepare(`
      INSERT INTO tags (id, name, color, created_at)
      VALUES (?, ?, ?, ?)
    `);

    stmt.run(id, name, color || '#808080', now);

    const tag = db.prepare('SELECT * FROM tags WHERE id = ?').get(id);
    res.status(201).json({ tag });
  } catch (error) {
    console.error('Error creating tag:', error);
    res.status(500).json({ error: 'Failed to create tag' });
  }
});

// Delete tag
app.delete('/api/tags/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM tags WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting tag:', error);
    res.status(500).json({ error: 'Failed to delete tag' });
  }
});

// ============ Version History API ============

// Get page versions
app.get('/api/pages/:id/versions', (req, res) => {
  try {
    const versions = db.prepare(`
      SELECT * FROM page_versions
      WHERE page_id = ?
      ORDER BY created_at DESC
      LIMIT 20
    `).all(req.params.id);

    res.json({ versions });
  } catch (error) {
    console.error('Error fetching versions:', error);
    res.status(500).json({ error: 'Failed to fetch versions' });
  }
});

// Restore version
app.post('/api/pages/:id/restore/:versionId', (req, res) => {
  try {
    const { id, versionId } = req.params;
    const version = db.prepare('SELECT * FROM page_versions WHERE id = ?').get(versionId);

    if (!version || version.page_id !== id) {
      return res.status(404).json({ error: 'Version not found' });
    }

    const now = Date.now();
    db.prepare(`
      UPDATE pages
      SET title = ?, content = ?, updated_at = ?
      WHERE id = ?
    `).run(version.title, version.content, now, id);

    const page = db.prepare('SELECT * FROM pages WHERE id = ?').get(id);
    res.json({ page });
  } catch (error) {
    console.error('Error restoring version:', error);
    res.status(500).json({ error: 'Failed to restore version' });
  }
});

// ============ File Upload API ============

// Upload image
app.post('/api/upload', upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const imageUrl = `/uploads/${req.file.filename}`;
    res.json({ url: imageUrl });
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({ error: 'Failed to upload file' });
  }
});

// ============ Preferences API ============

// Get preferences
app.get('/api/preferences', (req, res) => {
  try {
    const prefs = db.prepare('SELECT * FROM preferences').all();
    const preferences = {};
    prefs.forEach(p => {
      preferences[p.key] = p.value;
    });
    res.json({ preferences });
  } catch (error) {
    console.error('Error fetching preferences:', error);
    res.status(500).json({ error: 'Failed to fetch preferences' });
  }
});

// Update preference
app.put('/api/preferences/:key', (req, res) => {
  try {
    const { key } = req.params;
    const { value } = req.body;

    db.prepare(`
      INSERT OR REPLACE INTO preferences (key, value)
      VALUES (?, ?)
    `).run(key, value);

    res.json({ success: true });
  } catch (error) {
    console.error('Error updating preference:', error);
    res.status(500).json({ error: 'Failed to update preference' });
  }
});

// ============ Export API ============

// Export page to Markdown
app.get('/api/pages/:id/export/markdown', (req, res) => {
  try {
    const page = db.prepare('SELECT * FROM pages WHERE id = ?').get(req.params.id);
    if (!page) {
      return res.status(404).json({ error: 'Page not found' });
    }

    // Convert HTML to Markdown (basic conversion)
    let markdown = page.content
      .replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n\n')
      .replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n\n')
      .replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n\n')
      .replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**')
      .replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*')
      .replace(/<code[^>]*>(.*?)<\/code>/gi, '`$1`')
      .replace(/<pre[^>]*><code[^>]*>(.*?)<\/code><\/pre>/gis, '```\n$1\n```\n')
      .replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '[$2]($1)')
      .replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1\n')
      .replace(/<ul[^>]*>|<\/ul>/gi, '\n')
      .replace(/<ol[^>]*>|<\/ol>/gi, '\n')
      .replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<[^>]+>/g, '')
      .trim();

    res.setHeader('Content-Type', 'text/markdown');
    res.setHeader('Content-Disposition', `attachment; filename="${page.title}.md"`);
    res.send(`# ${page.title}\n\n${markdown}`);
  } catch (error) {
    console.error('Error exporting to markdown:', error);
    res.status(500).json({ error: 'Failed to export to markdown' });
  }
});

// Export page to HTML
app.get('/api/pages/:id/export/html', (req, res) => {
  try {
    const page = db.prepare('SELECT * FROM pages WHERE id = ?').get(req.params.id);
    if (!page) {
      return res.status(404).json({ error: 'Page not found' });
    }

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${page.title}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, sans-serif;
      max-width: 800px;
      margin: 40px auto;
      padding: 20px;
      line-height: 1.6;
      color: #37352f;
    }
    h1 { font-size: 40px; font-weight: 700; margin-bottom: 20px; }
    h2 { font-size: 28px; font-weight: 600; margin-top: 24px; margin-bottom: 12px; }
    h3 { font-size: 22px; font-weight: 600; margin-top: 20px; margin-bottom: 10px; }
    p { margin-bottom: 12px; }
    code { background: #f1f1ef; padding: 2px 6px; border-radius: 3px; font-family: Monaco, monospace; }
    pre { background: #f1f1ef; padding: 16px; border-radius: 4px; overflow-x: auto; }
    pre code { background: none; padding: 0; }
    a { color: #2383e2; text-decoration: none; }
    a:hover { text-decoration: underline; }
  </style>
</head>
<body>
  <h1>${page.title}</h1>
  ${page.content}
  <hr style="margin-top: 40px; border: none; border-top: 1px solid #e9e9e7;">
  <p style="color: #787774; font-size: 14px;">
    Created: ${new Date(page.created_at).toLocaleDateString()}<br>
    Last updated: ${new Date(page.updated_at).toLocaleDateString()}
  </p>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Content-Disposition', `attachment; filename="${page.title}.html"`);
    res.send(html);
  } catch (error) {
    console.error('Error exporting to HTML:', error);
    res.status(500).json({ error: 'Failed to export to HTML' });
  }
});

// Serve index.html for all routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.listen(PORT, () => {
  console.log(`✓ Server running on http://localhost:${PORT}`);
  console.log(`  Database: ${path.join(__dirname, 'notion.db')}`);
  console.log(`  Uploads: ${uploadsDir}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down gracefully...');
  db.close();
  process.exit(0);
});
