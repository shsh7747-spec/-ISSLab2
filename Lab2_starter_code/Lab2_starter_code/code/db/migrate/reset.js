import sqlite3 from "sqlite3";
import { open } from "sqlite";

open({
  filename: "./db/database.sqlite",
  driver: sqlite3.Database,
}).then((db) => {
  db.migrate({ migrationsPath: "./db/migrate/" });
});
