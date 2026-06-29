import { buildKeyboardRange } from "@/lib/domain/voicings/piano-layout";
import { buildExportFilename } from "@/lib/domain/export/chord-grid-export";
import type { ChordVoicingOptionRow } from "@/lib/types/db";

interface PracticePlanChord {
  symbol: string;
  occurrenceCount: number;
  notesMidi: number[];
  slashBassMidi: number | null;
  fingering: number[];
}

interface PracticePlanTransition {
  chords: string[];
  occurrences: number;
}

export interface PracticePlanExportModel {
  title: string;
  artist: string;
  key: string;
  notation: string;
  chords: PracticePlanChord[];
  transitions: PracticePlanTransition[];
}

const KEYBOARD = buildKeyboardRange(48, 84);
const WHITE_KEYS = KEYBOARD.filter((k) => !k.isBlack);
const BLACK_KEYS = KEYBOARD.filter((k) => k.isBlack);

const KEY_W = 6;
const KEY_H = 32;
const BLACK_H = 20;

function drawMiniPiano(
  pdf: InstanceType<typeof import("jspdf").jsPDF>,
  x: number,
  y: number,
  activeNotes: number[],
  slashBassMidi: number | null,
): void {
  const activeSet = new Set(activeNotes);

  for (let i = 0; i < WHITE_KEYS.length; i++) {
    const key = WHITE_KEYS[i];
    const kx = x + i * KEY_W;
    const isBass = slashBassMidi !== null && key.midi === slashBassMidi;
    const isActive = activeSet.has(key.midi);

    if (isBass) {
      pdf.setFillColor(80, 140, 220);
    } else if (isActive) {
      pdf.setFillColor(255, 160, 40);
    } else {
      pdf.setFillColor(255, 255, 255);
    }
    pdf.setDrawColor(180, 180, 180);
    pdf.rect(kx, y, KEY_W, KEY_H, "FD");
  }

  pdf.setDrawColor(0, 0, 0);
  for (const key of BLACK_KEYS) {
    const whiteIdx = WHITE_KEYS.findIndex((w) => w.midi > key.midi);
    const leftIdx = whiteIdx === -1 ? WHITE_KEYS.length - 1 : whiteIdx - 1;
    const kx = x + leftIdx * KEY_W + KEY_W - 2;
    const isBass = slashBassMidi !== null && key.midi === slashBassMidi;
    const isActive = activeSet.has(key.midi);

    if (isBass) {
      pdf.setFillColor(60, 110, 190);
    } else if (isActive) {
      pdf.setFillColor(200, 120, 0);
    } else {
      pdf.setFillColor(30, 30, 30);
    }
    pdf.rect(kx, y, 4, BLACK_H, "F");
  }

  pdf.setDrawColor(180, 180, 180);
}

export async function exportPracticePlanPdf(
  model: PracticePlanExportModel,
): Promise<void> {
  const jsPdfModule = await import("jspdf");
  const PDF = jsPdfModule.jsPDF;
  const pdf = new PDF({ orientation: "portrait", unit: "pt", format: "a4" });
  const pageW = pdf.internal.pageSize.getWidth();

  const marginL = 48;
  const marginR = 48;
  const contentW = pageW - marginL - marginR;
  let cursorY = 48;

  function checkPageBreak(needed: number) {
    const pageH = pdf.internal.pageSize.getHeight();
    if (cursorY + needed > pageH - 48) {
      pdf.addPage("a4", "portrait");
      cursorY = 48;
    }
  }

  // Header
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(22);
  pdf.text(model.title, marginL, cursorY + 22);
  cursorY += 30;

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(11);
  pdf.setTextColor(80, 80, 80);
  pdf.text(`${model.artist}  |  Key: ${model.key}  |  ${model.notation}`, marginL, cursorY + 11);
  pdf.setTextColor(0, 0, 0);
  cursorY += 24;

  // Separator
  pdf.setDrawColor(200, 190, 170);
  pdf.line(marginL, cursorY, pageW - marginR, cursorY);
  cursorY += 16;

  // Section: Chords
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(15);
  pdf.text("Accords a travailler", marginL, cursorY + 15);
  cursorY += 28;

  const cols = 3;
  const cardGap = 10;
  const cardW = Math.floor((contentW - cardGap * (cols - 1)) / cols);
  const cardH = 80;

  for (let i = 0; i < model.chords.length; i++) {
    const col = i % cols;
    const isNewRow = col === 0 && i > 0;
    if (isNewRow) cursorY += cardH + cardGap;
    if (col === 0) checkPageBreak(cardH + cardGap);

    const chord = model.chords[i];
    const cx = marginL + col * (cardW + cardGap);
    const cy = cursorY;

    // Card border — distinct color for slash bass chords
    pdf.setDrawColor(200, 190, 170);
    if (chord.slashBassMidi !== null) {
      pdf.setFillColor(245, 235, 220);
    } else {
      pdf.setFillColor(254, 252, 248);
    }
    pdf.roundedRect(cx, cy, cardW, cardH, 3, 3, "FD");

    // Chord symbol
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(14);
    pdf.setTextColor(30, 28, 24);
    pdf.text(chord.symbol, cx + 6, cy + 16);

    // Occurrence count
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    pdf.setTextColor(100, 90, 75);
    pdf.text(`${chord.occurrenceCount}x`, cx + cardW - 20, cy + 14);

    // Mini piano
    drawMiniPiano(pdf, cx + 6, cy + 22, chord.notesMidi, chord.slashBassMidi);

    // Fingering below piano
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    pdf.setTextColor(80, 70, 55);
    const fingeringText = chord.fingering.length > 0
      ? `Doigte: ${chord.fingering.join("-")}`
      : "";
    if (fingeringText) {
      pdf.text(fingeringText, cx + 6, cy + 22 + KEY_H + 10);
    }

    pdf.setTextColor(0, 0, 0);
  }

  // Move past last row of chords
  cursorY += cardH + cardGap + 8;

  // Section: Transitions
  checkPageBreak(40);
  pdf.setDrawColor(200, 190, 170);
  pdf.line(marginL, cursorY, pageW - marginR, cursorY);
  cursorY += 16;

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(15);
  pdf.text("Blocs de transition", marginL, cursorY + 15);
  cursorY += 28;

  for (let i = 0; i < model.transitions.length; i++) {
    const transition = model.transitions[i];
    const lineH = 22;
    checkPageBreak(lineH + 8);

    // Block label
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(10);
    pdf.setTextColor(50, 45, 35);
    pdf.text(`Bloc ${i + 1}`, marginL, cursorY + 10);

    // Occurrence badge
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    pdf.setTextColor(100, 90, 75);
    pdf.text(`${transition.occurrences}x`, marginL + 42, cursorY + 10);

    // Chord chain
    pdf.setFont("courier", "bold");
    pdf.setFontSize(11);
    pdf.setTextColor(30, 28, 24);
    const chain = transition.chords.join("  >  ");
    pdf.text(chain, marginL + 70, cursorY + 10);

    pdf.setTextColor(0, 0, 0);
    cursorY += lineH;
  }

  pdf.save(
    buildExportFilename({
      title: model.title,
      keyContext: model.key,
      format: "pdf",
    }).replace(".pdf", "-practice.pdf"),
  );
}
