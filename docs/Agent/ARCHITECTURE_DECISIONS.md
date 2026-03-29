# Architecture Decisions: Coding Challenges

**Last Updated:** 2026-03-17

This document records key architectural decisions for the coding-challenges repository. Each ADR (Architecture Decision Record) explains the context, decision, and consequences.

---

## Table of Contents

1. [ADR-001: Challenge Independence](#adr-001-challenge-independence)
2. [ADR-002: Documentation-First Approach](#adr-002-documentation-first-approach)
3. [ADR-003: Language Selection by Domain](#adr-003-language-selection-by-domain)
4. [ADR-004: GitHub Pages for Web Challenges](#adr-004-github-pages-for-web-challenges)
5. [ADR-005: Monorepo with Root Orchestration](#adr-005-monorepo-with-root-orchestration)
6. [ADR-006: No External Dependencies for System Tools](#adr-006-no-external-dependencies-for-system-tools)
7. [ADR-007: Tutorial-Style Documentation](#adr-007-tutorial-style-documentation)
8. [ADR-008: Build Artifact Exclusion](#adr-008-build-artifact-exclusion)
9. [ADR-009: Manual Testing for CLI Tools](#adr-009-manual-testing-for-cli-tools)
10. [ADR-010: Progressive Enhancement in Web Challenges](#adr-010-progressive-enhancement-in-web-challenges)

---

## ADR-001: Challenge Independence

### Status
**Accepted**

### Context
Each coding challenge needs to demonstrate specific concepts without being tied to other challenges. Users may want to:
- Explore a single challenge
- Compare implementations across challenges
- Learn a specific language/technology
- Use challenges as reference implementations

### Decision
Each challenge is a **completely self-contained project** with:
- Own build system (Makefile, package.json, Cargo.toml, etc.)
- Own dependencies (no cross-challenge imports)
- Own documentation (CHALLENGE.md, README.md, docs/)
- Own tests
- Can be cloned/forked independently

### Consequences

**Positive:**
- Easy to explore individual challenges
- Clear learning boundaries
- Simple to share specific challenges
- Each challenge is a complete reference
- No hidden dependencies

**Negative:**
- Some code duplication across similar challenges
- Each challenge maintains its own dependencies
- Cannot share utilities between challenges (by design)

**Examples:**
```
01-wc-tool/
├── main.c
├── Makefile
├── test.sh
├── CHALLENGE.md
├── README.md
└── docs/

02-json-parser/
├── main.c
├── Makefile
├── test.sh
├── CHALLENGE.md
├── README.md
└── docs/
```

Both are independent. No shared code between them.

---

## ADR-002: Documentation-First Approach

### Status
**Accepted**

### Context
This is a **learning resource**, not just a code repository. Users need:
- Clear explanations of concepts
- Step-by-step guidance
- Examples and use cases
- Design rationale

### Decision
Every challenge MUST include:
1. **CHALLENGE.md** - Requirements and specifications
2. **README.md** - Implementation overview and usage
3. **docs/** directory with:
   - `implementation.md` - Design and code walkthrough
   - `examples.md` - Practical usage examples
   - `algorithms.md` or `internals.md` - Deep dive into algorithms

Documentation is **tutorial-style**, not reference-style. Teach concepts, don't just state facts.

### Consequences

**Positive:**
- Excellent learning resource
- Self-contained explanations
- Reduces external lookup needs
- Clear progression for learners

**Negative:**
- More upfront documentation effort
- Documentation maintenance overhead
- Larger repository size

**Example Structure:**
```markdown
## Implementation

### Buffer Management

We use a double-buffer approach for processing input. Here's why...

```c
char buffer[BUFFER_SIZE * 2];
// Read into first half
// Process from second half
// This prevents blocking...
```
```

---

## ADR-003: Language Selection by Domain

### Status
**Accepted**

### Context
Different types of challenges are best implemented in different languages:
- System tools → Low-level control (C, Rust)
- Network servers → Concurrency support (Go)
- Web apps → Browser ecosystem (JavaScript/TypeScript)
- Data processing → Libraries and simplicity (Python)

### Decision
Select the **most appropriate language** for each challenge type:

| Challenge Type | Primary Language | Rationale |
|----------------|------------------|-----------|
| CLI/System Tools | C | Low-level access, POSIX APIs, memory management learning |
| Network Servers | Go | Built-in concurrency, excellent standard library |
| Web Apps | TypeScript/React | Browser ecosystem, type safety, modern tooling |
| Data Processing | Python | Rich libraries, clear syntax |
| Extensions | JavaScript | Browser APIs, ecosystem |

### Consequences

**Positive:**
- Best tool for each job
- Learners exposed to multiple languages
- Real-world language/domain matching

**Negative:**
- Learners need familiarity with multiple languages
- Different build systems across challenges
- Harder to compare implementations directly

---

## ADR-004: GitHub Pages for Web Challenges

### Status
**Accepted**

### Context
Web-based challenges are best experienced:
- Running in a browser
- With live interactive demos
- With accessible documentation
- Without local setup

### Decision
All web challenges are automatically deployed to GitHub Pages:
- Detect web challenges (has index.html or dist/ output)
- Build static site with challenge index
- Create interactive split-pane viewers (docs + live demo)
- Deploy to `gh-pages` branch

**Deployment System:**
- `.github/scripts/build-site.sh` - Main orchestrator
- `generate-index.py` - Challenge index
- `generate-interactive-viewer.py` - Split-pane viewers
- `generate-docs-pages.py` - Markdown to HTML

### Consequences

**Positive:**
- Instant access to live demos
- No local setup required
- Shareable URLs
- Professional presentation

**Negative:**
- GitHub Pages limitations (no server-side code)
- Static hosting constraints
- Build complexity
- Branch management (gh-pages)

**Deployment URL:**
```
https://username.github.io/coding-challenges/
├── /ex-05-browser-ide-v1/
│   ├── index.html (viewer)
│   ├── app.html (live demo)
│   ├── README.html (docs)
│   └── docs/*.html (tutorials)
```

---

## ADR-005: Monorepo with Root Orchestration

### Status
**Accepted**

### Context
While challenges are independent, there's a need for:
- Unified project overview
- Coordinated builds for web challenges
- Shared deployment infrastructure
- Consistent documentation structure

### Decision
Use a **monorepo** structure with:
- Independent challenge directories
- Root `package.json` for build orchestration
- Shared deployment scripts
- Unified documentation (INDEX.md, README.md)

**Root package.json scripts:**
```json
{
  "install:all": "Install all buildable challenges",
  "build:all": "Build all buildable challenges",
  "deploy": "Build and deploy to GitHub Pages"
}
```

### Consequences

**Positive:**
- Single repository for all challenges
- Coordinated builds and deployment
- Unified project overview
- Easy to discover all challenges

**Negative:**
- Large repository size
- Longer clone times
- Some challenges have unused build scripts

---

## ADR-006: No External Dependencies for System Tools

### Status
**Accepted**

### Context
System tool challenges (wc, grep, shell, etc.) should demonstrate:
- Core language capabilities
- Standard library usage
- System API interactions
- How tools are built from scratch

### Decision
System tools (especially C and Go challenges) use:
- **Zero external dependencies** for C challenges
- **Minimal dependencies** (standard library only) for Go challenges
- No package manager dependencies for core functionality

### Consequences

**Positive:**
- Self-contained implementations
- Learns fundamentals, not library usage
- Easy to build anywhere with compiler
- Clear what code is doing

**Negative:**
- More code to write
- Reimplementing common patterns
- May not reflect real-world tooling

**Example:**
```c
// ✓ GOOD: Manual implementation
char *str_copy(char *dest, const char *src, size_t n) {
    // ... manual implementation
}

// ✗ AVOID: External library
// strcpy(dest, src);  // Too simple for learning
```

---

## ADR-007: Tutorial-Style Documentation

### Status
**Accepted**

### Context
Reference documentation is concise but assumes prior knowledge. Tutorial documentation:
- Teaches concepts progressively
- Provides context and rationale
- Includes examples and exercises
- Builds understanding incrementally

### Decision
All `docs/` content is **tutorial-style**:
- Explain "why" before "what"
- Use progressive disclosure
- Include practical examples
- Add diagrams and visual aids
- Cross-reference related concepts
- Aim for depth (600-900+ lines per doc)

### Consequences

**Positive:**
- Excellent for learners
- Reduces external research needed
- Self-contained learning path
- Clear conceptual understanding

**Negative:**
- More verbose documentation
- Higher maintenance burden
- Longer to write initially

**Example Pattern:**
```markdown
## The Parsing Challenge

When building a JSON parser, we face a fundamental question:
how do we handle nested structures?

### Why Recursion Works Best

[Explanation of recursive descent parsing]

```c
// This is why we parse recursively:
json_value *parse_object(const char **json) {
    // ...
}
```
```

---

## ADR-008: Build Artifact Exclusion

### Status
**Accepted**

### Context
Build artifacts (dist/, build/, node_modules/) cause:
- Repository bloat
- Merge conflicts
- Long clone times
- Unnecessary commits

### Decision
**Never commit build artifacts.** Always:
1. Create `.gitignore` for buildable challenges
2. Ignore: `dist/`, `build/`, `node_modules/`, `*.o`, `*.so`
3. Add build scripts to regenerate artifacts
4. Document build process in README

### Consequences

**Positive:**
- Smaller repository
- Fewer merge conflicts
- Faster clones
- Cleaner history

**Negative:**
- Must build before running
- No pre-built binaries
- Requires build environment

**Standard .gitignore:**
```gitignore
# Build outputs
dist/
build/
lib/
src-gen/

# Dependencies
node_modules/
vendor/

# Compiled files
*.o
*.so
*.exe
```

---

## ADR-009: Manual Testing for CLI Tools

### Status
**Accepted**

### Context
CLI tools (C, Go, Python) need:
- Comparison against reference implementations
- Testing of actual command-line behavior
- Verification of edge cases
- User experience validation

### Decision
Use **manual testing approach** for CLI tools:
1. `test.sh` scripts that compare against system tools
2. Test fixtures in `tests/` directory
3. Manual verification of output format
4. Edge case testing (empty input, large files, special characters)

### Consequences

**Positive:**
- Validates real-world behavior
- Tests actual CLI usage
- Simple test infrastructure
- Clear success criteria

**Negative:**
- Not automated in CI
- Manual verification required
- May miss edge cases

**Example test.sh:**
```bash
#!/bin/bash
# Test wc-tool against system wc

echo "hello world" | ./wc-tool > our_output
echo "hello world" | wc > system_output

diff our_output system_output || exit 1
echo "Test passed!"
```

---

## ADR-010: Progressive Enhancement in Web Challenges

### Status
**Accepted**

### Context
Web challenges should work:
- On modern browsers
- Without server-side dependencies
- With graceful degradation
- As PWAs when possible

### Decision
Apply **progressive enhancement:**
1. Core functionality works everywhere
2. Enhanced features for capable browsers
3. Service workers for offline support
4. Responsive design for all screen sizes
5. No required external services

### Consequences

**Positive:**
- Broad compatibility
- Better UX on modern browsers
- Offline capability
- Mobile-friendly

**Negative:**
- More implementation complexity
- Testing across browsers required
- Feature detection overhead

**Example Pattern:**
```typescript
// Core functionality
function processFile(file: File) {
  // Works everywhere
}

// Progressive enhancement
if ('serviceWorker' in navigator) {
  // Add PWA support
  registerServiceWorker();
}

if ('indexedDB' in window) {
  // Add local storage
  setupIndexedDB();
}
```

---

## Decision Template

For new architectural decisions, use this template:

```markdown
### ADR-XXX: [Decision Title]

**Status:** [Proposed | Accepted | Deprecated | Superseded]

**Context:**
[What is the issue we're facing? What are the constraints?]

**Decision:**
[What did we decide?]

**Consequences:**
- **Positive:** [Benefits]
- **Negative:** [Drawbacks]
- **Neutral:** [Trade-offs]

**Related Decisions:**
- [Links to related ADRs]

**Implementation:**
[How is this decision reflected in the codebase?]
```

---

## Decision Log

| ADR | Date | Status | Topic |
|-----|------|--------|-------|
| 001 | 2026-03-17 | Accepted | Challenge Independence |
| 002 | 2026-03-17 | Accepted | Documentation-First Approach |
| 003 | 2026-03-17 | Accepted | Language Selection by Domain |
| 004 | 2026-03-17 | Accepted | GitHub Pages for Web Challenges |
| 005 | 2026-03-17 | Accepted | Monorepo with Root Orchestration |
| 006 | 2026-03-17 | Accepted | No External Dependencies for System Tools |
| 007 | 2026-03-17 | Accepted | Tutorial-Style Documentation |
| 008 | 2026-03-17 | Accepted | Build Artifact Exclusion |
| 009 | 2026-03-17 | Accepted | Manual Testing for CLI Tools |
| 010 | 2026-03-17 | Accepted | Progressive Enhancement in Web Challenges |

---

## Updating ADRs

When adding or updating ADRs:
1. Use the template above
2. Update the decision log table
3. Update the table of contents
4. Link to code changes that implement the decision
5. Update the "Last Updated" date at the top

---

## Questions or Changes?

If you question an existing decision or propose a change:
1. Review the original context and constraints
2. Consider if circumstances have changed
3. Propose a new ADR that supersedes the old one
4. Document the rationale for the change
5. Keep old ADRs for historical context (mark as "Superseded")
