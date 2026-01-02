
import React from 'react';
import { Persona, PersonaId } from '../types';

interface PersonaSelectorProps {
  onSelect: (personaId: PersonaId) => void;
  isLoading?: boolean;
  selectedId?: PersonaId | null;
}

const PERSONAS: Persona[] = [
  {
    id: 'sara',
    name: 'Sara',
    role: 'Sevillana / Sin Filtros',
    description: 'Illo, si tu técnica es una papa, te lo voy a decir. Aquí no venimos a pasear la toalla, miarma. Menos excusas y más arte, ¡ave!',
    icon: 'sentiment_very_dissatisfied', 
    color: 'bg-[#FFD8E4] text-[#31111D]' 
  },
  {
    id: 'todor',
    name: 'Dr. Todor',
    role: 'Madrileño / Biomecánica',
    description: 'En plan, tu vector de fuerza no renta nada, tronco. Si no optimizas el brazo de momento me raya mazo. Datos, no opiniones, ¿sabes?',
    icon: 'science',
    color: 'bg-[#E8DEF8] text-[#1D192B]' 
  },
  {
    id: 'raul',
    name: 'Raúl "O Bestia"',
    role: 'Gallego / Motivación',
    description: 'Malo será que no crezcas, neno. ¡Déjate de ser riquiño con los pesos y dale carallo! Si no duele, no vale. Sentidiño y a ferro.',
    icon: 'fitness_center',
    color: 'bg-[#FEF7FF] text-[#1D1B20] border-2 border-md-sys-primary' 
  }
];

export const PersonaSelector: React.FC<PersonaSelectorProps> = ({ onSelect, isLoading = false, selectedId = null }) => {
  return (
    <div className="w-full pb-12">
      <div className="text-center mb-6 animate-enter">
        <h2 className="text-headline-sm text-md-sys-onSurface mb-2">Elige a tu Auditor</h2>
        <p className="text-body-lg text-md-sys-onSurfaceVariant">¿Quién quieres que destroce (o arregle) tu rutina?</p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {PERSONAS.map((p, index) => {
          const isSelected = selectedId === p.id;
          const isOtherSelected = selectedId !== null && !isSelected;

          return (
            <button
              key={p.id}
              onClick={() => !isLoading && onSelect(p.id)}
              disabled={isLoading && !isSelected}
              style={{ animationDelay: `${index * 150}ms` }}
              className={`
                group relative overflow-hidden text-left bg-md-sys-surfaceContainer rounded-3xl p-5 
                border transition-all duration-500 ease-emphasized ripple-surface animate-enter
                ${isSelected 
                  ? 'border-md-sys-primary ring-2 ring-md-sys-primary bg-md-sys-surfaceContainerHigh scale-[1.02] shadow-xl z-10' 
                  : 'border-md-sys-outlineVariant/50 hover:border-md-sys-primary hover:scale-[1.02] hover:shadow-lg active:scale-[0.98]'
                }
                ${isOtherSelected ? 'opacity-50 grayscale scale-95' : 'opacity-100'}
              `}
            >
              <div className="flex items-start gap-4 z-10 relative">
                 {/* Avatar Placeholder */}
                 <div className={`
                    w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 shadow-sm transition-transform duration-500 ease-emphasized
                    ${p.id === 'sara' ? 'bg-rose-200 text-rose-900' : p.id === 'todor' ? 'bg-indigo-200 text-indigo-900' : 'bg-amber-200 text-amber-900'}
                    ${isSelected ? 'scale-110' : 'group-hover:scale-110'}
                 `}>
                    {isLoading && isSelected ? (
                       <svg className="md3-circular-progress w-8 h-8 text-current" viewBox="0 0 48 48">
                          <circle cx="24" cy="24" r="20" fill="none" strokeWidth="5"></circle>
                       </svg>
                    ) : (
                       <span className="material-symbols-rounded text-3xl filled">{p.icon}</span>
                    )}
                 </div>
                 
                 <div className="flex-1">
                    <h3 className={`text-title-lg font-bold mb-1 transition-colors duration-300 ${isSelected ? 'text-md-sys-primary' : 'text-md-sys-onSurface group-hover:text-md-sys-primary'}`}>
                      {p.name}
                    </h3>
                    <div className="inline-block px-2 py-0.5 rounded-md bg-md-sys-surfaceContainerHighest text-label-sm font-medium text-md-sys-onSurfaceVariant mb-2 uppercase tracking-wide">
                      {p.role}
                    </div>
                    <p className="text-body-md text-md-sys-onSurfaceVariant leading-relaxed mt-1">
                      {p.description}
                    </p>
                 </div>

                 <div className={`
                    self-center transition-all duration-500 ease-emphasized -mr-2
                    ${isSelected || (!isLoading && !selectedId) ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'}
                    ${!isSelected && 'opacity-0 group-hover:opacity-100 group-hover:translate-x-0'}
                 `}>
                   {isLoading && isSelected ? null : (
                      <span className="material-symbols-rounded text-md-sys-primary text-3xl">chevron_right</span>
                   )}
                 </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
