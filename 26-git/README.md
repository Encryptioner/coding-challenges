# Git - Version Control System (Educational Implementation)

A comprehensive educational resource for understanding Git internals. This project provides detailed documentation, examples, and code snippets explaining how Git works under the hood.

## Challenge

This is Challenge #26 from [CodingChallenges.fyi](https://codingchallenges.fyi/challenges/challenge-git).

## Overview

Git is a distributed version control system that tracks changes in source code. This educational resource breaks down Git's internal workings to help you understand:

- How Git stores data
- What happens when you `git add` and `git commit`
- How branches work
- What the staging area really is
- How Git achieves speed and efficiency

## What is Git?

**Git is fundamentally a content-addressable filesystem with a VCS on top.**

Key principles:
1. **Content-addressed storage** - Files identified by SHA-1 hash of their content
2. **Immutability** - Objects never change once created
3. **DAG structure** - History forms a Directed Acyclic Graph
4. **Distributed** - Every clone has full history

## Git Internals

### The .git Directory

When you run `git init`, Git creates:

```
.git/
├── HEAD                  # Current branch pointer
├── config                # Repository configuration
├── description           # Repository description
├── hooks/                # Git hooks (scripts)
│   ├── pre-commit
│   └── post-commit
├── info/                 # Additional info
│   └── exclude          # Gitignore patterns
├── objects/              # Object database
│   ├── info/
│   └── pack/            # Pack files
├── refs/                 # References
│   ├── heads/           # Local branches
│   └── tags/            # Tags
└── index                 # Staging area
```

### The Four Object Types

#### 1. Blob (Binary Large Object)

Stores file content (no filename or metadata):

```
blob 14\0Hello, World!\n
```

**Format:**
- Header: `blob {size}\0`
- Content: raw file bytes

**Create a blob:**
```bash
# Store "Hello, World!" in Git
echo "Hello, World!" | git hash-object -w --stdin
# Output: 8ab686eafeb1f44702738c8b0f24f2567c36da6d
```

**Location:**
`.git/objects/8a/b686eafeb1f44702738c8b0f24f2567c36da6d`

**View a blob:**
```bash
git cat-file -p 8ab686ea
# Output: Hello, World!
```

#### 2. Tree

Stores directory structure:

```
tree 74\0
100644 blob 8ab686ea... README.md
100644 blob d670460b... main.c
040000 tree 9daeafb9... src
```

**Format:**
```
tree {size}\0
{mode} {type} {hash}\t{filename}\0
{mode} {type} {hash}\t{filename}\0
...
```

**Modes:**
- `100644` - Regular file
- `100755` - Executable file
- `040000` - Directory (tree)
- `120000` - Symbolic link

**Create a tree:**
```bash
# Write current index to tree
git write-tree
# Output: d8329fc1cc938780ffdd9f94e0d364e0ea74f579
```

**View a tree:**
```bash
git cat-file -p d8329fc1
# Output:
# 100644 blob 8ab686ea... README.md
# 100644 blob d670460b... main.c
```

#### 3. Commit

Points to a tree (snapshot) with metadata:

```
commit 177\0
tree d8329fc1cc938780ffdd9f94e0d364e0ea74f579
parent 3b18e512dba79e4c8300dd08aeb37f8e728b8dad
author John Doe <john@example.com> 1699564800 +0000
committer John Doe <john@example.com> 1699564800 +0000

Initial commit
```

**View a commit:**
```bash
git cat-file -p HEAD
# Output shows tree, parents, author, message
```

#### 4. Tag

Annotated pointer to a commit:

```
tag 154\0
object 3b18e512dba79e4c8300dd08aeb37f8e728b8dad
type commit
tag v1.0.0
tagger John Doe <john@example.com> 1699564800 +0000

Version 1.0.0 release
```

### Content-Addressable Storage

Git uses **SHA-1 hashing** to create unique identifiers:

**Process:**
1. Create header: `"{type} {size}\0"`
2. Concatenate header + content
3. Calculate SHA-1 hash
4. Store at `.git/objects/{first-2-chars}/{remaining-38-chars}`

**Example:**
```python
import hashlib
import zlib

content = b"Hello, World!\n"
header = f"blob {len(content)}\0".encode()
store = header + content

# Calculate hash
sha1 = hashlib.sha1(store).hexdigest()
# Result: 8ab686eafeb1f44702738c8b0f24f2567c36da6d

# Compress for storage
compressed = zlib.compress(store)

# Write to .git/objects/8a/b686eafeb...
```

### The Three Trees

Git manages three "trees" (snapshots):

1. **HEAD** - Last commit snapshot
2. **Index** - Proposed next commit (staging area)
3. **Working Directory** - Your files

**Workflow:**
```
Working Directory
    ↓ (git add)
Index/Staging Area
    ↓ (git commit)
HEAD
```

**Example:**
```bash
# Working Directory
echo "hello" > file.txt

# Stage to Index
git add file.txt

# Commit to HEAD
git commit -m "Add file"
```

### The Index (Staging Area)

The index is a binary file (`.git/index`) containing:

- File path
- File mode
- SHA-1 hash of blob
- File size
- Timestamps (mtime, ctime)
- Flags

**View the index:**
```bash
git ls-files --stage
# 100644 8ab686ea... 0	file.txt
```

**Format (simplified):**
```
{mode} {hash} {stage} {filename}
```

### References

References are pointers to commits:

**Branches:**
```bash
cat .git/refs/heads/main
# 3b18e512dba79e4c8300dd08aeb37f8e728b8dad

# This is just a file containing a commit hash!
```

**HEAD:**
```bash
cat .git/HEAD
# ref: refs/heads/main

# HEAD points to a branch, which points to a commit
```

**Tags:**
```bash
cat .git/refs/tags/v1.0.0
# 3b18e512dba79e4c8300dd08aeb37f8e728b8dad
```

### How Git Commands Work

#### git init

```bash
git init
```

**What happens:**
1. Create `.git` directory
2. Create `objects/`, `refs/`, `hooks/` subdirectories
3. Write `HEAD` file: `ref: refs/heads/main`
4. Write `config` file with default settings
5. Initialize `description` file

**Code example:**
```python
import os

def git_init(path="."):
    git_dir = os.path.join(path, ".git")

    # Create directories
    os.makedirs(os.path.join(git_dir, "objects"), exist_ok=True)
    os.makedirs(os.path.join(git_dir, "refs", "heads"), exist_ok=True)
    os.makedirs(os.path.join(git_dir, "refs", "tags"), exist_ok=True)

    # Write HEAD
    with open(os.path.join(git_dir, "HEAD"), "w") as f:
        f.write("ref: refs/heads/main\n")

    # Write config
    with open(os.path.join(git_dir, "config"), "w") as f:
        f.write("[core]\n")
        f.write("\trepositoryformatversion = 0\n")
        f.write("\tfilemode = true\n")
```

#### git add

```bash
git add file.txt
```

**What happens:**
1. Read file content
2. Create blob object (hash and compress)
3. Store blob in `.git/objects/`
4. Update `.git/index` with file info and blob hash

**Code example:**
```python
import hashlib
import zlib
import os

def git_add(filename):
    # Read file
    with open(filename, 'rb') as f:
        content = f.read()

    # Create header
    header = f"blob {len(content)}\0".encode()
    store = header + content

    # Calculate hash
    sha1 = hashlib.sha1(store).hexdigest()

    # Compress
    compressed = zlib.compress(store)

    # Store in .git/objects/
    obj_dir = f".git/objects/{sha1[:2]}"
    os.makedirs(obj_dir, exist_ok=True)

    obj_path = f"{obj_dir}/{sha1[2:]}"
    with open(obj_path, 'wb') as f:
        f.write(compressed)

    # Update index (simplified - real index is binary)
    # Would write to .git/index here

    return sha1
```

#### git commit

```bash
git commit -m "Initial commit"
```

**What happens:**
1. Create tree object from index
2. Read parent commit from current branch
3. Create commit object with:
   - Tree hash
   - Parent hash(es)
   - Author/committer info
   - Commit message
4. Write commit object to `.git/objects/`
5. Update current branch ref to point to new commit

**Code example:**
```python
import time

def git_commit(message, author="User <user@example.com>"):
    # Get tree from index
    tree_hash = write_tree()

    # Get parent commit
    parent_hash = get_current_commit()

    # Build commit object
    timestamp = int(time.time())
    commit_content = f"tree {tree_hash}\n"
    if parent_hash:
        commit_content += f"parent {parent_hash}\n"
    commit_content += f"author {author} {timestamp} +0000\n"
    commit_content += f"committer {author} {timestamp} +0000\n"
    commit_content += f"\n{message}\n"

    # Hash and store
    header = f"commit {len(commit_content)}\0"
    store = header.encode() + commit_content.encode()
    commit_hash = hashlib.sha1(store).hexdigest()

    # Write commit object
    write_object(commit_hash, zlib.compress(store))

    # Update branch reference
    branch = get_current_branch()
    with open(f".git/refs/heads/{branch}", "w") as f:
        f.write(commit_hash)

    return commit_hash
```

#### git log

```bash
git log
```

**What happens:**
1. Read HEAD to get current commit
2. Read and display commit object
3. Follow parent pointer
4. Repeat until no parent (initial commit)

**Code example:**
```python
def git_log():
    # Get current commit
    commit_hash = get_current_commit()

    while commit_hash:
        # Read commit object
        commit = read_object(commit_hash)

        # Parse commit
        lines = commit.decode().split('\n')
        tree = None
        parent = None
        author = None
        message = []

        in_message = False
        for line in lines:
            if line.startswith('tree '):
                tree = line[5:]
            elif line.startswith('parent '):
                parent = line[7:]
            elif line.startswith('author '):
                author = line[7:]
            elif line == '':
                in_message = True
            elif in_message:
                message.append(line)

        # Display
        print(f"commit {commit_hash}")
        print(f"Author: {author}")
        print()
        for line in message:
            print(f"    {line}")
        print()

        # Move to parent
        commit_hash = parent
```

#### git branch

```bash
git branch feature
```

**What happens:**
1. Get current commit hash
2. Write commit hash to `.git/refs/heads/feature`

That's it! A branch is just a file containing a commit hash.

**Code example:**
```python
def git_branch(name):
    # Get current commit
    commit_hash = get_current_commit()

    # Create branch file
    with open(f".git/refs/heads/{name}", "w") as f:
        f.write(commit_hash)
```

#### git checkout

```bash
git checkout feature
```

**What happens:**
1. Read commit hash from `.git/refs/heads/feature`
2. Update `.git/HEAD` to point to branch
3. Update working directory to match commit tree

**Code example:**
```python
def git_checkout(branch):
    # Update HEAD
    with open(".git/HEAD", "w") as f:
        f.write(f"ref: refs/heads/{branch}\n")

    # Read commit
    with open(f".git/refs/heads/{branch}") as f:
        commit_hash = f.read().strip()

    # Update working directory (simplified)
    # Would read tree, extract files here
```

### How Branches Work

**Branches are just pointers to commits.**

```
main → [C3] → [C2] → [C1]
feature → [C4] → [C2] → [C1]
```

When you commit on `feature`:
```
main → [C3] → [C2] → [C1]
feature → [C5] → [C4] → [C2] → [C1]
```

**No files are copied!** Just a new commit object is created.

### How Merge Works

**Fast-Forward Merge:**

```
Before:
main → [C2] → [C1]
feature → [C3] → [C2] → [C1]

After git merge feature:
main → [C3] → [C2] → [C1]
```

Main just moves forward - no merge commit needed.

**Three-Way Merge:**

```
Before:
main → [C3] → [C2] → [C1]
feature → [C4] → [C2] → [C1]

After git merge feature:
main → [C5] → [C3], [C4] → ...
```

C5 is a merge commit with two parents (C3 and C4).

## Git Workflow Example

### Complete Example

```bash
# Initialize
git init
# Creates .git/ directory structure

# Create file
echo "Hello" > file.txt

# Add to staging
git add file.txt
# Creates blob object, updates index

# Commit
git commit -m "Add file"
# Creates tree object, commit object
# Updates refs/heads/main

# Create branch
git branch feature
# Creates refs/heads/feature pointing to current commit

# Switch branch
git checkout feature
# Updates HEAD to point to refs/heads/feature

# Make changes
echo "World" >> file.txt

# Stage and commit
git add file.txt
git commit -m "Update file"
# New commit on feature branch

# Switch back
git checkout main

# Merge
git merge feature
# Creates merge commit (or fast-forward)
```

### What Actually Happened

**After first commit:**
```
.git/objects/
├── 8a/
│   └── b686ea...    # Blob: "Hello\n"
├── d8/
│   └── 329fc1...    # Tree: file.txt → 8ab686ea
└── 3b/
    └── 18e512...    # Commit: tree d8329fc1, message "Add file"

.git/refs/heads/main:
3b18e512...
```

**After second commit on feature:**
```
.git/objects/
├── 8a/
│   └── b686ea...    # Blob: "Hello\n"
├── d6/
│   └── 70460b...    # Blob: "Hello\nWorld\n"
├── d8/
│   └── 329fc1...    # Tree: file.txt → 8ab686ea
├── a1/
│   └── b2c3d4...    # Tree: file.txt → d670460b
├── 3b/
│   └── 18e512...    # Commit: tree d8329fc1, message "Add file"
└── e5/
    └── f6g7h8...    # Commit: tree a1b2c3d4, parent 3b18e512, message "Update file"

.git/refs/heads/feature:
e5f6g7h8...
```

Notice:
- Old blob still exists (immutable!)
- New blob created for modified file
- New tree for modified directory
- New commit linking to new tree and old commit

## Why Git is Fast

### 1. Content-Addressed Storage

**No duplicates:**
If two files have identical content, they share the same blob.

```bash
# Both files have same content
echo "test" > file1.txt
echo "test" > file2.txt

git add file1.txt file2.txt
# Only ONE blob created!
```

### 2. Cheap Branches

**Branches are just 41 bytes** (40-char hash + newline)

Creating a branch = writing one file
Switching branches = updating working directory

### 3. Local Operations

Most operations are local (no network):
- `git log` - Read local history
- `git diff` - Compare local files
- `git branch` - Local references only

Only need network for:
- `git push`
- `git pull`
- `git fetch`

### 4. Delta Compression

Git compresses objects using delta encoding:

Instead of storing:
- File v1: 1000 bytes
- File v2: 1010 bytes (with 10 byte change)

Git stores:
- File v1: 1000 bytes
- File v2: delta (10 bytes)

This happens in pack files.

## Advanced Concepts

### Pack Files

Git can pack multiple objects into a single file:

```bash
git gc  # Garbage collection, creates pack files
```

**Format:**
- `.git/objects/pack/pack-{hash}.pack` - Packed objects
- `.git/objects/pack/pack-{hash}.idx` - Index for pack file

**Benefits:**
- Delta compression between similar objects
- Reduced disk space
- Faster network transfer

### Reflog

Git keeps a log of where HEAD has been:

```bash
git reflog
# Shows history of HEAD movements
```

**Location:** `.git/logs/HEAD`

**Format:**
```
{old-hash} {new-hash} {author} {timestamp} {action}
```

**Use case:** Recover "lost" commits

### Detached HEAD

HEAD normally points to a branch, which points to a commit:
```
HEAD → refs/heads/main → commit-hash
```

Detached HEAD points directly to a commit:
```
HEAD → commit-hash
```

**Happens when:**
```bash
git checkout 3b18e512  # Checkout specific commit
```

### Tags

**Lightweight tag:** Just a reference
```bash
git tag v1.0.0
# Creates .git/refs/tags/v1.0.0
```

**Annotated tag:** Full object with metadata
```bash
git tag -a v1.0.0 -m "Release v1.0.0"
# Creates tag object in .git/objects/
```

## Comparison: Git vs Other VCS

### Git vs SVN

**SVN (Centralized):**
- Single central repository
- Each commit requires network
- Branches are directory copies
- Slower operations

**Git (Distributed):**
- Every clone is a full repository
- Most operations are local
- Branches are pointers
- Very fast

### Git vs Mercurial

Both are distributed VCS, very similar.

**Differences:**
- Git has more complex commands
- Mercurial has simpler UI
- Git is more popular
- Both are fast and capable

## Common Questions

### Why SHA-1?

- Fast to compute
- Very low collision probability
- Serves as both ID and integrity check

**Note:** Git is migrating to SHA-256 for security.

### Why zlib compression?

- Good compression ratio
- Fast compression/decompression
- Standard library in most languages

### Why immutable objects?

- Simplifies synchronization
- Enables safe concurrent access
- Makes operations predictable
- History never changes

### How does Git store large files?

**Short answer:** Not well!

**Solutions:**
- Git LFS (Large File Storage)
- Store pointers, not actual files
- External storage for large binaries

## Tools for Exploring Git

```bash
# Show object type
git cat-file -t {hash}

# Show object content
git cat-file -p {hash}

# Show object size
git cat-file -s {hash}

# Compute hash of file
git hash-object {file}

# List tree contents
git ls-tree {tree-hash}

# Show index contents
git ls-files --stage

# Show HEAD
git rev-parse HEAD

# Show current branch
git rev-parse --abbrev-ref HEAD
```

## Learning Path

1. **Start simple:** init, add, commit, status
2. **Understand objects:** blob, tree, commit
3. **Learn branches:** branch, checkout, merge
4. **Explore internals:** cat-file, ls-tree
5. **Advanced features:** rebase, cherry-pick, bisect

## Resources

### Books
- [Pro Git](https://git-scm.com/book) - Free online book
- [Building Git](https://shop.jcoglan.com/building-git/) - Implementing Git in Ruby

### Tutorials
- [Git Internals](https://git-scm.com/book/en/v2/Git-Internals-Plumbing-and-Porcelain)
- [Git from the Bottom Up](https://jwiegley.github.io/git-from-the-bottom-up/)

### Interactive
- [Learn Git Branching](https://learngitbranching.js.org/) - Interactive tutorial
- [Git Visualization](http://git-school.github.io/visualizing-git/) - See what Git does

## Summary

Git is beautifully simple at its core:
- Everything is an object (blob, tree, commit, tag)
- Objects are content-addressed (SHA-1 hash)
- References point to objects (branches, HEAD)
- History is immutable

Understanding these fundamentals makes Git much less mysterious and more powerful!

## Contributing

This is an educational resource. Contributions welcome:
- Add more examples
- Clarify explanations
- Fix errors
- Add visualizations

## License

Educational resource for [CodingChallenges.fyi](https://codingchallenges.fyi).
