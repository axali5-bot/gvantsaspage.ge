// AI product fill for AVON2FLAME admin.
// Takes name_ka (required) + optional image_url.
// Returns name_en, name_ru, description_ka/en/ru using Gemini 2.5 Flash.
// Auth: AVON2FLAME admin JWT (profiles.is_admin).

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const ANON_KEY    = Deno.env.get("SUPABASE_ANON_KEY")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
// trim() — Secrets-ში კოპი-პასტისას \n მიჰყვება, Deno არ ასუფთავებს
const GEMINI_KEY  = Deno.env.get("GEMINI_API_KEY")?.trim();
const MODEL       = "gemini-2.5-flash";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { ...CORS, "Content-Type": "application/json" } });

const admin = createClient(SUPABASE_URL, SERVICE_KEY);

async function isAdmin(req: Request): Promise<boolean> {
  const auth = req.headers.get("Authorization");
  if (!auth) return false;
  const user = createClient(SUPABASE_URL, ANON_KEY, { global: { headers: { Authorization: auth } } });
  const { data: { user: u } } = await user.auth.getUser();
  if (!u) return false;
  const { data } = await admin.from("profiles").select("is_admin").eq("id", u.id).maybeSingle();
  return !!data?.is_admin;
}

/** Strip ```json fences and extract the first {...} block. */
function extractJson(text: string): Record<string, unknown> {
  let t = text.trim().replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  if (!t.startsWith("{")) {
    const a = t.indexOf("{"), b = t.lastIndexOf("}");
    if (a !== -1 && b !== -1) t = t.slice(a, b + 1);
  }
  try { return JSON.parse(t); } catch { return {}; }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "POST only" }, 405);
  if (!(await isAdmin(req))) return json({ error: "admin only" }, 403);
  if (!GEMINI_KEY) return json({ error: "GEMINI_API_KEY not set" }, 503);

  let body: { name_ka?: string; image_url?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  const { name_ka, image_url } = body;
  if (!name_ka?.trim()) return json({ error: "name_ka required" }, 400);

  const prompt = `You are a content manager for AVON2FLAME, a Georgian perfume e-commerce store.
Product name (Georgian): "${name_ka.trim()}"
${image_url ? "An image is attached — identify the specific product from its label/packaging.\n" : ""}Write a selling, natural, 2-4 sentence e-commerce description in 3 languages.
If you cannot identify the product, describe what is known from the name; do not invent facts.
Return ONLY valid JSON, no markdown fences:
{
  "name_en": "exact English brand + product name",
  "name_ru": "exact Russian brand + product name",
  "description_ka": "2-4 sentences in Georgian",
  "description_en": "2-4 sentences in English",
  "description_ru": "2-4 sentences in Russian"
}`;

  const parts: object[] = [{ text: prompt }];

  // Optionally inline the image as base64 for Gemini vision (best-effort)
  if (image_url) {
    try {
      const r = await fetch(image_url);
      if (r.ok) {
        const mime = r.headers.get("content-type") || "image/jpeg";
        const buf  = await r.arrayBuffer();
        const b64  = btoa(String.fromCharCode(...new Uint8Array(buf)));
        parts.push({ inline_data: { mime_type: mime, data: b64 } });
      }
    } catch { /* vision is best-effort */ }
  }

  const geminiRes = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${GEMINI_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts }] }),
    }
  );

  const geminiText = await geminiRes.text();
  if (!geminiRes.ok) {
    return json({ error: "Gemini failed", status: geminiRes.status, body: geminiText }, 500);
  }

  const data = JSON.parse(geminiText);
  const text = (data?.candidates?.[0]?.content?.parts ?? [])
    .map((p: { text?: string }) => p.text ?? "").join("").trim();
  const parsed = extractJson(text);
  const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");

  return json({
    name_en:        str(parsed.name_en),
    name_ru:        str(parsed.name_ru),
    description_ka: str(parsed.description_ka),
    description_en: str(parsed.description_en),
    description_ru: str(parsed.description_ru),
  });
});
