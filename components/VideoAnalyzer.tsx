
import React, { useEffect, useState, useRef } from 'react';
import { VideoAnalysisResult, SetupItem } from '../types';
import { PoseLandmarker, FilesetResolver, DrawingUtils } from '@mediapipe/tasks-vision';

interface VideoAnalyzerProps {
  videoSrc: string; // Blob URL
  isAnalyzing: boolean;
  result: VideoAnalysisResult | null;
  onReset: () => void;
}

export const VideoAnalyzer: React.FC<VideoAnalyzerProps> = ({ videoSrc, isAnalyzing, result, onReset }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [detectionStatus, setDetectionStatus] = useState("Cargando visión artificial...");
  const [selectedSetupItem, setSelectedSetupItem] = useState<SetupItem | null>(null);
  
  const poseLandmarkerRef = useRef<PoseLandmarker | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Initialize MediaPipe Pose Landmarker
  useEffect(() => {
    const initPose = async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm"
        );
        const poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: `https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task`,
            delegate: "CPU" // Switched to CPU to avoid WebGL context errors (kGpuService error)
          },
          runningMode: "VIDEO",
          numPoses: 1
        });
        poseLandmarkerRef.current = poseLandmarker;
        console.log("MediaPipe Pose Landmarker listo (CPU mode).");
      } catch (e) {
        console.error("Error al cargar MediaPipe:", e);
        setDetectionStatus("Error en visión. Analizando con Gemini...");
      }
    };

    if (isAnalyzing) initPose();

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [isAnalyzing]);

  // Main Detection Loop
  useEffect(() => {
    if (!isAnalyzing || !videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const drawingUtils = new DrawingUtils(ctx);
    let lastVideoTime = -1;

    const renderLoop = () => {
      if (!video) return;

      if (video.currentTime !== lastVideoTime && poseLandmarkerRef.current) {
        lastVideoTime = video.currentTime;

        // Ensure canvas matches the DISPLAY size of the video for perfect overlay
        const displayWidth = video.clientWidth;
        const displayHeight = video.clientHeight;

        if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
          canvas.width = displayWidth;
          canvas.height = displayHeight;
        }

        const startTimeMs = performance.now();
        const results = poseLandmarkerRef.current.detectForVideo(video, startTimeMs);

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        if (results.landmarks && results.landmarks.length > 0) {
          for (const landmark of results.landmarks) {
            // Neon-like skeleton effect
            drawingUtils.drawConnectors(landmark, PoseLandmarker.POSE_CONNECTIONS, {
              color: "#A8C7FA", // MD3 Primary
              lineWidth: 3
            });
            drawingUtils.drawLandmarks(landmark, {
              color: "#D6E3FF", // MD3 OnPrimaryContainer
              lineWidth: 1,
              radius: 3
            });
          }
        }
      }
      
      if (isAnalyzing) {
        animationFrameRef.current = requestAnimationFrame(renderLoop);
      }
    };

    // Wait for video to be ready before starting loop
    if (video.readyState >= 2) {
      renderLoop();
    } else {
      const startOnReady = () => renderLoop();
      video.addEventListener('loadeddata', startOnReady);
      return () => video.removeEventListener('loadeddata', startOnReady);
    }

    // Status Messages based on time
    const statusTimeout1 = setTimeout(() => setDetectionStatus("Mapeando esqueleto biomecánico..."), 2500);
    const statusTimeout2 = setTimeout(() => setDetectionStatus("Extrayendo vectores de fuerza..."), 5500);

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      clearTimeout(statusTimeout1);
      clearTimeout(statusTimeout2);
    };
  }, [isAnalyzing, videoSrc]);

  useEffect(() => {
     if (videoRef.current) {
         videoRef.current.play().catch(e => console.log("Autoplay prevented", e));
     }
  }, [videoSrc, isAnalyzing]);

  // Auto-select attention item
  useEffect(() => {
    if (result && result.setupDetails) {
        const firstAttention = result.setupDetails.find(item => item.status === 'ATTENTION');
        if (firstAttention) setSelectedSetupItem(firstAttention);
    }
  }, [result]);

  const isCorrection = result?.feedback.type === 'correction';
  const feedbackColor = isCorrection ? 'bg-rose-900/10 text-rose-800 border-rose-200 dark:bg-rose-900/20 dark:text-rose-200 dark:border-rose-800' : 'bg-md-sys-tertiaryContainer text-md-sys-onTertiaryContainer border-md-sys-tertiary';
  const feedbackIcon = isCorrection ? 'engineering' : 'lightbulb';
  const feedbackTitle = isCorrection ? 'Corrección Técnica' : 'Optimización Técnica';

  return (
    <div className="w-full animate-fade-in flex flex-col items-center pb-24 px-4 md:px-0">
      
      {/* Video Container Frame */}
      <div className="relative w-full max-w-lg aspect-[9/16] md:aspect-[4/3] bg-black rounded-[32px] overflow-hidden shadow-2xl border-4 border-md-sys-surfaceContainerLow group">
        
        <video 
           ref={videoRef}
           src={videoSrc}
           loop 
           playsInline
           muted
           className={`w-full h-full object-cover transition-all duration-700 ${isAnalyzing ? 'scale-105 opacity-50' : 'scale-100 opacity-90'}`}
        />

        {/* --- MEDIAPIPE CANVAS OVERLAY (Moved to top of processing layer) --- */}
        <canvas 
          ref={canvasRef}
          className={`absolute inset-0 w-full h-full pointer-events-none z-30 transition-opacity duration-500 ${isAnalyzing ? 'opacity-100' : 'opacity-0'}`}
        />

        {/* --- PROCESSING OVERLAY --- */}
        {isAnalyzing && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-md-sys-bg/10 backdrop-blur-[1px] pointer-events-none">
               {/* Status Pill */}
               <div className="absolute bottom-8 px-6 py-3 bg-md-sys-surfaceContainerHigh/90 backdrop-blur-md rounded-full border border-md-sys-primary/30 flex items-center gap-3 shadow-lg max-w-[90%] z-40">
                  <div className="flex gap-1 shrink-0">
                     <span className="w-1.5 h-1.5 bg-md-sys-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                     <span className="w-1.5 h-1.5 bg-md-sys-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                     <span className="w-1.5 h-1.5 bg-md-sys-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                  </div>
                  <span className="text-label-md font-medium text-md-sys-onSurface font-mono tracking-wide truncate">
                     {detectionStatus}
                  </span>
               </div>
            </div>
        )}

        {/* --- RESULT OVERLAY --- */}
        {!isAnalyzing && result && (
           <div className="absolute inset-0 z-40 flex flex-col justify-between p-4 sm:p-6 backdrop-blur-[1px] bg-black/40 transition-all duration-700 ease-out">
              
              {/* Top Bar: Confidence & Angle */}
              <div className="flex justify-between items-start animate-enter pointer-events-auto">
                 <div className="bg-md-sys-surfaceContainerHigh/90 backdrop-blur-md text-md-sys-onSurface border border-md-sys-outlineVariant/50 text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm max-w-[60%] truncate">
                    <span className="material-symbols-rounded text-[14px] text-md-sys-primary shrink-0">videocam</span>
                    <span className="truncate">{result.cameraAngle || 'Ángulo N/A'}</span>
                 </div>
                 
                 <div className="bg-md-sys-primaryContainer/90 backdrop-blur-md text-md-sys-onPrimaryContainer border border-md-sys-primary/20 text-xs font-bold px-3 py-1.5 rounded-full shadow-sm shrink-0">
                    {result.confidence}% Certeza
                 </div>
              </div>

              {/* Bottom: Main Info */}
              <div className="animate-enter pointer-events-auto w-full" style={{ animationDelay: '100ms' }}>
                  <div className="mb-3">
                     <span className="inline-block bg-md-sys-tertiaryContainer text-md-sys-onTertiaryContainer px-2 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider mb-1 shadow-sm border border-white/10">
                        {result.variant || 'Variante Estándar'}
                     </span>
                     <h2 className="text-display-sm sm:text-display-md font-bold text-white leading-none drop-shadow-md tracking-tight break-words">
                       {result.exerciseName}
                     </h2>
                  </div>
                  
                  {/* Setup Checklist */}
                  {result.setupDetails && result.setupDetails.length > 0 && (
                    <div className="w-full mb-4">
                        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 snap-x">
                           {result.setupDetails.map((detail, idx) => {
                              const isAttention = detail.status === 'ATTENTION';
                              return (
                                <button
                                  key={idx}
                                  onClick={() => isAttention && setSelectedSetupItem(detail)}
                                  className={`
                                    snap-start flex-shrink-0 backdrop-blur-md border rounded-lg px-3 py-1.5 text-xs whitespace-nowrap shadow-sm flex items-center gap-2 transition-all
                                    ${isAttention 
                                      ? 'bg-amber-500/20 border-amber-400/50 text-amber-50 hover:bg-amber-500/30' 
                                      : 'bg-emerald-500/20 border-emerald-400/30 text-emerald-50'
                                    }
                                  `}
                                >
                                   <span className="font-bold uppercase text-[10px] tracking-wider opacity-90">{detail.label}:</span>
                                   <span className="font-bold">{detail.value}</span>
                                   <span className={`material-symbols-rounded text-[14px] filled ${isAttention ? 'text-amber-300' : 'text-emerald-300'}`}>
                                      {isAttention ? 'warning' : 'check_circle'}
                                   </span>
                                </button>
                              );
                           })}
                           <div className="w-2 shrink-0"></div>
                        </div>
                    </div>
                  )}

                  {/* Key Metrics Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <div className={`backdrop-blur-xl rounded-xl p-3 border border-white/20 min-w-0 ${result.repCount === 0 ? 'bg-rose-950/60 border-rose-500/50' : 'bg-black/50'}`}>
                          <span className="text-white/80 text-[10px] uppercase font-bold tracking-wider block mb-1 truncate">Reps</span>
                          <span className={`text-2xl font-bold font-mono ${result.repCount === 0 ? 'text-rose-200' : 'text-white'}`}>
                            {result.repCount}
                          </span>
                      </div>
                      
                      {result.metrics.depth && (
                        <div className="bg-black/50 backdrop-blur-xl rounded-xl p-3 border border-white/20 min-w-0">
                           <span className="text-white/80 text-[10px] uppercase font-bold tracking-wider block mb-1 truncate">
                             {result.exerciseName.includes("Press") ? "Bloqueo" : "Profundidad"}
                           </span>
                           <span className={`text-sm font-bold font-mono leading-tight break-words text-white`}>
                             {result.exerciseName.includes("Press") ? (result.metrics.lockout || "N/A") : result.metrics.depth}
                           </span>
                        </div>
                      )}

                      {result.metrics.barPath && (
                        <div className="bg-black/50 backdrop-blur-xl rounded-xl p-3 border border-white/20 min-w-0 hidden sm:block">
                           <span className="text-white/80 text-[10px] uppercase font-bold tracking-wider block mb-1 truncate">Trayectoria</span>
                           <span className="text-sm font-bold font-mono leading-tight break-words text-emerald-300">
                             {result.metrics.barPath}
                           </span>
                        </div>
                      )}
                      
                       {result.metrics.stability && (
                        <div className="bg-black/50 backdrop-blur-xl rounded-xl p-3 border border-white/20 min-w-0 hidden sm:block">
                           <span className="text-white/80 text-[10px] uppercase font-bold tracking-wider block mb-1 truncate">Estabilidad</span>
                           <span className="text-sm font-bold font-mono leading-tight break-words text-emerald-300">
                             {result.metrics.stability}
                           </span>
                        </div>
                      )}
                  </div>
              </div>
           </div>
        )}
      </div>

      {/* Detailed Analysis Cards */}
      {!isAnalyzing && result && (
        <div className="w-full max-w-lg mt-6 space-y-4 animate-enter px-1" style={{ animationDelay: '200ms' }}>
           
           {/* Gear Recommendation Card */}
           {selectedSetupItem && selectedSetupItem.status === 'ATTENTION' && (
              <div className="bg-md-sys-surfaceContainerHigh border border-amber-500/30 rounded-2xl p-4 shadow-lg animate-enter mb-4 relative overflow-hidden">
                  <button 
                    onClick={() => setSelectedSetupItem(null)}
                    className="absolute top-2 right-2 text-md-sys-onSurfaceVariant/50 hover:text-md-sys-onSurface"
                  >
                     <span className="material-symbols-rounded">close</span>
                  </button>
                  <div className="flex gap-3">
                     <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                        <span className="material-symbols-rounded text-2xl">shopping_bag</span>
                     </div>
                     <div>
                        <h4 className="text-label-lg font-bold text-md-sys-onSurface mb-1">
                           Mejora tu {selectedSetupItem.label}
                        </h4>
                        <p className="text-body-md text-md-sys-onSurfaceVariant mb-3">
                           {selectedSetupItem.recommendation}
                        </p>
                        {selectedSetupItem.shoppingQuery && (
                           <a 
                              href={`https://www.amazon.es/s?k=${encodeURIComponent(selectedSetupItem.shoppingQuery)}`}
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 text-xs font-bold bg-amber-700 text-white px-3 py-1.5 rounded-full hover:bg-amber-800 transition-colors"
                           >
                              Ver en Amazon
                              <span className="material-symbols-rounded text-[14px]">open_in_new</span>
                           </a>
                        )}
                     </div>
                  </div>
              </div>
           )}

           <div className={`rounded-2xl p-6 border-l-4 shadow-sm ${feedbackColor}`}>
              <div className="flex items-center gap-2 mb-3">
                 <span className="p-1.5 rounded-lg bg-black/5">
                    <span className="material-symbols-rounded filled text-[20px]">{feedbackIcon}</span>
                 </span>
                 <h3 className="font-bold text-title-md">{feedbackTitle}</h3>
              </div>
              <p className="text-body-lg leading-relaxed mb-4">
                 {result.feedback.text}
              </p>
              
              {result.feedback.youtubeQuery && (
                  <a 
                    href={`https://www.youtube.com/results?search_query=${encodeURIComponent(result.feedback.youtubeQuery)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-full font-medium text-label-lg transition-colors border ${isCorrection ? 'bg-rose-100 hover:bg-rose-200 text-rose-900 border-rose-200' : 'bg-white/40 hover:bg-white/60 text-md-sys-onTertiaryContainer border-black/5'}`}
                  >
                    <span className="material-symbols-rounded">play_circle</span>
                    {isCorrection ? 'Ver cómo corregir' : 'Ver técnica avanzada'}
                  </a>
              )}
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {result.feedback.positive.length > 0 && (
                 <div className="bg-md-sys-surfaceContainer rounded-2xl p-5 border border-md-sys-outlineVariant/20 shadow-sm">
                    <h4 className="text-label-md font-bold text-emerald-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                       <span className="material-symbols-rounded text-lg">check_circle</span> Aciertos
                    </h4>
                    <ul className="space-y-3">
                       {result.feedback.positive.map((item, idx) => (
                           <li key={idx} className="text-body-md text-md-sys-onSurfaceVariant flex items-start gap-2.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/50 mt-2 shrink-0"></span>
                              <span className="leading-snug">{item}</span>
                           </li>
                       ))}
                    </ul>
                 </div>
              )}

              {result.feedback.negative.length > 0 && (
                 <div className="bg-md-sys-surfaceContainer rounded-2xl p-5 border border-md-sys-outlineVariant/20 shadow-sm">
                    <h4 className="text-label-md font-bold text-rose-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                       <span className="material-symbols-rounded text-lg">warning</span> A Mejorar
                    </h4>
                    <ul className="space-y-3">
                       {result.feedback.negative.map((item, idx) => (
                           <li key={idx} className="text-body-md text-md-sys-onSurfaceVariant flex items-start gap-2.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500/50 mt-2 shrink-0"></span>
                              <span className="leading-snug">{item}</span>
                           </li>
                       ))}
                    </ul>
                 </div>
              )}
           </div>
           
           <button 
             onClick={onReset}
             className="w-full h-14 rounded-full bg-md-sys-primary text-md-sys-onPrimary font-medium text-label-lg hover:shadow-lg hover:scale-[1.01] transition-all active:scale-95 shadow-md flex items-center justify-center gap-2 ripple-surface"
           >
             <span className="material-symbols-rounded">videocam</span>
             Analizar otro video
           </button>
        </div>
      )}

    </div>
  );
};
