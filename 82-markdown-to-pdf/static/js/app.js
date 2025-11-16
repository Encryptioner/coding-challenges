// Markdown to PDF Application
// Main application logic

// Global state
const state = {
    settings: {
        fontFamily: 'Georgia, serif',
        bodySize: 16,
        h1Size: 32,
        h2Size: 24,
        h3Size: 20,
        bgColor: '#ffffff',
        textColor: '#333333',
        headingColor: '#2c3e50',
        linkColor: '#0366d6'
    }
};

// Initialize parser
const parser = new MarkdownParser();

// DOM Elements
let markdownEditor, preview, settingsModal;
let wordCountElement, charCountElement;

// Initialize application
document.addEventListener('DOMContentLoaded', () => {
    // Get DOM elements
    markdownEditor = document.getElementById('markdownEditor');
    preview = document.getElementById('preview');
    settingsModal = document.getElementById('settingsModal');
    wordCountElement = document.getElementById('wordCount');
    charCountElement = document.getElementById('charCount');

    // Event listeners
    markdownEditor.addEventListener('input', handleEditorInput);
    document.getElementById('settingsBtn').addEventListener('click', openSettings);
    document.getElementById('exportBtn').addEventListener('click', exportPDF);

    // Load saved content from localStorage
    loadSavedContent();

    // Initial render
    updatePreview();
});

// Handle editor input
function handleEditorInput() {
    updatePreview();
    updateStats();
    saveContent();
}

// Update preview
function updatePreview() {
    const markdown = markdownEditor.value;

    // Parse markdown
    const html = parser.parse(markdown);

    // Apply custom styles
    const customCSS = generateCustomCSS();

    // Update preview
    if (html) {
        preview.innerHTML = html;
        applyCustomStyles();
    } else {
        preview.innerHTML = '<p class="preview-placeholder">Your rendered markdown will appear here...</p>';
    }
}

// Refresh preview (force update)
function refreshPreview() {
    updatePreview();
}

// Generate custom CSS from settings
function generateCustomCSS() {
    const s = state.settings;

    return `
        .preview-content {
            font-family: ${s.fontFamily};
            font-size: ${s.bodySize}px;
            color: ${s.textColor};
            background-color: ${s.bgColor};
        }

        .preview-content h1 {
            font-size: ${s.h1Size}px;
            color: ${s.headingColor};
        }

        .preview-content h2 {
            font-size: ${s.h2Size}px;
            color: ${s.headingColor};
        }

        .preview-content h3 {
            font-size: ${s.h3Size}px;
            color: ${s.headingColor};
        }

        .preview-content h4,
        .preview-content h5,
        .preview-content h6 {
            color: ${s.headingColor};
        }

        .preview-content a {
            color: ${s.linkColor};
        }
    `;
}

// Apply custom styles to preview
function applyCustomStyles() {
    // Remove old style
    const oldStyle = document.getElementById('customPreviewStyles');
    if (oldStyle) {
        oldStyle.remove();
    }

    // Add new style
    const style = document.createElement('style');
    style.id = 'customPreviewStyles';
    style.textContent = generateCustomCSS();
    document.head.appendChild(style);
}

// Update word and character count
function updateStats() {
    const text = markdownEditor.value;

    // Character count
    const charCount = text.length;

    // Word count (split by whitespace and filter empty strings)
    const words = text.trim().split(/\s+/).filter(word => word.length > 0);
    const wordCount = text.trim().length > 0 ? words.length : 0;

    wordCountElement.textContent = `Words: ${wordCount}`;
    charCountElement.textContent = `Characters: ${charCount}`;
}

// Insert markdown at cursor
function insertMarkdown(before, after) {
    const textarea = markdownEditor;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);
    const replacement = before + selectedText + after;

    textarea.value = textarea.value.substring(0, start) + replacement + textarea.value.substring(end);

    // Move cursor
    const newCursorPos = start + before.length + selectedText.length;
    textarea.selectionStart = textarea.selectionEnd = newCursorPos;

    textarea.focus();
    updatePreview();
    updateStats();
}

// Insert list
function insertList() {
    const textarea = markdownEditor;
    const start = textarea.selectionStart;
    const selectedText = textarea.value.substring(start, textarea.selectionEnd);

    const listItems = selectedText.split('\n').filter(line => line.trim());
    const formattedList = listItems.length > 0
        ? listItems.map(line => `- ${line}`).join('\n')
        : '- Item 1\n- Item 2\n- Item 3';

    textarea.value = textarea.value.substring(0, start) +
                    formattedList +
                    textarea.value.substring(textarea.selectionEnd);

    textarea.focus();
    updatePreview();
    updateStats();
}

// Settings Modal
function openSettings() {
    // Load current settings
    document.getElementById('fontFamily').value = state.settings.fontFamily;
    document.getElementById('bodySize').value = state.settings.bodySize;
    document.getElementById('h1Size').value = state.settings.h1Size;
    document.getElementById('h2Size').value = state.settings.h2Size;
    document.getElementById('h3Size').value = state.settings.h3Size;
    document.getElementById('bgColor').value = state.settings.bgColor;
    document.getElementById('textColor').value = state.settings.textColor;
    document.getElementById('headingColor').value = state.settings.headingColor;
    document.getElementById('linkColor').value = state.settings.linkColor;

    // Show modal
    settingsModal.classList.add('active');
}

function closeSettings() {
    settingsModal.classList.remove('active');
    saveSettings();
}

// Update settings from form
function updateSettingsFromForm() {
    state.settings.fontFamily = document.getElementById('fontFamily').value;
    state.settings.bodySize = parseInt(document.getElementById('bodySize').value);
    state.settings.h1Size = parseInt(document.getElementById('h1Size').value);
    state.settings.h2Size = parseInt(document.getElementById('h2Size').value);
    state.settings.h3Size = parseInt(document.getElementById('h3Size').value);
    state.settings.bgColor = document.getElementById('bgColor').value;
    state.settings.textColor = document.getElementById('textColor').value;
    state.settings.headingColor = document.getElementById('headingColor').value;
    state.settings.linkColor = document.getElementById('linkColor').value;
}

// Apply preset theme
function applyPreset(presetName) {
    const presets = {
        default: {
            fontFamily: 'Georgia, serif',
            bodySize: 16,
            h1Size: 32,
            h2Size: 24,
            h3Size: 20,
            bgColor: '#ffffff',
            textColor: '#333333',
            headingColor: '#2c3e50',
            linkColor: '#0366d6'
        },
        dark: {
            fontFamily: 'Arial, sans-serif',
            bodySize: 16,
            h1Size: 32,
            h2Size: 24,
            h3Size: 20,
            bgColor: '#1e1e1e',
            textColor: '#e0e0e0',
            headingColor: '#4fc3f7',
            linkColor: '#81c784'
        },
        minimal: {
            fontFamily: "'Helvetica Neue', Helvetica, sans-serif",
            bodySize: 14,
            h1Size: 28,
            h2Size: 20,
            h3Size: 18,
            bgColor: '#fafafa',
            textColor: '#424242',
            headingColor: '#212121',
            linkColor: '#1976d2'
        },
        serif: {
            fontFamily: "'Times New Roman', Times, serif",
            bodySize: 18,
            h1Size: 36,
            h2Size: 28,
            h3Size: 22,
            bgColor: '#f5f5dc',
            textColor: '#2f2f2f',
            headingColor: '#8b4513',
            linkColor: '#b8860b'
        }
    };

    const preset = presets[presetName];
    if (preset) {
        state.settings = { ...preset };

        // Update form
        document.getElementById('fontFamily').value = preset.fontFamily;
        document.getElementById('bodySize').value = preset.bodySize;
        document.getElementById('h1Size').value = preset.h1Size;
        document.getElementById('h2Size').value = preset.h2Size;
        document.getElementById('h3Size').value = preset.h3Size;
        document.getElementById('bgColor').value = preset.bgColor;
        document.getElementById('textColor').value = preset.textColor;
        document.getElementById('headingColor').value = preset.headingColor;
        document.getElementById('linkColor').value = preset.linkColor;

        updatePreview();
    }
}

// Reset settings to default
function resetSettings() {
    applyPreset('default');
}

// Export to PDF
function exportPDF() {
    // Update settings before export
    updateSettingsFromForm();

    // Apply print-optimized styles
    const printStyles = generatePrintCSS();

    // Create style element for print
    const printStyle = document.createElement('style');
    printStyle.id = 'printStyles';
    printStyle.media = 'print';
    printStyle.textContent = printStyles;
    document.head.appendChild(printStyle);

    // Trigger browser print dialog
    window.print();

    // Remove print styles after a delay
    setTimeout(() => {
        const element = document.getElementById('printStyles');
        if (element) {
            element.remove();
        }
    }, 1000);
}

// Generate print CSS
function generatePrintCSS() {
    const s = state.settings;

    return `
        @page {
            margin: 1in;
        }

        @media print {
            body {
                font-family: ${s.fontFamily};
                font-size: ${s.bodySize}px;
                color: ${s.textColor};
                background-color: ${s.bgColor};
            }

            h1 {
                font-size: ${s.h1Size}px;
                color: ${s.headingColor};
            }

            h2 {
                font-size: ${s.h2Size}px;
                color: ${s.headingColor};
            }

            h3 {
                font-size: ${s.h3Size}px;
                color: ${s.headingColor};
            }

            h4, h5, h6 {
                color: ${s.headingColor};
            }

            a {
                color: ${s.linkColor};
            }

            .preview-content {
                max-width: none;
                padding: 0;
            }
        }
    `;
}

// Save content to localStorage
function saveContent() {
    try {
        localStorage.setItem('markdown-content', markdownEditor.value);
    } catch (e) {
        console.error('Failed to save content:', e);
    }
}

// Load saved content from localStorage
function loadSavedContent() {
    try {
        const saved = localStorage.getItem('markdown-content');
        if (saved) {
            markdownEditor.value = saved;
        }
    } catch (e) {
        console.error('Failed to load saved content:', e);
    }
}

// Save settings to localStorage
function saveSettings() {
    updateSettingsFromForm();
    try {
        localStorage.setItem('markdown-settings', JSON.stringify(state.settings));
    } catch (e) {
        console.error('Failed to save settings:', e);
    }
}

// Load saved settings from localStorage
function loadSavedSettings() {
    try {
        const saved = localStorage.getItem('markdown-settings');
        if (saved) {
            state.settings = { ...state.settings, ...JSON.parse(saved) };
        }
    } catch (e) {
        console.error('Failed to load saved settings:', e);
    }
}

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + B: Bold
    if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        e.preventDefault();
        insertMarkdown('**', '**');
    }

    // Ctrl/Cmd + I: Italic
    if ((e.ctrlKey || e.metaKey) && e.key === 'i') {
        e.preventDefault();
        insertMarkdown('*', '*');
    }

    // Ctrl/Cmd + K: Link
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        insertMarkdown('[', '](url)');
    }

    // Ctrl/Cmd + E: Inline code
    if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
        e.preventDefault();
        insertMarkdown('`', '`');
    }

    // Ctrl/Cmd + P: Export PDF
    if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault();
        exportPDF();
    }

    // Ctrl/Cmd + S: Save (already auto-saves, but confirm)
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        saveContent();
        // Show brief confirmation
        const header = document.querySelector('.header h1');
        const originalText = header.textContent;
        header.textContent = '💾 Saved!';
        setTimeout(() => {
            header.textContent = originalText;
        }, 1000);
    }
});

// Load saved settings on startup
loadSavedSettings();
