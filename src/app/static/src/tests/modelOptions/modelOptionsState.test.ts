import {localStorageManager} from "../../app/localStorageManager";

localStorageManager.saveState({
    modelOptions: {
        options: "TEST"
    },
    surveyAndProgram: {}
} as any);

import {modelOptions, ModelOptionsState} from "../../app/store/modelOptions/modelOptions";

it("loads initial state from local storage", () => {
    const state = modelOptions.state as ModelOptionsState;
    expect(state.options).toBe("TEST");
});
