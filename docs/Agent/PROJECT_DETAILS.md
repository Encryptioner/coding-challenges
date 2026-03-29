# Project Details: Coding Challenges

**Last Updated:** 2026-03-17

## Project Overview

This is a monorepo containing implementations for coding challenges from [CodingChallenges.fyi](https://codingchallenges.fyi/challenges/intro) plus additional experimental challenges. Each challenge is a self-contained project that demonstrates practical programming skills across various domains.

**Current Status:**
- CodingChallenges.fyi: 24/94 completed (25.5%)
- Extra Challenges: 6/7 completed (85.7%)
- Total: 30 completed challenges

**Repository:** [github.com/Encryptioner/coding-challenges](https://github.com/Encryptioner/coding-challenges)

---

## Monorepo Structure

```
coding-challenges/
├── NN-challenge-name/          # Numbered challenges from CodingChallenges.fyi
│   ├── CHALLENGE.md            # Challenge requirements (required)
│   ├── README.md               # Implementation overview (required)
│   ├── main.c / main.py        # Main implementation
│   ├── Makefile / package.json # Build system
│   ├── test.sh / test/         # Test suite
│   ├── docs/                   # Tutorial documentation (required)
│   │   ├── implementation.md   # Design and code walkthrough
│   │   ├── examples.md         # Practical usage examples
│   │   └── algorithms.md       # Deep dive into algorithms/architecture
│   └── static/                 # Assets (for web challenges)
│       ├── css/
│       ├── js/
│       └── images/
│
├── ex-NN-challenge-name/       # Extra experimental challenges (same structure)
│
├── .github/
│   ├── scripts/                # Build and deployment scripts
│   │   ├── build-site.sh       # Main build orchestrator
│   │   ├── generate-index.py   # Create main index
│   │   ├── generate-interactive-viewer.py  # Split-pane viewers
│   │   └── generate-docs-pages.py          # Markdown to HTML
│   └── workflow-templates/     # GitHub workflow templates
│
├── DOCS/
│   └── deployment/             # GitHub Pages deployment documentation
│
├── docs/Agent/                 # AI assistant coding standards (this directory)
│   ├── PROJECT_DETAILS.md      # This file
│   ├── CODING_STANDARDS.md     # Coding patterns and conventions
│   ├── AGENT_BOUNDARIES.md     # Action boundaries and safeguards
│   └── ARCHITECTURE_DECISIONS.md  # Key architectural decisions
│
├── INDEX.md                    # Comprehensive challenge index
├── README.md                   # Main repository README
├── CLAUDE.md                   # AI assistant guidance
└── package.json                # Root package.json for build orchestration
```

---

## Challenge Types

### System Tools & CLI Utilities
**Examples:** `01-wc-tool`, `02-json-parser`, `04-cut-tool`, `09-grep`, `14-shell`, `26-git`

**Characteristics:**
- Low-level languages (C, Rust, Go)
- Direct system calls and file I/O
- Manual memory management (C)
- Command-line argument parsing
- Standard input/output handling

**Common Patterns:**
- Buffer management and allocation
- String parsing and validation
- Error handling and exit codes
- Signal handling (for shells/daemons)

### Network & Communication
**Examples:** `05-load-balancer`, `17-memcached-server`, `19-discord-bot`, `22-dns-resolver`, `90-smtp-server`

**Characteristics:**
- Socket programming (TCP/UDP)
- Protocol implementation (HTTP, DNS, SMTP, IRC)
- Concurrency and async I/O
- Client-server architecture

**Common Patterns:**
- Connection pooling and management
- Request/response parsing
- Rate limiting and throttling
- Graceful shutdown handling

### Web Applications
**Examples:** `ex-04-mobile-ide-app`, `ex-05-browser-ide-v1`, `ex-07-photo-watermark-remover`

**Characteristics:**
- Modern frontend frameworks (React, Vue)
- TypeScript for type safety
- Build tools (Vite, Webpack)
- PWA capabilities

**Common Patterns:**
- Component-based architecture
- State management (Pinia, Redux)
- Service workers for offline support
- IndexedDB for local storage

### Development Tools
**Examples:** `07-calculator`, `43-tetris`, `47-chrome-extension`, `77-static-site-generator`

**Characteristics:**
- DOM manipulation
- Event-driven architecture
- Browser APIs (Storage, Canvas, etc.)
- Extension manifests (for Chrome extensions)

---

## Technology Stack by Challenge Type

### C Challenges (9 completed)
- **Tools:** `gcc`, `make`, `gdb`
- **Libraries:** Standard C library, POSIX APIs
- **Testing:** Custom test.sh scripts
- **Documentation:** Markdown in docs/

**Examples:** `01-wc-tool`, `02-json-parser`, `03-compression-tool`, `04-cut-tool`, `07-calculator`, `08-redis-server`, `09-grep`, `14-shell`, `26-git`

### Go Challenges (5 completed)
- **Tools:** `go`, `go fmt`
- **Libraries:** Standard library (net, http, etc.)
- **Testing:** `go test`
- **Documentation:** Go doc comments

**Examples:** `05-load-balancer`, `17-memcached-server`, `22-dns-resolver`, `90-smtp-server`, `93-rate-limiter`

### JavaScript/Node.js Challenges (11+ completed)
- **Tools:** `node`, `npm`/`pnpm`
- **Libraries:** Native APIs, minimal dependencies
- **Testing:** Various (tap, jest, custom)
- **Documentation:** JSDoc, Markdown

**Examples:** `19-discord-bot`, `43-tetris`, `47-chrome-extension`, `69-notion`, `76-video-chat-app`, `77-static-site-generator`, `80-optical-character-recognition`, `82-markdown-to-pdf`, `83-markdown-presentation-tool`, plus all ex-* challenges

### Python Challenges (1 completed)
- **Tools:** `python3`, `pip`
- **Libraries:** Standard library
- **Testing:** `unittest` or custom
- **Documentation:** Docstrings, Markdown

**Examples:** `53-spell-checker-bloom-filter`

### TypeScript/React Challenges (3 completed)
- **Tools:** `typescript`, `vite`, `pnpm`
- **Libraries:** React, Monaco Editor, OpenCV.js, Capacitor
- **Testing:** `vitest`, `jest`
- **Documentation:** TSDoc, Markdown

**Examples:** `ex-04-mobile-ide-app`, `ex-05-browser-ide-v1`, `ex-07-photo-watermark-remover`

---

## GitHub Pages Deployment

### Deployment System

**Location:** `.github/scripts/`, `DOCS/deployment/`

**Features:**
- Main index page with filterable challenge grid
- Interactive split-pane documentation viewers for web challenges
- Automatic markdown-to-HTML conversion
- Live demos embedded in iframes
- Mobile-responsive design

**Scripts:**
- `build-site.sh` - Main build orchestrator
- `generate-index.py` - Creates main index from README.md
- `generate-interactive-viewer.py` - Builds split-pane viewers
- `generate-docs-pages.py` - Converts markdown documentation
- `extract-web-challenges.py` - Identifies web-deployable challenges

**Documentation:**
- `DOCS/deployment/SETUP.md` - First-time setup
- `DOCS/deployment/WORKFLOW.md` - Quick workflow reference
- `DOCS/deployment/DEPLOYMENT.md` - Complete deployment guide

### Web Challenge Detection

A challenge is considered "web-deployable" if:
1. Has `index.html` file at root OR
2. Has `dist/` or `build/` output directory (from build process) OR
3. Has package.json with build scripts

### Build Process

For challenges requiring compilation (TypeScript, React, Vite):

1. **Root package.json orchestration:**
   - `install:all` - Install dependencies for all buildable challenges
   - `build:all` - Build all challenges in sequence
   - `build:challenge-name` - Individual build script
   - `clean:all` - Clean all build artifacts
   - `clean:challenge-name` - Individual clean script

2. **Example pattern:**
```json
{
  "install:all": "pnpm run install:ex-04 && pnpm run install:ex-05",
  "build:all": "pnpm run build:ex-04 && pnpm run build:ex-05",
  "build:ex-05": "cd ex-05-browser-ide-v1 && pnpm install && pnpm run build",
  "clean:ex-05": "rm -rf ex-05-browser-ide-v1/dist ex-05-browser-ide-v1/node_modules"
}
```

3. **Always create .gitignore** for buildable challenges:
```
dist/
build/
lib/
src-gen/
node_modules/
coverage/
*.log
.env
```

### Deployment URL Structure
```
https://[username].github.io/coding-challenges/
├── /                            # Main index
├── /NN-challenge-name/          # Challenge viewer
│   ├── index.html               # Interactive viewer
│   ├── app.html                 # Live demo (iframe)
│   ├── README.html              # Overview docs
│   └── docs/*.html              # Tutorial docs
```

---

## Documentation Standards

### Required Files

Each challenge MUST include:

1. **CHALLENGE.md** - Challenge requirements
   - Original challenge description
   - Features to implement
   - Test cases and acceptance criteria
   - Step-by-step implementation guide
   - Links to resources

2. **README.md** - Implementation overview
   - Overview paragraph
   - Feature list with checkmarks
   - Build/installation instructions
   - Usage examples with code blocks
   - Command-line options and flags
   - Platform-specific notes
   - Testing instructions
   - Project structure

3. **docs/** - Tutorial documentation
   - `implementation.md` - Design decisions and code walkthrough
   - `examples.md` - Practical usage examples
   - `algorithms.md` or `internals.md` - Deep dive into algorithms

### Documentation Style

- **Tutorial style:** Explain concepts, not just facts
- **Clear headings:** Use descriptive section titles
- **Code examples:** Include syntax-highlighted snippets
- **Tables:** For comparing options/features
- **Troubleshooting:** Include where relevant
- **Cross-references:** Link between documents
- **Aim for depth:** 600-900+ lines per doc file for thorough coverage

---

## Testing Approach

### C Challenges
- Custom `test.sh` scripts
- Comparison against reference implementations (e.g., system `wc`, `grep`)
- Input/output validation
- Edge case testing

### Go Challenges
- `go test` with table-driven tests
- Benchmark tests for performance-critical code
- Example tests for documentation

### JavaScript/Node.js Challenges
- Various testing frameworks (tap, jest, mocha)
- Integration tests for network tools
- Manual testing via CLI

### TypeScript/React Challenges
- Unit tests with `vitest` or `jest`
- Component tests
- E2E tests for critical user flows

---

## Key File Locations

| Purpose | Location |
|---------|----------|
| Challenge implementations | `NN-challenge-name/` or `ex-NN-challenge-name/` |
| Documentation | `NN-challenge-name/docs/` |
| Deployment scripts | `.github/scripts/` |
| Deployment docs | `DOCS/deployment/` |
| AI standards | `docs/Agent/` (this directory) |
| Challenge index | `INDEX.md` |
| Main README | `README.md` |
| AI guidance | `CLAUDE.md` |
| Root package.json | `package.json` (build orchestration) |

---

## Development Workflow

### Starting a New Challenge

1. **Check if challenge exists:**
   - Numbered folders for CodingChallenges.fyi
   - `ex-NN-*` for experimental challenges

2. **Fetch requirements:**
   - Visit `https://codingchallenges.fyi/challenges/challenge-name/`
   - Read the challenge description carefully

3. **Create structure:**
   - Create `NN-challenge-name/` directory
   - Create `CHALLENGE.md` with requirements
   - Set up build system (Makefile, package.json, etc.)
   - Create `docs/` directory

4. **Implement:**
   - Follow language-specific patterns
   - Write tests as you go
   - Document decisions in docs/

5. **For web challenges:**
   - Add build scripts to root `package.json`
   - Create `.gitignore`
   - Ensure `index.html` or build output exists

6. **Update tracking:**
   - Update `INDEX.md` with challenge details
   - Update main `README.md`
   - Add to deployable list if web challenge

### Testing Locally

```bash
# Build all challenges
pnpm install:all
pnpm build

# Build specific challenge
pnpm build:ex-05

# Test deployment locally
pnpm deploy:local
# or
./DOCS/deployment/deploy-github-pages.sh

# Preview built site
cd dist && python3 -m http.server 8000
```

---

## Common Patterns

### C Challenge Pattern
```c
// main.c
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

int main(int argc, char *argv[]) {
    // Parse arguments
    // Allocate buffers
    // Process input
    // Handle errors
    // Clean up
    return 0;
}
```

### Go Challenge Pattern
```go
// main.go
package main

import (
    "fmt"
    "os"
)

func main() {
    // Parse flags
    // Setup servers/clients
    // Handle signals
    // Graceful shutdown
}
```

### TypeScript/React Pattern
```typescript
// src/App.tsx
import { useState, useEffect } from 'react';

function App() {
  const [state, setState] = useState(initialState);

  useEffect(() => {
    // Setup/cleanup
  }, []);

  return (
    <div className="app">
      {/* Components */}
    </div>
  );
}
```

---

## Important Notes

1. **Challenge Independence:** Each challenge is self-contained with its own build system and dependencies
2. **Language Choice:** Use the most appropriate language for the challenge type
3. **Documentation Quality:** This is a learning resource—docs should be educational and thorough
4. **No Build Artifacts:** Never commit `dist/`, `build/`, `node_modules/`, or compiled binaries
5. **Gitignore:** Always create proper `.gitignore` for buildable challenges
6. **Testing:** Include tests appropriate to the challenge type
7. **Index Updates:** Always update `INDEX.md` and `README.md` when completing challenges
