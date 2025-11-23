import * as React from 'react';
import { useEffect, useState, useRef, useCallback } from 'react';
import styled from 'styled-components';
import { useGesture } from '@use-gesture/react';

/**
 * Mobile Code Viewer Component
 * Extensive code viewing with touch gestures, zoom, and mobile-optimized controls
 * Works on both iOS and Android
 */

interface MobileCodeViewerProps {
    uri: string;
    content: string;
    language: string;
    readOnly?: boolean;
    onContentChange?: (content: string) => void;
    onSave?: () => void;
}

const ViewerContainer = styled.div`
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;
    background: var(--theia-editor-background, #1e1e1e);
    touch-action: none;
`;

const EditorWrapper = styled.div<{ $scale: number; $translateX: number; $translateY: number }>`
    width: 100%;
    height: 100%;
    transform: scale(${props => props.$scale}) translate(${props => props.$translateX}px, ${props => props.$translateY}px);
    transform-origin: 0 0;
    transition: transform 0.1s ease-out;
`;

const ToolbarContainer = styled.div<{ $visible: boolean }>`
    position: fixed;
    top: ${props => props.$visible ? '0' : '-60px'};
    left: 0;
    right: 0;
    height: 56px;
    background: var(--theia-toolbar-background, #2d2d2d);
    border-bottom: 1px solid var(--theia-border, #3e3e3e);
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 12px;
    z-index: 100;
    transition: top 0.3s ease-out;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
`;

const ToolbarButton = styled.button<{ $active?: boolean }>`
    background: ${props => props.$active ? 'var(--theia-button-background, #0e639c)' : 'transparent'};
    color: var(--theia-foreground, #cccccc);
    border: none;
    padding: 8px 12px;
    border-radius: 4px;
    font-size: 14px;
    min-width: 44px;
    min-height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    cursor: pointer;
    transition: background 0.2s;

    &:active {
        background: var(--theia-button-hoverBackground, #1177bb);
    }

    &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
`;

const ToolbarGroup = styled.div`
    display: flex;
    gap: 8px;
    align-items: center;
`;

const ToolbarTitle = styled.div`
    flex: 1;
    text-align: center;
    font-size: 14px;
    font-weight: 500;
    color: var(--theia-foreground, #cccccc);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    padding: 0 12px;
`;

const FloatingActionButton = styled.button<{ $bottom: number }>`
    position: fixed;
    right: 16px;
    bottom: ${props => props.$bottom}px;
    width: 56px;
    height: 56px;
    border-radius: 50%;
    background: var(--theia-button-background, #0e639c);
    color: white;
    border: none;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
    font-size: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    z-index: 99;
    transition: transform 0.2s, background 0.2s;

    &:active {
        transform: scale(0.95);
        background: var(--theia-button-hoverBackground, #1177bb);
    }
`;

const ZoomControls = styled.div<{ $visible: boolean }>`
    position: fixed;
    bottom: 80px;
    right: 16px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    opacity: ${props => props.$visible ? 1 : 0};
    pointer-events: ${props => props.$visible ? 'auto' : 'none'};
    transition: opacity 0.3s ease-out;
    z-index: 99;
`;

const ZoomButton = styled.button`
    width: 44px;
    height: 44px;
    border-radius: 50%;
    background: var(--theia-toolbar-background, #2d2d2d);
    color: var(--theia-foreground, #cccccc);
    border: 1px solid var(--theia-border, #3e3e3e);
    font-size: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);

    &:active {
        background: var(--theia-button-hoverBackground, #383838);
    }
`;

const ZoomLevel = styled.div`
    width: 44px;
    height: 44px;
    border-radius: 50%;
    background: var(--theia-toolbar-background, #2d2d2d);
    color: var(--theia-foreground, #cccccc);
    border: 1px solid var(--theia-border, #3e3e3e);
    font-size: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
    font-weight: 500;
`;

const LineNumberOverlay = styled.div<{ $visible: boolean }>`
    position: fixed;
    top: 56px;
    left: ${props => props.$visible ? '0' : '-80px'};
    bottom: 0;
    width: 60px;
    background: var(--theia-sideBar-background, #252526);
    border-right: 1px solid var(--theia-border, #3e3e3e);
    overflow-y: auto;
    padding: 8px 4px;
    transition: left 0.3s ease-out;
    z-index: 98;

    &::-webkit-scrollbar {
        width: 4px;
    }

    &::-webkit-scrollbar-thumb {
        background: var(--theia-scrollbarSlider-background, #424242);
        border-radius: 2px;
    }
`;

const LineNumber = styled.div<{ $active?: boolean }>`
    padding: 2px 4px;
    text-align: right;
    font-size: 12px;
    font-family: 'Monaco', 'Menlo', 'Courier New', monospace;
    color: ${props => props.$active
        ? 'var(--theia-editor-lineHighlightBorder, #0e639c)'
        : 'var(--theia-editorLineNumber-foreground, #858585)'};
    cursor: pointer;
    user-select: none;
    min-height: 20px;
    line-height: 20px;
    background: ${props => props.$active ? 'rgba(14, 99, 156, 0.1)' : 'transparent'};
    border-radius: 2px;

    &:active {
        background: rgba(14, 99, 156, 0.2);
    }
`;

const SearchBar = styled.div<{ $visible: boolean }>`
    position: fixed;
    top: ${props => props.$visible ? '56px' : '-60px'};
    left: 0;
    right: 0;
    height: 48px;
    background: var(--theia-toolbar-background, #2d2d2d);
    border-bottom: 1px solid var(--theia-border, #3e3e3e);
    display: flex;
    align-items: center;
    padding: 0 12px;
    gap: 8px;
    z-index: 99;
    transition: top 0.3s ease-out;
`;

const SearchInput = styled.input`
    flex: 1;
    background: var(--theia-input-background, #3c3c3c);
    color: var(--theia-input-foreground, #cccccc);
    border: 1px solid var(--theia-input-border, #3e3e3e);
    border-radius: 4px;
    padding: 8px 12px;
    font-size: 14px;
    outline: none;

    &:focus {
        border-color: var(--theia-focusBorder, #007acc);
    }
`;

const SearchCount = styled.div`
    font-size: 12px;
    color: var(--theia-foreground, #cccccc);
    white-space: nowrap;
`;

export const MobileCodeViewer: React.FC<MobileCodeViewerProps> = ({
    uri,
    content,
    language,
    readOnly = false,
    onContentChange,
    onSave
}) => {
    const [scale, setScale] = useState(1);
    const [translateX, setTranslateX] = useState(0);
    const [translateY, setTranslateY] = useState(0);
    const [toolbarVisible, setToolbarVisible] = useState(true);
    const [searchVisible, setSearchVisible] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchMatches, setSearchMatches] = useState(0);
    const [currentMatch, setCurrentMatch] = useState(0);
    const [lineNumbersVisible, setLineNumbersVisible] = useState(false);
    const [zoomControlsVisible, setZoomControlsVisible] = useState(false);
    const [currentLine, setCurrentLine] = useState(1);
    const [showReadOnlyMode, setShowReadOnlyMode] = useState(readOnly);

    const containerRef = useRef<HTMLDivElement>(null);
    const editorRef = useRef<HTMLDivElement>(null);
    const lastTap = useRef(0);

    // Parse content into lines
    const lines = content.split('\n');

    // Setup pinch-to-zoom and pan gestures
    const bind = useGesture({
        onPinch: ({ offset: [scale], memo }) => {
            // Pinch to zoom
            const newScale = Math.max(0.5, Math.min(3, scale));
            setScale(newScale);
            setZoomControlsVisible(true);

            // Hide zoom controls after 2 seconds
            if (memo) clearTimeout(memo);
            const timeout = setTimeout(() => setZoomControlsVisible(false), 2000);
            return timeout;
        },
        onDrag: ({ offset: [x, y], pinching, cancel, first }) => {
            // Don't pan while pinching
            if (pinching) return cancel();

            // Only allow panning when zoomed in
            if (scale > 1) {
                setTranslateX(x);
                setTranslateY(y);
            }

            // Auto-hide toolbar on scroll
            if (!first && Math.abs(y) > 50) {
                setToolbarVisible(false);
            }
        },
        onWheel: ({ event, last }) => {
            // Prevent default scroll on mobile
            event.preventDefault();
        },
    }, {
        pinch: { scaleBounds: { min: 0.5, max: 3 }, rubberband: true },
        drag: { from: () => [translateX, translateY] }
    });

    // Double tap to toggle toolbar
    const handleDoubleTap = useCallback(() => {
        const now = Date.now();
        const DOUBLE_TAP_DELAY = 300;

        if (now - lastTap.current < DOUBLE_TAP_DELAY) {
            setToolbarVisible(prev => !prev);
        }

        lastTap.current = now;
    }, []);

    // Zoom in
    const zoomIn = useCallback(() => {
        setScale(prev => Math.min(3, prev + 0.25));
        setZoomControlsVisible(true);
        setTimeout(() => setZoomControlsVisible(false), 2000);
    }, []);

    // Zoom out
    const zoomOut = useCallback(() => {
        setScale(prev => Math.max(0.5, prev - 0.25));
        setZoomControlsVisible(true);
        setTimeout(() => setZoomControlsVisible(false), 2000);
    }, []);

    // Reset zoom
    const resetZoom = useCallback(() => {
        setScale(1);
        setTranslateX(0);
        setTranslateY(0);
        setZoomControlsVisible(true);
        setTimeout(() => setZoomControlsVisible(false), 2000);
    }, []);

    // Toggle search
    const toggleSearch = useCallback(() => {
        setSearchVisible(prev => !prev);
        if (!searchVisible) {
            // Auto-focus search input
            setTimeout(() => {
                const input = document.querySelector('.search-input') as HTMLInputElement;
                if (input) input.focus();
            }, 100);
        }
    }, [searchVisible]);

    // Search in content
    useEffect(() => {
        if (searchQuery) {
            const matches = content.toLowerCase().split(searchQuery.toLowerCase()).length - 1;
            setSearchMatches(matches);
            setCurrentMatch(matches > 0 ? 1 : 0);
        } else {
            setSearchMatches(0);
            setCurrentMatch(0);
        }
    }, [searchQuery, content]);

    // Go to line
    const goToLine = useCallback((lineNumber: number) => {
        setCurrentLine(lineNumber);
        // Scroll to line (simplified - in real implementation, scroll Monaco editor)
        const lineElement = document.querySelector(`[data-line="${lineNumber}"]`);
        if (lineElement) {
            lineElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, []);

    // Toggle read-only mode
    const toggleReadOnly = useCallback(() => {
        setShowReadOnlyMode(prev => !prev);
    }, []);

    // Save file
    const handleSave = useCallback(() => {
        if (onSave) {
            onSave();
        }
    }, [onSave]);

    // Get file name from URI
    const fileName = uri.split('/').pop() || 'Untitled';

    return (
        <ViewerContainer ref={containerRef} {...bind()} onClick={handleDoubleTap}>
            {/* Top Toolbar */}
            <ToolbarContainer $visible={toolbarVisible}>
                <ToolbarGroup>
                    <ToolbarButton onClick={() => window.history.back()}>
                        ←
                    </ToolbarButton>
                    <ToolbarButton
                        $active={lineNumbersVisible}
                        onClick={() => setLineNumbersVisible(prev => !prev)}
                        title="Toggle line numbers"
                    >
                        #
                    </ToolbarButton>
                </ToolbarGroup>

                <ToolbarTitle title={uri}>{fileName}</ToolbarTitle>

                <ToolbarGroup>
                    <ToolbarButton onClick={toggleSearch} $active={searchVisible} title="Search">
                        🔍
                    </ToolbarButton>
                    {!readOnly && (
                        <ToolbarButton onClick={handleSave} title="Save">
                            💾
                        </ToolbarButton>
                    )}
                    <ToolbarButton onClick={() => {}} title="More options">
                        ⋮
                    </ToolbarButton>
                </ToolbarGroup>
            </ToolbarContainer>

            {/* Search Bar */}
            <SearchBar $visible={searchVisible}>
                <SearchInput
                    className="search-input"
                    type="text"
                    placeholder="Search in file..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchMatches > 0 && (
                    <SearchCount>
                        {currentMatch}/{searchMatches}
                    </SearchCount>
                )}
                <ToolbarButton onClick={() => setCurrentMatch(prev => Math.max(1, prev - 1))}>
                    ↑
                </ToolbarButton>
                <ToolbarButton onClick={() => setCurrentMatch(prev => Math.min(searchMatches, prev + 1))}>
                    ↓
                </ToolbarButton>
                <ToolbarButton onClick={toggleSearch}>
                    ✕
                </ToolbarButton>
            </SearchBar>

            {/* Line Numbers Overlay */}
            <LineNumberOverlay $visible={lineNumbersVisible}>
                {lines.map((_, index) => (
                    <LineNumber
                        key={index}
                        $active={index + 1 === currentLine}
                        onClick={() => goToLine(index + 1)}
                        data-line={index + 1}
                    >
                        {index + 1}
                    </LineNumber>
                ))}
            </LineNumberOverlay>

            {/* Editor Content */}
            <EditorWrapper
                ref={editorRef}
                $scale={scale}
                $translateX={translateX}
                $translateY={translateY}
            >
                {/* Monaco editor will be injected here */}
                <div id="monaco-editor-container" style={{ width: '100%', height: '100%' }}>
                    {/* Placeholder - Monaco editor instance goes here */}
                </div>
            </EditorWrapper>

            {/* Floating Action Button */}
            <FloatingActionButton
                $bottom={72}
                onClick={() => setZoomControlsVisible(prev => !prev)}
                title="Zoom controls"
            >
                🔍
            </FloatingActionButton>

            {/* Zoom Controls */}
            <ZoomControls $visible={zoomControlsVisible}>
                <ZoomButton onClick={zoomIn} title="Zoom in">
                    +
                </ZoomButton>
                <ZoomLevel>
                    {Math.round(scale * 100)}%
                </ZoomLevel>
                <ZoomButton onClick={zoomOut} title="Zoom out">
                    −
                </ZoomButton>
                <ZoomButton onClick={resetZoom} title="Reset zoom">
                    ⊙
                </ZoomButton>
            </ZoomControls>
        </ViewerContainer>
    );
};

export default MobileCodeViewer;
