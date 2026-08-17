import React, { ReactElement } from "react";
import ReactDOM from "react-dom/client";
import { MakerKiosk } from "./components/MakerKiosk.tsx";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";

export function MakerKioskWin(): ReactElement {
    // Handle the window close action asynchronously
    const handleClose = async () => {
        try {
            const appWindow = getCurrentWebviewWindow();
            await appWindow.close();
        } catch (error) {
            console.error("Failed to close window:", error);
        }
    };

    return (
        /* Outer flex container pinned strictly to view limits */
        <div style={{ width: '100vw', height: '100vh'}}
             className="border  rounded-xl flex flex-col overflow-hidden box-border
                w-full
                h-full
                p-1
                pr-4
                bg-[radial-gradient(rgba(0,0,0,0.05)_1px,transparent_1px),radial-gradient(rgba(0,0,0,0.05)_1px,transparent_1px)] bg-[length:16px_16px] bg-[position:0_0,8px_8px] bg-[color:rgba(255,255,255,0.99)]">

            {/* Draggable Header with Close Button integrated side-by-side using Flexbox */}
            <div
                data-tauri-drag-region
                style={{ height: '40px', minHeight: '40px'}}
                className="w-full border-b  flex items-center justify-between px-4 select-none cursor-move text-sm font-semibold tracking-wide "
            >
                {/* Window title on the left side */}
                <span data-tauri-drag-region>makerbot</span>

                {/* Interactive button on the right side */}
                <button
                    onClick={handleClose}
                    className="cursor-pointer bg-red-600 hover:bg-red-700 text-xs px-2 py-1 rounded transition-colors duration-150 z-50"
                >
                    close me!!
                </button>
            </div>

            {/* Application Content Box gets the remaining layout height */}
            <div
                className="w-full h-full">
                <MakerKiosk />
            </div>
        </div>
    );
}

export default MakerKioskWin;

const container = document.getElementById("app");
if (container) {
    ReactDOM.createRoot(container).render(
        <React.StrictMode>
            <MakerKioskWin />
        </React.StrictMode>
    );
}
