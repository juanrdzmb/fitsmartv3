import React, { useState } from 'react';
import { StepIndicator } from './components/StepIndicator';
import { UploadSection } from './components/UploadSection';
import { PersonaSelector } from './components/PersonaSelector';
import { Questionnaire } from './components/Questionnaire';
import { AnalysisResults } from './components/AnalysisResults';
import { VideoAnalyzer } from './components/VideoAnalyzer';
import { RoutineInput, UserProfile, BiomechanicalAnalysis, PreAnalysisResult, PersonaId, VideoAnalysisResult } from './types';
import { analyzeRoutineWithGemini, preAnalyzeRoutine, analyzeVideoWithGemini } from './services/geminiService';

const App: React.FC = () => {
  const [step, setStep] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Controlar qué pestaña se abre por defecto en el UploadSection ('app', 'video', etc.)
  const [initialUploadTab, setInitialUploadTab] = useState<'app' | 'upload' | 'video' | 'text' | 'url'>('app');

  const [routineData, setRoutineData] = useState<RoutineInput | null>(null);
  const [selectedPersona, setSelectedPersona] = useState<PersonaId | null>(null);
  const [preAnalysis, setPreAnalysis] = useState<PreAnalysisResult | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [analysis, setAnalysis] = useState<BiomechanicalAnalysis | null>(null);
  
  // State for Video Flow
  const [videoResult, setVideoResult] = useState<VideoAnalysisResult | null>(null);

  // Paso 1: Subida terminada 
  const handleRoutineUpload = async (input: RoutineInput) => {
    setRoutineData(input);
    setError(null);

    // SPECIAL FLOW FOR VIDEO
    if (input.type === 'video') {
       setStep(10); // Special Step ID for Video Analysis
       setLoading(true);
       try {
         // Create a blob URL for preview
         const byteCharacters = atob(input.content);
         const byteNumbers = new Array(byteCharacters.length);
         for (let i = 0; i < byteCharacters.length; i++) {
             byteNumbers[i] = byteCharacters.charCodeAt(i);
         }
         const byteArray = new Uint8Array(byteNumbers);
         const blob = new Blob([byteArray], {type: input.mimeType});
         const url = URL.createObjectURL(blob);
         
         // Start Analysis
         const result = await analyzeVideoWithGemini(input.content, input.mimeType || 'video/mp4');
         setVideoResult(result);
         
         // Store the blob URL in content for the player to use locally
         setRoutineData({ ...input, content: url }); 

       } catch (err) {
         console.error(err);
         setError("No se pudo analizar el video. Intenta con un clip más corto.");
         setStep(1);
         setInitialUploadTab('video'); // Volver a la pestaña de video si falla
       } finally {
         setLoading(false);
       }
       return;
    }

    // NORMAL FLOW
    setStep(2); // New step: Persona Selection
  };

  // Paso 2: Personaje seleccionado -> Ejecutar Pre-análisis con esa personalidad
  const handlePersonaSelect = async (personaId: PersonaId) => {
    if (!routineData) return;
    
    setSelectedPersona(personaId);
    setLoading(true);
    setError(null);
    
    try {
      const result = await preAnalyzeRoutine(routineData, personaId);
      setPreAnalysis(result);
      setStep(3); // Go to Questionnaire
    } catch (err) {
      console.error(err);
      setError("Error analizando la rutina. Inténtalo de nuevo.");
      setStep(1); // Reset to start if fail
    } finally {
      setLoading(false);
    }
  };

  // Paso 3: Cuestionario completado -> Análisis final
  const handleProfileComplete = async (profileData: UserProfile) => {
    if (!selectedPersona) return;
    
    // Inject persona into profile
    const fullProfile = { ...profileData, persona: selectedPersona };
    setUserProfile(fullProfile);
    
    setLoading(true);
    setError(null);
    try {
      if (routineData) {
        const result = await analyzeRoutineWithGemini(fullProfile, routineData, preAnalysis || undefined);
        setAnalysis(result);
        setStep(4);
      }
    } catch (err: any) {
      console.error(err);
      setError("Error en el análisis profundo. Verifica tu conexión.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setStep(1);
    setInitialUploadTab('app'); // Reset genérico vuelve a apps
    setRoutineData(null);
    setSelectedPersona(null);
    setPreAnalysis(null);
    setUserProfile(null);
    setAnalysis(null);
    setVideoResult(null);
    setError(null);
  };

  // Reset específico para cuando se termina de analizar un video
  const handleVideoReset = () => {
    setStep(1);
    setInitialUploadTab('video'); // Forzar pestaña de video
    setRoutineData(null);
    setVideoResult(null);
    setError(null);
    // No reseteamos persona/perfil completamente si quisiéramos mantener sesión, 
    // pero para video standalone es mejor limpiar.
  };

  // Steps map: 1=Upload, 2=Persona, 3=Questionnaire, 4=Results
  const getCurrentStepLabel = () => {
    if (step === 1) return 'Subir Rutina';
    if (step === 2) return 'Elegir Auditor';
    if (step === 3) return 'Diagnóstico';
    if (step === 10) return 'Video Análisis';
    return 'Resultados';
  };

  return (
    <div className="min-h-screen flex flex-col font-sans bg-md-sys-bg text-md-sys-onSurface">
      
      {/* Top App Bar */}
      <header className="sticky top-0 z-40 bg-md-sys-bg/95 backdrop-blur-sm border-b border-transparent transition-colors duration-300">
        <div className="w-full max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
             {step > 1 ? (
                <button onClick={handleReset} className="w-10 h-10 rounded-full hover:bg-md-sys-onSurface/10 flex items-center justify-center text-md-sys-onSurface transition-colors">
                  <span className="material-symbols-rounded">arrow_back</span>
                </button>
             ) : (
                <span className="material-symbols-rounded text-md-sys-primary filled text-3xl">ecg_heart</span>
             )}
             <span className="text-title-lg font-normal text-md-sys-onSurface">
              FitSmart
             </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow w-full max-w-4xl mx-auto px-4 py-6 flex flex-col relative">
        
        {/* Headline (Only Step 1) */}
        {step === 1 && !loading && (
          <div className="mb-8 text-center animate-enter mt-4">
            <h1 className="text-display-sm md:text-display-md font-normal text-md-sys-onSurface mb-4 leading-tight">
              Auditoría <br/> Biomecánica
            </h1>
            <p className="text-body-lg text-md-sys-onSurfaceVariant max-w-md mx-auto leading-relaxed">
              Sube tu rutina o video. Detectamos riesgos y optimizamos tu progreso con IA.
            </p>
          </div>
        )}

        {error && (
          <div className="bg-md-sys-errorContainer text-md-sys-onErrorContainer p-4 rounded-xl flex items-center gap-3 mb-6 animate-enter">
            <span className="material-symbols-rounded">error</span>
            <span className="text-body-md font-medium">{error}</span>
          </div>
        )}

        {/* Not Loading or Partial Loading (Persona Selection) */}
        {(!loading || step === 2 || step === 10) && (
          <>
            {step < 4 && step !== 10 && (
               <div className="w-full max-w-md mx-auto mb-8 px-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-md-sys-primary">
                      Paso {step} de 4
                    </span>
                    <span className="text-xs font-medium text-md-sys-onSurfaceVariant">
                      {getCurrentStepLabel()}
                    </span>
                  </div>
                  <div className="h-1 w-full bg-md-sys-surfaceContainerHighest rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-md-sys-primary transition-all duration-700 ease-emphasized rounded-full"
                      style={{ width: `${(step / 4) * 100}%` }}
                    ></div>
                  </div>
                </div>
            )}
            
            <div className="transition-all duration-500 ease-emphasized w-full">
              {step === 1 && (
                <UploadSection 
                  onComplete={handleRoutineUpload} 
                  isLoading={loading} 
                  initialTab={initialUploadTab} // Pasamos la pestaña inicial
                />
              )}
              
              {step === 2 && (
                <PersonaSelector 
                  onSelect={handlePersonaSelect} 
                  isLoading={loading}
                  selectedId={selectedPersona}
                />
              )}

              {step === 3 && preAnalysis && selectedPersona && (
                <Questionnaire 
                  onComplete={handleProfileComplete} 
                  preAnalysis={preAnalysis} 
                  personaId={selectedPersona}
                />
              )}

              {step === 4 && analysis && userProfile && (
                <AnalysisResults 
                  analysis={analysis} 
                  profile={userProfile}
                  onReset={handleReset}
                />
              )}

              {step === 10 && routineData && (
                <VideoAnalyzer 
                   videoSrc={routineData.content} 
                   isAnalyzing={loading} 
                   result={videoResult}
                   onReset={handleVideoReset} // Usamos el reset específico
                />
              )}
            </div>
          </>
        )}

        {/* Global Loading State Overlay */}
        {loading && step !== 2 && step !== 10 && (
            <div className="fixed inset-0 flex flex-col items-center justify-center bg-md-sys-bg/90 backdrop-blur-md z-50 animate-enter">
                <div className="relative mb-6">
                   <svg className="md3-circular-progress text-md-sys-primary" viewBox="0 0 48 48">
                      <circle cx="24" cy="24" r="20" fill="none" strokeWidth="4"></circle>
                   </svg>
                </div>
                <h3 className="text-headline-sm font-normal text-md-sys-onSurface mb-1">
                   {selectedPersona === 'sara' ? 'Sara está juzgando...' : 
                    selectedPersona === 'todor' ? 'Calculando vectores...' : 
                    selectedPersona === 'raul' ? '¡MOTIVANDO A LA IA!' : 'Procesando...'}
                </h3>
                <p className="text-body-md text-md-sys-onSurfaceVariant">
                    {step === 2 ? "Analizando tu rutina..." : "Preparando el veredicto final..."}
                </p>
            </div>
        )}

      </main>
    </div>
  );
};

export default App;