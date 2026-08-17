import React, { useEffect, useState } from "react";
import ToggleDropdown from "../MattPohUI/MattPohToggles.tsx";
import { getMaterialsCategory } from "../../utils/materialSearch.ts";

export interface MaterialFilter {
    name: string;
    renderedOptions: (
        setSearchStr: React.Dispatch<React.SetStateAction<string>>
    ) => React.ReactNode;
}

// Matches tokens like: /category: "Fasteners"
const FILTER_TOKEN_RE = /\/[a-zA-Z0-9_-]+:\s*"[^"]*"\s*/g;

function CategoryFilterControl({
                                   setSearchStr,
                               }: {
    setSearchStr: React.Dispatch<React.SetStateAction<string>>;
}) {
    const categories = getMaterialsCategory();
    const [option, setOption] = useState<string>("");

    // Bug fix: the old code called setSearchStr(...) directly in the render
    // body (inside a .map() in JSX), which is a state update during render
    // and either throws or causes an infinite re-render loop. Doing it in
    // useEffect, keyed off `option`, makes it a proper side effect.
    useEffect(() => {
        setSearchStr(prev => {
            const withoutTag = prev.replace(/\/category:\s*"[^"]*"\s*/g, "");
            return option ? `${withoutTag}/category: "${option}" ` : withoutTag;
        });
    }, [option, setSearchStr]);

    return (
        <div>
            <ToggleDropdown options={categories} option={option} setOption={setOption} />
        </div>
    );
}

export function useFilterStates() {
    return useState<MaterialFilter[]>([
        {
            name: "Category",
            renderedOptions: (setSearchStr) => (
                <CategoryFilterControl key="category-filter" setSearchStr={setSearchStr} />
            ),
        },
    ]);
}

export function removeFiltersFromSearchStr(str: string): string {
    return str.replace(FILTER_TOKEN_RE, "").trim();
}