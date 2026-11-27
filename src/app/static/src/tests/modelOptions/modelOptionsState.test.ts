const existingState = {
    modelOptions: {
        options: "TEST"
    },
    surveyAndProgram: {},
    baseline: {}
} as any;

import {modelOptions, modelOptionsGetters, type ModelOptionsState} from "../../app/store/modelOptions/modelOptions";

it("loads initial state from existingState", () => {
    const state = modelOptions(existingState).state as ModelOptionsState;
    expect(state.options).toBe("TEST");
});

it("has changes if state has changes flag", () => {
    const initialState = modelOptions(existingState).state as ModelOptionsState;
    expect(modelOptionsGetters.hasChanges(initialState)).toBe(false);

    initialState.changes = true;
    expect(modelOptionsGetters.hasChanges(initialState)).toBe(true);
});
