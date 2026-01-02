
export const UserGoal = {
  HYPERTROPHY: 'Hipertrofia (Ganancia Muscular)',
  STRENGTH: 'Fuerza Máxima',
  ENDURANCE: 'Resistencia',
  WEIGHT_LOSS: 'Pérdida de Peso',
  MOBILITY: 'Movilidad y Salud',
  REHAB: 'Rehabilitación'
} as const;
export type UserGoal = typeof UserGoal[keyof typeof UserGoal];

export const TrainingType = {
  WEIGHTS: 'Pesas / Gym',
  CALISTHENICS: 'Calistenia',
  FUNCTIONAL: 'Entrenamiento Funcional / CrossFit',
  HOME_WORKOUT: 'En Casa',
  HYBRID: 'Híbrido',
  POWERLIFTING: 'Powerlifting',
  YOGA_PILATES: 'Yoga / Pilates',
  UNDEFINED: 'No identificado'
} as const;
export type TrainingType = typeof TrainingType[keyof typeof TrainingType];

export const ExperienceLevel = {
  BEGINNER: 'Principiante (< 1 año)',
  INTERMEDIATE: 'Intermedio (1-3 años)',
  ADVANCED: 'Avanzado (> 3 años)'
} as const;
export type ExperienceLevel = typeof ExperienceLevel[keyof typeof ExperienceLevel];

export type PersonaId = 'sara' | 'todor' | 'raul';

export interface Persona {
  id: PersonaId;
  name: string;
  role: string;
  description: string;
  icon: string;
  color: string;
}

export interface PreAnalysisResult {
  detectedTrainingType: TrainingType;
  detectedGoalGuess: UserGoal;
  confidenceScore: number;
  specificQuestion: string;
  summaryObservation: string;
}

export interface UserProfile {
  goal: string;
  trainingType: TrainingType;
  injuries: string;
  experience: ExperienceLevel;
  age: number;
  gender: string;
  customAnswer?: string;
  persona: PersonaId;
}

export interface DetectedExercise {
  name: string;
  targetGroup: string;
  type: 'Compuesto' | 'Aislamiento' | 'Cardio' | 'Movilidad';
  variantDetected: string;
  technicalTip?: string;
}

export interface ExerciseRecommendation {
  original?: string;
  recommended: string;
  sets: string;
  reps: string;
  rest: string;
  reason: string;
  youtubeQuery: string;
}

export interface WarmUpExercise {
  name: string;
  description: string;
  dosage: string;
}

export interface BiomechanicalAnalysis {
  summary: string;
  score: number;
  detectedExercises: DetectedExercise[];
  safetyAssessment: string;
  alignmentWithGoal: string;
  modifications: ExerciseRecommendation[];
  warmUpRecommendations: WarmUpExercise[];
  generalAdvice: string[];
}

export interface SetupItem {
  label: string;
  value: string;
  status: 'OK' | 'ATTENTION';
  recommendation?: string;
  shoppingQuery?: string;
}

export interface VideoAnalysisMetrics {
  depth?: string;
  lockout?: string;
  rom?: string;
  tempo?: string;
  barPath?: string;
  stability?: string;
}

export interface VideoAnalysisFeedback {
  type: 'correction' | 'optimization';
  text: string;
  positive: string[];
  negative: string[];
  youtubeQuery: string;
}

export interface VideoAnalysisResult {
  exerciseName: string;
  variant: string;
  repCount: number;
  confidence: number;
  cameraAngle: string;
  repsTimeline?: string[];
  setupDetails: SetupItem[];
  metrics: VideoAnalysisMetrics;
  feedback: VideoAnalysisFeedback;
}

export type InputType = 'text' | 'image' | 'pdf' | 'url' | 'csv' | 'video';

export interface RoutineInput {
  type: InputType;
  content: string;
  mimeType?: string;
}

export interface WorkoutSet {
  exercise: string;
  weight: number;
  reps: number;
  rpe?: number;
  type: 'normal' | 'warmup' | 'drop' | 'failure';
}

export interface WorkoutSession {
  date: string;
  title: string;
  sets: WorkoutSet[];
}
