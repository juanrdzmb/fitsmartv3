
import React, { useState, useEffect, useRef } from 'react';
import { BiomechanicalAnalysis, UserProfile, DetectedExercise } from '../types';
import { generatePDF } from '../services/pdfService';

interface AnalysisResultsProps {
  analysis: BiomechanicalAnalysis;
  profile: UserProfile;
  onReset: () => void;
}

// Componente para feedback visual al copiar
const CopyHighlight: React.FC<{ children: React.ReactNode; className?: string; label?: string }> = ({ children, className = "", label = "¡Copiado!" }) => {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = (e: React.ClipboardEvent) => {
    // No prevenimos el default para que el texto se copie al portapapeles realmente
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div 
      onCopy={handleCopy}
      className={`relative transition-all duration-500 ease-out rounded-2xl ${className} ${
        isCopied ? 'bg-md-sys-primaryContainer/20 ring-2 ring-md-sys-primary shadow-lg' : ''
      }`}
    >
      {children}
      
      {/* Badge de confirmación */}
      <div className={`
        absolute top-2 right-2 z-20 pointer-events-none
        bg-md-sys-inverseSurface text-md-sys-inverseOnSurface text-label-sm font-bold px-3 py-1.5 rounded-full shadow-md
        flex items-center gap-1.5 transition-all duration-300 transform
        ${isCopied ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-2 scale-90'}
      `}>
        <span className="material-symbols-rounded text-[14px]">content_copy</span>
        <span>{label}</span>
      </div>
    </div>
  );
};

// Sub-componente para manejar textos largos de forma elegante y nativa
const ExpandableText: React.FC<{ text: string; className?: string }> = ({ text, className = "" }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  // Umbral de caracteres para decidir si colapsar
  const shouldCollapse = text.length > 220; 

  if (!shouldCollapse) {
    return <p className={`text-md-sys-onSurfaceVariant text-body-lg leading-relaxed ${className}`}>{text}</p>;
  }

  return (
    <div className={`flex flex-col ${className}`}>
      <div 
        className="text-md-sys-onSurfaceVariant text-body-lg leading-relaxed transition-all duration-500 ease-in-out overflow-hidden"
        style={{
           // Usamos max-height fijo grande para permitir animación CSS (auto no anima)
           maxHeight: isExpanded ? '2000px' : '6em', // ~3-4 líneas visibles cuando colapsado
           opacity: 1,
           // CSS Masking: Hace que el texto se desvanezca a transparente. 
           // Funciona sobre CUALQUIER color de fondo sin dejar sombras raras.
           maskImage: isExpanded ? 'none' : 'linear-gradient(to bottom, black 50%, transparent 100%)',
           WebkitMaskImage: isExpanded ? 'none' : 'linear-gradient(to bottom, black 50%, transparent 100%)'
        }}
      >
        {text}
      </div>
      
      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        className="self-start mt-2 text-label-lg font-bold text-md-sys-primary hover:text-md-sys-onPrimaryContainer transition-colors flex items-center gap-1 py-1.5 px-2 -ml-2 rounded-lg hover:bg-md-sys-onSurface/5 focus:outline-none active:scale-95"
      >
        {isExpanded ? (
          <>Menos <span className="material-symbols-rounded text-sm">expand_less</span></>
        ) : (
          <>Leer análisis completo <span className="material-symbols-rounded text-sm">expand_more</span></>
        )}
      </button>
    </div>
  );
};

// Sub-componente para tarjeta de ejercicio expandible
const ExerciseCard: React.FC<{ ex: DetectedExercise }> = ({ ex }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div 
      onClick={() => setIsOpen(!isOpen)}
      className={`
        bg-md-sys-surfaceContainerHigh rounded-2xl p-4 flex flex-col gap-2 
        border transition-all duration-500 ease-emphasized cursor-pointer
        hover:bg-md-sys-surfaceContainerHighest hover:shadow-md
        ${isOpen ? 'border-md-sys-primary/50 bg-md-sys-surfaceContainerHighest' : 'border-md-sys-outlineVariant/50'}
      `}
    >
      <div className="flex justify-between items-start gap-3">
        <div className="flex flex-col">
           <span className="font-bold text-md-sys-onSurface text-body-lg leading-tight break-words">{ex.name}</span>
           <div className="flex items-center gap-2 text-label-md text-md-sys-onSurfaceVariant mt-1">
              <span>{ex.targetGroup}</span>
           </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-md tracking-wider shrink-0 ${ex.type === 'Compuesto' ? 'bg-md-sys-secondaryContainer text-md-sys-onSecondaryContainer' : 'bg-md-sys-surfaceContainer text-md-sys-onSurfaceVariant'}`}>
             {ex.type}
          </span>
          <span className={`transform transition-transform duration-500 ease-emphasized material-symbols-rounded text-md-sys-onSurfaceVariant ${isOpen ? 'rotate-180' : ''}`}>
             expand_more
          </span>
        </div>
      </div>
      
      {/* Variant badge always visible but styled differently */}
      {ex.variantDetected && ex.variantDetected !== 'Estándar' && (
         <div className="flex items-center gap-1.5 mt-1">
            <span className="w-1.5 h-1.5 rounded-full bg-md-sys-primary"></span>
            <span className="text-label-sm font-medium text-md-sys-primary">{ex.variantDetected}</span>
         </div>
      )}

      {/* Expanded Content: Technical Tip */}
      <div 
        className={`grid transition-all duration-500 ease-emphasized overflow-hidden ${
          isOpen ? 'grid-rows-[1fr] opacity-100 pt-3 border-t border-md-sys-outlineVariant/30 mt-1' : 'grid-rows-[0fr] opacity-0'
        }`}
      >
         <div className="min-h-0 flex gap-3">
             <span className="material-symbols-rounded text-md-sys-tertiary filled text-[20px] shrink-0 mt-0.5">tips_and_updates</span>
             <p className="text-body-md text-md-sys-onSurfaceVariant leading-relaxed italic">
                {ex.technicalTip || "Sin detalles técnicos adicionales."}
             </p>
         </div>
      </div>
    </div>
  );
};


export const AnalysisResults: React.FC<AnalysisResultsProps> = ({ analysis, profile, onReset }) => {
  const [showActions, setShowActions] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY.current) {
        setShowActions(true);
      } else if (currentScrollY < lastScrollY.current) {
        setShowActions(false);
      }
      lastScrollY.current = currentScrollY;
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.speechSynthesis.cancel();
    };
  }, []);

  const toggleSpeech = () => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const textToRead = `
      Resultados del análisis de FitSmart AI.
      Puntuación: ${analysis.score} sobre 100.
      Resumen: ${analysis.summary}
      Evaluación de seguridad: ${analysis.safetyAssessment}
    `;

    const utterance = new SpeechSynthesisUtterance(textToRead);
    utterance.lang = 'es-ES';
    utterance.rate = 1.0;
    const voices = window.speechSynthesis.getVoices();
    const esVoice = voices.find(v => v.lang.startsWith('es'));
    if (esVoice) utterance.voice = esVoice;

    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-[#b6f2b2] border-[#b6f2b2]'; 
    if (score >= 50) return 'text-[#f2e7b2] border-[#f2e7b2]'; 
    return 'text-[#f2b8b5] border-[#f2b8b5]'; 
  };

  return (
    <div className="w-full space-y-8 pb-32 animate-fade-in"> {/* Mayor espacio vertical global */}
      
      {/* Grid Layout */}
      <div className="flex flex-col md:grid md:grid-cols-3 gap-6"> {/* Gap aumentado */}
        
        {/* Diagnosis Widget */}
        <div className="md:col-span-2 bg-md-sys-surfaceContainerHigh rounded-3xl p-6 md:p-8 flex flex-col relative overflow-hidden h-auto shadow-sm">
           <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
              <span className="material-symbols-rounded text-[120px]">analytics</span>
           </div>
           
           <div className="relative z-10 w-full">
             <div className="flex items-center gap-2 mb-4">
               <span className="bg-md-sys-primaryContainer text-md-sys-onPrimaryContainer text-label-md font-bold px-3 py-1 rounded-lg uppercase tracking-wider">
                 Diagnóstico
               </span>
             </div>
             
             <CopyHighlight className="-m-2 p-2" label="Resumen copiado">
               <div className="mb-6">
                 <ExpandableText 
                    text={analysis.summary} 
                    className="font-normal text-md-sys-onSurface text-lg md:text-xl"
                 />
               </div>

               <div className="pt-6 border-t border-md-sys-outlineVariant/50">
                  <p className="text-md-sys-onSurfaceVariant text-body-md leading-relaxed">
                      {analysis.alignmentWithGoal}
                  </p>
               </div>
             </CopyHighlight>
           </div>
        </div>

        {/* Score Widget */}
        <div className="bg-md-sys-surfaceContainerLow rounded-3xl p-6 md:p-8 flex flex-col items-center justify-center border border-md-sys-outlineVariant/50 h-auto min-h-[200px]">
          <div className="flex flex-col items-center">
            <div className={`relative w-36 h-36 rounded-full flex items-center justify-center border-[8px] text-display-sm font-bold ${getScoreColor(analysis.score)} mb-6`}>
                {analysis.score}
            </div>
            <span className="text-label-lg font-medium text-md-sys-onSurfaceVariant uppercase tracking-widest">
                Puntuación
            </span>
          </div>
        </div>
      </div>

      {/* Routine Breakdown */}
      {analysis.detectedExercises && analysis.detectedExercises.length > 0 && (
        <div className="bg-md-sys-surfaceContainer rounded-3xl p-6 md:p-8 shadow-sm border border-md-sys-outlineVariant/30">
          <div className="flex items-center gap-3 mb-6">
            <span className="material-symbols-rounded text-md-sys-tertiary filled text-[24px]">fitness_center</span>
            <h3 className="text-headline-sm font-medium text-md-sys-onSurface">Rutina Detectada</h3>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {analysis.detectedExercises.map((ex, idx) => (
              <ExerciseCard key={idx} ex={ex} />
            ))}
          </div>
        </div>
      )}

      {/* Warm Up Section */}
      {analysis.warmUpRecommendations && analysis.warmUpRecommendations.length > 0 && (
        <div className="bg-md-sys-surfaceContainerHigh border border-orange-900/30 rounded-3xl p-6 md:p-8 shadow-sm relative overflow-hidden">
          {/* Subtle warm background gradient */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/5 blur-3xl rounded-full pointer-events-none -translate-y-1/2 translate-x-1/2"></div>
          
          <div className="flex items-center gap-3 mb-6 relative z-10">
            <span className="bg-orange-900/50 text-orange-200 p-2 rounded-xl">
               <span className="material-symbols-rounded filled text-[24px]">local_fire_department</span>
            </span>
            <div>
              <h3 className="text-headline-sm font-medium text-md-sys-onSurface">Calentamiento Sugerido</h3>
              <p className="text-label-md text-md-sys-onSurfaceVariant">Específico para {profile.goal}</p>
            </div>
          </div>

          <CopyHighlight className="grid grid-cols-1 md:grid-cols-3 gap-4 relative z-10" label="Calentamiento copiado">
             {analysis.warmUpRecommendations.map((warmUp, idx) => (
               <div key={idx} className="bg-md-sys-surfaceContainer p-5 rounded-2xl border border-md-sys-outlineVariant/30 flex flex-col h-full hover:bg-md-sys-surfaceContainerHigh transition-colors shadow-sm">
                  {/* Header: Title and Dosage Pill */}
                  <div className="flex flex-col gap-3 mb-4">
                     <h4 className="font-bold text-md-sys-onSurface text-title-md leading-tight">{warmUp.name}</h4>
                     
                     <div className="self-start inline-flex items-center gap-1.5 bg-md-sys-surfaceContainerHighest border border-md-sys-outlineVariant/20 px-3 py-1.5 rounded-lg">
                        <span className="material-symbols-rounded text-[16px] text-md-sys-primary">timer</span>
                        <span className="text-label-md font-medium text-md-sys-primary">{warmUp.dosage}</span>
                     </div>
                  </div>
                  
                  {/* Description with separator */}
                  <div className="pt-3 border-t border-md-sys-outlineVariant/20 mt-auto">
                    <p className="text-body-md text-md-sys-onSurfaceVariant leading-loose">{warmUp.description}</p>
                  </div>
               </div>
             ))}
          </CopyHighlight>
        </div>
      )}

      {/* Safety Card */}
      <CopyHighlight className="block" label="Seguridad copiado">
        <div className="bg-md-sys-tertiaryContainer text-md-sys-onTertiaryContainer rounded-3xl p-6 md:p-8 shadow-sm h-full">
           <div className="flex items-start gap-3 mb-4">
             <span className="material-symbols-rounded filled text-[28px] shrink-0">health_and_safety</span>
             <h3 className="font-medium text-headline-sm leading-tight">Seguridad</h3>
           </div>
           <div className="pl-0 md:pl-10">
              <ExpandableText text={analysis.safetyAssessment} className="text-md-sys-onTertiaryContainer" />
           </div>
        </div>
      </CopyHighlight>

      {/* Modifications List */}
      <div className="bg-md-sys-surfaceContainer rounded-3xl overflow-hidden shadow-sm border border-md-sys-outlineVariant/20">
        {/* Header estático para evitar solapamientos */}
        <div className="p-6 md:p-8 bg-md-sys-surfaceContainer border-b border-md-sys-outlineVariant">
          <h3 className="text-title-lg md:text-headline-sm font-normal text-md-sys-onSurface">Optimizaciones</h3>
        </div>
        
        <div className="divide-y divide-md-sys-outlineVariant">
          {analysis.modifications.map((mod, idx) => (
            <CopyHighlight key={idx} className="block hover:bg-md-sys-onSurface/5" label="Optimización copiada">
              <div className="p-6 md:p-8 flex flex-col gap-6 relative z-10">
                
                <div className="flex flex-col gap-2 w-full min-w-0">
                   <div className="flex items-center gap-2 mb-1">
                      <span className="material-symbols-rounded text-md-sys-primary text-[20px] filled">check_circle</span>
                      <span className="text-label-md text-md-sys-primary font-bold uppercase tracking-wider">Recomendado</span>
                   </div>
                   
                   <div className="min-w-0">
                     <h4 className="text-md-sys-onSurface font-medium text-headline-sm leading-snug break-words hyphens-auto pr-2">
                        {mod.recommended}
                     </h4>
                     {mod.original && mod.original !== 'N/A' && (
                        <div className="text-md-sys-error text-body-md line-through opacity-70 break-words mt-1">
                           {mod.original}
                        </div>
                     )}
                   </div>
                </div>

                <div className="text-body-lg text-md-sys-onSurfaceVariant leading-loose bg-md-sys-surfaceContainerHighest/30 p-5 rounded-2xl border border-md-sys-outlineVariant/50 break-words">
                  {mod.reason}
                </div>

                <div className="flex items-center justify-between mt-2 flex-wrap gap-3">
                   <div className="flex gap-3 flex-wrap">
                      <span className="bg-md-sys-surfaceContainerHighest text-md-sys-onSurface px-4 py-2 rounded-xl text-body-md font-mono border border-md-sys-outlineVariant whitespace-nowrap">
                        {mod.sets} Series
                      </span>
                      <span className="bg-md-sys-surfaceContainerHighest text-md-sys-onSurface px-4 py-2 rounded-xl text-body-md font-mono border border-md-sys-outlineVariant whitespace-nowrap">
                        {mod.reps} Reps
                      </span>
                   </div>

                   <a 
                    href={`https://www.youtube.com/results?search_query=${encodeURIComponent(mod.youtubeQuery)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-5 py-2 rounded-full bg-md-sys-secondaryContainer text-md-sys-onSecondaryContainer flex items-center gap-2 hover:scale-105 active:scale-95 transition-transform shadow-sm ml-auto"
                  >
                    <span className="font-medium text-label-lg">Ver tutorial</span>
                    <span className="material-symbols-rounded filled text-[18px]">play_arrow</span>
                  </a>
                </div>
              </div>
            </CopyHighlight>
          ))}
        </div>
      </div>

      {/* General Advice */}
      <div className="space-y-4">
        {analysis.generalAdvice.map((advice, idx) => (
          <CopyHighlight key={idx} className="block" label="Consejo copiado">
            <div className="bg-md-sys-surfaceContainerLow border border-md-sys-outlineVariant rounded-3xl p-5 md:p-6 flex gap-5 items-start shadow-sm h-full">
              <span className="bg-md-sys-secondary text-md-sys-surface font-bold w-8 h-8 rounded-full flex items-center justify-center text-label-md shrink-0 mt-0.5 shadow-sm">
                {idx + 1}
              </span>
              <p className="text-md-sys-onSurfaceVariant text-body-lg leading-loose break-words">{advice}</p>
            </div>
          </CopyHighlight>
        ))}
      </div>

      {/* Floating Bottom Bar */}
      <div className={`
        fixed bottom-6 left-0 right-0 flex justify-center px-4 z-50 pointer-events-none transition-transform duration-500 ease-emphasized
        ${showActions ? 'translate-y-0' : 'translate-y-[200%]'}
      `}>
        <div className="flex gap-2 pointer-events-auto bg-md-sys-surfaceContainerHighest p-2 rounded-full shadow-2xl border border-md-sys-outlineVariant/50 backdrop-blur-xl">
            <button 
                onClick={toggleSpeech}
                className={`
                   px-6 py-3 rounded-full font-medium shadow-md transition-all active:scale-95 flex items-center gap-2 ripple-surface
                   ${isSpeaking 
                     ? 'bg-md-sys-tertiaryContainer text-md-sys-onTertiaryContainer animate-pulse' 
                     : 'bg-md-sys-surfaceContainer text-md-sys-onSurface hover:bg-md-sys-surfaceContainerHigh border border-md-sys-outlineVariant'}
                `}
            >
                <span className="material-symbols-rounded">{isSpeaking ? 'stop_circle' : 'volume_up'}</span>
                <span className="hidden sm:inline">{isSpeaking ? 'Detener' : 'Leer'}</span>
            </button>

            <button 
                onClick={() => generatePDF(analysis, profile)}
                className="bg-md-sys-primary text-md-sys-onPrimary px-6 py-3 rounded-full font-medium shadow-md hover:bg-md-sys-onPrimaryContainer hover:text-md-sys-primaryContainer transition-all active:scale-95 flex items-center gap-2 ripple-surface"
            >
                <span className="material-symbols-rounded">download</span>
                <span className="hidden sm:inline">PDF</span>
            </button>
            <button 
                onClick={onReset}
                className="w-12 h-12 rounded-full bg-md-sys-surfaceContainerHigh text-md-sys-onSurface flex items-center justify-center hover:bg-md-sys-onSurface/10 transition-all active:scale-95 border border-md-sys-outlineVariant ripple-surface"
                aria-label="Reiniciar"
            >
                <span className="material-symbols-rounded">restart_alt</span>
            </button>
        </div>
      </div>

    </div>
  );
};
