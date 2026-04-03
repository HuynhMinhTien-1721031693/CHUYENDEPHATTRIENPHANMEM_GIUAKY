import { readFileSync } from "fs";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType } from "docx";
import pptxgen from "pptxgenjs";
import { mdToPdf } from "md-to-pdf";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..", "..");
const MD_PATH = path.join(ROOT, "docs", "BaoCao_GK.md");
const CSS_PATH = path.join(ROOT, "docs", "bao-cao-gk-pdf.css");
const DOCX_PATH = path.join(ROOT, "docs", "BaoCao_GK.docx");
const PPTX_PATH = path.join(ROOT, "docs", "BaoCao_GK.pptx");
const PDF_PATH = path.join(ROOT, "docs", "BaoCao_GK.pdf");

/** Đọc kết quả `node count-loc.mjs` — nếu thiếu file thì trả về 0 (chạy count-loc trước khi build). */
function loadLocSnapshot() {
  const snapPath = path.join(__dirname, "loc-snapshot.json");
  try {
    const s = JSON.parse(readFileSync(snapPath, "utf8"));
    return {
      feProd: s.frontend.productionSrc,
      feTest: s.frontend.testSrc,
      feProdFiles: s.frontend.productionFiles,
      feTestFiles: s.frontend.testFiles,
      beSrc: s.backend.src,
      beTest: s.backend.tests,
      beSrcFiles: s.backend.srcFiles,
      beTestFiles: s.backend.testFiles,
      total: s.total,
      measuredAt: s.measuredAt,
      method: s.method || "",
    };
  } catch {
    return {
      feProd: 0,
      feTest: 0,
      feProdFiles: 0,
      feTestFiles: 0,
      beSrc: 0,
      beTest: 0,
      beSrcFiles: 0,
      beTestFiles: 0,
      total: 0,
      measuredAt: "—",
      method: "",
    };
  }
}

/**
 * Story point (Fibonacci) — ước lượng quy mô công việc, không tự động từ LOC.
 * Cập nhật khi chia nhỏ epic / thay đổi phạm vi.
 */
const STORY_POINTS = [
  ["Giao diện + SPA Task + Live hub + điều hướng", "8", "React, Vite, Router, localStorage"],
  ["WebRTC host/viewer + ICE buffer", "8", "Luồng media P2P, signaling"],
  ["Auth, vai trò admin/sysmanager, seed .env", "5", "Session, REST bảo vệ route"],
  ["Backend REST + WebSocket (ws)", "5", "Express, phòng live"],
  ["Kiểm thử tự động + báo cáo (MD/DOCX/PPT)", "5", "Jest, Vitest, script bao-cao-gk"],
];

function inlineRuns(text) {
  const runs = [];
  let last = 0;
  const re = /\*\*(.+?)\*\*/g;
  let m;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) {
      runs.push(new TextRun({ text: text.slice(last, m.index) }));
    }
    runs.push(new TextRun({ text: m[1], bold: true }));
    last = m.index + m[0].length;
  }
  if (last < text.length) {
    runs.push(new TextRun({ text: text.slice(last) }));
  }
  return runs.length ? runs : [new TextRun(text)];
}

function isTableSeparatorRow(line) {
  const t = line.replace(/\s/g, "");
  return /^\|[\-:|]+\|$/.test(t);
}

function parseTableRow(line) {
  return line
    .split("|")
    .slice(1, -1)
    .map((c) => c.trim());
}

function makeTable(rows, headerBold) {
  const numCols = Math.max(...rows.map((r) => r.length), 1);
  const tableRows = rows.map((cells, ri) => {
    const padded = [...cells];
    while (padded.length < numCols) padded.push("");
    return new TableRow({
      children: padded.map((c) => {
        const runs =
          ri === 0 && headerBold
            ? [new TextRun({ text: c.replace(/\*\*/g, ""), bold: true })]
            : inlineRuns(c);
        return new TableCell({
          children: [new Paragraph({ children: runs.length ? runs : [new TextRun("")] })],
        });
      }),
    });
  });
  return new Table({
    rows: tableRows,
    width: { size: 100, type: WidthType.PERCENTAGE },
  });
}

function parseMarkdownToDocx(md) {
  const lines = md.split(/\r?\n/);
  const children = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (line.trim() === "") {
      i++;
      continue;
    }
    if (line.startsWith("```")) {
      i++;
      const codeLines = [];
      while (i < lines.length && !lines[i].startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      if (i < lines.length) i++;
      children.push(
        new Paragraph({
          spacing: { after: 120 },
          shading: { fill: "F5F5F5" },
          children: [
            new TextRun({
              text: codeLines.join("\n"),
              font: "Consolas",
              size: 20,
            }),
          ],
        })
      );
      continue;
    }
    if (line.startsWith("|")) {
      const tableRows = [];
      while (i < lines.length && lines[i].startsWith("|")) {
        if (isTableSeparatorRow(lines[i])) {
          i++;
          continue;
        }
        tableRows.push(parseTableRow(lines[i]));
        i++;
      }
      if (tableRows.length) {
        children.push(makeTable(tableRows, true));
      }
      continue;
    }
    if (line.startsWith("# ")) {
      children.push(
        new Paragraph({
          heading: HeadingLevel.TITLE,
          spacing: { after: 200 },
          children: [new TextRun(line.slice(2))],
        })
      );
      i++;
      continue;
    }
    if (line.startsWith("## ")) {
      children.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 280, after: 140 },
          children: [new TextRun(line.slice(3))],
        })
      );
      i++;
      continue;
    }
    if (line.startsWith("### ")) {
      children.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 220, after: 100 },
          children: [new TextRun(line.slice(4))],
        })
      );
      i++;
      continue;
    }
    if (line.startsWith("#### ")) {
      children.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_3,
          spacing: { before: 180, after: 80 },
          children: [new TextRun(line.slice(5))],
        })
      );
      i++;
      continue;
    }
    if (line.startsWith("- ") || line.startsWith("* ")) {
      while (i < lines.length && (lines[i].startsWith("- ") || lines[i].startsWith("* "))) {
        const item = lines[i].slice(2);
        children.push(
          new Paragraph({
            bullet: { level: 0 },
            spacing: { after: 80 },
            children: inlineRuns(item),
          })
        );
        i++;
      }
      continue;
    }
    if (line.startsWith("---")) {
      i++;
      continue;
    }
    if (/^\d+\.\s/.test(line)) {
      const items = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\.\s+/, ""));
        i++;
      }
      items.forEach((item, idx) => {
        children.push(
          new Paragraph({
            spacing: { after: 100 },
            children: [new TextRun({ text: `${idx + 1}. `, bold: true }), ...inlineRuns(item)],
          })
        );
      });
      continue;
    }
    const paraLines = [line];
    i++;
    while (i < lines.length) {
      const L = lines[i];
      if (L.trim() === "") break;
      if (
        L.startsWith("#") ||
        L.startsWith("|") ||
        L.startsWith("- ") ||
        L.startsWith("* ") ||
        L.startsWith("```") ||
        L.startsWith("---") ||
        /^\d+\.\s/.test(L)
      ) {
        break;
      }
      paraLines.push(L);
      i++;
    }
    const paraText = paraLines.join(" ");
    children.push(
      new Paragraph({
        spacing: { after: 120 },
        children: inlineRuns(paraText),
      })
    );
  }
  return children;
}

async function buildDocx(md) {
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: parseMarkdownToDocx(md),
      },
    ],
  });
  const buf = await Packer.toBuffer(doc);
  await fs.writeFile(DOCX_PATH, buf);
  console.log("Wrote", DOCX_PATH);
}

function buildPptx() {
  const pptx = new pptxgen();
  pptx.layout = "LAYOUT_WIDE";
  pptx.author = "Huỳnh Minh Tiến";
  pptx.subject = "Báo cáo giữa kỳ — Web Live Stream";
  pptx.title = "Báo cáo GK — Web Live Stream";

  const loc = loadLocSnapshot();
  const pct = (n) => (loc.total > 0 ? ((100 * n) / loc.total).toFixed(1) : "0");

  const COLOR_TITLE = "0f172a";
  const COLOR_ACCENT = "1e40af";
  const COLOR_MUTED = "64748b";
  const FOOTER = "Huỳnh Minh Tiến · MSSV 1721031693 · Chuyên đề phát triển phần mềm";

  /** Số liệu lấy từ mã nguồn / cấu hình hiện tại (cập nhật khi đổi test hoặc cổng). */
  const METRICS = {
    testsBackend: 25,
    testsFrontend: 8,
    portBackend: 3001,
    portFrontend: 5173,
    maxViewersPerRoom: 20,
    roomCodeMin: 4,
    roomCodeMax: 64,
    feReact: "18.3",
    pkgVersion: "1.0.0",
  };

  function slideFooter(slide) {
    slide.addShape(pptx.ShapeType.line, {
      x: 0.5,
      y: 6.95,
      w: 12.33,
      h: 0,
      line: { color: "e2e8f0", width: 1 },
    });
    slide.addText(FOOTER, {
      x: 0.5,
      y: 7.05,
      w: 12.33,
      h: 0.35,
      fontSize: 9,
      color: COLOR_MUTED,
      fontFace: "Arial",
    });
  }

  function slideTitleBar(slide, titleText, subtitle) {
    slide.addShape(pptx.ShapeType.rect, {
      x: 0,
      y: 0,
      w: 13.34,
      h: 0.12,
      fill: { color: COLOR_ACCENT },
      line: { color: COLOR_ACCENT, transparency: 100 },
    });
    slide.addText(titleText, {
      x: 0.55,
      y: 0.38,
      w: 12.2,
      h: 0.65,
      fontSize: 24,
      bold: true,
      fontFace: "Arial",
      color: COLOR_TITLE,
    });
    if (subtitle) {
      slide.addText(subtitle, {
        x: 0.55,
        y: 0.95,
        w: 12.2,
        h: 0.35,
        fontSize: 11,
        fontFace: "Arial",
        color: COLOR_MUTED,
        italic: true,
      });
    }
  }

  const bulletSlide = (titleText, bullets, subtitle) => {
    const slide = pptx.addSlide();
    slideTitleBar(slide, titleText, subtitle || "");
    slide.addText(bullets.join("\n"), {
      x: 0.65,
      y: subtitle ? 1.45 : 1.25,
      w: 11.9,
      h: 5.35,
      fontSize: 14,
      valign: "top",
      fontFace: "Arial",
      bullet: { type: "bullet", indent: 18 },
      lineSpacingMultiple: 1.15,
    });
    slideFooter(slide);
  };

  /** Khung gợi ý chèn ảnh (ảnh chụp màn hình khi báo cáo / demo). */
  function imagePlaceholderSlide(title, lines, notes) {
    const slide = pptx.addSlide();
    slideTitleBar(slide, title, "Khu vực minh họa — chèn ảnh chụp màn hình (Insert → Pictures)");
    slide.addShape(pptx.ShapeType.roundRect, {
      x: 0.65,
      y: 1.35,
      w: 11.9,
      h: 4.85,
      fill: { color: "f8fafc" },
      line: { color: "94a3b8", width: 1.5, dashType: "dash" },
    });
    slide.addText(lines.join("\n"), {
      x: 1.2,
      y: 3.35,
      w: 10.8,
      h: 2.5,
      fontSize: 14,
      align: "center",
      valign: "middle",
      color: "475569",
      fontFace: "Arial",
    });
    if (notes) slide.addNotes(notes);
    slideFooter(slide);
  }

  // —— Trang bìa ——
  const sCover = pptx.addSlide();
  sCover.addShape(pptx.ShapeType.rect, {
    x: 0,
    y: 0,
    w: 13.34,
    h: 3.1,
    fill: { color: "1e3a8a" },
    line: { transparency: 100 },
  });
  sCover.addText("BÁO CÁO BÀI GIỮA KỲ", {
    x: 0.6,
    y: 1.05,
    w: 12,
    h: 0.9,
    fontSize: 32,
    bold: true,
    color: "ffffff",
    fontFace: "Arial",
  });
  sCover.addText("Chuyên đề phát triển phần mềm", {
    x: 0.6,
    y: 1.95,
    w: 12,
    h: 0.45,
    fontSize: 18,
    color: "e2e8f0",
    fontFace: "Arial",
  });
  sCover.addText("Đề tài: Web Live Stream\n(WebRTC + Signaling WebSocket)", {
    x: 0.6,
    y: 3.45,
    w: 12,
    h: 1,
    fontSize: 20,
    bold: true,
    color: COLOR_TITLE,
    fontFace: "Arial",
  });
  sCover.addText(
    [
      "Sinh viên: Huỳnh Minh Tiến",
      "MSSV: 1721031693",
      "Thời điểm: tháng 4/2026",
      "Mã nguồn & tài liệu: kèm repository GitHub",
    ].join("\n"),
    {
      x: 0.6,
      y: 4.75,
      w: 12,
      h: 1.6,
      fontSize: 14,
      color: COLOR_MUTED,
      fontFace: "Arial",
      lineSpacingMultiple: 1.25,
    }
  );
  slideFooter(sCover);

  // —— Mục lục / nội dung trình bày ——
  const sToc = pptx.addSlide();
  slideTitleBar(sToc, "Nội dung trình bày", "Cấu trúc slide — chuẩn trình bày nội bộ / báo cáo môn học");
  sToc.addTable(
    [
      [
        { text: "Nội dung", options: { bold: true, fill: { color: "e2e8f0" } } },
        { text: "Ghi chú", options: { bold: true, fill: { color: "e2e8f0" } } },
      ],
      ["Số liệu & chỉ số dự án", "Bảng chỉ số, testcase, LOC (pie), story point (Fibonacci)"],
      ["Mô tả sản phẩm & công nghệ", "Bullet có cấu trúc"],
      ["Minh họa hình ảnh", "Placeholder — chèn ảnh demo / terminal / sơ đồ"],
      ["Chạy thử, kết quả, quản trị", "Luồng demo + tài khoản seed"],
      ["Phụ lục", "Link GitHub, video YouTube"],
    ],
    {
      x: 0.55,
      y: 1.35,
      w: 12.2,
      colW: [5.2, 7],
      fontSize: 12,
      fontFace: "Arial",
      border: { type: "solid", color: "cbd5e1", pt: 1 },
      valign: "middle",
    }
  );
  sToc.addNotes(
    "Khi thuyết trình thực tế: có thể thêm số trang slide hoặc hyperlink giữa các mục trong bản Word/PDF."
  );
  slideFooter(sToc);

  // —— Bảng số liệu kỹ thuật ——
  const sMetrics = pptx.addSlide();
  slideTitleBar(sMetrics, "Số liệu kỹ thuật (đối chiếu mã nguồn)", "Dùng trong báo cáo / thuyết trình — cập nhật khi đổi cấu hình");
  sMetrics.addTable(
    [
      [
        { text: "Chỉ số", options: { bold: true, fill: { color: "1e40af" }, color: "ffffff" } },
        { text: "Giá trị", options: { bold: true, fill: { color: "1e40af" }, color: "ffffff" } },
        { text: "Nguồn / ghi chú", options: { bold: true, fill: { color: "1e40af" }, color: "ffffff" } },
      ],
      ["Test tự động backend (Jest)", String(METRICS.testsBackend), "npm test — backend/"],
      ["Test tự động frontend (Vitest)", String(METRICS.testsFrontend), "npm test — frontend/"],
      ["Cổng HTTP + WS backend", String(METRICS.portBackend), "backend/src/index.js"],
      ["Cổng dev frontend (Vite)", String(METRICS.portFrontend), "vite.config.js"],
      ["Viewer tối đa / phòng (demo)", String(METRICS.maxViewersPerRoom), "createLiveRooms({ maxViewersPerRoom })"],
      ["Độ dài mã phòng (ký tự)", `${METRICS.roomCodeMin} – ${METRICS.roomCodeMax}`, "roomCode.js + backend"],
      ["Phiên bản gói (demo)", `v${METRICS.pkgVersion}`, "package.json FE & BE"],
      ["React (frontend)", METRICS.feReact, "package.json frontend"],
      ["LOC — frontend (src, không *.test)", String(loc.feProd), `${loc.feProdFiles} file — scripts/bao-cao-gk/count-loc.mjs`],
      ["LOC — frontend (*.test)", String(loc.feTest), `${loc.feTestFiles} file`],
      ["LOC — backend/src", String(loc.beSrc), `${loc.beSrcFiles} file`],
      ["LOC — backend/tests", String(loc.beTest), `${loc.beTestFiles} file`],
      ["LOC — tổng (dòng vật lý)", String(loc.total), `Đo ngày ${loc.measuredAt}; gồm trống & comment`],
    ],
    {
      x: 0.55,
      y: 1.35,
      w: 12.2,
      colW: [3.6, 2.2, 6.4],
      fontSize: 11,
      fontFace: "Arial",
      border: { type: "solid", color: "cbd5e1", pt: 0.75 },
    }
  );
  slideFooter(sMetrics);

  // —— Biểu đồ: phân bổ testcase ——
  const sChart = pptx.addSlide();
  slideTitleBar(sChart, "Hình 1 — Số testcase tự động (Backend vs Frontend)", "Minh họa số liệu kiểm thử");
  sChart.addChart(
    pptx.ChartType.bar,
    [
      {
        name: "Số test case (ước lượng theo suite hiện tại)",
        labels: ["Backend (Jest)", "Frontend (Vitest)"],
        values: [METRICS.testsBackend, METRICS.testsFrontend],
      },
    ],
    {
      x: 0.85,
      y: 1.45,
      w: 7.2,
      h: 4.35,
      barDir: "col",
      showTitle: false,
      chartColors: ["1e40af", "0d9488"],
      valAxisMaxVal: Math.max(METRICS.testsBackend, METRICS.testsFrontend, 10) + 5,
      catAxisTitle: "Layer",
      valAxisTitle: "Số test",
    }
  );
  sChart.addText(
    [
      "Ý nghĩa:",
      `• Backend: ${METRICS.testsBackend} test (API, phòng live, v.v.).`,
      `• Frontend: ${METRICS.testsFrontend} test (logic + smoke UI).`,
      "",
      "Có thể chèn thêm ảnh chụp terminal `npm test` vào slide tiếp theo.",
    ].join("\n"),
    {
      x: 8.25,
      y: 1.55,
      w: 4.6,
      h: 4.2,
      fontSize: 11,
      fontFace: "Arial",
      valign: "top",
      color: COLOR_TITLE,
    }
  );
  slideFooter(sChart);

  // —— Biểu đồ tròn: phân bổ LOC (đo thực tế) ——
  const sPie = pptx.addSlide();
  slideTitleBar(
    sPie,
    "Hình 2 — Phân bổ LOC theo thành phần (đo thực tế)",
    `Nguồn: loc-snapshot.json · ${loc.measuredAt} · chạy: node count-loc.mjs`
  );
  if (loc.total > 0) {
    sPie.addChart(
      pptx.ChartType.pie,
      [
        {
          name: "Lines of code (physical lines)",
          labels: [
            `FE src (${pct(loc.feProd)}%)`,
            `FE test (${pct(loc.feTest)}%)`,
            `BE src (${pct(loc.beSrc)}%)`,
            `BE test (${pct(loc.beTest)}%)`,
          ],
          values: [loc.feProd, loc.feTest, loc.beSrc, loc.beTest],
        },
      ],
      {
        x: 0.65,
        y: 1.45,
        w: 5.6,
        h: 4.15,
        showPercent: true,
        showLegend: true,
        legendPos: "r",
        chartColors: ["2563eb", "38bdf8", "0f766e", "f59e0b"],
      }
    );
  } else {
    sPie.addText("Chưa có loc-snapshot.json — chạy: cd scripts/bao-cao-gk && node count-loc.mjs", {
      x: 0.65,
      y: 2,
      w: 11,
      h: 1,
      fontSize: 14,
      color: "b45309",
      fontFace: "Arial",
    });
  }
  sPie.addText(
    [
      "Định nghĩa LOC:",
      "• Đếm theo dòng vật lý (xuống dòng), gồm dòng trống và comment.",
      "• Phạm vi: frontend/src và backend/src + backend/tests.",
      "",
      `Tổng: ${loc.total} dòng.`,
      "",
      "Story point không suy ra từ LOC — xem slide tiếp theo.",
    ].join("\n"),
    {
      x: 6.45,
      y: 1.5,
      w: 6.35,
      h: 4.1,
      fontSize: 11,
      fontFace: "Arial",
      valign: "top",
    }
  );
  slideFooter(sPie);

  // —— Story point (ước lượng) ——
  const spTotal = STORY_POINTS.reduce((s, r) => s + Number(r[1]), 0);
  const sSp = pptx.addSlide();
  slideTitleBar(
    sSp,
    "Ước lượng Story point (Fibonacci)",
    "Quy mô công việc theo epic — dùng khi lập kế hoạch sprint / báo cáo effort (không tự động từ LOC)"
  );
  sSp.addTable(
    [
      [
        { text: "Hạng mục / epic", options: { bold: true, fill: { color: "334155" }, color: "ffffff" } },
        { text: "SP", options: { bold: true, fill: { color: "334155" }, color: "ffffff" } },
        { text: "Ghi chú", options: { bold: true, fill: { color: "334155" }, color: "ffffff" } },
      ],
      ...STORY_POINTS.map((r) => [r[0], r[1], r[2]]),
      [
        { text: "Tổng (tham chiếu)", options: { bold: true } },
        { text: String(spTotal), options: { bold: true } },
        { text: "Thang 1,2,3,5,8,13… — điều chỉnh theo nhóm", options: { italic: true, color: "64748b" } },
      ],
    ],
    {
      x: 0.55,
      y: 1.35,
      w: 12.2,
      colW: [5.4, 0.9, 5.9],
      fontSize: 11,
      fontFace: "Arial",
      border: { type: "solid", color: "cbd5e1", pt: 0.75 },
      valign: "middle",
    }
  );
  sSp.addNotes(
    "Story point phản ánh độ phức tạp + rủi ro + công sức tương đối, không tương đương giờ cố định. Có thể đối chiếu velocity sau 1–2 sprint."
  );
  slideFooter(sSp);

  // —— Placeholder ảnh ——
  imagePlaceholderSlide(
    "Hình 3 — Giao diện ứng dụng",
    [
      "[ Chèn ảnh chụp màn hình tại đây ]",
      "",
      "Gợi ý: trang chủ Task SPA (/), trang Phát trực tiếp (/live),",
      "màn Host (/host) hoặc Viewer đang xem luồng.",
    ],
    "Chụp full màn hình trình duyệt (PNG), Insert → Pictures → This Device, kéo vừa khung nét đứt."
  );
  imagePlaceholderSlide(
    "Hình 4 — Terminal: kiểm thử tự động",
    [
      "[ Chèn ảnh: npm test pass ]",
      "",
      "Chụp cửa sổ PowerShell / Terminal sau khi chạy",
      "backend: npm test  và  frontend: npm test",
    ],
    "Thể hiện số test passed và thời gian chạy — khớp bảng số liệu slide trước."
  );
  imagePlaceholderSlide(
    "Hình 5 — Sơ đồ kiến trúc / luồng WebRTC (tùy chọn)",
    [
      "[ Chèn ảnh PNG xuất từ mermaid.live nếu cần slide đẹp hơn ]",
      "",
      "Đã có sơ đồ khối + signaling ở 2 slide trước; trong Báo cáo: BaoCao_GK.md § III.3 (Mermaid).",
    ],
    "Copy mã Mermaid từ repo → https://mermaid.live → Export PNG → Insert."
  );

  bulletSlide(
    "I. Lời mở đầu",
    [
      "Ứng dụng phát — xem trực tiếp trên trình duyệt (camera/micro).",
      "Kỹ thuật cốt lõi: WebRTC (media P2P) + WebSocket (signaling).",
      "SPA Task + localStorage tại trang chủ; module phát live tại /live.",
      "Thể hiện Git/GitHub, React, Node.js, kiểm thử tự động.",
    ],
    "Tóm tắt mục tiêu đề tài"
  );

  bulletSlide(
    "II. Mô tả sản phẩm",
    [
      "Host: tạo mã phòng và link chia sẻ.",
      "Viewer: nhập mã hoặc mở link để xem luồng trực tiếp.",
      "Server: relay tín hiệu WebRTC; media không chuyển tiếp qua Node kiểu RTMP.",
      `Giới hạn demo: mã phòng ${METRICS.roomCodeMin}–${METRICS.roomCodeMax} ký tự; tối đa ${METRICS.maxViewersPerRoom} viewer/phòng.`,
    ],
    "Gắn với số liệu bảng"
  );

  bulletSlide(
    "III. Công nghệ & kiến trúc",
    [
      `Frontend: React ${METRICS.feReact}, Vite, React Router.`,
      "Realtime: WebRTC, STUN công khai.",
      "Backend: Node.js, Express, thư viện ws.",
      "REST: /api/room/.../exists, /api/health (có version).",
      "Test: Jest + Supertest (BE); Vitest + Testing Library (FE).",
      "Sơ đồ kiến trúc + sequence signaling: BaoCao_GK.md § III.3 (Mermaid) và slide tiếp theo.",
    ],
    "Chi tiết trong báo cáo Word/PDF"
  );

  const sArch = pptx.addSlide();
  slideTitleBar(
    sArch,
    "Kiến trúc & luồng WebRTC (sơ đồ khối)",
    "REST :3001 + WebSocket /live-signal — media RTP/SRTP P2P (STUN hỗ trợ ICE)"
  );
  sArch.addShape(pptx.ShapeType.roundRect, {
    x: 0.5,
    y: 1.42,
    w: 3.15,
    h: 1.95,
    fill: { color: "dbeafe" },
    line: { color: "1e40af", width: 1 },
  });
  sArch.addText("Trình duyệt Host\nHostLive · getUserMedia\nRTCPeerConnection", {
    x: 0.55,
    y: 1.55,
    w: 3.05,
    h: 1.7,
    fontSize: 11,
    align: "center",
    valign: "middle",
    fontFace: "Arial",
    color: COLOR_TITLE,
  });
  sArch.addShape(pptx.ShapeType.roundRect, {
    x: 4.35,
    y: 1.32,
    w: 4.05,
    h: 2.15,
    fill: { color: "ccfbf1" },
    line: { color: "0f766e", width: 1 },
  });
  sArch.addText(
    "Node.js :3001\nExpress REST  ·  WS /live-signal\nliveRooms: relay offer / answer / ICE",
    {
      x: 4.4,
      y: 1.42,
      w: 3.95,
      h: 1.95,
      fontSize: 10,
      align: "center",
      valign: "middle",
      fontFace: "Arial",
      color: COLOR_TITLE,
    }
  );
  sArch.addShape(pptx.ShapeType.roundRect, {
    x: 9.1,
    y: 1.42,
    w: 3.15,
    h: 1.95,
    fill: { color: "fef9c3" },
    line: { color: "b45309", width: 1 },
  });
  sArch.addText("Trình duyệt Viewer\nWatchLive\nRTCPeerConnection", {
    x: 9.15,
    y: 1.55,
    w: 3.05,
    h: 1.7,
    fontSize: 11,
    align: "center",
    valign: "middle",
    fontFace: "Arial",
    color: COLOR_TITLE,
  });
  sArch.addShape(pptx.ShapeType.line, {
    x: 3.65,
    y: 2.35,
    w: 0.65,
    h: 0,
    line: { color: "64748b", width: 2 },
  });
  sArch.addShape(pptx.ShapeType.line, {
    x: 8.35,
    y: 2.35,
    w: 0.7,
    h: 0,
    line: { color: "64748b", width: 2 },
  });
  sArch.addText("JSON signaling", {
    x: 3.35,
    y: 1.98,
    w: 1.25,
    h: 0.35,
    fontSize: 8,
    align: "center",
    color: COLOR_MUTED,
    fontFace: "Arial",
  });
  sArch.addText("JSON signaling", {
    x: 8.05,
    y: 1.98,
    w: 1.25,
    h: 0.35,
    fontSize: 8,
    align: "center",
    color: COLOR_MUTED,
    fontFace: "Arial",
  });
  sArch.addShape(pptx.ShapeType.leftRightArrow, {
    x: 1.0,
    y: 3.55,
    w: 10.75,
    h: 0.38,
    fill: { color: "2563eb" },
    line: { color: "1e3a8a", width: 1 },
  });
  sArch.addText("Luồng media RTP/SRTP trực tiếp (P2P) — không qua Node", {
    x: 1.0,
    y: 3.56,
    w: 10.75,
    h: 0.34,
    fontSize: 11,
    bold: true,
    align: "center",
    valign: "middle",
    fontFace: "Arial",
    color: "ffffff",
  });
  sArch.addShape(pptx.ShapeType.ellipse, {
    x: 5.85,
    y: 4.12,
    w: 1.85,
    h: 0.62,
    fill: { color: "e0e7ff" },
    line: { color: "4338ca", width: 1 },
  });
  sArch.addText("STUN (Google)", {
    x: 5.85,
    y: 4.2,
    w: 1.85,
    h: 0.48,
    fontSize: 10,
    align: "center",
    valign: "middle",
    fontFace: "Arial",
    color: COLOR_TITLE,
  });
  sArch.addText(
    "REST: GET /api/room/.../exists trước khi WS  ·  Dev signaling: ws://localhost:3001/live-signal",
    {
      x: 0.55,
      y: 4.88,
      w: 12.2,
      h: 0.5,
      fontSize: 10,
      fontFace: "Arial",
      color: COLOR_MUTED,
    }
  );
  slideFooter(sArch);

  const sSig = pptx.addSlide();
  slideTitleBar(
    sSig,
    "Signaling WebRTC — trình tự tóm tắt",
    "Khớp liveRooms.js (backend) và HostLive / WatchLive (frontend)"
  );
  sSig.addText(
    [
      "1. Host gửi host-start → server trả room-ready (roomId).",
      "2. Viewer gửi viewer-join → joined (viewerId) → host nhận viewer-joined.",
      "3. Host tạo offer (SDP) → relay → viewer; viewer trả answer → relay → host.",
      "4. ICE hai chiều: ice-host / ice-viewer; buffer nếu candidate đến trước khi SDP sẵn sàng.",
      "5. Sau thiết lập: media P2P. Sơ đồ sequence đầy đủ: BaoCao_GK.md § III.3.2 (Mermaid).",
    ].join("\n"),
    {
      x: 0.65,
      y: 1.35,
      w: 11.9,
      h: 5.2,
      fontSize: 13,
      valign: "top",
      fontFace: "Arial",
      lineSpacingMultiple: 1.22,
    }
  );
  slideFooter(sSig);

  bulletSlide(
    "IV. Chạy thử & demo",
    [
      `Terminal 1: backend → npm run dev (cổng ${METRICS.portBackend}).`,
      `Terminal 2: frontend → npm run dev (localhost:${METRICS.portFrontend}).`,
      `Kiểm thử: npm test — ${METRICS.testsBackend} + ${METRICS.testsFrontend} test (xem biểu đồ).`,
      "Demo: Host tạo phòng → Viewer vào bằng link/mã.",
      "Lưu ý: cùng Wi-Fi; một số mạng cần TURN.",
    ],
    "Thao tác demo cho video YouTube"
  );

  bulletSlide(
    "V — VIII. Kết quả & kết luận",
    [
      "Kết quả: luồng end-to-end, test tự động pass, mã nguồn GitHub.",
      "Hạn chế: chủ yếu STUN; HTTPS/wss khi triển khai thật.",
      "Hướng phát triển: TURN, quản lý phòng, UX mobile.",
      "Kết luận: đủ frontend — backend — signaling — kiểm thử — tài liệu.",
    ],
    "Kết nối với rubric môn học"
  );

  bulletSlide(
    "IX. Tài khoản quản trị",
    [
      "Đăng ký web: chỉ tạo user thường — không tạo sysmanager/admin trên web.",
      "Quản trị: khởi tạo qua backend/.env (SEED_*).",
      "Đăng nhập bằng email/mật khẩu đã cấu hình — không đăng ký mới cho quyền quản trị.",
    ],
    "Không đọc mật khẩu khi thuyết trình công khai"
  );

  const sLast = pptx.addSlide();
  slideTitleBar(sLast, "Phụ lục — Liên kết & tài liệu", "");
  sLast.addText(
    [
      "GitHub (mã nguồn)",
      "https://github.com/HuynhMinhTien-1721031693/CHUYENDEPHATTRIENPHANMEM_GIUAKY",
      "",
      "Video demo (YouTube)",
      "https://youtu.be/3nTMk1xiUGs",
      "",
      "Báo cáo chi tiết",
      "docs/BaoCao_GK.pdf · docs/BaoCao_GK.docx",
    ].join("\n"),
    {
      x: 0.65,
      y: 1.3,
      w: 11.9,
      h: 4.5,
      fontSize: 13,
      valign: "top",
      fontFace: "Arial",
    }
  );
  slideFooter(sLast);

  pptx.writeFile({ fileName: PPTX_PATH });
  console.log("Wrote", PPTX_PATH);
}

async function buildPdf() {
  await mdToPdf(
    { path: MD_PATH },
    {
      dest: PDF_PATH,
      pdf_options: {
        format: "A4",
        printBackground: true,
        margin: { top: "16mm", right: "14mm", bottom: "16mm", left: "14mm" },
      },
      stylesheet: [CSS_PATH],
      document_title: "BaoCao_GK_WebLiveStream",
    }
  );
  console.log("Wrote", PDF_PATH);
}

async function main() {
  const md = await fs.readFile(MD_PATH, "utf8");
  if (process.env.SKIP_DOCX === "1") {
    console.warn("SKIP_DOCX=1 — bỏ qua ghi BaoCao_GK.docx (đóng Word nếu cần xuất DOCX).");
  } else {
    await buildDocx(md);
  }
  buildPptx();
  await buildPdf();

  const oldPdf = path.join(ROOT, "docs", "BAO_CAO.pdf");
  try {
    await fs.unlink(oldPdf);
    console.log("Removed", oldPdf);
  } catch {
    // không có file cũ
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
