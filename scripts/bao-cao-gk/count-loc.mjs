/**
 * Đếm dòng mã (LOC — số dòng vật lý, gồm dòng trống & comment) theo thư mục nguồn.
 * Chạy: node count-loc.mjs  → ghi loc-snapshot.json (dùng cho build PPTX/PDF).
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..", "..");

/** @param {string} p */
function shouldSkipDir(p) {
  return /[/\\](node_modules|dist|coverage|\.git)([/\\]|$)/i.test(p);
}

/**
 * @param {string} dir
 * @param {string[]} exts lower-case ext including dot
 * @param {(full: string) => boolean} [fileFilter]
 */
function listFiles(dir, exts, fileFilter) {
  /** @type {string[]} */
  const out = [];
  function walk(d) {
    let entries;
    try {
      entries = fs.readdirSync(d, { withFileTypes: true });
    } catch {
      return;
    }
    for (const e of entries) {
      const full = path.join(d, e.name);
      if (e.isDirectory()) {
        if (shouldSkipDir(full)) continue;
        walk(full);
      } else {
        const ext = path.extname(e.name).toLowerCase();
        if (!exts.includes(ext)) continue;
        if (fileFilter && !fileFilter(full)) continue;
        out.push(full);
      }
    }
  }
  walk(dir);
  return out;
}

/** @param {string} file */
function lineCount(file) {
  const raw = fs.readFileSync(file, "utf8");
  if (!raw) return 0;
  return raw.split(/\r?\n/).length;
}

/** @param {string[]} files */
function sumLines(files) {
  return files.reduce((s, f) => s + lineCount(f), 0);
}

const feProdFiles = listFiles(path.join(ROOT, "frontend", "src"), [".js", ".jsx"], (p) => !/\.test\./i.test(p));
const feTestFiles = listFiles(path.join(ROOT, "frontend", "src"), [".js", ".jsx"], (p) => /\.test\./i.test(p));
const beSrcFiles = listFiles(path.join(ROOT, "backend", "src"), [".js"]);
const beTestFiles = listFiles(path.join(ROOT, "backend", "tests"), [".js"]);

const locFeProd = sumLines(feProdFiles);
const locFeTest = sumLines(feTestFiles);
const locBeSrc = sumLines(beSrcFiles);
const locBeTest = sumLines(beTestFiles);
const locTotal = locFeProd + locFeTest + locBeSrc + locBeTest;

const snapshot = {
  measuredAt: new Date().toISOString().slice(0, 10),
  method: "Physical LOC (all lines including blanks and comments) via count-loc.mjs",
  frontend: {
    productionSrc: locFeProd,
    productionFiles: feProdFiles.length,
    testSrc: locFeTest,
    testFiles: feTestFiles.length,
  },
  backend: {
    src: locBeSrc,
    srcFiles: beSrcFiles.length,
    tests: locBeTest,
    testFiles: beTestFiles.length,
  },
  total: locTotal,
};

const outPath = path.join(__dirname, "loc-snapshot.json");
fs.writeFileSync(outPath, JSON.stringify(snapshot, null, 2), "utf8");
console.log("Wrote", outPath);
console.log(JSON.stringify(snapshot, null, 2));
