import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { MessageCircle, Sparkles } from "lucide-react";

interface AIConsultantProps {
    onClick: () => void;
    isOpen: boolean;
    isTalking: boolean;
}

const AIConsultant = ({ onClick, isOpen, isTalking: isBotTalking }: AIConsultantProps) => {
    const [showBubble, setShowBubble] = useState(false);
    const [isIdleTalking, setIsIdleTalking] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setShowBubble(true), 2000);
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        if (!isOpen && !isBotTalking) {
            const interval = setInterval(() => {
                setIsIdleTalking(true);
                setTimeout(() => setIsIdleTalking(false), 3000);
            }, 15000);
            return () => clearInterval(interval);
        }
    }, [isOpen, isBotTalking]);

    const activeTalking = isOpen || isBotTalking || isIdleTalking;

    return (
        <div id="ai-avatar-container" className="fixed bottom-6 right-8 z-[999999999] flex flex-col items-end">
            {/* Speech Bubble */}
            <AnimatePresence>
                {showBubble && !isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8, y: 10, x: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
                        exit={{ opacity: 0, scale: 0.8, y: 10 }}
                        className="mb-4 bg-white/95 backdrop-blur-md px-5 py-3.5 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-pink-100/50 relative cursor-pointer group hover:bg-white transition-all z-20"
                        onClick={(e) => { e.stopPropagation(); onClick(); }}
                    >
                        <p className="text-[14px] font-medium text-gray-700 flex items-center gap-2 font-display">
                            რით შემიძლია დაგეხმაროთ? <motion.span animate={{ rotate: [0, 20, 0] }} transition={{ repeat: Infinity, duration: 1.5 }}>✨</motion.span>
                        </p>
                        <div className="absolute -bottom-2 right-5 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[8px] border-t-white group-hover:border-t-white transition-colors" />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Chat Button (2026 Style) */}
            <motion.button
                className="relative cursor-pointer z-10 w-[60px] h-[60px] rounded-full bg-gradient-to-tr from-pink-500 via-rose-500 to-orange-400 p-[2px] shadow-2xl group outline-none"
                onClick={(e) => { e.stopPropagation(); onClick(); }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                animate={activeTalking ? {
                    y: [0, -4, 0],
                    transition: { duration: 1.5, repeat: Infinity, ease: "easeInOut" },
                } : {}}
            >
                {/* Glowing ring behind */}
                <div className="absolute inset-0 bg-gradient-to-tr from-pink-500 via-rose-500 to-orange-400 rounded-full blur-xl opacity-60 group-hover:opacity-100 transition-opacity duration-300" />
                
                <div className="relative w-full h-full bg-black/10 backdrop-blur-md rounded-full flex items-center justify-center overflow-hidden border border-white/20">
                    <motion.div
                        initial={false}
                        animate={isOpen ? { rotate: 90, scale: 0 } : { rotate: 0, scale: 1 }}
                        className="absolute flex items-center justify-center"
                    >
                        <MessageCircle className="w-7 h-7 text-white fill-white/20 drop-shadow-md" />
                    </motion.div>
                    <motion.div
                        initial={false}
                        animate={isOpen ? { rotate: 0, scale: 1 } : { rotate: -90, scale: 0 }}
                        className="absolute flex items-center justify-center"
                    >
                        <Sparkles className="w-7 h-7 text-white" />
                    </motion.div>
                </div>

                {/* Status dot */}
                <div className="absolute top-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full shadow-md z-20">
                    <motion.div
                        animate={{ scale: [1, 1.4, 1], opacity: [1, 0, 1] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                        className="w-full h-full bg-green-400 rounded-full"
                    />
                </div>
            </motion.button>
        </div>
    );
};

export default AIConsultant;
