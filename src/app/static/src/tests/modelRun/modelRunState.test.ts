import {localStorageManager} from "../../app/localStorageManager";

declare const currentUser: string; // set in jest config, or on the index page when run for real
localStorage.setItem("user", currentUser);
localStorageManager.saveState({
    modelRun: {
        modelRunId: "1234",
        status: {success: true},
        errors: [],
        statusPollId: -1,
        ready: true
    },
    surveyAndProgram: {},
    baseline: {}
} as any);

import {modelRun, ModelRunState} from "../../app/store/modelRun/modelRun";

it("loads initial state from local storage, but resets ready to false", () => {
    const state = modelRun.state as ModelRunState;
    expect(state.modelRunId).toBe("1234");
    expect(state.status).toStrictEqual({success: true});
    expect(state.ready).toBe(false);
});
