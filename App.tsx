import React, { useState, useCallback } from 'react';
import CameraView from './components/CameraView';
import { AppState, FaceDetectionStatus, AnalysisResult } from './types';
import { analyzeImage } from './services/geminiService';
import { Camera, RefreshCw, Loader2, Sparkles, User, Frown } from 'lucide-react';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.LOADING_MODEL);
  const [faceStatus, setFaceStatus] = useState<FaceDetectionStatus>({ detected: false });
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [triggerCapture, setTriggerCapture] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);

  const handleCameraReady = useCallback(() => {
    setAppState(AppState.CAMERA_ACTIVE);
  }, []);

  const handleFaceStatusChange = useCallback((status: FaceDetectionStatus) => {
    setFaceStatus(status);
  }, []);

  const handleCaptureClick = () => {
    if (faceStatus.detected) {
      setTriggerCapture(true);
    }
  };

  const handleImageCaptured = useCallback(async (imageSrc: string) => {
    setTriggerCapture(false);
    setCapturedImage(imageSrc);
    setAppState(AppState.ANALYZING);

    try {
      const result = await analyzeImage(imageSrc);
      setAnalysis(result);
      setAppState(AppState.PHOTO_TAKEN);
    } catch (e) {
      console.error(e);
      setAppState(AppState.ERROR);
    }
  }, []);

  const resetApp = () => {
    setCapturedImage(null);
    setAnalysis(null);
    setAppState(AppState.CAMERA_ACTIVE);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-950 to-black text-white p-4 md:p-8 flex flex-col items-center justify-center">
      
      <header className="mb-8 text-center space-y-2">
        <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400">
          Smart Face Cam
        </h1>
        <p className="text-gray-400 text-sm md:text-base max-w-md mx-auto">
          AI-powered photography. The shutter only unlocks when you are in the frame.
        </p>
      </header>

      <main className="w-full max-w-6xl flex flex-col md:flex-row gap-8 items-start justify-center">
        
        {/* Left Side: Camera or Image Display */}
        <div className="w-full md:w-2/3 flex flex-col items-center">
          
          {appState === AppState.LOADING_MODEL && (
            <div className="w-full aspect-video bg-gray-900 rounded-2xl flex flex-col items-center justify-center border border-gray-800 animate-pulse">
               <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
               <p className="text-gray-400">Loading Vision Models...</p>
            </div>
          )}

          {(appState === AppState.CAMERA_ACTIVE || appState === AppState.LOADING_MODEL) && (
             <div className={appState === AppState.CAMERA_ACTIVE ? 'block w-full' : 'hidden'}>
               <CameraView 
                isActive={appState === AppState.CAMERA_ACTIVE}
                onCameraReady={handleCameraReady}
                onFaceStatusChange={handleFaceStatusChange}
                onCapture={handleImageCaptured}
                triggerCapture={triggerCapture}
              />
             </div>
          )}

          {(appState === AppState.PHOTO_TAKEN || appState === AppState.ANALYZING || appState === AppState.ERROR) && capturedImage && (
            <div className="relative w-full aspect-video rounded-2xl overflow-hidden border border-gray-700 shadow-2xl">
              <img src={capturedImage} alt="Captured" className="w-full h-full object-cover" />
              {appState === AppState.ANALYZING && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center">
                  <Sparkles className="w-16 h-16 text-yellow-400 animate-bounce mb-4" />
                  <p className="text-2xl font-semibold text-white">Analyzing Expression...</p>
                </div>
              )}
            </div>
          )}

          {/* Controls */}
          <div className="mt-8 flex gap-4">
             {appState === AppState.CAMERA_ACTIVE && (
               <button
                 onClick={handleCaptureClick}
                 disabled={!faceStatus.detected}
                 className={`
                   group relative flex items-center justify-center w-24 h-24 rounded-full border-4 transition-all duration-300
                   ${faceStatus.detected 
                     ? 'border-emerald-500 bg-emerald-500/20 hover:bg-emerald-500/30 cursor-pointer scale-100' 
                     : 'border-gray-700 bg-gray-800/50 cursor-not-allowed scale-95 opacity-50'}
                 `}
               >
                 <div className={`
                    w-16 h-16 rounded-full transition-all duration-300
                    ${faceStatus.detected ? 'bg-emerald-500 group-hover:scale-90 group-active:scale-75' : 'bg-gray-600'}
                 `} />
                 
                 {!faceStatus.detected && (
                   <span className="absolute -bottom-10 whitespace-nowrap text-xs text-red-400 font-medium">
                     No Face Detected
                   </span>
                 )}
               </button>
             )}

             {(appState === AppState.PHOTO_TAKEN || appState === AppState.ERROR) && (
               <button
                 onClick={resetApp}
                 className="flex items-center gap-2 px-6 py-3 bg-gray-800 hover:bg-gray-700 rounded-full font-medium transition-colors border border-gray-700"
               >
                 <RefreshCw className="w-5 h-5" />
                 Take Another
               </button>
             )}
          </div>
        </div>

        {/* Right Side: Analysis Results */}
        {(appState === AppState.PHOTO_TAKEN || appState === AppState.ANALYZING) && (
          <div className="w-full md:w-1/3 animate-fade-in-up">
            <div className="bg-gray-900/50 backdrop-blur-md rounded-2xl border border-gray-800 p-6 shadow-xl">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-blue-400">
                <Sparkles className="w-5 h-5" />
                AI Analysis
              </h3>

              {analysis ? (
                <div className="space-y-6">
                  <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700">
                    <p className="text-xs text-gray-400 uppercase tracking-wider mb-2 font-bold">Expression</p>
                    <p className="text-lg text-white font-medium">{analysis.expression}</p>
                  </div>

                  <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700">
                    <p className="text-xs text-gray-400 uppercase tracking-wider mb-2 font-bold">Sentiment</p>
                    <div className="flex items-center gap-2">
                       <span className={`px-3 py-1 rounded-full text-sm font-bold 
                         ${analysis.sentiment.toLowerCase().includes('happy') ? 'bg-green-500/20 text-green-400' : 
                           analysis.sentiment.toLowerCase().includes('sad') ? 'bg-blue-500/20 text-blue-400' :
                           'bg-purple-500/20 text-purple-400'
                         }`}>
                         {analysis.sentiment}
                       </span>
                    </div>
                  </div>

                  <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700">
                    <p className="text-xs text-gray-400 uppercase tracking-wider mb-2 font-bold">Visual Description</p>
                    <p className="text-gray-300 leading-relaxed text-sm">{analysis.description}</p>
                  </div>
                </div>
              ) : (
                 <div className="h-64 flex flex-col items-center justify-center text-gray-500 gap-4">
                    <Loader2 className="w-8 h-8 animate-spin" />
                    <p>Generating insights...</p>
                 </div>
              )}
            </div>
            
            <div className="mt-4 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-sm text-blue-300">
              <p className="flex items-start gap-2">
                <User className="w-4 h-4 mt-0.5 flex-shrink-0" />
                Gemini 2.5 Flash is analyzing your photo for demographic and emotional cues.
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
