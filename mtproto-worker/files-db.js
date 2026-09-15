// Local link storage on the tablet. One plain SQLite file next to the worker,
// so the size limit is simply how much free space the device has.
// Uses Node's built-in sqlite (Node 22+) - no native build needed on Android.
import { DatabaseSync } from "node:sqlite";
import { mkdirSync, copyFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
export const DB_PATH = process.env["FILES_DB_PATH"] ?? join(here, "files.db");

export const db = new DatabaseSync(DB_PATH);

db.exec(`
  CREATE TABLE IF NOT EXISTS files (
    file_name TEXT,
    file_id   TEXT UNIQUE,
    file_size INTEGER DEFAULT 0,
    caption   TEXT,
    link      TEXT,
    username  TEXT,
    kind      TEXT DEFAULT 'file',
    added_at  TEXT DEFAULT (datetime('now'))
  );
  CREATE INDEX IF NOT EXISTS files_file_name_idx ON files (file_name);
`);

const insertStmt = db.prepare(
  `INSERT OR IGNORE INTO files (file_name, file_id, file_size, caption, link, username, kind)
   VALUES (?, ?, ?, ?, ?, ?, ?)`,
);

const searchStmt = db.prepare(
  `SELECT file_name, file_id, file_size, caption, link, username, kind
     FROM files
    WHERE file_name LIKE ? OR caption LIKE ?
    ORDER BY file_size DESC
    LIMIT ?`,
);

const countStmt = db.prepare(`SELECT COUNT(*) AS n FROM files`);

export function saveFile({ fileName, fileId, fileSize = 0, caption = "", link = null, username = null, kind = "file" }) {
  if (!fileId) return;
  insertStmt.run(fileName ?? "", String(fileId), Number(fileSize) || 0, caption ?? "", link, username, kind);
}

export function saveResults(results) {
  for (const result of results) {
    if (!result.link) continue;
    saveFile({
      fileName: result.title ?? "",
      fileId: `${result.username ?? result.title}:${result.messageId ?? "entity"}`,
      fileSize: result.members ?? 0,
      caption: result.snippet ?? "",
      link: result.link,
      username: result.username ?? null,
      kind: result.type ?? "message",
    });
  }
}

/** Local matches, returned in the same shape the bot expects. */
export function searchFiles(query, limit = 20) {
  const like = `%${query}%`;
  return searchStmt.all(like, like, limit).map((row) => ({
    type: row.kind ?? "file",
    title: row.file_name || row.username || "Saved link",
    username: row.username,
    snippet: row.caption ?? "",
    link: row.link,
    date: null,
    members: row.file_size ?? 0,
    messageId: null,
  }));
}

export function fileCount() {
  return countStmt.get()?.n ?? 0;
}

/** Timestamped copy inside ./backups so the file can be moved to another device. */
export function backup() {
  const dir = join(here, "backups");
  mkdirSync(dir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const target = join(dir, `files-${stamp}.db`);
  copyFileSync(DB_PATH, target);
  return target;
}
