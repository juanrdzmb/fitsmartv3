
import React, { useState, useEffect } from 'react';
import { UserProfile, UserGoal, TrainingType, ExperienceLevel, PreAnalysisResult, PersonaId } from '../types';

interface QuestionnaireProps {
  onComplete: (profile: UserProfile) => void;
  preAnalysis: PreAnalysisResult;
  personaId: PersonaId;
}

// Custom Badge for AI Detected Values
const DetectedBadge = ({ label, personaId }: { label: string, personaId: PersonaId }) => {
  const colorClass = personaId === 'sara' 
    ? 'bg-rose-100 text-rose-800 border-rose-200' 
    : personaId === 'todor' 
      ? 'bg-indigo-100 text-indigo-800 border-indigo-200' 
      : 'bg-amber-100 text-amber-800 border-amber-200';
  
  const icon = personaId === 'sara' ? 'auto_awesome' : personaId === 'todor' ? 'biotech' : 'bolt';
  const name = personaId === 'sara' ? 'Sara' : personaId === 'todor' ? 'Dr. Todor' : 'Raúl';

  return (
    <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${colorClass} mb-1 max-w-full`}>
      <span className="material-symbols-rounded text-[12px] filled shrink-0">{icon}</span>
      <span className="truncate">{name} detectó: {label}</span>
    </div>
  );
};

// MD3 Filled Input Container - Refactored for better mobile flow
const FilledInput = ({ 
  label, 
  children, 
  detectedValue, 
  personaId 
}: { 
  label: string, 
  children?: React.ReactNode, 
  detectedValue?: string | null,
  personaId?: PersonaId
}) => (
  <div className="relative group bg-md-sys-surfaceContainerHighest rounded-2xl border-b border-transparent hover:bg-md-sys-onSurface/10 focus-within:bg-md-sys-surfaceContainerHighest/80 transition-colors flex flex-col overflow-hidden min-h-[64px]">
    
    {/* Header Area (Badge + Label) */}
    <div className="px-4 pt-3 flex flex-col items-start gap-0.5 pointer-events-none z-20 w-full">
       {detectedValue && personaId && (
          <DetectedBadge label={detectedValue} personaId={personaId} />
       )}
       <label className="text-label-md text-md-sys-primary font-medium leading-tight">
         {label}
       </label>
    </div>
    
    {/* Input Area */}
    <div className="relative z-10 w-full">
       {children}
    </div>

    {/* Active Indicator Line */}
    <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-md-sys-onSurfaceVariant/20 group-focus-within:bg-md-sys-primary group-focus-within:h-[2px] transition-all z-20"></div>
  </div>
);

export const Questionnaire: React.FC<QuestionnaireProps> = ({ onComplete, preAnalysis, personaId }) => {
  const [profile, setProfile] = useState<Partial<UserProfile>>({
    goal: '', 
    trainingType: preAnalysis.detectedTrainingType || TrainingType.WEIGHTS,
    experience: ExperienceLevel.INTERMEDIATE,
    gender: 'Masculino',
    age: 26,
    injuries: '',
    customAnswer: ''
  });

  const [isCustomGoal, setIsCustomGoal] = useState(false);
  const [customGoalText, setCustomGoalText] = useState('');

  const [isCustomTraining, setIsCustomTraining] = useState(false);

  // Initialize goal logic: Detected or Default
  useEffect(() => {
    if (preAnalysis) {
      setProfile(prev => ({
        ...prev,
        // Default to detected goal
        goal: preAnalysis.detectedGoalGuess || UserGoal.HYPERTROPHY,
        trainingType: preAnalysis.detectedTrainingType || prev.trainingType
      }));
    }
  }, [preAnalysis]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalGoal = isCustomGoal ? customGoalText : profile.goal;
    
    if (isFormValid()) {
      onComplete({ ...profile, goal: finalGoal! } as UserProfile);
    }
  };

  const handleChange = (field: keyof UserProfile, value: any) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  };

  // Handler for Goal Select
  const handleGoalSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === 'OTHER_CUSTOM') {
      setIsCustomGoal(true);
      setCustomGoalText(''); 
    } else {
      setIsCustomGoal(false);
      handleChange('goal', val);
    }
  };

  // Handler for Training Type Select
  const handleTrainingSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    handleChange('trainingType', val);
  };

  const isFormValid = () => {
    const goalValid = isCustomGoal ? customGoalText.trim().length > 2 : !!profile.goal;
    return (
      goalValid && 
      profile.trainingType && 
      profile.customAnswer && profile.customAnswer.trim().length > 3 && 
      profile.age && profile.age > 0
    );
  };

  const getPersonaName = () => {
    if (personaId === 'sara') return 'Sara';
    if (personaId === 'todor') return 'Dr. Todor';
    return 'Raúl';
  };

  // Determine if the currently selected value matches the detected value to show the badge
  const showGoalBadge = !isCustomGoal && profile.goal === preAnalysis.detectedGoalGuess;
  const showTrainingBadge = !isCustomTraining && profile.trainingType === preAnalysis.detectedTrainingType;

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-6 animate-enter pb-24">
      
      {/* AI Insight Card */}
      <div className="bg-md-sys-surfaceContainerLow border border-md-sys-outlineVariant/50 rounded-3xl p-5 relative overflow-hidden shadow-sm">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-3">
             <div className="bg-md-sys-tertiaryContainer text-md-sys-onTertiaryContainer p-2 rounded-xl">
                <span className="material-symbols-rounded filled text-[20px]">psychology</span>
             </div>
             <h3 className="text-title-md font-bold text-md-sys-onSurface">La corazonada de {getPersonaName()}</h3>
          </div>
          
          <p className="text-md-sys-onSurfaceVariant text-body-md leading-relaxed mb-0 italic border-l-4 border-md-sys-tertiaryContainer pl-3 py-1">
            "{preAnalysis.summaryObservation}"
          </p>
        </div>
      </div>

      <div className="bg-md-sys-surfaceContainer rounded-[32px] p-4 sm:p-6 shadow-sm space-y-6">
        
        {/* Dynamic Question - Integrated Look */}
        <div className="relative bg-md-sys-surfaceContainerHighest/40 rounded-3xl p-5 border border-md-sys-outlineVariant/20">
          <div className="flex items-center gap-2 mb-3">
             <span className="bg-md-sys-primaryContainer/30 text-md-sys-primary p-1.5 rounded-lg">
                <span className="material-symbols-rounded filled text-[20px]">quiz</span>
             </span>
             <span className="text-title-md font-bold text-md-sys-onSurface">Pregunta Estratégica</span>
          </div>
          
          <p className="text-md-sys-onSurface text-body-lg font-medium mb-4 leading-snug">
              {preAnalysis.specificQuestion}
          </p>

          <div className="relative group">
               <textarea 
                value={profile.customAnswer}
                onChange={(e) => handleChange('customAnswer', e.target.value)}
                placeholder="Responde aquí con datos concretos (kilos, repeticiones, zonas de dolor...)"
                className="w-full bg-md-sys-surfaceContainerLow border border-transparent focus:border-md-sys-primary/30 rounded-2xl p-4 text-md-sys-onSurface focus:ring-0 outline-none transition-all placeholder-md-sys-onSurfaceVariant/40 text-body-lg h-36 resize-none shadow-inner"
              />
              <div className="flex justify-end mt-2">
                 {!profile.customAnswer ? (
                    <span className="text-xs font-medium text-md-sys-error bg-md-sys-errorContainer/20 px-2 py-1 rounded-md">
                       * Respuesta requerida para el análisis
                    </span>
                 ) : (
                    <span className="text-xs font-medium text-md-sys-primary flex items-center gap-1">
                       <span className="material-symbols-rounded text-[14px]">check</span> Completado
                    </span>
                 )}
              </div>
          </div>
        </div>

        <div className="h-px bg-md-sys-outlineVariant/50 my-2"></div>

        <h4 className="text-title-md font-medium text-md-sys-onSurface px-1">Confirma los datos detectados</h4>

        {/* Inputs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Goal Logic: Detected Value vs User Input */}
          <div className="flex flex-col gap-2">
             <FilledInput 
                label="Objetivo Principal" 
                detectedValue={showGoalBadge ? preAnalysis.detectedGoalGuess : null}
                personaId={personaId}
             >
                <div className="relative w-full">
                  <select 
                    value={isCustomGoal ? 'OTHER_CUSTOM' : profile.goal}
                    onChange={handleGoalSelectChange}
                    className="w-full h-12 bg-transparent text-md-sys-onSurface outline-none appearance-none cursor-pointer text-body-lg px-4 pb-2 pt-1 z-10 relative truncate pr-10"
                  >
                    {/* The AI Option */}
                    {preAnalysis.detectedGoalGuess && (
                      <option value={preAnalysis.detectedGoalGuess} className="bg-md-sys-surfaceContainer text-md-sys-onSurface font-bold">
                        ★ {preAnalysis.detectedGoalGuess}
                      </option>
                    )}
                    
                    {/* Standard Options */}
                    {Object.values(UserGoal).filter(g => g !== preAnalysis.detectedGoalGuess).map(g => (
                      <option key={g} value={g} className="bg-md-sys-surfaceContainer text-md-sys-onSurface">
                        {g}
                      </option>
                    ))}

                    <option value="OTHER_CUSTOM" className="bg-md-sys-surfaceContainer text-md-sys-onSurface text-md-sys-tertiary">
                      ✎ Escribir otro objetivo...
                    </option>
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-md-sys-onSurfaceVariant flex items-center">
                    <span className="material-symbols-rounded">arrow_drop_down</span>
                  </div>
                </div>
            </FilledInput>

            {/* Expandable Custom Input for Goal */}
            {isCustomGoal && (
               <div className="animate-enter">
                 <FilledInput label="Escribe tu objetivo específico">
                    <input 
                      type="text" 
                      value={customGoalText}
                      onChange={(e) => setCustomGoalText(e.target.value)}
                      placeholder="Ej: Salto vertical, Oposiciones..."
                      className="w-full h-12 bg-transparent text-md-sys-onSurface outline-none text-body-lg px-4 pb-2 pt-1 placeholder-md-sys-onSurfaceVariant/30"
                      autoFocus
                    />
                 </FilledInput>
               </div>
            )}
          </div>

          <FilledInput 
             label="Tipo de Entrenamiento"
             detectedValue={showTrainingBadge ? preAnalysis.detectedTrainingType : null}
             personaId={personaId}
          >
            <div className="relative w-full">
              <select 
                value={profile.trainingType}
                onChange={handleTrainingSelectChange}
                className="w-full h-12 bg-transparent text-md-sys-onSurface outline-none appearance-none cursor-pointer text-body-lg px-4 pb-2 pt-1 z-10 relative truncate pr-10"
              >
                {preAnalysis.detectedTrainingType && (
                  <option value={preAnalysis.detectedTrainingType} className="bg-md-sys-surfaceContainer text-md-sys-onSurface font-bold">
                      ★ {preAnalysis.detectedTrainingType}
                  </option>
                )}
                {Object.values(TrainingType).filter(t => t !== preAnalysis.detectedTrainingType).map(v => (
                  <option key={v} value={v} className="bg-md-sys-surfaceContainer text-md-sys-onSurface">{v}</option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-md-sys-onSurfaceVariant flex items-center">
                 <span className="material-symbols-rounded">arrow_drop_down</span>
              </div>
            </div>
          </FilledInput>

          <FilledInput label="Edad">
            <input 
              type="number" 
              value={profile.age}
              onChange={(e) => handleChange('age', parseInt(e.target.value))}
              className="w-full h-12 bg-transparent text-md-sys-onSurface outline-none text-body-lg px-4 pb-2 pt-1"
            />
          </FilledInput>

           <FilledInput label="Nivel de Experiencia">
             <div className="relative w-full">
              <select 
                value={profile.experience}
                onChange={(e) => handleChange('experience', e.target.value)}
                className="w-full h-12 bg-transparent text-md-sys-onSurface outline-none appearance-none cursor-pointer text-body-lg px-4 pb-2 pt-1 z-10 relative pr-10"
              >
                {Object.values(ExperienceLevel).map(v => <option key={v} value={v} className="bg-md-sys-surfaceContainer text-md-sys-onSurface">{v}</option>)}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-md-sys-onSurfaceVariant flex items-center">
                 <span className="material-symbols-rounded">arrow_drop_down</span>
              </div>
            </div>
          </FilledInput>
        </div>

        {/* Injuries - Integrated Look */}
        <div className="relative group bg-md-sys-surfaceContainerHighest rounded-2xl p-4 transition-colors">
          <label className="text-label-md text-md-sys-primary font-medium mb-2 block">
            Lesiones o Molestias (Opcional)
          </label>
          <textarea 
            value={profile.injuries}
            onChange={(e) => handleChange('injuries', e.target.value)}
            placeholder="Ej: Dolor lumbar al hacer peso muerto, pinzamiento en hombro..."
            className="w-full bg-transparent text-md-sys-onSurface outline-none resize-none h-20 text-body-lg placeholder-md-sys-onSurfaceVariant/50 border-b border-md-sys-onSurfaceVariant/20 focus:border-md-sys-primary transition-colors"
          />
        </div>

      </div>

      {/* FAB - Validation */}
      <div className="fixed bottom-6 right-6 left-6 md:left-auto md:right-8 z-30">
        <button 
          type="submit"
          disabled={!isFormValid()}
          className={`
            w-full md:w-auto h-14 md:px-8 rounded-full font-medium text-label-lg
            shadow-lg transition-all duration-300 ease-emphasized
            flex items-center justify-center gap-2 ripple-surface
            ${isFormValid() 
              ? 'bg-md-sys-primaryContainer text-md-sys-onPrimaryContainer hover:shadow-xl hover:scale-105 active:scale-95' 
              : 'bg-md-sys-surfaceContainerHighest text-md-sys-onSurfaceVariant/50 cursor-not-allowed shadow-none'}
          `}
        >
          <span className="material-symbols-rounded">auto_fix</span>
          <span>{isFormValid() ? 'Generar Diagnóstico' : 'Completa los campos'}</span>
        </button>
      </div>
    </form>
  );
};
