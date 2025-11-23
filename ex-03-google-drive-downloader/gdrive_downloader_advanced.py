#!/usr/bin/env python3
"""
Advanced Google Drive Downloader with API support
This version includes Google Drive API integration for better reliability.
"""

import os
import sys
import json
import argparse
from pathlib import Path
from typing import Optional, List, Dict
import urllib.request
import urllib.parse
import re


class GoogleDriveAPIDownloader:
    """
    Download files using Google Drive API (requires API key or OAuth).
    """

    def __init__(self, output_dir: str = "./downloads", api_key: Optional[str] = None):
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)
        self.api_key = api_key or os.environ.get('GOOGLE_DRIVE_API_KEY')
        self.base_url = "https://www.googleapis.com/drive/v3"

    def list_folder_contents(self, folder_id: str) -> List[Dict]:
        """
        List all files in a folder using the API.
        """
        if not self.api_key:
            raise ValueError("API key required. Set GOOGLE_DRIVE_API_KEY environment variable or pass --api-key")

        files = []
        page_token = None

        while True:
            params = {
                'q': f"'{folder_id}' in parents and trashed=false",
                'fields': 'nextPageToken, files(id, name, mimeType, size)',
                'key': self.api_key,
                'pageSize': 100,
            }

            if page_token:
                params['pageToken'] = page_token

            url = f"{self.base_url}/files?" + urllib.parse.urlencode(params)

            try:
                with urllib.request.urlopen(url) as response:
                    data = json.loads(response.read().decode('utf-8'))
                    files.extend(data.get('files', []))

                    page_token = data.get('nextPageToken')
                    if not page_token:
                        break

            except Exception as e:
                print(f"Error listing folder contents: {e}")
                break

        return files

    def download_file(self, file_id: str, file_name: str) -> bool:
        """
        Download a file using the API.
        """
        if not self.api_key:
            # Try without API key (public files)
            url = f"{self.base_url}/files/{file_id}?alt=media"
        else:
            url = f"{self.base_url}/files/{file_id}?alt=media&key={self.api_key}"

        output_path = self.output_dir / file_name

        try:
            print(f"Downloading: {file_name}")

            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }

            request = urllib.request.Request(url, headers=headers)

            with urllib.request.urlopen(request) as response:
                with open(output_path, 'wb') as f:
                    while True:
                        chunk = response.read(8192)
                        if not chunk:
                            break
                        f.write(chunk)

            print(f"✓ Downloaded: {output_path}")
            return True

        except Exception as e:
            print(f"✗ Error downloading {file_name}: {e}")
            return False

    def download_folder(self, folder_id: str) -> int:
        """
        Download all files from a folder.
        Returns the number of successfully downloaded files.
        """
        print(f"Listing folder contents: {folder_id}")
        files = self.list_folder_contents(folder_id)

        if not files:
            print("No files found or could not access folder")
            return 0

        print(f"Found {len(files)} items")

        success_count = 0
        for file_info in files:
            file_id = file_info['id']
            file_name = file_info['name']
            mime_type = file_info.get('mimeType', '')

            # Skip folders (handle recursively if needed)
            if 'folder' in mime_type:
                print(f"Skipping folder: {file_name}")
                # Could implement recursive folder download here
                continue

            if self.download_file(file_id, file_name):
                success_count += 1

        return success_count


def create_manual_download_script(folder_id: str, output_file: str = "download_instructions.txt"):
    """
    Create a text file with manual download instructions and alternative methods.
    """
    content = f"""
# Google Drive Download Instructions
=====================================

Folder ID: {folder_id}
Folder URL: https://drive.google.com/drive/folders/{folder_id}

## Manual Download Methods:

### Method 1: Browser Download
1. Open the folder URL in your web browser
2. Click on the folder name at the top
3. Select "Download" from the menu
4. Extract the downloaded ZIP file

### Method 2: Google Drive Desktop App
1. Install Google Drive for Desktop
2. Navigate to the shared folder
3. Right-click and select "Available offline"
4. Files will sync to your local machine

### Method 3: Using rclone (Advanced)
1. Install rclone: https://rclone.org/downloads/
2. Configure Google Drive remote:
   rclone config
3. Download the folder:
   rclone copy "gdrive:{folder_id}" ./downloads -P

### Method 4: Individual File Downloads
If the folder has individual files, you can download them one by one:

To get individual file download links:
1. Open each file in the folder
2. Click "File" → "Download" or use the download icon
3. Or get shareable link and modify URL:

   Original: https://drive.google.com/file/d/FILE_ID/view?usp=sharing
   Download: https://drive.google.com/uc?export=download&id=FILE_ID

### Method 5: Google Colab (for Python users)
If you have a Google account, use Google Colab:

```python
from google.colab import drive
drive.mount('/content/drive')

# Navigate to the shared folder and copy files
!cp -r "/content/drive/Shareddrives/PATH_TO_FOLDER" ./downloads
```

### Method 6: Using API with Service Account
1. Create a Google Cloud Project
2. Enable Google Drive API
3. Create a Service Account and download credentials.json
4. Share the folder with the service account email
5. Use the gdrive_downloader_advanced.py script with credentials

### Method 7: gdown alternative syntax
Try these alternative gdown commands:

```bash
# Install gdown
pip install gdown

# Try different formats
gdown --folder {folder_id}
gdown --folder https://drive.google.com/drive/folders/{folder_id}
gdown --fuzzy --folder "https://drive.google.com/drive/folders/{folder_id}"
```

## Troubleshooting Network Issues:

If you're behind a proxy or firewall:

1. Try from a different network (mobile hotspot, home network, etc.)
2. Use a VPN service
3. Ask your network administrator to whitelist Google Drive domains:
   - *.google.com
   - *.googleapis.com
   - *.gstatic.com

## Alternative Hosting:

If Google Drive continues to be problematic, consider:
1. Uploading files to GitHub (for files < 100MB)
2. Using transfer.sh or file.io for temporary sharing
3. Using Dropbox, OneDrive, or other cloud storage
4. Setting up a simple HTTP server

For large files/datasets:
- Academic Torrents (for research data)
- Zenodo (for research datasets)
- AWS S3 with public bucket
- Hugging Face Hub (for ML models/datasets)

"""

    with open(output_file, 'w') as f:
        f.write(content)

    print(f"✓ Created manual download instructions: {output_file}")


def main():
    parser = argparse.ArgumentParser(
        description='Advanced Google Drive Downloader with API support'
    )

    parser.add_argument('url_or_id', nargs='?', help='Google Drive URL or ID')
    parser.add_argument('-f', '--folder-id', help='Google Drive folder ID')
    parser.add_argument('-o', '--output', default='./downloads', help='Output directory')
    parser.add_argument('--api-key', help='Google Drive API key')
    parser.add_argument('--create-instructions', action='store_true',
                       help='Create manual download instructions file')

    args = parser.parse_args()

    # Extract folder ID
    folder_id = args.folder_id
    if args.url_or_id:
        match = re.search(r'/folders/([a-zA-Z0-9_-]+)', args.url_or_id)
        if match:
            folder_id = match.group(1)
        elif re.match(r'^[a-zA-Z0-9_-]{25,50}$', args.url_or_id):
            folder_id = args.url_or_id

    if not folder_id:
        print("Error: Could not determine folder ID")
        print("Provide a Google Drive URL or folder ID")
        parser.print_help()
        sys.exit(1)

    # Create instructions file if requested
    if args.create_instructions:
        create_manual_download_script(folder_id, f"{args.output}/DOWNLOAD_INSTRUCTIONS.txt")
        return

    # Try API download
    try:
        downloader = GoogleDriveAPIDownloader(
            output_dir=args.output,
            api_key=args.api_key
        )

        count = downloader.download_folder(folder_id)
        print(f"\n✓ Successfully downloaded {count} files")

        if count == 0:
            print("\nNo files downloaded. Try:")
            print(f"  python {sys.argv[0]} -f {folder_id} --create-instructions")
            print("  to generate alternative download methods")

    except Exception as e:
        print(f"Error: {e}")
        print(f"\nCreating manual download instructions...")
        create_manual_download_script(folder_id, f"{args.output}/DOWNLOAD_INSTRUCTIONS.txt")
        sys.exit(1)


if __name__ == '__main__':
    main()
