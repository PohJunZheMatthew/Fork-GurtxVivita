//@ts-ignore
import React, {useCallback, useEffect, useRef, useState} from 'react'
import ReactDOM from 'react-dom/client'
//@ts-ignore
import './style.css'
import Titlebar from "./titlebar"
import {Command, CommandArgument, Tab, UserPerms} from "./types"
import "react-icons/io"
import {IoIosCloseCircle, IoIosCloseCircleOutline} from 'react-icons/io'
import {MdAddCircle, MdAddCircleOutline, MdOutlineWavingHand} from "react-icons/md";
import {arrayMove, horizontalListSortingStrategy, SortableContext, useSortable} from "@dnd-kit/sortable"

import {CSS} from "@dnd-kit/utilities"
import {closestCenter, DndContext, PointerSensor, useSensor, useSensors} from "@dnd-kit/core";
import {restrictToHorizontalAxis} from "@dnd-kit/modifiers";
import Settings from "./components/Settings/Settings";
import DocsView from "./components/Docs/DocsView";
import {CommandBar} from "./CommandBar";
import LoginTab from "./components/LoginTab";
import {MapViewTab, MaterialSearchTab} from "./components/UserViewTab";
import { applyAppearancePrefs, loadAppearancePrefs } from "./components/Settings/appearancePreferences";
import { MakerKioskTab } from "./components/MakerKiosk";
import vivitaLogo from "./assets/vivita-logo.png";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { InventoryProvider } from "./components/InventoryProvider";
import AdminViewTab from "./components/AdminViewTab";
import { consumeGoogleRedirectResult } from "./services/firebaseAuth";
import { recordAccountLogin } from "./services/accountSession";
import { translateTabName, useI18n } from "./i18n/i18n";
import {platform} from "@tauri-apps/plugin-os";
import {FaHome, FaRegWindowRestore, FaRobot} from "react-icons/fa";
import {FaGear} from "react-icons/fa6";
import { invoke } from "@tauri-apps/api/core"
import {color} from "framer-motion";
import {BsGearFill} from "react-icons/bs";

export type BasicTabProps = {
    tabs: Tab[];
    setTabs: React.Dispatch<React.SetStateAction<Tab[]>>;
    tabIndex: number;
    setTabIndex: (index: number) => void;
    setTab: (index: number, tab: Tab) => void;
    handleClosingTab: (index: number) => void;
    handleMaterialSearch: (query: string) => void;
    // Appends a placeholder tab and returns its index — see the
    // implementation in App() for the full contract. This was previously
    // passed around ad hoc (causing "does not exist on BasicTabProps" /
    // "expected 3 arguments" errors wherever it was threaded through as a
    // one-off extra prop or constructor arg); it's now a first-class part
    // of BasicTabProps so every consumer of these props has access to it.
    handleNewTab: () => number;
}

let commandTabProps: BasicTabProps | undefined

// Switches to the tab if it's already open; otherwise actually creates it
// via tabFactory and marks it closable, since it was opened on demand.
// (Previously this silently no-opped when the tab wasn't found — tabFactory
// was accepted but never called.)
export function focusTab(name: string, tabFactory: () => Tab): void {
    const bt = commandTabProps
    if (!bt) return

    const existingIndex = bt.tabs.findIndex(tab => tab.name === name)

    if (existingIndex !== -1) {
        bt.setTabIndex(existingIndex)
        return
    }

    const newIndex = bt.handleNewTab()
    const newTab = tabFactory()
    newTab.closable = true
    bt.setTab(newIndex, newTab)
}

export class SearchCommand implements Command {
    id: string = crypto.randomUUID()
    args: CommandArgument[] = []
    name: string = "Welcome"
    onRun: () => void = () => focusTab("Welcome", () => new welcomeTab())
    static bt:BasicTabProps
    static receive (bt0: BasicTabProps):void{
        SearchCommand.bt=bt0;
        commandTabProps=bt0;
    }
}

export class OpenTabCommand implements Command {
    id: string = crypto.randomUUID()
    args: CommandArgument[] = []
    name: string
    onRun: () => void

    constructor(name: string, tabName: string, tabFactory: () => Tab) {
        this.name = name
        this.onRun = () => focusTab(tabName, tabFactory)
    }
}

export class LoginCommand implements Command {
    id: string = crypto.randomUUID()
    args: CommandArgument[] = []
    name: string = "Login"
    onRun: () => void = ()=>{
        const bt = commandTabProps
        if (!bt) return

        const existingIndex = bt.tabs.findIndex(tab => tab.name === "Login")

        if (existingIndex !== -1) {
            bt.setTabIndex(existingIndex)
            return
        }

        // Same fix as focusTab: actually open the tab when it isn't
        // already there, and mark it closable since it's on demand.
        const newIndex = bt.handleNewTab()
        const loginTab = new LoginTab(bt, newIndex)
        loginTab.closable = true
        bt.setTab(newIndex, loginTab)
    }
}

export var commands:Command[] = [
    new SearchCommand(),
    new OpenTabCommand("Maker Bot", "Maker Bot", () => new MakerKioskTab()),
    new OpenTabCommand("Map", "Map", () => new MapViewTab()),
    new OpenTabCommand("Search Items", "Search for Items", () => new MaterialSearchTab()),
    new OpenTabCommand("Docs", "Documentation", () => new DocsView()),
    new OpenTabCommand("Settings", "Settings", () => new Settings()),
    new LoginCommand(),
]

export class welcomeTab implements Tab {

    id = crypto.randomUUID()
    name: string = "Welcome"
    content: React.ReactNode
    // Permanent tab — always present, never user-closable.
    closable: boolean = false
    icon:React.ReactNode = <MdOutlineWavingHand/>
    static props:BasicTabProps

    constructor() {
        this.content = <WelcomeContent />
    }
    static SetProps(_: { tabs: Tab[] }, basicTabProps: BasicTabProps){
        this.props = basicTabProps
    }
}

function WelcomeContent() {
    const { t } = useI18n();
    const searchInputId = "welcome-search";

    const quickLinks: Array<{ label: string; open: () => void }> = [
        { label: t("link.makerBot"), open: () => focusTab("Maker Bot", () => new MakerKioskTab()) },
        { label: t("Map"), open: () => focusTab("Map", () => new MapViewTab()) },
        { label: t("link.settings"), open: () => focusTab("Settings", () => new Settings()) },
    ];

    return(

        <div
            style={{
                height: "100%",
                width: "100%",
                boxSizing: "border-box",
                background: "var(--viventory-bg)",
                color: "var(--viventory-text)",
                overflow: "auto",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "clamp(24px, 6vw, 64px)",
            }}
        >
            <main
                style={{
                    width: "100%",
                    maxWidth: "520px",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    textAlign: "center",
                    gap: "22px",
                }}
            >
                <img
                    src={vivitaLogo}
                    alt="VIVITA"
                    style={{
                        width: "170px",
                        height: "auto",
                        display: "block",
                        filter: "var(--viventory-logo-filter)",
                    }}
                />
                <h1 style={{
                    margin: 0,
                    fontSize: "clamp(30px, 4.5vw, 42px)",
                    lineHeight: 1.1,
                    fontWeight: 700,
                    letterSpacing: "-0.5px",
                    color: "var(--viventory-text)",
                }}>
                    {t("welcome.heading")}
                </h1>
                <p style={{
                    margin: 0,
                    maxWidth: "420px",
                    fontSize: "16px",
                    lineHeight: 1.5,
                    color: "var(--viventory-muted-text)",
                }}>
                    {t("welcome.sub")}
                </p>
                <form
                    onSubmit={(event) => {
                        event.preventDefault();
                        const input = event.currentTarget.elements.namedItem(searchInputId) as HTMLInputElement | null;
                        welcomeTab.props.handleMaterialSearch(input?.value ?? "");
                    }}
                    style={{
                        width: "100%",
                    }}
                >
                    <input
                        id={searchInputId}
                        name={searchInputId}
                        type="search"
                        placeholder={t("welcome.searchPlaceholder")}
                        style={{
                            width: "100%",
                            minHeight: "48px",
                            padding: "0 16px",
                            fontSize: "15px",
                            border: "1px solid var(--viventory-border)",
                            borderRadius: "8px",
                            background: "var(--viventory-surface)",
                            color: "var(--viventory-text)",
                            outline: "none",
                            boxSizing: "border-box",
                        }}
                    />
                </form>
                <nav
                    style={{
                        display: "flex",
                        flexWrap: "wrap",
                        justifyContent: "center",
                        gap: "4px 22px",
                    }}
                >
                    {quickLinks.map(link => (
                        <button
                            key={link.label}
                            onClick={link.open}
                            style={{
                                background: "none",
                                border: "none",
                                padding: "6px 0",
                                fontSize: "14px",
                                fontWeight: 600,
                                color: "var(--viventory-welcome-accent)",
                                cursor: "pointer",
                            }}
                        >
                            {link.label}
                        </button>
                    ))}
                </nav>
                <p style={{
                    margin: 0,
                    fontSize: "12px",
                    color: "var(--viventory-muted-text)",
                }}>
                    {t("welcome.hint")}
                </p>
            </main>
        </div>)
}
//@ts-ignore
type RenderTabBarTabProps = {
    tab:Tab;
    index:number;
    onClose:(index: number) => void;
    currentTabIndex:number;
    setTabIndex:(index: number) => void;
    moveTab:(from:number,to:number)=>void;
    tabsLength:number;
}

// @ts-ignore

function RenderTabBarTab({
                             tab,
                             index,
                             onClose,
                             currentTabIndex,
                             setTabIndex
                         }: RenderTabBarTabProps) {
    const [isHovered, setIsHovered] = useState(false)
    const { language } = useI18n()

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({
        id: tab.id
    })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        width: "170px",
        padding: "7px 14px",
        height: "30px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        background:
            "var(--viventory-muted-surface)",
        color: "var(--viventory-text)",
        borderBottom:
            index === currentTabIndex
                ? "0px solid var(--viventory-tab-active-border)"
                : "2.5px solid var(--viventory-border)",
        boxShadow:
            index === currentTabIndex
                ? "0 10px 22px rgba(15, 23, 42, 0.14)"
                : "none",
        fontWeight: index === currentTabIndex ? 350 : 300,

        userSelect: "none" as const,

        cursor: isDragging
            ? "grabbing"
            : "grab",

        flexShrink: 0,

        zIndex: isDragging ? 1000 : 1,

        opacity: isDragging ? 0.9 : 1
    }
    // @ts-ignore
    return (
        <div
            ref={setNodeRef}
            style={style}
            onClick={() => setTabIndex(index)}
        >
            {(tab.icon!=null) ? (tab.icon) : (<FaRegWindowRestore/>)}
            <div
                {...listeners}
                style={{
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    flex: 1,
                    cursor: "grab",
                    display: "flex",
                    alignItems: "center"
                }}
            >
                {translateTabName(language, tab.name)}
            </div>
            {/*
                Only tabs explicitly marked closable render a close control.
                Permanent tabs (Welcome, and anything else with
                closable !== true) have no way for the user to close them.
            */}
            {tab.closable && (
                <button
                    onClick={(e) => {
                        e.stopPropagation()
                        onClose(index)
                    }}
                    style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        marginLeft: "6px",
                        padding: 0,
                        color: "var(--viventory-muted-text)",
                        flexShrink: 0,
                    }}
                    aria-label="Close tab"
                >
                    <IoIosCloseCircleOutline size={16} />
                </button>
            )}
        </div>
    )
}
type RenderTabBarProps = {
    tabs: Tab[]
    setTabs: React.Dispatch<React.SetStateAction<Tab[]>>
    onClose: (index: number) => void
    currentTabIndex: number
    setTabIndex: React.Dispatch<React.SetStateAction<number>>
    handleNewTab: () => number
    moveTab: (from: number, to: number) => void
}

function RenderTabBar({
                          tabs,
                          setTabs,
                          onClose,
                          currentTabIndex,
                          setTabIndex,
                          handleNewTab,
                          moveTab
                      }: RenderTabBarProps): React.ReactElement {

    const [isHovered, setIsHovered] = useState(false)
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5,
            },
        })
    )
    return (
        <DndContext
            sensors={sensors}

            collisionDetection={closestCenter}
            modifiers={[restrictToHorizontalAxis]}
            onDragEnd={(event) => {

                const { active, over } = event

                if (!over || active.id === over.id) return

                const oldIndex =
                    tabs.findIndex(
                        t => t.id === active.id
                    )

                const newIndex =
                    tabs.findIndex(
                        t => t.id === over.id
                    )

                setTabs((items) =>
                    arrayMove(items, oldIndex, newIndex)
                )

                if (currentTabIndex === oldIndex) {
                    setTabIndex(newIndex)
                }
            }}
        >
            <SortableContext
                items={tabs.map(t => t.id)}

                strategy={horizontalListSortingStrategy}
            >
                <style>{`
        .custom-scroll-container {
            /* FORCE the Tauri Webview shell to allow dark or light scrollbar mutations */
            color-scheme: dark light !important; 
        }
        .custom-scroll-container::-webkit-scrollbar {
            height: 6px !important;
            display: block !important;
        }
        .custom-scroll-container::-webkit-scrollbar-track {
            background: var(--bg) !important;
        }
        .custom-scroll-container::-webkit-scrollbar-thumb {
            background: var(--viventory-border) !important;
            border-radius: 9999px !important;
        }
    `}</style>

                <div
                    style={{
                        borderRadius: "0px",
                        display: "flex",
                        alignItems: "center",
                        width: "fit-content",
                        padding: "8px 10px",
                        height: "54px",
                        gap: "8px",
                        overflowX: "auto",
                        overflowY: "hidden",
                        background: "var(--viventory-muted-surface)",
                        borderBottom: "1px solid var(--viventory-border)",
                        boxSizing: "border-box",
                        flex: "2"
                    }}
                    className="custom-scroll-container"
                >
                    {
                        tabs.map((tab, index) => (
                            <RenderTabBarTab
                                key={tab.id}
                                tab={tab}
                                index={index}
                                onClose={onClose}
                                currentTabIndex={currentTabIndex}
                                setTabIndex={setTabIndex}
                                moveTab={moveTab}
                                tabsLength={tabs.length}
                            />
                        ))
                    }
                </div>
            </SortableContext>
        </DndContext>
    )
}

function RenderMobileTabBar({
                                tabs,
                                setTabs,
                                tabIndex,
                                setTabIndex,
                                setTab,
                                handleClosingTab,
                                handleMaterialSearch}:BasicTabProps):React.ReactElement{

    const currentName = tabs[tabIndex]?.name

    const focus = (name: string, factory: () => Tab) => {
        const existingIndex = tabs.findIndex(tab => tab.name === name)

        if (existingIndex !== -1) {
            setTabIndex(existingIndex)
            return
        }
    }

    const navButtonStyle = (active: boolean): React.CSSProperties => ({
        padding: "10px 20px",
        background: "none",
        border: "none",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "2px",
        color: active ? "var(--viventory-welcome-accent)" : "inherit",
        fontWeight: active ? 700 : 500,
        cursor: "pointer",
    })

    return (
        <div style={{
            position: "fixed",
            bottom: "16px",
            left: "10%",
            width: "80%",
            height: "60px",
            zIndex: 10,
            background: "rgba(255, 255, 255, 0.8)",
            backdropFilter: "blur(10px)",
            borderRadius: "30px",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            boxShadow: "0 4px 20px rgba(0, 0, 0, 0.15)"
        }}>
            <button
                style={navButtonStyle(currentName === "Welcome")}
                onClick={() => focus("Welcome", () => new welcomeTab())}
            >
                <FaHome/>
                Home
            </button>
            <button
                style={navButtonStyle(currentName === "Maker Bot")}
                onClick={() => focus("Maker Bot", () => new MakerKioskTab())}
            >
                <FaRobot />
                MakerBot
            </button>
            <button
                style={navButtonStyle(currentName === "Settings")}
                onClick={() => focus("Settings", () => new Settings())}
            >
                <FaGear />
                Settings
            </button>
        </div>)
}
function RenderTab(
    tabs: Tab[],
    tabIndex: number,
    mobile: boolean = false
): React.ReactElement {

    return (
        <div
            style={
                mobile
                    // Let this grow with its content — it lives inside a
                    // scrollable ancestor now, so it must NOT clip
                    // (overflow:hidden) or zero its min size (minHeight:0),
                    // both of which would force it back to the container's
                    // fixed height and re-introduce the clipping bug.
                    ? {
                        flex: "none",
                        borderRadius: "0px",
                        overflow: "visible",
                        minHeight: "100%",
                    }
                    : {
                        flex: 1,
                        borderRadius: "0px",
                        overflow: "hidden",
                        minHeight: 0
                    }
            }
        >
            {
                tabs.length > 0 &&
                tabIndex >= 0 &&
                tabIndex < tabs.length
                    ? tabs[tabIndex].content
                    : null
            }
        </div>
    )
}



function AppCommandEntry({ setCmdBarVis }: { setCmdBarVis: (visible: boolean) => void }) {
    const { t } = useI18n();
    return (
        <button
            className="command-button"
            type="button"
            onClick={() => setCmdBarVis(true)}
            style={{
                width:"fit-content",
                minWidth:"135px"
            }}
        >
            Search&ensp;<span className={"rounded-lg border aspect-square"}>{(platform()=="macos") ? <kbd>⌘</kbd>: ((platform()!="windows") ? <kbd>meta</kbd>:<kbd>⊞</kbd>)}</span>+<span className={"rounded-lg border aspect-square"}>K</span>
        </button>
    );
}

function App() {

    const [cmdBarVis,setCmdBarVis] = useState<boolean>(false)
    const [isFullscreen, setIsFullscreen] = useState<boolean>(false)

    const [tabs, setTabs] = useState<Tab[]>([
        new welcomeTab(),
        new MakerKioskTab(),
        new MapViewTab(),
        new Settings(),
    ])

    const [tabIndex, setTabIndex] = useState<number>(0)
    useEffect(()=>{
        window.addEventListener('contextmenu', (e) => {

            e.preventDefault();
            invoke('show_context_menu');
        })
    })
    useEffect(() => {
        const savedPrefs = loadAppearancePrefs();
        applyAppearancePrefs(savedPrefs);

        const mediaQuery = window.matchMedia?.("(prefers-color-scheme: dark)");
        const handleSystemThemeChange = () => {
            const currentPrefs = loadAppearancePrefs();
            if (currentPrefs.theme === "system") {
                applyAppearancePrefs(currentPrefs);
            }
        };

        mediaQuery?.addEventListener("change", handleSystemThemeChange);
        return () => mediaQuery?.removeEventListener("change", handleSystemThemeChange);
    }, []);

    useEffect(() => {
        let cancelled = false;

        consumeGoogleRedirectResult().then((result) => {
            if (cancelled || !result) {
                return;
            }

            if (!result.success) {
                console.warn(result.note);
                alert(`Google sign-in failed: ${result.note}`);
                return;
            }

            const isAdmin = result.perms === UserPerms.Staff;
            // Non-admin users land on the Map tab now that User View has
            // been split into Map + Search for Items.
            const targetName = isAdmin ? "Admin View" : "Map";
            recordAccountLogin({
                label: result.displayName || result.email || "Google account",
                email: result.email,
                provider: "google",
                perms: result.perms,
            });

            setTabs((prevTabs) => {
                const existingIndex = prevTabs.findIndex((tab) => tab.name === targetName);

                if (existingIndex !== -1) {
                    setTabIndex(existingIndex);
                    return prevTabs;
                }

                // Opened on demand after sign-in — the user should be able
                // to close it.
                const nextTab: Tab = isAdmin ? new AdminViewTab() : new MapViewTab();
                nextTab.closable = true;
                setTabIndex(prevTabs.length);
                return [...prevTabs, nextTab];
            });
        });

        return () => {
            cancelled = true;
        };
    }, []);


    const handleClosingTab:(index:number)=>void = (index: number) => {

        setTabs((prevTabs) => {

            // Guard: even if something calls this on a non-closable tab,
            // don't let it disappear. The tab bar UI already hides the
            // close control for these, but keep the state layer safe too.
            if (!prevTabs[index]?.closable) {
                return prevTabs
            }

            const newTabs = prevTabs.filter((_, i) => i !== index)

            if (newTabs.length === 0) {
                setTabIndex(0)
                return [new welcomeTab()]
            }

            if (tabIndex >= newTabs.length) {
                setTabIndex(newTabs.length - 1)
            } else if (tabIndex === index) {
                setTabIndex(Math.max(0, index - 1))
            }

            return newTabs
        })
    }

    const moveTab = (from: number, to: number) => {

        setTabs((prev) => {

            const updated = [...prev]

            const [movedTab] = updated.splice(from, 1)

            updated.splice(to, 0, movedTab)

            return updated
        })

        setTabIndex(to)
    }

    const moveTabLeft = (index: number) => {

        if (index <= 0) return

        moveTab(index, index - 1)
    }

    const moveTabRight = (index: number) => {

        if (index >= tabs.length - 1) return

        moveTab(index, index + 1)
    }

    const setTab = (index: number, tab: Tab) => {

        setTabs((prev) => {

            const updated = [...prev]

            updated[index] = tab

            return updated
        })
    }

    // Appends a fresh, closable placeholder tab and returns its index.
    // Callers (e.g. openLoginTab, focusTab, LoginCommand) immediately
    // follow this with setTab(...) to swap in the real tab content — this
    // just reserves the slot. Any tab created through this path is opened
    // on demand, so it's always marked closable.
    //
    // Constraint: the returned index is only valid if setTab(...) is
    // called synchronously afterward, before any other tab-list update —
    // it's derived from the current render's tabs.length, not from inside
    // the setTabs updater.
    const handleNewTab = (): number => {
        setTabs((prevTabs) => {
            const placeholder = new welcomeTab()
            placeholder.name = "New Tab"
            placeholder.closable = true
            return [...prevTabs, placeholder]
        })

        return tabs.length
    }

    const handleMaterialSearch = (query: string) => {
        const trimmedQuery = query.trim();

        if (!trimmedQuery) {
            return;
        }

        const existingIndex = tabs.findIndex(tab => tab.name === "Search for Items");

        if (existingIndex !== -1) {
            setTabIndex(existingIndex);
            window.setTimeout(() => {
                window.dispatchEvent(
                    new CustomEvent("viventory:material-search", {
                        detail: { query: trimmedQuery }
                    })
                );
            }, 0);
            return;
        }

        setTabs((prevTabs) => {
            setTabIndex(prevTabs.length);
            // Ad-hoc tab opened from a search — user-closable.
            const searchTab = new MaterialSearchTab(trimmedQuery);
            searchTab.closable = true;
            return [...prevTabs, searchTab];
        });
    }
    const openLoginTab = useCallback(() => {
        const existingIndex = tabs.findIndex(tab => tab.name === "Login");

        if (existingIndex !== -1) {
            setTabIndex(existingIndex);
            return;
        }

        const newIndex = handleNewTab();
        // Opened on demand — user-closable. handleNewTab is included in
        // the props object below since it's now part of BasicTabProps.
        const loginTab = new LoginTab({
            tabs,
            setTabs,
            tabIndex,
            setTabIndex,
            setTab,
            handleClosingTab,
            handleMaterialSearch,
            handleNewTab,
        }, newIndex);
        loginTab.closable = true;
        setTab(newIndex, loginTab);
    }, [handleClosingTab, handleMaterialSearch, setTab, tabIndex, tabs, handleNewTab]);

    useEffect(() => {
        const onOpenLogin = () => openLoginTab();
        window.addEventListener("viventory:open-login", onOpenLogin);
        return () => window.removeEventListener("viventory:open-login", onOpenLogin);
    }, [openLoginTab]);

    welcomeTab.SetProps(
        { tabs },
        {
            tabs,
            setTabs,
            tabIndex,
            setTabIndex,
            handleNewTab,
            setTab,
            handleClosingTab,
            handleMaterialSearch
        }
    )
    SearchCommand.receive({
        tabs,
        setTabs,
        tabIndex,
        setTabIndex,
        handleNewTab,
        setTab,
        handleClosingTab,
        handleMaterialSearch
    })
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.metaKey && event.key === 'k') {
                setCmdBarVis((prev) => !prev);
            }

            if (event.metaKey && event.ctrlKey && event.key.toLowerCase() === 'f') {
                event.preventDefault();
                void toggleFullscreen();
            }

            if (event.ctrlKey && event.key === 'Tab' && tabs.length > 0) {
                event.preventDefault();
                const direction = event.shiftKey ? -1 : 1;
                const nextIndex = (tabIndex + direction + tabs.length) % tabs.length;
                setTabIndex(nextIndex);
            }

            if (
                event.metaKey && !event.ctrlKey && !event.altKey && !event.shiftKey &&
                /^[1-9]$/.test(event.key) && tabs.length > 0
            ) {
                event.preventDefault();
                const digit = Number(event.key);
                const targetIndex = digit === 9 ? tabs.length - 1 : digit - 1;
                if (targetIndex < tabs.length) {
                    setTabIndex(targetIndex);
                }
            }

            if (
                event.metaKey && event.shiftKey &&
                (event.code === 'BracketRight' || event.code === 'BracketLeft') &&
                tabs.length > 0
            ) {
                event.preventDefault();
                const direction = event.code === 'BracketRight' ? 1 : -1;
                setTabIndex((tabIndex + direction + tabs.length) % tabs.length);
            }

            if (event.key === 'F11') {
                event.preventDefault();
                void toggleFullscreen();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [handleNewTab, handleClosingTab, isFullscreen, tabIndex, tabs.length]);

    const toggleFullscreen = async () => {
        try {
            const window = getCurrentWindow();
            const currentlyFullscreen = await window.isFullscreen();
            await window.setFullscreen(!currentlyFullscreen);
            setIsFullscreen(!currentlyFullscreen);
        } catch (error) {
            console.warn("Fullscreen is only available in the Tauri desktop app.", error);
        }
    };
    return (
        <InventoryProvider>
            {(platform()=="android"||platform()=="ios")?
                <main
                    className="app-shell"
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "0px",
                        height: "100vh",
                        width: "100vw",
                        overflow: "hidden",
                        boxSizing: "border-box",
                        background: "var(--viventory-bg)",
                        color: "var(--viventory-text)",
                        fontSize: "var(--viventory-font-size)",
                    }}>
                    {/*
                        This wrapper must be a flex container itself, or the
                        child's flex:1/minHeight:0 below do nothing and the
                        content silently gets clipped by this <main>'s
                        overflow:hidden with no way to scroll.
                    */}
                    <div style={{
                        position: "relative",
                        flex: 1,
                        minHeight: 0,
                        display: "flex",
                        flexDirection: "column",
                        overflow: "hidden",
                    }}>
                        <div
                            style={{
                                flex: 1,
                                minHeight: 0,
                                overflowY: "auto",
                                overflowX: "hidden",
                                WebkitOverflowScrolling: "touch",
                                display: "flex",
                                flexDirection: "column",
                                // Clearance so scrolled content never renders
                                // behind/through the floating nav bar below
                                // (fixed bottom:16 + height:60). This lives
                                // here, not in each Tab, so every tab gets
                                // it automatically.
                                paddingBottom: "92px",
                                boxSizing: "border-box",
                            }}
                        >
                            {RenderTab(tabs, tabIndex, true)}
                        </div>

                        <RenderMobileTabBar
                            tabs={tabs}
                            setTabs={setTabs}
                            tabIndex={tabIndex}
                            setTabIndex={setTabIndex}
                            handleNewTab={handleNewTab}
                            setTab={setTab}
                            handleClosingTab={handleClosingTab}
                            handleMaterialSearch={handleMaterialSearch}
                        />
                    </div>
                </main>:
                <main
                    className="app-shell"
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "0px",
                        height: "100vh",
                        width: "100%",
                        overflow: "hidden",
                        boxSizing: "border-box",
                        background: "var(--viventory-bg)",
                        color: "var(--viventory-text)",
                        fontSize: "var(--viventory-font-size)",
                        overflowX:"hidden"
                    }}
                >
                    {cmdBarVis && <CommandBar setVisibility={setCmdBarVis} />}

                    {!isFullscreen && <Titlebar
                        tabs={tabs}
                        setTabIndex={setTabIndex}
                        handleNewTab={handleNewTab}
                        setTab={setTab}
                    />}
                    <div
                        style={{
                            flex: 1,
                            minHeight: 0,
                            display: "flex",
                            flexDirection: "column",
                        }}
                    >
                        <div
                            style={{
                                flex: 1,
                                minHeight: 0,
                                display: "flex",
                                flexDirection: "row",
                                maxHeight:"50px"
                            }}
                        >
                            <RenderTabBar
                                tabs={tabs}
                                setTabs={setTabs}
                                onClose={handleClosingTab}
                                currentTabIndex={tabIndex}
                                setTabIndex={setTabIndex}
                                handleNewTab={handleNewTab}
                                moveTab={moveTab}
                            />

                            <AppCommandEntry setCmdBarVis={setCmdBarVis} />
                            <button
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    background: "var(--viventory-bg)",
                                    color: "var(--viventory-text)",
                                    borderRadius: "6px",
                                    border: "1px solid var(--viventory-border)",
                                    padding: "7px",
                                    cursor: "pointer",
                                    boxShadow: "0 8px 18px rgba(36, 38, 43, 0.08)",
                                }}
                                onClick={() => {
                                    const existingIndex = tabs.findIndex(
                                        (tab) => tab.name === "Settings"
                                    );
                                    if (existingIndex !== -1) {
                                        setTabIndex(existingIndex);
                                    } else {
                                        const newIndex = handleNewTab();
                                        setTab(newIndex, new Settings());
                                    }
                                }}
                            >
                                <BsGearFill size={18} color="currentColor" />
                            </button>
                        </div>
                        {RenderTab(tabs, tabIndex)}
                    </div>
                </main>}
        </InventoryProvider>
    )
}

export default App

//@ts-ignore
ReactDOM.createRoot(document.getElementById('app')!).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
)