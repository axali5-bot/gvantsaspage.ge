// AI product fill for AVON2FLAME admin.
// Takes name_ka (required) + optional image_url.
// Returns name_en, name_ru, description_ka/en/ru using Gemini 2.5 Flash
// with Google Search grounding — same approach as samkaulebi.shop.
// Auth: AVON2FLAME admin JWT (profiles.is_admin).

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const ANON_KEY    = Deno.env.get("SUPABASE_ANON_KEY")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const GEMINI_KEY  = Deno.env.get("GEMINI_API_KEY");
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
  if (!GEMINI_KEY) return json({ error: "GEMINI_API_KEY secret არ არის სეთი" }, 503);

  const { name_ka, image_url } = await req.json();
  if (!name_ka?.trim()) return json({ error: "name_ka სავალდებულოა" }, 400);

  // Optionally inline the image as base64 for Gemini vision
  let inlineImage: { mime_type: string; data: string } | null = null;
  if (image_url) {
    try {
      const r = await fetch(image_url);
      if (r.ok) {
        const mime = r.headers.get("content-type") || "image/jpeg";
        const buf  = await r.arrayBuffer();
        const b64  = btoa(String.fromCharCode(...new Uint8Array(buf)));
        inlineImage = { mime_type: mime, data: b64 };
      }
    } catch { /* vision is best-effort */ }
  }

  const prompt =
    `შენ ხარ AVON2FLAME-ის კონტენტ-მენეჯერი. ეს ქართული სუნამოებისა და სილამაზის პროდუქტების ონლაინ მაღაზიაა.\n\n` +
    `პროდუქტი: "${name_ka.trim()}"\n` +
    (inlineImage ? `სურათი თანდართულია — ამოიცანი კონკრეტული პროდუქტი ეტიკეტიდან/შეფუთვიდან.\n` : "") +
    `\nგამოიყენე Google ძებნა ამ პროდუქტის შესახებ ზუსტი ინფორმაციის მოსაძებნად: ` +
    `არომატის ნოტები, ბრენდი, ინგრედიენტები, მახასიათებლები.\n\n` +
    `დაწერე გამყიდველი, ბუნებრივი, 2–4 წინადადებიანი e-commerce აღწერა სამ ენაზე.\n` +
    `თუ პროდუქტი ვერ ამოიცანი — აღწერე ის, რაც ცნობილია სახელიდან; ნუ მოიგონებ ფაქტებს.\n\n` +
    `დააბრუნე მხოლოდ ვალიდური JSON (სხვა ტექსტის, ახსნის ან ფენსების გარეშე):\n` +
    `{\n` +
    `  "name_en": "ზუსტი ინგლისური სახელი (ბრენდი + პროდუქტის სახელი)",\n` +
    `  "name_ru": "Точное русское название (бренд + название продукта)",\n` +
    `  "description_ka": "2-4 წინადადება ქართულად",\n` +
    `  "description_en": "2-4 sentences in English",\n` +
    `  "description_ru": "2-4 предложения по-русски"\n` +
    `}`;

  const parts: unknown[] = [{ text: prompt }];
  if (inlineImage) parts.push({ inline_data: inlineImage });

  const body = {
    contents: [{ parts }],
    tools: [{ google_search: {} }],
  };

  let r: Response;
  try {
    r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${GEMINI_KEY}`,
      { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }
    );
  } catch {
    return json({ error: "Gemini სერვისთან კავშირი ვერ მოხერხდა" }, 502);
  }

  if (!r.ok) {
    console.error("Gemini error:", await r.text());
    return json({ error: "AI მოთხოვნა ვერ შესრულდა" }, 502);
  }

  const data = await r.json();
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
