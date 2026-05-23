import { useState, useRef, useEffect } from "react";
import { Send, X, Bot, User, Loader2 } from "lucide-react";
import { sendMessageToGemini, startGeminiChat } from "../lib/gemini";
import { motion, AnimatePresence } from "framer-motion";

interface CustomChatWindowProps {
    isOpen: boolean;
    onClose: () => void;
}

type Message = {
    id: string;
    text: string;
    sender: "user" | "bot";
};

const CustomChatWindow = ({ isOpen, onClose }: CustomChatWindowProps) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Initialize chat session on first open
    useEffect(() => {
        if (isOpen && messages.length === 0) {
            startGeminiChat();
            // Optional: send an initial greeting
            setMessages([{ id: "welcome", text: "გამარჯობა! მე ვარ Avon2Flame-ის AI ასისტენტი ✨ რით შემიძლია დაგეხმაროთ სუნამოების შერჩევაში?", sender: "bot" }]);
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
        try {
            const aiResponse = await sendMessageToGemini(userMsg);
            setMessages((prev) => [...prev, { id: (Date.now() + 1).toString(), text: aiResponse, sender: "bot" }]);
        } catch (error) {
            setMessages((prev) => [...prev, { id: (Date.now() + 1).toString(), text: "უკაცრავად, კავშირის შეცდომაა. გთხოვთ სცადოთ მოგვიანებით. 🌹", sender: "bot" }]);
        } finally {
            setIsLoading(false);
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
                    className="fixed bottom-[110px] right-6 w-[350px] sm:w-[400px] h-[550px] max-h-[calc(100vh-140px)] bg-white/90 backdrop-blur-xl border border-pink-100 rounded-3xl shadow-2xl flex flex-col overflow-hidden z-[999999998]"
                >
                    {/* Header */}
                    <div className="bg-gradient-to-r from-rose-50 to-pink-50 p-4 border-b border-pink-100 flex items-center justify-between shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center text-pink-600 shadow-inner">
                                <Bot size={20} />
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-800 text-sm font-display tracking-wide">Avon2Flame AI</h3>
                                <p className="text-xs text-green-500 font-medium flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 block animate-pulse"></span>
                                    აქტიური
                                </p>
                            </div>
                        </div>
                        <button 
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {messages.map((msg) => (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                key={msg.id}
                                className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                            >
                                <div className={`max-w-[85%] rounded-[1.2rem] p-3.5 text-[0.9rem] leading-relaxed shadow-sm ${
                                    msg.sender === "user"
                                    ? "bg-gradient-to-br from-pink-600 to-rose-500 text-white rounded-tr-[4px]"
                                    : "bg-white border border-rose-100/50 text-[#374151] rounded-tl-[4px] whitespace-pre-wrap"
                                }`}>
                                    {msg.text}
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
                    <div className="p-3 bg-white border-t border-pink-50">
                        <div className="flex items-center gap-2 bg-gray-50 rounded-full pr-1 pl-4 py-1 border border-gray-100 shadow-inner focus-within:ring-2 focus-within:ring-pink-200 transition-all">
                            <input
                                type="text"
                                placeholder="მოგვწერეთ აქ..."
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                                className="flex-1 bg-transparent border-none focus:outline-none text-sm text-gray-700 placeholder:text-gray-400 h-10"
                            />
                            <button
                                onClick={handleSend}
                                disabled={!input.trim() || isLoading}
                                className="w-9 h-9 rounded-full bg-pink-500 text-white flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-pink-600 transition-colors shadow-md"
                            >
                                <Send size={16} className="-ml-0.5" />
                            </button>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default CustomChatWindow;
