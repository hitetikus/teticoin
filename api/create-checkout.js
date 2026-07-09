const crypto = require("crypto");
const { db, verifyAuth } = require("./_lib/admin");

const CHIP_API_BASE = "https://gate.chip-in.asia/api/v1";
const SITE_URL = "https://teticoin.com";

// RM amounts in sen (smallest currency unit), must match PAYMENT_CONFIG.myr.pro in src/App.js
const PRO_PRICE = { monthly: 2900, yearly: 26900 };

module.exports = async (req, res) => {
  if (req.method !== "POST") { res.status(405).json({ error: "Method not allowed" }); return; }

  const user = await verifyAuth(req);
  if (!user) { res.status(401).json({ error: "Not signed in" }); return; }

  const { billing } = req.body || {};
  if (billing !== "monthly" && billing !== "yearly") {
    res.status(400).json({ error: "Invalid billing" });
    return;
  }

  const claimId = crypto.randomUUID();
  await db.collection("paymentClaims").doc(claimId).set({
    uid: user.uid,
    plan: "pro",
    billing,
    status: "pending",
    createdAt: Date.now(),
  });

  try {
    const chipRes = await fetch(`${CHIP_API_BASE}/purchases/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.CHIP_API_KEY}`,
      },
      body: JSON.stringify({
        brand_id: process.env.CHIP_BRAND_ID,
        client: {
          email: user.email || "",
          full_name: user.name || user.email || "Teticoin user",
        },
        purchase: {
          products: [{
            name: billing === "yearly" ? "Teticoin Pro (Yearly)" : "Teticoin Pro (Monthly)",
            price: PRO_PRICE[billing],
            quantity: 1,
          }],
          currency: "MYR",
        },
        reference: claimId,
        success_redirect: `${SITE_URL}/?payment=pending`,
        failure_redirect: `${SITE_URL}/?payment=cancel`,
      }),
    });

    if (!chipRes.ok) {
      const errText = await chipRes.text();
      console.error("CHIP purchase creation failed:", chipRes.status, errText);
      await db.collection("paymentClaims").doc(claimId).update({ status: "failed" });
      res.status(502).json({ error: "Could not start checkout" });
      return;
    }

    const purchase = await chipRes.json();
    res.status(200).json({ url: purchase.checkout_url });
  } catch (e) {
    console.error("create-checkout error:", e);
    await db.collection("paymentClaims").doc(claimId).update({ status: "failed" });
    res.status(500).json({ error: "Could not start checkout" });
  }
};
