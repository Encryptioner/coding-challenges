# Google Colab Setup Guide for Downloading Google Drive Files to Git

> **Your Files Are Stuck in Google Drive. Let's Free Them.** ☁️➡️💾
>
> Got code, assets, or documentation trapped in a Google Drive folder that needs to make its way into Git? Corporate firewall blocking direct access? Working from a device where you can't install Git? Or maybe you just want a dead-simple way to bulk-transfer files without fiddling with the gdown CLI?
>
> **Enter Google Colab**—Google's free cloud Python environment that gives you the best of both worlds: seamless Google Drive access *and* a full Linux environment with Git pre-installed. No local setup. No proxy headaches. Just a browser and 3 minutes of your time.
>
> **What you'll accomplish:**
> - Download an entire Google Drive folder (with nested files)
> - Commit those files to a specific Git branch
> - Push to GitHub without ever touching your local machine
> - All from a simple Jupyter notebook that you can reuse anytime
>
> **Why this rocks:**
> - **100% free** (courtesy of Google's generosity)
> - **Zero installation** (runs entirely in your browser)
> - **Works anywhere** (Chromebook, tablet, locked-down corporate machine—doesn't matter)
> - **Reusable** (save the notebook, run it again whenever you need to sync files)
>
> Perfect for onboarding projects, migrating legacy files, or just getting stuff into Git without the usual hassle. Let's get started.

## Overview
This guide will help you download files from Google Drive and push them to your GitHub repository using Google Colab (a free cloud environment).

## Why Google Colab?
- ✓ Free cloud-based Python environment
- ✓ Direct access to Google Drive (no proxy issues)
- ✓ Git pre-installed
- ✓ No local device needed
- ✓ Works from any web browser

## Quick Start (3 Minutes)

### Step 1: Open Google Colab
1. Go to: **https://colab.research.google.com/**
2. Sign in with your Google account
3. Click **"New Notebook"**

### Step 2: Upload the Notebook (EASIEST METHOD)
**Option A: Use the pre-made notebook**
1. In Colab, click `File` → `Upload notebook`
2. Click `GitHub` tab
3. Paste this URL: `https://github.com/Encryptioner/acmp-4.0-for-engineers/blob/claude/load-add-files-0178hz39eJYYhv1CW4QgRdQd/DOWNLOAD_GDRIVE_TO_GIT.ipynb`
4. Click the notebook when it appears

**Option B: Copy-paste the code**
1. Keep reading below for manual setup

### Step 3: Configure Your Settings
In the notebook, edit these values in Cell 2:
```python
GDRIVE_FOLDER_URL = "https://drive.google.com/drive/folders/15qe0A89GbjajpVfxx--ybPJ9AupIKDYK"
GIT_REPO_URL = "https://github.com/Encryptioner/acmp-4.0-for-engineers.git"
GIT_BRANCH = "claude/load-add-files-0178hz39eJYYhv1CW4QgRdQd"
TARGET_FOLDER = "gdrive_files"  # Where to put files in your repo
```

### Step 4: Get GitHub Personal Access Token
You need this to push to GitHub:

1. Go to: **https://github.com/settings/tokens**
2. Click **"Generate new token"** → **"Generate new token (classic)"**
3. Give it a name: `Colab Git Push`
4. Select scope: **`repo`** (check the box)
5. Click **"Generate token"**
6. **COPY THE TOKEN** (you won't see it again!)

### Step 5: Run the Notebook
1. Run each cell in order (Click play button ▶ or press Shift+Enter)
2. When prompted, enter your GitHub credentials:
   - Username: Your GitHub username
   - Token: Paste the token you copied
   - Email: Your git email

### Step 6: Verify
1. Check your GitHub repository
2. Go to the branch: `claude/load-add-files-0178hz39eJYYhv1CW4QgRdQd`
3. You should see the files in the `gdrive_files/` folder

## Manual Setup (Copy-Paste Method)

If you prefer to create the notebook manually, here are the cells:

### Cell 1: Mount Google Drive
```python
from google.colab import drive
drive.mount('/content/drive')
```

### Cell 2: Configuration
```python
# EDIT THESE VALUES
GDRIVE_FOLDER_URL = "https://drive.google.com/drive/folders/15qe0A89GbjajpVfxx--ybPJ9AupIKDYK"
GIT_REPO_URL = "https://github.com/Encryptioner/acmp-4.0-for-engineers.git"
GIT_BRANCH = "claude/load-add-files-0178hz39eJYYhv1CW4QgRdQd"
TARGET_FOLDER = "gdrive_files"  # Where files will go in your repo
```

### Cell 3: Download from Google Drive
```python
!pip install -q gdown
import re

folder_id = re.search(r'/folders/([a-zA-Z0-9_-]+)', GDRIVE_FOLDER_URL).group(1)
!gdown --folder {folder_id} -O /content/downloads
```

### Cell 4: Setup Git Authentication
```python
from getpass import getpass

username = input("GitHub username: ")
token = getpass("GitHub token: ")
email = input("Git email: ")

!git config --global user.name "{username}"
!git config --global user.email "{email}"

# Create authenticated repo URL
GIT_REPO_AUTH = GIT_REPO_URL.replace("https://", f"https://{username}:{token}@")
```

### Cell 5: Clone and Setup Repository
```python
!git clone {GIT_REPO_AUTH} /content/repo
%cd /content/repo
!git checkout {GIT_BRANCH}
```

### Cell 6: Copy Files to Repository
```python
import shutil
import os

# Copy downloaded files to repo
target_path = f"/content/repo/{TARGET_FOLDER}"
os.makedirs(target_path, exist_ok=True)

for item in os.listdir("/content/downloads"):
    source = f"/content/downloads/{item}"
    dest = f"{target_path}/{item}"
    if os.path.isdir(source):
        shutil.copytree(source, dest, dirs_exist_ok=True)
    else:
        shutil.copy2(source, dest)

print(f"✓ Files copied to {TARGET_FOLDER}/")
!ls -la {target_path}
```

### Cell 7: Commit and Push
```python
%cd /content/repo
!git add .
!git commit -m "Add files from Google Drive folder"
!git push -u origin {GIT_BRANCH}

print("✓ Successfully pushed to GitHub!")
```

## Troubleshooting

### "Failed to retrieve folder contents"
- Make sure the Google Drive folder is set to "Anyone with the link can view"
- Try clicking the folder link in a browser first to verify access

### "Authentication failed"
- Double-check your GitHub username
- Make sure you copied the Personal Access Token correctly
- Verify the token has `repo` scope

### "Permission denied"
- Ensure you have write access to the repository
- Check that the branch name is correct

### "Branch not found"
- The branch might not exist yet on remote
- Try changing to: `!git push -u origin {GIT_BRANCH}` (creates new branch)

### Files are too large
- Google Colab has disk space limits (~100GB)
- For very large datasets, consider alternative methods

## Alternative Cloud Platforms

If Google Colab doesn't work:

### 1. **GitHub Codespaces** (if you have access)
   - Go to your GitHub repo → Code → Codespaces → New codespace
   - Run the downloader scripts directly

### 2. **Replit**
   - Go to: https://replit.com/
   - Create a new Python repl
   - Upload the downloader scripts
   - Run them

### 3. **Kaggle Notebooks**
   - Go to: https://www.kaggle.com/code
   - Create new notebook
   - Similar to Colab but different interface

### 4. **PythonAnywhere** (Free tier)
   - Go to: https://www.pythonanywhere.com/
   - Free tier includes bash console
   - Can run git and download scripts

## Security Notes

⚠️ **Important Security Practices:**
- Never commit your GitHub token to the repository
- Delete the token after use if it was temporary
- Use tokens with minimal required permissions
- Consider using GitHub CLI (`gh auth login`) for better security

## Need Help?

If you encounter issues:
1. Check the Colab notebook output for error messages
2. Verify all URLs and credentials are correct
3. Make sure the Google Drive folder is publicly accessible
4. Check your GitHub repository permissions

## Summary

**Fastest Path:**
1. Open Google Colab
2. Create new notebook
3. Copy cells from this guide
4. Edit configuration values
5. Get GitHub token
6. Run all cells
7. Check GitHub for your files

**Estimated Time:** 5-10 minutes

Good luck! 🚀
