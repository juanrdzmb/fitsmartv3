import { WorkoutSession, WorkoutSet } from "../types";

// Función simple para parsear CSV (maneja comillas básicas)
const parseCSVLine = (line: string): string[] => {
  const result = [];
  let start = 0;
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    if (line[i] === '"') {
      inQuotes = !inQuotes;
    } else if (line[i] === ',' && !inQuotes) {
      result.push(line.substring(start, i).replace(/^"|"$/g, '').trim());
      start = i + 1;
    }
  }
  result.push(line.substring(start).replace(/^"|"$/g, '').trim());
  return result;
};

export const parseWorkoutCSV = (csvText: string): WorkoutSession[] => {
  const lines = csvText.split(/\r?\n/).filter(line => line.trim() !== '');
  if (lines.length < 2) return [];

  const headers = parseCSVLine(lines[0].toLowerCase());
  
  // Detectar formato
  const isHevy = headers.includes('title') && headers.includes('weight_kg');
  const isStrong = headers.includes('workout name') && headers.includes('weight');
  
  // Mapear índices de columnas
  let dateIdx = -1, titleIdx = -1, exerciseIdx = -1, weightIdx = -1, repsIdx = -1, rpeIdx = -1;

  if (isHevy) {
    dateIdx = headers.indexOf('start_time');
    titleIdx = headers.indexOf('title');
    exerciseIdx = headers.indexOf('exercise_title');
    weightIdx = headers.indexOf('weight_kg');
    repsIdx = headers.indexOf('reps');
    rpeIdx = headers.indexOf('rpe');
  } else if (isStrong) {
    dateIdx = headers.indexOf('date');
    titleIdx = headers.indexOf('workout name');
    exerciseIdx = headers.indexOf('exercise name');
    weightIdx = headers.indexOf('weight');
    repsIdx = headers.indexOf('reps');
    rpeIdx = headers.indexOf('rpe');
  } else {
    // Intento genérico
    dateIdx = headers.findIndex(h => h.includes('date') || h.includes('fecha'));
    exerciseIdx = headers.findIndex(h => h.includes('exercise') || h.includes('ejercicio'));
    weightIdx = headers.findIndex(h => h.includes('weight') || h.includes('peso'));
    repsIdx = headers.findIndex(h => h.includes('reps') || h.includes('repeticiones'));
  }

  if (dateIdx === -1 || exerciseIdx === -1) return [];

  const sessionsMap: Record<string, WorkoutSession> = {};

  // Procesar líneas (saltando header)
  for (let i = 1; i < lines.length; i++) {
    const cols = parseCSVLine(lines[i]);
    if (cols.length < headers.length) continue;

    const rawDate = cols[dateIdx];
    // Simplificar fecha (YYYY-MM-DD o similar)
    const dateKey = rawDate.split(' ')[0]; 
    const workoutTitle = titleIdx !== -1 ? cols[titleIdx] : 'Entrenamiento';
    const exercise = cols[exerciseIdx];
    const weight = parseFloat(cols[weightIdx]) || 0;
    const reps = parseFloat(cols[repsIdx]) || 0;
    const rpe = rpeIdx !== -1 ? parseFloat(cols[rpeIdx]) : undefined;

    if (!sessionsMap[dateKey]) {
      sessionsMap[dateKey] = {
        date: dateKey,
        title: workoutTitle,
        sets: []
      };
    }

    sessionsMap[dateKey].sets.push({
      exercise,
      weight,
      reps,
      rpe,
      type: 'normal' // Por defecto
    });
  }

  // Convertir mapa a array y ordenar por fecha (más reciente primero)
  return Object.values(sessionsMap).sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );
};

export const formatWorkoutsForAI = (sessions: WorkoutSession[]): string => {
  // Tomamos las últimas 5 sesiones para no saturar el contexto
  const recent = sessions.slice(0, 5);
  
  let output = "HISTORIAL DE ENTRENAMIENTO (Últimas sesiones):\n";
  
  recent.forEach(session => {
    output += `\nFECHA: ${session.date} | TÍTULO: ${session.title}\n`;
    // Agrupar por ejercicio para que sea legible
    const exerciseMap: Record<string, string[]> = {};
    session.sets.forEach(set => {
      if (!exerciseMap[set.exercise]) exerciseMap[set.exercise] = [];
      exerciseMap[set.exercise].push(`${set.weight}kg x ${set.reps}${set.rpe ? ` @RPE${set.rpe}` : ''}`);
    });

    Object.entries(exerciseMap).forEach(([name, setStrings]) => {
      output += `- ${name}: ${setStrings.join(', ')}\n`;
    });
  });

  return output;
};