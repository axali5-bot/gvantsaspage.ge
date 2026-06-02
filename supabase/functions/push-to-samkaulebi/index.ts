// AVON2FLAME → samkaulebi.shop partner sync.
//
// One product at a time, action-driven (create | update | delete). The API key
// lives only in this function's secret (SAMKAULEBI_API_KEY) — never in the browser.
// Image fetch is source-agnostic: works whether image_url points at Supabase
// Storage today or Cloudflare R2 after the future migration.
//
// Auth: caller MUST be a logged-in AVON2FLAME admin (profiles.is_admin = true).
// The mapping table (samkaulebi_sync) is written with the service-role key.

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Vercel default domain — custom domain samkaulebi.shop is registered but not
// yet attached. Swap to https://samkaulebi.shop once the domain goes live.
const SAMKAULEBI_BASE = "https://samkaulebi-shop.vercel.app";
const API_KEY = Deno.env.get("SAMKAULEBI_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });

const partnerHeaders = {
  Authorization: `Bearer ${API_KEY}`,
  "Content-Type": "application/json",
};

// service-role client — writes the local mapping table (bypasses RLS)
const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

function imageType(url: string): { ct: string; ext: string } {
  const clean = url.split("?")[0].toLowerCase();
  if (clean.endsWith(".png")) return { ct: "image/png", ext: "png" };
  if (clean.endsWith(".webp")) return { ct: "image/webp", ext: "webp" };
  if (clean.endsWith(".avif")) return { ct: "image/avif", ext: "avif" };
  return { ct: "image/jpeg", ext: "jpg" };
}

// Download an image URL and re-upload it into samkaulebi's R2 (their API rejects
// external hotlinks — images must come from /api/partner/upload). Returns the
// public R2 URL, or null if the source image could not be fetched.
async function relayImage(imageUrl: string): Promise<string | null> {
  const imgRes = await fetch(imageUrl);
  if (!imgRes.ok) return null;
  const bytes = new Uint8Array(await imgRes.arrayBuffer());
  const { ct, ext } = imageType(imageUrl);

  const up = await fetch(`${SAMKAULEBI_BASE}/api/partner/upload`, {
    method: "POST",
    headers: partnerHeaders,
    body: JSON.stringify({ filename: `avon-${crypto.randomUUID()}.${ext}`, contentType: ct }),
  });
  const upData = await up.json();
  if (!up.ok) throw new Error(upData.error ?? "presign failed");

  const put = await fetch(upData.presignedUrl, {
    method: "PUT",
    headers: { "Content-Type": ct },
    body: bytes,
  });
  if (!put.ok) throw new Error("R2 upload failed");
  return upData.publicUrl as string;
}

async function isAdmin(req: Request): Promise<boolean> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return false;
  const userClient = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: { user } } = await userClient.auth.getUser();
  if (!user) return false;
  const { data } = await admin
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .maybeSingle();
  return !!data?.is_admin;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "POST only" }, 405);
  if (!(await isAdmin(req))) return json({ error: "admin only" }, 403);

  try {
    const body = await req.json();
    const action: "create" | "update" | "delete" = body.action ?? "create";

    // ---- DELETE ----
    if (action === "delete") {
      const avonId = body.avon_product_id;
      if (!avonId) return json({ error: "avon_product_id required" }, 400);

      const { data: map } = await admin
        .from("samkaulebi_sync")
        .select("samkaulebi_id")
        .eq("avon_product_id", avonId)
        .maybeSingle();
      if (!map) return json({ ok: true, skipped: "not synced" });

      const del = await fetch(`${SAMKAULEBI_BASE}/api/partner/products/${map.samkaulebi_id}`, {
        method: "DELETE",
        headers: partnerHeaders,
      });
      // 404 = already gone on their side → treat as success
      if (!del.ok && del.status !== 404) {
        const e = await del.json().catch(() => ({}));
        return json({ error: e.error ?? "remote delete failed" }, del.status);
      }
      await admin.from("samkaulebi_sync").delete().eq("avon_product_id", avonId);
      return json({ ok: true });
    }

    // ---- CREATE | UPDATE ----
    const p = body.product;
    if (!p?.avon_product_id) return json({ error: "product.avon_product_id required" }, 400);
    if (!p.name_ka || p.price == null) return json({ error: "name_ka and price required" }, 400);

    const { data: existing } = await admin
      .from("samkaulebi_sync")
      .select("samkaulebi_id")
      .eq("avon_product_id", p.avon_product_id)
      .maybeSingle();

    // image is best-effort — a product still syncs if its image can't be relayed
    let images: string[] | undefined;
    if (p.image_url) {
      try {
        const url = await relayImage(p.image_url);
        if (url) images = [url];
      } catch (_) { /* continue without image */ }
    }

    const payload: Record<string, unknown> = {
      name: p.name_ka,
      price: p.price,
      ...(p.name_en ? { name_en: p.name_en } : {}),
      ...(p.description_ka ? { description: p.description_ka } : {}),
      ...(p.stock_quantity != null ? { stock: p.stock_quantity } : {}),
      ...(images ? { images } : {}),
    };

    const res = existing
      ? await fetch(`${SAMKAULEBI_BASE}/api/partner/products/${existing.samkaulebi_id}`, {
          method: "PATCH",
          headers: partnerHeaders,
          body: JSON.stringify(payload),
        })
      : await fetch(`${SAMKAULEBI_BASE}/api/partner/products`, {
          method: "POST",
          headers: { ...partnerHeaders, "Idempotency-Key": p.avon_product_id },
          body: JSON.stringify(payload),
        });

    const data = await res.json();

    if (!res.ok) {
      if (existing) {
        await admin
          .from("samkaulebi_sync")
          .update({ status: "error", last_error: data.error ?? `HTTP ${res.status}` })
          .eq("avon_product_id", p.avon_product_id);
      }
      return json({ error: data.error ?? "samkaulebi rejected" }, res.status);
    }

    const samkaulebiId = data.id ?? existing?.samkaulebi_id;
    await admin.from("samkaulebi_sync").upsert({
      avon_product_id: p.avon_product_id,
      samkaulebi_id: samkaulebiId,
      status: "synced",
      last_error: null,
      last_synced_at: new Date().toISOString(),
    });

    return json({ ok: true, samkaulebi_id: samkaulebiId, status: data.status ?? "pending" });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});
