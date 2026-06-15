import React, { useState, useRef, useEffect, useCallback } from 'react';
import heic2any from 'heic2any';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Camera,
  RotateCw,
  Sparkles,
  Sliders,
  FileText,
  RefreshCw,
  Upload,
  Download,
  ImagePlus,
  X,
  Sun,
  Contrast,
  Plus,
  ChevronLeft,
  ChevronRight,
  Eye,
  Trash2,
  Printer,
  Wand2,
  FlipVertical,
  ZoomIn,
  Star,
  Share2,
  Check,
  Layers,
  FileImage,
  ScanLine,
  FlipHorizontal,
  Copy,
  Pencil,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import { useVaultStore } from '../../store/useVaultStore';
import { useToast } from '../ui/Toast';

interface MobileScannerProps {
  onScanComplete?: (fileId: string) => void;
}

type FilterType =
  | 'original' | 'magic' | 'grayscale' | 'bw' | 'warm' | 'color' | 'sepia' | 'sharpen'
  | 'cool' | 'vivid' | 'fade' | 'vintage' | 'night' | 'emboss' | 'invert'
  | 'teal' | 'pink' | 'sketch' | 'blueprint' | 'infrared';

interface ScannedPage {
  id: string;
  dataUrl: string;
  filter: FilterType;
  name: string;
  brightness: number;
  contrast: number;
  rotation: number;
}

const FILTERS: { id: FilterType; label: string; icon: string }[] = [
  { id: 'magic',     label: 'Magic',     icon: '✨' },
  { id: 'original',  label: 'Original',  icon: '🎨' },
  { id: 'color',     label: 'Color',     icon: '🌈' },
  { id: 'grayscale', label: 'Gray',      icon: '🩶' },
  { id: 'bw',        label: 'B&W',       icon: '◼' },
  { id: 'warm',      label: 'Warm',      icon: '🌅' },
  { id: 'cool',      label: 'Cool',      icon: '❄️' },
  { id: 'sepia',     label: 'Sepia',     icon: '📜' },
  { id: 'vintage',   label: 'Vintage',   icon: '📷' },
  { id: 'fade',      label: 'Fade',      icon: '🌫️' },
  { id: 'vivid',     label: 'Vivid',     icon: '🔆' },
  { id: 'night',     label: 'Night',     icon: '🌙' },
  { id: 'teal',      label: 'Teal',      icon: '🟦' },
  { id: 'pink',      label: 'Pink',      icon: '🌸' },
  { id: 'infrared',  label: 'Infrared',  icon: '🌡️' },
  { id: 'invert',    label: 'Invert',    icon: '🔄' },
  { id: 'blueprint', label: 'Blueprint', icon: '📐' },
  { id: 'emboss',    label: 'Emboss',    icon: '🗿' },
  { id: 'sketch',    label: 'Sketch',    icon: '✏️' },
  { id: 'sharpen',   label: 'Sharpen',   icon: '🔪' },
];

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
          const c2 = 1.8;
          const val = Math.min(255, Math.max(0, ((gray - 128) * c2) + 210));
          r = Math.min(255, val + 8); g = Math.min(255, val + 5); b = Math.min(255, val);
        } else if (filterType === 'grayscale') {
          const gray = 0.299 * r + 0.587 * g + 0.114 * b;
          r = g = b = Math.round(gray);
        } else if (filterType === 'bw') {
          const gray = 0.299 * r + 0.587 * g + 0.114 * b;
          const v = Math.min(255, Math.max(0, ((gray - 128) * 2.2) + 128));
          r = g = b = v > 140 ? 255 : 0;
        } else if (filterType === 'warm') {
          r = Math.min(255, r * 1.12); g = Math.min(255, g * 1.02); b = Math.min(255, b * 0.85);
        } else if (filterType === 'cool') {
          r = Math.min(255, r * 0.88); g = Math.min(255, g * 0.97); b = Math.min(255, b * 1.18);
        } else if (filterType === 'sepia') {
          const nr = Math.min(255, r * 0.393 + g * 0.769 + b * 0.189);
          const ng = Math.min(255, r * 0.349 + g * 0.686 + b * 0.168);
          const nb = Math.min(255, r * 0.272 + g * 0.534 + b * 0.131);
          r = nr; g = ng; b = nb;
        } else if (filterType === 'color') {
          r = Math.min(255, r * 1.05); g = Math.min(255, g * 1.05); b = Math.min(255, b * 1.1);
          const gray = 0.299 * r + 0.587 * g + 0.114 * b;
          r = Math.min(255, gray + (r - gray) * 1.4);
          g = Math.min(255, gray + (g - gray) * 1.4);
          b = Math.min(255, gray + (b - gray) * 1.4);
        } else if (filterType === 'vivid') {
          // Boost saturation strongly
          const gray = 0.299 * r + 0.587 * g + 0.114 * b;
          r = Math.min(255, Math.max(0, gray + (r - gray) * 2.2));
          g = Math.min(255, Math.max(0, gray + (g - gray) * 2.2));
          b = Math.min(255, Math.max(0, gray + (b - gray) * 2.2));
        } else if (filterType === 'fade') {
          // Faded / matte: reduce contrast, lift shadows
          r = Math.round(r * 0.75 + 48); g = Math.round(g * 0.75 + 40); b = Math.round(b * 0.75 + 36);
          r = Math.min(255, r); g = Math.min(255, g); b = Math.min(255, b);
        } else if (filterType === 'vintage') {
          // Sepia-ish + lifted blacks + slight vignette
          const nr = Math.min(255, r * 0.45 + g * 0.50 + b * 0.12 + 30);
          const ng = Math.min(255, r * 0.38 + g * 0.44 + b * 0.10 + 20);
          const nb = Math.min(255, r * 0.22 + g * 0.28 + b * 0.12 + 10);
          r = nr; g = ng; b = nb;
        } else if (filterType === 'night') {
          // Dark teal / underexposed
          r = Math.min(255, r * 0.55); g = Math.min(255, g * 0.65); b = Math.min(255, b * 0.85);
        } else if (filterType === 'teal') {
          // Teal & orange: warm the reds, cool the blues/greens
          const lum = 0.299 * r + 0.587 * g + 0.114 * b;
          if (lum > 150) { // highlights → warm orange
            r = Math.min(255, r * 1.15); g = Math.min(255, g * 0.96); b = Math.min(255, b * 0.78);
          } else { // shadows → cool teal
            r = Math.min(255, r * 0.72); g = Math.min(255, g * 1.05); b = Math.min(255, b * 1.22);
          }
        } else if (filterType === 'pink') {
          r = Math.min(255, r * 1.08 + 12); g = Math.min(255, g * 0.88); b = Math.min(255, b * 0.95 + 8);
        } else if (filterType === 'infrared') {
          // Swap channels: plants glow white, sky goes dark
          const tmp = r; r = Math.min(255, g * 1.1); g = Math.min(255, tmp * 0.6); b = Math.min(255, b * 0.5);
        } else if (filterType === 'invert') {
          r = 255 - r; g = 255 - g; b = 255 - b;
        } else if (filterType === 'blueprint') {
          // White on blueprint-blue: invert + blue tint
          const gray = 0.299 * r + 0.587 * g + 0.114 * b;
          const inv = 255 - gray;
          r = Math.round(inv * 0.18); g = Math.round(inv * 0.45); b = Math.min(255, Math.round(inv * 0.85 + 40));
        } else if (filterType === 'emboss' || filterType === 'sketch' || filterType === 'sharpen') {
          // These use kernel second-pass — treat as original in first pass
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

      // Kernel-based second passes
      if (filterType === 'sharpen' || filterType === 'emboss' || filterType === 'sketch') {
        const src2 = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const dst2 = ctx.createImageData(canvas.width, canvas.height);
        const W = canvas.width;
        const H = canvas.height;

        let kernel: number[];
        if (filterType === 'sharpen') {
          kernel = [0, -1, 0, -1, 5, -1, 0, -1, 0];
        } else if (filterType === 'emboss') {
          kernel = [-2, -1, 0, -1, 1, 1, 0, 1, 2];
        } else {
          // sketch: edge-detect via Laplacian, then invert
          kernel = [0, -1, 0, -1, 4, -1, 0, -1, 0];
        }

        for (let y = 1; y < H - 1; y++) {
          for (let x = 1; x < W - 1; x++) {
            for (let c = 0; c < 3; c++) {
              let val = 0;
              for (let ky = -1; ky <= 1; ky++) {
                for (let kx = -1; kx <= 1; kx++) {
                  const idx2 = ((y + ky) * W + (x + kx)) * 4 + c;
                  val += src2.data[idx2] * kernel[(ky + 1) * 3 + (kx + 1)];
                }
              }
              if (filterType === 'sketch') {
                // Invert the edge map: edges become dark on white bg
                val = 255 - Math.min(255, Math.max(0, val));
              } else if (filterType === 'emboss') {
                val = Math.min(255, Math.max(0, val + 128));
              } else {
                val = Math.min(255, Math.max(0, val));
              }
              dst2.data[(y * W + x) * 4 + c] = val;
            }
            dst2.data[(y * W + x) * 4 + 3] = 255;
          }
        }
        // Fill border pixels with neutral value
        for (let x = 0; x < W; x++) {
          for (let c = 0; c < 3; c++) {
            const top = (0 * W + x) * 4 + c;
            const bot = ((H - 1) * W + x) * 4 + c;
            dst2.data[top] = filterType === 'sketch' ? 255 : 128;
            dst2.data[bot] = filterType === 'sketch' ? 255 : 128;
          }
          dst2.data[(0 * W + x) * 4 + 3] = 255;
          dst2.data[((H - 1) * W + x) * 4 + 3] = 255;
        }
        ctx.putImageData(dst2, 0, 0);
      }

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
  const [contrast, setContrast] = useState(110);
  const [rotation, setRotation] = useState(0);
  const [flipH, setFlipH] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [pages, setPages] = useState<ScannedPage[]>([]);
  const [previewPageIdx, setPreviewPageIdx] = useState<number | null>(null);
  const [isSavingAll, setIsSavingAll] = useState(false);
  const [docName, setDocName] = useState('');
  const [showPageGallery, setShowPageGallery] = useState(false);
  const [quality, setQuality] = useState<'high' | 'medium' | 'low'>('high');
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const [autoEnhancing, setAutoEnhancing] = useState(false);
  const [renamingIdx, setRenamingIdx] = useState<number | null>(null);
  const [renameVal, setRenameVal] = useState('');

  /* Camera */
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { addFile } = useVaultStore();
  const { toast } = useToast();

  const qualityValue = quality === 'high' ? 0.95 : quality === 'medium' ? 0.80 : 0.65;

  const startCamera = useCallback(async (facing: 'environment' | 'user' = facingMode) => {
    try {
      if (cameraStream) cameraStream.getTracks().forEach(t => t.stop());
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: facing }, width: { ideal: 1920 }, height: { ideal: 1080 } },
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
  }, [cameraStream, facingMode, toast]);

  const stopCamera = useCallback(() => {
    cameraStream?.getTracks().forEach(t => t.stop());
    setCameraStream(null);
    setCameraActive(false);
  }, [cameraStream]);

  useEffect(() => () => { cameraStream?.getTracks().forEach(t => t.stop()); }, [cameraStream]);

  const flipCamera = async () => {
    const newFacing = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(newFacing);
    if (cameraActive) await startCamera(newFacing);
  };

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
      setRotation(0);
      setBrightness(100);
      setContrast(110);
      setFilter('magic');
      setIsCapturing(false);
      setStep('adjust');
      stopCamera();
      toast({ title: 'Photo Captured', description: 'Ready to adjust and enhance.', type: 'success' });
    }, 400);
  };

  const handleUploadPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isHeic =
      file.type === 'image/heic' ||
      file.type === 'image/heif' ||
      file.name.toLowerCase().endsWith('.heic') ||
      file.name.toLowerCase().endsWith('.heif');

    if (!file.type.startsWith('image/') && !isHeic) {
      toast({ title: 'Invalid File', description: 'Please select an image.', type: 'error' });
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    if (fileInputRef.current) fileInputRef.current.value = '';

    if (isHeic) {
      setIsProcessing(true);
      toast({ title: 'Converting HEIC...', description: 'Please wait while we convert the image.', type: 'info' });
      try {
        const converted = await heic2any({
          blob: file,
          toType: 'image/jpeg',
          quality: 0.92,
        });
        const blob = Array.isArray(converted) ? converted[0] : converted;
        const reader = new FileReader();
        reader.onload = (ev) => {
          const dataUrl = ev.target?.result as string;
          setCapturedImage(dataUrl);
          setProcessedImage(null);
          setRotation(0);
          setBrightness(100);
          setContrast(110);
          setFilter('magic');
          stopCamera();
          setStep('adjust');
          setIsProcessing(false);
          toast({ title: 'Photo Loaded', description: 'HEIC converted. Adjust frame then enhance.', type: 'success' });
        };
        reader.onerror = () => {
          setIsProcessing(false);
          toast({ title: 'Conversion Failed', description: 'Could not read the converted image.', type: 'error' });
        };
        reader.readAsDataURL(blob);
      } catch {
        setIsProcessing(false);
        toast({ title: 'HEIC Conversion Failed', description: 'Unable to convert this HEIC file. Try saving it as JPG first.', type: 'error' });
      }
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setCapturedImage(dataUrl);
      setProcessedImage(null);
      setRotation(0);
      setBrightness(100);
      setContrast(110);
      setFilter('magic');
      stopCamera();
      setStep('adjust');
      toast({ title: 'Photo Loaded', description: 'Adjust frame then enhance.', type: 'success' });
    };
    reader.readAsDataURL(file);
  };

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

  const handleFlipH = () => {
    setFlipH(v => !v);
  };

  const handleCopyToClipboard = async () => {
    const src = getDisplayImage();
    if (!src) return;
    try {
      const res = await fetch(src);
      const blob = await res.blob();
      await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
      toast({ title: 'Copied to Clipboard', description: 'Image copied — paste it anywhere.', type: 'success' });
    } catch {
      toast({ title: 'Copy failed', description: 'Your browser may not support clipboard image writing.', type: 'error' });
    }
  };

  const handleShare = async () => {
    const src = getDisplayImage();
    if (!src) return;
    try {
      const res = await fetch(src);
      const blob = await res.blob();
      const file = new File([blob], `${docName.trim() || 'Scan'}.jpg`, { type: 'image/jpeg' });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: docName.trim() || 'Scanned Document' });
      } else {
        toast({ title: 'Share not supported', description: 'Use Download instead to save the image.', type: 'error' });
      }
    } catch (err: any) {
      if (err?.name !== 'AbortError') toast({ title: 'Share failed', type: 'error' });
    }
  };

  const handleMovePage = (idx: number, dir: 'up' | 'down') => {
    setPages(prev => {
      const arr = [...prev];
      const target = dir === 'up' ? idx - 1 : idx + 1;
      if (target < 0 || target >= arr.length) return arr;
      [arr[idx], arr[target]] = [arr[target], arr[idx]];
      return arr;
    });
  };

  const handleRenamePage = (idx: number) => {
    setPages(prev => {
      const arr = [...prev];
      arr[idx] = { ...arr[idx], name: renameVal.trim() || arr[idx].name };
      return arr;
    });
    setRenamingIdx(null);
    setRenameVal('');
  };

  const handleBrightnessChange = (val: number) => {
    setBrightness(val);
    if (step === 'enhance') reprocess(filter, val, contrast, rotation);
  };

  const handleContrastChange = (val: number) => {
    setContrast(val);
    if (step === 'enhance') reprocess(filter, brightness, val, rotation);
  };

  const handleAutoEnhance = async () => {
    setAutoEnhancing(true);
    setFilter('magic');
    setBrightness(110);
    setContrast(120);
    await reprocess('magic', 110, 120, rotation);
    setAutoEnhancing(false);
    toast({ title: 'Auto-Enhanced', description: 'Document optimized automatically.', type: 'success' });
  };

  const getDisplayImage = () => step === 'enhance' ? (processedImage || capturedImage) : capturedImage;

  const handleAddPage = () => {
    const src = getDisplayImage();
    if (!src) return;
    const pageNum = pages.length + 1;
    setPages(prev => [...prev, {
      id: `page-${Date.now()}`,
      dataUrl: src,
      filter,
      name: `Page ${pageNum}`,
      brightness,
      contrast,
      rotation
    }]);
    toast({ title: `Page ${pageNum} Added`, description: `${pageNum} page(s) in your document.`, type: 'success' });
    setStep('capture');
    setCapturedImage(null);
    setProcessedImage(null);
    setRotation(0);
    setBrightness(100);
    setContrast(110);
    setFilter('magic');
  };

  const handleDeletePage = (idx: number) => {
    setPages(prev => prev.filter((_, i) => i !== idx));
    if (previewPageIdx !== null && previewPageIdx >= idx) {
      setPreviewPageIdx(prev => (prev !== null && prev > 0) ? prev - 1 : null);
    }
    toast({ title: 'Page Removed', type: 'info' });
  };

  const handleSaveToVault = async () => {
    const src = getDisplayImage();
    if (!src) return;
    const name = docName.trim() || `Scan_${new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-')}`;
    const fileName = name.endsWith('.jpg') ? name : `${name}.jpg`;
    try {
      await addFile({
        name: fileName,
        size: Math.round(src.length * 0.75),
        type: 'image/jpeg',
        url: '',
        folderId: null,
        category: 'Personal IDs',
        tags: ['Scanned', filter.toUpperCase()],
        isStarred: false,
        isArchived: false,
      }, src);
      toast({ title: 'Saved to Vault', description: fileName, type: 'success' });
      if (onScanComplete) onScanComplete(fileName);
      setDocName('');
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

  const handleSaveAllPages = async () => {
    if (pages.length === 0) return;
    setIsSavingAll(true);
    const name = docName.trim() || `Document_${new Date().toISOString().slice(0, 10)}`;
    let saved = 0;
    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];
      const fileName = pages.length === 1 ? `${name}.jpg` : `${name}_Page${(i + 1).toString().padStart(2, '0')}.jpg`;
      try {
        await addFile({
          name: fileName,
          size: Math.round(page.dataUrl.length * 0.75),
          type: 'image/jpeg',
          url: '',
          folderId: null,
          category: 'Personal IDs',
          tags: ['Scanned', 'Multi-Page', name],
          isStarred: false,
          isArchived: false,
        }, page.dataUrl);
        saved++;
      } catch { /* continue */ }
    }
    setIsSavingAll(false);
    toast({ title: `${saved} Page${saved > 1 ? 's' : ''} Saved`, description: `Saved to Documents vault.`, type: 'success' });
    setPages([]);
    setDocName('');
  };

  const handleExportAsPdf = () => {
    const allPages = pages.length > 0 ? pages.map(p => p.dataUrl) : [getDisplayImage()].filter(Boolean) as string[];
    if (allPages.length === 0) return;

    const win = window.open('', '_blank');
    if (!win) {
      toast({ title: 'Pop-up blocked', description: 'Please allow pop-ups to export PDF.', type: 'error' });
      return;
    }
    const name = docName.trim() || 'Scanned Document';
    win.document.write(`<!DOCTYPE html><html><head>
      <title>${name}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { background: white; }
        .page { 
          width: 210mm; min-height: 297mm; display: flex; align-items: center; justify-content: center; 
          page-break-after: always; padding: 10mm; background: white;
        }
        img { max-width: 100%; max-height: 277mm; object-fit: contain; }
        @media print {
          body { print-color-adjust: exact; }
          .page { page-break-after: always; }
          .no-print { display: none !important; }
        }
      </style>
    </head><body>
      <div class="no-print" style="background:#1e293b;color:white;padding:12px 20px;font-family:sans-serif;font-size:13px;display:flex;align-items:center;justify-content:space-between;">
        <span>📄 ${name} — ${allPages.length} page${allPages.length > 1 ? 's' : ''}</span>
        <button onclick="window.print()" style="background:#3b82f6;color:white;border:none;padding:8px 16px;border-radius:8px;cursor:pointer;font-size:13px;font-weight:bold;">🖨️ Print / Save as PDF</button>
      </div>
      ${allPages.map((src, i) => `<div class="page"><img src="${src}" alt="Page ${i + 1}" /></div>`).join('')}
    </body></html>`);
    win.document.close();
    toast({ title: 'PDF Preview Ready', description: 'Click "Print / Save as PDF" in the new window.', type: 'success' });
  };

  const handleDownload = () => {
    const src = getDisplayImage();
    if (!src) return;
    const name = docName.trim() || `Scan_${Date.now()}`;
    const a = document.createElement('a');
    a.href = src;
    a.download = `${name}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast({ title: 'Download Started', type: 'success' });
  };

  const handleDownloadAll = () => {
    const name = docName.trim() || 'Scan';
    pages.forEach((page, i) => {
      const a = document.createElement('a');
      a.href = page.dataUrl;
      a.download = `${name}_Page${i + 1}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    });
    toast({ title: `${pages.length} Pages Downloaded`, type: 'success' });
  };

  const displayImage = getDisplayImage();

  return (
    <div className="w-full max-w-lg mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <ScanLine className="w-5 h-5 text-blue-400" />
            Document Scanner
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">Scan, enhance and save documents to your vault</p>
        </div>
        {pages.length > 0 && (
          <button
            onClick={() => setShowPageGallery(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold hover:bg-emerald-500/20 transition-all"
          >
            <Layers className="w-3.5 h-3.5" />
            {pages.length} Page{pages.length > 1 ? 's' : ''}
          </button>
        )}
      </div>

      {/* Main Scanner Card */}
      <div className="glass-panel-premium rounded-3xl border border-white/10 shadow-2xl overflow-hidden">
        {/* Hidden canvas */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Top Bar */}
        <div className="px-4 py-3 bg-black/40 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-semibold tracking-wider text-white">VAULTIFY SCANNER</span>
          </div>
          <div className="flex items-center gap-2">
            {pages.length > 0 && (
              <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/30 font-bold">
                {pages.length}p
              </span>
            )}
            <span className="text-[10px] bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded-full border border-blue-500/20">
              {step === 'capture' ? 'Scan Mode' : step === 'adjust' ? 'Frame Mode' : 'Enhance Mode'}
            </span>
            {/* Quality selector */}
            <div className="relative">
              <button
                onClick={() => setShowQualityMenu(v => !v)}
                className="text-[10px] bg-white/5 text-gray-400 px-2 py-0.5 rounded-full border border-white/10 hover:bg-white/10 transition-all capitalize"
              >
                {quality}
              </button>
              {showQualityMenu && (
                <div className="absolute right-0 top-6 z-20 bg-slate-900 border border-white/10 rounded-xl overflow-hidden shadow-2xl min-w-[90px]">
                  {(['high', 'medium', 'low'] as const).map(q => (
                    <button
                      key={q}
                      onClick={() => { setQuality(q); setShowQualityMenu(false); }}
                      className={`w-full px-3 py-2 text-left text-xs capitalize transition-colors ${quality === q ? 'text-blue-400 bg-blue-500/10' : 'text-gray-300 hover:bg-white/5'}`}
                    >
                      {q === 'high' ? '🔥 High' : q === 'medium' ? '✅ Medium' : '💾 Low'}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Viewfinder */}
        <div className="relative aspect-[3/4] bg-slate-950 flex items-center justify-center overflow-hidden">

          {/* CAPTURE STEP */}
          {step === 'capture' && (
            <>
              {cameraActive ? (
                <video ref={videoRef} autoPlay playsInline muted className="absolute inset-0 w-full h-full object-cover" />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 bg-gradient-to-b from-slate-900/40 to-slate-950">
                  <div className="w-20 h-20 rounded-3xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-4">
                    <Camera className="w-10 h-10 text-blue-400/50" />
                  </div>
                  <p className="text-sm font-semibold text-white mb-1">Ready to Scan</p>
                  <p className="text-xs text-gray-400 max-w-xs">
                    Tap <strong className="text-white">Camera</strong> for live scan or <strong className="text-white">Gallery</strong> to upload.
                  </p>
                </div>
              )}

              {/* Document frame guides */}
              <div className="absolute inset-8 border-2 border-dashed border-emerald-500/40 rounded-xl flex flex-col justify-between p-4 pointer-events-none">
                <div className="flex justify-between">
                  <div className="w-5 h-5 border-t-2 border-l-2 border-emerald-400" />
                  <div className="w-5 h-5 border-t-2 border-r-2 border-emerald-400" />
                </div>
                {cameraActive && (
                  <div className="text-center">
                    <span className="bg-emerald-950/90 text-emerald-300 text-[10px] font-bold px-3 py-1 rounded-full border border-emerald-500/30 backdrop-blur-md">
                      ALIGN DOCUMENT IN FRAME
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <div className="w-5 h-5 border-b-2 border-l-2 border-emerald-400" />
                  <div className="w-5 h-5 border-b-2 border-r-2 border-emerald-400" />
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
                src={displayImage} alt="Scan Draft"
                className="max-h-full max-w-full object-contain rounded-lg shadow-2xl ring-1 ring-white/20"
                style={{ transform: `rotate(${rotation}deg)`, transition: 'transform 0.3s' }}
              />
              <div className="absolute inset-6 border border-blue-500/70 bg-blue-500/5 rounded pointer-events-none">
                <div className="absolute -top-2 -left-2 w-4 h-4 bg-blue-500 rounded-full ring-4 ring-white/20" />
                <div className="absolute -top-2 -right-2 w-4 h-4 bg-blue-500 rounded-full ring-4 ring-white/20" />
                <div className="absolute -bottom-2 -left-2 w-4 h-4 bg-blue-500 rounded-full ring-4 ring-white/20" />
                <div className="absolute -bottom-2 -right-2 w-4 h-4 bg-blue-500 rounded-full ring-4 ring-white/20" />
              </div>
              <div className="absolute top-2 left-2 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-md border border-white/10 text-[10px] text-gray-300">
                📐 Adjust frame
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
                    className="max-h-full max-w-full object-contain rounded-lg shadow-2xl transition-all duration-300"
                    style={{ transform: flipH ? 'scaleX(-1)' : undefined }}
                  />
                  <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-md border border-white/10 text-[10px] text-gray-300 uppercase tracking-wider">
                    <span className="text-white font-bold">{FILTERS.find(f => f.id === filter)?.icon} {filter}</span>
                    <span className="ml-1.5 text-emerald-400">· ✓</span>
                    {flipH && <span className="ml-1.5 text-purple-400">· ↔ flipped</span>}
                  </div>
                  <div className="absolute top-3 right-3 flex items-center gap-1.5">
                    <button
                      onClick={handleFlipH}
                      title="Flip Horizontal"
                      className={`p-2 rounded-lg backdrop-blur-md border transition-all ${flipH ? 'bg-purple-600/40 border-purple-500/40 text-purple-300' : 'bg-black/60 border-white/10 text-gray-400 hover:text-white'}`}
                    >
                      <FlipHorizontal className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={handleCopyToClipboard}
                      title="Copy to Clipboard"
                      className="p-2 rounded-lg bg-black/60 backdrop-blur-md border border-white/10 text-gray-400 hover:text-white transition-all"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={handleShare}
                      title="Share"
                      className="p-2 rounded-lg bg-black/60 backdrop-blur-md border border-white/10 text-gray-400 hover:text-white transition-all"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </>
              ) : null}
            </div>
          )}
        </div>

        {/* Bottom Controls */}
        <div className="p-4 bg-slate-900 border-t border-white/10 space-y-4">

          {/* CAPTURE CONTROLS */}
          {step === 'capture' && (
            <>
              <div className="flex items-center justify-between gap-3">
                <button
                  onClick={cameraActive ? stopCamera : () => startCamera()}
                  className={`p-3.5 rounded-2xl transition-all font-medium flex items-center gap-2 text-xs ${
                    cameraActive
                      ? 'bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 border border-rose-500/30'
                      : 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 border border-blue-500/30'
                  }`}
                >
                  {cameraActive ? <X className="w-5 h-5" /> : <Camera className="w-5 h-5" />}
                  <span className="hidden sm:inline">{cameraActive ? 'Close' : 'Camera'}</span>
                </button>

                {/* Shutter */}
                <button
                  onClick={cameraActive ? captureFromCamera : () => fileInputRef.current?.click()}
                  disabled={isCapturing}
                  className="w-16 h-16 rounded-full bg-white p-1 ring-4 ring-blue-500/40 hover:scale-105 transition-transform flex items-center justify-center group shadow-xl"
                >
                  <div className="w-full h-full rounded-full bg-blue-600 group-hover:bg-blue-700 transition-colors flex items-center justify-center">
                    {cameraActive ? <Camera className="w-7 h-7 text-white" /> : <ImagePlus className="w-6 h-6 text-white" />}
                  </div>
                </button>

                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="p-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 transition-all"
                    title="Upload from Gallery"
                  >
                    <ImagePlus className="w-5 h-5" />
                  </button>
                  {cameraActive && (
                    <button
                      onClick={flipCamera}
                      className="p-3 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 border border-white/10 transition-all"
                      title="Flip Camera"
                    >
                      <FlipVertical className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              <p className="text-center text-[10px] text-gray-500">
                {cameraActive ? 'Point at document — tap shutter to capture' : 'Camera · Gallery · or drag & drop below'}
              </p>

              <input
                ref={fileInputRef}
                type="file"
                accept={[
                  // Standard image MIME types
                  'image/*',
                  // HEIC / HEIF (Apple formats — need explicit MIME + extension)
                  'image/heic','image/heif','.heic','.heif',
                  // AVIF
                  'image/avif','.avif',
                  // RAW camera formats
                  '.raw','.cr2','.nef','.arw','.dng','.orf','.rw2',
                  'image/x-canon-cr2','image/x-nikon-nef','image/x-sony-arw',
                  'image/x-adobe-dng','image/x-olympus-orf','image/x-panasonic-rw2',
                  // Design / professional formats
                  '.psd','image/vnd.adobe.photoshop',
                  '.ai','application/postscript',
                  '.eps','application/eps',
                  '.indd',
                  '.xcf','image/x-xcf',
                  // Other image formats
                  '.jp2','image/jp2',
                  '.jxr','image/jxr',
                  '.apng','image/apng',
                  '.exr','image/x-exr',
                  '.hdr','image/vnd.radiance',
                  '.dds','image/vnd-ms.dds',
                  '.pcx','image/vnd.zbrush.pcx',
                  '.tga','image/x-tga',
                  '.ico','image/x-icon',
                  '.bmp','image/bmp',
                  '.tiff','.tif','image/tiff',
                  '.svg','image/svg+xml',
                  '.webp','image/webp',
                  '.gif','image/gif',
                  // PDF
                  '.pdf','application/pdf',
                  // Office docs
                  '.doc','.docx','.xls','.xlsx','.ppt','.pptx',
                  '.txt','.rtf','.csv',
                  // Archives
                  '.zip','.rar','.7z',
                  // Video
                  'video/*','.mp4','.mov','.avi','.mkv','.webm',
                  // Audio
                  'audio/*','.mp3','.m4a','.aac','.wav','.ogg','.flac',
                ].join(',')}
                className="hidden"
                onChange={handleUploadPhoto}
              />

              {pages.length > 0 && (
                <div className="pt-2 border-t border-white/5 space-y-3">
                  {/* Document name */}
                  <input
                    type="text"
                    placeholder="Document name (optional)..."
                    value={docName}
                    onChange={e => setDocName(e.target.value)}
                    className="w-full bg-white/[0.04] text-white text-xs rounded-xl px-3.5 py-2.5 border border-white/10 focus:border-blue-500 outline-none placeholder:text-gray-600"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={handleSaveAllPages}
                      disabled={isSavingAll}
                      className="py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                    >
                      {isSavingAll ? <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Star className="w-3.5 h-3.5" />}
                      Save All ({pages.length})
                    </button>
                    <button
                      onClick={handleExportAsPdf}
                      className="py-2.5 rounded-xl bg-rose-600/80 hover:bg-rose-600 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      Export PDF
                    </button>
                  </div>
                  <button
                    onClick={handleDownloadAll}
                    className="w-full py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-medium transition-all flex items-center justify-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download All Pages
                  </button>
                </div>
              )}
            </>
          )}

          {/* ADJUST CONTROLS */}
          {step === 'adjust' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] text-gray-400 font-semibold">Rotation</span>
                <button
                  onClick={handleRotate}
                  className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-medium transition-all flex items-center gap-1.5"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                  Rotate 90°
                </button>
              </div>
              <div className="flex items-center gap-3">
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
                  Enhance
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
                {FILTERS.map(f => (
                  <button
                    key={f.id}
                    onClick={() => handleFilterChange(f.id)}
                    className={`flex-shrink-0 px-2.5 py-1.5 rounded-xl text-[10px] font-bold transition-all whitespace-nowrap ${
                      filter === f.id
                        ? 'bg-blue-600 text-white shadow-lg'
                        : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white border border-white/10'
                    }`}
                  >
                    {f.icon} {f.label}
                  </button>
                ))}
              </div>

              {/* Auto-enhance */}
              <button
                onClick={handleAutoEnhance}
                disabled={autoEnhancing}
                className="w-full py-2 rounded-xl bg-gradient-to-r from-purple-600/30 to-blue-600/30 hover:from-purple-600/50 hover:to-blue-600/50 border border-purple-500/20 text-white text-xs font-bold transition-all flex items-center justify-center gap-2"
              >
                {autoEnhancing
                  ? <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  : <Wand2 className="w-3.5 h-3.5 text-purple-300" />
                }
                Auto-Enhance Document
              </button>

              {/* Sliders */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-semibold text-gray-400 flex items-center gap-1"><Sun className="w-3 h-3" /> Brightness</span>
                    <span className="text-[10px] text-blue-400 font-mono">{brightness}%</span>
                  </div>
                  <input
                    type="range" min="50" max="180" value={brightness}
                    onChange={e => handleBrightnessChange(Number(e.target.value))}
                    className="w-full h-1.5 rounded-full accent-blue-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-semibold text-gray-400 flex items-center gap-1"><Contrast className="w-3 h-3" /> Contrast</span>
                    <span className="text-[10px] text-blue-400 font-mono">{contrast}%</span>
                  </div>
                  <input
                    type="range" min="50" max="200" value={contrast}
                    onChange={e => handleContrastChange(Number(e.target.value))}
                    className="w-full h-1.5 rounded-full accent-blue-500"
                  />
                </div>
              </div>

              {/* Rotation */}
              <button
                onClick={handleRotate}
                className="w-full py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 text-xs transition-all flex items-center justify-center gap-1.5"
              >
                <RotateCw className="w-3.5 h-3.5" />
                Rotate 90° (current: {rotation}°)
              </button>

              {/* Document name field */}
              <input
                type="text"
                placeholder="Document name (optional)..."
                value={docName}
                onChange={e => setDocName(e.target.value)}
                className="w-full bg-white/[0.04] text-white text-xs rounded-xl px-3.5 py-2.5 border border-white/10 focus:border-blue-500 outline-none placeholder:text-gray-600"
              />

              {/* Action buttons */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleAddPage}
                  className="py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 glow-emerald"
                >
                  <Plus className="w-4 h-4" />
                  Add Page
                </button>
                <button
                  onClick={handleSaveToVault}
                  disabled={isProcessing}
                  className="py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 glow-blue"
                >
                  <Star className="w-4 h-4" />
                  Save
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleExportAsPdf}
                  className="py-2 rounded-xl bg-rose-600/70 hover:bg-rose-600 text-white text-xs font-semibold transition-all flex items-center justify-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Export PDF
                </button>
                <button
                  onClick={handleDownload}
                  className="py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-semibold transition-all flex items-center justify-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download
                </button>
              </div>

              <button
                onClick={() => { setStep('capture'); setCapturedImage(null); setProcessedImage(null); setRotation(0); }}
                className="w-full py-2 rounded-xl bg-white/[0.02] hover:bg-white/5 text-gray-500 hover:text-gray-300 text-xs transition-all flex items-center justify-center gap-1"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Scan New Document
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Feature info cards */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { icon: '✨', title: '8 Filters', desc: 'Magic, B&W, Sepia...' },
          { icon: '↔', title: 'Flip & Rotate', desc: 'Mirror, rotate 90°' },
          { icon: '📄', title: 'PDF Export', desc: 'Print to PDF' },
          { icon: '📋', title: 'Copy & Share', desc: 'Clipboard & share' },
          { icon: '✏️', title: 'Rename Pages', desc: 'Custom page names' },
          { icon: '📚', title: 'Reorder Pages', desc: 'Move up / down' },
        ].map(item => (
          <div key={item.title} className="glass-panel rounded-2xl p-3 border border-white/5 text-center">
            <div className="text-lg mb-1">{item.icon}</div>
            <p className="text-[11px] font-bold text-white">{item.title}</p>
            <p className="text-[9px] text-gray-500">{item.desc}</p>
          </div>
        ))}
      </div>

      {/* Page Gallery Modal */}
      <AnimatePresence>
        {showPageGallery && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm"
              onClick={() => setShowPageGallery(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 40 }}
              className="relative w-full max-w-lg glass-panel-premium rounded-3xl border border-white/10 shadow-2xl z-10 overflow-hidden max-h-[80vh] flex flex-col"
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 flex-shrink-0">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-blue-400" />
                  Document Pages ({pages.length})
                </h3>
                <button onClick={() => setShowPageGallery(false)} className="p-1.5 rounded-lg text-gray-400 hover:text-white transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4">
                {pages.length === 0 ? (
                  <p className="text-center text-xs text-gray-500 py-8">No pages added yet.</p>
                ) : (
                  <div className="space-y-2">
                    {pages.map((page, idx) => (
                      <div key={page.id} className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/30 p-2">
                        {/* Thumbnail */}
                        <div className="relative flex-shrink-0 w-14 h-[72px] rounded-lg overflow-hidden cursor-pointer" onClick={() => setPreviewPageIdx(idx)}>
                          <img src={page.dataUrl} alt={page.name} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/0 hover:bg-black/40 transition-all">
                            <ZoomIn className="w-4 h-4 text-white opacity-0 hover:opacity-100" />
                          </div>
                        </div>

                        {/* Name / rename */}
                        <div className="flex-1 min-w-0">
                          {renamingIdx === idx ? (
                            <form
                              onSubmit={e => { e.preventDefault(); handleRenamePage(idx); }}
                              className="flex items-center gap-1"
                            >
                              <input
                                autoFocus
                                value={renameVal}
                                onChange={e => setRenameVal(e.target.value)}
                                className="flex-1 bg-white/10 text-white text-xs rounded-lg px-2 py-1 border border-blue-500/50 outline-none min-w-0"
                                placeholder={page.name}
                                onBlur={() => handleRenamePage(idx)}
                              />
                              <button type="submit" className="p-1 rounded-lg bg-blue-600 text-white">
                                <Check className="w-3 h-3" />
                              </button>
                            </form>
                          ) : (
                            <button
                              onClick={() => { setRenamingIdx(idx); setRenameVal(page.name); }}
                              className="flex items-center gap-1 text-left group"
                              title="Click to rename"
                            >
                              <p className="text-xs font-semibold text-white truncate">{page.name}</p>
                              <Pencil className="w-2.5 h-2.5 text-gray-600 group-hover:text-gray-300 flex-shrink-0 transition-colors" />
                            </button>
                          )}
                          <p className="text-[10px] text-gray-500 mt-0.5">Page {idx + 1} of {pages.length}</p>
                        </div>

                        {/* Actions: move up / down / delete */}
                        <div className="flex flex-col items-center gap-1">
                          <button
                            onClick={() => handleMovePage(idx, 'up')}
                            disabled={idx === 0}
                            className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/10 disabled:opacity-20 transition-all"
                            title="Move up"
                          >
                            <ChevronUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleMovePage(idx, 'down')}
                            disabled={idx === pages.length - 1}
                            className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/10 disabled:opacity-20 transition-all"
                            title="Move down"
                          >
                            <ChevronDown className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeletePage(idx)}
                            className="p-1.5 rounded-lg text-rose-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
                            title="Delete page"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {pages.length > 0 && (
                <div className="flex-shrink-0 p-4 border-t border-white/10 space-y-2">
                  <input
                    type="text"
                    placeholder="Document name..."
                    value={docName}
                    onChange={e => setDocName(e.target.value)}
                    className="w-full bg-white/[0.04] text-white text-xs rounded-xl px-3.5 py-2.5 border border-white/10 focus:border-blue-500 outline-none placeholder:text-gray-600"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => { handleSaveAllPages(); setShowPageGallery(false); }}
                      disabled={isSavingAll}
                      className="py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                    >
                      <Star className="w-3.5 h-3.5" />
                      Save All to Vault
                    </button>
                    <button
                      onClick={() => { handleExportAsPdf(); setShowPageGallery(false); }}
                      className="py-2.5 rounded-xl bg-rose-600/70 hover:bg-rose-600 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      Export PDF
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Full-page preview */}
      <AnimatePresence>
        {previewPageIdx !== null && pages[previewPageIdx] && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/95 backdrop-blur-xl"
              onClick={() => setPreviewPageIdx(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative w-full max-w-lg z-10"
            >
              <div className="flex items-center justify-between mb-3 px-1">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPreviewPageIdx(i => (i !== null && i > 0) ? i - 1 : i)}
                    disabled={previewPageIdx === 0}
                    className="p-2 rounded-lg bg-white/10 disabled:opacity-30 text-white"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-xs text-white font-mono">
                    {previewPageIdx + 1} / {pages.length}
                  </span>
                  <button
                    onClick={() => setPreviewPageIdx(i => (i !== null && i < pages.length - 1) ? i + 1 : i)}
                    disabled={previewPageIdx === pages.length - 1}
                    className="p-2 rounded-lg bg-white/10 disabled:opacity-30 text-white"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDeletePage(previewPageIdx)}
                    className="p-2 rounded-lg bg-rose-600/20 text-rose-400 border border-rose-500/20 hover:bg-rose-600/30"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setPreviewPageIdx(null)}
                    className="p-2 rounded-lg bg-white/10 text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <img
                src={pages[previewPageIdx].dataUrl}
                alt={`Page ${previewPageIdx + 1}`}
                className="w-full rounded-2xl shadow-2xl"
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
