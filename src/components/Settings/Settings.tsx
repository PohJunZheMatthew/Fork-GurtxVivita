import { Tab } from "../../types";
import React, {
    ReactElement,
    useEffect,
    useMemo,
    useState
} from "react";
import { platform } from "@tauri-apps/plugin-os";
import { translateSettingsPageName, useI18n } from "../../i18n/i18n";
import {IoArrowBack} from "react-icons/io5";
import { motion } from "framer-motion";

async function getPages(): Promise<SettingsPage[]> {
    //@ts-ignore
    const modules = import.meta.glob(
        "./SettingsPages/*.tsx"
    );

    const pages: SettingsPage[] = [];

    for (const path in modules) {
        const module: any = await modules[path]();
        if (module.default) {
            pages.push(module.default);
        }
    }

    return pages;
}

function isMobilePlatform(): boolean {
    try {
        const p = platform();
        return p === "android" || p === "ios";
    } catch {
        // platform() throws outside a Tauri context (e.g. web preview)
        return false;
    }
}

function SettingsContent() {
    const [pages, setPages] = useState<SettingsPage[]>([]);
    const [isHome, setRequireToGoHome] = useState<boolean>(true);
    const [selectedIndex, setSelectedIndex] =
        useState<number>(0);
    const { language, t } = useI18n();
    const isMobile = useMemo(() => isMobilePlatform(), []);

    useEffect(() => {
        loadPages();
    }, []);

    async function loadPages() {
        const loadedPages = await getPages();
        setPages(loadedPages);
    }

    // @ts-ignore
    return (
        <div
            style={{
                display: 'flex',
                flexDirection: isMobile ? 'column' : 'row',
                gap: isMobile ? '14px' : '20px',
                padding: isMobile ? '14px' : '20px',
                minHeight: '100%',
                boxSizing: 'border-box',
                background: 'var(--viventory-bg)',
                color: 'var(--viventory-text)',
                fontSize: 'var(--viventory-font-size)',
            }}
        >
            {isHome ? (
                <div className="w-full">
                    <p
                        style={{
                            margin: '0 0 8px',
                            color: 'var(--viventory-border)',
                            fontSize: '13px',
                            fontWeight: 850,
                            textTransform: 'uppercase',
                            letterSpacing: 0,
                        }}
                    >
                        {t("settings.controlRoom")}
                    </p>
                    <h2
                        style={{
                            margin: '0 0 16px',
                            fontSize: isMobile ? '26px' : '34px',
                            fontWeight: 850,
                            letterSpacing: 0,
                            color: 'var(--viventory-text)',
                        }}
                    >
                        {t("settings.title")}
                    </h2>
                    <div
                        style={{
                            display: 'grid',
                            gap: '10px',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                        }}
                    >
                        {pages.map((page, index) => (
                            <button
                                key={index}
                                onClick={() => {
                                    setSelectedIndex(index);
                                    setRequireToGoHome(false);
                                }}
                                style={{
                                    textAlign: 'center',
                                    padding: isMobile ? '10px 14px' : '12px 14px',
                                    borderRadius: '8px',
                                    border: '1px solid var(--viventory-border)',
                                    background: 'var(--viventory-surface)',
                                    color: 'var(--viventory-text)',
                                    cursor: 'pointer',
                                    fontWeight: 750,
                                    whiteSpace: isMobile ? 'nowrap' : 'normal',
                                    flexShrink: isMobile ? 0 : undefined,
                                }}
                            >
                                {translateSettingsPageName(language, page.name)}
                                <p style={{ fontWeight: 350 }}>{page.name}</p>
                            </button>
                        ))}
                    </div>
                </div>
            ) : (
                <div
                    style={{
                        flex: 1,
                        minWidth: 0,
                        padding: isMobile ? '4px 0 0' : '8px 0 0',
                    }}
                >
                    <button
                        onClick={() => { setRequireToGoHome(true); }}
                        className="left-0 flex flex-row items-center gap-2"
                    >
                        <IoArrowBack />
                        <motion.span>Go back</motion.span>
                    </button>
                    {pages.length > 0 ? pages[selectedIndex]?.content : <p>Loading settings...</p>}
                </div>
            )}
        </div>
    );
}
export default class Settings implements Tab {
    id = crypto.randomUUID()

    name: string = "Settings";

    content: React.ReactNode;

    constructor() {
        this.content = <SettingsContent />;
    }
}

export interface SettingsPage {
    name: string;
    description:string;
    content: ReactElement;

    save: () => {};
}