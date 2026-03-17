# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Quick Reference

| Topic | docs/Agent/ Documentation |
|-------|---------------------------|
| **Project Details** | [PROJECT_DETAILS.md](./docs/Agent/PROJECT_DETAILS.md) - Monorepo structure, tech stack, deployment system |
| **Coding Standards** | [CODING_STANDARDS.md](./docs/Agent/CODING_STANDARDS.md) - Language patterns, testing, git standards |
| **Agent Boundaries** | [AGENT_BOUNDARIES.md](./docs/Agent/AGENT_BOUNDARIES.md) - Action tiers, what requires approval |
| **Architecture Decisions** | [ARCHITECTURE_DECISIONS.md](./docs/Agent/ARCHITECTURE_DECISIONS.md) - 10 key ADRs |

---

## Repository Overview

This is a monorepo containing 94+ coding challenges from [CodingChallenges.fyi](https://codingchallenges.fyi/challenges/intro), plus experimental challenges. Each challenge is an independent project in its own directory (`NN-challenge-name/` or `ex-NN-challenge-name/`).

**Key Characteristics:**
- **Challenge Independence** (ADR-001): Each challenge owns its build system, dependencies, and tech stack
- **Documentation-First** (ADR-002): Tutorial-style docs, 600-900+ lines per file
- **Domain-Driven Language** (ADR-003): C/Rust for systems, Go for network, JS/TS for web
- **GitHub Pages Deployment** (ADR-004): Web challenges get auto-deployed interactive demos

See [INDEX.md](./INDEX.md) for all completed challenges.

## Working with Challenges

### Starting a New Challenge

1. Create/rename numbered folder: `NN-challenge-name/` or `ex-NN-challenge-name/`
2. Fetch requirements from `https://codingchallenges.fyi/challenges/challenge-name/`
3. Create documentation structure:
   - `CHALLENGE.md` - Requirements and specifications
   - `README.md` - Implementation overview and usage
   - `docs/` - Tutorial documentation (implementation.md, examples.md, algorithms.md)
4. Implement with appropriate language/technology
5. Create build system (Makefile, package.json, etc.)
6. Create test suite
7. Update INDEX.md and main README.md

### Build Process for Web Challenges

**IMPORTANT:** Only add build scripts for challenges that REQUIRE compilation (TypeScript, React, Vite, Webpack, etc.). Plain Node.js apps running with `node server.js` do NOT need build scripts.

1. Add to root `package.json`:
   ```json
   "build:challenge-name": "cd challenge-name && pnpm install && pnpm run build",
   "clean:challenge-name": "rm -rf challenge-name/dist challenge-name/node_modules"
   ```
2. Update `build:all` and `clean:all` script chains
3. Create `.gitignore`: `dist/`, `build/`, `node_modules/`
4. Test: `pnpm build:challenge && pnpm deploy:local`

**Never commit build artifacts.** Generated files belong in `.gitignore`, not git.

### GitHub Pages Deployment

Web challenges get automatic deployment with interactive documentation viewers. See [PROJECT_DETAILS.md](./docs/Agent/PROJECT_DETAILS.md) for:
- Deployment system architecture
- Local testing (`pnpm deploy:local`)
- Build script requirements
- URL structure

## Documentation Requirements

Every challenge MUST include:
- **CHALLENGE.md** - Requirements, features, test cases, implementation guide
- **README.md** - Overview, features, build/install, usage, testing
- **docs/** directory - Tutorial-style docs (600-900+ lines each):
  - `implementation.md` - Design decisions, code walkthrough
  - `examples.md` - Practical examples and scenarios
  - `algorithms.md` or `internals.md` - Deep dive into algorithms/architecture

See [CODING_STANDARDS.md](./docs/Agent/CODING_STANDARDS.md) for documentation style guidelines.

## Language Selection

Choose language based on challenge domain (ADR-003):
- **System tools** (wc, shell, grep): C, Rust, Go
- **Network services** (DNS, web servers): Go, Rust
- **Web applications**: JavaScript, TypeScript, React
- **Data processing**: Python, JavaScript
- **Learning objectives**: Personal growth goals

See [CODING_STANDARDS.md](./docs/Agent/CODING_STANDARDS.md) for language-specific patterns.

## Agent Boundaries

Before taking actions, check [AGENT_BOUNDARIES.md](./docs/Agent/AGENT_BOUNDARIES.md):

**Tier 1 - Autonomous** (Just do it):
- Read files, write code, run tests
- Create/update documentation
- Run build scripts, local deployment testing
- Create commits

**Tier 2 - Ask Approval** (Get consent first):
- Delete files or directories
- Modify CLAUDE.md or docs/Agent/ files
- Push commits, create PRs
- Deploy to production

**Tier 3 - Prohibited** (Never do):
- `git push --force`, `git reset --hard`
- Delete `.git` directory
- Commit build artifacts (dist/, build/, node_modules/)

## Testing

- Include tests where appropriate
- Follow language-specific testing patterns in [CODING_STANDARDS.md](./docs/Agent/CODING_STANDARDS.md)
- CLI tools: manual testing scripts (test.sh with Makefile)
- Web challenges: Playwright E2E tests encouraged

## Progress Tracking

When completing a challenge:
1. **INDEX.md**: Add to appropriate category table, update statistics
2. **README.md**: Add to numbered list, update stats
3. **Build scripts** (if needed): Update root package.json
4. **Verify**: CHALLENGE.md, README.md, docs/ exist; web challenges have index.html or dist/

## Key ADRs

- **ADR-001**: Challenge Independence - Each challenge is self-contained
- **ADR-002**: Documentation-First - Tutorial-style, comprehensive docs
- **ADR-003**: Language Selection by Domain - Match language to problem domain
- **ADR-004**: GitHub Pages for Web Challenges - Auto-deployment with interactive viewers
- **ADR-008**: Build Artifact Exclusion - Never commit generated files

See [ARCHITECTURE_DECISIONS.md](./docs/Agent/ARCHITECTURE_DECISIONS.md) for all 10 ADRs.
