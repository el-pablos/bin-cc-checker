import Database, { type Database as DatabaseType } from "better-sqlite3";
import path from "path";

const dbPath = path.resolve(process.cwd(), "data.db");
const db: DatabaseType = new Database(dbPath);

db.pragma("journal_mode = WAL");

db.exec(`
  CREATE TABLE IF NOT EXISTS history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL,
    source TEXT NOT NULL,
    input TEXT,
    output TEXT,
    card_number TEXT,
    card_type TEXT,
    is_valid INTEGER,
    bin_result TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

export interface HistoryRecord {
  id: number;
  type: string;
  source: string;
  input: string | null;
  output: string | null;
  card_number: string | null;
  card_type: string | null;
  is_valid: number | null;
  bin_result: string | null;
  created_at: string;
}

export function addHistory(record: Omit<HistoryRecord, "id" | "created_at">) {
  const stmt = db.prepare(`
    INSERT INTO history (type, source, input, output, card_number, card_type, is_valid, bin_result)
    VALUES (@type, @source, @input, @output, @card_number, @card_type, @is_valid, @bin_result)
  `);
  return stmt.run(record);
}

export function getHistory(
  limit = 50,
  offset = 0,
  type?: string,
): HistoryRecord[] {
  if (type) {
    const stmt = db.prepare(
      "SELECT * FROM history WHERE type = ? ORDER BY created_at DESC LIMIT ? OFFSET ?",
    );
    return stmt.all(type, limit, offset) as HistoryRecord[];
  }
  const stmt = db.prepare(
    "SELECT * FROM history ORDER BY created_at DESC LIMIT ? OFFSET ?",
  );
  return stmt.all(limit, offset) as HistoryRecord[];
}

export function getHistoryCount(type?: string): number {
  if (type) {
    const stmt = db.prepare(
      "SELECT COUNT(*) as count FROM history WHERE type = ?",
    );
    return (stmt.get(type) as { count: number }).count;
  }
  const stmt = db.prepare("SELECT COUNT(*) as count FROM history");
  return (stmt.get() as { count: number }).count;
}

export function clearHistory() {
  db.exec("DELETE FROM history");
}

export default db;
