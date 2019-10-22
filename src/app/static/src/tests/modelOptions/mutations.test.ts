import {mockModelOptionsState} from "../mocks";
import {mutations} from "../../app/store/modelOptions/mutations";
import {DynamicFormMeta} from "../../app/components/forms/types";

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

});
