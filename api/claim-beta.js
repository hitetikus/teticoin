const { db, verifyAuth } = require("./_lib/admin");

module.exports = async (req, res) => {
  if (req.method !== "POST") { res.status(405).json({ error: "Method not allowed" }); return; }

  const user = await verifyAuth(req);
  if (!user || !user.email) { res.status(401).json({ error: "Not signed in" }); return; }

  const key = user.email.toLowerCase().replace(/\./g, "_");
  const inviteRef = db.collection("betaInvites").doc(key);
  const planRef = db.collection("users").doc(user.uid).collection("data").doc("plan");
  const expiryRef = db.collection("users").doc(user.uid).collection("data").doc("planExpiry");

  try {
    const expiry = await db.runTransaction(async (tx) => {
      const inviteSnap = await tx.get(inviteRef);
      if (!inviteSnap.exists) return null;
      const { expiry } = inviteSnap.data();
      if (new Date(expiry) < new Date()) {
        tx.delete(inviteRef); // expired before they claimed it
        return null;
      }
      tx.set(planRef, { value: "beta", updatedAt: Date.now() });
      tx.set(expiryRef, { value: expiry, updatedAt: Date.now() });
      tx.delete(inviteRef);
      return expiry;
    });
    res.status(200).json({ expiry: expiry || null });
  } catch (e) {
    console.error("claim-beta error:", e);
    res.status(500).json({ error: "Could not claim invite" });
  }
};
