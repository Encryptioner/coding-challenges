# Gemini Photo Watermark Remover

A production-ready, browser-based PWA for removing watermarks from images using OpenCV.js. 100% free, client-side processing, privacy-friendly, and works offline.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)
![React](https://img.shields.io/badge/React-18.2-61DAFB)

## Features

✅ **Client-Side Processing** - All processing happens in your browser using WebAssembly
✅ **Privacy First** - No uploads, no servers, no tracking, no data collection
✅ **Offline Support** - Works completely offline after initial load
✅ **Batch Processing** - Process multiple images simultaneously
✅ **Multiple Formats** - Supports PNG, JPG, JPEG, WebP (up to 10MB each)
✅ **Smart Detection** - Automatic watermark detection using computer vision
✅ **Flexible Download** - Download individually or as ZIP file
✅ **PWA Ready** - Install as desktop/mobile app
✅ **Mobile Responsive** - Works perfectly on phones and tablets
✅ **Dark Theme** - Beautiful dark mode interface

## How It Works

1. **Upload**: Drag & drop or select images (PNG, JPG, JPEG, WebP)
2. **Detect**: OpenCV automatically detects watermark regions using brightness thresholding
3. **Process**: Navier-Stokes inpainting algorithm removes watermarks seamlessly
4. **Download**: Download processed images individually or as ZIP

## Tech Stack

- **Language**: TypeScript 5.3+ (strict mode)
- **Framework**: React 18.2
- **Build Tool**: Vite 5.0
- **State Management**: Zustand 4.4
- **Styling**: Tailwind CSS 3.4 + shadcn/ui
- **Image Processing**: OpenCV.js 4.8 (WebAssembly)
- **PWA**: vite-plugin-pwa + Workbox
- **Package Manager**: pnpm 8.14+

## Installation

### Prerequisites

- Node.js 18+
- pnpm 8.14+

### Setup

```bash
# Clone repository
cd ex-07-gemini-photo-watermark-remover

# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview
```

## Usage

### Basic Workflow

1. **Upload Images**
   - Click upload area or drag & drop images
   - Supports multiple files at once
   - Validates format and size automatically

2. **Process Images**
   - Click "Process All" to process all images
   - Or process images individually
   - Watch real-time progress

3. **Download Results**
   - View before/after comparison
   - Download individual images
   - Or download all as ZIP

### Scripts

```bash
# Development
pnpm dev              # Start dev server
pnpm dev:mobile       # Start dev server (accessible on network)

# Build
pnpm build            # Production build
pnpm preview          # Preview production build

# Quality
pnpm type-check       # TypeScript type checking
pnpm lint             # ESLint
pnpm lint:fix         # Fix linting issues
pnpm validate         # Run all checks + build

# Maintenance
pnpm clean            # Clean build artifacts
pnpm clean:all        # Clean everything including node_modules
```

## Project Structure

```
ex-07-gemini-photo-watermark-remover/
├── src/
│   ├── components/          # React components
│   │   ├── ui/             # shadcn/ui base components
│   │   ├── ImageUploader.tsx
│   │   ├── ProcessingQueue.tsx
│   │   └── DownloadManager.tsx
│   ├── services/           # Business logic
│   │   ├── opencv.ts       # OpenCV loading
│   │   ├── watermark-detector.ts
│   │   ├── watermark-remover.ts
│   │   ├── image-processor.ts
│   │   └── download-manager.ts
│   ├── store/              # State management
│   │   └── useAppStore.ts
│   ├── types/              # TypeScript types
│   ├── utils/              # Utilities
│   ├── lib/                # Helper libraries
│   ├── App.tsx
│   └── main.tsx
├── public/                 # Static assets
├── docs/                   # Documentation
├── dist/                   # Build output
└── [config files]
```

## Algorithm

### Watermark Detection

1. **Grayscale Conversion**: Convert image to grayscale for easier processing
2. **Brightness Thresholding**: Detect pixels brighter than threshold (default: 200)
3. **Morphological Dilation**: Connect nearby bright regions
4. **Contour Detection**: Find boundaries of watermark regions
5. **Region Filtering**: Remove noise by filtering small areas

### Watermark Removal

1. **Mask Creation**: Create binary mask from detected regions
2. **Navier-Stokes Inpainting**: Fill watermark areas using surrounding pixels
3. **Seamless Blending**: Smooth transitions between inpainted and original areas

See [docs/ALGORITHM.md](./docs/ALGORITHM.md) for technical details.

## Configuration

### Detection Settings

```typescript
{
  detectionThreshold: 200,    // Brightness threshold (0-255)
  regionSize: 100,            // Minimum region size (pixels)
  dilationIterations: 3,      // Morphological dilation iterations
  inpaintRadius: 5,           // Inpainting radius
  quality: 'high'             // Quality preset: low | medium | high
}
```

### Quality Presets

- **Low**: Fast processing, good for simple watermarks
- **Medium**: Balanced speed and quality (default)
- **High**: Best quality, slower processing

## Browser Compatibility

- **Chrome/Edge**: ✅ Full support
- **Firefox**: ✅ Full support
- **Safari**: ✅ Full support
- **Mobile Browsers**: ✅ Full support

**Note**: Requires modern browser with WebAssembly support (all major browsers since 2017).

## Performance

- **Initial Load**: ~5MB (OpenCV.js cached after first load)
- **Bundle Size**: ~400KB (app code + dependencies)
- **Processing Speed**: ~1-3 seconds per image (depends on size and complexity)
- **Memory Usage**: ~50-200MB (depends on image count and size)

## Privacy & Security

- ✅ **No Server Processing**: Everything runs in your browser
- ✅ **No Data Collection**: Zero analytics, tracking, or telemetry
- ✅ **No External Requests**: Only loads OpenCV.js from official CDN
- ✅ **Open Source**: All code is transparent and auditable
- ✅ **Offline Capable**: Works without internet after initial load

## Legal & Ethical Use

This tool is provided for **personal use only**. Please:

- ✅ Respect copyright and intellectual property rights
- ✅ Only remove watermarks from content you own or have permission to modify
- ❌ Do not use for removing watermarks from copyrighted content
- ❌ Do not use for commercial purposes without proper authorization

**Disclaimer**: We are not responsible for misuse of this tool.

## Limitations

- Maximum file size: 10MB per image
- Works best on simple, uniform watermarks
- Complex or transparent watermarks may not be fully removed
- Processing speed depends on device performance

## Troubleshooting

### OpenCV fails to load

- Check internet connection (first load only)
- Try clearing browser cache
- Ensure JavaScript is enabled
- Try a different browser

### Processing fails

- Check image format (PNG, JPG, JPEG, WebP only)
- Ensure image size < 10MB
- Try refreshing the page
- Check browser console for errors

### Poor results

- Try adjusting detection threshold
- Use manual region selection (if available)
- Process at original resolution
- Some watermarks may require multiple attempts

## Contributing

Contributions are welcome! This is part of a coding challenges repository.

## License

MIT License - See LICENSE file for details

## Acknowledgments

- **OpenCV.js**: Computer vision in the browser
- **React Team**: Excellent UI library
- **Vite**: Lightning-fast build tool
- **shadcn/ui**: Beautiful UI components
- **CodingChallenges.fyi**: Inspiration for practical projects

## Resources

- [OpenCV.js Documentation](https://docs.opencv.org/4.8.0/)
- [Algorithm Details](./docs/ALGORITHM.md)
- [User Guide](./docs/USER_GUIDE.md)
- [Challenge Requirements](./CHALLENGE.md)

---

**Built with ❤️ using OpenCV.js, React, and TypeScript**
