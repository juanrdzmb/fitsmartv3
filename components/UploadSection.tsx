
import React, { useState, useRef, useEffect } from 'react';
import { RoutineInput, WorkoutSession } from '../types';
import { parseWorkoutCSV, formatWorkoutsForAI } from '../services/csvParser';

interface UploadSectionProps {
  onComplete: (input: RoutineInput) => void;
  isLoading: boolean;
  initialTab?: 'app' | 'upload' | 'video' | 'text' | 'url';
}

// Mini componente para el spinner dentro de botones
const ButtonSpinner = () => (
  <svg className="md3-circular-progress w-5 h-5 text-current" viewBox="0 0 48 48">
    <circle cx="24" cy="24" r="20" fill="none" strokeWidth="6"></circle>
  </svg>
);

export const UploadSection: React.FC<UploadSectionProps> = ({ onComplete, isLoading, initialTab = 'app' }) => {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [textContent, setTextContent] = useState('');
  const [parsedHistory, setParsedHistory] = useState<WorkoutSession[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const csvInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  // Sync tab if prop changes (e.g. returning from video reset)
  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) { // Limit image/PDF to 10MB
      alert("Máximo 10MB para imágenes/PDF.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      onComplete({
        type: file.type.includes('pdf') ? 'pdf' : 'image',
        content: base64,
        mimeType: file.type
      });
    };
    reader.readAsDataURL(file);
  };

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 20 * 1024 * 1024) { 
       alert("El video debe pesar menos de 20MB para el análisis.");
       return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      onComplete({
        type: 'video',
        content: base64,
        mimeType: file.type || 'video/mp4'
      });
    };
    reader.readAsDataURL(file);
  };

  const handleCSVChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const sessions = parseWorkoutCSV(text);
      setParsedHistory(sessions);
    };
    reader.readAsText(file);
  };

  const handleCSVConfirm = () => {
    if (parsedHistory.length === 0) return;
    const aiText = formatWorkoutsForAI(parsedHistory);
    onComplete({
      type: 'csv',
      content: aiText
    });
  };

  const handleTextSubmit = () => {
    if (!textContent.trim()) return;
    onComplete({
      type: activeTab === 'url' ? 'url' : 'text',
      content: textContent
    });
  };

  // Configuración de Colores Pastel por Pestaña (Material Expressive)
  const tabsConfig = [
    { 
      id: 'app', 
      icon: 'smartphone', 
      label: 'Apps',
      colorClass: 'bg-indigo-100 text-indigo-900 dark:bg-indigo-500/20 dark:text-indigo-200',
      activeBorder: 'border-indigo-500/30'
    },
    { 
      id: 'upload', 
      icon: 'upload_file', 
      label: 'Archivo',
      colorClass: 'bg-blue-100 text-blue-900 dark:bg-blue-500/20 dark:text-blue-200',
      activeBorder: 'border-blue-500/30'
    },
    { 
      id: 'video', 
      icon: 'videocam', 
      label: 'Video AI',
      colorClass: 'bg-rose-100 text-rose-900 dark:bg-rose-500/20 dark:text-rose-200',
      activeBorder: 'border-rose-500/30'
    },
    { 
      id: 'text', 
      icon: 'edit_note', 
      label: 'Texto',
      colorClass: 'bg-amber-100 text-amber-900 dark:bg-amber-500/20 dark:text-amber-200',
      activeBorder: 'border-amber-500/30'
    },
    { 
      id: 'url', 
      icon: 'link', 
      label: 'Link',
      colorClass: 'bg-emerald-100 text-emerald-900 dark:bg-emerald-500/20 dark:text-emerald-200',
      activeBorder: 'border-emerald-500/30'
    }
  ];

  const currentTabConfig = tabsConfig.find(t => t.id === activeTab) || tabsConfig[0];

  return (
    <div className="w-full animate-enter">
      
      {/* Material 3 Card with dynamic subtle border */}
      <div className={`bg-md-sys-surfaceContainer rounded-[32px] p-2 shadow-sm overflow-hidden border transition-colors duration-500 ${currentTabConfig.activeBorder}`}>
        
        {/* Tabs with Smooth Transitions and Dynamic Colors */}
        <div className="flex w-full bg-md-sys-surfaceContainerHigh rounded-full mb-6 border border-md-sys-outlineVariant p-1 overflow-x-auto no-scrollbar">
          {tabsConfig.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as any);
                setTextContent('');
                setParsedHistory([]);
              }}
              className={`
                flex-1 min-w-[80px] sm:min-w-[90px] relative flex items-center justify-center gap-2 py-3 text-label-lg font-medium 
                rounded-full ripple-surface transition-all duration-500 ease-emphasized
                ${activeTab === tab.id 
                  ? `${tab.colorClass} shadow-sm scale-[1.02]` 
                  : 'text-md-sys-onSurfaceVariant hover:text-md-sys-onSurface hover:bg-md-sys-onSurface/10'
                }
              `}
            >
              <span className={`material-symbols-rounded text-[20px] ${activeTab === tab.id ? 'filled' : ''}`}>{tab.icon}</span>
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="px-2 pb-2 sm:px-4 sm:pb-4 min-h-[300px] flex flex-col relative overflow-hidden">
          
          {/* --- APP / CSV TAB --- */}
          {activeTab === 'app' && (
            <div className="flex flex-col h-full animate-enter">
              {!parsedHistory.length ? (
                <div className="flex-grow flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-md-sys-outlineVariant rounded-[24px] bg-md-sys-surfaceContainerLow transition-colors duration-300 hover:bg-md-sys-surfaceContainerHigh/50">
                   <div className="w-16 h-16 bg-indigo-100 text-indigo-700 rounded-2xl flex items-center justify-center mb-4 shadow-sm">
                      <span className="material-symbols-rounded text-3xl">table_chart</span>
                   </div>
                   <h3 className="text-headline-sm font-normal text-md-sys-onSurface mb-2">Importar Historial</h3>
                   <p className="text-body-lg text-md-sys-onSurfaceVariant mb-6 max-w-xs">
                     Soporta CSV exportado de <strong>Hevy, Strong</strong> y otras apps.
                   </p>
                   
                   <input 
                    type="file" 
                    ref={csvInputRef}
                    onChange={handleCSVChange}
                    accept=".csv"
                    className="hidden"
                  />
                  <button 
                    onClick={() => csvInputRef.current?.click()}
                    className="bg-md-sys-primary text-md-sys-onPrimary px-6 py-3 rounded-full font-medium shadow-md hover:bg-md-sys-onPrimaryContainer hover:text-md-sys-primaryContainer hover:shadow-lg transition-all duration-300 ease-emphasized active:scale-95 flex items-center gap-2 ripple-surface"
                  >
                    <span className="material-symbols-rounded">upload</span>
                    Seleccionar CSV
                  </button>
                </div>
              ) : (
                <div className="flex flex-col h-full">
                  <div className="flex justify-between items-center mb-4 px-2">
                    <h3 className="text-title-lg font-bold text-md-sys-onSurface">Últimos Entrenos</h3>
                    <button 
                      onClick={() => setParsedHistory([])}
                      className="text-label-lg text-md-sys-error font-medium hover:text-md-sys-onErrorContainer transition-colors"
                    >
                      Borrar
                    </button>
                  </div>

                  {/* Preview List */}
                  <div className="flex-grow overflow-y-auto max-h-[350px] space-y-3 mb-4 pr-1 scrollbar-hide">
                    {parsedHistory.slice(0, 3).map((session, idx) => (
                      <div key={idx} className="bg-md-sys-surfaceContainerHigh p-4 rounded-xl border border-md-sys-outlineVariant/50 animate-enter" style={{ animationDelay: `${idx * 100}ms` }}>
                        <div className="flex justify-between items-center mb-2">
                           <span className="text-label-md text-md-sys-primary font-bold uppercase tracking-wider">{session.date}</span>
                           <span className="text-body-md font-bold text-md-sys-onSurface">{session.title}</span>
                        </div>
                        <div className="space-y-1">
                           {Array.from(new Set(session.sets.map(s => s.exercise))).slice(0, 4).map((exName, i) => (
                             <div key={i} className="flex justify-between text-body-sm text-md-sys-onSurfaceVariant">
                                <span>{exName}</span>
                                <span>{session.sets.filter(s => s.exercise === exName).length} series</span>
                             </div>
                           ))}
                           {new Set(session.sets.map(s => s.exercise)).size > 4 && (
                             <div className="text-xs text-md-sys-outline italic">... y más ejercicios</div>
                           )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={handleCSVConfirm}
                    disabled={isLoading}
                    className="w-full bg-md-sys-primary text-md-sys-onPrimary h-14 rounded-full font-medium text-label-lg hover:shadow-md hover:bg-md-sys-onPrimaryContainer hover:text-md-sys-primaryContainer active:scale-[0.98] transition-all duration-500 ease-emphasized flex items-center justify-center gap-2 ripple-surface disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <>
                        <ButtonSpinner />
                        <span>Analizando...</span>
                      </>
                    ) : (
                      <>
                        <span>Analizar Historial</span>
                        <span className="material-symbols-rounded">auto_awesome</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* --- VIDEO TAB --- */}
          {activeTab === 'video' && (
            <div className="text-center h-full flex-grow flex flex-col animate-enter">
              <input 
                type="file" 
                ref={videoInputRef}
                onChange={handleVideoChange}
                accept="video/*"
                className="hidden"
              />
              <div 
                  onClick={() => !isLoading && videoInputRef.current?.click()}
                  className="
                    flex-grow flex flex-col items-center justify-center
                    border-2 border-dashed border-md-sys-outlineVariant bg-md-sys-surfaceContainerLow
                    rounded-[24px] cursor-pointer 
                    active:bg-rose-500/10 active:border-rose-400 
                    hover:bg-md-sys-surfaceContainerHigh hover:border-rose-400/50
                    transition-all duration-500 ease-emphasized group
                    relative overflow-hidden ripple-surface
                    p-6
                  "
                >
                  <div className="w-20 h-20 bg-rose-100 text-rose-700 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:shadow-lg transition-all duration-500 ease-emphasized shadow-md">
                    {isLoading ? (
                       <ButtonSpinner />
                    ) : (
                       <span className="material-symbols-rounded text-4xl filled">videocam</span>
                    )}
                  </div>
                  <h3 className="text-md-sys-onSurface text-headline-sm font-normal transition-colors group-hover:text-rose-400">
                     {isLoading ? 'Analizando movimiento...' : 'Analizar Técnica (Video)'}
                  </h3>
                  <p className="text-md-sys-onSurfaceVariant text-body-lg mt-2 max-w-xs">
                     Sube un clip corto. La IA detectará el ejercicio, contará repeticiones y analizará la profundidad/bloqueo.
                  </p>
                  
                  {/* Badge */}
                  <div className="mt-4 bg-rose-200 text-rose-900 px-3 py-1 rounded-full text-label-sm font-bold shadow-sm">
                     BETA: Visión Artificial
                  </div>
                </div>
            </div>
          )}

          {/* --- FILE UPLOAD TAB (PDF/IMG) --- */}
          {activeTab === 'upload' && (
            <div className="text-center h-full flex-grow flex flex-col animate-enter">
               <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*,application/pdf"
                className="hidden"
              />
               <div 
                  onClick={() => !isLoading && fileInputRef.current?.click()}
                  className="
                    flex-grow flex flex-col items-center justify-center
                    border-2 border-dashed border-md-sys-outlineVariant bg-md-sys-surfaceContainerLow
                    rounded-[24px] cursor-pointer 
                    active:bg-blue-500/10 active:border-blue-400 
                    hover:bg-md-sys-surfaceContainerHigh hover:border-blue-400/50
                    transition-all duration-500 ease-emphasized group
                    relative overflow-hidden ripple-surface
                    p-6
                  "
                >
                  <div className="w-20 h-20 bg-blue-100 text-blue-700 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:shadow-lg transition-all duration-500 ease-emphasized shadow-md">
                    {isLoading ? (
                       <ButtonSpinner />
                    ) : (
                       <span className="material-symbols-rounded text-4xl">cloud_upload</span>
                    )}
                  </div>
                  <h3 className="text-md-sys-onSurface text-headline-sm font-normal transition-colors group-hover:text-blue-400">
                     {isLoading ? 'Procesando archivo...' : 'Toca para subir'}
                  </h3>
                  <p className="text-md-sys-onSurfaceVariant text-body-lg mt-2">PDF o Imagen (Captura)</p>
                  
                </div>
            </div>
          )}

          {/* --- TEXT / URL TABS --- */}
          {(activeTab === 'text' || activeTab === 'url') && (
            <div className="space-y-4 flex-grow flex flex-col animate-enter">
              <div className="relative group flex-grow">
                <textarea
                  className={`
                    w-full h-full bg-md-sys-surfaceContainerHighest/50 text-md-sys-onSurface 
                    border-b border-md-sys-outlineVariant 
                    rounded-t-2xl rounded-b-lg p-4 pt-8
                    outline-none transition-all duration-300 ease-out resize-none text-body-lg leading-relaxed
                    placeholder-transparent peer min-h-[220px]
                    focus:border-b-2 focus:bg-md-sys-surfaceContainerHighest
                    ${activeTab === 'text' ? 'focus:border-amber-400' : 'focus:border-emerald-400'}
                  `}
                  placeholder=" "
                  value={textContent}
                  onChange={(e) => setTextContent(e.target.value)}
                  disabled={isLoading}
                ></textarea>
                <label className={`
                  absolute left-4 top-4 text-md-sys-onSurfaceVariant text-body-lg transition-all duration-300 ease-emphasized pointer-events-none
                  peer-placeholder-shown:top-6 peer-placeholder-shown:text-body-lg
                  peer-focus:top-2 peer-focus:text-label-md 
                  peer-[&:not(:placeholder-shown)]:top-2 peer-[&:not(:placeholder-shown)]:text-label-md
                  ${activeTab === 'text' 
                     ? 'peer-focus:text-amber-500 peer-[&:not(:placeholder-shown)]:text-amber-500' 
                     : 'peer-focus:text-emerald-500 peer-[&:not(:placeholder-shown)]:text-emerald-500'}
                `}>
                  {activeTab === 'text' ? "Escribe o pega tu rutina aquí..." : "Pega el enlace de la rutina..."}
                </label>
              </div>

              <button
                onClick={handleTextSubmit}
                disabled={!textContent.trim() || isLoading}
                className={`
                  w-full text-md-sys-onPrimary h-14 rounded-full font-medium text-label-lg
                  hover:shadow-lg 
                  active:scale-[0.98] 
                  transition-all duration-500 ease-emphasized flex items-center justify-center gap-2
                  disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none ripple-surface
                  ${activeTab === 'text' 
                    ? 'bg-amber-600 hover:bg-amber-700 hover:text-amber-50' 
                    : 'bg-emerald-600 hover:bg-emerald-700 hover:text-emerald-50'}
                `}
              >
                {isLoading ? (
                  <>
                     <ButtonSpinner />
                     <span>Procesando...</span>
                  </>
                ) : (
                  <>
                    <span>Continuar</span>
                    <span className="material-symbols-rounded">arrow_forward</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
