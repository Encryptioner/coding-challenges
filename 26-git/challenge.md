# Challenge: Build Your Own Git

**Source:** [CodingChallenges.fyi - Git Challenge](https://codingchallenges.fyi/challenges/challenge-git)

## Overview

Build your own version of Git - the distributed version control system. This challenge will teach you about how Git works internally, including the object model, staging area, and commit history.

## Challenge Description

Git is a distributed version control system that tracks changes in source code during software development. Understanding Git's internals helps you:
- Use Git more effectively
- Debug Git issues
- Build better dev tools
- Understand version control concepts

## What is Git?

Git is fundamentally a **content-addressable filesystem** with a VCS (Version Control System) on top. At its core:

1. **Everything is content-addressed** - Files are stored by their SHA-1 hash
2. **Objects are immutable** - Once stored, objects never change
3. **References point to objects** - Branches are just pointers
4. **History is a DAG** - Directed Acyclic Graph of commits

## Difficulty Levels

### Easy Mode
Use existing Git libraries or wrappers to build a simplified Git client.

### Medium Mode
Implement core Git features from scratch:
- Repository initialization
- Adding files to staging area
- Creating commits
- Reading commit history

### Hard Mode
Implement advanced features:
- Branching and merging
- Remote repositories
- Conflict resolution
- Pack files and compression

## Steps

### Step 0: Setup

Set up your development environment:

```bash
# Create test directory
mkdir git-test
cd git-test

# Have real Git available for comparison
which git
```

### Step 1: Initialize Repository

Create a Git repository structure:

```bash
mygit init
```

Should create:
```
.git/
├── HEAD               # Points to current branch
├── config             # Repository configuration
├── description        # Repository description
├── objects/           # Object database
│   ├── info/
│   └── pack/
├── refs/              # References (branches, tags)
│   ├── heads/         # Local branches
│   └── tags/          # Tags
└── hooks/             # Git hooks
```

**HEAD file:**
```
ref: refs/heads/main
```

**config file:**
```ini
[core]
    repositoryformatversion = 0
    filemode = true
    bare = false
```

### Step 2: Hash Object

Implement `hash-object` - convert a file to a Git blob object:

```bash
mygit hash-object -w myfile.txt
```

**Process:**
1. Read file content
2. Create header: `"blob {size}\0"`
3. Combine header + content
4. Calculate SHA-1 hash
5. Compress with zlib
6. Store in `.git/objects/ab/cdef123...`

**Example:**
```
File content: "hello world\n"
Header: "blob 12\0"
Combined: "blob 12\0hello world\n"
SHA-1: 3b18e512dba79e4c8300dd08aeb37f8e728b8dad
Store at: .git/objects/3b/18e512dba79e4c8300dd08aeb37f8e728b8dad
```

### Step 3: Update Index

Add file to staging area (index):

```bash
mygit add myfile.txt
```

**Index format:**
- Binary file at `.git/index`
- Contains list of staged files with:
  - File path
  - SHA-1 hash
  - File mode
  - Timestamps

**Simplified approach:**
Store index as text file with:
```
100644 3b18e512... myfile.txt
100644 d670460b... another.txt
```

### Step 4: Write Tree

Create a tree object from the index:

```bash
mygit write-tree
```

**Tree object format:**
```
tree {size}\0
{mode} {filename}\0{20-byte-sha1}
{mode} {filename}\0{20-byte-sha1}
...
```

**Example:**
```
tree 74\0
100644 myfile.txt\0{20-byte-sha1}
100644 another.txt\0{20-byte-sha1}
```

Tree objects represent directories.

### Step 5: Commit Tree

Create a commit object:

```bash
mygit commit-tree {tree-sha} -m "Initial commit"
```

**Commit object format:**
```
commit {size}\0
tree {tree-sha}
parent {parent-sha}  # Optional (not for first commit)
author {name} <{email}> {timestamp} {timezone}
committer {name} <{email}> {timestamp} {timezone}

{commit message}
```

**Example:**
```
commit 177\0
tree 3b18e512dba79e4c8300dd08aeb37f8e728b8dad
author John Doe <john@example.com> 1699564800 +0000
committer John Doe <john@example.com> 1699564800 +0000

Initial commit
```

### Step 6: Update HEAD

Point HEAD (and current branch) to the new commit:

```bash
# Update refs/heads/main
echo {commit-sha} > .git/refs/heads/main

# HEAD already points to refs/heads/main
cat .git/HEAD
# ref: refs/heads/main
```

### Step 7: Status Command

Show working tree status:

```bash
mygit status
```

Should show:
- Untracked files
- Modified files
- Staged changes

**Algorithm:**
1. Read index (staged files)
2. List working directory files
3. Compare:
   - Files in index but not in working dir → deleted
   - Files in working dir but not in index → untracked
   - Files in both with different hash → modified

### Step 8: Log Command

Show commit history:

```bash
mygit log
```

**Algorithm:**
1. Read HEAD to get current commit
2. Read commit object
3. Display commit info
4. Follow parent pointer
5. Repeat until no parent

**Output:**
```
commit 3b18e512dba79e4c8300dd08aeb37f8e728b8dad
Author: John Doe <john@example.com>
Date: Thu Nov 9 12:00:00 2023 +0000

    Initial commit
```

### Step 9: Diff Command

Show changes between commits:

```bash
mygit diff
```

**Algorithm:**
1. Compare working directory to index (unstaged changes)
2. Or compare two commits
3. Use diff algorithm (Myers diff, patience diff, etc.)

### Step 10: Branch Command

Create and manage branches:

```bash
mygit branch feature
mygit checkout feature
```

**Branch is just a file:**
```bash
# Create branch
echo {commit-sha} > .git/refs/heads/feature

# Switch branch
echo "ref: refs/heads/feature" > .git/HEAD
```

## Git Object Model

### The Four Object Types

**1. Blob (Binary Large Object)**
- Stores file content
- No filename, no metadata
- Just raw content

**2. Tree**
- Stores directory structure
- Contains:
  - File modes
  - Filenames
  - Pointers to blobs or other trees

**3. Commit**
- Points to a tree (project snapshot)
- Points to parent commit(s)
- Contains metadata (author, message, timestamp)

**4. Tag**
- Points to a commit (usually)
- Contains annotation

### Object Storage

**Filename:** First 2 chars of SHA-1 / Remaining 38 chars

Example: `3b18e512dba79e4c8300dd08aeb37f8e728b8dad`

Stored at: `.git/objects/3b/18e512dba79e4c8300dd08aeb37f8e728b8dad`

**Format:**
1. Header: `"{type} {size}\0"`
2. Content
3. Compress with zlib
4. Write to file

**Reading:**
1. Decompress with zlib
2. Parse header (type and size)
3. Extract content

### Example Repository Structure

```
.git/
├── HEAD                  # ref: refs/heads/main
├── config
├── description
├── objects/
│   ├── 3b/
│   │   └── 18e512...    # Blob: "hello world"
│   ├── d6/
│   │   └── 70460b...    # Tree: directory listing
│   └── a1/
│       └── b2c3d4...    # Commit: metadata + tree pointer
├── refs/
│   └── heads/
│       └── main         # Points to commit a1b2c3d4...
└── index                # Staging area
```

## Implementation Approaches

### Language Choices

**C:**
- Pros: Low-level control, fast, same as real Git
- Cons: Complex, more code

**Python:**
- Pros: Easy file I/O, string handling, zlib built-in
- Cons: Slower

**Go:**
- Pros: Good for CLI tools, standard library has needed features
- Cons: More verbose than Python

**Rust:**
- Pros: Fast, safe, good CLI ecosystem
- Cons: Steeper learning curve

### Key Libraries Needed

**SHA-1 hashing:**
```c
// C
#include <openssl/sha.h>

// Python
import hashlib
sha1 = hashlib.sha1(data).hexdigest()

// Go
import "crypto/sha1"
h := sha1.Sum(data)
```

**Zlib compression:**
```c
// C
#include <zlib.h>

// Python
import zlib
compressed = zlib.compress(data)
decompressed = zlib.decompress(compressed)

// Go
import "compress/zlib"
```

**File I/O:**
All languages have good file I/O support.

## Testing Strategy

### Unit Tests

```bash
# Test hash-object
content="test"
expected_hash="9daeafb9864cf43055ae93beb0afd6c7d144bfa4"
actual_hash=$(mygit hash-object test.txt)
assert $expected_hash == $actual_hash

# Test tree creation
mygit add file1.txt file2.txt
tree_hash=$(mygit write-tree)
# Verify tree object exists
test -f .git/objects/${tree_hash:0:2}/${tree_hash:2}
```

### Integration Tests

```bash
# Full workflow test
mygit init
echo "hello" > file.txt
mygit add file.txt
mygit commit -m "First commit"
mygit log | grep "First commit"
```

### Comparison Tests

```bash
# Compare with real Git
git hash-object file.txt > expected.txt
mygit hash-object file.txt > actual.txt
diff expected.txt actual.txt
```

## Common Pitfalls

### 1. SHA-1 Calculation

Must include header in hash:

❌ Wrong:
```python
sha1(file_content)
```

✓ Correct:
```python
header = f"blob {len(file_content)}\0"
sha1(header.encode() + file_content)
```

### 2. Zlib Compression

Objects are compressed, not just stored:

❌ Wrong:
```python
with open(object_path, 'wb') as f:
    f.write(content)
```

✓ Correct:
```python
import zlib
with open(object_path, 'wb') as f:
    f.write(zlib.compress(content))
```

### 3. Tree Object Format

Binary format, not text:

❌ Wrong:
```python
tree_content = f"100644 file.txt {hash}\n"
```

✓ Correct:
```python
import binascii
tree_content = b"100644 file.txt\0" + binascii.unhexlify(hash)
```

### 4. Line Endings

Consistency is key:

```python
# Normalize line endings
content = content.replace(b'\r\n', b'\n')
```

## Extensions

### Beyond Basic Git

**1. Pack Files**
- Compress multiple objects together
- Delta compression
- Reduces repository size

**2. Remote Operations**
- Push/pull
- Fetch
- Clone

**3. Merge Algorithms**
- Three-way merge
- Fast-forward merge
- Conflict detection

**4. Advanced Commands**
- Rebase
- Cherry-pick
- Bisect
- Stash

**5. Git Hooks**
- Pre-commit
- Post-commit
- Pre-push

## Learning Resources

### Official Documentation
- [Git Internals Book](https://git-scm.com/book/en/v2/Git-Internals-Plumbing-and-Porcelain)
- [Git from the Bottom Up](https://jwiegley.github.io/git-from-the-bottom-up/)

### Tutorials
- [Building Git](https://shop.jcoglan.com/building-git/) - Book
- [Write Yourself a Git](https://wyag.thb.lt/) - Tutorial

### Tools
- `git cat-file -t {hash}` - Show object type
- `git cat-file -p {hash}` - Pretty-print object
- `git hash-object {file}` - Hash a file
- `git ls-tree {tree}` - List tree contents
- `git rev-parse HEAD` - Resolve reference

## Success Criteria

Your Git implementation should:
- ✅ Initialize a valid repository
- ✅ Store objects using SHA-1 hashing
- ✅ Compress objects with zlib
- ✅ Add files to staging area
- ✅ Create commit objects
- ✅ Show commit history
- ✅ Display repository status
- ✅ Be compatible with real Git

## Real Git Compatibility

To verify compatibility:

```bash
# Use your tool to init and commit
mygit init
mygit add file.txt
mygit commit -m "Test"

# Use real Git to read it
git log
git show HEAD
```

If real Git can read your repository, you've succeeded!

## Why Build This?

Building Git teaches:
1. **Content-addressable storage** - How to store data by hash
2. **Immutable data structures** - Benefits of append-only storage
3. **Directed Acyclic Graphs** - Representing history
4. **Compression** - Zlib and delta compression
5. **Hashing** - SHA-1 (and why Git is moving to SHA-256)
6. **File formats** - Binary formats and parsing
7. **CLI design** - Building user-friendly command-line tools

## Summary

Git is deceptively simple:
- Everything is an object (blob, tree, commit, tag)
- Objects are content-addressed (SHA-1 hash)
- References point to objects
- HEAD points to current position

With just these concepts, you can build a working version control system!

## Further Reading

- [Pro Git Book](https://git-scm.com/book/en/v2)
- [Git Magic](http://www-cs-students.stanford.edu/~blynn/gitmagic/)
- [Git Parable](https://tom.preston-werner.com/2009/05/19/the-git-parable.html)
- [Git Source Code](https://github.com/git/git)
