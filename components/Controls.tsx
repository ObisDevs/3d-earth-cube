import React from 'react';
import { PresetShape } from '../types';

interface ControlsProps {
  currentShape: string;
  onSelectShape: (shape: string) => void;
  currentColor: string;
  onSelectColor: (color: string) => void;
  isGenerating: boolean;
  gestureState: any;
}

const SHAPES = Object.values(PresetShape);
const COLORS = ['#ffffff', '#00ffff', '#ff00ff', '#ff9900', '#33ff33', '#ff3333', '#9933ff'];

export const Controls: React.FC<ControlsProps> = ({ 
  currentShape, 
  onSelectShape, 
  currentColor, 
  onSelectColor,
  isGenerating,
  gestureState
}) => {
  return (
    <div className="absolute top-0 left-0 w-full h-full pointer-events-none flex flex-col justify-between p-6 z-10">
      
      {/* Header */}
      <header className="flex justify-between items-start pointer-events-auto">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
            Gemini Morph
          </h1>
          <p className="text-sm text-gray-400 mt-1 max-w-xs">
            Powered by Gemini 2.5 Flash.
            <br />
            Move hands apart to expand. Close fists to agitate.
          </p>
        </div>
        
        {/* Status Indicator */}
        <div className="flex flex-col items-end gap-2">
          <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono border ${
            gestureState.isPresent ? 'border-green-500/50 bg-green-900/20 text-green-400' : 'border-red-500/50 bg-red-900/20 text-red-400'
          }`}>
            <div className={`w-2 h-2 rounded-full ${gestureState.isPresent ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
            {gestureState.isPresent ? 'HANDS DETECTED' : 'NO HANDS'}
          </div>
          {gestureState.isPresent && (
            <div className="text-xs text-gray-500 font-mono">
              SEP: {gestureState.separation.toFixed(2)} | TEN: {gestureState.tension.toFixed(2)}
            </div>
          )}
        </div>
      </header>

      {/* Main Controls Bottom */}
      <div className="pointer-events-auto flex flex-col md:flex-row gap-6 items-end w-full">
        
        {/* Shape Selector */}
        <div className="bg-black/60 backdrop-blur-md border border-white/10 p-4 rounded-xl flex-1 max-w-2xl w-full">
          <label className="text-xs font-bold text-gray-400 uppercase mb-3 block tracking-wider">
            Select Template (Gemini Generated)
          </label>
          <div className="flex flex-wrap gap-2">
            {SHAPES.map(shape => (
              <button
                key={shape}
                onClick={() => onSelectShape(shape)}
                disabled={isGenerating}
                className={`px-4 py-2 rounded-lg text-sm transition-all duration-300 ${
                  currentShape === shape
                    ? 'bg-white text-black font-bold shadow-[0_0_15px_rgba(255,255,255,0.3)]'
                    : 'bg-white/5 text-gray-300 hover:bg-white/10 hover:scale-105'
                } ${isGenerating ? 'opacity-50 cursor-wait' : ''}`}
              >
                {shape}
              </button>
            ))}
          </div>
          {isGenerating && (
            <div className="mt-3 text-xs text-blue-400 animate-pulse">
              Gemini is dreaming up points for {currentShape}...
            </div>
          )}
        </div>

        {/* Color Selector */}
        <div className="bg-black/60 backdrop-blur-md border border-white/10 p-4 rounded-xl">
          <label className="text-xs font-bold text-gray-400 uppercase mb-3 block tracking-wider">
            Particle Color
          </label>
          <div className="flex gap-2">
            {COLORS.map(color => (
              <button
                key={color}
                onClick={() => onSelectColor(color)}
                className={`w-8 h-8 rounded-full transition-transform duration-200 border-2 ${
                  currentColor === color ? 'border-white scale-110' : 'border-transparent hover:scale-105'
                }`}
                style={{ backgroundColor: color, boxShadow: `0 0 10px ${color}66` }}
                aria-label={`Select color ${color}`}
              />
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};
