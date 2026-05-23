import { useEffect, useState } from "react";
import AIConsultant from "./AIConsultant";

const ChatWidget = () => {
    const [isLoaded, setIsLoaded] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [isTyping, setIsTyping] = useState(false);

    useEffect(() => {
        if (document.getElementById("botpress-script")) {
            setIsLoaded(true);
            return;
        }

        const script1 = document.createElement("script");
        script1.src = "https://cdn.botpress.cloud/webchat/v3.5/inject.js";
        script1.id = "botpress-script";
        script1.async = true;
        document.body.appendChild(script1);

        const script2 = document.createElement("script");
        script2.src = "https://files.bpcontent.cloud/2026/02/09/15/20260209154156-TK4PY2KM.js";
        script2.defer = true;
        script2.onload = () => {
             const checkBotpress = setInterval(() => {
                if ((window as any).botpressWebChat) {
                    setIsLoaded(true);
                    clearInterval(checkBotpress);
                    
                    (window as any).botpressWebChat.onEvent((event: any) => {
                        if (event.type === 'ui.opened') setIsOpen(true);
                        if (event.type === 'ui.closed') setIsOpen(false);
                        if (event.type === 'message.received') {
                            // Briefly simulate talking when message arrives
                            setIsTyping(true);
                            setTimeout(() => setIsTyping(false), 3000);
                        }
                    }, ['ui.opened', 'ui.closed', 'message.received']);

                    (window as any).botpressWebChat.sendEvent({ type: 'config', layout: { showLauncher: false } });
                }
             }, 100);
        };
        document.body.appendChild(script2);
    }, []);

    const toggleChat = () => {
        const bp = (window as any).botpressWebChat;
        if (bp) {
            console.log("Toggling Botpress", isOpen);
            try {
                if (isOpen) {
                    bp.sendEvent({ type: 'hide' });
                    if (typeof bp.hide === 'function') bp.hide();
                } else {
                    bp.sendEvent({ type: 'show' });
                    if (typeof bp.show === 'function') bp.show();
                    // Some versions use 'open'
                    bp.sendEvent({ type: 'open' });
                }
            } catch (err) {
                console.error("Error toggling Botpress", err);
            }
        } else {
            console.warn("Botpress not initialized. Retrying in 1s...");
            // One-time fallback if it wasn't ready
            const retry = setInterval(() => {
                if ((window as any).botpressWebChat) {
                    (window as any).botpressWebChat.sendEvent({ type: 'show' });
                    clearInterval(retry);
                }
            }, 1000);
            setTimeout(() => clearInterval(retry), 5000);
        }
    };



    return (
        <>
            <div id="bp-webchat" />
            <AIConsultant onClick={toggleChat} isOpen={isOpen} isTalking={isTyping} />
        </>
    );
};



export default ChatWidget;

