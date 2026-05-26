import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Camera, 
  RotateCw, 
  Sparkles, 
  Sliders, 
  Check, 
  FileText, 
  RefreshCw, 
  Layers
} from 'lucide-react';
import { useVaultStore } from '../../store/useVaultStore';
import { useToast } from '../ui/Toast';

interface MobileScannerProps {
  onScanComplete?: (fileId: string) => void;
}

export const MobileScanner: React.FC<MobileScannerProps> = ({ onScanComplete }) => {
  const [step, setStep] = useState<'capture' | 'adjust' | 'enhance'>('capture');
  const [filter, setFilter] = useState<'original' | 'magic' | 'grayscale' | 'bw'>('magic');
  const [isCapturing, setIsCapturing] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  const { addFile } = useVaultStore();
  const { toast } = useToast();

  // Premium document stock photos for simulation
  const SAMPLE_DOCS = [
    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1568227451433-28c0b5b1e5fe?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=800&q=80'
  ];

  const handleCapture = () => {
    setIsCapturing(true);
    setTimeout(() => {
      // Pick a random sample doc
      const randomDoc = SAMPLE_DOCS[Math.floor(Math.random() * SAMPLE_DOCS.length)];
      setCapturedImage(randomDoc);
      setIsCapturing(false);
      setStep('adjust');
      toast({ title: 'Document Boundaries Detected', description: 'Auto-perspective correction active', type: 'success' });
    }, 900);
  };

  const handleSaveToVault = () => {
    if (!capturedImage) return;

    const fileName = `Scanned_Doc_${new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)}.pdf`;
    
    addFile({
      name: fileName,
      size: 1450000,
      type: 'application/pdf',
      url: capturedImage,
      folderId: null,
      category: 'Personal IDs',
      tags: ['MobileScan', filter.toUpperCase(), 'Verified'],
      isStarred: true,
      isArchived: false,
    });

    toast({ 
      title: 'Converted to Secure PDF', 
      description: `Saved to Root Vault with client-side zero-knowledge wrapper.`, 
      type: 'success' 
    });

    if (onScanComplete) {
      // return the first file id or let caller close
      onScanComplete(fileName);
    }

    // Reset
    setStep('capture');
    setCapturedImage(null);
  };

  return (
    <div className="w-full max-w-md mx-auto glass-panel-premium rounded-3xl border border-white/10 shadow-2xl overflow-hidden relative">
      {/* Top Mobile Bar */}
      <div className="px-5 py-3 bg-black/40 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-semibold tracking-wider text-white">VAULTIFY LENS</span>
        </div>
        <span className="text-[10px] bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded-full border border-blue-500/20">
          PDF Mode
        </span>
      </div>

      {/* Viewfinder & Interactive Previews */}
      <div className="relative aspect-[3/4] bg-slate-950 flex items-center justify-center overflow-hidden">
        {step === 'capture' && (
          <>
            {/* Live Camera Grid & simulation view */}
            <div className="absolute inset-0 bg-grid-pattern opacity-20 pointer-events-none" />
            
            {/* Animated Target Boundaries */}
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

            {/* Simulated Live Camera Stream Backdrop */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 bg-gradient-to-b from-slate-900/40 to-slate-950">
              <Layers className="w-16 h-16 text-blue-500/20 mb-3 animate-bounce" />
              <p className="text-xs text-gray-400 max-w-xs">
                Position your ID, contract, or note within the frame. The advanced neural engine will automatically extract the perspective.
              </p>
            </div>

            {/* Flash/Shutter sound simulated effects */}
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

        {step === 'adjust' && capturedImage && (
          <div className="relative w-full h-full p-6 flex items-center justify-center">
            <img 
              src={capturedImage} 
              alt="Scan Draft" 
              className="max-h-full max-w-full object-contain rounded-lg shadow-2xl ring-1 ring-white/20"
            />
            {/* Perspective corners overlay */}
            <div className="absolute inset-10 border border-blue-500/80 bg-blue-500/10 rounded pointer-events-none">
              <div className="absolute -top-2 -left-2 w-4 h-4 bg-blue-500 rounded-full ring-4 ring-white/20" />
              <div className="absolute -top-2 -right-2 w-4 h-4 bg-blue-500 rounded-full ring-4 ring-white/20" />
              <div className="absolute -bottom-2 -left-2 w-4 h-4 bg-blue-500 rounded-full ring-4 ring-white/20" />
              <div className="absolute -bottom-2 -right-2 w-4 h-4 bg-blue-500 rounded-full ring-4 ring-white/20" />
            </div>
          </div>
        )}

        {step === 'enhance' && capturedImage && (
          <div className="relative w-full h-full p-4 flex items-center justify-center bg-slate-950">
            <img 
              src={capturedImage} 
              alt="Scan Enhanced" 
              className={`max-h-full max-w-full object-contain rounded-lg shadow-2xl transition-all duration-300 ${
                filter === 'grayscale' ? 'grayscale contrast-125' : ''
              } ${
                filter === 'bw' ? 'grayscale contrast-200 brightness-110' : ''
              } ${
                filter === 'magic' ? 'saturate-110 contrast-110' : ''
              }`}
            />
            <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-md border border-white/10 text-[10px] text-gray-300 uppercase tracking-wider">
              Filter: <span className="text-white font-bold">{filter}</span>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Controls */}
      <div className="p-5 bg-slate-900 border-t border-white/10">
        {step === 'capture' && (
          <div className="flex items-center justify-between">
            <button 
              onClick={() => toast({ title: 'Auto-flash activated', type: 'info' })}
              className="p-3 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
            >
              <Sparkles className="w-5 h-5" />
            </button>

            {/* Big Premium Shutter Button */}
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
              onClick={() => toast({ title: 'Batch mode active', description: 'Multi-page scanner ready', type: 'info' })}
              className="p-3 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
            >
              <Layers className="w-5 h-5" />
            </button>
          </div>
        )}

        {step === 'adjust' && (
          <div className="space-y-4">
            <p className="text-xs text-center text-gray-400">
              Drag corners to fit perfect document borders
            </p>
            <div className="flex items-center justify-between gap-3">
              <button
                onClick={() => setStep('capture')}
                className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-medium transition-colors flex items-center justify-center gap-1.5"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Retake</span>
              </button>
              
              <button
                onClick={() => setStep('enhance')}
                className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition-colors flex items-center justify-center gap-1.5 glow-blue"
              >
                <span>Confirm Borders</span>
                <Sliders className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {step === 'enhance' && (
          <div className="space-y-4">
            {/* Filter Selector */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              {[
                { id: 'magic', label: 'Magic Enhance' },
                { id: 'original', label: 'Original' },
                { id: 'grayscale', label: 'Grayscale' },
                { id: 'bw', label: 'B&W Scan' },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFilter(f.id as any)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                    filter === f.id 
                      ? 'bg-white text-slate-950 font-bold shadow' 
                      : 'bg-white/5 text-gray-400 hover:text-white'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Save Actions */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setStep('adjust')}
                className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                title="Back to Adjust"
              >
                <RotateCw className="w-5 h-5" />
              </button>

              <button
                onClick={handleSaveToVault}
                className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-lg glow-emerald"
              >
                <FileText className="w-4 h-4" />
                <span>Convert to PDF & Vault</span>
                <Check className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
