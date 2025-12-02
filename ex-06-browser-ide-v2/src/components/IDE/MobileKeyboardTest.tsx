import { useState, useEffect } from 'react';
import { useKeyboardConfig, useKeyboardTestingControls } from '@/hooks/useMobileConfig';
import { useKeyboardDetection, useIsMobile } from '@/hooks/useKeyboardDetection';
import { useVirtualKeyboardControls } from '@/hooks/useKeyboardDetection';

/**
 * Mobile Keyboard Testing Component
 * Provides testing controls and UI for Virtual Keyboard API functionality
 * Only visible in development mode or when explicitly enabled
 */
export function MobileKeyboardTest() {
  const keyboardConfig = useKeyboardConfig();
  const { showControls, enableDebugLogs } = useKeyboardTestingControls();
  const keyboardState = useKeyboardDetection();
  const isMobile = useIsMobile();
  const { showKeyboard, hideKeyboard, isVirtualKeyboardEnabled } = useVirtualKeyboardControls();

  const [testText, setTestText] = useState('');
  type TestResult = {
  feature: string;
  status: 'pass' | 'fail' | 'pending';
  message?: string;
};

const [testResults, setTestResults] = useState<TestResult[]>([]);

  // Only show in development or when testing is enabled
  if (!keyboardConfig.testing.showKeyboardControls) {
    return null;
  }

  const runTests = async () => {
    const results = [...testResults];

    // Test 1: Virtual Keyboard API Availability
    const vkTest: TestResult = {
      feature: 'Virtual Keyboard API',
      status: ('virtualKeyboard' in navigator ? 'pass' : 'fail') as 'pass' | 'fail' | 'pending',
      message: 'virtualKeyboard' in navigator ? 'API available' : 'API not available',
    };
    results[0] = vkTest;

    // Test 2: Touch Device Detection
    const touchTest: TestResult = {
      feature: 'Touch Detection',
      status: ('ontouchstart' in window || navigator.maxTouchPoints > 0 ? 'pass' : 'fail') as 'pass' | 'fail' | 'pending',
      message: 'ontouchstart' in window || navigator.maxTouchPoints > 0 ? 'Touch interface detected' : 'No touch interface',
    };
    results[1] = touchTest;

    // Test 3: Visual Viewport API
    const viewportTest: TestResult = {
      feature: 'Visual Viewport API',
      status: ('visualViewport' in window ? 'pass' : 'fail') as 'pass' | 'fail' | 'pending',
      message: 'visualViewport' in window ? 'Visual viewport API available' : 'Visual viewport API not available',
    };
    results[2] = viewportTest;

    // Test 4: Virtual Keyboard Control
    if ('virtualKeyboard' in navigator && keyboardConfig.virtualKeyboardAPI.enabled) {
      try {
        (navigator.virtualKeyboard as any).overlaysContent = keyboardConfig.virtualKeyboardAPI.overlaysContent;
        results[3] = {
          feature: 'Virtual Keyboard Control',
          status: 'pass' as const,
          message: ` overlaysContent set to ${keyboardConfig.virtualKeyboardAPI.overlaysContent}`,
        };
      } catch (error) {
        results[3] = {
          feature: 'Virtual Keyboard Control',
          status: 'fail' as const,
          message: `Failed to set overlaysContent: ${error}`,
        };
      }
    } else {
      results[3] = {
        feature: 'Virtual Keyboard Control',
        status: 'pending' as const,
        message: 'Virtual Keyboard API not available for testing',
      };
    }

    setTestResults(results);
  };

  const clearResults = () => {
    setTestResults([]);
  };

  const showTestKeyboard = () => {
    const input = document.getElementById('mobile-keyboard-test-input') as HTMLInputElement;
    if (input) {
      showKeyboard(input);
    }
  };

  const hideTestKeyboard = () => {
    hideKeyboard();
  };

  if (enableDebugLogs) {
    console.log('📱 Mobile Keyboard Test State:', {
      keyboardState,
      keyboardConfig,
      isMobile,
      isVirtualKeyboardEnabled,
      showControls,
    });
  }

  return (
    <div className="fixed bottom-4 right-4 bg-gray-800 text-white p-4 rounded-lg shadow-xl z-50 max-w-xs sm:max-w-sm md:max-w-md">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold">📱 Mobile Keyboard Test</h3>
        <button
          onClick={clearResults}
          className="text-xs bg-red-600 hover:bg-red-700 px-2 py-1 rounded"
        >
          Clear
        </button>
      </div>

      {/* Device Info */}
      <div className="mb-4 p-3 bg-gray-700 rounded">
        <div className="text-xs space-y-1">
          <div>📱 Mobile: {isMobile ? 'Yes' : 'No'}</div>
          <div>⌨️ Keyboard Visible: {keyboardState.isVisible ? 'Yes' : 'No'}</div>
          <div>📏 Keyboard Height: {keyboardState.height}px</div>
          <div>🔄 VK API Enabled: {isVirtualKeyboardEnabled ? 'Yes' : 'No'}</div>
        </div>
      </div>

      {/* Test Input */}
      <div className="mb-4">
        <label className="block text-xs font-medium mb-1">Test Input Field</label>
        <input
          id="mobile-keyboard-test-input"
          type="text"
          value={testText}
          onChange={(e) => setTestText(e.target.value)}
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Type here to test keyboard..."
          style={{ fontSize: '16px' }} // Prevent zoom
        />
      </div>

      {/* Test Controls */}
      <div className="mb-4 grid grid-cols-2 gap-2">
        <button
          onClick={showTestKeyboard}
          className="bg-blue-600 hover:bg-blue-700 px-3 py-2 rounded text-xs"
          disabled={!isVirtualKeyboardEnabled}
        >
          ⌨️ Show
        </button>
        <button
          onClick={hideTestKeyboard}
          className="bg-gray-600 hover:bg-gray-700 px-3 py-2 rounded text-xs"
          disabled={!isVirtualKeyboardEnabled}
        >
          ⌨️ Hide
        </button>
        <button
          onClick={runTests}
          className="bg-green-600 hover:bg-green-700 px-3 py-2 rounded text-xs col-span-2"
        >
          🧪 Run Tests
        </button>
      </div>

      {/* Test Results */}
      {testResults.length > 0 && (
        <div className="p-3 bg-gray-700 rounded">
          <h4 className="text-xs font-semibold mb-2">Test Results</h4>
          <div className="space-y-1">
            {testResults.map((result, index) => (
              <div
                key={index}
                className={`text-xs p-2 rounded ${
                  result.status === 'pass'
                    ? 'bg-green-900 text-green-100'
                    : result.status === 'fail'
                    ? 'bg-red-900 text-red-100'
                    : 'bg-yellow-900 text-yellow-100'
                }`}
              >
                <div className="font-medium">{result.feature}</div>
                <div className="text-xs opacity-75">{result.message}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Debug Info */}
      {enableDebugLogs && (
        <details className="mt-4 text-xs">
          <summary className="cursor-pointer font-medium">🔍 Debug Info</summary>
          <div className="mt-2 p-3 bg-gray-700 rounded text-xs space-y-1">
            <div>User Agent: {navigator.userAgent.slice(0, 50)}...</div>
            <div>Viewport: {window.innerWidth}x{window.innerHeight}</div>
            <div>Touch Points: {navigator.maxTouchPoints}</div>
            <div>CSS vh: {getComputedStyle(document.documentElement).getPropertyValue('--vh')}</div>
            <div>Config: {JSON.stringify(keyboardConfig, null, 2)}</div>
          </div>
        </details>
      )}
    </div>
  );
}