/**
 * Generador mínimo de libros Excel (.xlsx) sin dependencias externas.
 *
 * Construye un paquete OOXML (SpreadsheetML) real: un ZIP sin compresión
 * (método "store") con las partes `[Content_Types].xml`, `_rels`, `xl/workbook.xml`,
 * `xl/styles.xml`, `xl/worksheets/*.xml` y `xl/sharedStrings.xml`.
 *
 * Soporta celdas de texto, números, fórmulas y estilos institucionales
 * (azul marino y gris acero) con bordes y celdas de totales.
 */

export type XlsxCellValue =
  | { kind: "text"; value: string }
  | { kind: "number"; value: number }
  | { kind: "formula"; formula: string; cached?: number };

export interface XlsxCell {
  value: XlsxCellValue;
  /** Índice de estilo (ver `XLSX_STYLES`). */
  style?: number;
}

export type XlsxRow = XlsxCell[];

export interface XlsxSheet {
  name: string;
  rows: XlsxRow[];
  /** Ancho de columna en caracteres, indexado por posición (0 = columna A). */
  columnWidths?: number[];
  /** Filas (1-based) que se repiten al imprimir/desplazar. */
  freezeRows?: number;
}

/** Estilos predefinidos del libro institucional. */
export const XLSX_STYLES = {
  default: 0,
  title: 1,
  subtitle: 2,
  header: 3,
  label: 4,
  number: 5,
  totalLabel: 6,
  totalNumber: 7,
  section: 8,
} as const;

const NAVY = "FF1F3A5F";
const NAVY_DARK = "FF16293F";
const STEEL = "FFE8EDF3";
const STEEL_BORDER = "FFB4C0CE";
const WHITE = "FFFFFFFF";

interface StyleDef {
  font: { bold?: boolean; color?: string; size?: number };
  fill?: string;
  border?: boolean;
  align?: "left" | "center" | "right";
  numFmt?: string;
}

const STYLE_DEFS: StyleDef[] = [
  // 0 default
  { font: { size: 11 }, align: "left" },
  // 1 title
  { font: { bold: true, size: 14, color: NAVY_DARK }, align: "left" },
  // 2 subtitle
  { font: { size: 10, color: "FF5A6B7D" }, align: "left" },
  // 3 header
  {
    font: { bold: true, size: 11, color: WHITE },
    fill: NAVY,
    border: true,
    align: "center",
  },
  // 4 label
  { font: { size: 11 }, border: true, align: "left" },
  // 5 number
  { font: { size: 11 }, border: true, align: "right", numFmt: "#,##0" },
  // 6 total label
  {
    font: { bold: true, size: 11, color: NAVY_DARK },
    fill: STEEL,
    border: true,
    align: "left",
  },
  // 7 total number
  {
    font: { bold: true, size: 11, color: NAVY_DARK },
    fill: STEEL,
    border: true,
    align: "right",
    numFmt: "#,##0",
  },
  // 8 section
  {
    font: { bold: true, size: 11, color: NAVY_DARK },
    fill: STEEL,
    border: true,
    align: "left",
  },
];

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function columnName(index: number): string {
  let n = index;
  let name = "";
  while (n >= 0) {
    name = String.fromCharCode((n % 26) + 65) + name;
    n = Math.floor(n / 26) - 1;
  }
  return name;
}

function buildStylesXml(): string {
  const fonts = STYLE_DEFS.map((s) => {
    const attrs = [
      s.font.bold ? "<b/>" : "",
      s.font.size ? `<sz val="${s.font.size}"/>` : "",
      s.font.color ? `<color rgb="${s.font.color}"/>` : "",
      '<name val="Calibri"/>',
    ].join("");
    return `<font>${attrs}</font>`;
  }).join("");

  const fills = [
    '<fill><patternFill patternType="none"/></fill>',
    '<fill><patternFill patternType="gray125"/></fill>',
    ...STYLE_DEFS.map((s) =>
      s.fill
        ? `<fill><patternFill patternType="solid"><fgColor rgb="${s.fill}"/><bgColor indexed="64"/></patternFill></fill>`
        : '<fill><patternFill patternType="none"/></fill>',
    ),
  ].join("");

  const border = `<border><left style="thin"><color rgb="${STEEL_BORDER}"/></left><right style="thin"><color rgb="${STEEL_BORDER}"/></right><top style="thin"><color rgb="${STEEL_BORDER}"/></top><bottom style="thin"><color rgb="${STEEL_BORDER}"/></bottom></border>`;
  const borders = `<border/>${border}`;

  const numFmts = `<numFmts count="1"><numFmt numFmtId="164" formatCode="#,##0"/></numFmts>`;

  const cellXfs = STYLE_DEFS.map((s) => {
    const align = s.align
      ? `<alignment horizontal="${s.align}" vertical="center" wrapText="1"/>`
      : "";
    const numFmtId = s.numFmt ? 164 : 0;
    const borderId = s.border ? 1 : 0;
    return `<xf numFmtId="${numFmtId}" fontId="${STYLE_DEFS.indexOf(s)}" fillId="${s.fill ? STYLE_DEFS.indexOf(s) + 2 : 0}" borderId="${borderId}" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1" applyNumberFormat="1">${align}</xf>`;
  }).join("");

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
${numFmts}
<fonts count="${STYLE_DEFS.length}">${fonts}</fonts>
<fills count="${STYLE_DEFS.length + 2}">${fills}</fills>
<borders count="2">${borders}</borders>
<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
<cellXfs count="${STYLE_DEFS.length}">${cellXfs}</cellXfs>
<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>
</styleSheet>`;
}

interface SharedStrings {
  list: string[];
  index: Map<string, number>;
}

function sharedIndex(shared: SharedStrings, value: string): number {
  const existing = shared.index.get(value);
  if (existing !== undefined) return existing;
  const idx = shared.list.length;
  shared.list.push(value);
  shared.index.set(value, idx);
  return idx;
}

function buildSheetXml(sheet: XlsxSheet, shared: SharedStrings): string {
  const cols = sheet.columnWidths?.length
    ? `<cols>${sheet.columnWidths
        .map(
          (w, i) =>
            `<col min="${i + 1}" max="${i + 1}" width="${w}" customWidth="1"/>`,
        )
        .join("")}</cols>`
    : "";

  const pane = sheet.freezeRows
    ? `<sheetViews><sheetView workbookViewId="0"><pane ySplit="${sheet.freezeRows}" topLeftCell="A${sheet.freezeRows + 1}" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>`
    : "";

  const rows = sheet.rows
    .map((row, r) => {
      const cells = row
        .map((cell, c) => {
          const ref = `${columnName(c)}${r + 1}`;
          const style = cell.style ?? 0;
          const s = style ? ` s="${style}"` : "";
          const v = cell.value;
          if (v.kind === "text") {
            if (v.value === "") return `<c r="${ref}"${s}/>`;
            return `<c r="${ref}"${s} t="s"><v>${sharedIndex(shared, v.value)}</v></c>`;
          }
          if (v.kind === "number") {
            return `<c r="${ref}"${s}><v>${v.value}</v></c>`;
          }
          const cached = v.cached ?? 0;
          return `<c r="${ref}"${s}><f>${escapeXml(v.formula)}</f><v>${cached}</v></c>`;
        })
        .join("");
      return `<row r="${r + 1}">${cells}</row>`;
    })
    .join("");

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
${pane}${cols}<sheetData>${rows}</sheetData></worksheet>`;
}

function buildSharedStringsXml(shared: SharedStrings): string {
  const items = shared.list
    .map((s) => `<si><t xml:space="preserve">${escapeXml(s)}</t></si>`)
    .join("");
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" count="${shared.list.length}" uniqueCount="${shared.list.length}">${items}</sst>`;
}

function buildWorkbookXml(sheets: XlsxSheet[]): string {
  const entries = sheets
    .map(
      (s, i) =>
        `<sheet name="${escapeXml(s.name)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`,
    )
    .join("");
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
<sheets>${entries}</sheets></workbook>`;
}

function buildContentTypes(sheets: XlsxSheet[]): string {
  const overrides = sheets
    .map(
      (_s, i) =>
        `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`,
    )
    .join("");
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
<Override PartName="/xl/sharedStrings.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sharedStrings+xml"/>
${overrides}</Types>`;
}

function buildRootRels(): string {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`;
}

function buildWorkbookRels(sheets: XlsxSheet[]): string {
  const sheetRels = sheets
    .map(
      (_s, i) =>
        `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`,
    )
    .join("");
  const stylesId = sheets.length + 1;
  const sharedId = sheets.length + 2;
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
${sheetRels}
<Relationship Id="rId${stylesId}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
<Relationship Id="rId${sharedId}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/sharedStrings" Target="sharedStrings.xml"/>
</Relationships>`;
}

/* ------------------------------- ZIP (store) ------------------------------ */

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) {
    crc = CRC_TABLE[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

interface ZipEntry {
  name: string;
  data: Uint8Array;
}

function buildZip(entries: ZipEntry[]): Uint8Array {
  const encoder = new TextEncoder();
  const chunks: Uint8Array[] = [];
  const central: Uint8Array[] = [];
  let offset = 0;

  for (const entry of entries) {
    const nameBytes = encoder.encode(entry.name);
    const crc = crc32(entry.data);
    const size = entry.data.length;

    const local = new Uint8Array(30 + nameBytes.length);
    const lv = new DataView(local.buffer);
    lv.setUint32(0, 0x04034b50, true);
    lv.setUint16(4, 20, true);
    lv.setUint16(6, 0, true);
    lv.setUint16(8, 0, true);
    lv.setUint16(10, 0, true);
    lv.setUint16(12, 0, true);
    lv.setUint32(14, crc, true);
    lv.setUint32(18, size, true);
    lv.setUint32(22, size, true);
    lv.setUint16(26, nameBytes.length, true);
    lv.setUint16(28, 0, true);
    local.set(nameBytes, 30);

    chunks.push(local, entry.data);

    const centralEntry = new Uint8Array(46 + nameBytes.length);
    const cv = new DataView(centralEntry.buffer);
    cv.setUint32(0, 0x02014b50, true);
    cv.setUint16(4, 20, true);
    cv.setUint16(6, 20, true);
    cv.setUint16(8, 0, true);
    cv.setUint16(10, 0, true);
    cv.setUint16(12, 0, true);
    cv.setUint16(14, 0, true);
    cv.setUint32(16, crc, true);
    cv.setUint32(20, size, true);
    cv.setUint32(24, size, true);
    cv.setUint16(28, nameBytes.length, true);
    cv.setUint16(30, 0, true);
    cv.setUint16(32, 0, true);
    cv.setUint16(34, 0, true);
    cv.setUint16(36, 0, true);
    cv.setUint32(38, 0, true);
    cv.setUint32(42, offset, true);
    centralEntry.set(nameBytes, 46);
    central.push(centralEntry);

    offset += local.length + size;
  }

  const centralSize = central.reduce((sum, c) => sum + c.length, 0);
  const end = new Uint8Array(22);
  const ev = new DataView(end.buffer);
  ev.setUint32(0, 0x06054b50, true);
  ev.setUint16(4, 0, true);
  ev.setUint16(6, 0, true);
  ev.setUint16(8, entries.length, true);
  ev.setUint16(10, entries.length, true);
  ev.setUint32(12, centralSize, true);
  ev.setUint32(16, offset, true);
  ev.setUint16(20, 0, true);

  const total =
    chunks.reduce((sum, c) => sum + c.length, 0) + centralSize + end.length;
  const out = new Uint8Array(total);
  let pos = 0;
  for (const chunk of chunks) {
    out.set(chunk, pos);
    pos += chunk.length;
  }
  for (const chunk of central) {
    out.set(chunk, pos);
    pos += chunk.length;
  }
  out.set(end, pos);
  return out;
}

/* --------------------------------- API ----------------------------------- */

/** Construye el binario de un libro .xlsx a partir de sus hojas. */
export function buildXlsx(sheets: XlsxSheet[]): Uint8Array {
  const encoder = new TextEncoder();
  const shared: SharedStrings = { list: [], index: new Map() };

  const entries: ZipEntry[] = [
    {
      name: "[Content_Types].xml",
      data: encoder.encode(buildContentTypes(sheets)),
    },
    { name: "_rels/.rels", data: encoder.encode(buildRootRels()) },
    { name: "xl/workbook.xml", data: encoder.encode(buildWorkbookXml(sheets)) },
    {
      name: "xl/_rels/workbook.xml.rels",
      data: encoder.encode(buildWorkbookRels(sheets)),
    },
    { name: "xl/styles.xml", data: encoder.encode(buildStylesXml()) },
  ];

  sheets.forEach((sheet, i) => {
    entries.push({
      name: `xl/worksheets/sheet${i + 1}.xml`,
      data: encoder.encode(buildSheetXml(sheet, shared)),
    });
  });

  entries.push({
    name: "xl/sharedStrings.xml",
    data: encoder.encode(buildSharedStringsXml(shared)),
  });

  return buildZip(entries);
}

/** Dispara la descarga del libro en el navegador. */
export function downloadXlsx(filename: string, sheets: XlsxSheet[]): void {
  const bytes = buildXlsx(sheets);
  const blob = new Blob([bytes.buffer as ArrayBuffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}
