import { SettingsPage } from "../Settings.tsx";

function AccessibilityContent() {
    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const currentSize = Number(event.target.value);
        console.log("New font size:", currentSize);
    };

    return (
        <div style={{ 
            display: "flex", 
            flexDirection: "column", 
            alignItems: "center", 
            justifyContent: "center",
            width: "100%",
            textAlign: "center"
        }}>
            <h1>Font Size</h1>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <input
                    type="number"
                    defaultValue={16}
                    min={12}
                    max={32}
                    onChange={handleChange}
                    style={{
                        padding: "8px",
                        borderRadius: "4px",
                        border: "1px solid #ccc",
                        width: "80px",
                        textAlign: "center"
                    }}
                />
                <span>px</span>
            </div>
        </div>
    );
}

const Accessibility: SettingsPage = {
    name: "Accessibility",
    description: "Accessibility",
    content: <AccessibilityContent />,

    save: () => {
        return {};
    },
};

export default Accessibility;
