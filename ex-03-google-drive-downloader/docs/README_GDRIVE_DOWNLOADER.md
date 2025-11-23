# Google Drive Downloader Tool

A comprehensive Python tool to download files and folders from Google Drive using multiple fallback methods.

## Features

- Downloads both individual files and entire folders
- Multiple download methods with automatic fallback
- Handles large files with virus scan warnings
- Supports various Google Drive URL formats
- Retry logic and error handling

## Installation

### Prerequisites

```bash
# Install Python dependencies
pip install gdown

# Optional: Install wget and curl if not already available
# Ubuntu/Debian:
sudo apt-get install wget curl

# macOS:
brew install wget curl
```

## Usage

### Basic Usage

```bash
# Download a folder
python gdrive_downloader.py "https://drive.google.com/drive/folders/FOLDER_ID"

# Download a file
python gdrive_downloader.py "https://drive.google.com/file/d/FILE_ID/view"

# Download to a specific directory
python gdrive_downloader.py -o ./my_downloads "https://drive.google.com/drive/folders/FOLDER_ID"
```

### Using Folder/File IDs Directly

```bash
# Using folder ID
python gdrive_downloader.py -f FOLDER_ID

# Using file ID
python gdrive_downloader.py -i FILE_ID
```

### Command Line Options

```
positional arguments:
  url                   Google Drive URL or ID

optional arguments:
  -h, --help            Show help message
  -f, --folder-id ID    Google Drive folder ID
  -i, --file-id ID      Google Drive file ID
  -o, --output DIR      Output directory (default: ./downloads)
  -q, --quiet           Quiet mode (less verbose)
```

## Supported URL Formats

The tool automatically detects and handles these Google Drive URL formats:

- Folder: `https://drive.google.com/drive/folders/FOLDER_ID`
- File: `https://drive.google.com/file/d/FILE_ID/view`
- Open: `https://drive.google.com/open?id=FILE_ID`
- Direct ID: `FILE_OR_FOLDER_ID`

## Download Methods

The tool attempts multiple download methods in sequence:

### For Folders:
1. **gdown library** - Python library for Google Drive downloads
2. **gdown CLI** - Command-line version of gdown

### For Files:
1. **gdown library** - Fastest method when available
2. **Direct download** - Using urllib with proper headers
3. **wget** - With cookie handling for large files
4. **curl** - With resume capability

## Troubleshooting

### Proxy Issues

If you're behind a proxy that blocks Google Drive, you may need to:

1. **Temporarily disable proxy for Google domains:**
   ```bash
   export NO_PROXY="$NO_PROXY,*.google.com,*.googleapis.com"
   ```

2. **Use a VPN or different network**

3. **Download manually and specify the path:**
   ```bash
   # Download from Google Drive to your local machine first
   # Then copy files to the desired location
   ```

### Permission Issues

If you get "Access Denied" errors:

1. Verify the folder/file has "Anyone with the link" access
2. Check if the share link is correct
3. Try accessing the link in a web browser first

### Large Files

For large files that require virus scan confirmation:

- The tool automatically handles virus scan warnings
- If download fails, try the wget or curl methods explicitly

## Examples

### Example 1: Download Training Data
```bash
python gdrive_downloader.py \
  -o ./training_data \
  "https://drive.google.com/drive/folders/15qe0A89GbjajpVfxx--ybPJ9AupIKDYK"
```

### Example 2: Download Single Model File
```bash
python gdrive_downloader.py \
  -o ./models \
  "https://drive.google.com/file/d/1ABCdef123456789/view"
```

### Example 3: Quiet Mode Download
```bash
python gdrive_downloader.py -q -f FOLDER_ID
```

## How It Works

1. **URL Parsing**: Extracts file/folder ID from various URL formats
2. **Type Detection**: Determines if resource is a file or folder
3. **Method Selection**: Chooses appropriate download methods
4. **Fallback Strategy**: Tries each method until one succeeds
5. **Error Handling**: Provides detailed error messages for troubleshooting

## API Reference

### GoogleDriveDownloader Class

```python
from gdrive_downloader import GoogleDriveDownloader

# Create downloader instance
downloader = GoogleDriveDownloader(
    output_dir="./downloads",
    verbose=True
)

# Download a resource
success = downloader.download("https://drive.google.com/drive/folders/FOLDER_ID")
```

### Methods

- `extract_id_from_url(url)` - Extract file/folder ID from URL
- `download_file_direct(file_id, output_path, filename)` - Direct file download
- `download_with_gdown(url_or_id, is_folder)` - Download using gdown
- `download_with_wget(file_id, filename)` - Download using wget
- `download_with_curl(file_id, filename)` - Download using curl
- `download(url, output_dir)` - Main download method

## License

This tool is provided as-is for downloading publicly accessible Google Drive content.

## Notes

- Ensure you have permission to download the files
- Large downloads may take time depending on your internet connection
- The tool respects Google Drive's rate limits and terms of service
