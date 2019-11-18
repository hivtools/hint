import {mockModelOptionsState} from "../mocks";
import {ModelOptionsMutation, mutations} from "../../app/store/modelOptions/mutations";
import {DynamicFormMeta} from "../../app/components/forms/types";

describe("Model run options mutations", () => {

    it("validates and saves options", () => {
        const state = mockModelOptionsState();
        mutations[ModelOptionsMutation.Validate](state, {"test": 123});
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
        mutations[ModelOptionsMutation.Update](state, mockForm);
        expect(state.optionsFormMeta).toStrictEqual(mockForm);
    });

});
