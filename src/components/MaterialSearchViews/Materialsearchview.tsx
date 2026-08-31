import React, { useEffect, useState } from 'react';
import {filterMaterialByCategory, filterMaterialsBySearch} from '../../utils/materialSearch.ts';
import { isMaterialAvailable } from '../../utils/materialDetails.ts';
import { translatedStockLabel, useI18n } from '../../i18n/i18n.ts';
import {
    Search,
    Send,
    Check,
    Package,
    Clock3, Filter,
} from 'lucide-react';
import { Material, MaterialRequest } from '../../types.ts';
import { UserPrefs } from '../SettingsView.tsx';
import { styles } from '../Userviewstyles.ts';
import {easeInOut, motion} from "framer-motion";
import ToggleDropdown from "../MattPohUI/MattPohToggles.tsx";
import {MdArrowRight} from "react-icons/md";
import {IoMdArrowRoundForward} from "react-icons/io";
import {HiMiniCubeTransparent} from "react-icons/hi2";
import {MaterialView} from "./MaterialView.tsx";
import {removeFiltersFromSearchStr, useFilterStates} from "./MaterialFilterHelper.tsx";

interface MaterialSearchViewProps {
    materials: Material[];
    requests: MaterialRequest[];
    onSubmitRequest: (materialId: string, quantity: number, reason: string) => Promise<void> | void;
    prefs?: UserPrefs;
    initialMaterialSearch?: string;
}
interface MaterialHomeSearchViewProps {
    materials: Material[];
    requests: MaterialRequest[];
    onSubmitRequest: (materialId: string, quantity: number, reason: string) => Promise<void> | void;
    prefs?: UserPrefs;
    initialMaterialSearch?: string;
    setCurrentMaterial:any
}
function textToLowSatColorHex(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash |= 0;
    }

    // 1. Map the hash to a Hue between 0 and 360 degrees
    const h = Math.abs(hash) % 361;

    // 2. Set your fixed Saturation and Value constraints
    const s = 0.8; // Low saturation (as requested, but you can lower this to 0.2 - 0.4 for true pastels)
    const v = 1.0; // Fixed at 1.0 so it is bright and never black

    // 3. Convert HSV to RGB
    const c = v * s;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = v - c;

    let r = 0, g = 0, b = 0;

    if (h >= 0 && h < 60)      { r = c; g = x; b = 0; }
    else if (h >= 60 && h < 120)  { r = x; g = c; b = 0; }
    else if (h >= 120 && h < 180) { r = 0; g = c; b = x; }
    else if (h >= 180 && h < 240) { r = 0; g = x; b = c; }
    else if (h >= 240 && h < 300) { r = x; g = 0; b = c; }
    else if (h >= 300 && h <= 360){ r = c; g = 0; b = x; }

    // 4. Convert 0-1 RGB fractions to 0-255 integers
    const rInt = Math.round((r + m) * 255);
    const gInt = Math.round((g + m) * 255);
    const bInt = Math.round((b + m) * 255);

    // 5. Format to hex string
    const toHex = (num: number) => num.toString(16).padStart(2, "0");
    return `#${toHex(rInt)}${toHex(gInt)}${toHex(bInt)}`;
}
export function HomeSearchView({
                                   materials,
                                   requests,
                                   onSubmitRequest,
                                   prefs,
                                   initialMaterialSearch = '',
                                   setCurrentMaterial
                               }: MaterialHomeSearchViewProps){
    const categoriesMaterials = filterMaterialByCategory(materials);

    // Sort only the categories from A to Z
    const sortedCategories = Object.entries(categoriesMaterials).sort(([a], [b]) =>
        a.localeCompare(b)
    );
    return (
        <>
            {sortedCategories.map(([cat, mats]) => (
                <div key={cat} className="text-left w-full mb-4">
                    {/* Category Header Row - Vertically Centered */}
                    <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-bold text-lg leading-none">{cat}</h3>

                        {/* Thicker Vertical Separator */}
                        <div
                            className="w-[2px] h-4 bg-(--viventory-border) self-center"
                            role="separator"
                            aria-orientation="vertical"
                        />

                        {/* Header View Category Button - Vertically Centered */}
                        <motion.button
                            initial="initial"
                            whileHover="hover"
                            style={{
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: "6px",
                                cursor: "pointer",
                                background: "none",
                                border: "none",
                                padding: 0
                            }}
                        >
                            <motion.span
                                variants={{
                                    initial: { width: 0, opacity: 0 },
                                    hover: { width: "auto", opacity: 1 }
                                }}
                                transition={{ duration: 0.3, ease: "easeInOut" }}
                                style={{
                                    overflow: "hidden",
                                    whiteSpace: "nowrap",
                                    display: "inline-block"
                                }}
                            >
                                view category...
                            </motion.span>
                            <IoMdArrowRoundForward className="flex-shrink-0" />
                        </motion.button>
                    </div>

                    {/* Horizontal Materials Grid Row - Vertically Centered Elements */}
                    <div className="w-full flex flex-row items-center overflow-x-auto min-w-full gap-4 pb-2">
                        {mats.map((mat: Material) => (
                            <motion.div
                                layout
                                key={mat.id || mat.name}
                                onClick={() => { setCurrentMaterial(mat) }}
                                initial="rest"
                                whileHover="hover"
                                variants={{
                                    rest: {
                                        width: '8rem',
                                        height: '9.25rem', // Tall state to account for the bottom div
                                    },
                                    hover: {
                                        width: '16rem',
                                        height: '8rem', // Collapses to standard square height as it expands wide
                                    }
                                }}
                                transition={{
                                    type: "spring",
                                    stiffness: 300,
                                    damping: 30
                                }}
                                className="flex flex-row items-start bg-[#f3f4f6] rounded-md p-1.5 overflow-hidden cursor-pointer relative shrink-0 select-none"
                            >
                                <div className="w-28 h-28 flex items-center justify-center p-1 shrink-0 aspect-square bg-white rounded">
                                    <HiMiniCubeTransparent className="w-full h-full text-gray-600" />
                                </div>

                                <motion.div
                                    variants={{
                                        rest: {
                                            opacity: 1,
                                            y: 0,
                                            pointerEvents: "auto"
                                        },
                                        hover: {
                                            opacity: 0,
                                            y: 40, // Drops out of the bottom overflow border
                                            pointerEvents: "none"
                                        }
                                    }}
                                    transition={{ type: "spring", stiffness: 260, damping: 25 }}
                                    style={{
                                        position: "absolute",
                                        bottom: "8px",
                                        left: "8px",
                                        width: "calc(8rem - 16px)", // Matches the rest width of the card minus padding
                                    }}
                                    className="flex flex-col items-center text-center pt-1"
                                >
                                    <p className="text-[10px] text-gray-800 font-medium line-clamp-1 w-full">
                                        {mat.name}
                                    </p>
                                </motion.div>
                                <motion.div
                                    variants={{
                                        rest: { opacity: 0, x: 20, pointerEvents: "none" },
                                        hover: { opacity: 1, x: 0, pointerEvents: "auto" }
                                    }}
                                    transition={{ type: "spring", stiffness: 260, damping: 25 }}
                                    className="w-28 min-h-28 flex flex-col items-center justify-between p-2 border-2 border-black rounded-xl shrink-0 ml-2 bg-white/50"
                                >
                                    <div className="w-full text-center flex flex-col space-y-2 mb-2 pb-2 pt-2">
                                        <p className="text-[10px] text-gray-800 font-semibold leading-tight line-clamp-2 w-full mb-0.5">
                                            {mat.name}

                                        </p>
                                        <p className="text-[9px] text-gray-500 leading-none">
                                            Qty: {mat.quantity} {mat.unit}

                                        </p>
                                        <p className="text-[9px] text-gray-500 leading-none w-full text-wrap">
                                            Loc: {mat.location} ({mat.storage})

                                        </p>
                                    </div>

                                    <button className="bg-black text-white text-[10px] py-1 px-3 rounded-md w-full font-medium hover:bg-gray-800 active:scale-95 transition-all mt-auto">
                                        Request
                                    </button>
                                </motion.div>

                            </motion.div>
                        ))}

                        <motion.button
                            key={`${cat}-extra`}
                            className="aspect-square h-32 w-32 flex-none bg-gray-100 rounded-full"
                            initial="initial"
                            whileHover="hover"
                            onClick={() => {}}
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                                cursor: 'pointer',
                                border: 'none',
                                padding: '0 12px',
                                overflow: 'hidden'
                            }}
                        >
                            <IoMdArrowRoundForward className="flex-shrink-0" />

                            <motion.span
                                variants={{
                                    initial: { maxWidth: 0, opacity: 0 },
                                    hover: {
                                        maxWidth: 160,
                                        opacity: 1,
                                        transition: {
                                            staggerChildren: 0.05,
                                            duration: 0.3,
                                            ease: 'easeInOut'
                                        }
                                    }
                                }}
                                transition={{ duration: 0.3, ease: 'easeInOut' }}
                                style={{
                                    overflow: 'hidden',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    // Fixes container clipping bounding box calculations
                                    height: 'auto',
                                    padding: '4px 0'
                                }}
                            >
        <span style={{
            display: 'flex',
            flexWrap: 'wrap',
            width: 'max-content',
            columnGap: '4px',
            rowGap: '2px',
            whiteSpace: 'normal',
            textAlign: 'left',
            // Removed tight line-height to let letters breathe naturally
            lineHeight: 'normal'
        }}>
            {"View category...".split(" ").map((word, index) => (
                <motion.span
                    key={index}
                    variants={{
                        initial: { opacity: 0, y: 5 },
                        hover: { opacity: 1, y: 0 }
                    }}
                    transition={{ duration: 0.18, ease: 'easeOut' }}
                    style={{
                        display: 'inline-block',
                        wordBreak: 'keep-all'
                    }}
                >
                    {word}
                </motion.span>
            ))}
        </span>
                            </motion.span>
                        </motion.button>
                    </div>
                </div>
            ))}
        </>
    )
}
const MotionFilter = motion(Filter);

// Materials-search half of the old combined UserView, including the
// request modal. No tab switcher — this is the entire content of the
// "Search for Items" tab.

function getRandomPlaceholder(plshdrs: string[]): string {
    if (!plshdrs?.length) return "";

    return plshdrs[Math.floor(Math.random() * plshdrs.length)];
}

type Phase = "typing" | "waiting" | "deleting";
export function MaterialSearchView({
                                       materials,
                                       requests,
                                       onSubmitRequest,
                                       prefs,
                                       initialMaterialSearch = ''
                                   }: MaterialSearchViewProps) {
    const [search, setSearch] = useState(initialMaterialSearch);
    const [requesting, setRequesting] = useState<Material | null>(null);
    const [reqQty, setReqQty] = useState('1');
    const [reqReason, setReqReason] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [requestError, setRequestError] = useState('');
    const { language, t } = useI18n();
    const [currentMaterial, setCurrentMaterial] = useState<Material | undefined>();
    const noFilterSearchstr = removeFiltersFromSearchStr(search);

    // Extract the `/category: "X"` token (if present) and apply it on top
    // of the text search — previously this was parsed/rendered but never
    // actually used to filter the results.
    const categoryMatch = search.match(/\/category:\s*"([^"]*)"/);
    const categoryFilterValue = categoryMatch?.[1] ?? '';

    const filteredMaterials = filterMaterialsBySearch(materials, noFilterSearchstr)
        .filter(mat => !categoryFilterValue || mat.category === categoryFilterValue);
    const hasMaterialSearch = noFilterSearchstr.trim().length > 0;
    const [filterstates] = useFilterStates();


    const [isFocus, setFocus] = useState(false);
    const [idx, setIdx] = useState(0);
    const [phase, setPhase] = useState<Phase>("typing");
    const placeholders = materials.map((mat)=>{return mat.name});
    const [rndPlaceholder, setRndPlaceholder] = useState(() =>
        getRandomPlaceholder(placeholders)
    );

    // This tab IS the materials view now (no more switching an internal
    // activeTab into view), so the listener just needs to update the
    // search box — it no longer needs to flip a tab into view.
    useEffect(() => {
        const handleMaterialSearch = (event: Event) => {
            const detail = (event as CustomEvent<{ query?: string }>).detail;
            setSearch(detail?.query ?? '');
        };

        window.addEventListener('viventory:material-search', handleMaterialSearch);

        return () => {
            window.removeEventListener('viventory:material-search', handleMaterialSearch);
        };
    }, []);

    const handleRequest = async () => {
        if (!requesting) return;
        const quantity = Number(reqQty);
        if (!Number.isInteger(quantity) || quantity <= 0) {
            setRequestError(t('user.errQty'));
            return;
        }
        if (requesting.quantity > 0 && quantity > requesting.quantity) {
            setRequestError(t('user.errMax', { count: requesting.quantity, unit: requesting.unit }));
            return;
        }

        try {
            setSubmitting(true);
            setRequestError('');
            await onSubmitRequest(requesting.id, quantity, reqReason.trim());
            setSubmitted(true);
            window.setTimeout(() => {
                setRequesting(null);
                setSubmitted(false);
                setReqQty('1');
                setReqReason('');
                setRequestError('');
            }, 800);
        } catch (error) {
            setRequestError(error instanceof Error ? error.message : t('user.errFailed'));
        } finally {
            setSubmitting(false);
        }
    };

    const closeRequestModal = () => {
        if (submitting) return;

        setRequesting(null);
        setSubmitted(false);
        setReqQty('1');
        setReqReason('');
        setRequestError('');
    };

    const startRequest = (material: Material) => {
        setRequesting(material);
        setSubmitted(false);
        setReqQty('1');
        setReqReason('');
        setRequestError('');
    };
    const inputRef = React.useRef<HTMLInputElement>(null);

    const myRequests = requests.filter(r => r.status === 'pending');

    useEffect(() => {
        if (isFocus) return;

        const timeout = setTimeout(() => {
            if (phase === "typing") {
                if (idx < rndPlaceholder.length) {
                    setIdx((i) => i + 1);
                } else {
                    setPhase("waiting");
                }
            }

            if (phase === "waiting") {
                setPhase("deleting");
            }

            if (phase === "deleting") {
                if (idx > 0) {
                    setIdx((i) => i - 1);
                } else {
                    setRndPlaceholder(
                        getRandomPlaceholder(placeholders)
                    );
                    setPhase("typing");
                }
            }
        }, phase === "waiting" ? 1200 : 80);

        return () => clearTimeout(timeout);
    }, [
        idx,
        phase,
        rndPlaceholder,
        placeholders,
        isFocus,
    ]);

    const currentPlaceholder = rndPlaceholder.slice(0, idx);

    // Small result sets get the flat grid (easy to scan, no scrolling).
    // Large result sets — whether that's because the search/category filter
    // is broad or because there's no filter at all — switch to the
    // horizontally-scrollable, category-grouped layout instead, since a
    // long flat grid becomes an unwieldy wall of cards. This is based on
    // result count alone (not on whether a search is active), so typing a
    // short/broad query that still matches a lot of items correctly falls
    // back to the grouped view rather than dumping everything into one grid.
    const GRID_ITEM_THRESHOLD = 20;
    const showFlatGrid = filteredMaterials.length < GRID_ITEM_THRESHOLD;

    return (
        <div style={styles.container}>

            { (currentMaterial==null) ? <div style={styles.materialsPanel}>
                <div style={styles.searchBar}>
                    <div style={{position: 'relative'}}>
                        <Search
                            style={{
                                position: 'absolute',
                                left: 16,
                                top: 15,
                                color: 'var(--viventory-muted-text)'
                            }}
                        />

                        <div className="relative w-full h-10 border rounded-lg overflow-hidden bg-white px-2 font-mono text-base">
                            {/* Highlight layer */}
                            <div
                                className="
            absolute
            left-2
            top-0
            z-0
            h-full
            w-[calc(100%-1rem)]
            flex
            items-center
            pointer-events-none
            whitespace-pre
            overflow-hidden
            leading-6
        "
                            >
                                {(() => {
                                    const text = search;
                                    const commandRegex = /\/[a-zA-Z0-9_-]+:\s*"[^"]*"/g;
                                    const parts = [];
                                    let lastIndex = 0;
                                    let match;

                                    while ((match = commandRegex.exec(text)) !== null) {
                                        if (match.index > lastIndex) {
                                            parts.push({
                                                text: text.slice(lastIndex, match.index),
                                                command: false,
                                            });
                                        }
                                        parts.push({
                                            text: match[0],
                                            command: true,
                                        });
                                        lastIndex = match.index + match[0].length;
                                    }

                                    if (lastIndex < text.length) {
                                        parts.push({
                                            text: text.slice(lastIndex),
                                            command: false,
                                        });
                                    }

                                    return parts.map((part, index) => (
                                        <span
                                            key={index}
                                            style={{
                                                backgroundColor:(part.command) ? textToLowSatColorHex(part.text) : ""
                                            }}
                                            className={
                                                part.command
                                                    ? `text-white rounded-md px-1 -mx-1`
                                                    : ""
                                            }
                                        >
                                        {part.text}
                                    </span>
                                    ));
                                })()}
                            </div>

                            {/* Actual input / cursor */}
                            <input
                                ref={inputRef}
                                type="text"
                                value={search}
                                placeholder={currentPlaceholder}
                                onFocus={() => setFocus(true)}
                                onBlur={() => setFocus(false)}
                                onChange={(e) => {
                                    const input = e.target;
                                    const start = input.selectionStart ?? 0;

                                    let cleanValue = input.value
                                        .replace(/[“”]/g, '"')
                                        .replace(/[‘’]/g, "'");

                                    setSearch(cleanValue);

                                    requestAnimationFrame(() => {
                                        if (inputRef.current) {
                                            inputRef.current.setSelectionRange(start, start);
                                        }
                                    });
                                }}
                                className="
                                absolute
                                left-2
                                top-0
                                z-10
                                w-[calc(100%-1rem)]
                                h-full
                                bg-transparent
                                text-transparent
                                caret-black
                                outline-none
                                text-left
                                font-mono
                                text-base
                                leading-6
        "
                            />
                        </div>

                        <MotionFilter
                            initial={{ opacity: 0, scale: 0.5 }}
                            animate={{ opacity: 1, scale: 1 }}
                            whileHover={{ rotate: 180 }}
                            transition={{ duration: 0.3 }}
                        />
                        {
                            filterstates.map((fm)=>{
                                return fm.renderedOptions(setSearch)
                            })
                        }
                    </div>
                </div>

                {filteredMaterials.length > 0 ? (
                    <div className="w-full">
                        {
                            showFlatGrid ?
                                (
                                    <div className="w-full grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-4 items-start cursor-pointer">
                                        {filteredMaterials.map((mat) => (
                                            <motion.div
                                                key={mat.id || mat.name}
                                                layout
                                                onClick={() => setCurrentMaterial(mat)}
                                                initial="rest"
                                                whileHover="hover"
                                                variants={{
                                                    rest: {
                                                        boxShadow: "0 0 0 rgba(0,0,0,0)",
                                                    },
                                                    hover: {
                                                        boxShadow:
                                                            "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
                                                    },
                                                }}
                                                transition={{
                                                    layout: {
                                                        duration: 0.3,
                                                        ease: "easeInOut",
                                                    },
                                                    duration: 0.3,
                                                }}
                                                className="
                                                    group
                                                    w-full
                                                    self-start
                                                    overflow-hidden
                                                    rounded-lg
                                                    border-2
                                                    p-5
                                                    flex
                                                    flex-col
                                                    items-center
                                                    bg-white
                                                "
                                            >
                                                {/* Icon */}
                                                <div className="w-full aspect-square flex items-center justify-center">
                                                    <HiMiniCubeTransparent className="w-4/5 h-4/5 text-gray-600" />
                                                </div>

                                                {/* Name */}
                                                <div className={"w-full mt-2 text-sm font-medium text-center truncate border rounded-lg shadow-md"}>
                                                <span className="">
                                                    {mat.name}
                                                </span>

                                                    {/* Details */}
                                                    <motion.div
                                                        variants={{
                                                            rest: {
                                                                opacity: 0,
                                                                height: 0,
                                                                marginTop: 0,
                                                            },
                                                            hover: {
                                                                opacity: 1,
                                                                height: "auto",
                                                                marginTop: 1,
                                                            },
                                                        }}
                                                        transition={{
                                                            duration: 0.25,
                                                            ease: "easeOut",
                                                        }}
                                                        className="w-full overflow-hidden text-[12px]"
                                                    >
                                                        <div className="text-center space-y-1 p-2.5">
                                                            {/* Shrunk to text-sm */}
                                                            <p className="text-xs font-medium text-gray-700">
                                                                Qty: {mat.quantity} {mat.unit}
                                                            </p>

                                                            {/* Shrunk to text-xs to help prevent truncation */}
                                                            <p className="truncate text-xs text-gray-500">
                                                                Loc: {mat.location}, {mat.storage}
                                                            </p>

                                                            <motion.button
                                                                whileTap={{ scale: 0.97 }}
                                                                onClick={(e) => { e.stopPropagation(); startRequest(mat); }}
                                                                className="
                                                                w-full
                                                                rounded-lg
                                                                px-4
                                                                py-2.5
                                                                text-sm
                                                                font-semibold
                                                            "
                                                            >
                                                                Request
                                                            </motion.button>
                                                        </div>
                                                    </motion.div>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                )
                                :
                                (<HomeSearchView materials={filteredMaterials} requests={requests}
                                                 onSubmitRequest={onSubmitRequest} setCurrentMaterial={setCurrentMaterial}/>)
                        }
                    </div>
                ) : (
                    <div style={styles.emptyState}>
                        {hasMaterialSearch
                            ? t('user.noResults', {query: noFilterSearchstr.trim()})
                            : t('user.noMaterials')}
                    </div>
                )}

                {myRequests.length > 0 && (
                    <div style={styles.pendingPanel}>
                        <Clock3 size={18}/>
                        {t('user.pending', {count: myRequests.length})}
                    </div>
                )}
            </div> : <MaterialView material={currentMaterial} onSubmitRequest={onSubmitRequest} setCurrentMaterial={setCurrentMaterial}/>}

            {requesting && (
                <div style={styles.modalBackdrop}>
                    <div style={styles.modal}>
                        {submitted ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <Check />
                                {t('user.requestSubmitted')}
                            </div>
                        ) : (
                            <>
                                <h3 style={{ margin: 0, fontSize: 24, letterSpacing: 0 }}>
                                    {t('user.requestTitle', { name: requesting.name })}
                                </h3>
                                <p style={{ margin: 0, color: 'var(--viventory-muted-text)' }}>
                                    {t('user.requestSub')}
                                </p>

                                <input
                                    type="number"
                                    min={1}
                                    step={1}
                                    max={requesting.quantity > 0 ? requesting.quantity : undefined}
                                    value={reqQty}
                                    onChange={e => setReqQty(e.target.value)}
                                    style={styles.input}
                                />

                                <textarea
                                    value={reqReason}
                                    onChange={e => setReqReason(e.target.value)}
                                    placeholder={t('user.reasonPlaceholder')}
                                    style={{
                                        ...styles.input,
                                        minHeight: 96,
                                        borderRadius: 8,
                                        padding: 12,
                                        resize: 'vertical'
                                    }}
                                />

                                {requestError && (
                                    <p style={{ margin: 0, color: 'var(--viventory-welcome-accent-2)', fontWeight: 750 }}>
                                        {requestError}
                                    </p>
                                )}

                                <div style={styles.buttonRow}>
                                    <button style={styles.primaryBtn} onClick={handleRequest} disabled={submitting}>
                                        {submitting ? t('user.submitting') : t('user.submit')}
                                    </button>
                                    <button style={styles.secondaryBtn} onClick={closeRequestModal} disabled={submitting}>
                                        {t('user.cancel')}
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}