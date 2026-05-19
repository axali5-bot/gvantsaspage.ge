import { useEffect } from "react";

const ChatWidget = () => {
    useEffect(() => {
        // Prevent duplicate injection
        if (document.getElementById("botpress-script")) return;

        // 1. Inject the main Botpress Webchat script
        const script1 = document.createElement("script");
        script1.src = "https://cdn.botpress.cloud/webchat/v3.5/inject.js";
        script1.id = "botpress-script";
        script1.async = true;
        document.body.appendChild(script1);

        // 2. Inject the configuration script
        const script2 = document.createElement("script");
        script2.src = "https://files.bpcontent.cloud/2026/02/09/15/20260209154156-TK4PY2KM.js";
        script2.defer = true;
        document.body.appendChild(script2);

        return () => {
            // Cleanup: remove the scripts when component unmounts
            // Note: Botpress might leave some global state or iframe, 
            // but removing scripts prevents re-adding them unnecessarily.
            // set an ID to the config script to remove it too if needed
            if (document.body.contains(script1)) {
                // document.body.removeChild(script1); // Usually better to keep it loaded for SPA
            }
        };
    }, []);

    // The official widget handles its own UI, so we return null or an empty container
    // Ideally, we don't render anything here as the script appends to body.
    return <div id="bp-webchat" style={{ display: 'none' }} />;
};

export default ChatWidget;
