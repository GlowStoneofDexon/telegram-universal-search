// Import an old JSON dump (e.g. exported from MongoDB Atlas) into files.db.
//   node migrate.js dump.json
// Accepts a JSON array or newline-delimited JSON, with keys:
//   file_name / fileName, file_id / fileId, file_size / fileSize, caption, link
import { readFileSync } from "node:fs";
import { db, saveFile, fileCount } from "./files-db.js";

const path = process.argv[2];
if (!path) {
  console.error("Usage: node migrate.js <dump.json>");
  process.exit(1);
}

const raw = readFileSync(path, "utf8").trim();
let rows;
try {
  rows = JSON.parse(raw);
  if (!Array.isArray(rows)) rows = [rows];
} catch {
  rows = raw
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

db.exec("BEGIN");
let imported = 0;
for (const row of rows) {
  const fileId = row.file_id ?? row.fileId ?? row._id?.$oid ?? row._id;
  if (!fileId) continue;
  saveFile({
    fileName: row.file_name ?? row.fileName ?? "",
    fileId,
    fileSize: row.file_size ?? row.fileSize ?? 0,
    caption: row.caption ?? "",
    link: row.link ?? null,
    username: row.username ?? null,
    kind: row.kind ?? "file",
  });
  imported += 1;
  if (imported % 50000 === 0) console.log(`imported ${imported}...`);
}
db.exec("COMMIT");

console.log(`Done. Processed ${imported} rows. files.db now holds ${fileCount()} records.`);
