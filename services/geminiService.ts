
import { GoogleGenAI } from "@google/genai";
import { UserProfile, RoutineInput, BiomechanicalAnalysis, PreAnalysisResult, PersonaId, VideoAnalysisResult } from "../types";

const apiKey = process.env.API_KEY;
if (!apiKey) throw new Error("API Key not found");
const ai = new GoogleGenAI({ apiKey });

const parseJSON = (text: string) => {
  try {
    return JSON.parse(text);
  } catch (e) {
    let cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
    try {
      return JSON.parse(cleaned);
    } catch (e2) {
      try {
        const firstOpen = text.indexOf('{');
        const lastClose = text.lastIndexOf('}');
        if (firstOpen !== -1 && lastClose !== -1 && lastClose > firstOpen) {
          const jsonCandidate = text.substring(firstOpen, lastClose + 1);
          return JSON.parse(jsonCandidate);
        }
      } catch (innerError) {
        console.error("Fallback JSON extraction failed:", innerError);
      }
    }
    console.error("Failed text content:", text);
    throw new Error("No se pudo analizar la respuesta de la IA. El formato recibido no es válido.");
  }
};

const getPersonaInstruction = (id: PersonaId) => {
  switch (id) {
    case 'sara':
      return `
        PERSONAJE: Sara (Entrenadora Sevillana).
        IDIOMA/JERGA: Andaluz de Sevilla cerrado, muy coloquial.
        PALABRAS CLAVE OBLIGATORIAS: "Illo/Illa", "miarma", "picha" (coloquial), "qué coraje", "no ni ná", "una jartá", "¡ave!", "guapetón/ona", "tesquiero ya", "hacer el canelo", "estar al liquindoi".
        
        ACTITUD:
        - Eres muy cercana, graciosa y exagerada, pero no pasas ni una técnica mala.
        - Si la rutina es mala: "Illo, ¿esto qué es? Me da coraje verte perder el tiempo así, picha". "Estás haciendo el canelo una jartá".
        - Si la rutina es buena: "Ole tú y ole tu arte, miarma. Así sí".
        - Tienes "mucha guasa" pero sabes de lo que hablas.
      `;
    case 'todor':
      return `
        PERSONAJE: Dr. Todor (Biomecánico Madrileño - "Cayetana/Malasaña").
        IDIOMA/JERGA: Madrileño actual, mezcla de académico y "pijo/moderno".
        PALABRAS CLAVE OBLIGATORIAS: "Mazo", "renta", "en plan", "tronco", "me raya", "movida", "pavo/pava", "literal", "feten", "mazo de guapo", "cantidubi" (irónico).
        
        ACTITUD:
        - Priorizas la ciencia pero hablas como si estuvieras en una terraza de Ponzano.
        - Si la rutina es mala: "A ver tronco, esto no renta nada. En plan, te vas a lesionar mazo. Me raya tu selección de ejercicios".
        - Si la rutina es buena: "Esto está fetén. Renta mazo la progresión que llevas".
        - Eres un poco arrogante, te crees el más listo de la sala.
      `;
    case 'raul':
      return `
        PERSONAJE: Raúl "La Bestia" (Gymbro Gallego).
        IDIOMA/JERGA: Gallego y castellano del norte.
        PALABRAS CLAVE OBLIGATORIAS: "Carallo", "neno/a", "malo será", "riquiño" (úsalo despectivamente para pesos bajos), "sentidiño", "vai rañala", "foder", "a tope", "chaval".
        
        ACTITUD:
        - Bruto, directo, noble pero con "retranca" (ironía gallega).
        - Si la rutina es mala o floja: "¿Pero qué es esto, neno? ¡Mete peso, me cago en el carallo! No seas riquiño".
        - Si la rutina es buena: "Malo será que no crezcas con esto. Dale duro ahí".
        - Motivación agresiva pero con cabeza ("sentidiño").
      `;
    default:
      return "Eres un entrenador profesional objetivo.";
  }
};

/**
 * PHASE 1: PRE-ANALYSIS
 */
export const preAnalyzeRoutine = async (routine: RoutineInput, personaId: PersonaId): Promise<PreAnalysisResult> => {
  const personaInstruction = getPersonaInstruction(personaId);
  
  const systemInstruction = `
    ${personaInstruction}
    
    TAREA: Escanear el input (Rutina estática o Historial de Entrenamiento) para preparar el análisis profundo.
    
    1. **Detecta Tipo y Objetivo**: Identifica qué está intentando hacer el usuario.
    
    2. **"summaryObservation"**:
       - IMPORTANTE: Escribe este resumen USANDO TU JERGA Y PERSONALIDAD AL 100%.
       - Si es un HISTORIAL (CSV): Comenta sobre la consistencia, la selección de ejercicios y los pesos que ves en el historial reciente.
       - Si es RUTINA (PDF/IMG/TXT): Comenta la estructura general.
    
    3. **"specificQuestion" (CRÍTICO)**:
       - Genera UNA sola pregunta estratégica.
       - Usa tu JERGA en la pregunta.
       - **PROHIBIDO preguntas de "Sí/No"**.
       - Si es HISTORIAL: Pregunta sobre recuperación, estancamiento en un ejercicio detectado o sensaciones recientes.
    
    IMPORTANTE: Responde ÚNICAMENTE con JSON válido puro.
    
    Estructura JSON:
    {
      "detectedTrainingType": "String (TrainingType enum values)",
      "detectedGoalGuess": "String (UserGoal enum values)",
      "confidenceScore": 85,
      "summaryObservation": "Observación inicial con MUCHA personalidad...",
      "specificQuestion": "Pregunta abierta estratégica con MUCHA personalidad..."
    }
  `;

  let parts: any[] = [];
  if (routine.type === 'text' || routine.type === 'url' || routine.type === 'csv') {
    parts.push({ text: `CONTENIDO USUARIO:\n${routine.content}` });
  } else if ((routine.type === 'image' || routine.type === 'pdf') && routine.mimeType) {
    parts.push({ inlineData: { mimeType: routine.mimeType, data: routine.content } });
    parts.push({ text: "Analiza el contenido visual." });
  }

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: { parts },
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      maxOutputTokens: 4096,
    }
  });

  if (!response.text) throw new Error("No pre-analysis response");
  return parseJSON(response.text);
};

/**
 * PHASE 2: DEEP ANALYSIS
 */
export const analyzeRoutineWithGemini = async (
  profile: UserProfile,
  routine: RoutineInput,
  preAnalysis?: PreAnalysisResult
): Promise<BiomechanicalAnalysis> => {
  
  const personaInstruction = getPersonaInstruction(profile.persona);

  const systemInstruction = `
    ${personaInstruction}
    
    TAREA: Auditoría completa y clasificación técnica.
    
    INPUTS:
    - Input original (Puede ser Rutina Escrita o Historial de Entrenamientos/CSV).
    - Perfil: ${profile.age} años, Nivel ${profile.experience}, Objetivo "${profile.goal}".
    - Lesiones: "${profile.injuries}".
    - Respuesta clave: "${profile.customAnswer}".

    INSTRUCCIONES DE SALIDA (JSON):
    1. "detectedExercises": 
       - Si es HISTORIAL, lista los ejercicios principales detectados en las últimas sesiones.
       - Clasifica "type" y "variantDetected".
       - "technicalTip": Añade un consejo BREVE (1 frase) sobre la ejecución correcta o un error común a evitar en este ejercicio, usando tu PERSONALIDAD.
    2. "summary": 
       - Veredicto final. ÚSA TU JERGA Y PERSONALIDAD. 
       - Si es HISTORIAL: Analiza si hay sobrecarga progresiva, si el volumen es adecuado para ${profile.goal}.
    3. "safetyAssessment": Riesgos biomecánicos (ej: mucho volumen, orden incorrecto). Usa tu tono (sarcasmo, técnico o bruto).
    4. "warmUpRecommendations":
       - Genera 2-3 ejercicios de calentamiento ESPECÍFICOS para preparar el cuerpo para ESTA rutina y el objetivo "${profile.goal}".
       - Usa tu PERSONALIDAD en la "description".
    5. "modifications": Cambios sugeridos.
       - "reason": EXPLICACIÓN CON TU PERSONALIDAD Y JERGA.
       - Si es HISTORIAL: Sugiere cambios basados en lo que NO está haciendo o lo que está haciendo mal.

    IMPORTANTE: Responde ÚNICAMENTE con JSON válido puro.

    Estructura JSON:
    {
      "summary": "Veredicto con jerga regional",
      "score": 0-100,
      "detectedExercises": [
        {
          "name": "Sentadilla",
          "targetGroup": "Pierna",
          "type": "Compuesto",
          "variantDetected": "Barra Alta",
          "technicalTip": "Consejo técnico específico con personalidad"
        }
      ],
      "safetyAssessment": "Evaluación seguridad con personalidad",
      "alignmentWithGoal": "Evaluación objetivo",
      "warmUpRecommendations": [
        {
          "name": "Nombre Ejercicio",
          "description": "Descripción breve con personalidad",
          "dosage": "2 series x 15 reps"
        }
      ],
      "modifications": [
        {
          "original": "Ejercicio original o 'N/A'",
          "recommended": "Ejercicio optimizado",
          "sets": "3",
          "reps": "8-12",
          "rest": "90s",
          "reason": "Explicación con jerga",
          "youtubeQuery": "Texto búsqueda"
        }
      ],
      "generalAdvice": ["Consejo 1 con jerga", "Consejo 2 con jerga"]
    }
  `;

  let parts: any[] = [];
  if (routine.type === 'text' || routine.type === 'url' || routine.type === 'csv') {
    parts.push({ text: routine.content });
  } else if (routine.mimeType) {
    parts.push({ inlineData: { mimeType: routine.mimeType, data: routine.content } });
  }

  const userContext = `
    DATOS USUARIO:
    Objetivo: ${profile.goal}
    Nivel: ${profile.experience}
    Tipo: ${profile.trainingType}
    Respuesta a pregunta clave: ${profile.customAnswer}
    Lesiones: ${profile.injuries}
  `;
  parts.push({ text: userContext });

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview', 
    contents: { parts },
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      thinkingConfig: { thinkingBudget: 2048 }, 
      maxOutputTokens: 8192, 
    }
  });

  if (!response.text) throw new Error("No analysis response");
  return parseJSON(response.text);
};

/**
 * PHASE 3: VIDEO ANALYSIS - STRICT MODE (JUEZ IPF)
 * UPDATED: KNOWLEDGE BASE INTEGRATION FOR CAMERA ANGLES & EXERCISES
 */
export const analyzeVideoWithGemini = async (videoBase64: string, mimeType: string): Promise<VideoAnalysisResult> => {
  
  const systemInstruction = `
    Eres un Juez de Powerlifting Nivel IPF y Experto en Biomecánica. 
    Tu tarea es analizar videos de levantamientos aplicando una base de conocimientos técnica específica por ángulo de cámara.

    ### CRITERIOS DE ANÁLISIS POR EJERCICIO Y ÁNGULO

    #### 1. PESO MUERTO (CONVENCIONAL)
    - **Ángulo Lateral (Prioridad):**
        * Setup: Verificar barra sobre mediopié (alineada con tobillo), espalda neutra (sin flexión lumbar).
        * Movimiento: Eficiencia del despegue (sin balanceo), barra pegada al cuerpo, extensión de caderas completa.
    - **Ángulo Frontal:**
        * Setup: Alineación de pies con tobillos, ancho de hombros.
        * Movimiento: Trayecto de rodillas (evitar desplazamiento prematuro antes de cadera).

    #### 2. PESO MUERTO SUMO
    - **Ángulo Lateral:**
        * Setup: Alineación columna, evitar flexión lumbar, barra sobre mediopié.
        * Movimiento: Caderas no se elevan antes que rodillas, trayecto vertical recto, extensión de cadera completa.
    - **Ángulo Frontal:**
        * Setup: Pies más anchos que hombros, apertura de caderas, manos por dentro de las piernas.
        * Movimiento: Rodillas no colapsan hacia adelante al inicio.

    #### 3. SENTADILLA (BACK SQUAT)
    - **Ángulo Lateral (Prioridad ROM):**
        * Setup: Posición barra (Alta en trapecios / Baja en deltoides), ángulo de piernas.
        * Movimiento: PROFUNDIDAD (romper paralela), control de espalda, alineación cadera, tempo (bajada/subida).
    - **Ángulo Frontal (Prioridad Alineación):**
        * Setup: Simetría de pies.
        * Movimiento: EVITAR COLAPSO DE RODILLAS (Valgo), alineación rodilla-pie, movimiento simétrico de caderas.

    #### 4. PRESS DE BANCA
    - **Ángulo Lateral:**
        * Setup: Pies estables en el suelo, arco lumbar.
        * Movimiento: Ángulo de bajada al pecho, pausa completa (sin rebote), empuje estable, bloqueo final.
    - **Ángulo Frontal:**
        * Movimiento: Evitar que los codos colapsen hacia los lados (flare excesivo), verificar que los codos no se cierren demasiado.

    ### INSTRUCCIONES DE CONTEO Y EVALUACIÓN
    - **Detección de Ángulo:** Identifica si es Lateral, Frontal o 45º. Si el ángulo no permite ver un criterio (ej: profundidad desde el frente), indícalo en el feedback.
    - **Conteo Estricto:** Ignora el setup (caminar, ajustar cinturón). Solo cuenta repeticiones completas con fase excéntrica y concéntrica.
    - **Feedback Técnico:** Sé específico. Si es un error de seguridad, usa el tipo 'correction'. Si es mejora de rendimiento, 'optimization'.

    ### ESTRUCTURA DE SALIDA (JSON)
    {
      "exerciseName": "String", 
      "variant": "String (Ej: Sumo Deadlift)", 
      "repCount": Integer, 
      "repsTimeline": ["00:XX-00:YY", ...],
      "confidence": 99,
      "cameraAngle": "Lateral / Frontal / 45º",
      "setupDetails": [
         { "label": "Nombre del punto", "value": "Descripción", "status": "OK/ATTENTION", "recommendation": "Opcional", "shoppingQuery": "Opcional" }
      ],
      "metrics": {
         "depth": "Válida / Alta / N/A",
         "lockout": "Sólido / Soft / N/A",
         "rom": "Completo / Parcial",
         "tempo": "Ej: 2-0-1",
         "barPath": "Ej: Vertical",
         "stability": "Estable / Inestable"
      },
      "feedback": {
         "type": "correction/optimization", 
         "text": "Explicación técnica basada en la base de conocimientos...",
         "positive": ["..."],
         "negative": ["..."],
         "youtubeQuery": "..."
      }
    }
  `;

  const parts = [
    { inlineData: { mimeType: mimeType, data: videoBase64 } },
    { text: "Analiza el video aplicando los criterios de la base de conocimientos técnica para el ángulo detectado. Cuenta solo repeticiones válidas." }
  ];

  const response = await ai.models.generateContent({
    model: 'gemini-2.0-flash-exp', 
    contents: { parts },
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      maxOutputTokens: 8192,
    }
  });

  if (!response.text) throw new Error("No video analysis response");
  return parseJSON(response.text);
};
