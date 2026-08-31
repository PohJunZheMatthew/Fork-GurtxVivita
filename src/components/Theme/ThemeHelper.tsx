import {ReactElement, useState, useRef, useEffect} from "react";
import MattPohSlider from "../MattPohUI/MattPohSlider.tsx";
import {invoke} from "@tauri-apps/api/core";

export interface HSVColor {
    h: number;
    s: number;
    v: number;
}

export function ThemeSetter(): ReactElement {
    const [mainColor, setMainColor] = useState<HSVColor>({ h: 0.5, s: 0.5, v: 0.8 });
    const [isDragging, setIsDragging] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // 1. Synchronize component state with Rust AppState on initial load
    useEffect(() => {
        async function loadInitialTheme() {
            try {
                const savedColor = await invoke<HSVColor>("get_theme_color");
                setMainColor(savedColor);
            } catch (err) {
                console.error("Failed to load initial theme color:", err);
            }
        }
        loadInitialTheme();
    }, []);

    // Helper function to sync client interactions back to the Rust backend
    const syncColorToRust = async (color: HSVColor) => {
        try {
            await invoke("set_theme_color", { h: color.h, s: color.s, v: color.v });
        } catch (err) {
            console.error("Failed to save theme color to backend:", err);
        }
    };

    const setMainVal = (n: number) => {
        setMainColor((prev) => {
            const updated = { ...prev, v: n };
            syncColorToRust(updated);
            return updated;
        });
    };

    const updateColorFromPointer = (clientX: number, clientY: number) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const h = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
        const rawDragY = Math.max(0, Math.min(1, (clientY - rect.top) / rect.height));
        const s = rawDragY * 0.25;
        setMainColor((prev) => {
            const updated = { ...prev, h, s };
            syncColorToRust(updated);
            return updated;
        });
    };
    const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(true);
        updateColorFromPointer(e.clientX, e.clientY);
        containerRef.current?.setPointerCapture(e.pointerId);
    };

    const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
        if (!isDragging) return;
        updateColorFromPointer(e.clientX, e.clientY);
    };

    const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
        setIsDragging(false);
        containerRef.current?.releasePointerCapture(e.pointerId);
    };

    // Correctly derive HSL coordinates out of the HSV color picker state parameters
    const hDeg = Math.round(mainColor.h * 360);
    const sVal = mainColor.s;
    const vVal = mainColor.v;

    const l = vVal * (1 - sVal / 2);
    const hslS = (l === 0 || l === 1) ? 0 : (vVal - l) / Math.min(l, 1 - l);

    // Clean HSL string used to override background styling elements
    const backgroundStyle = `hsl(${hDeg}deg ${Math.round(hslS * 100)}% ${Math.round(l * 100)}%)`;

    return (
        <div
            id="ThemeSetter"
            style={{ backgroundColor: backgroundStyle }}
            className="relative z-10 flex w-full max-w-sm flex-col justify-end gap-5 rounded-lg border border-gray-100 p-2.5 shadow-sm"
        >
            <div
                ref={containerRef}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                className={`relative z-10 aspect-square w-full rounded-lg border border-gray-200 bg-white bg-[linear-gradient(to_right,#e5e7eb_1px,transparent_1px),linear-gradient(to_bottom,#e5e7eb_1px,transparent_1px)] bg-[position:-1px_-1px] bg-[size:1rem_1rem] select-none touch-none ${
                    isDragging ? "cursor-grabbing" : "cursor-crosshair"
                }`}
            >
                <div
                    style={{
                        position: 'absolute',
                        left: `${mainColor.h * 100}%`,
                        top: `${mainColor.s * 100/ 0.25}%`,
                        transform: 'translate(-50%, -50%)',
                        zIndex: 20
                    }}
                    className="pointer-events-none absolute"
                >
                    <div className="size-4 rounded-full border-2 border-white bg-black shadow-md" />
                </div>
            </div>

            <MattPohSlider
                value={mainColor.v}
                setValue={setMainVal}
                min={0.9}
                max={1}
                step={0.00001}
                className="w-full"
            />
        </div>
    );
}
