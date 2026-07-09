const crypto = require("crypto");
const { db } = require("./_lib/admin");

// Vercel auto-parses req.body by default — signature verification needs the
// exact raw bytes CHIP signed, so parsing must be turned off for this route.
module.exports.config = { api: { bodyParser: false } };

function readRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

function verifySignature(rawBody, signatureB64, publicKeyPem) {
  if (!signatureB64 || !publicKeyPem) return false;
  try {
    return crypto.createVerify("RSA-SHA256").update(rawBody).verify(publicKeyPem, signatureB64, "base64");
  } catch {
    return false;
  }
}

module.exports = async (req, res) => {
  if (req.method !== "POST") { res.status(405).end(); return; }

  const rawBody = await readRawBody(req);
  const signature = req.headers["x-signature"];
  const publicKey = (process.env.CHIP_WEBHOOK_PUBLIC_KEY || "").replace(/\\n/g, "\n");

  if (!verifySignature(rawBody, signature, publicKey)) {
    console.error("chip-webhook: bad signature");
    res.status(401).json({ error: "Invalid signature" });
    return;
  }

  let purchase;
  try { purchase = JSON.parse(rawBody.toString("utf8")); } catch {
    res.status(400).json({ error: "Bad payload" });
    return;
  }

  // Only act on a real successful payment
  if (purchase.status !== "paid") { res.status(200).json({ ok: true, skipped: purchase.status }); return; }

  const claimId = purchase.reference;
  if (!claimId) { res.status(200).json({ ok: true, skipped: "no reference" }); return; }

  const claimRef = db.collection("paymentClaims").doc(claimId);

  try {
    await db.runTransaction(async (tx) => {
      const claimSnap = await tx.get(claimRef);
      if (!claimSnap.exists) throw new Error(`unknown claim ${claimId}`);
      const claim = claimSnap.data();
      if (claim.status === "fulfilled") return; // already processed — idempotent

      const uid = claim.uid;
      const userDataRef = db.collection("users").doc(uid).collection("data");
      const planRef = userDataRef.doc("plan");
      const expiryRef = userDataRef.doc("planExpiry");
      const invoicesRef = userDataRef.doc("invoices");
      const [expirySnap, invoicesSnap] = await Promise.all([tx.get(expiryRef), tx.get(invoicesRef)]);
      const currentExpiry = expirySnap.exists ? expirySnap.data().value : null;
      const existingInvoices = invoicesSnap.exists ? (invoicesSnap.data().value || []) : [];

      const daysToAdd = claim.billing === "yearly" ? 365 : 30;
      const isExtension = !!(currentExpiry && new Date(currentExpiry) > new Date());
      const base = isExtension ? new Date(currentExpiry) : new Date();
      base.setDate(base.getDate() + daysToAdd);
      const newExpiry = base.toISOString();

      const invoice = {
        id: Date.now().toString(),
        date: new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }),
        plan: claim.plan,
        billing: claim.billing,
        amount: claim.billing === "yearly" ? "RM 269" : "RM 29",
        status: "Paid",
        expiry: newExpiry,
        paidAt: new Date().toISOString(),
      };

      tx.set(planRef, { value: claim.plan, updatedAt: Date.now() });
      tx.set(expiryRef, { value: newExpiry, updatedAt: Date.now() });
      tx.set(invoicesRef, { value: [...existingInvoices, invoice], updatedAt: Date.now() });
      tx.update(claimRef, { status: "fulfilled", fulfilledAt: Date.now(), expiry: newExpiry });
    });
    res.status(200).json({ ok: true });
  } catch (e) {
    console.error("chip-webhook processing error:", e);
    // 200 on unknown/duplicate claim so CHIP doesn't retry forever on bad data;
    // real transient failures should be investigated from the log above.
    res.status(200).json({ ok: false, error: String(e.message || e) });
  }
};
