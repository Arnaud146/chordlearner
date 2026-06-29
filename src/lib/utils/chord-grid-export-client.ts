import {
  buildExportFilename,
  type ChordGridExportModel,
} from "@/lib/domain/export/chord-grid-export";

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = "noopener";
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function drawHeader(
  ctx: CanvasRenderingContext2D,
  model: ChordGridExportModel,
  pageIndex: number,
  totalPages: number,
): void {
  ctx.fillStyle = "#111827";
  ctx.font = "bold 28px serif";
  ctx.fillText(model.metadata.title, 72, 72);

  ctx.fillStyle = "#374151";
  ctx.font = "16px sans-serif";
  ctx.fillText(model.metadata.artistLabel, 72, 108);
  ctx.fillText(model.metadata.keyLabel, 72, 132);
  ctx.fillText(model.metadata.notationLabel, 72, 156);
  ctx.fillText(`Page ${pageIndex + 1}/${totalPages}`, 72, 180);
}

function drawPageLines(
  ctx: CanvasRenderingContext2D,
  lines: string[],
  top: number,
  lineHeight: number,
): void {
  ctx.fillStyle = "#111827";
  ctx.font = "bold 18px sans-serif";

  lines.forEach((line, index) => {
    const y = top + index * lineHeight;
    ctx.fillText(line, 72, y);
  });
}

export async function exportChordGridPdf(
  model: ChordGridExportModel,
): Promise<void> {
  try {
    const jsPdfModule = await import("jspdf");
    const PDF = jsPdfModule.jsPDF;
    const pdf = new PDF({ orientation: "portrait", unit: "pt", format: "a4" });

    const totalPages = model.pages.length;
    model.pages.forEach((pageLines, pageIndex) => {
      if (pageIndex > 0) {
        pdf.addPage("a4", "portrait");
      }

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(24);
      pdf.text(model.metadata.title, 56, 56);

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(12);
      pdf.text(model.metadata.artistLabel, 56, 82);
      pdf.text(model.metadata.keyLabel, 56, 100);
      pdf.text(model.metadata.notationLabel, 56, 118);
      pdf.text(`Page ${pageIndex + 1}/${totalPages}`, 56, 136);

      pdf.setFont("courier", "bold");
      pdf.setFontSize(13);
      pageLines.forEach((line, lineIndex) => {
        pdf.text(line, 56, 170 + lineIndex * 22);
      });
    });

    pdf.save(
      buildExportFilename({
        title: model.metadata.title,
        keyContext: model.keyContext,
        format: "pdf",
      }),
    );
  } catch {
    throw new Error("Unable to export the chart to PDF.");
  }
}

export async function exportChordGridPngPages(
  model: ChordGridExportModel,
): Promise<void> {
  try {
    const width = 1240;
    const height = 1754;
    const totalPages = model.pages.length;

    for (let pageIndex = 0; pageIndex < totalPages; pageIndex += 1) {
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        throw new Error("Canvas unavailable");
      }

      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, width, height);

      drawHeader(ctx, model, pageIndex, totalPages);
      drawPageLines(ctx, model.pages[pageIndex] ?? [], 230, 42);

      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob((value) => resolve(value), "image/png"),
      );

      if (!blob) {
        throw new Error("PNG generation failed");
      }

      triggerDownload(
        blob,
        buildExportFilename({
          title: model.metadata.title,
          keyContext: model.keyContext,
          format: "png",
          pageIndex,
          totalPages,
        }),
      );
    }
  } catch {
    throw new Error("Unable to export the chart to PNG.");
  }
}
