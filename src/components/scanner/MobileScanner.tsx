import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  Camera, 
  RotateCw, 
  Sparkles, 
  Sliders, 
  Check, 
  FileText, 
  RefreshCw, 
  Layers,
  Upload,
  Download,
  ImagePlus
} from 'lucide-react';
import { useVaultStore } from '../../store/useVaultStore';
import { useToast } from '../ui/Toast';

interface MobileScannerProps {
  onScanComplete?: (fileId: string) => void;
}

type FilterType = 'original' | 'magic' | 'grayscale' | 'bw';

const SAMPLE_DOCS = [
  'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1568227451433-28c0b5b1e5fe?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=800&q=80'
];

const applyCanvasFilter = (imgSrc: string, filterType: FilterType): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const MAX = 2000;
      let w = img.naturalWidth;
      let h = img.naturalHeight;
      if (w > MAX || h > MAX) {
        if (w > h) { h = Math.round(h * MAX / w); w = MAX; }
        else { w = Math.round(w * MAX / h); h = MAX; }
      }
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, w, h);
      ctx.drawImage(img, 0, 0, w, h);

      if (filterType !== 'original') {
        const imageData = ctx.getImageData(0, 0, w, h);
        const data = imageData.data;
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const gray = 0.299 * r + 0.587 * g + 0.114 * b;

          if (filterType === 'magic') {
            const contrast = 1.7;
            const val = Math.min(255, Math.max(0, ((gray - 128) * contrast) + 200));
            data[i] = Math.min(255, val + 8);
            data[i + 1] = Math.min(255, val + 5);
            data[i + 2] = Math.min(255, val);
          } else if (filterType === 'grayscale') {
            data[i] = data[i + 1] = data[i + 2] = Math.round(gray);
          } else if (filterType === 'bw') {
            const contrast = 2.0;
            const v = Math.min(255, Math.max(0, ((gray - 128) * contrast) + 128));
            const val = v > 150 ? 255 : 0;
            data[i] = data[i + 1] = data[i + 2] = val;
          }
        }
        ctx.putImageData(imageData, 0, 0);
      }
      resolve(canvas.toDataURL('image/jpeg', 0.93));
    };
    img.onerror = reject;
    img.src = imgSrc;
  });
};

export const MobileScanner: React.FC<MobileScannerProps> = ({ onScanComplete }) => {
  const [step, setStep] = useState<'capture' | 'adjust' | 'enhance'>('capture');
  const [filter, setFilter] = useState<FilterType>('magic');
  const [isCapturing, setIsCapturing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [isRealUpload, setIsRealUpload] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { addFile } = useVaultStore();
  const { toast } = useToast();

  const handleCapture = () => {
    setIsCapturing(true);
    setTimeout(() => {
      const randomDoc = SAMPLE_DOCS[Math.floor(Math.random() * SAMPLE_DOCS.length)];
      setCapturedImage(randomDoc);
      setProcessedImage(null);
      setIsRealUpload(false);
      setIsCapturing(false);
      setStep('adjust');
      toast({ title: 'Document Captured', description: 'Ready to adjust borders', type: 'success' });
    }, 900);
  };

  const handleUploadPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast({ title: 'Invalid File', description: 'Please select an image.', type: 'error' });
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setCapturedImage(dataUrl);
      setProcessedImage(null);
      setIsRealUpload(true);
      setStep('adjust');
      toast({ title: 'Photo Loaded', description: 'Adjust borders then enhance.', type: 'success' });
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleConfirmBorders = async () => {
    if (!capturedImage) return;
    setStep('enhance');
    if (isRealUpload) {
      setIsProcessing(true);
      try {
        const result = await applyCanvasFilter(capturedImage, filter);
        setProcessedImage(result);
      } catch {
        setProcessedImage(capturedImage);
      }
      setIsProcessing(false);
    } else {
      setProcessedImage(null);
    }
  };

  const handleFilterChange = async (newFilter: FilterType) => {
    setFilter(newFilter);
    if (isRealUpload && capturedImage) {
      setIsProcessing(true);
      try {
        const result = await applyCanvasFilter(capturedImage, newFilter);
        setProcessedImage(result);
      } catch {
        setProcessedImage(capturedImage);
      }
      setIsProcessing(false);
    }
  };

  const getDisplayImage = () => {
    if (step === 'enhance') {
      return isRealUpload ? (processedImage || capturedImage) : capturedImage;
    }
    return capturedImage;
  };

  const getCssFilter = () => {
    if (isRealUpload) return '';
    if (filter === 'grayscale') return 'grayscale(100%) contrast(1.25)';
    if (filter === 'bw') return 'grayscale(100%) contrast(2) brightness(1.1)';
    if (filter === 'magic') return 'contrast(1.15) saturate(1.1) brightness(1.02)';
    return '';
  };

  const handleDownload = () => {
    const src = getDisplayImage();
    if (!src) return;
    const a = document.createElement('a');
    a.href = src;
    a.download = `Scanned_Document_${Date.now()}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast({ title: 'Download Started', description: 'Your scanned document is downloading.', type: 'success' });
  };

  const handleSaveToVault = async () => {
    const src = getDisplayImage();
    if (!src) return;

    const fileName = `Scanned_Doc_${new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)}.jpg`;
    const fileContent = isRealUpload ? src : undefined;
    const sizeEstimate = isRealUpload ? Math.round(src.length * 0.75) : 1450000;

    try {
      await addFile({
        name: fileName,
        size: sizeEstimate,
        type: 'image/jpeg',
        url: isRealUpload ? '' : src,
        folderId: null,
        category: 'Personal IDs',
        tags: ['Scanned', filter.toUpperCase()],
        isStarred: true,
        isArchived: false,
      }, fileContent);

      toast({ title: 'Saved to Vault', description: `Document saved as "${fileName}"`, type: 'success' });
      if (onScanComplete) onScanComplete(fileName);
    } catch (err: any) {
      if (err?.message === 'STORAGE_LIMIT_EXCEEDED') {
        toast({ title: 'Storage Full', description: 'Upgrade to Premium for unlimited storage.', type: 'error' });
      } else {
        toast({ title: 'Save Failed', description: 'Something went wrong.', type: 'error' });
      }
    }

    setStep('capture');
    setCapturedImage(null);
    setProcessedImage(null);
    setIsRealUpload(false);
  };

  const displayImage = getDisplayImage();

  return (
    <div className="w-full max-w-md mx-auto glass-panel-premium rounded-3xl border border-white/10 shadow-2xl overflow-hidden relative">
      {/* Top Bar */}
      <div className="px-5 py-3 bg-black/40 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-semibold tracking-wider text-white">VAULTIFY LENS</span>
        </div>
        <span className="text-[10px] bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded-full border border-blue-500/20">
          Scan Mode
        </span>
      </div>

      {/* Viewfinder */}
      <div className="relative aspect-[3/4] bg-slate-950 flex items-center justify-center overflow-hidden">
        {step === 'capture' && (
          <>
            <div className="absolute inset-0 bg-grid-pattern opacity-20 pointer-events-none" />
            <div className="absolute inset-8 border-2 border-dashed border-emerald-500/70 rounded-xl flex flex-col justify-between p-4 pointer-events-none animate-pulse">
              <div className="flex justify-between">
                <div className="w-4 h-4 border-t-2 border-l-2 border-emerald-400" />
                <div className="w-4 h-4 border-t-2 border-r-2 border-emerald-400" />
              </div>
              <div className="text-center">
                <span className="bg-emerald-950/80 text-emerald-300 text-[10px] font-bold px-2.5 py-1 rounded-full border border-emerald-500/30 backdrop-blur-md">
                  {isCapturing ? 'HOLD STILL...' : 'ALIGN DOCUMENT'}
                </span>
              </div>
              <div className="flex justify-between">
                <div className="w-4 h-4 border-b-2 border-l-2 border-emerald-400" />
                <div className="w-4 h-4 border-b-2 border-r-2 border-emerald-400" />
              </div>
            </div>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 bg-gradient-to-b from-slate-900/40 to-slate-950">
              <Layers className="w-16 h-16 text-blue-500/20 mb-3 animate-bounce" />
              <p className="text-xs text-gray-400 max-w-xs">
                Tap the shutter button to simulate a scan, or tap the gallery button to upload a real photo.
              </p>
            </div>
            {isCapturing && (
              <motion.div 
                initial={{ opacity: 1 }} 
                animate={{ opacity: 0 }} 
                transition={{ duration: 0.5 }} 
                className="absolute inset-0 bg-white z-20"
              />
            )}
          </>
        )}

        {step === 'adjust' && displayImage && (
          <div className="relative w-full h-full p-6 flex items-center justify-center">
            <img 
              src={displayImage} 
              alt="Scan Draft" 
              className="max-h-full max-w-full object-contain rounded-lg shadow-2xl ring-1 ring-white/20"
            />
            <div className="absolute inset-10 border border-blue-500/80 bg-blue-500/10 rounded pointer-events-none">
              <div className="absolute -top-2 -left-2 w-4 h-4 bg-blue-500 rounded-full ring-4 ring-white/20" />
              <div className="absolute -top-2 -right-2 w-4 h-4 bg-blue-500 rounded-full ring-4 ring-white/20" />
              <div className="absolute -bottom-2 -left-2 w-4 h-4 bg-blue-500 rounded-full ring-4 ring-white/20" />
              <div className="absolute -bottom-2 -right-2 w-4 h-4 bg-blue-500 rounded-full ring-4 ring-white/20" />
            </div>
            <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-md border border-white/10 text-[10px] text-gray-300">
              {isRealUpload ? '📷 Real Photo' : '🎭 Simulated'}
            </div>
          </div>
        )}

        {step === 'enhance' && (
          <div className="relative w-full h-full p-4 flex items-center justify-center bg-slate-950">
            {isProcessing ? (
              <div className="flex flex-col items-center gap-3 text-center">
                <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-xs text-gray-400">Enhancing document...</p>
              </div>
            ) : displayImage ? (
              <>
                <img 
                  src={displayImage} 
                  alt="Enhanced Scan" 
                  style={{ filter: getCssFilter() }}
                  className="max-h-full max-w-full object-contain rounded-lg shadow-2xl transition-all duration-300"
                />
                <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-md border border-white/10 text-[10px] text-gray-300 uppercase tracking-wider">
                  Filter: <span className="text-white font-bold">{filter}</span>
                  {isRealUpload && <span className="ml-1 text-emerald-400">✓ Processed</span>}
                </div>
              </>
            ) : null}
          </div>
        )}
      </div>

      {/* Bottom Controls */}
      <div className="p-5 bg-slate-900 border-t border-white/10">
        {step === 'capture' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <button 
                onClick={() => toast({ title: 'Auto-flash activated', type: 'info' })}
                className="p-3 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
              >
                <Sparkles className="w-5 h-5" />
              </button>

              <button
                onClick={handleCapture}
                disabled={isCapturing}
                className="w-16 h-16 rounded-full bg-white p-1 ring-4 ring-blue-500/40 hover:scale-105 transition-transform flex items-center justify-center group shadow-xl"
              >
                <div className="w-full h-full rounded-full bg-blue-600 group-hover:bg-blue-700 transition-colors flex items-center justify-center">
                  <Camera className="w-7 h-7 text-white" />
                </div>
              </button>

              <button 
                onClick={() => fileInputRef.current?.click()}
                className="p-3 rounded-full bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 hover:text-emerald-300 transition-colors"
                title="Upload photo from device"
              >
                <ImagePlus className="w-5 h-5" />
              </button>
            </div>
            <p className="text-center text-[10px] text-gray-500">
              Tap gallery icon to upload a real photo from your device
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleUploadPhoto}
            />
          </div>
        )}

        {step === 'adjust' && (
          <div className="space-y-4">
            <p className="text-xs text-center text-gray-400">
              Confirm the document frame then proceed to enhance
            </p>
            <div className="flex items-center justify-between gap-3">
              <button
                onClick={() => { setStep('capture'); setCapturedImage(null); setProcessedImage(null); }}
                className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-medium transition-colors flex items-center justify-center gap-1.5"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Retake</span>
              </button>
              <button
                onClick={handleConfirmBorders}
                className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition-colors flex items-center justify-center gap-1.5 glow-blue"
              >
                <span>Confirm & Enhance</span>
                <Sliders className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {step === 'enhance' && (
          <div className="space-y-4">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              {[
                { id: 'magic', label: 'Magic Enhance' },
                { id: 'original', label: 'Original' },
                { id: 'grayscale', label: 'Grayscale' },
                { id: 'bw', label: 'B&W' },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => handleFilterChange(f.id as FilterType)}
                  disabled={isProcessing}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap disabled:opacity-50 ${
                    filter === f.id 
                      ? 'bg-white text-slate-950 font-bold shadow' 
                      : 'bg-white/5 text-gray-400 hover:text-white'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => { setStep('adjust'); setProcessedImage(null); }}
                className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                title="Back"
              >
                <RotateCw className="w-5 h-5" />
              </button>

              <button
                onClick={handleDownload}
                disabled={isProcessing}
                className="p-2.5 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 hover:text-indigo-300 transition-colors disabled:opacity-50"
                title="Download scanned document"
              >
                <Download className="w-5 h-5" />
              </button>

              <button
                onClick={handleSaveToVault}
                disabled={isProcessing}
                className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-lg glow-emerald disabled:opacity-50"
              >
                <FileText className="w-4 h-4" />
                <span>Save to Vault</span>
                <Check className="w-4 h-4" />
              </button>
            </div>
            <p className="text-center text-[10px] text-gray-500">
              Tap <Download className="w-3 h-3 inline" /> to download or "Save to Vault" to store securely
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
