import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc, deleteDoc } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAiX_a13O3yozcbennFG9dms79tGagQTNw",
  authDomain: "teticoin.firebaseapp.com",
  projectId: "teticoin",
  storageBucket: "teticoin.firebasestorage.app",
  messagingSenderId: "522027732629",
  appId: "1:522027732629:web:c63a02c8423b237631159c",
  measurementId: "G-N81RFL38EN"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// ── Storage helpers (drop-in replacements for artifact storage) ──
// All data stored under users/{uid}/data/{key}

export async function fsGet(uid, key) {
  try {
    const ref = doc(db, "users", uid, "data", key);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    return snap.data().value;
  } catch { return null; }
}

export async function fsSet(uid, key, value) {
  try {
    const ref = doc(db, "users", uid, "data", key);
    await setDoc(ref, { value, updatedAt: Date.now() });
  } catch(e) { console.error("fsSet error", e); }
}

export async function fsDel(uid, key) {
  try {
    const ref = doc(db, "users", uid, "data", key);
    await deleteDoc(ref);
  } catch {}
}

// Session polling — reads session by code (shared, not per-user)
export async function fsGetSession(code) {
  try {
    const ref = doc(db, "sessions", code);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    return snap.data();
  } catch { return null; }
}

export async function fsSetSession(code, data) {
  try {
    const ref = doc(db, "sessions", code);
    await setDoc(ref, data);
  } catch(e) { console.error("fsSetSession error", e); }
}
