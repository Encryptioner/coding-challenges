#!/usr/bin/env python3
"""
Google Drive Downloader Tool
Downloads files and folders from Google Drive using multiple fallback methods.
"""

import os
import sys
import re
import json
import time
import argparse
import subprocess
from pathlib import Path
from typing import Optional, List, Dict, Tuple
import urllib.request
import urllib.parse
import urllib.error


class GoogleDriveDownloader:
    """Download files and folders from Google Drive."""

    def __init__(self, output_dir: str = "./downloads", verbose: bool = True):
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)
        self.verbose = verbose
        self.session_cookies = {}

    def log(self, message: str):
        """Print message if verbose is enabled."""
        if self.verbose:
            print(f"[GDrive] {message}")

    def extract_id_from_url(self, url: str) -> Tuple[Optional[str], str]:
        """
        Extract file/folder ID from Google Drive URL.
        Returns (id, type) where type is 'file' or 'folder'.
        """
        # Folder URL: https://drive.google.com/drive/folders/FOLDER_ID
        folder_match = re.search(r'/folders/([a-zA-Z0-9_-]+)', url)
        if folder_match:
            return folder_match.group(1), 'folder'

        # File URL: https://drive.google.com/file/d/FILE_ID/view
        file_match = re.search(r'/file/d/([a-zA-Z0-9_-]+)', url)
        if file_match:
            return file_match.group(1), 'file'

        # Direct ID: https://drive.google.com/open?id=FILE_ID
        open_match = re.search(r'[?&]id=([a-zA-Z0-9_-]+)', url)
        if open_match:
            return open_match.group(1), 'file'

        # If it's just an ID (25-50 chars, alphanumeric with - and _)
        if re.match(r'^[a-zA-Z0-9_-]{25,50}$', url):
            return url, 'unknown'

        return None, 'unknown'

    def download_file_direct(self, file_id: str, output_path: Optional[str] = None,
                            filename: Optional[str] = None) -> bool:
        """
        Download a single file using direct download URL.
        """
        if not output_path:
            output_path = self.output_dir / (filename or f"file_{file_id}")
        else:
            output_path = Path(output_path)

        # Try multiple URL formats
        urls_to_try = [
            f"https://drive.google.com/uc?export=download&id={file_id}",
            f"https://drive.google.com/uc?id={file_id}&export=download",
            f"https://docs.google.com/uc?export=download&id={file_id}",
        ]

        for url in urls_to_try:
            self.log(f"Trying to download from: {url}")
            try:
                # Create a request with headers
                headers = {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                }

                request = urllib.request.Request(url, headers=headers)

                with urllib.request.urlopen(request, timeout=30) as response:
                    content = response.read()

                    # Check if we got a virus scan warning page
                    if b'Google Drive - Virus scan warning' in content or b'download_warning' in content:
                        self.log("Got virus scan warning, extracting confirm link...")
                        # Extract the confirm parameter
                        confirm_match = re.search(rb'confirm=([^&"]+)', content)
                        if confirm_match:
                            confirm = confirm_match.group(1).decode('utf-8')
                            confirm_url = f"https://drive.google.com/uc?export=download&id={file_id}&confirm={confirm}"
                            self.log(f"Retrying with confirm: {confirm_url}")

                            request = urllib.request.Request(confirm_url, headers=headers)
                            with urllib.request.urlopen(request, timeout=30) as confirm_response:
                                content = confirm_response.read()

                    # Try to get filename from Content-Disposition header
                    if not filename:
                        content_disp = response.headers.get('Content-Disposition', '')
                        filename_match = re.search(r'filename="?([^"]+)"?', content_disp)
                        if filename_match:
                            filename = filename_match.group(1)
                            output_path = self.output_dir / filename

                    # Write file
                    output_path.parent.mkdir(parents=True, exist_ok=True)
                    with open(output_path, 'wb') as f:
                        f.write(content)

                    self.log(f"✓ Downloaded: {output_path} ({len(content)} bytes)")
                    return True

            except urllib.error.HTTPError as e:
                self.log(f"✗ HTTP Error {e.code}: {e.reason}")
            except urllib.error.URLError as e:
                self.log(f"✗ URL Error: {e.reason}")
            except Exception as e:
                self.log(f"✗ Error: {e}")

        return False

    def download_with_gdown(self, url_or_id: str, is_folder: bool = False) -> bool:
        """
        Download using gdown library/command.
        """
        try:
            # Try using gdown as Python library first
            import gdown

            if is_folder:
                self.log("Attempting folder download with gdown library...")
                result = gdown.download_folder(url=url_or_id, output=str(self.output_dir), quiet=not self.verbose)
                return result is not None
            else:
                self.log("Attempting file download with gdown library...")
                output = gdown.download(url=url_or_id, output=str(self.output_dir), quiet=not self.verbose, fuzzy=True)
                return output is not None

        except ImportError:
            self.log("gdown library not available, trying command line...")

        # Try gdown command line
        try:
            cmd = ['gdown']
            if is_folder:
                cmd.extend(['--folder', url_or_id, '-O', str(self.output_dir)])
            else:
                cmd.extend([url_or_id, '-O', str(self.output_dir)])

            self.log(f"Running: {' '.join(cmd)}")
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=300)

            if result.returncode == 0:
                self.log("✓ gdown succeeded")
                self.log(result.stdout)
                return True
            else:
                self.log(f"✗ gdown failed: {result.stderr}")
                return False

        except FileNotFoundError:
            self.log("gdown command not found")
        except subprocess.TimeoutExpired:
            self.log("gdown command timed out")
        except Exception as e:
            self.log(f"gdown error: {e}")

        return False

    def download_with_wget(self, file_id: str, filename: Optional[str] = None) -> bool:
        """
        Download using wget with cookies to handle large files.
        """
        try:
            # First request to get the confirmation token
            url = f"https://drive.google.com/uc?export=download&id={file_id}"
            cookie_file = self.output_dir / f".cookies_{file_id}.txt"

            # Get confirmation token
            cmd1 = [
                'wget', '--quiet', '--save-cookies', str(cookie_file),
                '--keep-session-cookies', '--no-check-certificate',
                url, '-O-'
            ]

            result = subprocess.run(cmd1, capture_output=True, text=True, timeout=30)

            # Extract confirm token from response
            confirm_match = re.search(r'confirm=([^&"]+)', result.stdout)

            if confirm_match:
                confirm = confirm_match.group(1)
                download_url = f"{url}&confirm={confirm}"
            else:
                download_url = url

            # Download the file
            output_file = self.output_dir / (filename or f"file_{file_id}")
            cmd2 = [
                'wget', '--load-cookies', str(cookie_file),
                '--no-check-certificate', download_url,
                '-O', str(output_file)
            ]

            self.log(f"Downloading with wget to {output_file}...")
            result = subprocess.run(cmd2, capture_output=True, text=True, timeout=300)

            # Clean up cookies
            if cookie_file.exists():
                cookie_file.unlink()

            if result.returncode == 0 and output_file.exists():
                self.log(f"✓ Downloaded with wget: {output_file}")
                return True
            else:
                self.log(f"✗ wget failed: {result.stderr}")
                return False

        except FileNotFoundError:
            self.log("wget not found")
        except Exception as e:
            self.log(f"wget error: {e}")

        return False

    def download_with_curl(self, file_id: str, filename: Optional[str] = None) -> bool:
        """
        Download using curl.
        """
        try:
            url = f"https://drive.google.com/uc?export=download&id={file_id}"
            output_file = self.output_dir / (filename or f"file_{file_id}")

            cmd = [
                'curl', '-L', '-C', '-',
                '-H', 'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                url, '-o', str(output_file)
            ]

            self.log(f"Downloading with curl to {output_file}...")
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=300)

            if result.returncode == 0 and output_file.exists():
                self.log(f"✓ Downloaded with curl: {output_file}")
                return True
            else:
                self.log(f"✗ curl failed: {result.stderr}")
                return False

        except FileNotFoundError:
            self.log("curl not found")
        except Exception as e:
            self.log(f"curl error: {e}")

        return False

    def download(self, url: str, output_dir: Optional[str] = None) -> bool:
        """
        Main download method that tries multiple approaches.
        """
        if output_dir:
            self.output_dir = Path(output_dir)
            self.output_dir.mkdir(parents=True, exist_ok=True)

        self.log(f"Processing URL: {url}")

        # Extract ID and type
        file_id, resource_type = self.extract_id_from_url(url)

        if not file_id:
            self.log(f"✗ Could not extract file/folder ID from URL: {url}")
            return False

        self.log(f"Extracted ID: {file_id} (type: {resource_type})")

        # Try different download methods in order
        methods = []

        if resource_type == 'folder':
            self.log("Detected folder, trying folder download methods...")
            methods = [
                ('gdown (folder)', lambda: self.download_with_gdown(url, is_folder=True)),
            ]
        else:
            self.log("Detected file, trying file download methods...")
            methods = [
                ('gdown', lambda: self.download_with_gdown(url, is_folder=False)),
                ('direct download', lambda: self.download_file_direct(file_id)),
                ('wget', lambda: self.download_with_wget(file_id)),
                ('curl', lambda: self.download_with_curl(file_id)),
            ]

        for method_name, method_func in methods:
            self.log(f"\n=== Trying method: {method_name} ===")
            try:
                if method_func():
                    self.log(f"\n✓ SUCCESS! Downloaded using {method_name}")
                    return True
            except Exception as e:
                self.log(f"✗ {method_name} failed with exception: {e}")
                import traceback
                if self.verbose:
                    traceback.print_exc()

            # Small delay between methods
            time.sleep(1)

        self.log("\n✗ All download methods failed")
        return False


def main():
    parser = argparse.ArgumentParser(
        description='Download files and folders from Google Drive',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Download a folder
  python gdrive_downloader.py https://drive.google.com/drive/folders/FOLDER_ID

  # Download a file
  python gdrive_downloader.py https://drive.google.com/file/d/FILE_ID/view

  # Download to specific directory
  python gdrive_downloader.py -o ./my_downloads https://drive.google.com/drive/folders/FOLDER_ID

  # Download using just the ID
  python gdrive_downloader.py -f FOLDER_ID
        """
    )

    parser.add_argument('url', nargs='?', help='Google Drive URL or ID')
    parser.add_argument('-f', '--folder-id', help='Google Drive folder ID')
    parser.add_argument('-i', '--file-id', help='Google Drive file ID')
    parser.add_argument('-o', '--output', default='./downloads',
                       help='Output directory (default: ./downloads)')
    parser.add_argument('-q', '--quiet', action='store_true',
                       help='Quiet mode (less verbose)')

    args = parser.parse_args()

    # Determine what to download
    url = None
    if args.url:
        url = args.url
    elif args.folder_id:
        url = f"https://drive.google.com/drive/folders/{args.folder_id}"
    elif args.file_id:
        url = f"https://drive.google.com/file/d/{args.file_id}/view"
    else:
        parser.print_help()
        sys.exit(1)

    # Create downloader and download
    downloader = GoogleDriveDownloader(
        output_dir=args.output,
        verbose=not args.quiet
    )

    success = downloader.download(url)
    sys.exit(0 if success else 1)


if __name__ == '__main__':
    main()
