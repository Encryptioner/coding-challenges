import { injectable } from '@theia/core/shared/inversify';
import { Keyboard } from '@capacitor/keyboard';

/**
 * Mobile Keyboard Manager
 * Handles virtual keyboard show/hide with smart positioning
 * Works on both iOS and Android
 */
@injectable()
export class MobileKeyboardManager {

    private isKeyboardVisible: boolean = false;
    private keyboardHeight: number = 0;
    private callbacks: Set<(visible: boolean, height: number) => void> = new Set();

    async initialize(): Promise<void> {
        try {
            // Check if Capacitor Keyboard is available (native apps)
            if (typeof Keyboard !== 'undefined') {
                await this.setupNativeKeyboardListeners();
            } else {
                // Fallback for web/PWA
                this.setupWebKeyboardListeners();
            }
            console.log('Mobile Keyboard Manager initialized');
        } catch (error) {
            console.warn('Keyboard API not available, using web fallback');
            this.setupWebKeyboardListeners();
        }
    }

    /**
     * Setup keyboard listeners for native apps (iOS/Android via Capacitor)
     */
    private async setupNativeKeyboardListeners(): Promise<void> {
        // Listen for keyboard show event
        Keyboard.addListener('keyboardWillShow', (info) => {
            console.log('Keyboard will show', info);
            this.isKeyboardVisible = true;
            this.keyboardHeight = info.keyboardHeight;
            this.notifyCallbacks(true, info.keyboardHeight);
            this.adjustLayoutForKeyboard(info.keyboardHeight);
        });

        // Listen for keyboard hide event
        Keyboard.addListener('keyboardWillHide', () => {
            console.log('Keyboard will hide');
            this.isKeyboardVisible = false;
            this.keyboardHeight = 0;
            this.notifyCallbacks(false, 0);
            this.adjustLayoutForKeyboard(0);
        });

        // Configure keyboard behavior
        await Keyboard.setAccessoryBarVisible({ isVisible: true });
        await Keyboard.setScroll({ isDisabled: false });
    }

    /**
     * Setup keyboard listeners for web/PWA (fallback)
     */
    private setupWebKeyboardListeners(): void {
        // Detect focus on input elements
        document.addEventListener('focusin', (event) => {
            const target = event.target as HTMLElement;
            if (this.isInputElement(target)) {
                this.isKeyboardVisible = true;
                // Estimate keyboard height (typically 260-300px on mobile)
                this.keyboardHeight = window.innerHeight * 0.4; // 40% of screen
                this.notifyCallbacks(true, this.keyboardHeight);
                this.adjustLayoutForKeyboard(this.keyboardHeight);
            }
        });

        document.addEventListener('focusout', (event) => {
            const target = event.target as HTMLElement;
            if (this.isInputElement(target)) {
                // Delay to allow for focus shifting
                setTimeout(() => {
                    if (!document.activeElement || !this.isInputElement(document.activeElement as HTMLElement)) {
                        this.isKeyboardVisible = false;
                        this.keyboardHeight = 0;
                        this.notifyCallbacks(false, 0);
                        this.adjustLayoutForKeyboard(0);
                    }
                }, 100);
            }
        });

        // Detect viewport resize (keyboard appearance)
        let lastHeight = window.visualViewport?.height || window.innerHeight;
        const checkResize = () => {
            const currentHeight = window.visualViewport?.height || window.innerHeight;
            if (currentHeight !== lastHeight) {
                const diff = lastHeight - currentHeight;
                if (diff > 100) {
                    // Keyboard likely shown
                    this.keyboardHeight = diff;
                    this.isKeyboardVisible = true;
                    this.notifyCallbacks(true, diff);
                } else if (diff < -100) {
                    // Keyboard likely hidden
                    this.keyboardHeight = 0;
                    this.isKeyboardVisible = false;
                    this.notifyCallbacks(false, 0);
                }
                lastHeight = currentHeight;
            }
        };

        if (window.visualViewport) {
            window.visualViewport.addEventListener('resize', checkResize);
        }
        window.addEventListener('resize', checkResize);
    }

    /**
     * Show the virtual keyboard
     */
    async show(): Promise<void> {
        try {
            if (typeof Keyboard !== 'undefined') {
                await Keyboard.show();
            } else {
                // Focus on the active editor or create a hidden input
                const activeElement = document.activeElement as HTMLElement;
                if (activeElement && this.isInputElement(activeElement)) {
                    activeElement.focus();
                }
            }
        } catch (error) {
            console.error('Failed to show keyboard:', error);
        }
    }

    /**
     * Hide the virtual keyboard
     */
    async hide(): Promise<void> {
        try {
            if (typeof Keyboard !== 'undefined') {
                await Keyboard.hide();
            } else {
                // Blur active element
                const activeElement = document.activeElement as HTMLElement;
                if (activeElement && this.isInputElement(activeElement)) {
                    activeElement.blur();
                }
            }
        } catch (error) {
            console.error('Failed to hide keyboard:', error);
        }
    }

    /**
     * Toggle keyboard visibility
     */
    async toggle(): Promise<void> {
        if (this.isKeyboardVisible) {
            await this.hide();
        } else {
            await this.show();
        }
    }

    /**
     * Get current keyboard state
     */
    getState(): { visible: boolean; height: number } {
        return {
            visible: this.isKeyboardVisible,
            height: this.keyboardHeight
        };
    }

    /**
     * Register callback for keyboard state changes
     */
    onChange(callback: (visible: boolean, height: number) => void): () => void {
        this.callbacks.add(callback);
        // Return unsubscribe function
        return () => {
            this.callbacks.delete(callback);
        };
    }

    /**
     * Notify all callbacks of keyboard state change
     */
    private notifyCallbacks(visible: boolean, height: number): void {
        this.callbacks.forEach(callback => {
            try {
                callback(visible, height);
            } catch (error) {
                console.error('Error in keyboard callback:', error);
            }
        });
    }

    /**
     * Adjust layout when keyboard appears/disappears
     */
    private adjustLayoutForKeyboard(keyboardHeight: number): void {
        const shell = document.querySelector('.theia-app-shell') as HTMLElement;
        if (!shell) return;

        if (keyboardHeight > 0) {
            // Keyboard is showing - adjust layout
            shell.style.paddingBottom = `${keyboardHeight}px`;
            shell.style.transition = 'padding-bottom 0.2s ease-out';

            // Scroll active element into view
            this.scrollActiveElementIntoView(keyboardHeight);
        } else {
            // Keyboard is hidden - reset layout
            shell.style.paddingBottom = '0px';
        }
    }

    /**
     * Scroll active element into view when keyboard appears
     */
    private scrollActiveElementIntoView(keyboardHeight: number): void {
        setTimeout(() => {
            const activeElement = document.activeElement as HTMLElement;
            if (activeElement && this.isInputElement(activeElement)) {
                const rect = activeElement.getBoundingClientRect();
                const windowHeight = window.innerHeight;
                const visibleHeight = windowHeight - keyboardHeight;

                // Check if element is below visible area
                if (rect.bottom > visibleHeight) {
                    const scrollAmount = rect.bottom - visibleHeight + 20; // 20px padding
                    window.scrollBy({
                        top: scrollAmount,
                        behavior: 'smooth'
                    });
                }
            }
        }, 100); // Small delay to ensure layout has updated
    }

    /**
     * Check if element is an input element
     */
    private isInputElement(element: HTMLElement): boolean {
        if (!element) return false;

        const tagName = element.tagName.toLowerCase();
        const isInput = tagName === 'input' || tagName === 'textarea';
        const isContentEditable = element.isContentEditable;
        const isMonacoEditor = element.classList.contains('monaco-editor') ||
                               element.closest('.monaco-editor') !== null;

        return isInput || isContentEditable || isMonacoEditor;
    }

    /**
     * Set keyboard style (iOS only - light/dark)
     */
    async setStyle(style: 'light' | 'dark'): Promise<void> {
        try {
            if (typeof Keyboard !== 'undefined' && 'setStyle' in Keyboard) {
                await (Keyboard as any).setStyle({ style });
            }
        } catch (error) {
            console.warn('Keyboard style not supported:', error);
        }
    }

    /**
     * Set whether keyboard should resize content
     */
    async setResizeMode(mode: 'native' | 'body' | 'ionic' | 'none'): Promise<void> {
        try {
            if (typeof Keyboard !== 'undefined' && 'setResizeMode' in Keyboard) {
                await (Keyboard as any).setResizeMode({ mode });
            }
        } catch (error) {
            console.warn('Keyboard resize mode not supported:', error);
        }
    }

    /**
     * Cleanup listeners
     */
    dispose(): void {
        try {
            if (typeof Keyboard !== 'undefined') {
                Keyboard.removeAllListeners();
            }
        } catch (error) {
            console.error('Error disposing keyboard manager:', error);
        }
        this.callbacks.clear();
    }
}
