import type { Material } from "../types";
import {useInventory} from "../components/InventoryProvider.tsx";

export function normalizeMaterialSearchQuery(query: string): string {
    return query.trim().toLowerCase();
}

export function filterMaterialsBySearch(
    materials: Material[],
    query: string
): Material[] {
    const normalizedQuery = normalizeMaterialSearchQuery(query);

    if (!normalizedQuery) {
        return materials;
    }

    return materials.filter(material =>
        [
            material.name,
            material.description,
            material.category,
            material.location,
            material.storage,
            material.supplier,
        ].some(value => value?.toLowerCase().includes(normalizedQuery))
    );
}

export function filterMaterialByCategory(
    materials: Material[]
): Record<string, Material[]> {
    const categories: Record<string, Material[]> = {};
    const maxItemsPerCategory = window.innerWidth / 150;
    for (const material of materials) {
        if (material.category != null && material.category.trim() !== "") {
            if (categories[material.category] == null) {
                categories[material.category] = [];
            }
            if (categories[material.category].length < maxItemsPerCategory) {
                categories[material.category].push(material);
            }
        } else {
            if (categories["Misc"] == null) {
                categories["Misc"] = [];
            }
            if (categories["Misc"].length < maxItemsPerCategory) {
                categories["Misc"].push(material);
            }
        }
    }

    return categories;
}

export function getMaterialsCategory(): string[] {
    const materials = useInventory().materials;
    const categories: string[] = ["Misc"];
    for (const material of materials) {
        if (material.category != null && material.category.trim() !== "") {
            // Bug fix: Array.prototype.includes() returns a boolean, never null,
            // so the old `=== null` check meant new categories were never added.
            if (!categories.includes(material.category)) {
                categories.push(material.category);
            }
        }
    }

    return categories;
}