import type { Tab } from "../types";
import { MapView } from "./Mapview";
import { MaterialSearchView } from "./MaterialSearchViews/Materialsearchview.tsx";
import { useInventory } from "./InventoryProvider";

// MapView and MaterialSearchView are now fully independent components (see
// MapView.tsx / MaterialSearchView.tsx) — no shared internal tab switcher,
// so these two app-level tabs are genuinely single-purpose. Hooks like
// useInventory() must be called from inside a function component (as
// below), never from inside a class constructor — that was the bug in the
// previous draft (MapViewTab's constructor called useInventory() and
// referenced selectedCompartment/setSelectedCompartment directly, neither
// of which exist outside a component's render).

function MapViewTabContent() {
    const inventory = useInventory();
    return (
        <MapView
            floors={inventory.floors}
            materials={inventory.materials}
        />
    );
}

export class MapViewTab implements Tab {
    id: string = crypto.randomUUID();
    name: string = "Map";
    content: React.ReactNode;
    closable: boolean = false;

    constructor() {
        this.content = <MapViewTabContent />;
    }
}

function MaterialSearchTabContent({ initialMaterialSearch = "" }: { initialMaterialSearch?: string }) {
    const inventory = useInventory();

    return (
        <MaterialSearchView
            materials={inventory.materials}
            requests={inventory.requests}
            onSubmitRequest={inventory.submitRequest}
            initialMaterialSearch={initialMaterialSearch}
            prefs={{
                hideOutOfStock: false,
                compactCards: false,
                defaultFloor: 0,
            }}
        />
    );
}

export class MaterialSearchTab implements Tab {
    id: string = crypto.randomUUID();
    name: string = "Search for Items";
    content: React.ReactNode;
    closable: boolean = true;

    constructor(initialMaterialSearch: string = "") {
        this.content = <MaterialSearchTabContent initialMaterialSearch={initialMaterialSearch} />;
    }
}