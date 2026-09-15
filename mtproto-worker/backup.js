// Make a timestamped copy of files.db inside ./backups
//   node backup.js
import { backup, fileCount, DB_PATH } from "./files-db.js";

const target = backup();
console.log(`Backed up ${fileCount()} records from ${DB_PATH}`);
console.log(`Saved to: ${target}`);
console.log("Copy that single file to another device and rename it files.db to restore.");
