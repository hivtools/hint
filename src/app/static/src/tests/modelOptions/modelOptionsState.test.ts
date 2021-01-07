import {localStorageManager} from "../../app/localStorageManager";

declare const currentUser: string; // set in jest config, or on the index page when run for real
localStorage.setItem("user", currentUser);
localStorageManager.saveState({
    modelOptions: {
        options: "TEST"
    },
    surveyAndProgram: {},
    baseline: {}
} as any);

import {modelOptions, ModelOptionsState, modelOptionsGetters} from "../../app/store/modelOptions/modelOptions";

it("loads initial state from local storage", () => {
    const state = modelOptions.state as ModelOptionsState;
    expect(state.options).toBe("TEST");
});

it("it has changes if state has changes flag", () => {
    const initialState = modelOptions.state as ModelOptionsState;
    expect(modelOptionsGetters.hasChanges(initialState)).toBe(false);

    initialState.changes = true;
    expect(modelOptionsGetters.hasChanges(initialState)).toBe(true);
});
