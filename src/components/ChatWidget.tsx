import { useState } from "react";
import AIConsultant from "./AIConsultant";
import CustomChatWindow from "./CustomChatWindow";

const ChatWidget = () => {
    const [isOpen, setIsOpen] = useState(false);

    const toggle = () => setIsOpen((prev) => !prev);
    const close = () => setIsOpen(false);

    return (
        <>
            <CustomChatWindow isOpen={isOpen} onClose={close} />
            <AIConsultant onClick={toggle} isOpen={isOpen} isTalking={false} />
        </>
    );
};

export default ChatWidget;
