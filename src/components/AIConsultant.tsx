import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { LipSyncAvatar } from "./LipSyncAvatar";

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
                        className="mb-4 mr-12 bg-white px-4 py-3 rounded-2xl shadow-2xl border border-pink-100 relative cursor-pointer group hover:bg-pink-50 transition-colors z-20"
                        onClick={(e) => { e.stopPropagation(); onClick(); }}
                    >
                        <p className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                            რით შემიძლია დაგეხმაროთ? <motion.span animate={{ rotate: [0, 20, 0] }} transition={{ repeat: Infinity, duration: 1 }}>👋</motion.span>
                        </p>
                        <div className="absolute -bottom-2 right-6 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[8px] border-t-white group-hover:border-t-pink-50 transition-colors" />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Character Container */}
            <motion.div
                className="relative cursor-pointer z-10 w-36 md:w-44"
                onClick={(e) => { e.stopPropagation(); onClick(); }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                animate={activeTalking ? {
                    y: [0, -5, 0],
                    rotate: [0, -1, 1, 0],
                    transition: { duration: 0.6, repeat: Infinity, ease: "linear" },
                } : {
                    y: [0, -10, 0],
                    transition: { duration: 4, repeat: Infinity, ease: "easeInOut" },
                }}
            >
                {/* Talking halo */}
                <AnimatePresence>
                    {activeTalking && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: [0.1, 0.4, 0.1], scale: [1, 1.15, 1] }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="absolute inset-0 bg-pink-400 rounded-full blur-3xl -z-10"
                        />
                    )}
                </AnimatePresence>

                <LipSyncAvatar
                    imageSrc="/ai-consultant-new.png"
                    speaking={activeTalking}
                    className="w-full"
                />

                {/* Status dot */}
                <div className="absolute bottom-[30%] right-1 w-4 h-4 bg-green-500 border-3 border-white rounded-full shadow-lg z-10">
                    <motion.div
                        animate={{ scale: [1, 1.5, 1], opacity: [1, 0, 1] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                        className="w-full h-full bg-green-400 rounded-full"
                    />
                </div>
            </motion.div>
        </div>
    );
};

export default AIConsultant;
