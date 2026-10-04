import Database from "better-sqlite3";

const DEFAULT_PATH = "./db/database.sqlite";

const file = new Database(process.env.DB_PATH || DEFAULT_PATH, {
  readonly: true,
});
const db = new Database(file.serialize());
file.close();

export default db;
