import {mockError, mockModelOptionsState, mockWarning} from "../mocks";
import {ModelOptionsMutation, mutations} from "../../app/store/modelOptions/mutations";
import {DynamicFormMeta, MultiSelectControl, NumberControl, SelectControl} from "@reside-ic/vue-next-dynamic-form";
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

    it("can validate options and populate and clear warnings", () => {
        const state = mockModelOptionsState();
        mutations[ModelOptionsMutation.Validate](state, {payload: {warnings: [mockWarning()]}});
        expect(state.valid).toBe(true);
        expect(state.warnings).toEqual([mockWarning()]);
        mutations[ModelOptionsMutation.ClearWarnings](state);
        expect(state.warnings).toEqual([]);
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

    const mockSelectControl: SelectControl = {
        name: "selectControl",
        type: "select",
        required: false,
        options: [
            { id: "10", label: "10" },
            { id: "20", label: "20" }
        ]
    };

    const mockChildrenSelect: SelectControl = {
        name: "childrenSelect",
        type: "select",
        required: false,
        options: [{id: "opt1", label: "l1", children: [{id: "opt2", label: "l2"}]}]
    };

    const mockMultiSelectControl: MultiSelectControl = {
        name: "control",
        type: "multiselect",
        required: true,
        options: [
            { id: "10", label: "10" },
            { id: "20", label: "20" }
        ]
    };

    it("updates form without overwriting existing form control values and sets fetching to false", () => {

        const state = mockModelOptionsState({
            fetching: true,
            options: testOptions
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
                                {...mockControl, name: "new_control"},
                                {...mockSelectControl, name: "select", value: "20"},
                                {...mockChildrenSelect, name: "children", value: "opt2"},
                                {...mockMultiSelectControl, name: "multiselect", value: ["10", "20"]}
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

    it("sets valid to false if updated form has an invalid value", () => {

        const state = mockModelOptionsState({
            valid: true,
            options: {"n1": 200, "multiselect": ["30", "40"]}
        });

        mutations.ModelOptionsFetched(state, {payload: newForm});
        expect(state.valid).toBe(false);
        expect(state.optionsFormMeta).toEqual({
            "controlSections":
                [
                    {
                        "controlGroups":
                            [
                                {
                                    "controls":
                                        [
                                            {
                                                "name": "n1",
                                                "required": true,
                                                "type": "number",
                                                "value": 200
                                            },
                                            {
                                                "name": "new_control",
                                                "required": true,
                                                "type": "number"
                                            },
                                            {
                                                "name": "select",
                                                "required": false,
                                                "type": "select",
                                                "options": [
                                                    {id: "10", label: "10"},
                                                    {id: "20", label: "20"}
                                                ]
                                            },
                                            {
                                                "name": "children",
                                                "required": false,
                                                "type": "select",
                                                "options": [
                                                    {
                                                        id: "opt1",
                                                        label: "l1",
                                                        children: [
                                                            {id: "opt2", label: "l2"}
                                                        ]
                                                    }
                                                ]
                                            },
                                            {
                                                "name": "multiselect",
                                                "required": true,
                                                "type": "multiselect",
                                                "options": [
                                                    {id: "10", label: "10"},
                                                    {id: "20", label: "20"}
                                                ],
                                                "value": ["30", "40"]
                                            }
                                        ], "label": "g1"
                                }, {
                                "controls":
                                    [
                                        {
                                            "name": "i1",
                                            "required": true,
                                            "type": "number"
                                        }
                                    ],
                                "label": "new_group"
                            }
                            ],
                        "label": "general"
                    }, {
                    "controlGroups":
                        [
                            {
                                "controls": [],
                                "label": "g2"
                            }
                        ],
                    "label": "survey"
                }]
        })
    });

    it("sets valid to false if options are valid but the state is not valid to begin with", () => {

        const state = mockModelOptionsState({
            valid: false,
            options: testOptions
        });

        mutations.ModelOptionsFetched(state, {payload: newForm});
        expect(state.valid).toBe(false);
    });

    it("sets fetching to true", () => {
        const state = mockModelOptionsState();
        mutations.FetchingModelOptions(state);
        expect(state.fetching).toBe(true);
    });

    const testOptions = {
        n1: 20,
        n2: 10,
        select: "20",
        children: "opt2",
    }

    const newForm: DynamicFormMeta = {
        controlSections: [
            {
                label: "general",
                controlGroups: [
                    {
                        label: "g1",
                        controls: [
                            {...mockControl, name: "n1", value: 2},
                            {...mockControl, name: "new_control"},
                            {...mockSelectControl, name: "select"},
                            {...mockChildrenSelect, name: "children"},
                            {...mockMultiSelectControl, name: "multiselect", value: ["10", "20"]}
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
