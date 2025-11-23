"""
Google Colab Notebook for Downloading Google Drive Folder and Pushing to Git

Instructions:
1. Go to https://colab.research.google.com/
2. Create a new notebook
3. Copy and paste each code cell below into separate cells in Colab
4. Run the cells in order

This notebook will:
- Download files from the Google Drive folder
- Clone your git repository
- Copy the downloaded files to the repo
- Commit and push the changes
"""

# ============================================================================
# CELL 1: Mount Google Drive
# ============================================================================
from google.colab import drive
drive.mount('/content/drive')
print("✓ Google Drive mounted successfully!")

# ============================================================================
# CELL 2: Install gdown and setup
# ============================================================================
!pip install -q gdown
import os
import shutil
from pathlib import Path

# Configuration - EDIT THESE VALUES
GDRIVE_FOLDER_URL = "https://drive.google.com/drive/folders/15qe0A89GbjajpVfxx--ybPJ9AupIKDYK"
GIT_REPO_URL = "https://github.com/Encryptioner/acmp-4.0-for-engineers.git"
GIT_BRANCH = "claude/load-add-files-0178hz39eJYYhv1CW4QgRdQd"
DOWNLOAD_FOLDER = "/content/gdrive_downloads"
REPO_FOLDER = "/content/repo"

print("Configuration:")
print(f"  Google Drive Folder: {GDRIVE_FOLDER_URL}")
print(f"  Git Repository: {GIT_REPO_URL}")
print(f"  Git Branch: {GIT_BRANCH}")

# ============================================================================
# CELL 3: Download from Google Drive
# ============================================================================
import re

# Extract folder ID
folder_id = re.search(r'/folders/([a-zA-Z0-9_-]+)', GDRIVE_FOLDER_URL).group(1)
print(f"Folder ID: {folder_id}")

# Create download directory
os.makedirs(DOWNLOAD_FOLDER, exist_ok=True)
os.chdir(DOWNLOAD_FOLDER)

# Download the folder
print("\nDownloading files from Google Drive...")
!gdown --folder {GDRIVE_FOLDER_URL} -O {DOWNLOAD_FOLDER}

# List downloaded files
print("\n✓ Downloaded files:")
for root, dirs, files in os.walk(DOWNLOAD_FOLDER):
    for file in files:
        file_path = os.path.join(root, file)
        relative_path = os.path.relpath(file_path, DOWNLOAD_FOLDER)
        size = os.path.getsize(file_path)
        print(f"  {relative_path} ({size:,} bytes)")

# ============================================================================
# CELL 4: Setup Git credentials (IMPORTANT!)
# ============================================================================
# Option A: Use Personal Access Token (Recommended)
from getpass import getpass

print("Git Authentication Setup")
print("=" * 50)
print("You need to authenticate to push to GitHub.")
print("\nOption 1: Personal Access Token (Recommended)")
print("  1. Go to: https://github.com/settings/tokens")
print("  2. Click 'Generate new token (classic)'")
print("  3. Give it a name and select 'repo' scope")
print("  4. Copy the token and paste it below")
print("\nOption 2: Username & Password")

auth_method = input("\nUse Personal Access Token? (y/n): ").lower()

if auth_method == 'y':
    git_token = getpass("Enter your GitHub Personal Access Token: ")
    git_username = input("Enter your GitHub username: ")

    # Configure git with token
    GIT_REPO_URL_AUTH = GIT_REPO_URL.replace(
        "https://",
        f"https://{git_username}:{git_token}@"
    )
else:
    git_username = input("Enter your GitHub username: ")
    git_password = getpass("Enter your GitHub password: ")

    GIT_REPO_URL_AUTH = GIT_REPO_URL.replace(
        "https://",
        f"https://{git_username}:{git_password}@"
    )

# Configure git user
!git config --global user.name "{git_username}"
git_email = input("Enter your Git email: ")
!git config --global user.email "{git_email}"

print("\n✓ Git credentials configured")

# ============================================================================
# CELL 5: Clone repository
# ============================================================================
# Remove repo folder if exists
if os.path.exists(REPO_FOLDER):
    shutil.rmtree(REPO_FOLDER)

# Clone the repository
print(f"\nCloning repository to {REPO_FOLDER}...")
os.chdir('/content')

# Clone the repo (note: using the authenticated URL)
!git clone {GIT_REPO_URL_AUTH} {REPO_FOLDER}

# Change to repo directory
os.chdir(REPO_FOLDER)

# Checkout the branch
print(f"\nChecking out branch: {GIT_BRANCH}")
!git checkout {GIT_BRANCH}

print("✓ Repository cloned and branch checked out")

# ============================================================================
# CELL 6: Copy downloaded files to repository
# ============================================================================
# Create a target folder in the repo (you can change this)
TARGET_FOLDER = "gdrive_files"  # Change this to your desired folder name
target_path = os.path.join(REPO_FOLDER, TARGET_FOLDER)

print(f"\nCopying files to repository folder: {TARGET_FOLDER}")

# Create target directory
os.makedirs(target_path, exist_ok=True)

# Copy all downloaded files
for item in os.listdir(DOWNLOAD_FOLDER):
    source = os.path.join(DOWNLOAD_FOLDER, item)
    destination = os.path.join(target_path, item)

    if os.path.isfile(source):
        shutil.copy2(source, destination)
        print(f"  Copied: {item}")
    elif os.path.isdir(source):
        if os.path.exists(destination):
            shutil.rmtree(destination)
        shutil.copytree(source, destination)
        print(f"  Copied folder: {item}")

print("\n✓ All files copied to repository")

# List what will be committed
os.chdir(REPO_FOLDER)
!git status

# ============================================================================
# CELL 7: Commit and push changes
# ============================================================================
os.chdir(REPO_FOLDER)

# Add all new files
print("\nAdding files to git...")
!git add .

# Check what's being committed
print("\nFiles to be committed:")
!git status

# Commit the changes
commit_message = """Add files from Google Drive folder

Downloaded and added files from Google Drive folder:
{GDRIVE_FOLDER_URL}

Target location: {TARGET_FOLDER}/
"""

print(f"\nCommitting with message:")
print(commit_message)

!git commit -m "{commit_message}"

# Push to the branch
print(f"\nPushing to branch: {GIT_BRANCH}")
!git push -u origin {GIT_BRANCH}

print("\n" + "=" * 50)
print("✓ SUCCESS! Files have been pushed to GitHub")
print("=" * 50)
print(f"\nRepository: {GIT_REPO_URL}")
print(f"Branch: {GIT_BRANCH}")
print(f"Files location: {TARGET_FOLDER}/")

# ============================================================================
# CELL 8 (Optional): Verify the push
# ============================================================================
print("\nVerifying remote repository...")
!git log -1 --stat

print("\nRemote branches:")
!git branch -r

print("\n✓ All done! Check your GitHub repository to see the files.")
