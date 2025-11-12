#!/usr/bin/env python3
"""
mygit - A simplified Git implementation in Python

This is an educational implementation of core Git functionality.
Implements: init, hash-object, add, commit, status, log, cat-file

Author: CodingChallenges.fyi
"""

import os
import sys
import hashlib
import zlib
import time
import argparse
from pathlib import Path
from datetime import datetime

class GitRepository:
    """Represents a Git repository"""

    def __init__(self, path="."):
        self.path = Path(path)
        self.git_dir = self.path / ".git"
        self.objects_dir = self.git_dir / "objects"
        self.refs_dir = self.git_dir / "refs"
        self.heads_dir = self.refs_dir / "heads"
        self.tags_dir = self.refs_dir / "tags"

    def init(self):
        """Initialize a new Git repository"""
        if self.git_dir.exists():
            print(f"Repository already exists at {self.git_dir}")
            return False

        # Create directory structure
        self.git_dir.mkdir(parents=True, exist_ok=True)
        self.objects_dir.mkdir(exist_ok=True)
        (self.objects_dir / "info").mkdir(exist_ok=True)
        (self.objects_dir / "pack").mkdir(exist_ok=True)
        self.refs_dir.mkdir(exist_ok=True)
        self.heads_dir.mkdir(exist_ok=True)
        self.tags_dir.mkdir(exist_ok=True)
        (self.git_dir / "hooks").mkdir(exist_ok=True)
        (self.git_dir / "info").mkdir(exist_ok=True)

        # Write HEAD
        with open(self.git_dir / "HEAD", "w") as f:
            f.write("ref: refs/heads/main\n")

        # Write config
        with open(self.git_dir / "config", "w") as f:
            f.write("[core]\n")
            f.write("\trepositoryformatversion = 0\n")
            f.write("\tfilemode = true\n")
            f.write("\tbare = false\n")

        # Write description
        with open(self.git_dir / "description", "w") as f:
            f.write("Unnamed repository; edit this file 'description' to name the repository.\n")

        # Create empty index
        with open(self.git_dir / "index", "w") as f:
            f.write("")

        print(f"Initialized empty Git repository in {self.git_dir.absolute()}")
        return True

    def hash_object(self, data, obj_type="blob", write=False):
        """
        Hash an object and optionally write it to the object store

        Args:
            data: bytes or str - The data to hash
            obj_type: str - Type of object (blob, tree, commit, tag)
            write: bool - Whether to write to object store

        Returns:
            str: SHA-1 hash of the object
        """
        if isinstance(data, str):
            data = data.encode()

        # Create header
        header = f"{obj_type} {len(data)}\0".encode()
        store = header + data

        # Calculate SHA-1 hash
        sha1 = hashlib.sha1(store).hexdigest()

        if write:
            # Compress data
            compressed = zlib.compress(store)

            # Create subdirectory
            obj_dir = self.objects_dir / sha1[:2]
            obj_dir.mkdir(exist_ok=True)

            # Write object file
            obj_path = obj_dir / sha1[2:]
            with open(obj_path, "wb") as f:
                f.write(compressed)

        return sha1

    def read_object(self, sha1):
        """
        Read an object from the object store

        Args:
            sha1: str - SHA-1 hash of the object

        Returns:
            tuple: (type, data) where type is str and data is bytes
        """
        obj_path = self.objects_dir / sha1[:2] / sha1[2:]

        if not obj_path.exists():
            raise ValueError(f"Object {sha1} not found")

        # Read and decompress
        with open(obj_path, "rb") as f:
            compressed = f.read()

        data = zlib.decompress(compressed)

        # Parse header
        null_index = data.index(b'\0')
        header = data[:null_index].decode()
        content = data[null_index + 1:]

        obj_type, size = header.split(' ')

        return obj_type, content

    def cat_file(self, sha1, show_type=False, show_size=False, pretty_print=False, as_bytes=False):
        """
        Show object content (like git cat-file)

        Args:
            sha1: str - SHA-1 hash
            show_type: bool - Show object type
            show_size: bool - Show object size
            pretty_print: bool - Pretty print content
            as_bytes: bool - Return raw bytes instead of printing

        Returns:
            bytes or str if as_bytes is True, otherwise None
        """
        obj_type, content = self.read_object(sha1)

        if as_bytes:
            if obj_type in ("blob", "tree"):
                return content
            else:
                return content.decode()

        if show_type:
            print(obj_type)
        elif show_size:
            print(len(content))
        elif pretty_print:
            if obj_type == "blob":
                print(content.decode())
            elif obj_type == "tree":
                self._print_tree(content)
            elif obj_type == "commit":
                print(content.decode())
            else:
                print(content.decode())

    def _print_tree(self, data):
        """Print tree object contents"""
        i = 0
        while i < len(data):
            # Read mode
            space_index = data.index(b' ', i)
            mode = data[i:space_index].decode()

            # Read filename
            null_index = data.index(b'\0', space_index)
            filename = data[space_index + 1:null_index].decode()

            # Read SHA-1 (20 bytes)
            sha1_bytes = data[null_index + 1:null_index + 21]
            sha1 = sha1_bytes.hex()

            # Determine type
            obj_type = "tree" if mode == "40000" else "blob"

            print(f"{mode} {obj_type} {sha1}    {filename}")

            i = null_index + 21

    def add(self, filename):
        """
        Add a file to the index (staging area)

        Args:
            filename: str or Path - File to add
        """
        filepath = Path(filename)

        if not filepath.exists():
            print(f"fatal: pathspec '{filename}' did not match any files")
            return False

        # Read file content
        with open(filepath, "rb") as f:
            data = f.read()

        # Hash and store object
        sha1 = self.hash_object(data, obj_type="blob", write=True)

        # Get file mode
        mode = "100755" if os.access(filepath, os.X_OK) else "100644"

        # Update index
        index_entry = f"{mode} {sha1} {filename}\n"

        # Read existing index
        index_path = self.git_dir / "index"
        if index_path.exists():
            with open(index_path, "r") as f:
                lines = f.readlines()
        else:
            lines = []

        # Remove existing entry for this file
        lines = [line for line in lines if not line.endswith(f" {filename}\n")]

        # Add new entry
        lines.append(index_entry)
        lines.sort()  # Keep index sorted

        # Write index
        with open(index_path, "w") as f:
            f.writelines(lines)

        print(f"Added {filename}")
        return True

    def write_tree(self):
        """
        Write a tree object from the current index

        Returns:
            str: SHA-1 hash of the tree object
        """
        index_path = self.git_dir / "index"

        if not index_path.exists() or index_path.stat().st_size == 0:
            # Empty tree
            return self.hash_object(b"", obj_type="tree", write=True)

        # Read index
        with open(index_path, "r") as f:
            lines = f.readlines()

        # Build tree content
        tree_content = b""

        for line in lines:
            parts = line.strip().split()
            if len(parts) != 3:
                continue

            mode, sha1, filename = parts

            # Format: {mode} {filename}\0{20-byte-sha1}
            tree_content += f"{mode} {filename}\0".encode()
            tree_content += bytes.fromhex(sha1)

        # Hash and store tree
        tree_hash = self.hash_object(tree_content, obj_type="tree", write=True)

        return tree_hash

    def commit(self, message, author=None, committer=None):
        """
        Create a commit object

        Args:
            message: str - Commit message
            author: str - Author name and email
            committer: str - Committer name and email

        Returns:
            str: SHA-1 hash of the commit object
        """
        # Write tree from index
        tree_hash = self.write_tree()

        # Get parent commit
        parent_hash = self.get_head_commit()

        # Default author/committer
        if author is None:
            author = os.environ.get("GIT_AUTHOR_NAME", "User")
            email = os.environ.get("GIT_AUTHOR_EMAIL", "user@example.com")
            author = f"{author} <{email}>"

        if committer is None:
            committer = author

        # Get timestamp
        timestamp = int(time.time())
        timezone = time.strftime("%z")
        if not timezone:
            timezone = "+0000"

        # Build commit content
        commit_content = f"tree {tree_hash}\n"

        if parent_hash:
            commit_content += f"parent {parent_hash}\n"

        commit_content += f"author {author} {timestamp} {timezone}\n"
        commit_content += f"committer {committer} {timestamp} {timezone}\n"
        commit_content += f"\n{message}\n"

        # Hash and store commit
        commit_hash = self.hash_object(commit_content, obj_type="commit", write=True)

        # Update branch reference
        branch = self.get_current_branch()
        branch_ref = self.heads_dir / branch
        with open(branch_ref, "w") as f:
            f.write(commit_hash + "\n")

        print(f"[{branch} {commit_hash[:7]}] {message}")
        return commit_hash

    def get_current_branch(self):
        """Get the name of the current branch"""
        head_path = self.git_dir / "HEAD"
        with open(head_path, "r") as f:
            content = f.read().strip()

        if content.startswith("ref: refs/heads/"):
            return content[16:]  # Remove "ref: refs/heads/"
        else:
            return None  # Detached HEAD

    def get_head_commit(self):
        """Get the SHA-1 of the HEAD commit"""
        branch = self.get_current_branch()

        if branch is None:
            # Detached HEAD
            head_path = self.git_dir / "HEAD"
            with open(head_path, "r") as f:
                return f.read().strip()

        branch_ref = self.heads_dir / branch
        if not branch_ref.exists():
            return None  # First commit on this branch

        with open(branch_ref, "r") as f:
            return f.read().strip()

    def log(self, max_count=None):
        """
        Show commit history (like git log)

        Args:
            max_count: int - Maximum number of commits to show
        """
        commit_hash = self.get_head_commit()

        if not commit_hash:
            print("fatal: your current branch 'main' does not have any commits yet")
            return

        count = 0
        while commit_hash:
            if max_count and count >= max_count:
                break

            # Read commit object
            obj_type, content = self.read_object(commit_hash)

            if obj_type != "commit":
                print(f"error: {commit_hash} is not a commit")
                break

            # Parse commit
            lines = content.decode().split('\n')
            tree = None
            parent = None
            author = None
            committer = None
            message_lines = []
            in_message = False

            for line in lines:
                if line.startswith('tree '):
                    tree = line[5:]
                elif line.startswith('parent '):
                    parent = line[7:]
                elif line.startswith('author '):
                    author = line[7:]
                elif line.startswith('committer '):
                    committer = line[10:]
                elif line == '':
                    in_message = True
                elif in_message:
                    message_lines.append(line)

            # Print commit info
            print(f"commit {commit_hash}")
            if author:
                # Parse author info
                parts = author.rsplit(' ', 2)
                if len(parts) == 3:
                    name_email = parts[0]
                    timestamp = int(parts[1])
                    dt = datetime.fromtimestamp(timestamp)
                    print(f"Author: {name_email}")
                    print(f"Date:   {dt.strftime('%a %b %d %H:%M:%S %Y')}")

            print()
            for line in message_lines:
                print(f"    {line}")
            print()

            # Move to parent
            commit_hash = parent
            count += 1

    def status(self):
        """Show working tree status (like git status)"""
        branch = self.get_current_branch()
        print(f"On branch {branch}")

        # Check if there are commits
        head_commit = self.get_head_commit()
        if not head_commit:
            print("\nNo commits yet")

        # Get HEAD tree files (files in last commit)
        head_files = {}
        if head_commit:
            # Read commit object
            commit_type, commit_content = self.read_object(head_commit)
            # Parse commit to get tree hash
            for line in commit_content.decode().split('\n'):
                if line.startswith('tree '):
                    tree_hash = line[5:].strip()
                    # Read tree object
                    tree_type, tree_content = self.read_object(tree_hash)
                    # Parse tree entries
                    i = 0
                    while i < len(tree_content):
                        # Find space (end of mode)
                        space_idx = tree_content.index(b' ', i)
                        mode = tree_content[i:space_idx]
                        # Find null (end of filename)
                        null_idx = tree_content.index(b'\0', space_idx)
                        filename = tree_content[space_idx + 1:null_idx].decode()
                        # Get SHA-1 (20 bytes)
                        sha1_bytes = tree_content[null_idx + 1:null_idx + 21]
                        sha1 = sha1_bytes.hex()
                        head_files[filename] = sha1
                        i = null_idx + 21
                    break

        # Read index
        index_path = self.git_dir / "index"
        staged_files = {}

        if index_path.exists():
            with open(index_path, "r") as f:
                for line in f:
                    parts = line.strip().split()
                    if len(parts) == 3:
                        mode, sha1, filename = parts
                        staged_files[filename] = sha1

        # Get working directory files
        working_files = {}
        for filepath in Path(".").rglob("*"):
            if filepath.is_file() and not str(filepath).startswith(".git"):
                rel_path = str(filepath)
                with open(filepath, "rb") as f:
                    data = f.read()
                # Calculate what the hash would be
                header = f"blob {len(data)}\0".encode()
                sha1 = hashlib.sha1(header + data).hexdigest()
                working_files[rel_path] = sha1

        # Determine changes
        changes_to_commit = []
        changes_not_staged = []
        untracked = []

        # Compare index with HEAD to find changes to be committed
        for filename, sha1 in staged_files.items():
            # Check if file is different from HEAD or new
            if filename not in head_files or head_files[filename] != sha1:
                changes_to_commit.append(filename)

        # Check staged files for unstaged changes
        for filename, sha1 in staged_files.items():
            if filename in working_files:
                if working_files[filename] != sha1:
                    changes_not_staged.append(filename)
            else:
                changes_not_staged.append(f"{filename} (deleted)")

        # Check working files for untracked files
        for filename, sha1 in working_files.items():
            if filename not in staged_files:
                untracked.append(filename)

        # Print status
        if changes_to_commit:
            print("\nChanges to be committed:")
            print("  (use \"git restore --staged <file>...\" to unstage)")
            for filename in changes_to_commit:
                print(f"\t\033[32mnew file:   {filename}\033[0m")

        if changes_not_staged:
            print("\nChanges not staged for commit:")
            print("  (use \"git add <file>...\" to update what will be committed)")
            for filename in changes_not_staged:
                if "(deleted)" in filename:
                    print(f"\t\033[31mdeleted:    {filename}\033[0m")
                else:
                    print(f"\t\033[31mmodified:   {filename}\033[0m")

        if untracked:
            print("\nUntracked files:")
            print("  (use \"git add <file>...\" to include in what will be committed)")
            for filename in untracked:
                print(f"\t\033[31m{filename}\033[0m")

        if not changes_to_commit and not changes_not_staged and not untracked:
            print("\nnothing to commit, working tree clean")

def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(description="A simplified Git implementation")
    subparsers = parser.add_subparsers(dest="command", help="Git command to execute")

    # init command
    parser_init = subparsers.add_parser("init", help="Initialize a new repository")

    # hash-object command
    parser_hash = subparsers.add_parser("hash-object", help="Hash an object")
    parser_hash.add_argument("file", help="File to hash")
    parser_hash.add_argument("-w", "--write", action="store_true", help="Write object to database")

    # cat-file command
    parser_cat = subparsers.add_parser("cat-file", help="Show object content")
    parser_cat.add_argument("-t", "--type", action="store_true", help="Show object type")
    parser_cat.add_argument("-s", "--size", action="store_true", help="Show object size")
    parser_cat.add_argument("-p", "--pretty", action="store_true", help="Pretty print")
    parser_cat.add_argument("object", help="Object SHA-1")

    # add command
    parser_add = subparsers.add_parser("add", help="Add file to staging area")
    parser_add.add_argument("files", nargs="+", help="Files to add")

    # commit command
    parser_commit = subparsers.add_parser("commit", help="Create a commit")
    parser_commit.add_argument("-m", "--message", required=True, help="Commit message")

    # status command
    parser_status = subparsers.add_parser("status", help="Show working tree status")

    # log command
    parser_log = subparsers.add_parser("log", help="Show commit history")
    parser_log.add_argument("-n", "--max-count", type=int, help="Limit number of commits")

    args = parser.parse_args()

    # Create repository object
    repo = GitRepository()

    # Execute command
    if args.command == "init":
        repo.init()

    elif args.command == "hash-object":
        if not repo.git_dir.exists():
            print("fatal: not a git repository")
            sys.exit(1)

        with open(args.file, "rb") as f:
            data = f.read()

        sha1 = repo.hash_object(data, write=args.write)
        print(sha1)

    elif args.command == "cat-file":
        if not repo.git_dir.exists():
            print("fatal: not a git repository")
            sys.exit(1)

        repo.cat_file(args.object,
                     show_type=args.type,
                     show_size=args.size,
                     pretty_print=args.pretty)

    elif args.command == "add":
        if not repo.git_dir.exists():
            print("fatal: not a git repository")
            sys.exit(1)

        for filename in args.files:
            repo.add(filename)

    elif args.command == "commit":
        if not repo.git_dir.exists():
            print("fatal: not a git repository")
            sys.exit(1)

        repo.commit(args.message)

    elif args.command == "status":
        if not repo.git_dir.exists():
            print("fatal: not a git repository")
            sys.exit(1)

        repo.status()

    elif args.command == "log":
        if not repo.git_dir.exists():
            print("fatal: not a git repository")
            sys.exit(1)

        repo.log(max_count=args.max_count)

    else:
        parser.print_help()

if __name__ == "__main__":
    main()
