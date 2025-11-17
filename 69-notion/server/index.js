const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const Database = require('better-sqlite3');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '../public')));

// Initialize SQLite database
const db = new Database(path.join(__dirname, 'notion.db'));

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS pages (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT DEFAULT '',
    parent_id TEXT,
    position INTEGER DEFAULT 0,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    FOREIGN KEY (parent_id) REFERENCES pages(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_parent_id ON pages(parent_id);
  CREATE INDEX IF NOT EXISTS idx_position ON pages(position);
`);

console.log('Database initialized');

// Get all pages
app.get('/api/pages', (req, res) => {
  try {
    const pages = db.prepare(`
      SELECT * FROM pages
      ORDER BY position ASC, created_at ASC
    `).all();

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

    res.json({ page });
  } catch (error) {
    console.error('Error fetching page:', error);
    res.status(500).json({ error: 'Failed to fetch page' });
  }
});

// Create new page
app.post('/api/pages', (req, res) => {
  try {
    const { title, content, parent_id } = req.body;
    const id = uuidv4();
    const now = Date.now();

    // Get the highest position for the parent
    const maxPosition = db.prepare(
      'SELECT MAX(position) as max_pos FROM pages WHERE parent_id IS ?'
    ).get(parent_id || null);

    const position = (maxPosition.max_pos || -1) + 1;

    const stmt = db.prepare(`
      INSERT INTO pages (id, title, content, parent_id, position, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(id, title || 'Untitled', content || '', parent_id || null, position, now, now);

    const page = db.prepare('SELECT * FROM pages WHERE id = ?').get(id);
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
    const { title, content } = req.body;
    const now = Date.now();

    const stmt = db.prepare(`
      UPDATE pages
      SET title = ?, content = ?, updated_at = ?
      WHERE id = ?
    `);

    const result = stmt.run(title, content, now, id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Page not found' });
    }

    const page = db.prepare('SELECT * FROM pages WHERE id = ?').get(id);
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
      INSERT INTO pages (id, title, content, parent_id, position, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      newId,
      newTitle,
      originalPage.content,
      originalPage.parent_id,
      position,
      now,
      now
    );

    const newPage = db.prepare('SELECT * FROM pages WHERE id = ?').get(newId);
    res.status(201).json({ page: newPage });
  } catch (error) {
    console.error('Error duplicating page:', error);
    res.status(500).json({ error: 'Failed to duplicate page' });
  }
});

// Move page (change parent or reorder)
app.put('/api/pages/:id/move', (req, res) => {
  try {
    const { id } = req.params;
    const { parent_id, position } = req.body;
    const now = Date.now();

    // Start transaction
    const updatePage = db.transaction(() => {
      // Get current page
      const page = db.prepare('SELECT * FROM pages WHERE id = ?').get(id);
      if (!page) throw new Error('Page not found');

      // Prevent circular reference
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

      // Update page
      db.prepare(`
        UPDATE pages
        SET parent_id = ?, position = ?, updated_at = ?
        WHERE id = ?
      `).run(parent_id || null, position || 0, now, id);

      // Reorder siblings
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

// Serve index.html for all routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.listen(PORT, () => {
  console.log(`✓ Server running on http://localhost:${PORT}`);
  console.log(`  Database: ${path.join(__dirname, 'notion.db')}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down gracefully...');
  db.close();
  process.exit(0);
});
