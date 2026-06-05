// Storefront chatbot client. The Gemini key and product catalog now live
// server-side in the `ai-chat` Edge Function; here we only keep the running
// conversation history and relay each message through the proxy.

import { supabase } from "@/lib/supabaseClient";

interface HistoryItem {
  role: "user" | "model";
  text: string;
}

let history: HistoryItem[] = [];

/** Begin a fresh conversation (resets client-held history). */
export const startGeminiChat = async (): Promise<void> => {
  history = [];
};

/** Send a message through the ai-chat proxy and return the reply text. */
export const sendMessageToGemini = async (message: string): Promise<string> => {
  const { data, error } = await supabase.functions.invoke("ai-chat", {
    body: { message, history },
  });

  if (error) {
    console.error("ai-chat invoke error:", error);
    throw new Error(error.message);
  }
  if (data?.error) {
    throw new Error(data.error);
  }

  const text = typeof data?.text === "string" ? data.text : "";
  // Keep context for the next turn.
  history.push({ role: "user", text: message });
  history.push({ role: "model", text });
  return text;
};
