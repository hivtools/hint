import {localStorageManager} from "../../app/localStorageManager";
declare const currentUser: string; // set in jest config, or on the index page when run for real
localStorage.setItem("user", currentUser);
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
