import React, { useState, useRef, useEffect } from 'react';
import { Camera, X, RefreshCw, Upload, Zap, Image as ImageIcon, CheckCircle, AlertCircle, Sparkles } from 'lucide-react';
import { SAMPLE_CARDS } from '../data/sampleCards';
import { SampleCard } from '../types';

interface CameraScanScreenProps {
  onCapture: (imageData: string, rawText?: string) => void;
  onCancel: () => void;
}

export const CameraScanScreen: React.FC<CameraScanScreenProps> = ({ onCapture, onCancel }) => {
  const [useWebcam, setUseWebcam] = useState(false);
  const [webcamError, setWebcamError] = useState<string | null>(null);
  const [torchOn, setTorchOn] = useState(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [selectedSample, setSelectedSample] = useState<SampleCard | null>(SAMPLE_CARDS[0]);
  const [capturedPreview, setCapturedPreview] = useState<string | null>(null);
  const [capturedText, setCapturedText] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Initialize webcam if requested
  useEffect(() => {
    let stream: MediaStream | null = null;
    if (useWebcam) {
      navigator.mediaDevices
        ?.getUserMedia({
          video: { facingMode, width: { ideal: 1280 }, height: { ideal: 720 } },
        })
        .then((s) => {
          stream = s;
          if (videoRef.current) {
            videoRef.current.srcObject = s;
            videoRef.current.play();
          }
          setWebcamError(null);
        })
        .catch((err) => {
          console.warn('Webcam permission denied or unsupported:', err);
          setWebcamError('Camera access not available in this frame. Use sample cards or upload an image.');
          setUseWebcam(false);
        });
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [useWebcam, facingMode]);

  const handleCaptureWebcam = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      setCapturedPreview(dataUrl);
      setCapturedText(null);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file (JPEG, PNG, WEBP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setCapturedPreview(dataUrl);
      setCapturedText(null);
    };
    reader.readAsDataURL(file);
  };

  const handleSelectSampleCard = (sample: SampleCard) => {
    setSelectedSample(sample);
    // Draw sample card to canvas to create base64
    const canvas = document.createElement('canvas');
    canvas.width = 700;
    canvas.height = 400;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Draw professional business card graphic
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, 700, 400);

      // Card accent line
      ctx.fillStyle = '#2563eb';
      ctx.fillRect(0, 0, 16, 400);

      // Text elements
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 28px sans-serif';
      ctx.fillText(sample.name.toUpperCase(), 40, 70);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '18px sans-serif';
      ctx.fillText(sample.role, 40, 105);

      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 20px sans-serif';
      ctx.fillText(sample.company, 40, 140);

      ctx.fillStyle = '#cbd5e1';
      ctx.font = '16px monospace';
      const lines = sample.rawText.split('\n').slice(3);
      let y = 190;
      lines.forEach((line) => {
        if (line.trim()) {
          ctx.fillText(line, 40, y);
          y += 28;
        }
      });

      const cardDataUrl = canvas.toDataURL('image/jpeg', 0.92);
      setCapturedPreview(cardDataUrl);
      setCapturedText(sample.rawText);
    }
  };

  const confirmCapture = () => {
    if (capturedPreview) {
      onCapture(capturedPreview, capturedText || undefined);
    } else if (selectedSample) {
      handleSelectSampleCard(selectedSample);
      // Wait microtick
      setTimeout(() => {
        onCapture(capturedPreview || '', selectedSample.rawText);
      }, 50);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 text-white select-none">
      {/* Top Navigation Bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-900/90 backdrop-blur-md z-20 border-b border-slate-800">
        <button
          onClick={onCancel}
          className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
        <div className="text-center">
          <h2 className="text-sm font-bold tracking-tight">Scan Visiting Card</h2>
          <p className="text-[10px] text-slate-400">Position card inside frame</p>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setTorchOn(!torchOn)}
            className={`p-2 rounded-full transition-colors ${
              torchOn ? 'text-amber-400 bg-amber-400/20' : 'text-slate-400 hover:text-white'
            }`}
            title="Toggle Flash"
          >
            <Zap className="w-4 h-4" />
          </button>
          <button
            onClick={() => setFacingMode(facingMode === 'environment' ? 'user' : 'environment')}
            className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition-colors"
            title="Switch Camera"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Viewfinder Area */}
      <div className="relative flex-1 flex flex-col items-center justify-center p-4 overflow-hidden">
        {/* If user captured a preview */}
        {capturedPreview ? (
          <div className="relative w-full max-w-sm rounded-xl overflow-hidden border-2 border-emerald-500 shadow-2xl bg-black">
            <img
              src={capturedPreview}
              alt="Scanned Card"
              className="w-full object-contain max-h-[300px]"
            />
            <div className="absolute top-2 right-2 px-2 py-1 bg-emerald-500/90 text-white rounded text-[10px] font-semibold flex items-center gap-1 shadow-sm">
              <CheckCircle className="w-3 h-3" />
              <span>Card Captured</span>
            </div>
          </div>
        ) : useWebcam ? (
          <div className="relative w-full h-full flex items-center justify-center">
            <video
              ref={videoRef}
              playsInline
              autoPlay
              muted
              className="absolute inset-0 w-full h-full object-cover"
            />
            {/* Dark overlay with transparent cutout */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-xs pointer-events-none" />

            {/* Target Card Frame Cutout (Standard 3.5 x 2 ratio) */}
            <div className="relative z-10 w-[88%] aspect-[1.75] rounded-xl border-2 border-dashed border-blue-400 bg-transparent flex flex-col justify-between p-3 shadow-2xl shadow-blue-500/10 pointer-events-none">
              {/* Corner brackets */}
              <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-blue-400 rounded-tl-lg" />
              <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-blue-400 rounded-tr-lg" />
              <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-blue-400 rounded-bl-lg" />
              <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-blue-400 rounded-br-lg" />

              <div className="text-center text-[11px] font-medium text-blue-200 bg-slate-900/70 px-2 py-0.5 rounded-full mx-auto self-center">
                Keep card steady inside corners
              </div>
            </div>
          </div>
        ) : (
          /* Sample Card / Upload Viewfinder */
          <div className="w-full max-w-sm flex flex-col items-center">
            {/* Guide Card Box */}
            <div className="relative w-full aspect-[1.75] rounded-2xl border-2 border-blue-500/80 bg-slate-900/90 p-4 flex flex-col justify-between shadow-2xl overflow-hidden">
              {/* Corner brackets */}
              <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-blue-400 rounded-tl-xl" />
              <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-blue-400 rounded-tr-xl" />
              <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-blue-400 rounded-bl-xl" />
              <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-blue-400 rounded-br-xl" />

              {selectedSample ? (
                <div className="flex flex-col h-full justify-between select-none">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-blue-400 tracking-wider">
                        {selectedSample.company}
                      </span>
                      <span className="text-[10px] bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full font-medium">
                        {selectedSample.tag}
                      </span>
                    </div>
                    <div className="mt-2 text-base font-extrabold text-white">
                      {selectedSample.name}
                    </div>
                    <div className="text-xs text-slate-400 font-medium">
                      {selectedSample.role}
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-300 font-mono space-y-0.5 bg-slate-950/60 p-2 rounded-lg border border-slate-800">
                    <div className="truncate">📞 {selectedSample.rawText.split('\n')[4] || '+1 415 890-2341'}</div>
                    <div className="truncate">✉️ {selectedSample.rawText.split('\n')[5] || 'contact@example.com'}</div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-slate-400">
                  <Camera className="w-8 h-8 text-blue-400 mb-2" />
                  <span className="text-xs font-medium">Position card inside frame</span>
                </div>
              )}

              {/* Scanning laser line animation */}
              <div className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-pulse top-1/2 pointer-events-none" />
            </div>

            <p className="mt-3 text-center text-xs text-slate-400">
              Align business card edges with the corner guides for maximum OCR precision.
            </p>
          </div>
        )}

        {webcamError && (
          <div className="mt-3 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{webcamError}</span>
          </div>
        )}
      </div>

      {/* Sample Cards Selector Carousel */}
      {!capturedPreview && (
        <div className="px-4 py-2 bg-slate-900 border-t border-slate-800">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-blue-400" />
              Realistic Demo Cards
            </span>
            <span className="text-[10px] text-slate-500">Tap to load</span>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {SAMPLE_CARDS.map((card) => (
              <button
                key={card.id}
                onClick={() => handleSelectSampleCard(card)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium shrink-0 border transition-all ${
                  selectedSample?.id === card.id
                    ? 'bg-blue-600 border-blue-400 text-white shadow-sm'
                    : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <span>{card.name.split(' ')[0]}</span>
                <span className="text-[10px] opacity-75 ml-1">({card.tag})</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Bottom Shutter & Controls Bar */}
      <div className="p-4 bg-slate-900/90 border-t border-slate-800 z-20">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          accept="image/*"
          className="hidden"
        />

        {capturedPreview ? (
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setCapturedPreview(null);
                setCapturedText(null);
              }}
              className="flex-1 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Retake Photo</span>
            </button>
            <button
              onClick={confirmCapture}
              className="flex-1 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-blue-600/30 transition-all"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Process OCR</span>
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between max-w-sm mx-auto">
            {/* Gallery Upload */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-3 text-slate-400 hover:text-white rounded-full bg-slate-800 hover:bg-slate-700 transition-colors"
              title="Upload from Photo Library"
            >
              <ImageIcon className="w-5 h-5" />
            </button>

            {/* Main Shutter Button */}
            <button
              onClick={() => {
                if (useWebcam) {
                  handleCaptureWebcam();
                } else if (selectedSample) {
                  handleSelectSampleCard(selectedSample);
                }
              }}
              className="w-18 h-18 rounded-full border-4 border-white flex items-center justify-center bg-blue-600 hover:bg-blue-500 active:scale-95 transition-transform shadow-xl shadow-blue-500/30"
              title="Capture Card"
            >
              <div className="w-13 h-13 rounded-full bg-white flex items-center justify-center">
                <Camera className="w-6 h-6 text-blue-600" />
              </div>
            </button>

            {/* Toggle Real Camera */}
            <button
              onClick={() => setUseWebcam(!useWebcam)}
              className={`p-3 rounded-full transition-colors ${
                useWebcam
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
              }`}
              title="Toggle Live Webcam"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
