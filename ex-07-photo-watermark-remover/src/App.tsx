import { useEffect } from 'react';
import { Toaster, toast } from 'sonner';
import { Upload, Cog, Download, Info } from 'lucide-react';
import { useAppStore } from './store/useAppStore';
import { opencvService } from './services/opencv';
import { ImageUploader } from './components/ImageUploader';
import { ProcessingQueue } from './components/ProcessingQueue';
import { DownloadManager } from './components/DownloadManager';
import { ImageEditor } from './components/ImageEditor';
import { Button } from './components/ui/button';

function App() {
  const { activeTab, setActiveTab, editingImageId } = useAppStore();

  // Pre-load OpenCV silently on mount
  useEffect(() => {
    const loadOpenCV = async () => {
      try {
        await opencvService.load();
        console.info('OpenCV.js pre-loaded successfully');
      } catch (error) {
        toast.error('Failed to load OpenCV.js - watermark removal may not work');
        console.error('OpenCV load error:', error);
      }
    };

    loadOpenCV();
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Toaster position="top-right" richColors />

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <header className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-3 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Photo Watermark Remover
          </h1>
          <p className="text-muted-foreground text-sm md:text-base">
            100% Free • Client-Side • Privacy-Friendly • Offline Support
          </p>

          {/* Info Banner */}
          <div className="mt-6 max-w-2xl mx-auto p-4 bg-blue-950/30 border border-blue-800/30 rounded-lg">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="text-left text-sm">
                <p className="text-blue-200 font-medium mb-1">Privacy First</p>
                <p className="text-blue-300/70">
                  All processing happens in your browser. No uploads, no servers, no tracking.
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Tabs */}
        <div className="flex justify-center gap-2 mb-8">
          <Button
            variant={activeTab === 'upload' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('upload')}
            className="gap-2"
          >
            <Upload className="w-4 h-4" />
            Upload
          </Button>

          <Button
            variant={activeTab === 'process' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('process')}
            className="gap-2"
          >
            <Cog className="w-4 h-4" />
            Process
          </Button>

          <Button
            variant={activeTab === 'download' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('download')}
            className="gap-2"
          >
            <Download className="w-4 h-4" />
            Download
          </Button>
        </div>

        {/* Main Content */}
        <main className="py-6">
          {activeTab === 'upload' && <ImageUploader />}
          {activeTab === 'process' && <ProcessingQueue />}
          {activeTab === 'download' && <DownloadManager />}
        </main>

        {/* Image Editor Modal */}
        {editingImageId && <ImageEditor />}

        {/* Footer */}
        <footer className="mt-16 pt-8 border-t border-border text-center text-sm text-muted-foreground">
          <p className="mb-2">
            Built with OpenCV.js • React • TypeScript
          </p>
          <p className="text-xs">
            This tool is for personal use only. Please respect copyright and intellectual property rights.
          </p>
        </footer>
      </div>
    </div>
  );
}

export default App;
