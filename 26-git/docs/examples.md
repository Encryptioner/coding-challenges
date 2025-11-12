# Git Practical Examples

This guide provides hands-on examples using the mygit implementation. Each example shows the commands, expected output, and what's happening internally.

## Table of Contents

1. [Basic Workflow](#basic-workflow)
2. [Working with Multiple Files](#working-with-multiple-files)
3. [Understanding the Three Trees](#understanding-the-three-trees)
4. [Examining Objects](#examining-objects)
5. [Building History](#building-history)
6. [Troubleshooting Common Issues](#troubleshooting-common-issues)
7. [Advanced Scenarios](#advanced-scenarios)

## Basic Workflow

### Example 1: Your First Commit

Let's create a repository and make the first commit.

```bash
# Create project directory
$ mkdir my-project
$ cd my-project

# Initialize repository
$ ./mygit.py init
Initialized empty Git repository in .git

# Check status (empty repository)
$ ./mygit.py status
On branch main

No commits yet

Untracked files:
  (use "git add <file>..." to include in what will be committed)

# Create a file
$ echo "# My Project" > README.md
$ echo "This is a sample project." >> README.md

# Check status again
$ ./mygit.py status
On branch main

No commits yet

Untracked files:
  (use "git add <file>..." to include in what will be committed)
	README.md

# Stage the file
$ ./mygit.py add README.md
Added README.md

# Check status after staging
$ ./mygit.py status
On branch main

No commits yet

Changes to be committed:
  (use "git restore --staged <file>..." to unstage)
	new file:   README.md

# Create the commit
$ ./mygit.py commit -m "Initial commit: Add README"
[main a1b2c3d] Initial commit: Add README

# Check status after commit
$ ./mygit.py status
On branch main

nothing to commit, working tree clean

# View the commit history
$ ./mygit.py log
commit a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0
Author: User <user@example.com>
Date:   Fri Nov 10 12:00:00 2023

    Initial commit: Add README
```

**What happened internally:**

1. **init**: Created `.git/` structure
2. **add**: Created blob object for README.md, updated index
3. **commit**: Created tree and commit objects, updated `refs/heads/main`

### Example 2: Making Changes

Let's modify the file and create another commit.

```bash
# Modify the file
$ echo "" >> README.md
$ echo "## Features" >> README.md
$ echo "- Feature 1" >> README.md

# Check what changed
$ ./mygit.py status
On branch main

Changes not staged for commit:
  (use "git add <file>..." to update what will be committed)
	modified:   README.md

# Stage the changes
$ ./mygit.py add README.md
Added README.md

# Commit
$ ./mygit.py commit -m "Add features section"
[main e4f5g6h] Add features section

# View history
$ ./mygit.py log
commit e4f5g6h7i8j9k0l1m2n3o4p5q6r7s8t9u0v1w2x3
Author: User <user@example.com>
Date:   Fri Nov 10 12:05:00 2023

    Add features section

commit a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0
Author: User <user@example.com>
Date:   Fri Nov 10 12:00:00 2023

    Initial commit: Add README
```

**Internal changes:**

1. New blob created for modified README.md (different content = different hash)
2. New tree created (references new blob)
3. New commit created (parent points to previous commit)

## Working with Multiple Files

### Example 3: Adding Multiple Files

```bash
# Create source directory
$ mkdir src
$ echo "def main():" > src/main.py
$ echo "    print('Hello')" >> src/main.py

$ echo "def helper():" > src/utils.py
$ echo "    pass" >> src/utils.py

# Create tests
$ mkdir tests
$ echo "def test_main():" > tests/test_main.py
$ echo "    assert True" >> tests/test_main.py

# Check status
$ ./mygit.py status
On branch main

Untracked files:
  (use "git add <file>..." to include in what will be committed)
	src/main.py
	src/utils.py
	tests/test_main.py

# Stage all files
$ ./mygit.py add src/main.py
$ ./mygit.py add src/utils.py
$ ./mygit.py add tests/test_main.py

# Or stage directories (if implemented)
# $ ./mygit.py add src/
# $ ./mygit.py add tests/

# Check status
$ ./mygit.py status
On branch main

Changes to be committed:
  (use "git restore --staged <file>..." to unstage)
	new file:   src/main.py
	new file:   src/utils.py
	new file:   tests/test_main.py

# Commit
$ ./mygit.py commit -m "Add source files and tests"
[main 1a2b3c4] Add source files and tests
```

**Project structure now:**

```
my-project/
├── README.md
├── src/
│   ├── main.py
│   └── utils.py
└── tests/
    └── test_main.py
```

### Example 4: Partial Staging

You can stage only specific changes, not all modified files.

```bash
# Modify multiple files
$ echo "# Updated" >> README.md
$ echo "def new_func(): pass" >> src/main.py

# Check status
$ ./mygit.py status
On branch main

Changes not staged for commit:
	modified:   README.md
	modified:   src/main.py

# Stage only README.md
$ ./mygit.py add README.md

# Check status
$ ./mygit.py status
On branch main

Changes to be committed:
	modified:   README.md

Changes not staged for commit:
	modified:   src/main.py

# Commit only staged changes
$ ./mygit.py commit -m "Update README"
[main 5d6e7f8] Update README

# src/main.py is still modified but not committed
$ ./mygit.py status
On branch main

Changes not staged for commit:
	modified:   src/main.py
```

**Why this is useful:**

- Create logical, focused commits
- Separate unrelated changes
- Build up complex commits piece by piece

## Understanding the Three Trees

### Example 5: Tracking Changes Through Three Trees

Let's visualize how changes move through HEAD, Index, and Working Directory.

```bash
# Start with clean state
$ ./mygit.py status
On branch main
nothing to commit, working tree clean

# State:
# HEAD:     file.txt (version A)
# Index:    file.txt (version A)
# Working:  file.txt (version A)

# Modify file
$ echo "new content" >> file.txt

# Check status
$ ./mygit.py status
Changes not staged for commit:
	modified:   file.txt

# State:
# HEAD:     file.txt (version A)
# Index:    file.txt (version A)
# Working:  file.txt (version B)  ← changed

# Stage the file
$ ./mygit.py add file.txt

# Check status
$ ./mygit.py status
Changes to be committed:
	modified:   file.txt

# State:
# HEAD:     file.txt (version A)
# Index:    file.txt (version B)  ← staged
# Working:  file.txt (version B)

# Commit the file
$ ./mygit.py commit -m "Update file"

# Check status
$ ./mygit.py status
nothing to commit, working tree clean

# State:
# HEAD:     file.txt (version B)  ← committed
# Index:    file.txt (version B)
# Working:  file.txt (version B)
```

### Example 6: Detecting All Three States

```bash
# Clean state
$ echo "original" > demo.txt
$ ./mygit.py add demo.txt
$ ./mygit.py commit -m "Add demo"

# Modify and stage
$ echo "staged version" > demo.txt
$ ./mygit.py add demo.txt

# Modify again (after staging)
$ echo "working version" > demo.txt

# Check status
$ ./mygit.py status
On branch main

Changes to be committed:
	modified:   demo.txt        # Index differs from HEAD

Changes not staged for commit:
	modified:   demo.txt        # Working differs from Index

# Three different versions!
# HEAD:     "original"
# Index:    "staged version"
# Working:  "working version"
```

## Examining Objects

### Example 7: Exploring Object Database

Let's look inside Git's object database.

```bash
# Create and commit a file
$ echo "Hello, Git!" > hello.txt
$ ./mygit.py add hello.txt
$ ./mygit.py commit -m "Add hello"
[main a1b2c3d] Add hello

# List all objects
$ find .git/objects -type f
.git/objects/8c/01d89ae06311834ee4b1fab2f0414d35f01102  # Blob
.git/objects/3b/18e512dba79e4c8300dd08aeb37f8e728b8dad  # Tree
.git/objects/a1/b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0  # Commit

# Examine the blob
$ ./mygit.py cat-file -t 8c01d89
blob

$ ./mygit.py cat-file -s 8c01d89
12

$ ./mygit.py cat-file -p 8c01d89
Hello, Git!

# Examine the tree
$ ./mygit.py cat-file -t 3b18e51
tree

$ ./mygit.py cat-file -p 3b18e51
100644 blob 8c01d89ae06311834ee4b1fab2f0414d35f01102    hello.txt

# Examine the commit
$ ./mygit.py cat-file -t a1b2c3d
commit

$ ./mygit.py cat-file -p a1b2c3d
tree 3b18e512dba79e4c8300dd08aeb37f8e728b8dad
author User <user@example.com> 1699564800 +0000
committer User <user@example.com> 1699564800 +0000

Add hello
```

### Example 8: Object Reuse

Git reuses objects for identical content.

```bash
# Create two files with identical content
$ echo "identical" > file1.txt
$ echo "identical" > file2.txt

# Stage both
$ ./mygit.py add file1.txt file2.txt

# Check index
$ cat .git/index
100644 e965047ad7c57865823c7d992b1d046ea66edf78 file1.txt
100644 e965047ad7c57865823c7d992b1d046ea66edf78 file2.txt
              ↑ Same SHA-1 hash!

# Both files reference the same blob object
$ ./mygit.py cat-file -p e965047
identical

# Only ONE blob exists for both files
$ find .git/objects -type f -name "e965047*"
.git/objects/e9/65047ad7c57865823c7d992b1d046ea66edf78
```

**Why this matters:**

- Saves disk space
- Fast comparisons (compare hashes, not content)
- Efficient for large files used in multiple places

## Building History

### Example 9: Creating a Commit Chain

Let's build a history with multiple commits.

```bash
# First commit
$ echo "v1" > version.txt
$ ./mygit.py add version.txt
$ ./mygit.py commit -m "Version 1"
[main a111111] Version 1

# Second commit
$ echo "v2" > version.txt
$ ./mygit.py add version.txt
$ ./mygit.py commit -m "Version 2"
[main b222222] Version 2

# Third commit
$ echo "v3" > version.txt
$ ./mygit.py add version.txt
$ ./mygit.py commit -m "Version 3"
[main c333333] Version 3

# View history
$ ./mygit.py log
commit c333333333333333333333333333333333333333
Author: User <user@example.com>
Date:   Fri Nov 10 12:15:00 2023

    Version 3

commit b222222222222222222222222222222222222222
Author: User <user@example.com>
Date:   Fri Nov 10 12:10:00 2023

    Version 2

commit a111111111111111111111111111111111111111
Author: User <user@example.com>
Date:   Fri Nov 10 12:05:00 2023

    Version 1
```

**Commit graph:**

```
c333333 (Version 3) ← main
    ↓
b222222 (Version 2)
    ↓
a111111 (Version 1)
```

### Example 10: Understanding Parent Relationships

```bash
# Examine each commit's parent relationship

# Third commit (current HEAD)
$ ./mygit.py cat-file -p c333333
tree [tree-hash-3]
parent b222222222222222222222222222222222222222
author User <user@example.com> 1699564900 +0000
committer User <user@example.com> 1699564900 +0000

Version 3

# Second commit
$ ./mygit.py cat-file -p b222222
tree [tree-hash-2]
parent a111111111111111111111111111111111111111
author User <user@example.com> 1699564800 +0000
committer User <user@example.com> 1699564800 +0000

Version 2

# First commit (no parent - root commit)
$ ./mygit.py cat-file -p a111111
tree [tree-hash-1]
author User <user@example.com> 1699564700 +0000
committer User <user@example.com> 1699564700 +0000

Version 1
```

## Troubleshooting Common Issues

### Example 11: File Not Staged

**Problem:** Committed but changes aren't included.

```bash
# Modify file
$ echo "changes" >> file.txt

# Commit without staging
$ ./mygit.py commit -m "Update file"
error: No changes staged for commit

# Solution: Stage first
$ ./mygit.py add file.txt
$ ./mygit.py commit -m "Update file"
[main d444444] Update file
```

**Lesson:** Always check `git status` before committing.

### Example 12: Finding Lost Content

**Problem:** "Where did my file go?"

```bash
# File exists but shows as untracked
$ ./mygit.py status
Untracked files:
	newfile.txt

# Check if it was ever committed
$ ./mygit.py log --all
(search commit messages)

# If it was staged but not committed, check index
$ cat .git/index | grep newfile.txt

# If blob was created, find it
$ find .git/objects -type f

# Read the blob
$ ./mygit.py cat-file -p [hash]
```

### Example 13: Understanding Detached HEAD

**Note:** Our basic implementation always uses branches, but understanding detached HEAD is important.

**What it means:**

```
# Normal state (on a branch)
$ cat .git/HEAD
ref: refs/heads/main

# Detached HEAD (pointing to commit directly)
$ cat .git/HEAD
a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0
```

**Why it matters:**

- Commits made in detached HEAD aren't on any branch
- Easy to lose these commits
- Always create a branch before committing in detached state

## Advanced Scenarios

### Example 14: Manual Object Creation

Create objects without using high-level commands.

```bash
# Manually create a blob
$ echo "manual content" | ./mygit.py hash-object --stdin -w
f7d8e9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6

# Verify it exists
$ ls .git/objects/f7/d8e9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6
.git/objects/f7/d8e9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6

# Read it back
$ ./mygit.py cat-file -p f7d8e9a
manual content

# This blob isn't in any commit yet
# It's "orphaned" until referenced by a tree
```

### Example 15: Examining Tree Structure

For a complex directory structure:

```bash
# Create nested structure
$ mkdir -p project/src/lib
$ echo "main" > project/src/main.py
$ echo "lib" > project/src/lib/helper.py
$ echo "readme" > project/README.md

# Stage everything
$ ./mygit.py add project/

# Commit
$ ./mygit.py commit -m "Add project structure"
[main e555555] Add project structure

# Find the root tree
$ ./mygit.py cat-file -p e555555 | grep "^tree"
tree [root-tree-hash]

# Examine root tree
$ ./mygit.py cat-file -p [root-tree-hash]
040000 tree [project-tree-hash]    project

# Examine project tree
$ ./mygit.py cat-file -p [project-tree-hash]
100644 blob [readme-hash]    README.md
040000 tree [src-tree-hash]  src

# Examine src tree
$ ./mygit.py cat-file -p [src-tree-hash]
040000 tree [lib-tree-hash]  lib
100644 blob [main-hash]      main.py

# Examine lib tree
$ ./mygit.py cat-file -p [lib-tree-hash]
100644 blob [helper-hash]    helper.py
```

**Tree hierarchy:**

```
Root Tree
└── project (tree)
    ├── README.md (blob)
    └── src (tree)
        ├── main.py (blob)
        └── lib (tree)
            └── helper.py (blob)
```

### Example 16: Comparing Commits

Compare what changed between commits.

```bash
# Get commit hashes
$ ./mygit.py log --oneline
c333333 Version 3
b222222 Version 2
a111111 Version 1

# Examine trees from two commits
$ ./mygit.py cat-file -p c333333 | grep tree
tree [tree-c]

$ ./mygit.py cat-file -p b222222 | grep tree
tree [tree-b]

# Compare trees
$ ./mygit.py cat-file -p [tree-c]
100644 blob [hash-v3] version.txt

$ ./mygit.py cat-file -p [tree-b]
100644 blob [hash-v2] version.txt

# Same filename, different hashes = file changed
# Different filenames = files added/removed
```

### Example 17: Repository Integrity Check

Verify all objects are accessible.

```bash
# Start from HEAD
$ cat .git/refs/heads/main
c333333333333333333333333333333333333333

# Read commit
$ ./mygit.py cat-file -t c333333
commit

# Get tree from commit
$ ./mygit.py cat-file -p c333333 | grep tree
tree 3b18e512dba79e4c8300dd08aeb37f8e728b8dad

# Read tree
$ ./mygit.py cat-file -t 3b18e51
tree

# Get blobs from tree
$ ./mygit.py cat-file -p 3b18e51
100644 blob 8c01d89ae06311834ee4b1fab2f0414d35f01102 file.txt

# Verify blob
$ ./mygit.py cat-file -t 8c01d89
blob

# All objects accessible = repository is healthy
```

### Example 18: Working with Environment Variables

Set author information via environment.

```bash
# Set author
$ export GIT_AUTHOR_NAME="Jane Developer"
$ export GIT_AUTHOR_EMAIL="jane@example.com"

# Create commit
$ echo "code" > code.py
$ ./mygit.py add code.py
$ ./mygit.py commit -m "Add code"
[main f666666] Add code

# Check author in commit
$ ./mygit.py cat-file -p f666666
tree [hash]
parent [hash]
author Jane Developer <jane@example.com> 1699564800 +0000
committer Jane Developer <jane@example.com> 1699564800 +0000

Add code
```

## Quick Reference

### Common Command Patterns

```bash
# Initialize repository
./mygit.py init

# Check status
./mygit.py status

# Stage files
./mygit.py add <file>
./mygit.py add <directory>/

# Commit
./mygit.py commit -m "message"

# View history
./mygit.py log

# Examine objects
./mygit.py cat-file -t <hash>   # Show type
./mygit.py cat-file -s <hash>   # Show size
./mygit.py cat-file -p <hash>   # Show content

# Hash content
./mygit.py hash-object <file>
./mygit.py hash-object -w <file>
echo "content" | ./mygit.py hash-object --stdin
```

### Object Relationships

```
Commit
├── tree [hash]
│   ├── blob [hash] filename
│   ├── blob [hash] filename
│   └── tree [hash] dirname
│       └── blob [hash] filename
└── parent [hash]
```

### File States Flow

```
Untracked → Staged → Committed
               ↑         ↓
            Modified  ← Clean
```

### Best Practices

1. **Commit often**: Small, logical commits
2. **Check status**: Before and after operations
3. **Write clear messages**: Explain *why*, not just *what*
4. **Stage selectively**: Related changes together
5. **Review history**: Use `log` to understand timeline

## Summary

These examples demonstrate:

1. **Basic operations**: init, add, commit, status, log
2. **Object model**: blobs, trees, commits
3. **Three trees**: HEAD, index, working directory
4. **History building**: Commit chains and relationships
5. **Troubleshooting**: Common issues and solutions
6. **Advanced usage**: Manual object creation, integrity checks

For theoretical understanding, see:
- **git-internals.md**: Architecture and design
- **object-model.md**: Deep dive into objects
- **implementation-guide.md**: How to build it

Happy coding with Git!
