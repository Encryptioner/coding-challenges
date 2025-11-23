import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.mobilecode.ide',
  appName: 'Mobile Code IDE',
  webDir: 'lib',
  bundledWebRuntime: false,

  server: {
    // For development
    // url: 'http://192.168.1.100:3000', // Your local IP for testing
    // cleartext: true,

    // For production
    androidScheme: 'https',
    iosScheme: 'capacitor',
    hostname: 'app.localhost'
  },

  android: {
    buildOptions: {
      keystorePath: 'android/release-key.keystore',
      keystoreAlias: 'release',
      releaseType: 'APK'  // or 'AAB' for Google Play
    },
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: true // Set to false for production
  },

  ios: {
    contentInset: 'automatic',
    scrollEnabled: true,
    allowsLinkPreview: false,
    preferredContentMode: 'mobile'
  },

  plugins: {
    Keyboard: {
      resize: 'native',
      style: 'dark',
      resizeOnFullScreen: true
    },

    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#1e1e1e',
      androidScaleType: 'CENTER_CROP',
      showSpinner: true,
      spinnerColor: '#007acc'
    },

    Filesystem: {
      iosBasePath: 'Library/NoCloud/Files',
      androidBasePath: 'files'
    }
  }
};

export default config;
