# Examples and Use Cases

This document provides practical examples of using CCSlides for various presentation scenarios.

## Table of Contents

1. [Basic Presentation](#basic-presentation)
2. [Technical Talk](#technical-talk)
3. [Workshop/Tutorial](#workshop-tutorial)
4. [Business Presentation](#business-presentation)
5. [Custom Themes](#custom-themes)
6. [Advanced Features](#advanced-features)

## Basic Presentation

### Quick Team Update

Perfect for standup meetings or quick status updates:

```markdown
---
title: Weekly Team Update
author: Team Lead
date: 2024-11-17
theme: default
---

# Team Update
Week of Nov 11-17, 2024

---

## Completed This Week

- ✅ User authentication feature
- ✅ Database migration
- ✅ Bug fixes (15 issues closed)
- ✅ Documentation updates

---

## In Progress

- 🔄 Payment integration (80%)
- 🔄 Mobile responsive design (60%)
- 🔄 Performance optimization (40%)

---

## Blockers

- **API Rate Limits** - Waiting for provider response
- **Design Assets** - Need final mockups from design team

---

## Next Week Goals

1. Complete payment integration
2. Finish mobile responsiveness
3. Start user testing phase
4. Deploy to staging environment

---

## Questions?

Thank you!

---
```

**Usage:**
```bash
ccslides init team-update
cd team-update
# Edit slides/presentation.md
ccslides serve
ccslides export -o team-update-2024-11-17.pdf
```

## Technical Talk

### Introduction to APIs

For developer conferences or meetups:

```markdown
---
title: Building RESTful APIs
author: Jane Developer
date: 2024-11-17
theme: default
---

# Building RESTful APIs

Best practices and patterns

**By Jane Developer**
@janedev

---

## Agenda

1. What is REST?
2. HTTP Methods
3. Status Codes
4. Design Patterns
5. Security
6. Live Demo

---

## What is REST?

**RE**presentational **S**tate **T**ransfer

- Architectural style for web services
- Uses HTTP protocol
- Stateless communication
- Resource-based URIs

---

## HTTP Methods

| Method | Purpose | Idempotent |
|--------|---------|------------|
| GET    | Retrieve resource | Yes |
| POST   | Create resource | No |
| PUT    | Update/Replace | Yes |
| PATCH  | Partial update | No |
| DELETE | Remove resource | Yes |

---

## Status Codes

### 2xx Success
- `200 OK` - Request succeeded
- `201 Created` - Resource created
- `204 No Content` - Success, no body

### 4xx Client Errors
- `400 Bad Request` - Invalid syntax
- `401 Unauthorized` - Authentication required
- `404 Not Found` - Resource doesn't exist

---

## Example: User API

\`\`\`javascript
// GET /api/users
app.get('/api/users', async (req, res) => {
  const users = await User.findAll();
  res.json(users);
});

// GET /api/users/:id
app.get('/api/users/:id', async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  res.json(user);
});
\`\`\`

---

## Creating Resources

\`\`\`javascript
// POST /api/users
app.post('/api/users', async (req, res) => {
  const { name, email } = req.body;

  // Validation
  if (!name || !email) {
    return res.status(400).json({
      error: 'Name and email required'
    });
  }

  // Create user
  const user = await User.create({ name, email });

  // Return 201 Created
  res.status(201).json(user);
});
\`\`\`

---

## Best Practices

1. **Use nouns, not verbs** in URIs
   - ✅ `/api/users`
   - ❌ `/api/getUsers`

2. **Use plural nouns**
   - ✅ `/api/users/123`
   - ❌ `/api/user/123`

3. **Nested resources** for relationships
   - ✅ `/api/users/123/posts`

---

## Security

- **Authentication**: JWT, OAuth, API Keys
- **HTTPS**: Always use TLS
- **Rate Limiting**: Prevent abuse
- **Input Validation**: Sanitize all inputs
- **CORS**: Configure properly

---

## Example: JWT Auth

\`\`\`javascript
const jwt = require('jsonwebtoken');

// Middleware
function authenticate(req, res, next) {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
}
\`\`\`

---

## Live Demo

Let's build a simple API together!

Repository: github.com/janedev/api-demo

---

## Resources

- [REST API Tutorial](https://restfulapi.net/)
- [HTTP Status Codes](https://httpstatuses.com/)
- [API Security Checklist](https://github.com/shieldfy/API-Security-Checklist)

---

## Thank You!

Questions?

**Email**: jane@example.com
**Twitter**: @janedev
**GitHub**: github.com/janedev

---
```

## Workshop/Tutorial

### Git Basics Workshop

Interactive tutorial format:

```markdown
---
title: Git Fundamentals
author: Workshop Instructor
date: 2024-11-17
theme: default
---

# Git Fundamentals

Hands-on workshop

**Duration**: 2 hours
**Level**: Beginner

---

## What You'll Learn

- Version control basics
- Git workflow
- Branching and merging
- Collaboration with GitHub
- Best practices

---

## Prerequisites

- Git installed
- Text editor
- GitHub account (optional)

**Check your git version:**
\`\`\`bash
git --version
\`\`\`

---

## Part 1: Git Basics

### Creating a Repository

\`\`\`bash
# Create new directory
mkdir my-project
cd my-project

# Initialize git
git init

# Check status
git status
\`\`\`

**Exercise**: Create your first repository

---

## The Three States

```
Working Directory → Staging Area → Repository
        |               |              |
    (modified)      (staged)      (committed)
```

- **Working Directory**: Files you're editing
- **Staging Area**: Files ready to commit
- **Repository**: Committed history

---

## Making Changes

\`\`\`bash
# Create a file
echo "# My Project" > README.md

# Check status
git status

# Stage the file
git add README.md

# Commit
git commit -m "Initial commit"
\`\`\`

**Exercise**: Create and commit your first file (5 minutes)

---

## Viewing History

\`\`\`bash
# View commit history
git log

# Short format
git log --oneline

# With graph
git log --oneline --graph --all
\`\`\`

---

## Part 2: Branching

### Why Branches?

- Isolate features
- Safe experimentation
- Parallel development
- Clean main branch

---

## Creating Branches

\`\`\`bash
# Create new branch
git branch feature-login

# Switch to branch
git checkout feature-login

# Or do both at once
git checkout -b feature-login

# List branches
git branch
\`\`\`

**Exercise**: Create a feature branch (5 minutes)

---

## Merging

\`\`\`bash
# Switch to main
git checkout main

# Merge feature branch
git merge feature-login

# Delete merged branch
git branch -d feature-login
\`\`\`

---

## Part 3: GitHub

### Pushing to Remote

\`\`\`bash
# Add remote
git remote add origin https://github.com/user/repo.git

# Push to remote
git push -u origin main

# Pull from remote
git pull origin main
\`\`\`

**Exercise**: Create GitHub repo and push your code (10 minutes)

---

## Collaboration Workflow

1. Clone repository
2. Create feature branch
3. Make changes
4. Commit changes
5. Push branch
6. Create Pull Request
7. Review and merge

---

## Common Commands Reference

| Command | Purpose |
|---------|---------|
| `git init` | Initialize repository |
| `git add` | Stage changes |
| `git commit` | Save changes |
| `git status` | Check status |
| `git log` | View history |
| `git branch` | Manage branches |
| `git merge` | Merge branches |
| `git push` | Upload to remote |
| `git pull` | Download from remote |

---

## Best Practices

1. **Commit often** - Small, focused commits
2. **Write good messages** - Clear and descriptive
3. **Use branches** - One feature per branch
4. **Pull before push** - Stay up to date
5. **Review before commit** - Check your changes

---

## Hands-On Challenge

**Task**: Create a simple website

1. Initialize git repository
2. Create index.html
3. Commit your changes
4. Create a feature branch
5. Add a new page
6. Merge back to main
7. Push to GitHub

**Time**: 20 minutes

---

## Troubleshooting

### Common Issues

**Merge conflicts:**
\`\`\`bash
# See conflicted files
git status

# After resolving
git add .
git commit
\`\`\`

**Undo last commit:**
\`\`\`bash
git reset --soft HEAD~1
\`\`\`

---

## Resources

- [Official Git Book](https://git-scm.com/book)
- [GitHub Learning Lab](https://lab.github.com/)
- [Interactive Git Tutorial](https://learngitbranching.js.org/)
- [Git Cheat Sheet](https://education.github.com/git-cheat-sheet-education.pdf)

---

## Next Steps

- Practice daily
- Contribute to open source
- Learn advanced features
- Join our community

---

## Thank You!

**Questions?**

Workshop materials: github.com/instructor/git-workshop
Email: instructor@example.com

---
```

## Business Presentation

### Quarterly Results

Professional business presentation:

```markdown
---
title: Q4 2024 Results
author: CEO
date: 2024-11-17
theme: default
---

# Q4 2024 Results

Board Meeting
November 17, 2024

---

## Executive Summary

- Revenue: **$15.2M** (↑ 23% YoY)
- Profit: **$3.1M** (↑ 31% YoY)
- Customers: **45,000** (↑ 15% YoY)
- NPS Score: **72** (Industry avg: 45)

**Strong quarter across all metrics**

---

## Revenue Breakdown

| Segment | Q4 2024 | Q4 2023 | Growth |
|---------|---------|---------|--------|
| Enterprise | $8.2M | $6.5M | +26% |
| SMB | $4.8M | $4.1M | +17% |
| Other | $2.2M | $1.8M | +22% |

---

## Key Achievements

✅ Launched new enterprise product
✅ Expanded to 3 new markets
✅ Hired 50 new employees
✅ Improved customer retention by 12%
✅ Reduced churn to 3.2%

---

## Challenges

1. **Supply Chain** - Delays affected Q4 shipments
2. **Competition** - New entrants in key markets
3. **Hiring** - Competitive talent market

**Mitigation strategies in place**

---

## 2025 Outlook

### Goals
- Revenue: $75M (↑ 24%)
- Expand to 5 new markets
- Launch mobile app
- Improve margins by 5%

### Investments
- R&D: $12M
- Marketing: $8M
- Infrastructure: $5M

---

## Strategic Priorities

1. **Product Innovation**
2. **Market Expansion**
3. **Operational Excellence**
4. **Team Development**

---

## Questions?

Thank you for your attention.

---
```

## Custom Themes

### Dark Theme Example

Create `template/theme.json`:

```json
{
  "name": "dark",
  "colors": {
    "primary": "#61dafb",
    "secondary": "#ffc107",
    "background": "#282c34",
    "text": "#ffffff"
  },
  "fonts": {
    "heading": "'Fira Sans', sans-serif",
    "body": "'Roboto', sans-serif",
    "code": "'Fira Code', monospace"
  }
}
```

Create `template/style.css`:

```css
/* Dark theme custom styles */

.slide {
  background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
}

.slide h1 {
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
  border-bottom: 3px solid #61dafb;
  padding-bottom: 20px;
}

.slide code {
  background: #1e1e1e;
  color: #61dafb;
  border: 1px solid #61dafb;
}

.slide pre {
  background: #1e1e1e;
  border-left: 4px solid #ffc107;
}
```

### Minimal Theme

For simple, clean presentations:

```json
{
  "name": "minimal",
  "colors": {
    "primary": "#000000",
    "secondary": "#666666",
    "background": "#ffffff",
    "text": "#333333"
  },
  "fonts": {
    "heading": "'Georgia', serif",
    "body": "'Georgia', serif",
    "code": "'Courier New', monospace"
  }
}
```

```css
/* Minimal theme */

.slide {
  padding: 100px 120px;
}

.slide h1 {
  font-weight: 300;
  font-size: 4em;
  margin-bottom: 0.2em;
}

.slide p {
  font-size: 1.8em;
  line-height: 1.8;
}

.slide ul {
  list-style: none;
}

.slide li:before {
  content: "—";
  margin-right: 10px;
}
```

## Advanced Features

### Image-Heavy Presentation

```markdown
---
title: Design Showcase
author: Designer
---

# Design Showcase

Portfolio highlights

---

## Project 1: Mobile App

![App Screenshot](../images/app-screenshot.png)

A modern mobile experience

---

## Project 2: Website Redesign

![Website Before](../images/before.png)

**Before**: Outdated design

---

![Website After](../images/after.png)

**After**: Modern, clean interface

---
```

### Code-Heavy Technical Presentation

````markdown
---
title: Code Review Best Practices
---

# Code Review Best Practices

---

## Good Code Structure

```javascript
// ✅ Good: Clear, single responsibility
function calculateTotal(items) {
  return items.reduce((sum, item) => sum + item.price, 0);
}

// ❌ Bad: Doing too much
function processOrder(order) {
  validateOrder(order);
  calculateTotal(order);
  saveToDatabase(order);
  sendEmail(order);
  updateInventory(order);
}
```

---

## Type Safety

```typescript
// ✅ Good: Type-safe interfaces
interface User {
  id: number;
  name: string;
  email: string;
}

function getUser(id: number): Promise<User> {
  return api.fetch(`/users/${id}`);
}

// ❌ Bad: No type safety
function getUser(id) {
  return api.fetch('/users/' + id);
}
```

---
````

### Multi-Language Support

```markdown
---
title: Internationalization
---

# Welcome / Bienvenue / Willkommen

---

## Features

- **English**: Full support
- **French**: Full support
- **German**: Coming soon
- **Spanish**: Coming soon

---

## Example

**English**: Hello, World!
**French**: Bonjour, le monde!
**German**: Hallo, Welt!
**Spanish**: ¡Hola, Mundo!

---
```

## Tips and Tricks

### 1. Use Speaker Notes (Future Feature)

```markdown
# Main Slide Content

<!--
Speaker notes go here
These won't be visible to the audience
-->
```

### 2. Slide Timing

Include estimated time per slide:

```markdown
# Introduction (2 min)

# Background (5 min)

# Demo (10 min)
```

### 3. Call-to-Action Slides

```markdown
# Get Started Today!

1. Visit our website
2. Sign up for free trial
3. Join our community

**Limited time offer: 50% off**
```

### 4. Contact Information

```markdown
# Thank You!

**John Doe**
john@example.com
@johndoe
github.com/johndoe

**Slides**: slides.example.com/presentation
```

## Conclusion

These examples demonstrate the versatility of CCSlides for different presentation scenarios. Mix and match techniques to create the perfect presentation for your needs!
