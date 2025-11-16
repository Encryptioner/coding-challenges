# Markdown to PDF - Practical Examples

This document provides practical examples and use cases for the Markdown to PDF converter.

## Table of Contents

1. [Basic Usage](#basic-usage)
2. [Formatting Examples](#formatting-examples)
3. [Document Templates](#document-templates)
4. [Customization Examples](#customization-examples)
5. [Export Scenarios](#export-scenarios)
6. [Keyboard Shortcuts](#keyboard-shortcuts)
7. [Common Workflows](#common-workflows)
8. [Tips and Tricks](#tips-and-tricks)

## Basic Usage

### Example 1: Simple Document

**Input:**
```markdown
# My First Document

This is a paragraph with some **bold text** and *italic text*.

## Section 1

- First item
- Second item
- Third item
```

**Output:** Clean HTML preview on the right, ready to export as PDF.

### Example 2: Quick Note Taking

1. Open the editor
2. Start typing markdown
3. See live preview
4. Content auto-saves to browser
5. Close and reopen - your content is still there

**Use Case:** Meeting notes, quick documentation, brainstorming.

### Example 3: Code Documentation

````markdown
# API Documentation

## Authentication

Use the following code to authenticate:

```python
import requests

response = requests.post('https://api.example.com/auth', {
    'username': 'user',
    'password': 'pass'
})

token = response.json()['token']
```

## Making Requests

All requests require the `Authorization` header:

```bash
curl -H "Authorization: Bearer $TOKEN" \
     https://api.example.com/data
```
````

**Result:** Professional-looking technical documentation with syntax-highlighted code blocks.

## Formatting Examples

### Headers Showcase

```markdown
# Heading 1 - Page Title
## Heading 2 - Main Section
### Heading 3 - Subsection
#### Heading 4 - Minor Section
##### Heading 5 - Detail
###### Heading 6 - Fine Print
```

**Renders as progressively smaller headings with consistent styling.**

### Emphasis Combinations

```markdown
This is *italic text*.
This is **bold text**.
This is ***bold and italic***.
This is ~~strikethrough text~~.

You can also use _underscores for italic_.
And __double underscores for bold__.
```

### Lists

**Unordered:**
```markdown
Shopping List:
- Milk
- Eggs
- Bread
  - Whole wheat
  - Sourdough
- Coffee
```

**Ordered:**
```markdown
Recipe Steps:
1. Preheat oven to 350°F
2. Mix dry ingredients
3. Add wet ingredients
4. Bake for 25 minutes
5. Cool and serve
```

**Mixed:**
```markdown
Project Tasks:
1. Planning
   - Define requirements
   - Create timeline
2. Development
   - Frontend
   - Backend
3. Testing
```

### Links and Images

```markdown
Check out [Google](https://google.com) for search.

Visit [GitHub](https://github.com) for code hosting.

![Placeholder](https://via.placeholder.com/150)
![Cat](https://placekitten.com/200/300)
```

### Tables

**Simple Table:**
```markdown
| Name    | Age | City        |
|---------|-----|-------------|
| Alice   | 30  | New York    |
| Bob     | 25  | San Francisco |
| Charlie | 35  | Boston      |
```

**Aligned Table:**
```markdown
| Left Aligned | Center Aligned | Right Aligned |
|:-------------|:--------------:|--------------:|
| Text         | Text           | 123.45        |
| More         | More           | 67.89         |
```

### Blockquotes

```markdown
> This is a blockquote.
> It can span multiple lines.
>
> And include blank lines.

> "The only way to do great work is to love what you do."
> - Steve Jobs
```

### Code

**Inline:**
```markdown
Use the `print()` function in Python.
The `Array.map()` method in JavaScript.
Type `ls -la` in the terminal.
```

**Blocks:**
````markdown
Python example:
```python
def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n-1) + fibonacci(n-2)
```

JavaScript example:
```javascript
function factorial(n) {
    return n <= 1 ? 1 : n * factorial(n - 1);
}
```
````

## Document Templates

### Template 1: Meeting Notes

```markdown
# Meeting Notes - [Date]

**Attendees:** Name1, Name2, Name3
**Location:** Conference Room A
**Time:** 2:00 PM - 3:00 PM

## Agenda

1. Project status update
2. Budget review
3. Next steps

## Discussion Points

### Project Status
- Milestone 1 completed ✓
- Milestone 2 in progress
- Milestone 3 scheduled for next month

### Budget
Current spend: $X,XXX
Remaining: $Y,YYY

## Action Items

| Task | Owner | Deadline |
|------|-------|----------|
| Task 1 | Alice | Jan 15 |
| Task 2 | Bob | Jan 20 |

## Next Meeting

Date: [Next Date]
Time: [Time]
```

### Template 2: Technical Specification

```markdown
# Technical Specification: [Feature Name]

## Overview

Brief description of the feature or component.

## Requirements

### Functional Requirements
1. System shall do X
2. User can perform Y
3. Application must support Z

### Non-Functional Requirements
- Performance: Response time < 200ms
- Security: OAuth 2.0 authentication
- Scalability: Support 10,000 concurrent users

## Architecture

```
[Component Diagram]
```

## API Specification

### Endpoint: /api/users

**Method:** GET

**Parameters:**
- `limit` (optional): Number of results
- `offset` (optional): Pagination offset

**Response:**
```json
{
  "users": [...],
  "total": 100
}
```

## Database Schema

| Column | Type | Constraints |
|--------|------|-------------|
| id | INTEGER | PRIMARY KEY |
| name | VARCHAR(100) | NOT NULL |
| email | VARCHAR(255) | UNIQUE |

## Implementation Notes

- Use connection pooling
- Cache frequently accessed data
- Implement rate limiting

## Testing

- Unit tests: 95% coverage required
- Integration tests: All API endpoints
- Load testing: 1000 RPS
```

### Template 3: Resume/CV

```markdown
# John Doe

**Email:** john@example.com
**Phone:** (555) 123-4567
**Location:** San Francisco, CA
**LinkedIn:** linkedin.com/in/johndoe

## Summary

Experienced software engineer with 5+ years in full-stack development.
Passionate about building scalable applications and mentoring junior developers.

## Experience

### Senior Software Engineer
**Company Name** | San Francisco, CA | 2020 - Present

- Led team of 5 developers on microservices migration
- Reduced API response time by 40% through optimization
- Implemented CI/CD pipeline, reducing deployment time from 2 hours to 15 minutes

### Software Engineer
**Previous Company** | San Jose, CA | 2018 - 2020

- Developed customer-facing web application using React and Node.js
- Collaborated with design team to implement responsive UI
- Wrote comprehensive unit and integration tests

## Education

### Bachelor of Science in Computer Science
**University Name** | 2014 - 2018
- GPA: 3.8/4.0
- Relevant Coursework: Algorithms, Data Structures, Database Systems

## Skills

**Languages:** JavaScript, Python, Java, SQL
**Frameworks:** React, Node.js, Express, Django
**Tools:** Git, Docker, Kubernetes, AWS
**Databases:** PostgreSQL, MongoDB, Redis

## Projects

### Open Source Contribution
Contributed to popular open-source project with 10k+ stars.
Added feature X and fixed bugs Y and Z.

## Certifications

- AWS Certified Solutions Architect (2022)
- Kubernetes Certified Application Developer (2021)
```

## Customization Examples

### Example 1: Dark Theme Document

**Settings:**
- Font: Arial, sans-serif
- Background: #1e1e1e (dark gray)
- Text: #e0e0e0 (light gray)
- Headings: #4fc3f7 (light blue)
- Links: #81c784 (light green)

**Use Case:** Eye-friendly for late-night writing, presentations in dark rooms.

### Example 2: Classic Book Style

**Settings:**
- Font: Times New Roman, serif
- Body Size: 18px (larger, easier to read)
- Background: #f5f5dc (beige/cream)
- Text: #2f2f2f (dark brown)
- Headings: #8b4513 (saddle brown)

**Use Case:** Stories, essays, formal documents, printed books.

### Example 3: Minimalist

**Settings:**
- Font: Helvetica, sans-serif
- Body Size: 14px
- H1: 28px (smaller headers)
- Background: #fafafa (almost white)
- Text: #424242 (dark gray)
- Headings: #212121 (near black)

**Use Case:** Clean, modern documents, portfolios, simple reports.

### Example 4: Presentation Mode

**Settings:**
- Font: Arial, sans-serif
- Body Size: 20px (large text)
- H1: 48px (very large)
- High contrast colors
- Minimal margins

**Use Case:** Documents that will be displayed on screen, projected presentations.

## Export Scenarios

### Scenario 1: Single Page PDF

1. Write your content in markdown
2. Customize styling if desired
3. Click "Export PDF"
4. In print dialog:
   - Select "Save as PDF"
   - Choose page size (Letter, A4, etc.)
   - Click "Save"

**Result:** Single PDF file ready to email or print.

### Scenario 2: Multi-Page Document

**For Long Documents:**

```markdown
# Document Title

## Chapter 1: Introduction

Lorem ipsum dolor sit amet...

[Several pages of content]

## Chapter 2: Background

More content here...

[More pages]

## Appendix A

Reference material...
```

**Print Settings:**
- Enable "Headers and Footers" for page numbers
- Adjust margins as needed
- Preview before saving

### Scenario 3: Professional Report

```markdown
# Quarterly Business Report
## Q4 2024

**Prepared by:** Finance Team
**Date:** January 10, 2025

---

## Executive Summary

Key highlights and metrics...

## Financial Performance

| Metric | Q3 2024 | Q4 2024 | Change |
|--------|---------|---------|--------|
| Revenue | $1.2M | $1.5M | +25% |
| Expenses | $800K | $900K | +12.5% |
| Profit | $400K | $600K | +50% |

## Detailed Analysis

[Charts and graphs could be included as images]

### Revenue Breakdown

- Product A: 45%
- Product B: 35%
- Services: 20%

## Recommendations

1. Increase investment in Product A
2. Optimize expenses in category X
3. Expand services division

---

**Confidential** - Internal Use Only
```

**Export with:**
- Company colors and fonts
- Page numbers and headers
- Professional styling

## Keyboard Shortcuts

### Quick Formatting

```markdown
Select text and press:
- Ctrl/Cmd + B → **bold**
- Ctrl/Cmd + I → *italic*
- Ctrl/Cmd + K → [link](url)
- Ctrl/Cmd + E → `code`
```

### Workflow Shortcuts

```
Ctrl/Cmd + S → Save (confirmation)
Ctrl/Cmd + P → Export PDF
```

### Example Workflow:

1. Type: "important text"
2. Select the text
3. Press Ctrl+B
4. Result: "**important text**"
5. Preview automatically shows bold

## Common Workflows

### Workflow 1: Quick Documentation

```
1. Open editor
2. Paste existing text
3. Add markdown formatting:
   - # for headers
   - ** for bold
   - - for lists
4. Customize style if needed
5. Export to PDF
6. Share with team
```

**Time:** 5-10 minutes for typical document.

### Workflow 2: Continuous Note-Taking

```
1. Keep browser tab open
2. Add notes throughout the day
3. Content auto-saves
4. Organize with headers
5. Export at end of day/week
```

**Benefit:** No "save" button to remember, everything persists.

### Workflow 3: Template Reuse

```
1. Create template document
2. Export as PDF for reference
3. Copy markdown to new session
4. Fill in specific details
5. Export personalized version
```

**Templates:** Meeting notes, reports, invoices, resumes.

### Workflow 4: Collaborative Review

```
1. Write document
2. Export to PDF
3. Share with team
4. Collect feedback
5. Update markdown
6. Re-export with changes
```

**Advantage:** Version control through markdown, professional output through PDF.

## Tips and Tricks

### Tip 1: Empty Lines for Spacing

```markdown
# Section 1

Content here.

(blank line creates spacing)

More content here.
```

### Tip 2: Horizontal Rules for Breaks

```markdown
Section 1 content...

---

Section 2 content...

***

Section 3 content...
```

### Tip 3: Escaping Special Characters

```markdown
To show literal asterisks: \*not italic\*
To show backticks: \`not code\`
```

### Tip 4: Nested Lists

```markdown
- Main item
  - Sub-item (indent with 2 spaces)
  - Another sub-item
- Another main item
```

### Tip 5: Link Shortcuts

```markdown
Internal link: See [Section 2](#section-2)
External: [Google](https://google.com)
Email: [Contact](mailto:email@example.com)
```

### Tip 6: Table Alignment

```markdown
| Left | Center | Right |
|:-----|:------:|------:|
| A    | B      | C     |
```

**Alignment:**
- `:---` - Left
- `:---:` - Center
- `---:` - Right

### Tip 7: Code Language Hints

````markdown
```python
# Python code
```

```javascript
// JavaScript code
```

```bash
# Shell commands
```
````

Though syntax highlighting isn't active, the language hint provides context.

### Tip 8: Preview Before Export

Always review preview pane before exporting:
- Check formatting
- Verify links work
- Ensure tables align
- Confirm code blocks display correctly

### Tip 9: Browser Print Preview

Before finalizing PDF:
1. Click Export PDF
2. Review print preview
3. Adjust settings if needed
4. Check page breaks
5. Then save

### Tip 10: Saving Markdown Source

Browser saves content automatically, but for backup:
1. Select all text in editor (Ctrl/Cmd + A)
2. Copy (Ctrl/Cmd + C)
3. Paste into text file
4. Save as `document.md`

**Later:** Paste back into editor to continue.

## Real-World Use Cases

### Use Case 1: Technical Blog Posts

Write blog posts in markdown, customize styling to match blog theme, export preview as PDF for offline reading or sharing.

### Use Case 2: Project Proposals

Create professional proposals with tables, lists, and formatting. Export to PDF for client presentation.

### Use Case 3: Study Notes

Take class notes in markdown during lectures, organize with headers and lists, export to PDF for studying.

### Use Case 4: Recipe Collection

```markdown
# Chocolate Chip Cookies

**Prep Time:** 15 minutes
**Cook Time:** 12 minutes
**Yield:** 24 cookies

## Ingredients

- 2 1/4 cups flour
- 1 tsp baking soda
- 1 cup butter
- 3/4 cup sugar
- 2 eggs
- 2 cups chocolate chips

## Instructions

1. Preheat oven to 375°F
2. Mix dry ingredients
3. Cream butter and sugar
4. Add eggs
5. Combine wet and dry
6. Fold in chips
7. Bake 9-11 minutes

## Notes

- Don't overmix
- Slightly underbake for chewy cookies
```

### Use Case 5: Daily Journal

```markdown
# Journal - January 15, 2025

## Morning

Woke up at 7:00 AM. Started with meditation.

**Mood:** Energized

## Goals for Today

- [x] Complete project proposal
- [ ] Exercise for 30 minutes
- [ ] Read chapter 5

## Evening Reflection

Productive day. Finished proposal ahead of schedule.

**Grateful for:** Good weather, supportive team

## Tomorrow's Plan

Focus on implementation phase.
```

Export monthly or yearly journals as PDFs for archiving.

## Conclusion

The Markdown to PDF converter is a versatile tool for creating professional documents quickly. By combining markdown's simplicity with customizable styling and PDF export, you can handle everything from quick notes to formal reports.

**Key Takeaways:**
- Start simple, add formatting as needed
- Use templates for repeated document types
- Customize styles to match your brand/preference
- Leverage auto-save for peace of mind
- Export to PDF for universal compatibility

Happy writing! 📝
