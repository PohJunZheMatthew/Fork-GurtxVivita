import React, {ReactElement, useEffect} from "react";
import ReactDOM from "react-dom/client";
import {ThemeSetter} from "./ThemeHelper.tsx";
import {getCurrentWebviewWindow} from "@tauri-apps/api/webviewWindow";

function ThemeSetterPopup():ReactElement{
    useEffect(() => {
        const currentWindow = getCurrentWebviewWindow();

        const handleKeyDown = (event: KeyboardEvent) => {
            console.log("Pressed key:", event.key);
            if (event.key === 'Escape') {
                event.preventDefault();
                currentWindow.close().catch(console.error);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, []);
    return (<ThemeSetter/>)
}

export default ThemeSetterPopup

//@ts-ignore
ReactDOM.createRoot(document.body).render(
    <React.StrictMode>
        <ThemeSetterPopup/>
    </React.StrictMode>
)