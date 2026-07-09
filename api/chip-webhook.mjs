import crypto from "node:crypto";
import { db } from "./_lib/admin.js";
import { PRO_PRICE_RM } from "../src/pricing.config.js";

function verifySignature(rawBody, signatureB64, publicKeyPem) {
  if (!signatureB64 || !publicKeyPem) return false;
  try {
    return crypto.createVerify("RSA-SHA256").update(rawBody).verify(publicKeyPem, signatureB64, "base64");
  } catch {
    return false;
  }
}

// Uses the Fetch-API-style Node.js function export (fetch(request) -> Response)
// instead of the classic (req, res) handler — Vercel's classic handler doesn't
// reliably expose the untouched raw body bytes needed for signature
// verification, while request.text() here is guaranteed to be the real bytes.
export default {
  async fetch(request) {
    if (request.method !== "POST") return new Response(null, { status: 405 });

    const rawBody = await request.text();
    const signature = request.headers.get("x-signature");
    const publicKey = (process.env.CHIP_WEBHOOK_PUBLIC_KEY || "").replace(/\\n/g, "\n");

    if (!verifySignature(rawBody, signature, publicKey)) {
      console.error("chip-webhook: bad signature");
      return Response.json({ error: "Invalid signature" }, { status: 401 });
    }

    let purchase;
    try { purchase = JSON.parse(rawBody); } catch {
      return Response.json({ error: "Bad payload" }, { status: 400 });
    }

    // Only act on a real successful payment
    if (purchase.status !== "paid") return Response.json({ ok: true, skipped: purchase.status });

    const claimId = purchase.reference;
    if (!claimId) return Response.json({ ok: true, skipped: "no reference" });

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
          amount: claim.billing === "yearly" ? `RM ${PRO_PRICE_RM.yearly}` : `RM ${PRO_PRICE_RM.monthly}`,
          status: "Paid",
          expiry: newExpiry,
          paidAt: new Date().toISOString(),
        };

        tx.set(planRef, { value: claim.plan, updatedAt: Date.now() });
        tx.set(expiryRef, { value: newExpiry, updatedAt: Date.now() });
        tx.set(invoicesRef, { value: [...existingInvoices, invoice], updatedAt: Date.now() });
        tx.update(claimRef, { status: "fulfilled", fulfilledAt: Date.now(), expiry: newExpiry });
      });
      return Response.json({ ok: true });
    } catch (e) {
      console.error("chip-webhook processing error:", e);
      // 200 on unknown/duplicate claim so CHIP doesn't retry forever on bad data;
      // real transient failures should be investigated from the log above.
      return Response.json({ ok: false, error: String(e.message || e) });
    }
  },
};
