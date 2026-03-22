import React, { useEffect, useState } from "react";
import { db, auth } from "./firebase";
import {
  collection,
  doc,
  setDoc,
  updateDoc,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider } from "firebase/auth";

const ROLES = {
  HOST: "host",
  COINMASTER: "coinmaster",
  PARTICIPANT: "participant",
};

export default function App() {
  const [user, setUser] = useState(null);
  const [sessionId, setSessionId] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [leaderboardVisible, setLeaderboardVisible] = useState(false);

  // =========================
  // AUTH
  // =========================
  useEffect(() => {
    onAuthStateChanged(auth, (u) => {
      setUser(u);
    });
  }, []);

  const loginGoogle = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  // =========================
  // CREATE SESSION
  // =========================
  const createSession = async () => {
    const id = Math.random().toString(36).substring(2, 7).toUpperCase();
    setSessionId(id);

    await setDoc(doc(db, "sessions", id), {
      hostId: user.uid,
      leaderboardVisible: false,
    });

    await setDoc(doc(db, "sessions", id, "participants", user.uid), {
      name: user.displayName || "Host",
      score: 0,
      role: ROLES.HOST,
      joinedAt: serverTimestamp(),
    });
  };

  // =========================
  // JOIN SESSION
  // =========================
  const joinSession = async () => {
    if (!sessionId) return;

    const uid = user?.uid || "guest_" + Math.random().toString(36).slice(2, 9);

    await setDoc(
      doc(db, "sessions", sessionId, "participants", uid),
      {
        name: user?.displayName || name,
        score: 0,
        role: ROLES.PARTICIPANT,
        joinedAt: serverTimestamp(),
      },
      { merge: true }
    );
  };

  // =========================
  // LISTEN SESSION
  // =========================
  useEffect(() => {
    if (!sessionId) return;

    const unsub = onSnapshot(
      collection(db, "sessions", sessionId, "participants"),
      (snap) => {
        const list = snap.docs.map((d) => ({
          uid: d.id,
          ...d.data(),
        }));

        setParticipants(list);

        // set current role
        const me = list.find((p) => p.uid === user?.uid);
        if (me) setRole(me.role);
      }
    );

    return () => unsub();
  }, [sessionId, user]);

  // =========================
  // ASSIGN COINMASTER
  // =========================
  const assignCoinmaster = async (uid) => {
    await updateDoc(doc(db, "sessions", sessionId, "participants", uid), {
      role: ROLES.COINMASTER,
    });
  };

  const removeCoinmaster = async (uid) => {
    await updateDoc(doc(db, "sessions", sessionId, "participants", uid), {
      role: ROLES.PARTICIPANT,
    });
  };

  // =========================
  // GIVE COIN
  // =========================
  const giveCoin = async (uid) => {
    if (!(role === ROLES.HOST || role === ROLES.COINMASTER)) return;

    const p = participants.find((x) => x.uid === uid);
    await updateDoc(doc(db, "sessions", sessionId, "participants", uid), {
      score: (p.score || 0) + 10,
    });
  };

  // =========================
  // TOGGLE LEADERBOARD
  // =========================
  const toggleLeaderboard = async () => {
    const ref = doc(db, "sessions", sessionId);
    await updateDoc(ref, {
      leaderboardVisible: !leaderboardVisible,
    });
  };

  // =========================
  // UI
  // =========================
  return (
    <div style={{ padding: 20 }}>
      <h2>Teticoin</h2>

      {!user && (
        <button onClick={loginGoogle}>Login Google</button>
      )}

      <div style={{ marginTop: 20 }}>
        <button onClick={createSession}>Create Session</button>
      </div>

      <div style={{ marginTop: 20 }}>
        <input
          placeholder="enter session code"
          value={sessionId}
          onChange={(e) => setSessionId(e.target.value.toUpperCase())}
        />
        <input
          placeholder="your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button onClick={joinSession}>Join</button>
      </div>

      {/* ================= HOST VIEW ================= */}
      {role === ROLES.HOST && (
        <div style={{ marginTop: 30 }}>
          <h3>Participants</h3>

          <button onClick={toggleLeaderboard}>
            Toggle Leaderboard
          </button>

          {participants.map((p) => (
            <div key={p.uid} style={{ marginTop: 10 }}>
              {p.name} ({p.score})

              {p.role === ROLES.COINMASTER ? (
                <button onClick={() => removeCoinmaster(p.uid)}>
                  Remove Coinmaster
                </button>
              ) : (
                <button onClick={() => assignCoinmaster(p.uid)}>
                  Assign Coinmaster
                </button>
              )}

              <button onClick={() => giveCoin(p.uid)}>+10</button>
            </div>
          ))}
        </div>
      )}

      {/* ================= PARTICIPANT VIEW ================= */}
      {role === ROLES.PARTICIPANT && (
        <div style={{ marginTop: 30 }}>
          <h3>Your Score</h3>

          {
            participants.find((p) => p.uid === user?.uid)?.score || 0
          }

          {/* ❌ NO RANK SHOWN */}
        </div>
      )}

      {/* ================= COINMASTER VIEW ================= */}
      {role === ROLES.COINMASTER && (
        <div style={{ marginTop: 30 }}>
          <h3>Coinmaster Panel</h3>

          {participants.map((p) => (
            <div key={p.uid}>
              {p.name} ({p.score})
              <button onClick={() => giveCoin(p.uid)}>+10</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}