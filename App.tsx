import React, { useEffect, useState, useCallback } from 'react';
import { generateShapePoints } from './services/geminiService';
import { useHandTracking } from './hooks/useHandTracking';
import { Experience } from './components/ParticleExperience';
import { Controls } from './components/Controls';
import { PresetShape } from './types';

const App: React.FC = () => {
  const [currentShape, setCurrentShape] = useState<string>(PresetShape.Sphere);
  const [targetPoints, setTargetPoints] = useState<number[]>([]);
  const [color, setColor] = useState<string>('#00ffff');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  
  // Hand tracking logic
  const { gestureState, videoRef, isInitializing } = useHandTracking(true);

  // Load initial shape
  useEffect(() => {
    loadShape(PresetShape.Sphere);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadShape = useCallback(async (shapeName: string) => {
    setIsGenerating(true);
    setCurrentShape(shapeName);
    try {
      const points = await generateShapePoints(shapeName);
      setTargetPoints(points);
    } catch (error) {
      console.error("Failed to generate shape:", error);
    } finally {
      setIsGenerating(false);
    }
  }, []);

  return (
    <div className="relative w-full h-screen bg-[#050505] overflow-hidden font-sans">
      
      {/* 3D Scene */}
      <Experience 
        targetPoints={targetPoints} 
        color={color}
        gestureState={gestureState}
      />

      {/* UI Overlay */}
      <Controls 
        currentShape={currentShape} 
        onSelectShape={loadShape} 
        currentColor={color} 
        onSelectColor={setColor}
        isGenerating={isGenerating}
        gestureState={gestureState}
      />

      {/* Webcam Preview (Hidden or Small for debugging) */}
      <div className="absolute bottom-6 right-6 w-32 h-24 rounded-lg overflow-hidden border border-white/20 shadow-lg z-20 bg-black">
        <video 
          ref={videoRef} 
          autoPlay 
          playsInline 
          muted 
          className={`w-full h-full object-cover transform scale-x-[-1] ${isInitializing ? 'opacity-0' : 'opacity-100'}`}
        />
        {isInitializing && (
          <div className="absolute inset-0 flex items-center justify-center text-[10px] text-gray-500 text-center p-1">
            Loading Vision...
          </div>
        )}
      </div>

      {/* Loading Overlay */}
      {isGenerating && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/20 pointer-events-none">
           {/* Visual feedback handled in Controls, this is just a subtle backing if needed */}
        </div>
      )}
    </div>
  );
};

export default App;
