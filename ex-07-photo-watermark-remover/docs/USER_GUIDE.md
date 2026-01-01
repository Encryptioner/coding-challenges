# User Guide: Photo Watermark Remover

Complete guide for using the Photo Watermark Remover application.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Uploading Images](#uploading-images)
3. [Processing Images](#processing-images)
4. [Downloading Results](#downloading-results)
5. [Tips for Best Results](#tips-for-best-results)
6. [Troubleshooting](#troubleshooting)
7. [Privacy & Security](#privacy--security)
8. [Legal Information](#legal-information)

---

## Getting Started

### System Requirements

- **Browser**: Chrome, Firefox, Safari, Edge (modern versions)
- **Internet**: Required for first load only (downloads OpenCV.js ~7MB)
- **Storage**: ~10MB for app cache
- **JavaScript**: Must be enabled

### First Time Setup

1. Visit the application URL
2. Wait for OpenCV.js to load (10-30 seconds on first visit)
3. Grant any required permissions if prompted
4. Start using immediately!

### Offline Usage

After the first load:
- The app works completely offline
- OpenCV.js is cached in your browser
- No internet required for processing
- Can be installed as PWA (see below)

### Installing as App (PWA)

**Desktop**:
1. Look for install icon in browser address bar
2. Click "Install" or "Add to Desktop"
3. App opens in standalone window

**Mobile**:
1. Tap browser menu (⋮)
2. Select "Add to Home Screen"
3. App appears on home screen like native app

---

## Uploading Images

### Supported Formats

✅ PNG (.png)
✅ JPEG/JPG (.jpg, .jpeg)
✅ WebP (.webp)

### File Size Limits

- **Maximum**: 10MB per image
- **Recommended**: < 5MB for faster processing
- **No minimum**: Any size works

### Upload Methods

#### Method 1: Drag & Drop

1. Click "Upload" tab
2. Drag image files from your computer
3. Drop them into the upload area
4. Files are added immediately

#### Method 2: File Browser

1. Click "Upload" tab
2. Click "Select Images" button
3. Choose files in file browser
4. Click "Open"

#### Method 3: Multiple Files

- Select/drag multiple files at once
- Process them in batch
- Save time!

### Upload Validation

The app automatically:
- ✅ Checks file format
- ✅ Validates file size
- ✅ Shows error for invalid files
- ✅ Loads valid files

**Common Errors**:
- "Unsupported format" → Use PNG/JPG/WebP
- "File too large" → Reduce size to < 10MB
- "Failed to load" → File may be corrupted

---

## Processing Images

### Automatic Processing

1. Upload images (see above)
2. Switch to "Process" tab
3. Click "Process All" button
4. Wait for completion

### Individual Processing

1. Go to "Process" tab
2. Find image in queue
3. Click "Process" button next to it
4. Watch progress indicator

### Processing Stages

Each image goes through:

1. **Loading** (25%): Reading image data
2. **Detection** (50%): Finding watermark regions
3. **Removal** (75%): Inpainting watermarks
4. **Finalizing** (100%): Creating output

### Processing Time

Depends on:
- **Image size**: Larger = slower
- **Watermark complexity**: More regions = slower
- **Device performance**: Faster CPU = faster processing

**Typical Times**:
- Small image (< 1MB): 1-2 seconds
- Medium image (1-5MB): 2-5 seconds
- Large image (5-10MB): 5-10 seconds

### During Processing

**You can**:
- ✅ Upload more images
- ✅ Remove unprocessed images
- ✅ View processed images

**You cannot**:
- ❌ Edit images being processed
- ❌ Close the browser (cancels processing)
- ❌ Refresh the page (loses progress)

### Processing Status

| Status | Meaning |
|--------|---------|
| Pending | Waiting to be processed |
| Processing | Currently being processed |
| Completed | Successfully processed |
| Error | Processing failed |

---

## Downloading Results

### Viewing Results

1. Go to "Download" tab
2. See before/after comparison
3. Review watermark removal quality

### Downloading Single Image

1. Find processed image in "Download" tab
2. Click "Download" button
3. Image saves to your Downloads folder
4. Filename: `[original]-no-watermark.png`

### Downloading All Images (ZIP)

1. Process multiple images
2. Go to "Download" tab
3. Click "Download All as ZIP"
4. Wait for ZIP creation
5. ZIP saves to Downloads
6. Filename: `watermark-removed-[timestamp].zip`

### Download Options

**Format**: Currently PNG only
- High quality
- Lossless compression
- Widely supported

**Filename**: Auto-generated
- Based on original name
- Adds `-no-watermark` suffix
- Includes original extension

---

## Tips for Best Results

### Image Selection

✅ **Good Candidates**:
- Simple, solid-color watermarks
- Text watermarks
- Logo watermarks
- Watermarks in corners
- High-contrast watermarks

❌ **Challenging Cases**:
- Transparent watermarks
- Complex patterns
- Colored watermarks on colored backgrounds
- Watermarks covering important content
- Very large watermarks (>30% of image)

### Optimization Tips

1. **Use original resolution**
   - Don't resize before uploading
   - Higher resolution = better results

2. **Clean background**
   - Watermarks on solid backgrounds work best
   - Textured backgrounds may show artifacts

3. **Position matters**
   - Corner watermarks easier to remove
   - Center watermarks more challenging

4. **Contrast helps**
   - Bright watermarks on dark backgrounds
   - Or dark watermarks on bright backgrounds

### If Results Aren't Perfect

1. **Try again**: Sometimes reprocessing helps
2. **Check original**: Ensure it's not embedded in image
3. **Consider manual editing**: For very complex cases
4. **Adjust expectations**: Some watermarks can't be perfectly removed

---

## Troubleshooting

### OpenCV Fails to Load

**Symptoms**: "Failed to load OpenCV.js" error

**Solutions**:
1. Check internet connection
2. Refresh the page
3. Clear browser cache
4. Try different browser
5. Disable ad blockers temporarily

### Processing Fails

**Symptoms**: Image status shows "Error"

**Solutions**:
1. Check file format (PNG/JPG/WebP only)
2. Ensure file size < 10MB
3. Try different image
4. Refresh page and retry
5. Check browser console for details

### Poor Results

**Symptoms**: Watermark not fully removed or visible artifacts

**Solutions**:
1. Watermark might be too complex
2. Try image with simpler watermark
3. Check if watermark is actually embedded
4. Consider manual photo editing for complex cases

### Slow Performance

**Symptoms**: Processing takes very long

**Solutions**:
1. Reduce image size/resolution
2. Process fewer images at once
3. Close other browser tabs
4. Upgrade device if very old
5. Use desktop instead of mobile for large batches

### Browser Issues

**Symptoms**: App doesn't work or crashes

**Solutions**:
1. Update browser to latest version
2. Clear browser cache and cookies
3. Disable browser extensions
4. Try incognito/private mode
5. Use different browser

---

## Privacy & Security

### Data Processing

🔒 **100% Client-Side**
- All processing happens in your browser
- No files uploaded to any server
- No data leaves your device

🔒 **No Tracking**
- No analytics
- No cookies
- No telemetry
- No user accounts

🔒 **Open Source**
- All code is transparent
- Auditable on GitHub
- No hidden functionality

### Network Requests

**Only request**: OpenCV.js download from official CDN
- URL: `https://docs.opencv.org/4.8.0/opencv.js`
- Purpose: Computer vision library
- Size: ~7MB
- Frequency: Once per browser (cached)

**No other requests** to any servers.

### Data Storage

**LocalStorage**: Settings only
- Detection preferences
- UI preferences
- No image data

**Memory**: Temporary only
- Images cleared on page close
- Processed images not saved
- URLs revoked after use

---

## Legal Information

### Terms of Use

This tool is provided **for personal use only**.

### You MAY:
✅ Use for your own photos
✅ Use for images you have permission to modify
✅ Use for educational purposes
✅ Use offline
✅ Share the tool with others

### You MAY NOT:
❌ Remove watermarks from copyrighted content without permission
❌ Use for commercial purposes without authorization
❌ Violate intellectual property rights
❌ Use to infringe on others' rights
❌ Redistribute modified copyrighted content

### Disclaimer

- **No Warranty**: Tool provided "as is"
- **No Liability**: We're not responsible for misuse
- **User Responsibility**: You are responsible for how you use this tool
- **Copyright Respect**: Always respect content creators' rights

### Ethical Use

Please use this tool ethically:
- Respect artists and content creators
- Don't remove watermarks to claim others' work
- Consider purchasing licensed versions
- Support content creators when possible

---

## FAQs

**Q: Is this tool really free?**
A: Yes, 100% free with no hidden costs or subscriptions.

**Q: Do I need to create an account?**
A: No, completely anonymous. No accounts or login required.

**Q: Is my data safe?**
A: Yes, all processing happens in your browser. Nothing is uploaded.

**Q: Can I use this offline?**
A: Yes, after first load. The app caches everything needed.

**Q: What if it doesn't remove the watermark completely?**
A: Some watermarks are too complex for automatic removal. Try adjusting settings or consider manual editing.

**Q: Can I process images in bulk?**
A: Yes, upload multiple images and click "Process All".

**Q: What happens to my images after processing?**
A: They stay in your browser until you close the tab. Nothing is saved permanently unless you download.

**Q: Is this legal to use?**
A: Yes, but only use it on content you own or have permission to modify.

---

## Support

### Need Help?

1. Check [Troubleshooting](#troubleshooting) section
2. Review [Tips for Best Results](#tips-for-best-results)
3. Read the [README.md](../README.md)
4. Check [Algorithm Documentation](./ALGORITHM.md)

### Found a Bug?

Report issues on the GitHub repository.

### Feature Requests?

Suggestions welcome! Open an issue on GitHub.

---

## Version History

**v1.0.0** (December 2024)
- Initial release
- OpenCV.js integration
- Batch processing
- ZIP download
- PWA support

---

**Happy watermark removing! 🎨**
