import { useState } from "react";
import AIConsultant from "./AIConsultant";
import CustomChatWindow from "./CustomChatWindow";

const ChatWidget = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [isAiLoading, setIsAiLoading] = useState(false);

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
