import type { GeneratedScript } from "@/types";

/**
 * Export generated script to PDF using jsPDF
 */
export async function exportScriptToPDF(
  script: GeneratedScript,
  topic: string
): Promise<void> {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  let y = 20;

  const addText = (text: string, size = 11, bold = false) => {
    doc.setFontSize(size);
    doc.setFont("helvetica", bold ? "bold" : "normal");
    const lines = doc.splitTextToSize(text, pageWidth - margin * 2);
    if (y + lines.length * (size * 0.5) > doc.internal.pageSize.getHeight() - 20) {
      doc.addPage();
      y = 20;
    }
    doc.text(lines, margin, y);
    y += lines.length * (size * 0.45) + 4;
  };

  addText("ViralForge AI", 18, true);
  addText(`Topic: ${topic}`, 12);
  addText(`Generated: ${new Date().toLocaleDateString()}`, 10);
  y += 5;

  if (script.sections?.length) {
    addText("CINEMATIC 3-SECTION SPINE", 14, true);
    script.sections.forEach((sec) => {
      addText(sec.section, 12, true);
      addText(`Scene: ${sec.scene}`, 10);
      addText(`Voiceover: "${sec.voiceover}"`, 10);
      addText(`Camera: ${sec.camera}`, 10);
      addText(`Subtitle: ${sec.subtitle}`, 10);
      addText(`Music: ${sec.music}`, 10);
      addText(`Transition: ${sec.transition}`, 10);
      y += 2;
    });
  }

  addText("VIRAL HOOK", 14, true);
  addText(script.hook, 11);
  y += 3;

  addText("FULL SCRIPT", 14, true);
  script.script.forEach((scene, i) => {
    addText(`Scene ${i + 1} (${scene.duration})`, 12, true);
    addText(`Visual: ${scene.scene}`, 10);
    addText(`Voiceover: "${scene.voiceover}"`, 10);
    if (scene.camera_angle) addText(`Camera: ${scene.camera_angle}`, 10);
    y += 2;
  });

  addText("CAPTION", 14, true);
  addText(script.caption, 11);
  addText("HASHTAGS", 14, true);
  addText(script.hashtags.join(" "), 10);
  addText("CTA", 14, true);
  addText(script.cta, 11);
  addText("THUMBNAIL IDEA", 14, true);
  addText(script.thumbnail_idea, 10);
  addText("MUSIC SUGGESTION", 14, true);
  addText(script.music_suggestion, 10);

  doc.save(`viralforge-${topic.slice(0, 30).replace(/\s+/g, "-")}.pdf`);
}
