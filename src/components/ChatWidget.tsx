import { useState } from "react";
import { useLocation } from "react-router-dom";
import AIConsultant from "./AIConsultant";
import CustomChatWindow from "./CustomChatWindow";

const ChatWidget = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [isAiLoading, setIsAiLoading] = useState(false);
    const location = useLocation();

    if (location.pathname.startsWith('/admin')) {
        return null;
    }

    return (
        <>
            <CustomChatWindow
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
                onLoadingChange={setIsAiLoading}
            />
            <AIConsultant
                onClick={() => setIsOpen((prev) => !prev)}
                isOpen={isOpen}
                isTalking={isAiLoading}
            />
        </>
    );
};

export default ChatWidget;
