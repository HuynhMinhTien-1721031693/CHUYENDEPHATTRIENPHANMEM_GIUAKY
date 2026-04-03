# -*- coding: utf-8 -*-
"""Tạo docs/BAO_CAO.pdf từ docs/BAO_CAO.md (báo cáo giữa kỳ).

Khuyến nghị: dùng bộ BaoCao_GK (Word + PDF + PPT) — `cd scripts/bao-cao-gk && npm install && npm run build`.
"""
from __future__ import annotations

import re
import sys
from pathlib import Path
from xml.sax.saxutils import escape

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import cm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

ROOT = Path(__file__).resolve().parent.parent
MD_PATH = ROOT / "docs" / "BAO_CAO.md"
OUT_PATH = ROOT / "docs" / "BAO_CAO.pdf"

# Font hỗ trợ tiếng Việt trên Windows (ưu tiên phông dễ đọc, thân thiện trên màn hình)
FONT_CANDIDATES = [
    Path(r"C:\Windows\Fonts\segoeui.ttf"),
    Path(r"C:\Windows\Fonts\calibri.ttf"),
    Path(r"C:\Windows\Fonts\arial.ttf"),
]


def load_font() -> str:
    for p in FONT_CANDIDATES:
        if p.is_file():
            name = "ReportBody"
            pdfmetrics.registerFont(TTFont(name, str(p)))
            return name
    print("Không tìm thấy Segoe UI / Calibri / Arial. Cài font hoặc chỉnh FONT_CANDIDATES trong script.", file=sys.stderr)
    sys.exit(1)


def strip_frontmatter(text: str) -> str:
    if text.startswith("---"):
        end = text.find("\n---", 3)
        if end != -1:
            return text[end + 4 :].lstrip("\n")
    return text


def _is_table_separator_row(s: str) -> bool:
    s = s.strip()
    if "|" not in s:
        return False
    inner = s.strip("|")
    parts = [p.strip() for p in inner.split("|")]
    return all(p and set(p) <= set("-: ") for p in parts)


def consume_markdown_table(lines: list[str], start: int) -> tuple[list[list[str]], int] | None:
    """Trả về (rows, chỉ số dòng kế sau bảng) hoặc None."""
    if start + 1 >= len(lines):
        return None
    if "|" not in lines[start] or not _is_table_separator_row(lines[start + 1]):
        return None
    rows: list[list[str]] = []
    j = start
    while j < len(lines):
        s = lines[j].strip()
        if not s.startswith("|"):
            break
        if _is_table_separator_row(s):
            j += 1
            continue
        cells = [c.strip() for c in s.strip("|").split("|")]
        rows.append(cells)
        j += 1
    if len(rows) < 1:
        return None
    return rows, j


def md_to_flowables(body_font: str):
    raw = MD_PATH.read_text(encoding="utf-8")
    text = strip_frontmatter(raw)
    lines = text.splitlines()

    styles = getSampleStyleSheet()
    base = ParagraphStyle(
        "Body",
        parent=styles["Normal"],
        fontName=body_font,
        fontSize=11,
        leading=15,
        spaceAfter=7,
    )
    h1 = ParagraphStyle(
        "H1",
        parent=base,
        fontSize=16,
        leading=20,
        spaceAfter=10,
        spaceBefore=14,
        textColor=colors.HexColor("#c2410c"),
    )
    h2 = ParagraphStyle(
        "H2",
        parent=base,
        fontSize=13,
        leading=17,
        spaceAfter=8,
        spaceBefore=12,
        textColor=colors.HexColor("#1e3a5f"),
    )
    mono = ParagraphStyle(
        "Mono",
        parent=base,
        fontName="Courier",
        fontSize=9,
        leading=11,
        leftIndent=12,
        backColor=colors.HexColor("#f4f4f5"),
    )
    h3 = ParagraphStyle(
        "H3",
        parent=base,
        fontSize=12,
        leading=15,
        spaceAfter=6,
        spaceBefore=8,
    )

    def fmt_inline(s: str) -> str:
        s = escape(s)
        s = re.sub(r"\*\*(.+?)\*\*", r"<b>\1</b>", s)
        s = re.sub(r"`([^`]+)`", r"<font face='Courier'>\1</font>", s)
        return s

    story: list = []
    i = 0
    in_code = False
    code_buf: list[str] = []

    def flush_code():
        nonlocal code_buf
        if not code_buf:
            return
        block = escape("\n".join(code_buf))
        story.append(Paragraph(f"<font face='Courier' size='9'>{block}</font>", mono))
        story.append(Spacer(1, 0.2 * cm))
        code_buf = []

    while i < len(lines):
        line = lines[i]

        if line.strip().startswith("```"):
            if in_code:
                flush_code()
                in_code = False
            else:
                in_code = True
            i += 1
            continue

        if in_code:
            code_buf.append(line)
            i += 1
            continue

        if line.strip() == "---":
            story.append(Spacer(1, 0.3 * cm))
            i += 1
            continue

        if line.startswith("# "):
            story.append(Paragraph(escape(line[2:].strip()), h1))
            i += 1
            continue
        if line.startswith("## "):
            story.append(Paragraph(escape(line[3:].strip()), h2))
            i += 1
            continue
        if line.startswith("### "):
            story.append(Paragraph(escape(line[4:].strip()), h3))
            i += 1
            continue
        if line.startswith("|"):
            tbl = consume_markdown_table(lines, i)
            if tbl:
                rows, end_idx = tbl
                ncols = max(len(r) for r in rows)
                col_w = (17.4 * cm) / max(ncols, 1)
                data = []
                for row in rows:
                    padded = list(row) + [""] * (ncols - len(row))
                    data.append([Paragraph(fmt_inline(padded[k]), base) for k in range(ncols)])
                t = Table(data, colWidths=[col_w] * ncols)
                t.setStyle(
                    TableStyle(
                        [
                            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#e8edf4")),
                            ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
                            ("VALIGN", (0, 0), (-1, -1), "TOP"),
                            ("LEFTPADDING", (0, 0), (-1, -1), 6),
                            ("RIGHTPADDING", (0, 0), (-1, -1), 6),
                            ("TOPPADDING", (0, 0), (-1, -1), 4),
                            ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
                        ]
                    )
                )
                story.append(Spacer(1, 0.15 * cm))
                story.append(t)
                story.append(Spacer(1, 0.25 * cm))
                i = end_idx
                continue

        if not line.strip():
            story.append(Spacer(1, 0.15 * cm))
            i += 1
            continue

        story.append(Paragraph(fmt_inline(line), base))
        i += 1

    flush_code()
    return story


def main() -> None:
    if not MD_PATH.is_file():
        print(f"Không thấy {MD_PATH}", file=sys.stderr)
        sys.exit(1)
    font = load_font()
    doc = SimpleDocTemplate(
        str(OUT_PATH),
        pagesize=A4,
        leftMargin=1.8 * cm,
        rightMargin=1.8 * cm,
        topMargin=1.8 * cm,
        bottomMargin=1.8 * cm,
    )
    doc.build(md_to_flowables(font))
    print(f"OK: {OUT_PATH}")


if __name__ == "__main__":
    main()
