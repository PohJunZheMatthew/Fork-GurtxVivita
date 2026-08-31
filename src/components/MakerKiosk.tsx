import React, { useEffect, useMemo, useRef, useState } from "react";
import {
    AlertTriangle,
    Lightbulb,
    Package,
    ShieldCheck,
    Wrench,
} from "lucide-react";
import { platform } from "@tauri-apps/plugin-os";
import type { Tab } from "../types";
import guidelinesRaw from "./Chatbot/ChatBotGuidelines.md?raw";
import heroImage from "../assets/hero.png";
import {
    answerMakerQuery,
    projectIdeas,
    type MakerAnswer,
    type MakerAnswerSection,
    type MakerItem,
    type MakerProjectIdea,
} from "./makerspaceData";
import { useInventory } from "./InventoryProvider";
import {IoIosCopy, IoIosSend} from "react-icons/io";
import {OpenRouter} from "@openrouter/sdk";
import { motion, useAnimation } from 'framer-motion';
import {Tooltip} from "react-tooltip";
import {invoke} from "@tauri-apps/api/core";
import {BiSolidWidget} from "react-icons/bi";
import {Groq} from "groq-sdk";
import {WebviewWindow} from "@tauri-apps/api/webviewWindow";
import {VscRightPanelHide} from "react-icons/vsc";
import { load, type Store } from "@tauri-apps/plugin-store";
import {writeText} from "@tauri-apps/plugin-clipboard-manager";
import { MdClearAll } from "react-icons/md";
import {groq} from "../secrets.ts";
//it's over isn't it
const palette = {
    ink: "#24262B",
    muted: "#838998",
    pegboardText: "#5E4B2E",
    sky: "#33A7B5",
    deepSky: "#277987",
    sunny: "#FFF5CB",
    softYellow: "#FFF5CB",
    mint: "#A5D6D1",
    coral: "#A1824F",
    paper: "#FFFDF6",
    panel: "#FFFDF6",
    line: "#D7CFBF",
    warning: "#FFF5CB",
    warningLine: "#A1824F",
};

function formatSection(section: MakerAnswerSection, styles: Record<string, React.CSSProperties>) {
    if (section.kind === "safety") {
        return (
            <div key={`${section.kind}-${section.title}`} style={styles.safety}>
                <AlertTriangle size={24} color={palette.warningLine} />
                <div>
                    <strong>{section.title}</strong>
                    <p style={{ margin: "5px 0 0", color: palette.ink }}>{section.body}</p>
                </div>
            </div>
        );
    }

    return (
        <div key={`${section.kind}-${section.title}`} style={styles.section}>
            <strong>{section.title}</strong>
            <p style={{ margin: "6px 0 0", whiteSpace: "pre-line", color: palette.ink }}>{section.body}</p>
        </div>
    );
}

function ProjectCard({ project, styles }: { project: MakerProjectIdea; styles: Record<string, React.CSSProperties> }) {
    return (
        <div style={{ ...styles.itemCard, background: palette.paper }}>
            <span style={styles.badge}>
                <Lightbulb size={14} />
                {project.difficulty}
            </span>
            <strong>{project.name}</strong>
            <span style={{ color: palette.muted, fontSize: 14, lineHeight: 1.4 }}>{project.summary}</span>
        </div>
    );
}

interface ChatMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
}

async function handleCommand(
    command: string,
    materials: any[],
    setChatHistory: React.Dispatch<React.SetStateAction<ChatMessage[]>>
): Promise<boolean> {
    const trimmed = command.trim();
    if (!trimmed.startsWith("/")) return false;
    const [cmd, ...args] = trimmed.slice(1).split(/\s+/);
    const argument = args.join(" ").trim();
    switch (cmd.toLowerCase()) {
        case "help":
            setChatHistory(prev => [
                ...prev,
                {
                    role: "assistant",
                    content:
                        `Available commands:\n\n` +
                        `/help - Show this help\n` +
                        `/clear - Clear chat history\n` +
                        `/count - Show inventory count\n` +
                        `/inventory - Show inventory summary\n` +
                        `/find <name> - Search for an item\n` +
                        `/category <category> - Find items by category`
                }
            ]);
            return true;

        case "clear":
            setChatHistory([]);
            return true;

        case "count":
            setChatHistory(prev => [
                ...prev,
                {
                    role: "assistant",
                    content: `There are ${materials.length} inventory items.`
                }
            ]);
            return true;

        case "inventory": {
            const categories = new Map<string, number>();

            for (const material of materials) {
                const category = material.category || "Unknown";
                categories.set(
                    category,
                    (categories.get(category) || 0) + 1
                );
            }

            const summary = [...categories.entries()]
                .map(([category, count]) => `${category}: ${count}`)
                .join("\n");

            setChatHistory(prev => [
                ...prev,
                {
                    role: "assistant",
                    content:
                        `Inventory contains ${materials.length} items.\n\n` +
                        `By category:\n${summary}`
                }
            ]);

            return true;
        }

        case "find": {
            if (!argument) {
                setChatHistory(prev => [
                    ...prev,
                    {
                        role: "assistant",
                        content: "Usage: /find <name>"
                    }
                ]);
                return true;
            }

            const query = argument.toLowerCase();

            const results = materials.filter(m =>
                String(m.name || "")
                    .toLowerCase()
                    .includes(query)
            );

            if (results.length === 0) {
                setChatHistory(prev => [
                    ...prev,
                    {
                        role: "assistant",
                        content: `No inventory items found matching "${argument}".`
                    }
                ]);
                return true;
            }

            const resultText = results
                .slice(0, 20)
                .map(m =>
                    `${m.name} — qty: ${m.quantity}, location: ${m.location}`
                )
                .join("\n");

            setChatHistory(prev => [
                ...prev,
                {
                    role: "assistant",
                    content:
                        `Found ${results.length} matching item(s):\n\n${resultText}`
                }
            ]);

            return true;
        }

        case "category": {
            if (!argument) {
                setChatHistory(prev => [
                    ...prev,
                    {
                        role: "assistant",
                        content: "Usage: /category <category>"
                    }
                ]);
                return true;
            }

            const query = argument.toLowerCase();

            const results = materials.filter(m =>
                String(m.category || "")
                    .toLowerCase()
                    .includes(query)
            );

            if (results.length === 0) {
                setChatHistory(prev => [
                    ...prev,
                    {
                        role: "assistant",
                        content: `No items found in category "${argument}".`
                    }
                ]);
                return true;
            }

            const resultText = results
                .slice(0, 30)
                .map(m =>
                    `${m.name} — qty: ${m.quantity}, location: ${m.location}`
                )
                .join("\n");

            setChatHistory(prev => [
                ...prev,
                {
                    role: "assistant",
                    content:
                        `${results.length} item(s) in "${argument}":\n\n${resultText}`
                }
            ]);

            return true;
        }

        default:
            setChatHistory(prev => [
                ...prev,
                {
                    role: "assistant",
                    content:
                        `Unknown command: /${cmd}\n\n` +
                        `Type /help to see available commands.`
                }
            ]);

            return true;
    }
}
const inventoryTools = [
    {
        type: "function" as const,
        function: {
            name: "search_inventory",
            description:
                "Search the makerspace inventory. MUST be used whenever the user asks about a specific inventory item, material, quantity, location, storage area, compartment, or category. Never guess inventory information.",
            parameters: {
                type: "object",
                properties: {
                    query: {
                        type: "string",
                        description:
                            "The user's inventory search term. Can be a material name, category, location, storage area, or other inventory-related term."
                    }
                },
                required: ["query"]
            }
        }
    },

    {
        type: "function" as const,
        function: {
            name: "get_inventory_summary",
            description:
                "Get high-level inventory statistics such as total number of inventory records and category counts. Use this for questions about the overall inventory.",
            parameters: {
                type: "object",
                properties: {}
            }
        }
    },

    {
        type: "function" as const,
        function: {
            name: "get_low_stock",
            description:
                "Find inventory items whose quantity is at or below a specified threshold.",
            parameters: {
                type: "object",
                properties: {
                    threshold: {
                        type: "number",
                        description:
                            "Maximum quantity considered low stock."
                    }
                },
                required: ["threshold"]
            }
        }
    }
];
function searchInventory(
    materials: any[],
    query: string
) {
    const q = String(query ?? "")
        .trim()
        .toLowerCase();

    if (!q) {
        return {
            results: [],
            totalMatches: 0
        };
    }

    const results = materials.filter((m) => {
        return (
            String(m.name ?? "").toLowerCase().includes(q) ||
            String(m.category ?? "").toLowerCase().includes(q) ||
            String(m.location ?? "").toLowerCase().includes(q) ||
            String(m.storage ?? "").toLowerCase().includes(q) ||
            String(m.compartmentId ?? "").toLowerCase().includes(q)
        );
    });

    /*
     * IMPORTANT:
     * Only return the fields the AI actually needs.
     *
     * We also limit the result so a broad search cannot dump
     * your entire inventory into the context.
     */
    const limitedResults = results
        .slice(0, 20)
        .map((m) => ({
            name: m.name,
            quantity: m.quantity,
            category: m.category,
            location: m.location,
            storage: m.storage,
            compartmentId: m.compartmentId
        }));

    return {
        totalMatches: results.length,
        returnedResults: limitedResults.length,
        results: limitedResults
    };
}function getInventorySummary(materials: any[]) {
    const categories: Record<string, number> = {};

    for (const material of materials) {
        const category = String(
            material.category ?? "Unknown"
        );

        categories[category] =
            (categories[category] ?? 0) + 1;
    }

    return {
        totalItems: materials.length,
        categories
    };
}function getLowStock(
    materials: any[],
    threshold: number
) {
    const safeThreshold = Number.isFinite(threshold)
        ? threshold
        : 5;

    const results = materials
        .filter((m) => Number(m.quantity ?? 0) <= safeThreshold)
        .slice(0, 50)
        .map((m) => ({
            name: m.name,
            quantity: m.quantity,
            category: m.category,
            location: m.location,
            storage: m.storage,
            compartmentId: m.compartmentId
        }));

    return {
        threshold: safeThreshold,
        results
    };
}

// --- Token-usage optimization -------------------------------------------
//
// The chat store persists the FULL conversation forever, and that's fine —
// the UI and the on-disk history should keep everything. But re-sending the
// entire conversation to Groq on every single message means turn N costs
// roughly N times what turn 1 cost, purely in input tokens, even though the
// model rarely needs anything beyond the last several exchanges to answer
// an inventory question correctly (it has tools for anything factual).
//
// windowedHistory() caps what's actually sent to the model without touching
// what's shown to the user or written to disk. Bump MAX_HISTORY_MESSAGES up
// if you find the assistant losing track of context that matters within a
// single conversation (e.g. multi-step clarifications).
const MAX_HISTORY_MESSAGES = 16; // ~8 user/assistant exchanges

function windowedHistory(history: ChatMessage[]): ChatMessage[] {
    if (history.length <= MAX_HISTORY_MESSAGES) return history;
    return history.slice(-MAX_HISTORY_MESSAGES);
}

async function simgaGroq(
    history: ChatMessage[],
    setChatHistory: React.Dispatch<
        React.SetStateAction<ChatMessage[]>
    >,
    materials: any[]
) {
    const messages: any[] = [
        {
            role: "system",
            content: `${guidelinesRaw}

You are the Makerspace inventory assistant.

INVENTORY RULES:

1. You do NOT have the inventory in your context.
2. The application has the inventory, not you.
3. NEVER guess inventory information.
4. NEVER invent quantities, locations, categories, storage areas, or compartment IDs.
5. When the user asks anything about inventory, USE THE APPROPRIATE INVENTORY TOOL.
6. Do not tell the user that you have access to the complete inventory.
7. Only use information returned by the inventory tools.
8. If a tool returns no matching items, clearly say that no matching items were found.
9. Keep responses concise unless the user asks for more detail.
10. Keep responses in plain text not markdown.
`
        },

        // Only the last MAX_HISTORY_MESSAGES messages are sent to the model.
        // `history` itself (and what gets persisted to the store) is untouched.
        ...windowedHistory(history)
    ];

    const MAX_TOOL_ROUNDS = 5;

    let toolRound = 0;

    while (toolRound < MAX_TOOL_ROUNDS) {
        toolRound++;

        /*
         * First request:
         *
         * The model receives the conversation + TOOL DEFINITIONS.
         *
         * It does NOT receive materials.
         */
        const completion =
            await groq.chat.completions.create({
                model: "openai/gpt-oss-20b",

                messages,

                tools: inventoryTools,

                tool_choice: "auto",

                // Caps a single response so a rambling generation can't
                // silently balloon output-token cost. The system prompt
                // already asks for concise answers; this backstops it.
                max_tokens: 500,

                stream: false
            });

        const assistantMessage =
            completion.choices[0]?.message;

        if (!assistantMessage) {
            throw new Error(
                "Groq returned an empty response."
            );
        }

        /*
         * No tool call means the model has its final answer.
         */
        if (
            !assistantMessage.tool_calls ||
            assistantMessage.tool_calls.length === 0
        ) {
            const content =
                assistantMessage.content ?? "";

            setChatHistory((prev) => [
                ...prev,
                {
                    role: "assistant",
                    content
                }
            ]);

            return;
        }

        /*
         * Add the model's tool request to the internal
         * Groq conversation.
         */
        messages.push(assistantMessage);

        /*
         * Execute every tool requested by the model.
         */
        for (const toolCall of assistantMessage.tool_calls) {
            const functionName =
                toolCall.function.name;

            let args: any = {};

            try {
                args = JSON.parse(
                    toolCall.function.arguments || "{}"
                );
            } catch (error) {
                console.error(
                    "Failed to parse tool arguments:",
                    error
                );

                args = {};
            }

            let result: any;

            switch (functionName) {
                case "search_inventory":
                    result = searchInventory(
                        materials,
                        args.query
                    );
                    break;

                case "get_inventory_summary":
                    result = getInventorySummary(
                        materials
                    );
                    break;

                case "get_low_stock":
                    result = getLowStock(
                        materials,
                        Number(args.threshold ?? 5)
                    );
                    break;

                default:
                    result = {
                        error:
                            `Unknown inventory tool: ${functionName}`
                    };
            }

            /*
             * ONLY THE TOOL RESULT goes back to Groq.
             *
             * The complete materials[] array NEVER goes here.
             */
            messages.push({
                role: "tool",
                tool_call_id: toolCall.id,
                name: functionName,
                content: JSON.stringify(result)
            });
        }
    }

    throw new Error(
        "The inventory assistant exceeded the maximum number of tool calls."
    );
}

function getErrorMessage(error: unknown): string {
    if (error instanceof Error) return error.message;
    if (error && typeof error === 'object' && 'message' in error) return String(error.message);
    if (typeof error === 'string') return error;
    return 'An unexpected error occurred.';
}

// --- Persistent chat context -------------------------------------------
//
// Backed by tauri-plugin-store (already registered in lib.rs but unused
// until now), which is Tauri's disk-backed key/value store — `autoSave`
// writes the JSON file to disk on every `.set()`, so the conversation
// survives closing the tab, the kiosk widget window, or quitting the app
// entirely. Both the in-app "Maker Bot" tab and the separate kiosk widget
// window mount the same <MakerKiosk> component and therefore read/write
// the same store file, so they share one persistent conversation rather
// than each having their own.
//
// If @tauri-apps/plugin-store isn't already an npm dependency, add it:
//   npm install @tauri-apps/plugin-store
// (it pairs with the `tauri-plugin-store` crate already in lib.rs).
const CHAT_STORE_FILE = "maker-bot-chat.json";
const CHAT_HISTORY_KEY = "chatHistory";

let chatStorePromise: Promise<Store> | null = null;

function getChatStore(): Promise<Store> {
    if (!chatStorePromise) {
        chatStorePromise = load(CHAT_STORE_FILE, { autoSave: true });
    }
    return chatStorePromise;
}

export function MakerKiosk() {
    // 1. ✅ Call the hook safely here at the very top of the component
    const { materials } = useInventory();

    // Unified state tracking the true sequence of the conversation
    const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState("");
    const [isstillInputting, setisstillInputting] = useState(false);
    const [historyLoaded, setHistoryLoaded] = useState(false);

    // Load whatever was last saved, once, on mount.
    useEffect(() => {
        let cancelled = false;

        getChatStore()
            .then((store) => store.get<ChatMessage[]>(CHAT_HISTORY_KEY))
            .then((saved) => {
                if (!cancelled && saved && saved.length > 0) {
                    setChatHistory(saved);
                }
            })
            .catch((err) => console.error("Failed to load saved maker bot chat history:", err))
            .finally(() => {
                if (!cancelled) setHistoryLoaded(true);
            });

        return () => {
            cancelled = true;
        };
    }, []);

    // Save on every change, but only once the initial load has resolved
    useEffect(() => {
        if (!historyLoaded) return;

        getChatStore()
            .then((store) => store.set(CHAT_HISTORY_KEY, chatHistory))
            .catch((err) => console.error("Failed to save maker bot chat history:", err));
    }, [chatHistory, historyLoaded]);

    const sendMessage = async () => {
        const message = input.trim();

        if (!message || isstillInputting) {
            return;
        }

        setInput("");

        const newHistoryItem: ChatMessage = {
            role: "user",
            content: message
        };

        const updatedHistory = [
            ...chatHistory,
            newHistoryItem
        ];

        setChatHistory(updatedHistory);

        setisstillInputting(true);

        try {
            /*
             * Explicit slash commands are handled locally.
             *
             * Example:
             * /find PLA
             * /count
             * /category 3D Printing
             */
            if (message.startsWith("/")) {
                await handleCommand(
                    message,
                    materials,
                    setChatHistory
                );

                return;
            }

            /*
             * Normal natural-language requests go to Groq.
             *
             * Groq receives NO inventory rows.
             *
             * simgaGroq() gives it tools that it can call
             * when it needs inventory information.
             */
            await simgaGroq(
                updatedHistory,
                setChatHistory,
                materials
            );
        } catch (e) {
            const parsedMessage =
                getErrorMessage(e);

            console.error(
                "Makerspace Chat Error:",
                e
            );

            setChatHistory((prev) => [
                ...prev,
                {
                    role: "assistant",
                    content: parsedMessage
                }
            ]);
        } finally {
            setisstillInputting(false);
        }
    };

    const controls = useAnimation();
    useEffect(() => {
        const clearHistory = () => {
            setChatHistory([]);
        };

        window.addEventListener(
            "maker-bot-clear-history",
            clearHistory
        );

        return () => {
            window.removeEventListener(
                "maker-bot-clear-history",
                clearHistory
            );
        };
    }, []);

    return (
        <div className="flex h-full flex-col p-2.5">
            {/* Chat viewport renders messages conditionally based on role */}
            <div className="min-h-0 flex-1 overflow-y-auto p-4 space-y-4">
                {chatHistory.map((chat, index) => {
                    const isUser = chat.role === 'user';
                    return (
                        <div key={index} className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'}`}>
                            <div className={`relative px-4 py-2 rounded-2xl max-w-[70%] break-words group ${
                                isUser
                                    ? 'bg-blue-500 text-white rounded-tr-none'
                                    : 'bg-gray-100 text-gray-800 rounded-tl-none'
                            }`}>
                                <p>{chat.content}</p>

                                {/* Copy button appears on hover for assistant messages */}
                                {!isUser && (
                                    <button
                                        onClick={async () => {
                                            try {
                                                await writeText(chat.content);
                                            } catch (err) {
                                                console.error("Failed to copy text: ", err);
                                            }
                                        }}
                                        className="absolute right-2 bottom-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 bg-white rounded shadow text-gray-600 hover:text-black"
                                        title="Copy to clipboard"
                                    >
                                        <IoIosCopy size={16} />
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Input elements container */}
            <div className="w-full flex shrink rounded-lg border border-black">
                <input
                    type="text"
                    placeholder="Type something creative here..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            sendMessage();
                        }
                    }}
                    className="flex-1 rounded-lg px-3 py-2 outline-none"
                />

                <button
                    data-tooltip-id="my-tip"
                    data-tooltip-content="Send!"
                    onClick={sendMessage}
                    onMouseEnter={async () => {
                        await controls.start({
                            x: [0, 25, -25, 0],
                            y: [0, -25, 25, 0],
                            opacity: 1.0,
                            scale: [1, 0.5, 0.5, 1],
                            transition: {
                                duration: 0.5,
                                times: [0, 0.4, 0.6, 1],
                                ease: "easeInOut"
                            }
                        });
                    }}
                    className="px-3 overflow-hidden"
                    disabled={isstillInputting}
                >
                    <motion.div animate={controls} className="flex items-center justify-center">
                        <IoIosSend size={24} />
                    </motion.div>
                </button>
                <Tooltip id="my-tip" style={{
                    background: "transparent",
                    color: "black",
                    border: "2px solid black"
                }} />
            </div>
        </div>
    );
}

// Reusable toggle: previously there were up to three separate buttons that
// all called invoke('create_maker_bot_kiosk_win') regardless of label —
// "Hide Widget" never actually hid anything, and the "Show Widget" button
// (shown when a window already existed) tried to create it again. This is
// now a single button whose label, icon, and action depend on hasWindow.
function WidgetToggleButton({
                                hasWindow,
                                setHasWindow,
                                setLoading,
                            }: {
    hasWindow: boolean;
    setHasWindow: (v: boolean) => void;
    setLoading: (v: boolean) => void;
}) {
    const [busy, setBusy] = useState(false);

    const toggle = async () => {
        setBusy(true);
        try {
            if (hasWindow) {
                await invoke('close_maker_bot_kiosk_win');
            } else {
                await invoke('create_maker_bot_kiosk_win');
            }
        } catch (err) {
            console.error("Failed to toggle maker bot kiosk window:", err);
        } finally {
            try {
                const win = await invoke("get_maker_bot_kiosk_win");
                setHasWindow(Boolean(win));
            } catch {
                // leave hasWindow as-is if the status check itself fails
            } finally {
                setLoading(false);
                setBusy(false);
            }
        }
    };

    return (
        <motion.button
            onClick={toggle}
            disabled={busy}
            initial="initial"
            whileHover="hover"
            style={{ display: "inline-flex", alignItems: "center", gap: "8px",cursor:"pointer" }}
        >
            {hasWindow ? <VscRightPanelHide /> : <BiSolidWidget />}
            <motion.span
                variants={{
                    initial: { width: 0, opacity: 0 },
                    hover: { width: "auto", opacity: 1 }
                }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                style={{ overflow: "hidden", whiteSpace: "nowrap" }}
            >
                {hasWindow ? "Hide Widget" : "Show Widget"}
            </motion.span>
        </motion.button>
    );
}

export class MakerKioskTab implements Tab {
    id = crypto.randomUUID();
    name = "Maker Bot";
    closable = false;
    content = React.createElement(() => {
        const [hasWindow, setHasWindow] = useState<boolean>(false);
        const [loading, setLoading] = useState<boolean>(true);

        // Check the real state once on mount.
        useEffect(() => {
            let cancelled = false;

            invoke("get_maker_bot_kiosk_win")
                .then((win) => {
                    if (!cancelled) setHasWindow(Boolean(win));
                })
                .catch(() => {})
                .finally(() => {
                    if (!cancelled) setLoading(false);
                });

            return () => {
                cancelled = true;
            };
        }, []);

        // Whenever we believe the kiosk window is open, listen for its
        // "destroyed" lifecycle event so hasWindow flips back to false the
        // moment it's actually gone — no matter how it was closed (our own
        // Hide button, the native close control on the popup itself, etc).
        // Without this, the label just goes stale and keeps saying "Hide
        // Widget" for a window that no longer exists.
        useEffect(() => {
            if (!hasWindow) return;

            let cancelled = false;
            let unlisten: (() => void) | undefined;

            WebviewWindow.getByLabel("maker-bot-kiosk").then((win) => {
                if (!win || cancelled) return;

                win.once("tauri://destroyed", () => {
                    setHasWindow(false);
                }).then((fn) => {
                    if (cancelled) {
                        fn();
                    } else {
                        unlisten = fn;
                    }
                });
            });

            return () => {
                cancelled = true;
                unlisten?.();
            };
        }, [hasWindow]);

        if (loading) return <div>Loading...</div>;

        return (
            <div className="w-full h-full p-6 bg-[radial-gradient(var(--viventory-muted-surface)_1px,transparent_1px),radial-gradient(var(--viventory-border)_1px,transparent_1px)] bg-size-[16px_16px] bg-position-[0_0,8px_8px] bg-(--bg)">
                <div className="flex items-center gap-4">
                    <WidgetToggleButton
                        hasWindow={hasWindow}
                        setHasWindow={setHasWindow}
                        setLoading={setLoading}
                    />
                    <div className="w-px h-4 bg-(--viventory-border)" role="separator" aria-orientation="vertical" />
                    <p>Maker Kiosk</p>
                    <div className="w-px h-4 bg-(--viventory-border)" role="separator" aria-orientation="vertical" />
                    <motion.button onClick={async ()=>{
                        const store = await getChatStore();
                        await store.set(CHAT_HISTORY_KEY, []);
                        await store.save();
                        window.dispatchEvent(new Event("maker-bot-clear-history"));
                    }}
                                   initial="initial"
                                   whileHover="hover"
                                   style={{ display: "inline-flex", alignItems: "center", gap: "8px",cursor:"pointer" }}>
                        <MdClearAll />
                        <motion.span
                            variants={{
                                initial: { width: 0, opacity: 0 },
                                hover: { width: "auto", opacity: 1 }
                            }}
                            transition={{ duration: 0.3, ease: "easeInOut" }}
                            style={{ overflow: "hidden", whiteSpace: "nowrap" }}
                        >
                            Clear chat history
                        </motion.span>
                    </motion.button>
                </div>
                <MakerKiosk />
            </div>
        );
    });
}

export default MakerKioskTab;