# Agent Boundaries: Coding Challenges

**Last Updated:** 2026-03-17

This document defines action boundaries and safeguards for AI assistants working on the coding-challenges repository. It prevents accidental damage while enabling efficient autonomous work.

---

## Action Tiers

### Tier 1: Autonomous Actions

These actions are safe and can be performed without asking for permission:

| Action | Examples | Notes |
|--------|----------|-------|
| Read files | Viewing any code, docs, configs | No restrictions |
| Write new challenge files | Creating new challenge implementations | Follow directory structure |
| Edit existing code | Fixing bugs, adding features | Within single challenge directory |
| Run tests | Test scripts, make test, npm test | Non-destructive |
| Create documentation | CHALLENGE.md, README.md, docs/ | Educational content |
| Run build commands | pnpm build, make, gcc | Local compilation only |
| Create .gitignore | For new challenges | Standard templates |
| Update INDEX.md | Adding completed challenges | Keep format consistent |
| Add to package.json | Build scripts for new challenges | Follow existing pattern |
| Use Bash for exploration | ls, find, grep, cat (read-only) | Information gathering |

### Tier 2: Require Approval

These actions MUST have user confirmation before proceeding:

| Action | Risk | Why Approval Needed |
|--------|------|---------------------|
| Delete files/directories | Data loss | Cannot easily recover |
| Modify root CLAUDE.md | Breaking AI guidance | Critical configuration |
| Modify docs/Agent/ files | Breaking AI standards | Critical documentation |
| Run git push | Publishes changes publicly | Irversible on shared repos |
| Create git branches | Branch proliferation | May confuse workflow |
| Merge branches | History rewrite potential | Can cause conflicts |
| Modify build scripts | Breaking deployment | Affects all challenges |
| Modify .github/scripts/ | Breaking CI/CD | Affects automation |
| Run git reset/rebase | History loss | Cannot undo easily |
| Modify package.json (root) scripts | Breaking build orchestration | Affects all builds |
| Install global packages | System-level changes | Affects host environment |
| Run deploy commands | Publishes to GitHub Pages | Public-facing changes |
| Modify existing INDEX.md entries | Breaking consistency | Affects documentation structure |
| Create symlinks | Security/complexity | Can cause confusion |
| Execute downloaded scripts | Security risk | Untrusted code |

### Tier 3: Prohibited Actions

These actions must NEVER be performed:

| Action | Reason |
|--------|--------|
| git push --force | Rewrites public history |
| Delete .git directory | Destroys repository |
| Commit build artifacts | Violates repository standards |
| rm -rf on challenge directories | Catastrophic data loss |
| Modify git history (filter-branch, etc) | Breaks collaboration |
| Publish API keys or secrets | Security vulnerability |
| Disable git hooks | Bypasses safety checks |

---

## Context-Specific Rules

### When Working on Challenges

#### Autonomous (Tier 1)
- Create new challenge directory structure
- Implement challenge code
- Write tests
- Create documentation (CHALLENGE.md, README.md, docs/)
- Build and test locally
- Update INDEX.md for newly completed challenges
- Add build scripts to root package.json

#### Requires Approval (Tier 2)
- Delete an existing challenge directory
- Modify completed challenge code (ask if this is intended)
- Run deploy scripts
- Create PRs (use your best judgment based on context)

#### Prohibited (Tier 3)
- Commit build artifacts (dist/, build/, node_modules/)
- Modify another user's work without explicit request

### When Working on Deployment

#### Autonomous (Tier 1)
- Read deployment scripts
- Test deployment locally (pnpm deploy:local)
- Preview built site (python3 -m http.server)

#### Requires Approval (Tier 2)
- Run pnpm deploy (builds and commits to gh-pages branch)
- Push to gh-pages branch
- Modify .github/scripts/ files
- Modify DOCS/deployment/ files

### When Working on Documentation

#### Autonomous (Tier 1)
- Create/edit challenge-specific docs
- Update INDEX.md for new challenges
- Edit README.md for clarifications

#### Requires Approval (Tier 2)
- Modify CLAUDE.md (main AI guidance)
- Modify docs/Agent/ files (this directory)
- Change overall project structure documentation

---

## Challenge-Specific Guidelines

### Starting a New Challenge

**Autonomous Actions:**
```
1. Check if challenge number/name exists
2. Create directory: NN-challenge-name/ or ex-NN-challenge-name/
3. Fetch requirements from codingchallenges.fyi
4. Create CHALLENGE.md with requirements
5. Set up build system (Makefile, package.json, etc.)
6. Create docs/ directory structure
7. Begin implementation
8. Write tests
9. Create documentation in docs/
10. Update INDEX.md with completion
```

**Ask for Approval if:**
- Challenge directory already exists (confirm overwrite/intention)
- Need to modify existing challenge structure
- Installing system-level dependencies

### Modifying Existing Challenges

**Autonomous (Tier 1):**
- Bug fixes within a single challenge
- Adding features as requested
- Improving documentation
- Adding tests

**Requires Approval (Tier 2):**
- Deleting challenge directory
- Major refactoring that changes structure
- Removing features
- Changing language/tech stack

### Web Challenges

**Autonomous (Tier 1):**
- Create index.html or build setup
- Add build scripts to root package.json
- Create .gitignore
- Implement features
- Test locally

**Requires Approval (Tier 2):**
- Run pnpm deploy (actual deployment)
- Modify deployment scripts
- Change to GitHub Pages structure

---

## Error Recovery Guidelines

### When Something Goes Wrong

1. **STOP** - Don't continue with failing approach
2. **ASSESS** - What went wrong? What's the risk?
3. **RECOVER** - Use git status to see changes
4. **REPLAN** - Ask if approach should change

### Safe Recovery Commands

```bash
# Check what changed
git status

# Discard uncommitted changes (if safe)
git restore <file>

# Stash changes for later
git stash

# Undo recent commits (if not pushed)
git reset --soft HEAD~1
```

### When to Ask for Help

- Unsure if action is Tier 1 or Tier 2
- Unexpected error messages
- Conflicting instructions
- Need to modify critical files (CLAUDE.md, docs/Agent/, build scripts)
- Deployment-related actions

---

## Decision Framework

### Quick Decision Tree

```
Is this action in a challenge directory?
├─ Yes
│  ├─ Is it creating/editing code or docs?
│  │  ├─ Yes → Autonomous (Tier 1)
│  │  └─ Is it deleting files?
│  │     └─ Yes → Ask approval (Tier 2)
│  └─ Is it running tests or builds?
│     └─ Yes → Autonomous (Tier 1)
└─ No (root level or across challenges)
   ├─ Is it reading files?
   │  └─ Yes → Autonomous (Tier 1)
   ├─ Is it updating INDEX.md for new work?
   │  └─ Yes → Autonomous (Tier 1)
   ├─ Is it CLAUDE.md or docs/Agent/?
   │  └─ Yes → Ask approval (Tier 2)
   ├─ Is it build/deploy related?
   │  ├─ Local test → Autonomous (Tier 1)
   │  └─ Actual deploy → Ask approval (Tier 2)
   └─ Is it git operations?
      ├─ commit → Autonomous (Tier 1)
      ├─ push → Ask approval (Tier 2)
      └─ reset/rebase → Ask approval (Tier 2)
```

### When in Doubt

If you're unsure whether an action requires approval:
1. Consider the potential impact if something goes wrong
2. Check if the action is reversible
3. When uncertain, **ask for approval**

Better to ask and be told "go ahead" than to cause problems.

---

## Special Scenarios

### "Fix This Bug"

When asked to fix a bug:
1. **Autonomous:** Read relevant files, understand the bug
2. **Autonomous:** Propose and implement fix
3. **Autonomous:** Run tests to verify
4. **Ask approval:** Create commit or PR (depends on context)

### "Add Feature to Challenge X"

When asked to add features:
1. **Autonomous:** Read challenge code and docs
2. **Autonomous:** Implement feature
3. **Autonomous:** Write/update tests
4. **Autonomous:** Update documentation
5. **Ask approval:** If changes are extensive or structural

### "Deploy This"

When asked to deploy:
1. **Autonomous:** Test locally (pnpm deploy:local)
2. **Ask approval:** Before running pnpm deploy
3. **Confirm:** Show what will be deployed

### "Update Documentation"

When asked to update docs:
1. **Autonomous:** Update challenge-specific docs
2. **Ask approval:** If modifying CLAUDE.md or docs/Agent/

---

## Project-Specific Risks

### Build Artifacts

**Risk:** Committing dist/, build/, node_modules/ bloats repository and causes merge conflicts.

**Prevention:**
- Always create .gitignore for buildable challenges
- Review git status before committing
- Never add build output directories

**Recovery:**
```bash
# Remove from git tracking
git rm -r --cached dist/
git rm -r --cached build/
git rm -r --cached node_modules/

# Add to .gitignore
echo "dist/" >> .gitignore
echo "build/" >> .gitignore
```

### GitHub Pages Deployment

**Risk:** Incorrect deployment scripts break the live site.

**Prevention:**
- Test locally first (pnpm deploy:local)
- Review build output before pushing
- Only modify deployment scripts with approval

**Recovery:**
- Use git revert on gh-pages branch
- Restore from previous working commit

### Cross-Challenge Dependencies

**Risk:** Each challenge should be independent. Don't create dependencies between challenges.

**Prevention:**
- Never import code from another challenge
- Each challenge has its own node_modules/
- Shared utilities go in root package.json scripts, not as runtime dependencies

---

## Communication Patterns

### When to Ask

**Always ask before:**
- Deleting anything more than a single file
- Modifying CLAUDE.md or docs/Agent/
- Running git push
- Deploying to production
- Installing global packages

**Optional to ask (use judgment):**
- Creating PRs
- Making extensive refactors
- Changing approach mid-implementation

### How to Ask

**Good asking pattern:**
```
I'm about to [action]. This will [expected outcome].
There's a risk of [potential issue].
Should I proceed?
```

**Example:**
```
I'm about to delete the dist/ directory in ex-05-browser-ide-v1.
This will clean up build artifacts.
The risk is low - these can be rebuilt.
Should I proceed?
```

---

## Review Checklist

Before performing Tier 2 actions, verify:

- [ ] User has explicitly requested or approved this action
- [ ] I understand the potential impact
- [ ] I have a recovery plan if something goes wrong
- [ ] I've communicated what I'm about to do
- [ ] For git operations: checked git status first
- [ ] For deletions: confirmed files aren't needed
- [ ] For builds: reviewed what will be built
- [ ] For deployment: tested locally first

---

## Summary

**Remember:**
- Tier 1 (Autonomous): Most development work
- Tier 2 (Ask first): Destructive, publishing, or critical changes
- Tier 3 (Never): Irreversible damage to repo or history

**When in doubt: ASK**
**When something goes wrong: STOP and ASSESS**
**Better to be cautious than to break things**
