import { jsPDF } from 'jspdf';
import { BiomechanicalAnalysis, UserProfile } from '../types';

export const generatePDF = (analysis: BiomechanicalAnalysis, profile: UserProfile) => {
  const doc = new jsPDF();
  const margin = 20;
  let y = margin;

  const checkPageBreak = (spaceNeeded: number) => {
    if (y + spaceNeeded > 280) {
      doc.addPage();
      y = margin;
    }
  };

  // Title
  doc.setFontSize(22);
  doc.setTextColor(79, 70, 229); // Indigo 600
  doc.text("FitSmart AI - Informe de Rutina", margin, y);
  y += 15;

  // Profile Summary
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Objetivo: ${profile.goal} | Nivel: ${profile.experience}`, margin, y);
  y += 6;
  doc.text(`Usuario: ${profile.age} años | ${profile.gender}`, margin, y);
  y += 15;

  // Score
  doc.setFontSize(14);
  doc.setTextColor(0);
  doc.text(`Puntuación de Rutina: ${analysis.score}/100`, margin, y);
  y += 10;

  // Summary
  checkPageBreak(30);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Resumen:", margin, y);
  y += 6;
  doc.setFont("helvetica", "normal");
  const summaryLines = doc.splitTextToSize(analysis.summary, 170);
  doc.text(summaryLines, margin, y);
  y += (summaryLines.length * 6) + 5;

  // Safety
  checkPageBreak(30);
  doc.setFont("helvetica", "bold");
  doc.text("Seguridad Biomecánica:", margin, y);
  y += 6;
  doc.setFont("helvetica", "normal");
  const safetyLines = doc.splitTextToSize(analysis.safetyAssessment, 170);
  doc.text(safetyLines, margin, y);
  y += (safetyLines.length * 6) + 10;

  // Warm Up Recommendations (New Section)
  if (analysis.warmUpRecommendations && analysis.warmUpRecommendations.length > 0) {
    checkPageBreak(40);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(79, 70, 229); // Use header color
    doc.text("Calentamiento Recomendado:", margin, y);
    doc.setTextColor(0); // Reset color
    y += 8;
    
    analysis.warmUpRecommendations.forEach(wu => {
      checkPageBreak(15);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text(`• ${wu.name}`, margin + 5, y);
      
      doc.setFont("helvetica", "normal");
      doc.text(wu.dosage, margin + 140, y);
      y += 5;
      
      doc.setFontSize(9);
      doc.setTextColor(80);
      const descLines = doc.splitTextToSize(wu.description, 160);
      doc.text(descLines, margin + 5, y);
      y += (descLines.length * 5) + 3;
      doc.setTextColor(0);
    });
    y += 5;
  }

  // Recommendations Table Header
  checkPageBreak(20);
  doc.setFillColor(240, 240, 240);
  doc.rect(margin, y, 170, 10, 'F');
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("Ejercicio Recomendado", margin + 2, y + 7);
  doc.text("Sets/Reps", margin + 70, y + 7);
  doc.text("Motivo del Cambio", margin + 110, y + 7);
  y += 12;

  // Recommendations Body
  doc.setFont("helvetica", "normal");
  analysis.modifications.forEach(mod => {
    
    const exerciseName = doc.splitTextToSize(mod.recommended, 65);
    const details = `${mod.sets} x ${mod.reps}`;
    const reason = doc.splitTextToSize(mod.reason, 60);
    
    // Calculate max height for this row
    const lines = Math.max(exerciseName.length, reason.length);
    const rowHeight = lines * 5 + 4;

    checkPageBreak(rowHeight);

    doc.text(exerciseName, margin + 2, y + 4);
    doc.text(details, margin + 70, y + 4);
    doc.text(reason, margin + 110, y + 4);
    
    y += rowHeight;
  });

  // Footer
  const pageCount = doc.internal.getNumberOfPages();
  for(let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text('Generado por FitSmart AI', margin, 285);
  }

  doc.save('FitSmart_Analisis.pdf');
};