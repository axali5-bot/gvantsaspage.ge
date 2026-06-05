// AI chat proxy for the AVON2FLAME storefront chatbot.
// Keeps the Gemini key server-side; builds the live product catalog into the
// system prompt; takes client-held history + the new message, returns the reply.
// Public (verify_jwt=false): the chatbot is an anonymous storefront feature.

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { GoogleGenerativeAI } from "npm:@google/generative-ai@0.21.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const ANON_KEY     = Deno.env.get("SUPABASE_ANON_KEY")!;
const GEMINI_KEY   = Deno.env.get("GEMINI_API_KEY")?.trim();
const MODEL        = "gemini-2.5-flash";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { ...CORS, "Content-Type": "application/json" } });

const BASE_INSTRUCTION = `შენ ხარ "Avon2Flame"-ის პრემიუმ პარფიუმერიის AI კონსულტანტი.
შენი მიზანია მომხმარებლებს დაეხმარო სუნამოს შერჩევაში ჩვენი რეალური კოლექციიდან, უპასუხო მათ შეკითხვებს ზრდილობიანად და პროფესიონალურად ქართულ ენაზე.

მნიშვნელოვანი წესები:
- ურჩიე მხოლოდ ქვემოთ მოცემული ჩვენი კოლექციიდან. არასოდეს მოიგონო პროდუქტი, რომელიც სიაში არ არის.
- როცა კონკრეტულ პროდუქტს ახსენებ, ყოველთვის მიუთითე ზუსტი ფასი (₾) და დაურთე დაჭერადი ბმული ზუსტად ამ ფორმატით: [პროდუქტის სახელი](/product/ID) — სადაც ID აიღე სიიდან.
- როცა მომხმარებელი აღწერს რას ეძებს (არომატი, განწყობა, საჩუქარი, ფასი), შესთავაზე 2-3 კონკრეტული შესაბამისი ვარიანტი ჩვენი კოლექციიდან, თითო ბმულით.
- თუ მომხმარებელი ეძებს რაღაცას, რაც კოლექციაში არ გვაქვს, გულწრფელად უთხარი და შესთავაზე ყველაზე ახლომდგომი ალტერნატივა ჩვენი კოლექციიდან.
- თუ პროდუქტი ამოწურულია, შეგიძლია ახსენო, ოღონდ აღნიშნე რომ ამჟამად მარაგში არ არის.
- თუ ფასს ან დეტალს მაინც ვერ პოულობ, შესთავაზე მოგვწერონ Facebook-ზე (Avon2Flame).

სტილი:
- პასუხები იყოს მოკლე, ფოკუსირებული და დასრულებული — ნუ გადატვირთავ ტექსტით. მაქსიმუმ 2-3 პროდუქტი ერთ პასუხში, თითო მოკლე წინადადებით.
- არასოდეს გამოიყენო კოდის ბლოკები (\`\`\`).
- გამოიყენე markdown: ბმულები, თამამი ტექსტი (**) და სიები (-).
- თბილი სმაილები ზომიერად (მაგ: ✨, 🌹, 🤍).
- იყავი დამხმარე, მეგობრული და ელეგანტური — ფრანგული ვინტაჟური სტილი. ნუ იქნები ზედმეტად ტექნიკური.`;

/** Build the live product catalog for the system prompt (server-side, anon read). */
async function buildCatalog(): Promise<string> {
  try {
    const sb = createClient(SUPABASE_URL, ANON_KEY);
    const { data } = await sb
      .from("products")
      .select("id, name_ka, name_en, price, gender, stock_quantity, description_ka")
      .order("created_at", { ascending: false });

    if (!data || data.length === 0) {
      return "ამჟამად კატალოგი მიუწვდომელია — შესთავაზე მომხმარებელს მოგვწერონ Facebook-ზე.";
    }

    return data
      .map((p) => {
        const name = p.name_ka || p.name_en || "უსახელო";
        const gender = p.gender ? ` [${p.gender}]` : "";
        const stock = (p.stock_quantity ?? 0) > 0 ? "" : " (ამოწურულია)";
        const desc = p.description_ka ? ` — ${String(p.description_ka).slice(0, 140)}` : "";
        return `- ${name}${gender} — ${p.price}₾ — ID:${p.id}${stock}${desc}`;
      })
      .join("\n");
  } catch {
    return "ამჟამად კატალოგი მიუწვდომელია — შესთავაზე მომხმარებელს მოგვწერონ Facebook-ზე.";
  }
}

interface HistoryItem { role: "user" | "model"; text: string; }

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "POST only" }, 405);
  if (!GEMINI_KEY) return json({ error: "GEMINI_API_KEY not set" }, 503);

  let body: { message?: string; history?: HistoryItem[] };
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  const message = typeof body.message === "string" ? body.message.trim() : "";
  if (!message) return json({ error: "message required" }, 400);

  const history = (Array.isArray(body.history) ? body.history : [])
    .filter((h) => h && (h.role === "user" || h.role === "model") && typeof h.text === "string")
    .slice(-20) // cap context window
    .map((h) => ({ role: h.role, parts: [{ text: h.text }] }));

  const catalog = await buildCatalog();
  const systemInstruction = `${BASE_INSTRUCTION}\n\n=== ჩვენი მიმდინარე კოლექცია ===\n${catalog}`;

  try {
    const genAI = new GoogleGenerativeAI(GEMINI_KEY);
    const model = genAI.getGenerativeModel({ model: MODEL, systemInstruction });
    const chat = model.startChat({
      history,
      generationConfig: { temperature: 0.7, maxOutputTokens: 2048 },
    });
    const result = await chat.sendMessage(message);
    return json({ text: result.response.text() });
  } catch (e) {
    console.error("ai-chat error:", e);
    return json({ error: "chat failed", details: String(e) }, 502);
  }
});
