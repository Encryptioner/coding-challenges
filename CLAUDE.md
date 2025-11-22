# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

This is a monorepo containing implementations for 94 coding challenges from [CodingChallenges.fyi](https://codingchallenges.fyi/challenges/intro), plus additional experimental challenges. Each challenge lives in its own numbered directory (e.g., `01-wc-tool`, `14-shell`) or prefixed with `ex-` for experimental challenges. Challenges may use different programming languages and technologies based on what's most appropriate for the task.

## Repository Structure

- **CodingChallenges.fyi challenges:** Numbered folders `NN-challenge-name/` (e.g., `14-shell/`, `01-wc-tool/`)
- **Extra challenges:** Folders prefixed with `ex-NN-challenge-name/` (e.g., `ex-01-div-copy-extension/`)
- Each challenge is an independent project with its own build system, dependencies, and documentation
- Web-based challenges can be deployed to GitHub Pages for live demos
- See [INDEX.md](./INDEX.md) for a comprehensive list of completed challenges

## GitHub Pages Deployment

This repository includes an automated GitHub Pages deployment system that creates an interactive website showcasing all challenges.

### Deployment System Overview

**Location:** `.github/pages/`, `.github/scripts/`, `.github/workflow-templates/`

**Features:**
- Main index page with filterable challenge grid
- Interactive split-pane documentation viewers for web challenges
- Automatic markdown-to-HTML conversion
- Live demos embedded in iframes
- Mobile-responsive design

**Scripts:**
- `DOCS/deployment/deploy-github-pages.sh` - Local deployment verification and testing
- `DOCS/deployment/enable-auto-deploy.sh` - Guide for activating auto-deployment
- `.github/scripts/build-site.sh` - Main build orchestrator
- `.github/scripts/generate-index.py` - Creates main index from README.md
- `.github/scripts/generate-interactive-viewer.py` - Builds split-pane viewers
- `.github/scripts/generate-docs-pages.py` - Converts markdown documentation

**Testing Deployment Locally:**
```bash
# Verify deployment is ready
./DOCS/deployment/deploy-github-pages.sh

# Build site manually
.github/scripts/build-site.sh

# Preview locally
cd dist && python3 -m http.server 8000
```

**Deployment Documentation:**
- `DOCS/deployment/SETUP.md` - First-time setup and activation
- `DOCS/deployment/WORKFLOW.md` - Quick workflow reference
- `DOCS/deployment/DEPLOYMENT.md` - Complete deployment guide

### Web-Based Challenges

Web-based challenges (those with browser implementations) get special treatment in deployment:

**Structure for Web Challenges:**
```
NN-challenge-name/
├── index.html              # Main app (required for live demo)
├── README.md               # Overview documentation
├── CHALLENGE.md            # Challenge requirements
├── docs/                   # Tutorial documentation
│   ├── implementation.md
│   ├── examples.md
│   └── algorithms.md
└── static/                 # Assets (CSS, JS, images)
    ├── css/
    ├── js/
    └── images/
```

**Adding a Web Challenge to Deployment:**

1. Implement the challenge with an `index.html` file
2. Add to `.github/scripts/build-site.sh`:
   ```bash
   declare -A WEB_CHALLENGES=(
     # ... existing challenges ...
     ["NN-challenge-name"]="Display Name"
   )
   ```
3. Ensure documentation files exist (README.md, CHALLENGE.md, docs/)
4. Test locally: `./deploy-github-pages.sh`

**Deployed URL Structure:**
```
https://[username].github.io/coding-challenges/
├── /                            # Main index (all challenges)
├── /NN-challenge-name/          # Interactive viewer
│   ├── index.html               # Viewer entry point
│   ├── app.html                 # Live implementation
│   ├── README.html              # Overview docs
│   └── docs/*.html              # Tutorial docs
```

**Current Web Challenges:**
See [INDEX.md](./INDEX.md) for the complete list of web-deployable challenges.

### Deployment Documentation

**Key Files:**
- `DOCS/deployment/SETUP.md` - First-time setup and activation
- `DOCS/deployment/WORKFLOW.md` - Daily workflow reference
- `DOCS/deployment/DEPLOYMENT.md` - Complete deployment guide
- `.github/README.md` - GitHub configuration overview

**When Working on Challenges:**
- For web challenges: Consider adding to GitHub Pages deployment
- For CLI tools: Focus on comprehensive README and docs/
- All challenges: Create CHALLENGE.md, README.md, and docs/ directory
- Test locally before pushing if adding to deployment

## Working with Challenges

### Starting a New Challenge

When implementing a new challenge:
1. Navigate to or create the appropriate numbered folder (e.g., `01-wc-tool/`) or experimental folder (`ex-NN-challenge-name/`)
2. For CodingChallenges.fyi challenges: Fetch details from `https://codingchallenges.fyi/challenges/challenge-name/`
3. Create the required documentation structure:
   - `CHALLENGE.md` - Challenge requirements and specifications (uppercase)
   - `README.md` - Implementation documentation
   - `docs/` directory with tutorial-style documentation
4. Implement the solution in the appropriate language/technology
5. Create build system (Makefile, package.json, etc.)
6. Create comprehensive test suite
7. Update `INDEX.md` & add the challenge to INDEX.md with summary details

### Challenge Independence

Each challenge is self-contained:
- Has its own build system (Makefile, package.json, Cargo.toml, etc.)
- Manages its own dependencies
- Contains its own documentation
- May use a different tech stack than other challenges

### Language and Technology Choice

Challenges can be implemented in any appropriate language. Consider:
- The nature of the challenge (systems programming → C/Rust, web → JS/Go, etc.)
- Learning objectives
- Platform compatibility requirements

### Instructions

Challenges should be implemented as tutorial style. Consider:
- Be concise. Implement like a top class software engineer and teacher
- Adding necessary doc. However, it must not be overwhelming and unnecessary long

## Documentation Standards

Each challenge MUST include the following documentation:

### Required Files

1. **CHALLENGE.md** - Challenge specification and requirements
   - Original challenge description and goals
   - Features to implement
   - Test cases and acceptance criteria
   - Step-by-step implementation guide
   - Links to related resources

2. **README.md** - Implementation documentation
   - Overview of the implementation
   - Feature list with checkmarks
   - Build/installation instructions
   - Usage examples with code blocks
   - Command-line options and flags
   - Platform-specific notes (if applicable)
   - Testing instructions
   - Project structure explanation

3. **docs/** - Tutorial-style documentation directory
   - Each challenge should have comprehensive tutorial documentation
   - Typical docs include:
     - `implementation.md` - Design decisions and code walkthrough
     - `examples.md` - Practical usage examples and scenarios
     - `algorithms.md` or `internals.md` - Deep dive into algorithms/architecture
   - Documentation should be educational and approachable
   - Include code examples, diagrams (ASCII art), and step-by-step explanations
   - Aim for 600-900+ lines per doc file for thorough coverage

### Documentation Style

- Write in tutorial style: explain concepts, not just facts
- Use clear headings and table of contents
- Include practical examples with expected output
- Add code snippets with syntax highlighting (markdown)
- Use tables for comparing options/features
- Include troubleshooting sections where relevant
- Cross-reference between documents

### Example Structure

```
NN-challenge-name/
├── CHALLENGE.md           # Challenge requirements (required)
├── README.md              # Implementation overview (required)
├── main.c / main.py       # Main implementation
├── Makefile / build files # Build system
├── test.sh                # Test suite
└── docs/                  # Tutorial documentation (required)
    ├── implementation.md  # Design and code walkthrough
    ├── examples.md        # Practical examples
    └── algorithms.md      # Deep dive into algorithms
```

### Reference Implementations

See [INDEX.md](./INDEX.md) for best documented challenges and reference implementations.

## Testing

Challenges should include tests where appropriate. The 14-shell project uses a `test.sh` script that can be run via `make test`.

## Distribution and Packaging

For distributable tools, follow the 14-shell pattern:
- Use `build-and-package.sh` script to create distribution packages
- Include installation/uninstallation scripts
- Generate tar.gz archives with checksums
- Package all necessary documentation

## Progress Tracking

When completing a challenge:
1. Update `INDEX.md` file only:
   - Add the challenge to the appropriate category table
   - Include challenge number, name, description, and tech stack
   - Ensure statistics are updated
2. Ensure the challenge folder has proper documentation (CHALLENGE.md, README.md, docs/)
