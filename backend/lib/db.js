// backend/lib/db.js
import path from "path";
import fs from "fs/promises";
import admin from "firebase-admin";

const DRIVER = (process.env.DB_DRIVER || "fs").toLowerCase(); // "fs" (default) | "firestore"

/* ---------------- FS driver (your current behavior) ---------------- */
const DATA_DIR = path.join(process.cwd(), "data");
const FILE = path.join(DATA_DIR, "integrations.json");

async function fsEnsureFile() {
  await fs.mkdir(DATA_DIR, { recursive: true }).catch(() => {});
  try { await fs.access(FILE); }
  catch { await fs.writeFile(FILE, JSON.stringify({}, null, 2), "utf8"); }
}
async function fsReadAll() {
  await fsEnsureFile();
  const txt = await fs.readFile(FILE, "utf8");
  try { return JSON.parse(txt || "{}"); } catch { return {}; }
}
async function fsWriteAll(obj) {
  await fsEnsureFile();
  await fs.writeFile(FILE, JSON.stringify(obj, null, 2), "utf8");
}

const fsDriver = {
  async getIntegration(uid, name) {
    const db = await fsReadAll();
    return db?.[uid]?.[name] ?? null;
  },
  async setIntegration(uid, name, data) {
    const db = await fsReadAll();
    if (!db[uid]) db[uid] = {};
    db[uid][name] = { ...(data || {}), updatedAt: Date.now() };
    await fsWriteAll(db);
    return true;
  },
  async deleteIntegration(uid, name) {
    const db = await fsReadAll();
    if (db?.[uid]?.[name]) {
      delete db[uid][name];
      if (Object.keys(db[uid]).length === 0) delete db[uid];
      await fsWriteAll(db);
    }
    return true;
  },
  async listIntegrations(uid) {
    const db = await fsReadAll();
    return db?.[uid] || {};
  },
};

/* ---------------- Firestore driver (deploy-safe) ---------------- */
function col(uid) {
  // Structure: integrations/{uid}/services/{serviceName}
  return admin.firestore().collection("integrations").doc(uid).collection("services");
}
const firestoreDriver = {
  async getIntegration(uid, name) {
    const snap = await col(uid).doc(name).get();
    return snap.exists ? snap.data() : null;
  },
  async setIntegration(uid, name, data) {
    await col(uid).doc(name).set({ ...(data || {}), updatedAt: Date.now() }, { merge: true });
    return true;
  },
  async deleteIntegration(uid, name) {
    await col(uid).doc(name).delete().catch(() => {});
    return true;
  },
  async listIntegrations(uid) {
    const qs = await col(uid).get();
    const out = {};
    qs.forEach((d) => (out[d.id] = d.data()));
    return out;
  },
};

/* ---------------- Select driver ---------------- */
const db = DRIVER === "firestore" ? firestoreDriver : fsDriver;

export const getIntegration   = db.getIntegration;
export const setIntegration   = db.setIntegration;
export const deleteIntegration = db.deleteIntegration;
export const listIntegrations  = db.listIntegrations;