const PDFDocument = require("pdfkit");

const MARGIN = 36;
const HEADER_BG = "#1e3a5f";
const HEADER_TEXT = "#ffffff";
const ROW_ALT = "#f4f6f9";
const BORDER = "#d0d7de";
const TEXT = "#24292f";
const MUTED = "#57606a";

const COLUMNS = [
  { key: "created", label: "Created", width: 88 },
  { key: "ageDays", label: "Age", width: 26 },
  { key: "status", label: "Status", width: 58 },
  { key: "priority", label: "Priority", width: 48 },
  { key: "category", label: "Category", width: 72 },
  { key: "district", label: "District", width: 62 },
  { key: "department", label: "Department", width: 58 },
  { key: "citizen", label: "Citizen", width: 68 },
  { key: "duplicate", label: "Duplicate", width: 52 },
];

function truncate(text, max = 80) {
  const s = text == null ? "" : String(text).replace(/\s+/g, " ").trim();
  if (s.length <= max) return s;
  return `${s.slice(0, max - 1)}…`;
}

function tableWidth() {
  return COLUMNS.reduce((sum, col) => sum + col.width, 0);
}

function drawTableHeader(doc, y) {
  const width = tableWidth();
  let x = MARGIN;
  doc.save();
  doc.rect(MARGIN, y, width, 20).fill(HEADER_BG);
  doc.fillColor(HEADER_TEXT).font("Helvetica-Bold").fontSize(8);
  for (const col of COLUMNS) {
    doc.text(col.label, x + 4, y + 6, { width: col.width - 8, lineBreak: false });
    x += col.width;
  }
  doc.restore();
  doc.fillColor(TEXT);
  return y + 20;
}

function drawTableRow(doc, row, y, alt) {
  const width = tableWidth();
  const values = COLUMNS.map(col => truncate(row[col.key], col.key === "category" ? 40 : 32));
  const heights = values.map((val, i) =>
    doc.heightOfString(val, { width: COLUMNS[i].width - 8, font: "Helvetica", fontSize: 8 })
  );
  const rowHeight = Math.max(16, ...heights) + 6;

  if (y + rowHeight > doc.page.height - MARGIN - 24) {
    doc.addPage({ size: "A4", layout: "landscape", margin: MARGIN });
    y = MARGIN;
    y = drawTableHeader(doc, y);
  }

  if (alt) {
    doc.save();
    doc.rect(MARGIN, y, width, rowHeight).fill(ROW_ALT);
    doc.restore();
  }

  doc.save();
  doc.rect(MARGIN, y, width, rowHeight).strokeColor(BORDER).lineWidth(0.5).stroke();
  doc.fillColor(TEXT).font("Helvetica").fontSize(8);

  let x = MARGIN;
  for (let i = 0; i < COLUMNS.length; i += 1) {
    const col = COLUMNS[i];
    doc.text(values[i], x + 4, y + 4, { width: col.width - 8, lineBreak: false });
    x += col.width;
  }
  doc.restore();

  return y + rowHeight;
}

function drawDetailBlock(doc, row, startY) {
  const pageBottom = doc.page.height - MARGIN - 20;
  let y = startY;
  const blockHeight = 58;
  if (y + blockHeight > pageBottom) {
    doc.addPage({ size: "A4", layout: "landscape", margin: MARGIN });
    y = MARGIN;
  }

  doc.save();
  doc.rect(MARGIN, y, doc.page.width - MARGIN * 2, blockHeight).fill("#fafbfc").stroke(BORDER);
  doc.restore();

  doc.font("Helvetica-Bold").fontSize(9).fillColor(TEXT);
  doc.text(
    `${row.category} · ${row.status} · ${row.priority} · ${row.district || "—"}`,
    MARGIN + 8,
    y + 8,
    { width: doc.page.width - MARGIN * 2 - 16 }
  );

  doc.font("Helvetica").fontSize(8).fillColor(MUTED);
  const meta = [
    `Created ${row.created}`,
    row.ageDays !== "" ? `${row.ageDays} days old` : null,
    row.department ? `Dept: ${row.department}` : null,
    row.citizen ? `Citizen: ${row.citizen}` : null,
    row.duplicate ? `Duplicate: ${row.duplicate}` : null,
  ]
    .filter(Boolean)
    .join("  ·  ");
  doc.text(meta, MARGIN + 8, y + 22, { width: doc.page.width - MARGIN * 2 - 16 });

  if (row.description) {
    doc.fillColor(TEXT);
    doc.text(truncate(row.description, 200), MARGIN + 8, y + 36, {
      width: doc.page.width - MARGIN * 2 - 16,
    });
  }

  if (row.mapLink) {
    doc.fillColor("#0969da");
    doc.text("Open map", MARGIN + 8, y + blockHeight - 14, { link: row.mapLink, underline: true });
  }

  doc.fillColor(TEXT);
  return y + blockHeight + 6;
}

/**
 * @param {{ rows: object[], generatedAt: Date, filterLines: string[], totalShown: number, capped: boolean }} opts
 * @returns {Promise<Buffer>}
 */
function buildReportsPdfBuffer({ rows, generatedAt, filterLines, totalShown, capped }) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", layout: "landscape", margin: MARGIN, autoFirstPage: true });
    const chunks = [];
    doc.on("data", chunk => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const generatedLabel = generatedAt.toLocaleString("en-GB", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });

    doc.font("Helvetica-Bold").fontSize(16).fillColor(TEXT).text("Smart City — Reports Export", MARGIN, MARGIN);
    doc.font("Helvetica").fontSize(9).fillColor(MUTED);
    doc.text(`Generated ${generatedLabel}`, MARGIN, MARGIN + 22);
    doc.text(`${totalShown} report${totalShown === 1 ? "" : "s"}${capped ? " (export limit reached)" : ""}`, MARGIN, MARGIN + 34);

    if (filterLines.length) {
      doc.text(`Filters: ${filterLines.join(" · ")}`, MARGIN, MARGIN + 46, {
        width: doc.page.width - MARGIN * 2,
      });
    }

    let y = MARGIN + (filterLines.length ? 68 : 56);

    doc.font("Helvetica-Bold").fontSize(11).fillColor(TEXT).text("Summary table", MARGIN, y);
    y += 18;
    y = drawTableHeader(doc, y);

    rows.forEach((row, index) => {
      y = drawTableRow(doc, row, y, index % 2 === 1);
    });

    if (rows.length) {
      doc.addPage({ size: "A4", layout: "landscape", margin: MARGIN });
      y = MARGIN;
      doc.font("Helvetica-Bold").fontSize(11).fillColor(TEXT).text("Report details", MARGIN, y);
      y += 20;
      for (const row of rows) {
        y = drawDetailBlock(doc, row, y);
      }
    }

    const range = doc.bufferedPageRange();
    for (let i = range.start; i < range.start + range.count; i += 1) {
      doc.switchToPage(i);
      doc.font("Helvetica").fontSize(8).fillColor(MUTED);
      doc.text(`Page ${i - range.start + 1} of ${range.count}`, MARGIN, doc.page.height - MARGIN + 8, {
        align: "left",
        width: doc.page.width - MARGIN * 2,
      });
    }

    doc.end();
  });
}

function labelLine(doc, y, label, value) {
  const contentWidth = doc.page.width - MARGIN * 2;
  doc.font("Helvetica-Bold").fontSize(9).fillColor(MUTED).text(label, MARGIN, y, { width: 110 });
  doc.font("Helvetica").fontSize(10).fillColor(TEXT).text(value || "—", MARGIN + 112, y, {
    width: contentWidth - 112,
  });
  const h = Math.max(
    doc.heightOfString(label, { width: 110 }),
    doc.heightOfString(value || "—", { width: contentWidth - 112 })
  );
  return y + h + 8;
}

/**
 * @param {{ row: object, generatedAt: Date }} opts
 * @returns {Promise<Buffer>}
 */
function buildSingleReportPdfBuffer({ row, generatedAt }) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", layout: "portrait", margin: MARGIN, autoFirstPage: true });
    const chunks = [];
    doc.on("data", chunk => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const generatedLabel = generatedAt.toLocaleString("en-GB", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });

    const contentWidth = doc.page.width - MARGIN * 2;

    doc.save();
    doc.rect(MARGIN, MARGIN, contentWidth, 52).fill(HEADER_BG);
    doc.fillColor(HEADER_TEXT).font("Helvetica-Bold").fontSize(14).text("Smart City — Report", MARGIN + 12, MARGIN + 12);
    doc.font("Helvetica").fontSize(9).text(`Generated ${generatedLabel}`, MARGIN + 12, MARGIN + 32);
    doc.restore();

    let y = MARGIN + 64;
    doc.font("Helvetica-Bold").fontSize(16).fillColor(TEXT).text(row.category || "Report", MARGIN, y, {
      width: contentWidth,
    });
    y += 28;

    y = labelLine(doc, y, "Report ID", row.id);
    y = labelLine(doc, y, "Created", row.created);
    y = labelLine(doc, y, "Status", row.status);
    y = labelLine(doc, y, "Priority", row.priority);
    y = labelLine(doc, y, "Department", row.department);
    y = labelLine(doc, y, "Duplicate", row.duplicate);
    y = labelLine(doc, y, "Area", [row.governorate, row.district].filter(Boolean).join(" · ") || "—");
    y = labelLine(doc, y, "Citizen", row.citizen);
    y = labelLine(doc, y, "Email", row.email);

    doc.font("Helvetica-Bold").fontSize(10).fillColor(TEXT).text("Description", MARGIN, y);
    y += 14;
    doc.font("Helvetica").fontSize(10).fillColor(TEXT).text(row.description || "—", MARGIN, y, { width: contentWidth });
    y += doc.heightOfString(row.description || "—", { width: contentWidth }) + 12;

    doc.font("Helvetica-Bold").fontSize(10).fillColor(TEXT).text("Location", MARGIN, y);
    y += 14;
    doc.font("Helvetica").fontSize(10).text(row.location || "—", MARGIN, y, { width: contentWidth });
    y += doc.heightOfString(row.location || "—", { width: contentWidth }) + 8;

    if (row.mapLink) {
      doc.fillColor("#0969da").text("Open in Google Maps", MARGIN, y, { link: row.mapLink, underline: true });
      y += 18;
    }

    if (row.note) {
      doc.fillColor(TEXT).font("Helvetica-Bold").fontSize(10).text("Admin note", MARGIN, y);
      y += 14;
      doc.font("Helvetica").fontSize(10).text(row.note, MARGIN, y, { width: contentWidth });
      y += doc.heightOfString(row.note, { width: contentWidth }) + 12;
    }

    if (row.imageLinks?.length) {
      if (y > doc.page.height - MARGIN - 80) {
        doc.addPage();
        y = MARGIN;
      }
      doc.font("Helvetica-Bold").fontSize(10).fillColor(TEXT).text("Photos", MARGIN, y);
      y += 14;
      doc.font("Helvetica").fontSize(9).fillColor("#0969da");
      for (const link of row.imageLinks.slice(0, 5)) {
        if (y > doc.page.height - MARGIN - 20) {
          doc.addPage();
          y = MARGIN;
        }
        doc.text(link, MARGIN, y, { link, underline: true, width: contentWidth });
        y += 14;
      }
    }

    doc.font("Helvetica").fontSize(8).fillColor(MUTED);
    doc.text("Attach this PDF when sharing via WhatsApp or email.", MARGIN, doc.page.height - MARGIN - 8, {
      width: contentWidth,
      align: "center",
    });

    doc.end();
  });
}

module.exports = { buildReportsPdfBuffer, buildSingleReportPdfBuffer, truncate };
