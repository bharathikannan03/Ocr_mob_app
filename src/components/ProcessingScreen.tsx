import React, { useEffect, useState } from 'react';
import { Camera, FileText, Cpu, CheckCircle2, Sparkles } from 'lucide-react';

interface ProcessingScreenProps {
  cardPreview?: string;
  onFinished: () => void;
}

const STEPS = [
  { icon: Camera, title: 'Scanning visiting card image', desc: 'Validating aspect ratio, blur & lighting' },
  { icon: FileText, title: 'Extracting raw OCR text', desc: 'Running optical character recognition' },
  { icon: Cpu, title: 'Intelligently mapping contact entities', desc: 'Gemini 3.8 Flash resolving Name, Org & Roles' },
  { icon: Sparkles, title: 'Validating & preparing contact review', desc: 'Sanitizing phone, email, and locations' },
];

export const ProcessingScreen: React.FC<ProcessingScreenProps> = ({ cardPreview, onFinished }) => {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const timer1 = setTimeout(() => setCurrentStep(1), 500);
    const timer2 = setTimeout(() => setCurrentStep(2), 1100);
    const timer3 = setTimeout(() => setCurrentStep(3), 1800);
    const timer4 = setTimeout(() => onFinished(), 2400);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
    };
  }, [onFinished]);

  return (
    <div className="flex flex-col h-full bg-slate-900 text-white p-6 justify-between select-none">
      {/* Top Banner */}
      <div className="text-center pt-4">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold border border-blue-500/30">
          <Sparkles className="w-3.5 h-3.5 text-blue-400" />
          AI & OCR Pipeline
        </span>
        <h2 className="text-xl font-bold mt-2">Processing Business Card</h2>
        <p className="text-xs text-slate-400 mt-1">
          Structuring contact details with ML Kit & Gemini
        </p>
      </div>

      {/* Center Graphic */}
      <div className="flex flex-col items-center justify-center my-auto space-y-6">
        <div className="relative">
          {/* Pulsing rings */}
          <div className="absolute -inset-4 rounded-2xl bg-blue-500/20 animate-ping opacity-30" />
          <div className="relative w-44 h-26 rounded-xl border-2 border-blue-400/80 bg-slate-800 shadow-2xl overflow-hidden flex items-center justify-center">
            {cardPreview ? (
              <img src={cardPreview} alt="Processing" className="w-full h-full object-cover opacity-80" />
            ) : (
              <div className="text-xs font-mono text-slate-400">VISITING CARD</div>
            )}
            {/* Laser scanline */}
            <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-bounce" />
          </div>
        </div>

        {/* Step Progress List */}
        <div className="w-full max-w-xs space-y-3">
          {STEPS.map((step, idx) => {
            const Icon = step.icon;
            const isCompleted = currentStep > idx;
            const isCurrent = currentStep === idx;

            return (
              <div
                key={idx}
                className={`flex items-start gap-3 p-2.5 rounded-xl transition-all ${
                  isCurrent
                    ? 'bg-blue-600/20 border border-blue-500/40 text-white shadow-xs'
                    : isCompleted
                    ? 'text-emerald-400 opacity-90'
                    : 'text-slate-500 opacity-40'
                }`}
              >
                <div className="mt-0.5 shrink-0">
                  {isCompleted ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Icon className={`w-4 h-4 ${isCurrent ? 'text-blue-400 animate-spin' : ''}`} />
                  )}
                </div>
                <div>
                  <div className="text-xs font-semibold leading-tight">{step.title}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">{step.desc}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer reassurance */}
      <div className="text-center pb-2 text-[11px] text-slate-400">
        Review & edit screen will open next for verification.
      </div>
    </div>
  );
};
