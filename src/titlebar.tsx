import "./titlestyle.css";
import { BsGearFill } from "react-icons/bs";
import { Tab } from "./types";
import Settings from "./components/Settings/Settings";
import { useEffect, useState } from "react";
import { platform } from "@tauri-apps/plugin-os";
import { useI18n } from "./i18n/i18n";

type Props = {
    tabs: Tab[];
    setTabIndex: any;
    handleNewTab: () => number;
    setTab: (index: number, tab: Tab) => void;
};

async function getTitlebarPlatform() {
    try {
        return await platform();
    } catch (error) {
        void error;
        return "browser";
    }
}

export default function Titlebar({
                                     tabs,
                                     setTabIndex,
                                     handleNewTab,
                                     setTab,
                                 }: Props) {
    const [leftPadding, setLeftPadding] = useState(0);
    const { t } = useI18n();

    useEffect(() => {
        let cancelled = false;

        async function getOS() {
            const osName = await getTitlebarPlatform();
            if (cancelled) return;

            setLeftPadding(osName === "macos" ? 85 : 0);
        }

        getOS();

        return () => {
            cancelled = true;
        };
    }, []);

    return (
        <div
            data-tauri-drag-region
            className="title"
            style={{ userSelect: "none" }}
        >
            <h3
                data-tauri-drag-region
                className="title-text"
                style={{
                    paddingLeft: `${leftPadding}px`,
                    fontSize: "15px",
                    margin: 0,
                    pointerEvents: "none"
                }}
            >
                {t("app.title")}
            </h3>

            {/*<div className="title-right">*/}
            {/*    */}
            {/*</div>*/}
        </div>
    );
}
