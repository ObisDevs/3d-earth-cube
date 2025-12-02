import { useEffect, useRef, useState } from 'react';
import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';
import { HandGestureState } from '../types';

const VIDEO_WIDTH = 640;
const VIDEO_HEIGHT = 480;

export const useHandTracking = (isActive: boolean) => {
  const [gestureState, setGestureState] = useState<HandGestureState>({
    separation: 0.5,
    tension: 0,
    isPresent: false,
  });
  
  const [isInitializing, setIsInitializing] = useState(true);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const landmarkerRef = useRef<HandLandmarker | null>(null);
  const requestRef = useRef<number>(0);

  useEffect(() => {
    let running = true;

    const setupMediaPipe = async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
        );
        
        if (!running) return;

        landmarkerRef.current = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
            delegate: "GPU"
          },
          runningMode: "VIDEO",
          numHands: 2
        });

        setIsInitializing(false);
        startCamera();
      } catch (error) {
        console.error("Failed to load MediaPipe:", error);
        setIsInitializing(false);
      }
    };

    setupMediaPipe();

    return () => {
      running = false;
      cancelAnimationFrame(requestRef.current);
      if (videoRef.current && videoRef.current.srcObject) {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  const startCamera = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return;
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: VIDEO_WIDTH, height: VIDEO_HEIGHT }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.addEventListener('loadeddata', predictWebcam);
      }
    } catch (err) {
      console.error("Camera access denied:", err);
    }
  };

  const predictWebcam = () => {
    if (!landmarkerRef.current || !videoRef.current) return;

    const nowInMs = performance.now();
    const results = landmarkerRef.current.detectForVideo(videoRef.current, nowInMs);

    if (results.landmarks && results.landmarks.length > 0) {
      let separation = 0.5;
      let tension = 0;
      
      // Calculate Tension (Average Openness of hands)
      // Simple heuristic: Distance between wrist (0) and middle finger tip (12)
      // Normalized roughly against wrist-to-index-mcp (0 to 5) for scale invariance
      let totalOpenness = 0;
      
      results.landmarks.forEach(hand => {
        const wrist = hand[0];
        const tip = hand[12];
        const base = hand[5]; // Index MCP
        
        const palmSize = Math.sqrt(
          Math.pow(wrist.x - base.x, 2) + Math.pow(wrist.y - base.y, 2)
        );
        const fingerExtension = Math.sqrt(
          Math.pow(wrist.x - tip.x, 2) + Math.pow(wrist.y - tip.y, 2)
        );
        
        // Ratio > 1.8 is typically open, < 0.8 is fist
        let openness = (fingerExtension / palmSize);
        // Normalize: 0 (closed) to 1 (open)
        openness = Math.min(Math.max((openness - 0.8) / 1.0, 0), 1);
        totalOpenness += openness;
      });

      // Tension is the inverse of openness (1 = fist/tense, 0 = open/relaxed)
      tension = 1 - (totalOpenness / results.landmarks.length);

      // Calculate Separation (if 2 hands)
      if (results.landmarks.length === 2) {
        const h1 = results.landmarks[0][0]; // Wrist hand 1
        const h2 = results.landmarks[1][0]; // Wrist hand 2
        
        // Raw distance in normalized coords (0-1)
        const dist = Math.sqrt(Math.pow(h1.x - h2.x, 2) + Math.pow(h1.y - h2.y, 2));
        
        // Map reasonable interaction range (0.1 to 0.8) to (0.2 to 2.0 scale)
        separation = Math.max(0.2, Math.min(dist * 3, 3.0));
      } else {
        // Fallback if 1 hand: use x position to pan/scale or just steady
        separation = 0.8;
      }

      setGestureState({
        isPresent: true,
        separation,
        tension
      });
    } else {
      setGestureState(prev => ({ ...prev, isPresent: false }));
    }

    if (isActive) {
      requestRef.current = requestAnimationFrame(predictWebcam);
    }
  };

  return { gestureState, videoRef, isInitializing };
};
