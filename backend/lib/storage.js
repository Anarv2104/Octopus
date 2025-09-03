// backend/lib/storage.js
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

/** ---------- helpers ---------- */
function safeName(original = "file") {
  const base = String(original || "file").replace(/\s+/g, "_");
  const stamp = Date.now() + "-" + crypto.randomBytes(3).toString("hex");
  return `${stamp}-${base}`;
}

function guessContentType(filename = "") {
  const ext = path.extname(String(filename)).toLowerCase();
  const map = {
    ".pdf": "application/pdf",
    ".txt": "text/plain",
    ".md": "text/markdown",
    ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ".csv": "text/csv",
    ".json": "application/json",
    ".ppt": "application/vnd.ms-powerpoint",
    ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".webp": "image/webp",
  };
  return map[ext] || "application/octet-stream";
}

/** ---------- local driver ---------- */
const UPLOAD_DIR = path.join(process.cwd(), "uploads");

function ensureUploadsDir() {
  if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

function localPutFile(buffer, filename) {
  ensureUploadsDir();
  const key = safeName(filename);
  const abs = path.join(UPLOAD_DIR, key);
  fs.writeFileSync(abs, buffer);
  const base = (process.env.BACKEND_PUBLIC_URL || `http://localhost:${process.env.PORT || 3001}`).replace(/\/+$/,"");
  const url = `${base}/uploads/${key}`;
  return { url, key };
}

function localPublicUrl(key) {
  const base = (process.env.BACKEND_PUBLIC_URL || `http://localhost:${process.env.PORT || 3001}`).replace(/\/+$/,"");
  return `${base}/uploads/${key}`;
}

/** ---------- supabase driver ---------- */
function sbClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY; // service_role key
  if (!url || !key) throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  return createClient(url, key);
}
const BUCKET = process.env.SUPABASE_BUCKET || "octopus-uploads";
const URL_MODE = (process.env.SUPABASE_URL_MODE || "signed").toLowerCase(); // "signed" (default) or "public"
const SIGNED_EXPIRES = parseInt(process.env.SUPABASE_SIGNED_URL_EXPIRES || "3600", 10); // seconds

async function supabasePutFile(buffer, filename) {
  const supabase = sbClient();
  const key = safeName(filename);

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(key, buffer, {
      upsert: false,
      cacheControl: "3600",
      contentType: guessContentType(filename),
    });
  if (error) throw new Error(`Supabase upload failed: ${error.message}`);

  if (URL_MODE === "public") {
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(key);
    return { url: data.publicUrl, key };
  }

  // signed mode
  const { data, error: signErr } = await supabase
    .storage.from(BUCKET)
    .createSignedUrl(key, SIGNED_EXPIRES);
  if (signErr) throw new Error(`Supabase signed URL failed: ${signErr.message}`);
  return { url: data.signedUrl, key };
}

function supabasePublicUrl(key) {
  const supabase = sbClient();
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(key);
  return data.publicUrl;
}

async function supabaseSignedUrl(key, expires = SIGNED_EXPIRES) {
  const supabase = sbClient();
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(key, expires);
  if (error) throw new Error(`Supabase signed URL failed: ${error.message}`);
  return data.signedUrl;
}

/** ---------- public API ---------- */
export async function putFile(buffer, filename) {
  const driver = (process.env.STORAGE_DRIVER || "local").toLowerCase();
  return driver === "supabase"
    ? supabasePutFile(buffer, filename)
    : localPutFile(buffer, filename);
}

/** Returns a URL that is safe to show in UI (public or signed) */
export async function getBestUrlForKey(key) {
  const driver = (process.env.STORAGE_DRIVER || "local").toLowerCase();
  if (driver === "supabase") {
    return URL_MODE === "public" ? supabasePublicUrl(key) : await supabaseSignedUrl(key);
  }
  return localPublicUrl(key);
}

/** Re-issue a fresh signed URL (no-op for public/local) */
export async function getSignedUrl(key, expires = SIGNED_EXPIRES) {
  const driver = (process.env.STORAGE_DRIVER || "local").toLowerCase();
  if (driver === "supabase") {
    if (URL_MODE === "public") return supabasePublicUrl(key);
    return supabaseSignedUrl(key, expires);
  }
  return localPublicUrl(key);
}