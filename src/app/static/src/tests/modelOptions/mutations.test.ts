import {mockModelOptionsState} from "../mocks";
import {mutations} from "../../app/store/modelOptions/mutations";
import {DynamicFormMeta, NumberControl} from "../../app/components/forms/types";

describe("Model run options mutations", () => {

    it("validates and saves options", () => {
        const state = mockModelOptionsState();
        mutations.validate(state, {"test": 123});
        expect(state.valid).toBe(true);
        expect(state.options).toStrictEqual({"test": 123});
    });

    it("updates form", () => {
        const state = mockModelOptionsState();
        const mockForm: DynamicFormMeta = {
            controlSections: [
                {
                    label: "l1",
                    controlGroups: []
                }
            ]
        };
        mutations.update(state, mockForm);
        expect(state.optionsFormMeta).toStrictEqual(mockForm);
    });

    it("does not overwrite existing form values", () => {

        const mockControl: NumberControl = {
            name: "i1",
            type: "number",
            required: true
        };

        const startingForm: DynamicFormMeta = {
            controlSections: [
                {
                    label: "general",
                    controlGroups: [{
                        label: "g1",
                        controls: [{...mockControl, value: 10}]
                    }]
                }
            ]
        };

        const state = mockModelOptionsState({optionsFormMeta: startingForm});

        const newForm: DynamicFormMeta = {
            controlSections: [
                {
                    label: "general",
                    controlGroups: [{
                        label: "g1",
                        controls: [{...mockControl}]
                    }]
                },
                {
                    label: "ANC",
                    controlGroups: []
                }
            ]
        };
        mutations.update(state, newForm);
        const expected = {
            controlSections: [
                {
                    label: "general",
                    controlGroups: [{
                        label: "g1",
                        controls: [{
                            name: "i1",
                            value: 10, // this value should not be overwritten
                            type: "number",
                            required: true
                        }]
                    }]
                },
                {
                    label: "ANC",
                    controlGroups: []
                }
            ]
        };
        expect(state.optionsFormMeta).toStrictEqual(expected);
    });

});
