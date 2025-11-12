# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

This is a monorepo containing implementations for 94 coding challenges from [CodingChallenges.fyi](https://codingchallenges.fyi/challenges/intro). Each challenge lives in its own numbered directory (e.g., `01-wc-tool`, `14-shell`) and may use different programming languages and technologies based on what's most appropriate for the challenge.

## Repository Structure

- Each challenge has a dedicated folder: `NN-challenge-name/` (e.g., `14-shell/`, `01-wc-tool/`)
- Challenges are independent projects with their own build systems, dependencies, and documentation
- Currently only `14-shell` has been implemented
- The root README.md tracks overall progress across all 94 challenges

## Working with Challenges

### Starting a New Challenge

When implementing a new challenge:
1. Navigate to or create the appropriate numbered folder (e.g., `01-wc-tool/`)
2. Fetch the challenge details from `https://codingchallenges.fyi/challenges/challenge-name/`
3. Create the required documentation structure:
   - `challenge.md` - Challenge requirements and specifications
   - `README.md` - Implementation documentation
   - `docs/` directory with tutorial-style documentation
4. Implement the solution in the appropriate language/technology
5. Create build system (Makefile, package.json, etc.)
6. Create comprehensive test suite
7. Update the root README.md to mark progress (update the completed count and add ✓ to the challenge)

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

## Reference Implementation: 14-shell

The shell implementation provides a good example of challenge structure:

### Build Commands (14-shell)
```bash
cd 14-shell

# Standard build
make all

# Static binary (Linux/BSD only, limited on macOS)
make static

# Debug build
make debug

# Run tests
make test

# Clean build artifacts
make clean

# Check dependencies and configuration
make check-deps

# Automated build with dependency installation
./build-and-package.sh -a

# Create distribution package
./build-and-package.sh -p
```

### Project Structure Pattern (14-shell)
```
14-shell/
├── main.c                   # Main implementation
├── Makefile                 # Cross-platform build config
├── build-and-package.sh     # Automated build/package script
├── test.sh                  # Test suite
├── README.md                # Challenge-specific documentation
└── docs/                    # Additional documentation
```

### Cross-Platform Considerations (14-shell)

The shell project demonstrates cross-platform support for:
- macOS (Darwin)
- Linux distributions (Ubuntu, Debian, CentOS, RHEL, Fedora, Arch)
- BSD variants (FreeBSD, OpenBSD, NetBSD)

The Makefile auto-detects the platform and configures appropriate compiler flags and library dependencies. This pattern can be adapted for other C-based challenges.

## Documentation Standards

Each challenge MUST include the following documentation:

### Required Files

1. **challenge.md** - Challenge specification and requirements
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
├── challenge.md           # Challenge requirements (required)
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

See these challenges for documentation examples:
- `07-calculator/` - Shunting Yard algorithm implementation
- `08-redis-server/` - RESP protocol and server architecture
- `09-grep/` - Regular expressions and pattern matching
- `26-git/` - Git internals and object model

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
1. Update the root README.md:
   - Increment the "Completed" count in the Progress section
   - Add a ✓ symbol next to the completed challenge in the list
2. Ensure the challenge folder has proper documentation
