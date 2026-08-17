import {SettingsPage} from "../Settings.tsx";
import {ToggleDropdown} from "../../MattPohUI/MattPohToggles.tsx";

function AccessibilityContent(){
    return (<>
            <h1>hi</h1>
            <ToggleDropdown options={["hi","bye"]} option={"hi"} setOption={()=>{}}/>
        </>)
}

const Accessibility: SettingsPage = {
    name: "Accessibility",
    description:"Accessibility",
    content: <AccessibilityContent />,

    save: () => {
        return {};
    },
};

export default Accessibility;
