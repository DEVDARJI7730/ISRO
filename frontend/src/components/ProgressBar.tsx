import React from 'react';

interface ProgressBarProps {
  progress: number;
  status: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ progress, status }) => {
  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-2">
        <span className="text-xs font-semibold text-accent-purple tracking-wider uppercase">{status}</span>
        <span className="text-sm font-bold text-slate-100">{progress}%</span>
      </div>
      <div className="w-full h-3 bg-space-900 border border-white/5 rounded-full overflow-hidden relative shadow-inner">
        {/* Glow effect tracking the bar */}
        <div 
          style={{ width: `${progress}%` }}
          className="h-full bg-gradient-to-r from-accent-purple to-accent-blue rounded-full transition-all duration-300 ease-out shadow-[0_0_12px_rgba(139,92,246,0.6)]"
        />
      </div>
    </div>
  );
};
export default ProgressBar;
