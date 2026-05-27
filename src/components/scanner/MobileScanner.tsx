import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  ImagePlus,
  X,
  ZoomIn,
  Sun,
  Contrast,
  FlipHorizontal,
  Plus,
  ChevronLeft,
  ChevronRight,
  Eye,
  Trash2
} from 'lucide-react';
import { useVaultStore } from '../../store/useVaultStore';
import { useToast } from '../ui/Toast';

interface MobileScannerProps {
  onScanComplete?: (fileId: string) => void;
}

type FilterType = 'original' | 'magic' | 'grayscale' | 'bw' | 'warm';

interface ScannedPage {
  id: string;
  dataUrl: string;
  filter: FilterType;
  name: string;
}

/* ─── Canvas filter + brightness/contrast ─── */
const applyCanvasFilter = (
  imgSrc: string,
  filterType: FilterType,
  brightness: number = 100,
  contrast: number = 100,
  rotation: number = 0
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const isRotated90 = rotation === 90 || rotation === 270;
      const MAX = 2400;
      let w = img.naturalWidth;
      let h = img.naturalHeight;
      if (w > MAX || h > MAX) {
        if (w > h) { h = Math.round(h * MAX / w); w = MAX; }
        else { w = Math.round(w * MAX / h); h = MAX; }
      }

      const canvas = document.createElement('canvas');
      if (isRotated90) { canvas.width = h; canvas.height = w; }
      else { canvas.width = w; canvas.height = h; }

      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      if (rotation !== 0) {
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate((rotation * Math.PI) / 180);
        ctx.drawImage(img, -w / 2, -h / 2, w, h);
        ctx.setTransform(1, 0, 0, 1, 0, 0);
      } else {
        ctx.drawImage(img, 0, 0, w, h);
      }

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      const bFactor = brightness / 100;
      const cFactor = contrast / 100;

      for (let i = 0; i < data.length; i += 4) {
        let r = data[i], g = data[i + 1], b = data[i + 2];

        if (filterType === 'magic') {
          const gray = 0.299 * r + 0.587 * g + 0.114 * b;
          const contrast2 = 1.7;
          const val = Math.min(255, Math.max(0, ((gray - 128) * contrast2) + 200));
          r = Math.min(255, val + 8);
          g = Math.min(255, val + 5);
          b = Math.min(255, val);
        } else if (filterType === 'grayscale') {
          const gray = 0.299 * r + 0.587 * g + 0.114 * b;
          r = g = b = Math.round(gray);
        } else if (filterType === 'bw') {
          const gray = 0.299 * r + 0.587 * g + 0.114 * b;
          const contrast2 = 2.0;
          const v = Math.min(255, Math.max(0, ((gray - 128) * contrast2) + 128));
          r = g = b = v > 150 ? 255 : 0;
        } else if (filterType === 'warm') {
          r = Math.min(255, r * 1.1);
          g = Math.min(255, g * 1.02);
          b = Math.min(255, b * 0.88);
        }

        r = Math.min(255, Math.max(0, (r - 128) * cFactor + 128));
        g = Math.min(255, Math.max(0, (g - 128) * cFactor + 128));
        b = Math.min(255, Math.max(0, (b - 128) * cFactor + 128));
        r = Math.min(255, Math.max(0, r * bFactor));
        g = Math.min(255, Math.max(0, g * bFactor));
        b = Math.min(255, Math.max(0, b * bFactor));

        data[i] = r; data[i + 1] = g; data[i + 2] = b;
      }

      ctx.putImageData(imageData, 0, 0);
      resolve(canvas.toDataURL('image/jpeg', 0.93));
    };
    img.onerror = reject;
    img.crossOrigin = 'anonymous';
    img.src = imgSrc;
  });
};

export const MobileScanner: React.FC<MobileScannerProps> = ({ onScanComplete }) => {
  const [step, setStep] = useState<'capture' | 'adjust' | 'enhance'>('capture');
  const [filter, setFilter] = useState<FilterType>('magic');
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [isRealUpload, setIsRealUpload] = useState(false);
  const [pages, setPages] = useState<ScannedPage[]>([]);
  const [previewPageIdx, setPreviewPageIdx] = useState<number | null>(null);
  const [isSavingAll, setIsSavingAll] = useState(false);

  /* ── Camera ── */
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { addFile } = useVaultStore();
  const { toast } = useToast();

  /* ── Start camera ── */
  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false
      });
      setCameraStream(stream);
      setCameraActive(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
    } catch {
      toast({ title: 'Camera not available', description: 'Please upload a photo from your device instead.', type: 'error' });
    }
  }, [toast]);

  /* ── Stop camera ── */
  const stopCamera = useCallback(() => {
    cameraStream?.getTracks().forEach(t => t.stop());
    setCameraStream(null);
    setCameraActive(false);
  }, [cameraStream]);

  useEffect(() => () => { cameraStream?.getTracks().forEach(t => t.stop()); }, [cameraStream]);

  /* ── Capture from camera ── */
  const captureFromCamera = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.95);

    setIsCapturing(true);
    setTimeout(() => {
      setCapturedImage(dataUrl);
      setProcessedImage(null);
      setIsRealUpload(true);
      setRotation(0);
      setBrightness(100);
      setContrast(100);
      setFilter('magic');
      setIsCapturing(false);
      setStep('adjust');
      stopCamera();
      toast({ title: 'Photo Captured', description: 'Ready to adjust and enhance.', type: 'success' });
    }, 400);
  };

  /* ── Upload from gallery ── */
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
      setRotation(0);
      setBrightness(100);
      setContrast(100);
      setFilter('magic');
      stopCamera();
      setStep('adjust');
      toast({ title: 'Photo Loaded', description: 'Adjust frame then enhance.', type: 'success' });
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  /* ── Confirm borders → enhance ── */
  const handleConfirmBorders = async () => {
    if (!capturedImage) return;
    setStep('enhance');
    setIsProcessing(true);
    try {
      const result = await applyCanvasFilter(capturedImage, filter, brightness, contrast, rotation);
      setProcessedImage(result);
    } catch {
      setProcessedImage(capturedImage);
    }
    setIsProcessing(false);
  };

  /* ── Re-process on any change ── */
  const reprocess = async (newFilter = filter, newBrightness = brightness, newContrast = contrast, newRotation = rotation) => {
    if (!capturedImage) return;
    setIsProcessing(true);
    try {
      const result = await applyCanvasFilter(capturedImage, newFilter, newBrightness, newContrast, newRotation);
      setProcessedImage(result);
    } catch {
      setProcessedImage(capturedImage);
    }
    setIsProcessing(false);
  };

  const handleFilterChange = (f: FilterType) => {
    setFilter(f);
    if (step === 'enhance') reprocess(f, brightness, contrast, rotation);
  };

  const handleRotate = () => {
    const newRot = (rotation + 90) % 360;
    setRotation(newRot);
    if (step === 'enhance') reprocess(filter, brightness, contrast, newRot);
  };

  const getDisplayImage = () => step === 'enhance' ? (processedImage || capturedImage) : capturedImage;

  /* ── Add page to multi-page batch ── */
  const handleAddPage = () => {
    const src = getDisplayImage();
    if (!src) return;
    const pageNum = pages.length + 1;
    setPages(prev => [...prev, {
      id: `page-${Date.now()}`,
      dataUrl: src,
      filter,
      name: `Page ${pageNum}`
    }]);
    toast({ title: `Page ${pageNum} Added`, description: `${pageNum} page(s) in your document.`, type: 'success' });
    setStep('capture');
    setCapturedImage(null);
    setProcessedImage(null);
    setRotation(0);
    setBrightness(100);
    setContrast(100);
    setFilter('magic');
  };

  /* ── Save single page to vault ── */
  const handleSaveToVault = async () => {
    const src = getDisplayImage();
    if (!src) return;
    const fileName = `Scan_${new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-')}.jpg`;
    try {
      await addFile({
        name: fileName,
        size: Math.round(src.length * 0.75),
        type: 'image/jpeg',
        url: '',
        folderId: null,
        category: 'Personal IDs',
        tags: ['Scanned', filter.toUpperCase()],
        isStarred: true,
        isArchived: false,
      }, src);
      toast({ title: 'Saved to Vault', description: fileName, type: 'success' });
      if (onScanComplete) onScanComplete(fileName);
    } catch (err: any) {
      if (err?.message === 'STORAGE_LIMIT_EXCEEDED') {
        toast({ title: 'Storage Full', description: 'Upgrade to Premium for unlimited storage.', type: 'error' });
      } else {
        toast({ title: 'Save Failed', type: 'error' });
      }
    }
    setStep('capture');
    setCapturedImage(null);
    setProcessedImage(null);
  };

  /* ── Save all pages to vault ── */
  const handleSaveAllPages = async () => {
    if (pages.length === 0) return;
    setIsSavingAll(true);
    const docName = `Document_${new Date().toISOString().slice(0, 10)}`;
    let saved = 0;
    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];
      const fileName = `${docName}_${(i + 1).toString().padStart(2, '0')}.jpg`;
      try {
        await addFile({
          name: fileName,
          size: Math.round(page.dataUrl.length * 0.75),
          type: 'image/jpeg',
          url: '',
          folderId: null,
          category: 'Personal IDs',
          tags: ['Scanned', 'Multi-Page'],
          isStarred: true,
          isArchived: false,
        }, page.dataUrl);
        saved++;
      } catch { /* continue */ }
    }
    setIsSavingAll(false);
    toast({ title: `${saved} Pages Saved`, description: `Saved as "${docName}_XX.jpg"`, type: 'success' });
    setPages([]);
  };

  /* ── Download current image ── */
  const handleDownload = () => {
    const src = getDisplayImage();
    if (!src) return;
    const a = document.createElement('a');
    a.href = src;
    a.download = `Scan_${Date.now()}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast({ title: 'Download Started', type: 'success' });
  };

  /* ── Download all pages as individual files ── */
  const handleDownloadAll = () => {
    pages.forEach((page, i) => {
      const a = document.createElement('a');
      a.href = page.dataUrl;
      a.download = `Scan_Page${i + 1}_${Date.now()}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    });
    toast({ title: `${pages.length} Pages Downloaded`, type: 'success' });
  };

  const displayImage = getDisplayImage();

  return (
    <div className="w-full max-w-md mx-auto glass-panel-premium rounded-3xl border border-white/10 shadow-2xl overflow-hidden relative">
      {/* Hidden canvas for camera capture */}
      <canvas ref={canvasRef} className="hidden" />

      {/* ── Top Bar ── */}
      <div className="px-5 py-3 bg-black/40 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-semibold tracking-wider text-white">VAULTIFY SCANNER</span>
        </div>
        <div className="flex items-center gap-2">
          {pages.length > 0 && (
            <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/30 font-bold">
              {pages.length} page{pages.length > 1 ? 's' : ''}
            </span>
          )}
          <span className="text-[10px] bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded-full border border-blue-500/20">
            {step === 'capture' ? 'Scan Mode' : step === 'adjust' ? 'Frame Mode' : 'Enhance Mode'}
          </span>
        </div>
      </div>

      {/* ── Viewfinder ── */}
      <div className="relative aspect-[3/4] bg-slate-950 flex items-center justify-center overflow-hidden">

        {/* CAPTURE STEP */}
        {step === 'capture' && (
          <>
            {cameraActive ? (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="absolute inset-0 w-full h-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 bg-gradient-to-b from-slate-900/40 to-slate-950">
                <Camera className="w-16 h-16 text-blue-500/30 mb-3" />
                <p className="text-xs text-gray-400 max-w-xs">
                  Tap <strong className="text-white">Camera</strong> to use your device camera,<br />
                  or <strong className="text-white">Gallery</strong> to upload a photo.
                </p>
              </div>
            )}

            {/* Corner markers */}
            <div className="absolute inset-8 border-2 border-dashed border-emerald-500/50 rounded-xl flex flex-col justify-between p-4 pointer-events-none">
              <div className="flex justify-between">
                <div className="w-4 h-4 border-t-2 border-l-2 border-emerald-400" />
                <div className="w-4 h-4 border-t-2 border-r-2 border-emerald-400" />
              </div>
              {cameraActive && (
                <div className="text-center">
                  <span className="bg-emerald-950/80 text-emerald-300 text-[10px] font-bold px-2.5 py-1 rounded-full border border-emerald-500/30 backdrop-blur-md">
                    ALIGN DOCUMENT IN FRAME
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <div className="w-4 h-4 border-b-2 border-l-2 border-emerald-400" />
                <div className="w-4 h-4 border-b-2 border-r-2 border-emerald-400" />
              </div>
            </div>

            {isCapturing && (
              <motion.div initial={{ opacity: 1 }} animate={{ opacity: 0 }} transition={{ duration: 0.4 }}
                className="absolute inset-0 bg-white z-20"
              />
            )}
          </>
        )}

        {/* ADJUST STEP */}
        {step === 'adjust' && displayImage && (
          <div className="relative w-full h-full p-4 flex items-center justify-center">
            <img
              src={displayImage}
              alt="Scan Draft"
              className="max-h-full max-w-full object-contain rounded-lg shadow-2xl ring-1 ring-white/20"
              style={{ transform: `rotate(${rotation}deg)`, transition: 'transform 0.3s' }}
            />
            <div className="absolute inset-6 border border-blue-500/80 bg-blue-500/5 rounded pointer-events-none">
              <div className="absolute -top-2 -left-2 w-4 h-4 bg-blue-500 rounded-full ring-4 ring-white/20" />
              <div className="absolute -top-2 -right-2 w-4 h-4 bg-blue-500 rounded-full ring-4 ring-white/20" />
              <div className="absolute -bottom-2 -left-2 w-4 h-4 bg-blue-500 rounded-full ring-4 ring-white/20" />
              <div className="absolute -bottom-2 -right-2 w-4 h-4 bg-blue-500 rounded-full ring-4 ring-white/20" />
            </div>
            <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-md border border-white/10 text-[10px] text-gray-300">
              📷 Adjust frame
            </div>
          </div>
        )}

        {/* ENHANCE STEP */}
        {step === 'enhance' && (
          <div className="relative w-full h-full flex items-center justify-center bg-slate-950">
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
                  className="max-h-full max-w-full object-contain rounded-lg shadow-2xl"
                />
                <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-md border border-white/10 text-[10px] text-gray-300 uppercase tracking-wider">
                  <span className="text-white font-bold">{filter}</span>
                  <span className="ml-1.5 text-emerald-400">· ✓ Processed</span>
                </div>
              </>
            ) : null}
          </div>
        )}
      </div>

      {/* ── Bottom Controls ── */}
      <div className="p-4 bg-slate-900 border-t border-white/10 space-y-4">

        {/* CAPTURE CONTROLS */}
        {step === 'capture' && (
          <>
            <div className="flex items-center justify-between">
              <button
                onClick={cameraActive ? stopCamera : startCamera}
                className={`p-3.5 rounded-2xl transition-all font-medium flex items-center gap-2 text-xs ${
                  cameraActive
                    ? 'bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 border border-rose-500/30'
                    : 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 border border-blue-500/30'
                }`}
              >
                {cameraActive ? <X className="w-5 h-5" /> : <Camera className="w-5 h-5" />}
                <span className="hidden sm:inline">{cameraActive ? 'Close' : 'Camera'}</span>
              </button>

              {/* Main shutter */}
              <button
                onClick={cameraActive ? captureFromCamera : () => fileInputRef.current?.click()}
                disabled={isCapturing}
                className="w-16 h-16 rounded-full bg-white p-1 ring-4 ring-blue-500/40 hover:scale-105 transition-transform flex items-center justify-center group shadow-xl"
              >
                <div className="w-full h-full rounded-full bg-blue-600 group-hover:bg-blue-700 transition-colors flex items-center justify-center">
                  {cameraActive ? <Camera className="w-7 h-7 text-white" /> : <ImagePlus className="w-6 h-6 text-white" />}
                </div>
              </button>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-3.5 rounded-2xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 hover:text-emerald-300 border border-emerald-500/20 transition-all flex items-center gap-2 text-xs"
              >
                <ImagePlus className="w-5 h-5" />
                <span className="hidden sm:inline">Gallery</span>
              </button>
            </div>

            <p className="text-center text-[10px] text-gray-500">
              {cameraActive ? 'Point camera at document — tap shutter to capture' : 'Tap Camera to enable live scanning · Gallery to upload'}
            </p>

            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleUploadPhoto} />
          </>
        )}

        {/* ADJUST CONTROLS */}
        {step === 'adjust' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] text-gray-400">Rotation</span>
              <button
                onClick={handleRotate}
                className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-medium transition-all flex items-center gap-1.5"
              >
                <RotateCw className="w-3.5 h-3.5" />
                Rotate 90°
              </button>
            </div>
            <div className="flex items-center justify-between gap-3">
              <button
                onClick={() => { setStep('capture'); setCapturedImage(null); setProcessedImage(null); setRotation(0); setCameraActive(false); }}
                className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-medium transition-colors flex items-center justify-center gap-1.5"
              >
                <RefreshCw className="w-4 h-4" />
                Retake
              </button>
              <button
                onClick={handleConfirmBorders}
                className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition-colors flex items-center justify-center gap-1.5 glow-blue"
              >
                Enhance →
                <Sliders className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ENHANCE CONTROLS */}
        {step === 'enhance' && (
          <div className="space-y-3">
            {/* Filter strip */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              {([
                { id: 'magic', label: '✨ Magic' },
                { id: 'original', label: '🎨 Original' },
                { id: 'grayscale', label: '🩶 Gray' },
                { id: 'bw', label: '◼ B&W' },
                { id: 'warm', label: '🌅 Warm' },
              ] as { id: FilterType; label: string }[]).map((f) => (
                <button
                  key={f.id}
                  onClick={() => handleFilterChange(f.id)}
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

            {/* Brightness slider */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] text-gray-400">
                <span className="flex items-center gap-1"><Sun className="w-3 h-3" /> Brightness</span>
                <span className="text-white font-mono">{brightness}%</span>
              </div>
              <input
                type="range" min="50" max="180" value={brightness}
                onChange={(e) => { setBrightness(+e.target.value); }}
                onMouseUp={() => reprocess(filter, brightness, contrast, rotation)}
                onTouchEnd={() => reprocess(filter, brightness, contrast, rotation)}
                className="w-full accent-blue-500"
              />
            </div>

            {/* Contrast slider */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] text-gray-400">
                <span className="flex items-center gap-1"><Contrast className="w-3 h-3" /> Contrast</span>
                <span className="text-white font-mono">{contrast}%</span>
              </div>
              <input
                type="range" min="50" max="200" value={contrast}
                onChange={(e) => { setContrast(+e.target.value); }}
                onMouseUp={() => reprocess(filter, brightness, contrast, rotation)}
                onTouchEnd={() => reprocess(filter, brightness, contrast, rotation)}
                className="w-full accent-blue-500"
              />
            </div>

            {/* Action bar */}
            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={handleRotate}
                disabled={isProcessing}
                className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors disabled:opacity-50"
                title="Rotate 90°"
              >
                <RotateCw className="w-4 h-4" />
              </button>

              <button
                onClick={handleDownload}
                disabled={isProcessing}
                className="p-2.5 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 hover:text-indigo-300 transition-colors disabled:opacity-50"
                title="Download"
              >
                <Download className="w-4 h-4" />
              </button>

              <button
                onClick={handleAddPage}
                disabled={isProcessing}
                className="px-3 py-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 hover:text-amber-300 border border-amber-500/20 transition-all disabled:opacity-50 flex items-center gap-1.5 text-xs font-medium"
                title="Add as another page"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Page
              </button>

              <button
                onClick={handleSaveToVault}
                disabled={isProcessing}
                className="flex-1 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-lg glow-emerald disabled:opacity-50"
              >
                <FileText className="w-3.5 h-3.5" />
                Save to Vault
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Multi-page batch strip ── */}
      <AnimatePresence>
        {pages.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="border-t border-white/10 bg-black/40"
          >
            <div className="px-4 py-3 flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-amber-400" />
                {pages.length} page{pages.length > 1 ? 's' : ''} queued
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleDownloadAll}
                  className="px-2.5 py-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 text-[11px] font-medium transition-all flex items-center gap-1"
                >
                  <Download className="w-3 h-3" />
                  Download All
                </button>
                <button
                  onClick={handleSaveAllPages}
                  disabled={isSavingAll}
                  className="px-2.5 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 text-[11px] font-bold transition-all flex items-center gap-1 disabled:opacity-50"
                >
                  {isSavingAll ? <div className="w-3 h-3 border border-emerald-400 border-t-transparent rounded-full animate-spin" /> : <Check className="w-3 h-3" />}
                  Save All
                </button>
                <button
                  onClick={() => setPages([])}
                  className="p-1.5 rounded-lg text-gray-500 hover:text-rose-400 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Page thumbnails */}
            <div className="flex items-center gap-2 px-4 pb-3 overflow-x-auto no-scrollbar">
              {pages.map((page, idx) => (
                <div key={page.id} className="relative flex-shrink-0">
                  <img
                    src={page.dataUrl}
                    alt={page.name}
                    onClick={() => setPreviewPageIdx(idx)}
                    className="w-12 h-16 object-cover rounded-lg border border-white/20 cursor-pointer hover:border-blue-500/60 transition-all"
                  />
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-blue-600 text-white text-[8px] font-bold flex items-center justify-center">
                    {idx + 1}
                  </span>
                  <button
                    onClick={() => setPages(prev => prev.filter((_, i) => i !== idx))}
                    className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-rose-600 text-white flex items-center justify-center hover:bg-rose-500 transition-colors"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Page preview modal ── */}
      <AnimatePresence>
        {previewPageIdx !== null && pages[previewPageIdx] && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md" onClick={() => setPreviewPageIdx(null)}>
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-sm w-full"
              onClick={e => e.stopPropagation()}
            >
              <img src={pages[previewPageIdx].dataUrl} alt={pages[previewPageIdx].name} className="w-full rounded-2xl shadow-2xl" />
              <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-full text-[11px] text-white font-bold">
                {pages[previewPageIdx].name}
              </div>
              <div className="absolute top-3 right-3 flex items-center gap-2">
                {previewPageIdx > 0 && (
                  <button onClick={() => setPreviewPageIdx(i => (i ?? 1) - 1)} className="p-2 rounded-full bg-black/60 text-white hover:bg-black/80">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                )}
                {previewPageIdx < pages.length - 1 && (
                  <button onClick={() => setPreviewPageIdx(i => (i ?? 0) + 1)} className="p-2 rounded-full bg-black/60 text-white hover:bg-black/80">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                )}
                <button onClick={() => setPreviewPageIdx(null)} className="p-2 rounded-full bg-black/60 text-white hover:bg-black/80">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
