import React, { useEffect, useRef, useState, useCallback } from 'react';
import { FaceDetector, FilesetResolver, Detection } from '@mediapipe/tasks-vision';
import { FaceDetectionStatus } from '../types';

interface CameraViewProps {
  onFaceStatusChange: (status: FaceDetectionStatus) => void;
  onCameraReady: () => void;
  isActive: boolean;
  onCapture: (imageSrc: string) => void;
  triggerCapture: boolean;
}

const CameraView: React.FC<CameraViewProps> = ({ 
  onFaceStatusChange, 
  onCameraReady, 
  isActive, 
  onCapture,
  triggerCapture 
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [detector, setDetector] = useState<FaceDetector | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const requestRef = useRef<number | null>(null);

  // Initialize MediaPipe Face Detector
  useEffect(() => {
    const initDetector = async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
        );
        const faceDetector = await FaceDetector.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite`,
            delegate: "GPU"
          },
          runningMode: "VIDEO"
        });
        setDetector(faceDetector);
        onCameraReady();
      } catch (error) {
        console.error("Error initializing FaceDetector:", error);
      }
    };

    initDetector();
  }, [onCameraReady]);

  // Start Camera
  useEffect(() => {
    if (!detector || !isActive) return;

    const startCamera = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            width: 1280, 
            height: 720,
            facingMode: 'user'
          }, 
          audio: false 
        });
        
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          setStream(mediaStream);
        }
      } catch (err) {
        console.error("Error accessing camera:", err);
      }
    };

    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detector, isActive]);

  // Detection Loop
  const detect = useCallback(async () => {
    if (!detector || !videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (video.readyState !== 4) {
      requestRef.current = requestAnimationFrame(detect);
      return;
    }

    // Match canvas size to video
    if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
    }

    const startTimeMs = performance.now();
    const results = detector.detectForVideo(video, startTimeMs);

    // Clear canvas
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      if (results.detections.length > 0) {
        // Face Detected
        const detection: Detection = results.detections[0];
        const { boundingBox } = detection;
        
        // Notify parent
        onFaceStatusChange({
          detected: true,
          box: {
            x: boundingBox.originX,
            y: boundingBox.originY,
            width: boundingBox.width,
            height: boundingBox.height
          }
        });

        // Draw Bounding Box
        ctx.strokeStyle = '#4ade80'; // Green-400
        ctx.lineWidth = 4;
        ctx.beginPath();
        // Flip the drawing coordinates because we'll flip the video with CSS
        // Note: Calculations are simpler if we just draw and use CSS transform scaleX(-1) on wrapper
        ctx.rect(boundingBox.originX, boundingBox.originY, boundingBox.width, boundingBox.height);
        ctx.stroke();

        // Add a "Focus" effect corners
        const len = 20;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        
        // Top Left
        ctx.beginPath();
        ctx.moveTo(boundingBox.originX, boundingBox.originY + len);
        ctx.lineTo(boundingBox.originX, boundingBox.originY);
        ctx.lineTo(boundingBox.originX + len, boundingBox.originY);
        ctx.stroke();

      } else {
        // No Face
        onFaceStatusChange({ detected: false });
        
        // Draw a "searching" reticle or overlay text
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.font = '30px sans-serif';
        ctx.fillStyle = 'white';
        ctx.textAlign = 'center';
        ctx.fillText("Looking for face...", canvas.width / 2, canvas.height / 2);
      }
    }

    requestRef.current = requestAnimationFrame(detect);
  }, [detector, onFaceStatusChange]);

  useEffect(() => {
    if (isActive && detector) {
      requestRef.current = requestAnimationFrame(detect);
    }
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isActive, detector, detect]);

  // Handle Capture
  useEffect(() => {
    if (triggerCapture && videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Draw image (flipped horizontally to match user mirror expectation)
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(videoRef.current, 0, 0);
        const imageSrc = canvas.toDataURL('image/jpeg');
        onCapture(imageSrc);
      }
    }
  }, [triggerCapture, onCapture]);

  return (
    <div className="relative w-full max-w-4xl aspect-video rounded-2xl overflow-hidden bg-black shadow-2xl border border-gray-800">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="absolute top-0 left-0 w-full h-full object-cover transform -scale-x-100"
      />
      <canvas
        ref={canvasRef}
        className="absolute top-0 left-0 w-full h-full object-cover transform -scale-x-100"
      />
      
      {!isActive && detector && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 z-10">
           <p className="text-white text-lg animate-pulse">Initializing Camera...</p>
        </div>
      )}
    </div>
  );
};

export default CameraView;