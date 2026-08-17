import {AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

interface MattPohTextInputProps {
    placeholder: string;
    placeholders: string[];
}

function getRandomPlaceholder(plshdrs: string[]): string {
    if (!plshdrs?.length) return "";

    return plshdrs[Math.floor(Math.random() * plshdrs.length)];
}

type Phase = "typing" | "waiting" | "deleting";

export function MattPohTextInput({
                                     placeholder,
                                     placeholders,
                                 }: MattPohTextInputProps) {
    const [isFocus, setFocus] = useState(false);
    const [idx, setIdx] = useState(0);
    const [phase, setPhase] = useState<Phase>("typing");

    const [rndPlaceholder, setRndPlaceholder] = useState(() =>
        getRandomPlaceholder(placeholders)
    );

    /*
     * Reset animation when the placeholder list changes.
     */
    useEffect(() => {
        setRndPlaceholder(getRandomPlaceholder(placeholders));
        setIdx(0);
        setPhase("typing");
    }, [placeholders]);

    /*
     * Typewriter.
     */
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

    return (<>
            <motion.div
                initial={false}
                animate={{
                    scale: isFocus ? 1.015 : 1,
                }}
                transition={{
                    type: "spring",
                    stiffness: 400,
                    damping: 30,
                }}
                className="relative"
            >
                <motion.input
                    className="
                    w-full rounded-lg border p-2 text-sm outline-none
                    transition-colors
                "
                    animate={{
                        borderColor: isFocus
                            ? "#6366f1"
                            : "#d1d5db",

                        boxShadow: isFocus
                            ? "0 0 0 4px rgba(99, 102, 241, 0.12)"
                            : "0 0 0 0px rgba(99, 102, 241, 0)",
                    }}
                    transition={{
                        type: "spring",
                        stiffness: 350,
                        damping: 30,
                    }}
                    placeholder=""
                    onFocus={() => setFocus(true)}
                    onBlur={() => setFocus(false)}
                />

                {/* Placeholder layer */}
                <div
                    className="
                    pointer-events-none
                    absolute inset-y-0 left-2
                    flex items-center
                    text-sm text-gray-400
                "
                >
                    <AnimatePresence mode="wait">
                        {isFocus ? (
                            <motion.span
                                key="normal-placeholder"
                                initial={{
                                    opacity: 0,
                                    y: 4,
                                }}
                                animate={{
                                    opacity: 1,
                                    y: 0,
                                }}
                                exit={{
                                    opacity: 0,
                                    y: -4,
                                }}
                                transition={{
                                    duration: 0.18,
                                }}
                            >
                                {placeholder}
                            </motion.span>
                        ) : (
                            <motion.span
                                key="animated-placeholder"
                                initial={{
                                    opacity: 0,
                                    y: 4,
                                }}
                                animate={{
                                    opacity: 1,
                                    y: 0,
                                }}
                                exit={{
                                    opacity: 0,
                                    y: -4,
                                }}
                                transition={{
                                    duration: 0.18,
                                }}
                            >
                                {currentPlaceholder}

                                {/* Animated cursor */}
                                <motion.span
                                    className="
                                    ml-0.5 inline-block
                                    h-4 w-[1px]
                                    bg-gray-400
                                    align-middle
                                "
                                    animate={{
                                        opacity: [1, 0, 1],
                                    }}
                                    transition={{
                                        duration: 0.9,
                                        repeat: Infinity,
                                        ease: "easeInOut",
                                    }}
                                />
                            </motion.span>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>

            <motion.div>
                {/*<motion.div*/}
                {/*contentEditable={"true"}       dangerouslySetInnerHTML={{ __html: html }}/>*/}
            </motion.div>
        </>

    );
}
