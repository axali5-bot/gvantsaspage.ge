import { GoogleGenerativeAI, ChatSession } from "@google/generative-ai";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

if (!apiKey) {
    console.error("VITE_GEMINI_API_KEY is not set in `.env`");
}

const genAI = new GoogleGenerativeAI(apiKey || "");

const systemInstruction = `შენ ხარ "Avon2Flame"-ის პრემიუმ პარფიუმერიის AI კონსულტანტი. 
შენი მიზანია მომხმარებლებს დაეხმარო სუნამოს შერჩევაში, უპასუხო მათ შეკითხვებს ზრდილობიანად და პროფესიონალურად ქართულ ენაზე. 
თუ არ იცი კონკრეტული სუნამოს ფასი ან დეტალი, გულწრფელად უთხარი რომ მოგვწერონ Facebook-ზე (Avon2Flame) დეტალებისთვის.
არასოდეს გამოიყენო Markdown-ის კოდის ბლოკები (\`\`\`) შენი პასუხებისთვის, გამოიყენე ჩვეულებრივი ტექსტი გავრცობილი პასუხებისთვის. სიის ჩამოსათვლელად შეგიძლია გამოიყენო "-" ან შავი წერტილები.
შენ შეგიძლია გამოიყენო თბილი სმაილები (მაგ: ✨, 🌹, 🤍) მაგრამ ზომიერად.
ჩვენი ონლაინ მაღაზია ყიდის პრემიუმ კლასის ორიგინალ ავონის და სხვა ბრენდების სუნამოებს. ჩვენი სტილი არის ფრანგული ვინტაჟური და ელეგანტური.
ნუ იქნები ზედმეტად ტექნიკური. იყავი დამხმარე, მეგობრული და ვისაც სუნამოებზე საუბარი უყვარს.`;

let chatSession: ChatSession | null = null;

export const startGeminiChat = () => {
    // using gemini-2.5-flash
    const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash",
        systemInstruction,
    });

    chatSession = model.startChat({
        history: [],
        generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 800,
        },
    });

    return chatSession;
};

export const sendMessageToGemini = async (message: string) => {
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
