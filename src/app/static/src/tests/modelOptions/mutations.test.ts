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

    it("appends new sections to form", () => {
        const startingForm = {
            controlSections: [
                {
                    label: "l1",
                    controlGroups: []
                }
            ]
        };
        const state = mockModelOptionsState({optionsFormMeta: startingForm});
        const mockForm: DynamicFormMeta = {
            controlSections: [
                {
                    label: "l2",
                    controlGroups: []
                }
            ]
        };
        mutations.update(state, mockForm);
        expect(state.optionsFormMeta).toStrictEqual({...startingForm, ...mockForm});
    });

    it("does not overwrite existing form sections", () => {

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
                }
            ]
        };
        mutations.update(state, newForm);
        expect(state.optionsFormMeta).toStrictEqual(startingForm);
    });

    it("removes form sections", () => {

        const startingForm: DynamicFormMeta = {
            controlSections: [
                {
                    label: "ART",
                    controlGroups: []
                }
            ]
        };

        const state = mockModelOptionsState({optionsFormMeta: startingForm});

        const newForm: DynamicFormMeta = {
            controlSections: [
                {
                    label: "general",
                    controlGroups: []
                }
            ]
        };
        mutations.update(state, newForm);
        expect(state.optionsFormMeta).toStrictEqual(newForm);
    });

});
