import {DynamicFormMeta, NumberControl} from "../../app/components/forms/types";
import {updateForm} from "../../app/store/modelOptions/utils";

describe("model options utils", () => {

    const mockControl: NumberControl = {
        name: "i1",
        type: "number",
        required: true
    };

    it("updated form without overwriting existing form control values", () => {

        const oldForm: DynamicFormMeta = {
            controlSections: [
                {
                    label: "general",
                    controlGroups: [
                        {
                            label: "g1",
                            controls: [{...mockControl, value: 10}]
                        },
                        {
                            label: "g2",
                            controls: [{...mockControl, value: 10}]
                        }
                    ]
                }
            ]
        };
        const newForm: DynamicFormMeta = {
            controlSections: [
                {
                    label: "general",
                    controlGroups: [
                        {
                            label: "g1",
                            controls: [
                                {...mockControl},
                                {...mockControl, name: "new_control"}
                            ]
                        },
                        {
                            label: "new_group",
                            controls: [{...mockControl}]
                        }
                    ]
                },
                {
                    label: "survey",
                    controlGroups: [
                        {
                            label: "g2",
                            controls: []
                        }
                    ]
                }
            ]
        };

        const expected: DynamicFormMeta = {
            controlSections: [
                {
                    label: "general",
                    controlGroups: [
                        {
                            label: "g1",
                            controls: [
                                {...mockControl, value: 10},
                                {...mockControl, name: "new_control"}
                            ]
                        }, {
                            label: "new_group",
                            controls: [{...mockControl}]
                        }
                    ]
                },
                {
                    label: "survey",
                    controlGroups: [
                        {
                            label: "g2",
                            controls: []
                        }
                    ]
                }
            ]
        };
        const result = updateForm(oldForm, newForm);
        expect(result).toStrictEqual(expected);
    });
});
