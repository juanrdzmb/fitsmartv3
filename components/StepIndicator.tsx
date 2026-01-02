import React from 'react';

interface StepIndicatorProps {
  currentStep: number;
}

export const StepIndicator: React.FC<StepIndicatorProps> = ({ currentStep }) => {
  // Steps: 1=Upload, 2=Analysis, 3=Results
  const progress = currentStep === 1 ? 33 : currentStep === 2 ? 66 : 100;

  return (
    <div className="w-full max-w-md mx-auto mb-8 px-4">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-md-sys-primary">
          Paso {currentStep} de 3
        </span>
        <span className="text-xs font-medium text-md-sys-onSurfaceVariant">
          {currentStep === 1 ? 'Subir Rutina' : currentStep === 2 ? 'Diagnóstico' : 'Resultados'}
        </span>
      </div>
      {/* Material Track */}
      <div className="h-1 w-full bg-md-sys-surfaceContainerHighest rounded-full overflow-hidden">
        {/* Material Indicator */}
        <div 
          className="h-full bg-md-sys-primary transition-all duration-700 ease-emphasized rounded-full"
          style={{ width: `${progress}%` }}
        ></div>
      </div>
    </div>
  );
};
