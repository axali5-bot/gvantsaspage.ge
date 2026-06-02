// Receives an order webhook FROM samkaulebi.shop when a partner-pushed product
// is sold there, and records it in incoming_orders. The admin sees it live.
//
// This is a PUBLIC endpoint (no Supabase JWT — samkaulebi's server calls it,
// not a logged-in user). Security is an HMAC-SHA256 signature over the raw body
// using a shared secret (SAMKAULEBI_WEBHOOK_SECRET), sent in X-Samkaulebi-Signature.
// Deploy with verify_jwt = FALSE.
//
// Expected body:
// {
//   "order_id": "abc",
//   "items": [{ "product_id": "samkaulebi-id", "name": "...", "quantity": 2, "unit_price": 30 }],
//   "total": 60,
//   "customer": { "name": "...", "phone": "...", "address": "..." }
// }

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const WEBHOOK_SECRET = Deno.env.get("SAMKAULEBI_WEBHOOK_SECRET")!;

const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
const enc = new TextEncoder();

function hexToBytes(hex: string): Uint8Array {
  const clean = hex.trim().toLowerCase().replace(/^sha256=/, "");
  const out = new Uint8Array(clean.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(clean.substr(i * 2, 2), 16);
  }
  return out;
}

async function verifySignature(rawBody: string, signature: string): Promise<boolean> {
  if (!signature) return false;
  try {
    const key = await crypto.subtle.importKey(
      "raw",
      enc.encode(WEBHOOK_SECRET),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"],
    );
    return await crypto.subtle.verify("HMAC", key, hexToBytes(signature), enc.encode(rawBody));
  } catch {
    return false;
  }
}

serve(async (req) => {
  if (req.method !== "POST") return new Response("POST only", { status: 405 });

  const rawBody = await req.text();
  const signature = req.headers.get("X-Samkaulebi-Signature") ?? "";

  if (!(await verifySignature(rawBody, signature))) {
    return new Response(JSON.stringify({ error: "invalid signature" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  let payload: {
    order_id?: string;
    items?: Array<{ product_id?: string; name?: string; quantity?: number; unit_price?: number }>;
    total?: number;
    customer?: { name?: string; phone?: string; address?: string };
  };
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return new Response(JSON.stringify({ error: "bad json" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const rawItems = payload.items ?? [];

  // Resolve each samkaulebi product id back to our local product id (best-effort link).
  const samkaulebiIds = rawItems.map((i) => i.product_id).filter(Boolean) as string[];
  const idMap = new Map<string, string>();
  if (samkaulebiIds.length > 0) {
    const { data: maps } = await admin
      .from("samkaulebi_sync")
      .select("avon_product_id, samkaulebi_id")
      .in("samkaulebi_id", samkaulebiIds);
    for (const m of maps ?? []) idMap.set(m.samkaulebi_id, m.avon_product_id);
  }

  const items = rawItems.map((i) => ({
    samkaulebi_product_id: i.product_id ?? null,
    avon_product_id: i.product_id ? idMap.get(i.product_id) ?? null : null,
    name: i.name ?? "",
    quantity: i.quantity ?? 1,
    unit_price: i.unit_price ?? 0,
  }));

  // Idempotent: a retried webhook with the same order_id won't create a duplicate.
  const { error } = await admin
    .from("incoming_orders")
    .upsert(
      {
        samkaulebi_order_id: payload.order_id ?? null,
        items,
        total_price: payload.total ?? 0,
        customer_name: payload.customer?.name ?? null,
        customer_phone: payload.customer?.phone ?? null,
        customer_address: payload.customer?.address ?? null,
      },
      { onConflict: "samkaulebi_order_id", ignoreDuplicates: true },
    );

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
