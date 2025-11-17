# Practical Examples: Using the Notion Clone

This guide provides practical, real-world examples of using both the full-stack and static demo versions of the Notion clone. Each example includes step-by-step instructions, code samples, and expected outcomes.

## Table of Contents

1. [Getting Started Examples](#getting-started-examples)
2. [Page Management Examples](#page-management-examples)
3. [Organizing Content](#organizing-content)
4. [Using Tags Effectively](#using-tags-effectively)
5. [Working with Templates](#working-with-templates)
6. [Version History](#version-history)
7. [Export and Sharing](#export-and-sharing)
8. [API Usage Examples](#api-usage-examples)
9. [Advanced Workflows](#advanced-workflows)

---

## Getting Started Examples

### Example 1: Setting Up Your First Workspace

**Scenario**: You're setting up a personal knowledge base.

**Steps**:

1. **Start the server** (Full version):
   ```bash
   cd 69-notion
   npm install
   npm start
   ```

   Or **Open the demo** (Static version):
   ```bash
   cd 69-notion/demo
   python3 -m http.server 8000
   # Open http://localhost:8000
   ```

2. **Create your first page**:
   - Click "New Page" button
   - Title appears as "Untitled"
   - Start typing to create content

3. **Add formatting**:
   ```
   # My Knowledge Base

   Welcome to my personal workspace!

   ## Categories
   - **Projects** - Active and archived projects
   - **Notes** - Daily notes and ideas
   - **Resources** - Links and references
   ```

4. **Expected result**:
   - Page created with formatted content
   - Auto-saved to database/localStorage
   - Appears in sidebar

---

## Page Management Examples

### Example 2: Creating a Project Documentation Structure

**Scenario**: Document a software project with multiple components.

**Structure to create**:
```
📁 MyApp Project
├── 📄 Overview
├── 📄 Architecture
├── 📁 Frontend
│   ├── 📄 Components
│   ├── 📄 State Management
│   └── 📄 Styling
├── 📁 Backend
│   ├── 📄 API Endpoints
│   ├── 📄 Database Schema
│   └── 📄 Authentication
└── 📄 Deployment
```

**Implementation**:

1. **Create root page**:
   - Click "New Page"
   - Title: "MyApp Project"
   - Content:
     ```markdown
     # MyApp Project

     A full-stack application for [purpose].

     **Status**: In Development
     **Team**: 3 developers
     **Timeline**: Q2 2024
     ```

2. **Create child pages**:
   - Create "Overview" page
   - Click "Move" button
   - Select "MyApp Project" as parent
   - Repeat for other pages

3. **Alternative method** (Faster):
   - Create all pages at root level first
   - Use drag-and-drop to nest under "MyApp Project"

4. **Result verification**:
   - MyApp Project shows arrow icon
   - Click arrow to expand/collapse
   - Nested pages indented in sidebar

### Example 3: Quick Page Duplication

**Scenario**: Create weekly standup note templates.

**Steps**:

1. **Create template page**:
   ```markdown
   # Weekly Standup - [DATE]

   ## What I Did This Week
   -

   ## What I'm Working On Next
   -

   ## Blockers
   - None

   ## Goals for Next Week
   -
   ```

2. **Duplicate for each week**:
   - Open the template
   - Click "Duplicate" button
   - Rename to "Weekly Standup - Jan 15, 2024"
   - Fill in your updates

3. **Automate with template feature**:
   - Click "Save as Template" on original
   - Each week, find in Templates section
   - Click to create new instance

**Expected outcome**:
- Original remains unchanged
- New copy has "(Copy)" suffix
- Can rename and edit freely

---

## Organizing Content

### Example 4: Building a Study Notes System

**Scenario**: Organize study materials for multiple courses.

**Hierarchical structure**:

```
📚 Computer Science Degree
├── 📕 CS101 - Intro to Programming
│   ├── Week 1: Variables & Types
│   ├── Week 2: Control Flow
│   └── Week 3: Functions
├── 📗 CS201 - Data Structures
│   ├── Week 1: Arrays & Lists
│   ├── Week 2: Stacks & Queues
│   └── Week 3: Trees & Graphs
└── 📘 CS301 - Algorithms
    ├── Week 1: Sorting
    ├── Week 2: Searching
    └── Week 3: Dynamic Programming
```

**Creating the structure**:

```javascript
// Using API to bulk create (for full version)
const courses = [
  { title: 'CS101 - Intro to Programming', weeks: 3 },
  { title: 'CS201 - Data Structures', weeks: 3 },
  { title: 'CS301 - Algorithms', weeks: 3 }
];

async function createStudyStructure() {
  // Create root page
  const root = await fetch('http://localhost:3000/api/pages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: 'Computer Science Degree',
      content: '<h1>My CS Journey</h1><p>Notes from my degree program.</p>'
    })
  }).then(r => r.json());

  // Create course pages
  for (const course of courses) {
    const coursePage = await fetch('http://localhost:3000/api/pages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: course.title,
        content: `<h1>${course.title}</h1>`,
        parent_id: root.page.id
      })
    }).then(r => r.json());

    // Create week pages
    for (let week = 1; week <= course.weeks; week++) {
      await fetch('http://localhost:3000/api/pages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `Week ${week}`,
          content: `<h2>Week ${week} Notes</h2><p>Topics covered:</p><ul><li></li></ul>`,
          parent_id: coursePage.page.id
        })
      });
    }
  }
}
```

### Example 5: Drag-and-Drop Reorganization

**Scenario**: Restructure project after requirements change.

**Original**:
```
Project A
├── Design
└── Development

Project B
├── Research
└── Planning
```

**New structure** (merge projects):
```
Combined Project
├── Research (from B)
├── Planning (from B)
├── Design (from A)
└── Development (from A)
```

**Steps using UI**:
1. Create "Combined Project" page
2. Drag "Research" from Project B to Combined Project
3. Drag "Planning" from Project B to Combined Project
4. Drag "Design" from Project A to Combined Project
5. Drag "Development" from Project A to Combined Project
6. Delete empty Project A and Project B

**Using Move Modal**:
1. Open "Research" page
2. Click "Move" button
3. Select "Combined Project" from list
4. Click "Move"
5. Repeat for other pages

---

## Using Tags Effectively

### Example 6: Project Status Tagging System

**Scenario**: Track status of multiple projects.

**Tag setup**:

```javascript
// Create status tags
const statusTags = [
  { name: 'In Progress', color: '#FFA500' },  // Orange
  { name: 'Completed', color: '#00FF00' },    // Green
  { name: 'Blocked', color: '#FF0000' },      // Red
  { name: 'On Hold', color: '#808080' }       // Gray
];

// Create via UI or API
for (const tag of statusTags) {
  await fetch('http://localhost:3000/api/tags', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(tag)
  });
}
```

**Using tags**:

1. **Assign to page**:
   - Open project page
   - Click "+ Add Tag"
   - Select "In Progress"
   - Tag pill appears below title

2. **Update status**:
   - Click tag pill's X to remove
   - Add new "Completed" tag
   - Visual indicator changes

3. **Filter by tag**:
   - Click filter dropdown
   - Select "Filter by Tag"
   - Choose "In Progress"
   - View only in-progress projects

### Example 7: Multi-Dimensional Tagging

**Scenario**: Organize notes with multiple categorizations.

**Tag categories**:
- **Type**: Meeting, Note, Idea, Task
- **Priority**: High, Medium, Low
- **Department**: Engineering, Marketing, Sales
- **Status**: Todo, In Progress, Done

**Example page** ("Q1 Planning Meeting"):
- Tags: [Meeting, High, Engineering, Done]

**Filtering workflow**:
```
1. Filter by "Engineering" → Shows all engineering content
2. Filter by "High" → Shows all high-priority items
3. Filter by "Meeting" → Shows all meetings
4. Combined: High-priority engineering meetings
```

**Creating smart views**:
- Save common filters as template pages
- Use tags instead of folders for flexible organization

### Example 8: Tag Color Coding System

**Scenario**: Visual priority system.

**Color scheme**:
```javascript
const priorityColors = {
  'P0 - Critical': '#FF0000',  // Red
  'P1 - High': '#FFA500',      // Orange
  'P2 - Medium': '#FFFF00',    // Yellow
  'P3 - Low': '#00FF00',       // Green
  'P4 - Nice to Have': '#0000FF' // Blue
};
```

**Usage**:
1. Create tags with descriptive names
2. Use color picker for consistent colors
3. Tags visually stand out in page list
4. Quick priority assessment at a glance

---

## Working with Templates

### Example 9: Meeting Notes Template

**Scenario**: Standardize meeting documentation.

**Template creation**:

```markdown
# [MEETING TYPE] - [DATE]

**Attendees**:
-

**Agenda**:
1.

**Discussion Points**:

### Topic 1
-

**Decisions Made**:
- [ ] Decision 1
- [ ] Decision 2

**Action Items**:
- [ ] @Person - Task description - Due: [DATE]

**Next Meeting**: [DATE]
```

**Steps**:
1. Create page with above content
2. Click "Save as Template"
3. Verify in Templates section
4. For each meeting:
   - Find in Templates
   - Click to duplicate
   - Fill in brackets
   - Archive when done

### Example 10: Daily Standup Template

**Template**:
```markdown
# Daily Standup - [DATE]

## Yesterday
- Completed:
- Started:

## Today
- Plan to complete:
- Plan to start:

## Blockers
- None / [Describe blocker]

## Notes
-
```

**Automation idea** (using API):
```javascript
async function createDailyStandup() {
  const today = new Date().toLocaleDateString();

  const content = `
    <h1>Daily Standup - ${today}</h1>
    <h2>Yesterday</h2>
    <ul><li>Completed: </li><li>Started: </li></ul>
    <h2>Today</h2>
    <ul><li>Plan to complete: </li><li>Plan to start: </li></ul>
    <h2>Blockers</h2>
    <p>None</p>
  `;

  await fetch('http://localhost:3000/api/pages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: `Daily Standup - ${today}`,
      content,
      parent_id: standupFolderId
    })
  });
}
```

### Example 11: Project Kickoff Template

**Comprehensive template**:

```markdown
# Project: [NAME]

## Overview
**Description**:
**Goal**:
**Timeline**: [START] - [END]

## Team
- **PM**:
- **Engineering**:
- **Design**:

## Scope
### In Scope
-
### Out of Scope
-

## Success Metrics
1.
2.

## Milestones
- [ ] Milestone 1 - [DATE]
- [ ] Milestone 2 - [DATE]

## Resources
- Design Doc:
- Technical Spec:
- Project Board:

## Risks
| Risk | Impact | Mitigation |
|------|--------|------------|
|      |        |            |
```

**Usage workflow**:
1. Save as template
2. Tag with "Project Template"
3. For new projects:
   - Duplicate from template
   - Fill in all sections
   - Link to related docs
   - Track in main projects page

---

## Version History

### Example 12: Recovering Lost Content

**Scenario**: Accidentally deleted important section.

**Steps**:

1. **Realize content is missing**:
   - Notice paragraph deleted
   - Can't undo (already saved)

2. **Open version history**:
   - Click "Versions" button
   - View list of previous versions
   - Sorted by date (newest first)

3. **Find correct version**:
   - Look at timestamps
   - "2 hours ago" had the content
   - Click "Restore" button

4. **Confirm restoration**:
   - Popup: "Restore this version?"
   - Current state saved as new version
   - Click "Restore"

5. **Result**:
   - Page reverts to selected version
   - Lost content recovered
   - Current work saved in history

### Example 13: Comparing Changes Over Time

**Scenario**: Track how a design doc evolved.

**Workflow**:

1. **Initial version** (Monday):
   ```markdown
   # Feature Design

   ## Proposal
   Add user authentication
   ```

2. **Updated version** (Wednesday):
   ```markdown
   # Feature Design - User Auth

   ## Proposal
   Implement OAuth 2.0 with Google and GitHub providers

   ## Technical Approach
   - Use Passport.js
   - Store sessions in Redis
   ```

3. **Final version** (Friday):
   ```markdown
   # Feature Design - User Authentication

   ## Approved Proposal
   Implement OAuth 2.0 with Google, GitHub, and Microsoft providers

   ## Technical Approach
   - Use Passport.js middleware
   - Store sessions in Redis with 24h expiry
   - Implement refresh tokens

   ## Security Considerations
   - HTTPS only
   - CSRF protection
   - Rate limiting
   ```

4. **View history**:
   - 3 versions in history
   - Click each to see evolution
   - Restore to any point if needed

---

## Export and Sharing

### Example 14: Exporting Documentation to Markdown

**Scenario**: Share documentation on GitHub.

**Steps**:

1. **Prepare page**:
   - Clean up formatting
   - Verify all links work
   - Check code blocks

2. **Export to Markdown**:
   - Click "Export" dropdown
   - Select "Export as Markdown"
   - File downloads: `Documentation.md`

3. **Review export**:
   ```markdown
   # Documentation

   ## Getting Started

   Run these commands:
   ```
   npm install
   npm start
   ```

   ## API Reference

   - **GET /api/users** - List users
   - **POST /api/users** - Create user
   ```

4. **Use in GitHub**:
   - Copy to repository
   - Push to GitHub
   - Renders in browser

### Example 15: Creating Standalone HTML Reports

**Scenario**: Share report with stakeholders without Notion access.

**Steps**:

1. **Create comprehensive report**:
   ```markdown
   # Q1 2024 Progress Report

   ## Executive Summary
   Completed 95% of planned features...

   ## Key Metrics
   - Revenue: $1.2M (+15%)
   - Users: 50K (+20%)

   ## Challenges & Solutions
   ...
   ```

2. **Export to HTML**:
   - Click "Export" → "Export as HTML"
   - Downloads: `Q1-2024-Progress-Report.html`

3. **HTML file includes**:
   - All formatting
   - Embedded styles
   - Self-contained (no external dependencies)
   - Export timestamp footer

4. **Share**:
   - Email as attachment
   - Upload to company drive
   - Works in any browser
   - Print to PDF if needed

---

## API Usage Examples

### Example 16: Bulk Page Creation Script

**Scenario**: Import 100 pages from CSV.

**CSV format**:
```csv
title,content,parent_id
"Introduction","<p>Welcome!</p>",
"Chapter 1","<h1>Getting Started</h1>",page_id_intro
"Chapter 2","<h1>Advanced Topics</h1>",page_id_intro
```

**Import script**:
```javascript
const fs = require('fs');
const csv = require('csv-parser');
const fetch = require('node-fetch');

const API_URL = 'http://localhost:3000/api';

async function importFromCSV(filename) {
  const pages = [];

  // Read CSV
  fs.createReadStream(filename)
    .pipe(csv())
    .on('data', (row) => {
      pages.push(row);
    })
    .on('end', async () => {
      console.log(`Importing ${pages.length} pages...`);

      for (const page of pages) {
        const response = await fetch(`${API_URL}/pages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: page.title,
            content: page.content,
            parent_id: page.parent_id || null
          })
        });

        const data = await response.json();
        console.log(`Created: ${data.page.title}`);

        // Rate limit to avoid overwhelming server
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      console.log('Import complete!');
    });
}

importFromCSV('pages.csv');
```

### Example 17: Search and Replace Across Pages

**Scenario**: Update company name across all documentation.

**Script**:
```javascript
async function searchAndReplace(searchTerm, replaceTerm) {
  // Get all pages
  const response = await fetch(`${API_URL}/pages`);
  const { pages } = await response.json();

  let updatedCount = 0;

  for (const page of pages) {
    if (page.content.includes(searchTerm)) {
      const newContent = page.content.replace(
        new RegExp(searchTerm, 'g'),
        replaceTerm
      );

      await fetch(`${API_URL}/pages/${page.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: page.title,
          content: newContent
        })
      });

      updatedCount++;
      console.log(`Updated: ${page.title}`);
    }
  }

  console.log(`Updated ${updatedCount} pages`);
}

// Usage
searchAndReplace('OldCompany Inc.', 'NewCompany Corp.');
```

### Example 18: Generate Table of Contents

**Scenario**: Create index page with links to all child pages.

**Script**:
```javascript
async function generateTOC(parentId) {
  const response = await fetch(`${API_URL}/pages`);
  const { pages } = await response.json();

  // Filter children
  const children = pages
    .filter(p => p.parent_id === parentId)
    .sort((a, b) => a.position - b.position);

  // Generate TOC HTML
  const tocHTML = `
    <h1>Table of Contents</h1>
    <ul>
      ${children.map(child => `
        <li>
          <a href="#" data-page-id="${child.id}">
            ${child.title}
          </a>
        </li>
      `).join('')}
    </ul>
  `;

  // Create/update TOC page
  const tocPage = pages.find(p => p.title === 'Table of Contents' && p.parent_id === parentId);

  if (tocPage) {
    // Update existing
    await fetch(`${API_URL}/pages/${tocPage.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Table of Contents',
        content: tocHTML
      })
    });
  } else {
    // Create new
    await fetch(`${API_URL}/pages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Table of Contents',
        content: tocHTML,
        parent_id: parentId,
        position: 0
      })
    });
  }

  console.log('TOC generated!');
}
```

---

## Advanced Workflows

### Example 19: Weekly Review Process

**Scenario**: Review and archive completed work weekly.

**Workflow**:

1. **Monday morning setup**:
   ```javascript
   async function createWeeklyReview() {
     const week = getWeekNumber(new Date());
     const year = new Date().getFullYear();

     await fetch(`${API_URL}/pages`, {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({
        title: `Week ${week} - ${year} Review`,
        content: `
          <h1>Weekly Review - Week ${week}</h1>
          <h2>Completed This Week</h2>
          <ul><li></li></ul>
          <h2>In Progress</h2>
          <ul><li></li></ul>
          <h2>Next Week Goals</h2>
          <ul><li></li></ul>
        `,
        parent_id: reviewsParentId
       })
     });
   }
   ```

2. **Throughout week**:
   - Tag completed items with "Done - Week X"
   - Move to archive folder
   - Update in-progress items

3. **Friday review**:
   - Filter by "Done - Week X" tag
   - Copy to review page
   - Set goals for next week

4. **Archive**:
   - Move review to "Archive" parent
   - Mark as template for future use

### Example 20: Client Portal Setup

**Scenario**: Create separate workspaces for different clients.

**Structure**:
```
📁 Client Portal
├── 📁 Client A
│   ├── 📄 Project Brief
│   ├── 📄 Deliverables
│   └── 📄 Meeting Notes
├── 📁 Client B
│   ├── 📄 Project Brief
│   ├── 📄 Deliverables
│   └── 📄 Meeting Notes
└── 📁 Client C
    └── ...
```

**Tagging system**:
- Client tags: `Client A`, `Client B`, `Client C`
- Status tags: `Active`, `On Hold`, `Completed`
- Type tags: `Contract`, `Invoice`, `Deliverable`

**Filtering workflow**:
1. Select "Client A" tag → See all Client A content
2. Add "Active" filter → See active Client A projects
3. Add "Deliverable" filter → See Client A active deliverables

### Example 21: Knowledge Base with Cross-Referencing

**Scenario**: Build interconnected documentation.

**Technique**: Use Quill links to connect related pages.

**Example page** ("JavaScript Promises"):
```html
<h1>JavaScript Promises</h1>

<p>Promises are a way to handle asynchronous operations.</p>

<h2>Related Topics</h2>
<ul>
  <li><a href="/pages/async-await">Async/Await</a></li>
  <li><a href="/pages/callbacks">Callbacks</a></li>
  <li><a href="/pages/fetch-api">Fetch API</a></li>
</ul>

<h2>See Also</h2>
<ul>
  <li><a href="/pages/error-handling">Error Handling in Async Code</a></li>
</ul>
```

**Benefits**:
- Navigate between related concepts
- Build knowledge graph
- Discover connections

### Example 22: Automated Backup Script

**Scenario**: Daily backup of all pages to JSON.

**Script**:
```javascript
const fs = require('fs');
const fetch = require('node-fetch');

async function backupAllPages() {
  const response = await fetch(`${API_URL}/pages`);
  const { pages } = await response.json();

  const backup = {
    timestamp: new Date().toISOString(),
    version: '1.0',
    pages: pages
  };

  const filename = `backup-${Date.now()}.json`;
  fs.writeFileSync(filename, JSON.stringify(backup, null, 2));

  console.log(`Backup saved: ${filename}`);
  console.log(`Pages backed up: ${pages.length}`);
}

// Run daily with cron
// 0 2 * * * node backup.js
backupAllPages();
```

**Restoration script**:
```javascript
async function restoreFromBackup(filename) {
  const data = JSON.parse(fs.readFileSync(filename, 'utf8'));

  for (const page of data.pages) {
    await fetch(`${API_URL}/pages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(page)
    });
  }

  console.log(`Restored ${data.pages.length} pages`);
}
```

---

## Summary

This examples guide covered:

1. **Getting Started**: First workspace setup
2. **Page Management**: Creating, duplicating, organizing
3. **Hierarchical Organization**: Multi-level structures
4. **Tags**: Status tracking, multi-dimensional categorization
5. **Templates**: Standardized workflows
6. **Version History**: Recovery and tracking changes
7. **Export**: Markdown and HTML exports
8. **API Usage**: Automation scripts
9. **Advanced Workflows**: Complex real-world scenarios

**Key Patterns**:
- Start simple, add complexity as needed
- Use tags for flexible categorization
- Create templates for repeated workflows
- Leverage API for bulk operations
- Regular backups for safety

**Next Steps**:
- Experiment with examples in your workspace
- Combine patterns for custom workflows
- Read `architecture.md` for system design details
