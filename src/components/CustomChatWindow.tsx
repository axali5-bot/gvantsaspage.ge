import { useState, useRef, useEffect } from "react";
import { Send, X, Bot, User, Loader2 } from "lucide-react";
import { sendMessageToGemini, startGeminiChat } from "../lib/gemini";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface CustomChatWindowProps {
    isOpen: boolean;
    onClose: () => void;
    onLoadingChange?: (loading: boolean) => void;
}

type Message = {
    id: string;
    text: string;
    sender: "user" | "bot";
};

const CustomChatWindow = ({ isOpen, onClose, onLoadingChange }: CustomChatWindowProps) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Initialize chat session on first open
    useEffect(() => {
        if (isOpen && messages.length === 0) {
            startGeminiChat();
            // Optional: send an initial greeting
            setMessages([{ id: "welcome", text: "გამარჯობა! მე ვარ Gvansa's ასისტენტი ✨ რით შემიძლია დაგეხმაროთ?", sender: "bot" }]);
        }
    }, [isOpen, messages.length]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isLoading]);

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMsg = input.trim();
        setInput("");
        setMessages((prev) => [...prev, { id: Date.now().toString(), text: userMsg, sender: "user" }]);
        
        setIsLoading(true);
        onLoadingChange?.(true);
        try {
            const aiResponse = await sendMessageToGemini(userMsg);
            setMessages((prev) => [...prev, { id: (Date.now() + 1).toString(), text: aiResponse, sender: "bot" }]);
        } catch (error) {
            setMessages((prev) => [...prev, { id: (Date.now() + 1).toString(), text: "უკაცრავად, კავშირის შეცდომაა. გთხოვთ სცადოთ მოგვიანებით. 🌹", sender: "bot" }]);
        } finally {
            setIsLoading(false);
            onLoadingChange?.(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 20, scale: 0.95 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                    className="fixed bottom-[110px] right-6 w-[360px] sm:w-[420px] h-[600px] max-h-[calc(100vh-140px)] bg-white/95 backdrop-blur-xl border border-pink-100 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] flex flex-col overflow-hidden z-[999999998]"
                >
                    {/* Header */}
                    <div className="bg-gradient-to-r from-rose-50 to-pink-50 p-4 border-b border-pink-100 flex items-center justify-between shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-pink-400 to-rose-400 flex items-center justify-center text-white shadow-md">
                                <Bot size={20} />
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-800 text-[15px] font-display tracking-wide">Gvansa's ასისტენტი</h3>
                                <p className="text-[11px] text-green-500 font-medium flex items-center gap-1.5 mt-0.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 block animate-pulse"></span>
                                    აქტიური
                                </p>
                            </div>
                        </div>
                        <button 
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-700 hover:bg-white/50 rounded-full transition-all p-1.5"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-auto p-5 space-y-5 bg-[#FAFAFA]">
                        {messages.map((msg) => (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                key={msg.id}
                                className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                            >
                                <div className={`max-w-[90%] rounded-[1.2rem] p-3.5 text-[0.9rem] leading-relaxed shadow-sm ${
                                    msg.sender === "user"
                                    ? "bg-gradient-to-br from-pink-600 to-rose-500 text-white rounded-tr-[4px]"
                                    : "bg-white border border-rose-100/50 text-[#374151] rounded-tl-[4px]"
                                }`}>
                                    {msg.sender === "bot" ? (
                                        <div className="prose prose-sm prose-p:leading-relaxed prose-ul:my-1 prose-li:my-0.5 prose-strong:text-pink-600 prose-a:text-pink-500 max-w-none break-words">
                                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                {msg.text}
                                            </ReactMarkdown>
                                        </div>
                                    ) : (
                                        msg.text
                                    )}
                                </div>
                            </motion.div>
                        ))}
                        {isLoading && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="flex justify-start"
                            >
                                <div className="bg-white border border-rose-50 rounded-2xl rounded-tl-sm p-3 shadow-sm flex items-center gap-2">
                                    <Loader2 size={16} className="text-pink-400 animate-spin" />
                                    <span className="text-xs text-gray-400">ფიქრობს...</span>
                                </div>
                            </motion.div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <div className="p-3.5 bg-white border-t border-pink-50 shadow-[0_-5px_15px_rgba(0,0,0,0.02)]">
                        <div className="flex items-center gap-2 bg-gray-50/80 rounded-full pr-1.5 pl-4 py-1.5 border border-gray-200/60 focus-within:bg-white focus-within:ring-2 focus-within:ring-pink-200/50 transition-all">
                            <input
                                type="text"
                                placeholder="მოგვწერეთ აქ..."
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                                className="flex-1 bg-transparent border-none focus:outline-none text-[14px] text-gray-700 placeholder:text-gray-400 h-10"
                            />
                            <button
                                onClick={handleSend}
                                disabled={!input.trim() || isLoading}
                                className="w-10 h-10 rounded-full bg-gradient-to-tr from-pink-500 to-rose-500 text-white flex items-center justify-center disabled:opacity-50 disabled:from-gray-300 disabled:to-gray-300 disabled:shadow-none hover:shadow-md hover:-translate-y-0.5 transition-all"
                            >
                                <Send size={18} className="-ml-0.5" />
                            </button>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default CustomChatWindow;
