import {mockError, mockModelOptionsState, mockWarning} from "../mocks";
import {ModelOptionsMutation, mutations} from "../../app/store/modelOptions/mutations";
import {DynamicFormMeta, NumberControl} from "@reside-ic/vue-dynamic-form";
import {VersionInfo} from "../../app/generated";

describe("Model run options mutations", () => {

    it("does not set valid to true when save options", () => {
        const state = mockModelOptionsState();
        mutations[ModelOptionsMutation.LoadUpdatedOptions](state, {"test": 123});
        expect(state.options).toStrictEqual({"test": 123});
        expect(state.valid).toBe(false);
    });

    it("can mutate validation error", () => {
        const error = mockError("validation error occurred");
        const state = mockModelOptionsState();
        mutations[ModelOptionsMutation.HasValidationError](state, {payload: error});
        expect(state.validateError).toStrictEqual(error);
    });

    it("can mutate model options error", () => {
        const error = mockError("options error occurred");
        const state = mockModelOptionsState();
        mutations[ModelOptionsMutation.ModelOptionsError](state, {payload: error});
        expect(state.optionsError).toStrictEqual(error);
        expect(state.fetching).toBe(false)
    });

    it("can validate options and populate warnings", () => {
        const state = mockModelOptionsState();
        mutations[ModelOptionsMutation.Validate](state, {payload: {warnings: [mockWarning()]}});
        expect(state.valid).toBe(true);
        expect(state.warnings).toEqual([mockWarning()]);
    });

    it("un-validates", () => {
        const state = mockModelOptionsState({
            valid: true
        });
        mutations[ModelOptionsMutation.UnValidate](state);
        expect(state.valid).toBe(false);
    });

    it("can assert validating model option start", () => {
        const state = mockModelOptionsState();
        mutations[ModelOptionsMutation.Validating](state);
        expect(state.validating).toBe(true);
    });

    it("can assert validating model option complete", () => {
        const state = mockModelOptionsState({validating: true});
        mutations[ModelOptionsMutation.Validated](state);
        expect(state.validating).toBe(false);
    });

    it("saves version", () => {
        const state = mockModelOptionsState();
        const mockVersion: VersionInfo = {
            hintr: "1",
            naomi: "2",
            rrq: "3"
        };
        mutations[ModelOptionsMutation.SetModelOptionsVersion](state, {payload: mockVersion});
        expect(state.version).toStrictEqual(mockVersion);
    });


    it("updates form and requires re-validation", () => {
        const state = mockModelOptionsState({valid: true});
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
        expect(state.valid).toBe(false);
    });

    const mockControl: NumberControl = {
        name: "i1",
        type: "number",
        required: true
    };

    it("updates form without overwriting existing form control values and sets fetching to false", () => {

        const state = mockModelOptionsState({
            fetching: true,
            optionsFormMeta: testForm
        });

        const expected: DynamicFormMeta = {
            controlSections: [
                {
                    label: "general",
                    controlGroups: [
                        {
                            label: "g1",
                            controls: [
                                {...mockControl, name: "n1", value: 20},
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
        mutations.ModelOptionsFetched(state, {payload: newForm});
        expect(state.optionsFormMeta).toStrictEqual(expected);
        expect(state.fetching).toBe(false);
    });

    it("sets valid to false if updated form differs from existing", () => {

        const state = mockModelOptionsState({
            valid: true,
            optionsFormMeta: testForm
        });

        mutations.ModelOptionsFetched(state, {payload: newForm});
        expect(state.valid).toBe(false);
    });

    it("sets valid to false if updated form matches the existing form but the state is not valid to begin with", () => {

        const state = mockModelOptionsState({
            valid: false,
            optionsFormMeta: testForm
        });

        mutations.ModelOptionsFetched(state, {payload: testForm});
        expect(state.valid).toBe(false);
    });

    it("does not set valid to false if updated form is identical to existing", () => {

        const state = mockModelOptionsState({
            valid: true,
            optionsFormMeta: testForm
        });

        mutations.ModelOptionsFetched(state, {payload: testForm});
        expect(state.valid).toBe(true);
    });

    it("sets fetching to true", () => {
        const state = mockModelOptionsState();
        mutations.FetchingModelOptions(state);
        expect(state.fetching).toBe(true);
    });

    const testForm = {
        controlSections: [
            {
                label: "general",
                controlGroups: [
                    {
                        label: "g1",
                        controls: [{...mockControl, name: "n1", value: 20}]
                    },
                    {
                        label: "g2",
                        controls: [{...mockControl, name: "n2", value: 10}]
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
                            {...mockControl, name: "n1", value: 2},
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

});
