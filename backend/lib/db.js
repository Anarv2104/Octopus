// backend/lib/db.js
import fs from "fs/promises";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const FILE = path.join(DATA_DIR, "integrations.json");

async function ensureFile() {
  await fs.mkdir(DATA_DIR, { recursive: true }).catch(() => {});
  try { await fs.access(FILE); }
  catch { await fs.writeFile(FILE, JSON.stringify({}, null, 2), "utf8"); }
}

async function readAll() {
  await ensureFile();
  const txt = await fs.readFile(FILE, "utf8");
  try { return JSON.parse(txt || "{}"); } catch { return {}; }
}

async function writeAll(obj) {
  await ensureFile();
  await fs.writeFile(FILE, JSON.stringify(obj, null, 2), "utf8");
}

export async function getIntegration(uid, name) {
  const db = await readAll();
  return db?.[uid]?.[name] ?? null;
}

export async function setIntegration(uid, name, data) {
  const db = await readAll();
  if (!db[uid]) db[uid] = {};
  db[uid][name] = { ...(data || {}), updatedAt: Date.now() };
  await writeAll(db);
  return true;
}

export async function deleteIntegration(uid, name) {
  const db = await readAll();
  if (db?.[uid]?.[name]) {
    delete db[uid][name];
    if (Object.keys(db[uid]).length === 0) delete db[uid]; // tidy up
    await writeAll(db);
  }
  return true;
}