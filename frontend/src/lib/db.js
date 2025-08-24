import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";
import { app } from "./firebase";
export const db = getFirestore(app);

export async function saveRun(uid, run) {
  await setDoc(doc(db, "users", uid, "runs", run.id), run, { merge: true });
}
export async function loadRun(uid, runId) {
  const snap = await getDoc(doc(db, "users", uid, "runs", runId));
  return snap.exists() ? snap.data() : null;
}