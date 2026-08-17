import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { MdArrowDropDown, MdCheck } from "react-icons/md";

interface ToggleProps {
    options: string[];
    option: string;
    setOption: (option: string) => void;
    /** Label shown for the "clear selection" entry. Defaults to "None". */
    noneLabel?: string;
    /** Label shown on the trigger button when nothing is selected. */
    placeholder?: string;
}

function ToggleSwitch() {
    return (
        <div>
            <input type={""} />
        </div>
    );
}

const NONE_VALUE = "";

export default function ToggleDropdown({
                                           options,
                                           option,
                                           setOption,
                                           noneLabel = "None",
                                           placeholder = "Select...",
                                       }: ToggleProps) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Hover works fine on desktop, but it's useless on touch devices, so the
    // dropdown is also click-toggled and closes on outside click/Escape.
    useEffect(() => {
        function handlePointerDown(e: MouseEvent | TouchEvent) {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        }
        function handleKeyDown(e: KeyboardEvent) {
            if (e.key === "Escape") setIsOpen(false);
        }

        document.addEventListener("mousedown", handlePointerDown);
        document.addEventListener("touchstart", handlePointerDown);
        document.addEventListener("keydown", handleKeyDown);
        return () => {
            document.removeEventListener("mousedown", handlePointerDown);
            document.removeEventListener("touchstart", handlePointerDown);
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, []);

    const handleSelect = (value: string) => {
        setOption(value);
        setIsOpen(false);
    };

    return (
        <motion.div
            ref={containerRef}
            className="relative inline-block"
            initial="initial"
            animate={isOpen ? "hover" : "initial"}
            whileHover="hover"
            onHoverEnd={() => {
                // Only let hover close it if it wasn't opened by a click;
                // a real click-open should require an explicit close.
            }}
        >
            <button
                type="button"
                onClick={() => setIsOpen((v) => !v)}
                aria-haspopup="listbox"
                aria-expanded={isOpen}
                className="flex items-center gap-1.5 px-4 py-2 bg-gray-100 rounded-md text-sm font-medium text-gray-800 hover:bg-gray-200 transition-colors"
            >
                <span className={option ? "text-gray-900" : "text-gray-500"}>
                    {option || placeholder}
                </span>
                <motion.span
                    variants={{
                        initial: { rotate: 0 },
                        hover: { rotate: 180 },
                    }}
                    transition={{ duration: 0.3 }}
                    className="inline-block"
                >
                    <MdArrowDropDown size={20} />
                </motion.span>
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        className="absolute left-0 top-full mt-2 z-50 unique-dropdown-menu"
                        initial={{ height: 0, opacity: 0, scaleY: 0.95 }}
                        animate={{ height: "auto", opacity: 1, scaleY: 1 }}
                        exit={{ height: 0, opacity: 0, scaleY: 0.95 }}
                        style={{ originY: 0, overflow: "hidden", whiteSpace: "nowrap" }}
                        transition={{ type: "spring", duration: 0.3, bounce: 0 }}
                    >
                        <div
                            role="listbox"
                            className="min-w-[10rem] max-h-64 overflow-y-auto bg-white border border-gray-200 rounded-md shadow-lg py-1 flex flex-col"
                        >
                            <button
                                type="button"
                                role="option"
                                aria-selected={option === NONE_VALUE}
                                onClick={() => handleSelect(NONE_VALUE)}
                                className={`flex items-center justify-between gap-2 w-full text-left px-4 py-2 text-sm transition-colors ${
                                    option === NONE_VALUE
                                        ? "text-gray-900 font-medium bg-gray-50"
                                        : "text-gray-400 italic hover:bg-gray-100"
                                }`}
                            >
                                {noneLabel}
                                {option === NONE_VALUE && <MdCheck size={16} className="text-gray-700" />}
                            </button>

                            <div className="my-1 border-t border-gray-100" />

                            {options.length === 0 ? (
                                <span className="px-4 py-2 text-sm text-gray-400">No options</span>
                            ) : (
                                options.map((str) => {
                                    const selected = str === option;
                                    return (
                                        <button
                                            key={str}
                                            type="button"
                                            role="option"
                                            aria-selected={selected}
                                            onClick={() => handleSelect(str)}
                                            className={`flex items-center justify-between gap-2 w-full text-left px-4 py-2 text-sm transition-colors ${
                                                selected
                                                    ? "text-gray-900 font-medium bg-gray-50"
                                                    : "text-gray-700 hover:bg-gray-100"
                                            }`}
                                        >
                                            {str}
                                            {selected && <MdCheck size={16} className="text-gray-700" />}
                                        </button>
                                    );
                                })
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

function ToggleSlider() {}

export { ToggleDropdown, ToggleSlider, ToggleSwitch };