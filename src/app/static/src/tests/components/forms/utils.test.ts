import {DynamicFormMeta, formMeta} from "../../../app/components/forms/types";
import {updateSelectedValues} from "../../../app/components/forms/utils";
import {control} from "leaflet";

describe("Dynamic form utils", () => {

    it("can update default values", () => {

        const originalMeta: DynamicFormMeta = {
            controlSections: [{
                label: "",
                controlGroups: [
                    {
                        label: "",
                        controls: [
                            {
                                name: "id_1",
                                type: "multiselect",
                                options: [],
                                required: false
                            },
                            {
                                name: "id_2",
                                type: "number",
                                required: false
                            }
                        ]
                    }
                ]
            }]
        };
        updateSelectedValues(originalMeta, {"id_1": ["q1", "q2"], "id_2": "10"});
        expect(originalMeta.controlSections[0].controlGroups[0].controls[0].default).toBe("q1,q2");
        expect(originalMeta.controlSections[0].controlGroups[0].controls[1].default).toBe("10");
    });

});
