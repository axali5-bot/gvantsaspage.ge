import { GoogleGenerativeAI, ChatSession } from "@google/generative-ai";
import { supabase } from "@/lib/supabaseClient";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

if (!apiKey) {
    console.error("VITE_GEMINI_API_KEY is not set in `.env`");
}

const genAI = new GoogleGenerativeAI(apiKey || "");

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

let chatSession: ChatSession | null = null;
// Tracks the in-flight initialization so a fast first message waits for the catalog to load.
let initPromise: Promise<ChatSession> | null = null;

/** Fetch the live product catalog and format it compactly for the system prompt. */
async function buildCatalogContext(): Promise<string> {
    try {
        const { data, error } = await supabase
            .from("products")
            .select("id, name_ka, name_en, price, gender, stock_quantity, description_ka")
            .order("created_at", { ascending: false });

        if (error || !data || data.length === 0) {
            return "ამჟამად კატალოგი მიუწვდომელია — შესთავაზე მომხმარებელს მოგვწერონ Facebook-ზე.";
        }

        return data
            .map((p) => {
                const name = p.name_ka || p.name_en || "უსახელო";
                const gender = p.gender ? ` [${p.gender}]` : "";
                const stock = (p.stock_quantity ?? 0) > 0 ? "" : " (ამოწურულია)";
                const desc = p.description_ka ? ` — ${p.description_ka.slice(0, 140)}` : "";
                return `- ${name}${gender} — ${p.price}₾ — ID:${p.id}${stock}${desc}`;
            })
            .join("\n");
    } catch {
        return "ამჟამად კატალოგი მიუწვდომელია — შესთავაზე მომხმარებელს მოგვწერონ Facebook-ზე.";
    }
}

export const startGeminiChat = (): Promise<ChatSession> => {
    initPromise = (async () => {
        const catalog = await buildCatalogContext();
        const systemInstruction = `${BASE_INSTRUCTION}\n\n=== ჩვენი მიმდინარე კოლექცია ===\n${catalog}`;

        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
            systemInstruction,
        });

        chatSession = model.startChat({
            history: [],
            generationConfig: {
                temperature: 0.7,
                // Georgian text is token-heavy (Unicode); 800 truncated replies mid-sentence.
                maxOutputTokens: 2048,
            },
        });

        return chatSession;
    })();

    return initPromise;
};

export const sendMessageToGemini = async (message: string) => {
    // If the user sends a message before the catalog finished loading, wait for init.
    if (!chatSession && initPromise) {
        await initPromise;
    }
    if (!chatSession) {
        throw new Error("Failed to initialize chat session.");
    }

    try {
        const result = await chatSession.sendMessage(message);
        return result.response.text();
    } catch (error) {
        console.error("Gemini API Error:", error);
        throw new Error("Chat failed.");
    }
};
