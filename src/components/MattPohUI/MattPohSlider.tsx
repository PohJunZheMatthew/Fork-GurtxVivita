import { ChangeEventHandler, CSSProperties, ReactElement } from "react";

interface MattPohSliderProps {
    value: number;
    setValue: (n: number) => void;
    styling?: CSSProperties;
    className?: string;
    min?: number;
    max?: number;
    step?: number;
}

export default function MattPohSlider({
                                          value,
                                          setValue,
                                          styling,
                                          className = "",
                                          min,
                                          max,
                                          step
                                      }: MattPohSliderProps): ReactElement {
    const onChange: ChangeEventHandler<HTMLInputElement> = (t) => {
        setValue(Number(t.target.value));
    };

    return (
        <input
            type="range"
            style={styling}
            value={value}
            onChange={onChange}
            className={`
                /* Core Input & Track Layout */
                w-32 h-3 bg-gray-200 rounded-full appearance-none cursor-pointer accent-blue-600
                
                [&::-webkit-slider-runnable-track]:h-3
                [&::-webkit-slider-runnable-track]:rounded-full
                [&::-webkit-slider-runnable-track]:border-2
                [&::-webkit-slider-runnable-track]:border-black
                
                /* Firefox Track Border Fix (Keeps browsers identical) */
                [&::-moz-range-track]:h-3
                [&::-moz-range-track]:rounded-full
                [&::-moz-range-track]:border-2
                [&::-moz-range-track]:border-black
                
                /* Webkit Thumb Base Styles */
                [&::-webkit-slider-thumb]:appearance-none 
                [&::-webkit-slider-thumb]:w-6 
                [&::-webkit-slider-thumb]:h-6 
                [&::-webkit-slider-thumb]:rounded-full 
                [&::-webkit-slider-thumb]:bg-blue-500 
                [&::-webkit-slider-thumb]:transition-all 
                [&::-webkit-slider-thumb]:duration-[250ms] 
                [&::-webkit-slider-thumb]:mt-[-6px] 

                /* Webkit Thumb Interactive Y-Values */
                hover:[&::-webkit-slider-thumb]:h-7 
                hover:[&::-webkit-slider-thumb]:transform 
                hover:[&::-webkit-slider-thumb]:translate-y-[-4px]
                active:[&::-webkit-slider-thumb]:h-8 
                active:[&::-webkit-slider-thumb]:transform 
                active:[&::-webkit-slider-thumb]:translate-y-[-8px]

                /* Firefox Thumb Support (Matches your styles exactly) */
                [&::-moz-range-thumb]:border-0
                [&::-moz-range-thumb]:w-6 
                [&::-moz-range-thumb]:h-6 
                [&::-moz-range-thumb]:rounded-full 
                [&::-moz-range-thumb]:bg-blue-500 
                [&::-moz-range-thumb]:transition-all 
                [&::-moz-range-thumb]:duration-[250ms]
                hover:[&::-moz-range-thumb]:h-7 
                hover:[&::-moz-range-thumb]:transform 
                hover:[&::-webkit-slider-thumb]:translate-y-[-4px]
                active:[&::-moz-range-thumb]:h-8 
                active:[&::-moz-range-thumb]:transform 
                active:[&::-moz-range-thumb]:translate-y-[-8px]

                ${className}
            `}
            min={min}
            max={max}
            step={step}
        />
    );
}
