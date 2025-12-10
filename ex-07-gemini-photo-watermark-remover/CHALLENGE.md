# Challenge: Gemini Photo Watermark Remover

## Overview

Build a production-ready, browser-based PWA that removes watermarks from images using OpenCV.js. The application should be 100% client-side, privacy-friendly, and work offline after initial load.

## Challenge Requirements

### Core Features

1. **Image Upload**
   - Drag & drop interface
   - Multi-file upload support
   - Format validation (PNG, JPG, JPEG, WebP)
   - Size validation (max 10MB per file)
   - Client-side preview

2. **Watermark Detection**
   - Automatic watermark detection using computer vision
   - Brightness-based thresholding
   - Morphological operations for region detection
   - Configurable detection parameters
   - Visual preview of detected regions

3. **Watermark Removal**
   - OpenCV inpainting algorithm (Navier-Stokes)
   - Batch processing support
   - Real-time progress indicators
   - Error handling and retry capability
   - Before/after comparison

4. **Download Management**
   - Individual image download
   - Batch download as ZIP
   - Format selection (PNG/JPG/WebP)
   - Quality adjustment for JPG/WebP
   - Automatic filename generation

### Technical Requirements

1. **Client-Side Processing**
   - All processing in browser using OpenCV.js
   - No server uploads
   - No data collection
   - Complete privacy

2. **PWA Features**
   - Installable as app
   - Works offline after initial load
   - Service worker caching
   - Manifest configuration
   - Responsive design

3. **Technology Stack**
   - TypeScript (strict mode)
   - React 18
   - Vite 5
   - Zustand (state management)
   - Tailwind CSS 3
   - shadcn/ui components

4. **Code Quality**
   - Type-safe implementation
   - Error boundaries
   - Proper memory management
   - ESLint configuration
   - Production optimizations

### User Experience

1. **Interface**
   - Clean, minimal design
   - Dark theme only
   - Mobile-responsive
   - Touch-friendly controls
   - Intuitive workflow

2. **Feedback**
   - Toast notifications
   - Progress indicators
   - Loading states
   - Error messages
   - Success confirmations

3. **Accessibility**
   - Keyboard navigation
   - Screen reader support
   - Proper ARIA labels
   - Focus management
   - Semantic HTML

### Performance

1. **Optimization**
   - Code splitting
   - Lazy loading
   - Image optimization
   - Bundle size < 500KB (excluding OpenCV)
   - Fast initial load

2. **Memory Management**
   - OpenCV matrix cleanup
   - URL revocation
   - Garbage collection
   - Resource limits

### Documentation

1. **Required Files**
   - `CHALLENGE.md` - This file (challenge spec)
   - `README.md` - Implementation overview
   - `docs/ALGORITHM.md` - Technical algorithm details
   - `docs/USER_GUIDE.md` - End-user documentation

2. **Code Documentation**
   - JSDoc comments for complex functions
   - Type definitions
   - README sections for setup/usage
   - Inline comments for algorithms

## Implementation Steps

### Phase 1: Project Setup
1. Initialize project with pnpm
2. Configure TypeScript, Vite, ESLint
3. Set up Tailwind CSS
4. Configure PWA plugin
5. Create folder structure

### Phase 2: OpenCV Integration
1. Load OpenCV.js dynamically
2. Implement detection algorithm
3. Implement removal algorithm
4. Add error handling
5. Test with sample images

### Phase 3: State Management
1. Design Zustand store
2. Implement image management
3. Add processing queue
4. Configure persistence
5. Add actions and selectors

### Phase 4: Core UI
1. Create ImageUploader component
2. Build ProcessingQueue component
3. Implement DownloadManager component
4. Add tab navigation
5. Implement loading states

### Phase 5: Polish
1. Add toast notifications
2. Implement progress indicators
3. Add error boundaries
4. Optimize bundle size
5. Test on mobile devices

### Phase 6: Documentation
1. Write CHALLENGE.md
2. Create README.md
3. Document algorithms
4. Write user guide
5. Add code comments

### Phase 7: Deployment
1. Create GitHub Actions workflow
2. Configure GitHub Pages
3. Test deployment
4. Update INDEX.md
5. Create demo video/screenshots

## Success Criteria

✅ All images processed client-side (no uploads)
✅ Works offline after initial load
✅ Supports PNG, JPG, JPEG, WebP
✅ Batch processing with progress tracking
✅ Download individual or as ZIP
✅ Mobile-responsive design
✅ Dark theme UI
✅ Type-safe TypeScript
✅ PWA installable
✅ Comprehensive documentation
✅ SEO optimized
✅ Deployed to GitHub Pages

## Resources

- **OpenCV.js Documentation**: https://docs.opencv.org/4.8.0/
- **OpenCV Tutorial**: Computer Vision with JavaScript
- **Inpainting Algorithms**: Navier-Stokes vs Telea methods
- **PWA Best Practices**: https://web.dev/progressive-web-apps/
- **shadcn/ui**: https://ui.shadcn.com/

## Learning Objectives

1. **Computer Vision**: Understanding image processing algorithms
2. **OpenCV.js**: Browser-based computer vision with WebAssembly
3. **PWA Development**: Building offline-capable web applications
4. **State Management**: Complex state with Zustand
5. **TypeScript**: Type-safe React development
6. **Performance**: Optimizing client-side processing

## Bonus Features (Optional)

- [ ] Image editing (crop, resize, filters)
- [ ] Manual region selection/adjustment
- [ ] Before/after comparison slider
- [ ] Settings panel for algorithm tuning
- [ ] Processing history
- [ ] Export settings/presets
- [ ] Keyboard shortcuts
- [ ] Advanced detection (color-based, edge detection)

## Notes

- This is a tutorial-style challenge focused on practical implementation
- Code should be production-ready and maintainable
- Documentation should be comprehensive and educational
- Follow repository coding challenge patterns
- Prioritize user privacy and data security
