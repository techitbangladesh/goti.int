
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { X, CheckCircle, Loader2, Scan, Camera } from 'lucide-react';
import jsQR from 'jsqr';
import { Language } from '../types';

interface QRScannerProps {
  lang: Language;
  onClose: () => void;
}

const QRScanner: React.FC<QRScannerProps> = ({ lang, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mode, setMode] = useState<'select' | 'camera'>('select');
  const [status, setStatus] = useState<'idle' | 'scanning' | 'connecting' | 'success' | 'error'>('idle');
  const scanningRef = useRef<boolean>(false);
  const requestRef = useRef<number>(0);

  const scanFrame = useCallback(() => {
    if (!scanningRef.current || !videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (ctx) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imgData.data, imgData.width, imgData.height);
        if (code && code.data.toLowerCase().includes('goti')) {
          setStatus('connecting');
          setTimeout(() => setStatus('success'), 1200);
          scanningRef.current = false;
          return;
        }
      }
    }
    requestRef.current = requestAnimationFrame(scanFrame);
  }, []);

  useEffect(() => {
    let stream: MediaStream | null = null;
    if (mode === 'camera') {
      navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
        .then(s => {
          stream = s;
          if (videoRef.current) {
            videoRef.current.srcObject = s;
            videoRef.current.play().then(() => {
              setStatus('scanning');
              scanningRef.current = true;
              requestRef.current = requestAnimationFrame(scanFrame);
            });
          }
        }).catch(() => setStatus('error'));
    }
    return () => {
      scanningRef.current = false;
      cancelAnimationFrame(requestRef.current);
      if (stream) stream.getTracks().forEach(t => t.stop());
    };
  }, [mode, scanFrame]);

  if (mode === 'select') {
    return (
      <div className="fixed inset-0 z-[2000] bg-zinc-950 flex flex-col items-center justify-center p-8">
        <button onClick={onClose} className="absolute top-12 right-8 text-zinc-500"><X size={32} /></button>
        <div className="text-center space-y-12">
          <div className="w-24 h-24 bg-red-600 rounded-[2.5rem] flex items-center justify-center text-white mx-auto shadow-2xl animate-bounce"><Scan size={44} /></div>
          <button onClick={() => setMode('camera')} className="w-full max-w-sm p-8 bg-zinc-900 border border-zinc-800 rounded-[3rem] flex items-center gap-6 group hover:border-red-600 transition-all">
             <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-zinc-950"><Camera size={24} /></div>
             <div className="text-left"><h3 className="text-white font-black font-english uppercase tracking-widest">Connect Node</h3></div>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[2000] bg-zinc-950 flex flex-col">
      <canvas ref={canvasRef} className="hidden" />
      {status === 'scanning' && <video ref={videoRef} playsInline muted className="w-full h-full object-cover" />}
      <div className="absolute top-12 left-0 w-full px-8 flex items-center justify-between z-[2001]">
         <div className="flex items-center gap-3"><div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center text-white"><Scan size={20} /></div><p className="text-white font-black font-english tracking-widest text-[10px]">Explorer</p></div>
         <button onClick={onClose} className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center text-white"><X size={24} /></button>
      </div>
      {status === 'connecting' && <div className="absolute inset-0 bg-zinc-950 flex items-center justify-center"><Loader2 className="animate-spin text-red-600 w-12 h-12" /></div>}
      {status === 'success' && (
        <div className="absolute inset-0 bg-zinc-950 flex items-center justify-center p-8">
          <div className="bg-zinc-900 w-full max-w-sm p-12 rounded-[4rem] text-center space-y-8 animate-in zoom-in-95">
             <div className="w-24 h-24 bg-green-500/10 rounded-full flex items-center justify-center text-green-500 mx-auto"><CheckCircle size={56} /></div>
             <button onClick={onClose} className="w-full py-6 bg-white text-zinc-950 rounded-3xl font-black">Establish Link</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default QRScanner;
